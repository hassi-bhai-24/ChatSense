import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const CHATSENSE_SYSTEM_INSTRUCTION = `
[ROLE & IDENTITY]
You are "ChatSense," an elite interpersonal analyst, psychological subtext decoder, and relationship communication strategist. Your objective is to ingest raw chat transcripts, decode how the other person feels about the user, analyze relationship dynamics, and provide actionable advice on how the user should behave and respond.

[WORKFLOW INSTRUCTIONS]
1. INGESTION: The user will provide a raw chat log. Treat this as a continuous transcript between "User" and "Other Person".
2. INITIAL ANALYSIS: When asked to analyze a transcript for the first time, immediately generate the exact structured diagnostic report outlined below.
3. INTERACTIVE COACHING: Enter continuous conversational mode. Answer follow-up questions, decode specific lines, and draft text replies based on the chat history.

---

### [INITIAL ANALYSIS STRUCTURE]
When providing the initial report, you MUST structure it clearly using markdown headers and lists with this exact format:

# 🎯 1. Emotional Diagnostic & Feelings
- **Overall Interest Level**: [Low | Moderate | High | Mixed / Hot-and-Cold]
- **Core Emotional Stance**: State clearly how they truly feel about the user (e.g., intrigued, overwhelmed, comfortable, emotionally distant, testing boundaries, cautious, opportunistic).
- **Evidence from Chat**: Cite 2–3 specific verbatim messages or behavioral patterns from the transcript that decisively reveal this stance, explaining the underlying psychology for each.

# ⚖️ 2. Power Dynamics & Subtext
- **Effort Balance**: Quantitative & qualitative comparison: who initiates more, who sends longer messages, word counts, and response-time dynamics (who holds the frame and conversational leverage).
- **Subtext & Unspoken Vibe**: What they are communicating *between the lines* (e.g., sarcasm masking attraction, polite brush-off disguised as friendliness, conversational breadcrumbing, validation-seeking, or dynamic banter).
- **Red & Green Flags**:
  - 🚩 **Red Flags / Warnings**: Specific signals of concern, avoidance, or boundary violation.
  - 🟢 **Green Flags / Strengths**: Genuine points of warmth, reciprocity, or vulnerability.

# 🛡️ 3. Behavioral Playbook (How You Should Behave)
- **Strategic Mindset**: The exact psychological posture the user should immediately adopt (e.g., "Pull back and match their energy," "Hold frame and refuse to over-explain," "Keep it crisp, light, and self-amused").
- **Key Rules**:
  - **3 Things You MUST Do**:
    1. ...
    2. ...
    3. ...
  - **3 Things You MUST NOT Do**:
    1. ...
    2. ...
    3. ...
- **Recommended Next Move**: The single best next tactical action. Provide 3 calibrated sample reply scripts to send next:
  - 🎭 **Option A (Playful / Teasing)**: "[Exact script]" *(Why it works: ...)*
  - 🎯 **Option B (Direct / Boundary-Setting)**: "[Exact script]" *(Why it works: ...)*
  - 🧊 **Option C (Cool / Unbothered / High-Value)**: "[Exact script]" *(Why it works: ...)*

---

[INTERACTIVE CHAT RULES FOR FOLLOW-UPS]
When the user asks follow-up questions:
- Ground all answers rigorously in the context of the pasted chat transcript.
- Be brutally honest about emotional reality; NEVER give false hope or sugarcoat disinterest, breadcrumbing, or manipulative behavior. If they are not interested, say it plainly and explain how to exit with dignity.
- When drafting responses, always explain *why* the script works psychologically (framing, tension, investment dynamics).
- If asked "What did they mean by [X]?", break down 2–3 possible interpretations ranked by probability (e.g., "1. Most Probable (70%): ... 2. Alternative (20%): ... 3. Low Probability (10%): ...").
- Adopt an articulate, sharp, empathetic yet unapologetically candid advisory tone—like a premier executive relationship coach and behavioral psychologist sitting right beside the user.
`;

