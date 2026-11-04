// Tests for the server request helpers in server.ts. Run with `npm test`
// (tsx + the Node test runner). No network, no Gemini key, no server boot.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createRateLimiter,
  formatTranscriptContext,
  mapProviderError,
  validateChatBody,
  validateDecodeBody,
  validateDraftBody,
  withTimeout,
} from './server';

describe('formatTranscriptContext', () => {
  it('returns short transcripts unchanged', () => {
    const text = 'line one\nline two\nline three';
    assert.equal(formatTranscriptContext(text), text);
  });

  it('returns empty string for empty or blank input', () => {
    assert.equal(formatTranscriptContext(''), '');
    assert.equal(formatTranscriptContext('   \n  '), '');
  });

  it('returns a transcript exactly at the limit unchanged', () => {
    const text = 'x'.repeat(1_500_000);
    assert.equal(formatTranscriptContext(text), text);
  });

  it('never reports a negative omitted count and never duplicates content for few very long lines', () => {
    // 100 lines x 20,000 chars: the old implementation reported -8,200
    // omitted lines and duplicated the head lines via slice(-8000).
    // Head budget (100k incl. newlines) keeps 4 lines; tail budget (1.3M)
    // keeps 64 lines; omitted = 100 - 4 - 64 = 32.
    const lines = Array.from({ length: 100 }, (_v, i) => `L${i}:`.padEnd(20_000, 'y'));
    const text = lines.join('\n');
    const out = formatTranscriptContext(text);
    assert.match(out, /32 intermediate lines condensed/);
    assert.doesNotMatch(out, /-\d/);
    // The first line appears exactly once (no duplication).
    const firstLine = lines[0];
    const occurrences = out.split(firstLine).length - 1;
    assert.equal(occurrences, 1);
    // Head and tail are both present.
    assert.ok(out.startsWith(lines[0]));
    assert.ok(out.endsWith(lines[99]));
  });

  it('omits the middle for many short lines without duplicating or inventing lines', () => {
    const lines = Array.from({ length: 200_000 }, (_v, i) => `line-${i}`);
    const text = lines.join('\n');
    const out = formatTranscriptContext(text);
    const match = out.match(/([\d,]+) intermediate lines condensed/);
    assert.ok(match, 'expected an omitted-lines note');
    const omitted = Number(match[1].replace(/,/g, ''));
    assert.ok(omitted > 0, 'omitted count must be positive');
    assert.ok(out.startsWith('line-0'));
    assert.ok(out.endsWith('line-199999'));
    // A middle line is omitted entirely, not duplicated.
    assert.ok(!out.includes('\nline-50000\n'));
    // Output stays within the char budget plus the note.
    assert.ok(out.length <= 1_500_000 + 200);
  });

  it('falls back to a plain prefix cut for a single huge line', () => {
    const text = 'z'.repeat(2_000_000);
    const out = formatTranscriptContext(text);
    assert.match(out, /transcript truncated to fit the analysis window/);
    assert.doesNotMatch(out, /intermediate lines condensed/);
    assert.ok(out.startsWith('z'.repeat(100)));
  });
});

describe('validateChatBody', () => {
  const valid = {
    messages: [{ role: 'user', content: 'hello' }],
    transcript: 'short transcript',
  };

  it('accepts a valid body', () => {
    assert.equal(validateChatBody(valid), null);
  });

  it('rejects a missing messages array', () => {
    assert.equal(validateChatBody({}), 'Messages array is required.');
  });

  it('rejects an empty messages array', () => {
    assert.equal(validateChatBody({ messages: [] }), 'Messages must not be empty.');
  });

  it('rejects too many messages', () => {
    const messages = Array.from({ length: 51 }, () => ({ role: 'user', content: 'x' }));
    assert.match(validateChatBody({ messages }) ?? '', /Too many messages/);
  });

  it('rejects a bad role and an oversized message', () => {
    assert.match(
      validateChatBody({ messages: [{ role: 'system', content: 'x' }] }) ?? '',
      /role must be/,
    );
    assert.match(
      validateChatBody({ messages: [{ role: 'user', content: 'x'.repeat(50_001) }] }) ?? '',
      /too long/,
    );
  });

  it('rejects an oversized transcript', () => {
    assert.match(
      validateChatBody({ ...valid, transcript: 'x'.repeat(1_500_001) }) ?? '',
      /too long/,
    );
  });
});

describe('validateDecodeBody / validateDraftBody', () => {
  it('requires a line for decode', () => {
    assert.equal(validateDecodeBody({}), 'Line to decode is required.');
    assert.equal(validateDecodeBody({ line: '  ' }), 'Line to decode is required.');
    assert.equal(validateDecodeBody({ line: 'hello', transcript: 'some chat' }), null);
  });

  it('requires a transcript for decode and draft replies', () => {
    assert.equal(
      validateDecodeBody({ line: 'hello' }),
      'A transcript is required to decode a line. Attach a transcript first.',
    );
    assert.equal(
      validateDecodeBody({ line: 'hello', transcript: '  ' }),
      'A transcript is required to decode a line. Attach a transcript first.',
    );
    assert.match(validateDraftBody({}) ?? '', /transcript is required/);
    assert.equal(validateDraftBody({ transcript: 'some chat' }), null);
  });
});

describe('mapProviderError', () => {
  it('maps a missing key to 503 with a plain message', () => {
    const mapped = mapProviderError(new Error('GEMINI_API_KEY is not configured in the environment.'));
    assert.equal(mapped.status, 503);
    assert.equal(mapped.message, 'The server has no Gemini key configured.');
  });

  it('maps quota errors to 503 temporarily-unavailable', () => {
    const mapped = mapProviderError(new Error('429 RESOURCE_EXHAUSTED quota exceeded'));
    assert.equal(mapped.status, 503);
    assert.match(mapped.message, /temporarily unavailable/);
  });

  it('maps anything else to a generic 500 message without leaking detail', () => {
    const mapped = mapProviderError(new Error('internal detail: host=secret.internal'));
    assert.equal(mapped.status, 500);
    assert.ok(!mapped.message.includes('secret.internal'));
  });
});

describe('withTimeout', () => {
  it('resolves fast promises unchanged', async () => {
    assert.equal(await withTimeout(Promise.resolve(42), 1000, 'test'), 42);
  });

  it('rejects when the promise takes too long', async () => {
    await assert.rejects(
      withTimeout(new Promise((resolve) => setTimeout(resolve, 500)), 50, 'Gemini test'),
      /timed out/,
    );
  });
});

describe('createRateLimiter', () => {
  it('allows up to the limit, then returns 429 with Retry-After', () => {
    const limiter = createRateLimiter(3, 60_000);
    const req = { ip: '1.2.3.4', path: '/api/chat/stream' } as never;
    let status = 0;
    let body: unknown = null;
    const res = {
      setHeader: () => undefined,
      status: (code: number) => {
        status = code;
        return res;
      },
      json: (value: unknown) => {
        body = value;
        return res;
      },
    } as never;
    let nextCalls = 0;
    const next = () => {
      nextCalls += 1;
    };
    for (let i = 0; i < 3; i++) limiter(req, res, next);
    assert.equal(nextCalls, 3);
    limiter(req, res, next);
    assert.equal(nextCalls, 3);
    assert.equal(status, 429);
    assert.match((body as { error: string }).error, /Too many requests/);
  });
});
