import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  FileText,
  Check,
  BookOpen,
  Upload,
  ShieldCheck,
  Trash2,
  Filter,
} from 'lucide-react';
import { SAMPLE_TRANSCRIPTS, SampleTranscript } from '../data/sampleTranscripts';

interface AttachTranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTranscript: string;
  currentContext: string;
  onSave: (transcript: string, context: string, title?: string) => void;
}

// Phrases that mark a line as a chat-export system notice. Matching is
// anchored: the line's message content (after stripping an export timestamp
// and speaker label) must EQUAL the phrase, so a genuine message that merely
// quotes a phrase is never removed.
const SYSTEM_NOTICE_PHRASES = [
  '<media omitted>',
  'image omitted',
  'audio omitted',
  'video omitted',
  'sticker omitted',
  'gif omitted',
  'document omitted',
  'missed voice call',
  'missed video call',
  "joined using this group's invite link",
  'you deleted this message',
  'this message was deleted',
  'message deleted',
];

function isSystemNoticeLine(line: string): boolean {
  let content = line.trim().toLowerCase();
  // Strip an export timestamp prefix: "[10:15 AM] " or "12/01/2026, 10:15 - ".
  content = content.replace(/^\[[^\]]*\]\s*/, '');
  content = content.replace(/^\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}\s*(?:am|pm)?\s*-\s*/, '');
  // Strip a speaker label ("Name: ") so only the message content is matched.
  content = content.replace(/^[^:\n]{1,40}:\s*/, '');
  content = content.replace(/[.。]+$/, '');
  if (!content) return false;
  if (content.startsWith('messages and calls are end-to-end encrypted')) return true;
  return SYSTEM_NOTICE_PHRASES.includes(content);
}