// Helper to format chat history for Gemini API
function formatHistory(history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>) {
  return history.map(item => ({
    role: item.role === 'user' ? 'user' : 'model',
    parts: item.parts.map(p => ({ text: p.text })),
  }));
}

// 1. SSE Stream for Chat & Analysis
app.post('/api/chat/stream', async (req, res) => {
  const { messages, transcript, context, settings } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Messages array is required.' });
    return;
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    const ai = getAiClient();

    // Prepare system instruction with transcript context prepended
    let enrichedSystemInstruction = CHATSENSE_SYSTEM_INSTRUCTION;

    if (settings) {
      if (settings.persona) {
        enrichedSystemInstruction += `\n[COACHING PERSONA & TONE MODIFIER]:\nAdopt this specific tone: ${settings.persona}.`;
      }
      if (settings.relationshipType) {
        enrichedSystemInstruction += `\n[RELATIONSHIP TYPE]: ${settings.relationshipType}`;
      }
      if (settings.customInstructions && settings.customInstructions.trim()) {
        enrichedSystemInstruction += `\n[USER CUSTOM INSTRUCTIONS]:\n${settings.customInstructions.trim()}`;
      }
      if (settings.detailLevel === 'concise') {
        enrichedSystemInstruction += `\n[OUTPUT PREFERENCE]: Deliver razor-sharp, concise bullet points and brief tactical scripts without filler.`;
      }
    }

    if (transcript && transcript.trim()) {
      enrichedSystemInstruction += `\n\n[ACTIVE TRANSCRIPT IN CONTEXT]:\n"""\n${transcript.trim()}\n"""\n`;
    }
    if (context && context.trim()) {
      enrichedSystemInstruction += `\n[RELATIONSHIP CONTEXT / USER NOTES]:\n${context.trim()}\n`;
    }

    // Convert client messages to Gemini contents format
    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content || '' }],
    }));

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: enrichedSystemInstruction,
        temperature: 0.7,
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
        // @ts-ignore
        if (typeof res.flush === 'function') res.flush();
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error during generation';
    console.error('ChatSense Stream Error:', errorMessage);
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// 2. Specialized Line Decoder (Ranked 3 interpretations by probability)
app.post('/api/decode-line', async (req, res) => {
  const { line, transcript, context } = req.body;

  if (!line || !line.trim()) {
    res.status(400).json({ error: 'Line to decode is required.' });
    return;
  }

  try {
    const ai = getAiClient();
    const prompt = `
Decode this specific message from the chat transcript:
"${line}"

Full Transcript Context:
"""
${transcript || 'No surrounding transcript provided.'}
"""

Relationship Context: ${context || 'General interpersonal chat'}

Break down 2 to 3 distinct possible interpretations ranked by likelihood (Most Probable, Alternative, Low Probability). For each:
1. Probability %
2. Emotional subtext & underlying motive
3. Recommended reaction / posture
Provide a concise psychological breakdown.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: CHATSENSE_SYSTEM_INSTRUCTION,
        temperature: 0.6,
      },
    });

    res.json({ result: response.text });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Error decoding line';
    res.status(500).json({ error: errorMessage });
  }
});

// 3. Specialized Reply Generator (Playful, Direct, Cool/Unbothered)
app.post('/api/draft-replies', async (req, res) => {
  const { transcript, goal, context } = req.body;

  try {
    const ai = getAiClient();
    const prompt = `
Based on this chat transcript:
"""
${transcript || ''}
"""
Relationship Context: ${context || 'Interpersonal chat'}
User Goal: ${goal || 'Send an effective response that recalibrates interest and maintains high frame'}

Generate 3 calibrated reply options:
1. 🎭 Option A: Playful / Banter / Teasing
2. 🎯 Option B: Direct / Assertive / Boundary-Setting
3. 🧊 Option C: Cool / Unbothered / High-Value Minimalist

For each script:
- Verbatim text to copy-paste
- Psychological rationale: Why it works, what power dynamic it triggers, and expected reaction
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: CHATSENSE_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    res.json({ result: response.text });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Error drafting replies';
    res.status(500).json({ error: errorMessage });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ChatSense server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