export const AttachTranscriptModal: React.FC<AttachTranscriptModalProps> = ({
  isOpen,
  onClose,
  currentTranscript,
  currentContext,
  onSave,
}) => {
  const [transcript, setTranscript] = useState(currentTranscript);
  const [context, setContext] = useState(currentContext);
  const [isDragging, setIsDragging] = useState(false);
  const [cleanFeedback, setCleanFeedback] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pendingRemovals, setPendingRemovals] = useState<string[] | null>(null);
  const [preCleanTranscript, setPreCleanTranscript] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape closes the modal, and opening it moves focus to the panel.
  useEffect(() => {
    if (!isOpen) return;
    panelRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, panelRef]);

  // Sync the editable copies whenever the modal opens, so reopening after the
  // transcript changed elsewhere never shows (or saves) stale values.
  useEffect(() => {
    if (isOpen) {
      setTranscript(currentTranscript);
      setContext(currentContext);
      setCleanFeedback(null);
      setFileError(null);
      setPendingRemovals(null);
      setPreCleanTranscript(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Real-time metrics
  const linesCount = transcript.split('\n').filter((l) => l.trim().length > 0).length;
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const charCount = transcript.length;
  const estimatedTokens = Math.ceil(charCount / 4);

  const handleApply = () => {
    onSave(transcript, context);
    onClose();
  };

  const handleSelectSample = (sample: SampleTranscript) => {
    setTranscript(sample.transcript);
    setContext(sample.context);
    onSave(sample.transcript, sample.context, sample.title);
    onClose();
  };

  // Transcript uploads are capped at 2 MB: the server accepts 2 MB bodies
  // and truncates transcripts at 1.5M characters, so a larger file could
  // never be analysed in full.
  const readTranscriptFile = (
    file: File,
    onLoad: (text: string) => void,
    onError: (message: string) => void,
  ) => {
    if (file.size > 2 * 1024 * 1024) {
      onError(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Files up to 2 MB are supported.`,
      );
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => {
      onError('Could not read that file. Please try a different file.');
    };
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string' || !text) {
        onError('That file did not contain readable text.');
        return;
      }
      onLoad(text);
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    readTranscriptFile(
      file,
      (text) => {
        setFileError(null);
        setTranscript(text);
        setCleanFeedback(`Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB, ${text.split('\n').length.toLocaleString()} lines)`);
        setTimeout(() => setCleanFeedback(null), 4000);
      },
      (message) => {
        setFileError(message);
      },
    );
  };

  // Filter out WhatsApp/iMessage system clutter. Shows the exact lines that
  // would be removed first; nothing is deleted until confirmed, and the
  // pre-clean text can be restored with Undo until the modal is applied.
  const handlePreviewClean = () => {
    const removed = transcript.split('\n').filter(isSystemNoticeLine);
    if (removed.length === 0) {
      setCleanFeedback('No system notice lines found.');
      setTimeout(() => setCleanFeedback(null), 3000);
      return;
    }
    setPendingRemovals(removed);
  };

  const handleConfirmClean = () => {
    const count = pendingRemovals?.length ?? 0;
    setPreCleanTranscript(transcript);
    setTranscript(transcript.split('\n').filter((line) => !isSystemNoticeLine(line)).join('\n'));
    setPendingRemovals(null);
    setCleanFeedback(`Removed ${count} system notice line(s). Undo is available until you apply.`);
    setTimeout(() => setCleanFeedback(null), 4000);
  };

  const handleUndoClean = () => {
    if (preCleanTranscript === null) return;
    setTranscript(preCleanTranscript);
    setPreCleanTranscript(null);
    setCleanFeedback('Restored the text from before cleaning.');
    setTimeout(() => setCleanFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Attach transcript" className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-neutral-100">
              Attach & Analyze Chat Transcript
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Quick presets row */}
          <div>
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                Quick-load sample dilemma:
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_TRANSCRIPTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSample(s)}
                  className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/80 text-left transition-all"
                >
                  <div className="font-medium text-neutral-200 truncate">{s.title}</div>
                  <div className="text-[11px] text-neutral-500">{s.category}</div>
                </button>
              ))}
            </div>
          </div>

          {/* File Drag-and-Drop or Upload Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-rose-500 bg-rose-950/20'
                : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700 hover:bg-neutral-950/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.chat,.log,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0]);
                }
                // Reset so the same file can be selected again.
                e.target.value = '';
              }}
            />
            <div className="flex flex-col items-center justify-center space-y-1">
              <Upload className="w-5 h-5 text-neutral-400" />
              <div className="font-medium text-neutral-200">
                Click or drag & drop exported chat file (.txt, .chat, .log)
              </div>
              <p className="text-[11px] text-neutral-500">
                Supports WhatsApp exports, iMessage logs, Slack DMs, Telegram, or Instagram history. Up to 2 MB supported.
              </p>
            </div>
          </div>

          {/* File error feedback */}
          {fileError && (
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
              <span>{fileError}</span>
            </div>
          )}

          {/* Clean notices or file feedback */}
          {cleanFeedback && (
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center justify-between">
              <span>{cleanFeedback}</span>
              <Check className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Preview of lines the clean filter would remove */}
          {pendingRemovals && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 space-y-2">
              <div className="text-[12px] font-semibold text-amber-200">
                Remove {pendingRemovals.length} system notice line(s)?
              </div>
              <div className="max-h-32 overflow-y-auto font-mono text-[11px] text-neutral-300 space-y-0.5">
                {pendingRemovals.slice(0, 10).map((l, i) => (
                  <div key={i} className="truncate">{l}</div>
                ))}
                {pendingRemovals.length > 10 && (
                  <div>...and {pendingRemovals.length - 10} more</div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmClean}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-medium hover:bg-amber-500"
                >
                  Remove lines
                </button>
                <button
                  onClick={() => setPendingRemovals(null)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-[11px] hover:bg-neutral-700"
                >
                  Keep all
                </button>
              </div>
            </div>
          )}

          {/* Live Metrics strip */}
          <div className="grid grid-cols-4 gap-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 font-mono text-[11px]">
            <div>
              <span className="text-neutral-500 block text-[10px]">Lines</span>
              <span className="text-neutral-200 font-semibold">{linesCount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px]">Words</span>
              <span className="text-neutral-200 font-semibold">{wordCount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px]">Est. Tokens</span>
              <span className="text-neutral-200 font-semibold">~{estimatedTokens.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px]">Capacity (transcript only)</span>
              <span className="text-emerald-400 font-semibold">
                {estimatedTokens === 0
                  ? 0
                  : Math.min(100, Math.round((estimatedTokens / 1_000_000) * 100))}% used
              </span>
            </div>
          </div>

          <p className="text-[11px] text-neutral-500">
            Estimate covers the transcript alone; the analysis prompt and conversation history use additional context.
          </p>

          {/* Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-neutral-200">
                Raw Chat Transcript
              </label>
              <div className="flex items-center gap-2">
                {linesCount > 10 && (
                  <button
                    onClick={handlePreviewClean}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                  >
                    <Filter className="w-3 h-3" />
                    <span>Strip media/system notices</span>
                  </button>
                )}
                {preCleanTranscript !== null && (
                  <button
                    onClick={handleUndoClean}
                    className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors"
                  >
                    <span>Undo clean</span>
                  </button>
                )}
                {transcript && (
                  <button
                    onClick={() => setTranscript('')}
                    className="text-[11px] text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={9}
              placeholder="Paste entire chat log here...
[2:15 PM] User: Hey! Great seeing you last night :)
[8:40 PM] Other: Heyyy sorry super slammed today!! Was fun! Hope you have a good week!"
              className="w-full p-3 font-mono text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500/50 leading-relaxed"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-200 mb-1">
              Background Context / Relationship Dynamics (Optional)
            </label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. Went on one date Friday. Chemistry was high. Text energy dropped abruptly afterwards."
              className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500/50"
            />
          </div>

          <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/60 flex items-start gap-2 text-[11px] text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>How your transcript is handled:</strong> Nothing is stored in this app's database or browser storage. When you analyse it, the transcript is sent to Google's Gemini API and is subject to Google's retention. Ending the session clears this app's in-memory copy only.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div className="text-[11px] text-neutral-400">
            {transcript ? `${linesCount.toLocaleString()} lines ready` : 'No transcript loaded'}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-950/40 transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Attach & Ingest</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
