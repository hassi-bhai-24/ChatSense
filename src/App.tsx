import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  FileText,
  RotateCcw,
  MessageSquare,
  MessageSquareQuote,
  Shield,
  ShieldCheck,
  Scale,
  Target,
  Copy,
  Check,
  ChevronDown,
  ArrowRight,
  BookOpen,
  PanelLeftClose,
  PanelLeft,
  SlidersHorizontal,
  Settings,
  Paperclip,
  Trash2,
  Plus,
  StopCircle,
  Download,
  Upload,
  Lock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { ChatMessage } from './types/chat';
import { ReportFormatter } from './components/ReportFormatter';
import { SettingsModal, ChatSenseSettings } from './components/SettingsModal';
import { AttachTranscriptModal } from './components/AttachTranscriptModal';
import { SecurityModal } from './components/SecurityModal';
import { LineDecoderModal } from './components/LineDecoderModal';
import { ReplyGeneratorModal } from './components/ReplyGeneratorModal';
import { SAMPLE_TRANSCRIPTS } from './data/sampleTranscripts';

interface SessionItem {
  id: string;
  title: string;
  category: string;
  preview: string;
  transcript: string;
  context: string;
  messages: ChatMessage[];
}

const DEFAULT_SETTINGS: ChatSenseSettings = {
  persona: 'Brutally Honest & Unapologetic',
  relationshipType: 'Dating / Romance',
  customInstructions: 'Call out low interest and power games immediately. Keep strategic replies natural, calibrated, and concise.',
  detailLevel: 'deep',
};

const SUGGESTION_CARDS = [
  {
    title: 'Hot & cold mixed signals',
    subtitle: 'Decode abrupt energy drop after a great first date',
    sampleId: 'dating-hot-cold',
    prompt: 'Here is our recent chat. Why did their energy drop and how should I respond without looking needy?',
  },
  {
    title: 'Workplace passive aggression',
    subtitle: 'Hold conversational frame and assert accountability',
    sampleId: 'workplace-passive-aggressive',
    prompt: 'Analyze this Slack exchange for subtle blame-shifting and draft a professional response that protects my boundary.',
  },
  {
    title: 'Ex reaching out late at night',
    subtitle: 'Gauge if it is nostalgic breadcrumbing or genuine remorse',
    sampleId: 'ex-late-night-ping',
    prompt: 'My ex texted me after midnight out of nowhere. Decode their true motive and tell me what to do.',
  },
  {
    title: 'Close friend pulling away',
    subtitle: 'Evaluate one-sided effort and know when to stop initiating',
    sampleId: 'friend-pulling-away',
    prompt: 'Analyze this conversation to see if this friendship has turned completely one-sided.',
  },
];

const FOLLOWUP_CHIPS = [
  'What did they mean by their last line?',
  'Draft a cool, unbothered reply for me',
  'Draft a playful, teasing reply to test their interest',
  'Are they breadcrumbing me or genuinely busy?',
  'Should I double text or wait for them?',
  'How do I match their response time?',
];

export default function App() {
  // App state
  const [sessions, setSessions] = useState<SessionItem[]>(() => [
    {
      id: 'session-default',
      title: 'Dating: Hot & Cold Signals',
      category: 'Dating',
      preview: 'Met 2 weeks ago, chemistry was high...',
      transcript: SAMPLE_TRANSCRIPTS[0].transcript,
      context: SAMPLE_TRANSCRIPTS[0].context,
      messages: [],
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState('session-default');

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = currentSession?.messages || [];
  const transcript = currentSession?.transcript || '';
  const context = currentSession?.context || '';

  // Input & streaming state
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatusText, setStreamStatusText] = useState('ChatSense is analyzing subtext...');

  // Sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Modals state
  const [settings, setSettings] = useState<ChatSenseSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [decodeModalOpen, setDecodeModalOpen] = useState(false);
  const [selectedLineForDecode, setSelectedLineForDecode] = useState('');
  const [replyModalOpen, setReplyModalOpen] = useState(false);

  // Toast notice for wipe / export
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll during message generation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, streamStatusText]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Update current session helper
  const updateCurrentSession = (updates: Partial<SessionItem>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, ...updates } : s))
    );
  };

  // Create a brand new session
  const handleNewChat = () => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }
    const newId = `session-${Date.now()}`;
    const newSession: SessionItem = {
      id: newId,
      title: 'New Interpersonal Analysis',
      category: 'General',
      preview: 'Paste chat log or ask a question...',
      transcript: '',
      context: '',
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setInput('');
  };

  // Immediate 100% Secure Wipe (Zero Data Retention)
  const handleEndAndWipeConversation = () => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }

    // Clear all client storage
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch {
      // storage clear safeguard
    }

    // Reset memory
    setInput('');
    const newId = `session-${Date.now()}`;
    setSessions([
      {
        id: newId,
        title: 'New Analysis',
        category: 'General',
        preview: 'Fresh confidential session',
        transcript: '',
        context: '',
        messages: [],
      },
    ]);
    setActiveSessionId(newId);

    showToast('Session ended. All transcripts, messages, and memory permanently destroyed.');
  };

  // Helper to trigger streaming chat response
  const triggerChatStream = async (outgoingMessages: Array<{ role: 'user' | 'assistant'; content: string }>) => {
    setIsStreaming(true);
    setStreamStatusText('ChatSense is reading between the lines...');

    const timer1 = setTimeout(() => {
      setStreamStatusText('Evaluating power balance & frame control...');
    }, 1200);
    const timer2 = setTimeout(() => {
      setStreamStatusText('Calibrating behavioral playbook...');
    }, 2400);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const assistantMsgId = `asst-${Date.now()}`;
    const newAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
      isInitialDiagnostic: outgoingMessages.length === 1,
    };

    const sessionMessagesWithAssistant = [...(currentSession?.messages || []), newAssistantMsg];
    updateCurrentSession({ messages: sessionMessagesWithAssistant });

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: outgoingMessages,
          transcript,
          context,
          settings,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream available.');

      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice(5).trim();

          if (dataStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) {
              accumulatedText += parsed.text;
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === activeSessionId
                    ? {
                        ...s,
                        messages: s.messages.map((m) =>
                          m.id === assistantMsgId
                            ? { ...m, content: accumulatedText }
                            : m
                        ),
                      }
                    : s
                )
              );
            } else if (parsed.error) {
              accumulatedText += `\n\n*(Error: ${parsed.error})*`;
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === activeSessionId
                    ? {
                        ...s,
                        messages: s.messages.map((m) =>
                          m.id === assistantMsgId
                            ? { ...m, content: accumulatedText }
                            : m
                        ),
                      }
                    : s
                )
              );
            }
          } catch {
            // Buffer parsing
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        const errMsg = err instanceof Error ? err.message : 'Connection failed';
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content:
                            m.content ||
                            `⚠️ Analysis failed: ${errMsg}. Please verify that GEMINI_API_KEY is active in the Secrets panel.`,
                        }
                      : m
                  ),
                }
              : s
          )
        );
      }
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsStreaming(false);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, isStreaming: false } : m
                ),
              }
            : s
        )
      );
      abortControllerRef.current = null;
    }
  };

  // Send message
  const handleSendMessage = (overrideText?: string) => {
    const textToSend = (overrideText ?? input).trim();
    if (!textToSend || isStreaming) return;

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Auto-detect if user pasted a multi-line transcript directly into chat
    const looksLikeTranscript =
      textToSend.includes('\n') &&
      (/user:|other:|me:|them:|\[\d+:\d+/i.test(textToSend) || textToSend.length > 250);

    if (looksLikeTranscript && !transcript.trim()) {
      updateCurrentSession({
        transcript: textToSend,
        title: textToSend.slice(0, 32).trim() + '...',
      });
    }

    const newUserMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, newUserMsg];
    updateCurrentSession({
      messages: updatedMessages,
      title:
        messages.length === 0
          ? textToSend.slice(0, 30) + '...'
          : currentSession?.title,
    });

    const outgoing = updatedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    triggerChatStream(outgoing);
  };

  // Direct file ingestion
  const handleDirectFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        updateCurrentSession({
          transcript: text,
          title: file.name.replace(/\.[^/.]+$/, ''),
        });
        showToast(`Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB, ${text.split('\n').length.toLocaleString()} lines)`);
      }
    };
    reader.readAsText(file);
  };

  // Export analysis report
  const handleExportReport = () => {
    if (messages.length === 0) {
      showToast('No analysis messages to export yet.');
      return;
    }

    let reportMarkdown = `# ChatSense Interpersonal Diagnostic Report\n\nGenerated: ${new Date().toLocaleString()}\nRelationship Category: ${settings.relationshipType}\n\n`;
    if (context) {
      reportMarkdown += `### Context\n${context}\n\n`;
    }

    messages.forEach((m) => {
      reportMarkdown += `---\n### ${m.role === 'user' ? 'User Question' : 'ChatSense Analysis'} (${m.timestamp})\n\n${m.content}\n\n`;
    });

    const blob = new Blob([reportMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ChatSense-Report-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Report downloaded as Markdown file.');
  };

  const handleSelectSuggestion = (card: (typeof SUGGESTION_CARDS)[0]) => {
    const sample = SAMPLE_TRANSCRIPTS.find((s) => s.id === card.sampleId);
    if (!sample) return;

    updateCurrentSession({
      transcript: sample.transcript,
      context: sample.context,
      title: sample.title,
    });

    handleSendMessage(card.prompt);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const hasMessages = messages.length > 0;
  const transcriptLineCount = transcript
    .split('\n')
    .filter((l) => l.trim().length > 0).length;
  const estimatedTokens = Math.ceil(transcript.length / 4);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-3 px-4 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-100 shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for Direct Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.chat,.log,.csv"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleDirectFileUpload(e.target.files[0]);
          }
        }}
      />

      {/* 1. Left Collapsible Sidebar (ChatGPT / Claude / Gemini Style) */}
      <aside
        className={`${
          sidebarOpen ? 'w-64 sm:w-72' : 'w-0'
        } transition-all duration-300 ease-in-out shrink-0 bg-neutral-900 border-r border-neutral-800/80 flex flex-col z-30 overflow-hidden select-none`}
      >
        {/* Sidebar Header */}
        <div className="p-3 border-b border-neutral-800/80 flex items-center justify-between">
          <button
            onClick={handleNewChat}
            className="flex-1 px-3 py-2 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-colors flex items-center justify-between group"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-rose-400" />
              <span>New Analysis</span>
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">⌘N</span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 ml-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Sessions & Presets list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs">
          {/* Active Conversations */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-[11px] font-medium text-neutral-400">
              Conversations
            </div>
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                  s.id === activeSessionId
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate flex-1">
                  <MessageSquare className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">{s.title || 'Untitled Chat'}</span>
                </div>
                {sessions.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessions((prev) => prev.filter((item) => item.id !== s.id));
                      if (activeSessionId === s.id) {
                        const remaining = sessions.filter((item) => item.id !== s.id);
                        if (remaining[0]) setActiveSessionId(remaining[0].id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 rounded transition-opacity"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Quick Scenario Starter Bank */}
          <div className="space-y-1 pt-2 border-t border-neutral-800/60">
            <div className="px-2 py-1 text-[11px] font-medium text-neutral-400 flex items-center justify-between">
              <span>Quick Scenarios</span>
              <BookOpen className="w-3 h-3 text-rose-400/80" />
            </div>
            {SAMPLE_TRANSCRIPTS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => {
                  const newId = `session-${sample.id}-${Date.now()}`;
                  const newSession: SessionItem = {
                    id: newId,
                    title: sample.title,
                    category: sample.category,
                    preview: sample.scenario,
                    transcript: sample.transcript,
                    context: sample.context,
                    messages: [],
                  };
                  setSessions((prev) => [newSession, ...prev]);
                  setActiveSessionId(newId);
                }}
                className="w-full text-left p-2 rounded-xl text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200 transition-colors"
              >
                <div className="truncate font-medium text-neutral-300">
                  {sample.title}
                </div>
                <div className="text-[10px] text-neutral-500 truncate">
                  {sample.category}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Footer (Security, Settings & Wipe) */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/40 space-y-1.5">
          <button
            onClick={() => setSecurityModalOpen(true)}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-neutral-800 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Trace Privacy</span>
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">100% Ephemeral</span>
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-rose-400" />
              <span>Settings & Persona</span>
            </div>
            <span className="text-[10px] text-neutral-500 truncate max-w-[80px]">
              {settings.persona.split(' ')[0]}
            </span>
          </button>

          <button
            onClick={handleEndAndWipeConversation}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-rose-950/30 text-rose-400/90 hover:text-rose-300 transition-colors flex items-center gap-2 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>End & Wipe Session</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-neutral-950 relative">
        {/* Sleek Top Navigation Bar */}
        <header className="h-14 border-b border-neutral-800/80 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 bg-neutral-950/70 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-colors"
                title="Open sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            {/* Model Badge */}
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white flex items-center gap-1.5 text-sm">
                <span className="w-5 h-5 rounded-md bg-rose-600 flex items-center justify-center text-white text-[10px] font-black">
                  CS
                </span>
                ChatSense
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs text-neutral-400 font-medium hidden sm:inline">
                Psychological Subtext & Strategy
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            {/* Security Pill */}
            <button
              onClick={() => setSecurityModalOpen(true)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5"
              title="Click for zero data retention details"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Zero-Trace Ephemeral</span>
            </button>

            {/* Active Transcript Indicator Button */}
            <button
              onClick={() => setAttachModalOpen(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                transcript.trim()
                  ? 'bg-rose-950/30 border-rose-800/60 text-rose-300 hover:bg-rose-900/40'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5 text-rose-400" />
              <span>
                {transcript.trim()
                  ? `Transcript (${transcriptLineCount.toLocaleString()} lines · ~${estimatedTokens.toLocaleString()} tokens)`
                  : 'Attach Chat (Up to 50MB)'}
              </span>
            </button>

            {/* Export Report (if conversation active) */}
            {hasMessages && (
              <button
                onClick={handleExportReport}
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-colors"
                title="Download Analysis Report (.md)"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {/* Wipe Button in Top Bar */}
            <button
              onClick={handleEndAndWipeConversation}
              className="p-2 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 border border-neutral-800 transition-colors"
              title="End conversation & wipe all data immediately"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Settings Trigger */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-colors"
              title="Settings & Persona"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 3. Main Center Area (ChatGPT / Claude / Gemini Landing vs Conversation) */}
        <main className="flex-1 overflow-y-auto relative flex flex-col justify-between">
          {!hasMessages ? (
            /* Minimal Distraction-Free Landing (ChatGPT / Claude Style) */
            <div className="max-w-2xl w-full mx-auto p-4 sm:p-6 my-auto flex flex-col items-center justify-center space-y-6">
              {/* Center Hero Icon & Headline */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-rose-400 shadow-xl shadow-rose-950/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  What conversation are we decoding today?
                </h1>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
                  Paste a chat transcript of any length, drop an exported chat file, or choose a dilemma below.
                </p>
              </div>

              {/* Centered Large Prompt Box */}
              <div className="w-full bg-neutral-900/90 border border-neutral-800 focus-within:border-neutral-700 rounded-2xl p-3 shadow-2xl transition-all">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  placeholder="Paste a chat log directly, or ask a question (e.g. 'Decode why their response time changed')..."
                  className="w-full text-xs sm:text-sm bg-transparent border-0 text-neutral-100 placeholder-neutral-500 focus:outline-none resize-none leading-relaxed p-1"
                />

                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAttachModalOpen(true)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                        transcript.trim()
                          ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Paperclip className="w-3.5 h-3.5 text-rose-400" />
                      <span>
                        {transcript.trim()
                          ? `Transcript Attached (${transcriptLineCount.toLocaleString()} lines)`
                          : 'Attach Transcript / File'}
                      </span>
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="hidden sm:inline-flex px-2 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800 transition-colors items-center gap-1"
                      title="Upload WhatsApp / iMessage / Slack export"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload File</span>
                    </button>

                    <button
                      onClick={() => setSettingsOpen(true)}
                      className="hidden sm:inline-flex px-2.5 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800 transition-colors items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span>{settings.persona}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim()}
                    className="p-2 sm:px-4 sm:py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:pointer-events-none text-white transition-all shadow-md shadow-rose-950/40 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Decode</span>
                  </button>
                </div>
              </div>

              {/* 4 Clean Starter Cards (Claude / ChatGPT prompt suggestions) */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {SUGGESTION_CARDS.map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggestion(card)}
                    className="p-3 rounded-xl bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-left transition-all group cursor-pointer"
                  >
                    <div className="font-semibold text-xs text-neutral-200 group-hover:text-rose-300 transition-colors flex items-center justify-between">
                      <span>{card.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                      {card.subtitle}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Conversational Feed */
            <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
              {messages.map((message) => {
                const isUser = message.role === 'user';

                return (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 sm:gap-4 transition-all duration-300 ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 text-rose-400 flex items-center justify-center shrink-0 mt-1 shadow-md">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 sm:px-5 py-4 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-neutral-800/90 text-neutral-100 border border-neutral-700/60 shadow-md ml-auto'
                          : 'bg-neutral-900/90 text-neutral-200 border border-neutral-800 shadow-lg'
                      }`}
                    >
                      {/* Author Header */}
                      <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-neutral-800/60 text-[11px] text-neutral-400">
                        <span className="font-semibold text-neutral-300">
                          {isUser ? 'You' : 'ChatSense'}
                        </span>
                        <span>{message.timestamp}</span>
                      </div>

                      {/* Content */}
                      {isUser ? (
                        <div className="whitespace-pre-wrap font-sans text-neutral-100 text-xs sm:text-sm">
                          {message.content}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <ReportFormatter
                            content={message.content}
                            onSelectLineForDecode={(line) => {
                              setSelectedLineForDecode(line);
                              setDecodeModalOpen(true);
                            }}
                            onInsertPrompt={(prompt) => {
                              setInput(prompt);
                              textareaRef.current?.focus();
                            }}
                          />

                          {/* Pulsing indicator during stream */}
                          {message.isStreaming && (
                            <span className="inline-block w-2 h-4 bg-rose-400 ml-1 animate-pulse align-middle" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Streaming Status Indicator */}
              {isStreaming && (
                <div className="flex items-center gap-3 py-2.5 px-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 animate-pulse-subtle max-w-md">
                  <div className="w-4 h-4 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin shrink-0" />
                  <span className="font-medium text-neutral-300">{streamStatusText}</span>
                </div>
              )}

              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}

          {/* Bottom Docked Input (When in active chat mode) */}
          {hasMessages && (
            <div className="sticky bottom-0 bg-neutral-950/90 backdrop-blur-lg border-t border-neutral-800/80 px-4 py-3 sm:py-4 z-10">
              <div className="max-w-3xl mx-auto space-y-2">
                {/* Horizontal chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                  <span className="text-[11px] text-neutral-500 font-medium shrink-0 flex items-center gap-1 mr-1">
                    <Sparkles className="w-3 h-3 text-rose-400" />
                    Quick Strategy:
                  </span>
                  {FOLLOWUP_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip)}
                      disabled={isStreaming}
                      className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer text-xs disabled:opacity-50"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Main Input Box */}
                <div className="relative flex items-end gap-2 bg-neutral-900/90 border border-neutral-800 focus-within:border-neutral-700 rounded-2xl p-2 shadow-xl">
                  <button
                    onClick={() => setAttachModalOpen(true)}
                    className="p-2 text-neutral-400 hover:text-rose-400 rounded-xl hover:bg-neutral-800 transition-colors shrink-0"
                    title="Attach or inspect transcript"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={1}
                    placeholder="Ask ChatSense (e.g. 'Decode their last message', 'Draft a playful reply', 'Should I wait to reply?')..."
                    className="w-full max-h-40 p-2 text-xs sm:text-sm bg-transparent border-0 text-neutral-100 placeholder-neutral-500 focus:outline-none resize-none leading-relaxed"
                  />

                  <div className="flex items-center gap-1 shrink-0 pb-1">
                    {isStreaming ? (
                      <button
                        onClick={handleStopGeneration}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                        title="Stop generation"
                      >
                        <StopCircle className="w-4 h-4 text-rose-400" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={!input.trim()}
                        className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:pointer-events-none text-white transition-all shadow-md shadow-rose-950/40 flex items-center gap-1.5 text-xs font-semibold"
                        title="Send message"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Send</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer status & Privacy Guarantee */}
                <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
                  <button
                    onClick={() => setSecurityModalOpen(true)}
                    className="flex items-center gap-1 text-emerald-400/90 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Zero data stored · End session to permanently wipe</span>
                  </button>
                  <button
                    onClick={() => setAttachModalOpen(true)}
                    className="text-neutral-400 hover:text-rose-400 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    {transcript.trim()
                      ? `Transcript active (${transcriptLineCount.toLocaleString()} lines)`
                      : 'Attach chat transcript'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
        transcript={transcript}
        context={context}
        onUpdateTranscript={(newTrans, newCtx) => {
          updateCurrentSession({ transcript: newTrans, context: newCtx });
        }}
      />

      {/* Attach Transcript Modal */}
      <AttachTranscriptModal
        isOpen={attachModalOpen}
        onClose={() => setAttachModalOpen(false)}
        currentTranscript={transcript}
        currentContext={context}
        onSave={(newTrans, newCtx, title) => {
          updateCurrentSession({
            transcript: newTrans,
            context: newCtx,
            title: title || currentSession.title,
          });
        }}
      />

      {/* Security & Zero Retention Modal */}
      <SecurityModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        onEndAndWipeConversation={handleEndAndWipeConversation}
      />

      {/* Line Decoder Modal */}
      <LineDecoderModal
        isOpen={decodeModalOpen}
        onClose={() => setDecodeModalOpen(false)}
        selectedLine={selectedLineForDecode}
        transcript={transcript}
        context={context}
        onAskChatSense={(prompt) => {
          handleSendMessage(prompt);
        }}
      />

      {/* Reply Generator Modal */}
      <ReplyGeneratorModal
        isOpen={replyModalOpen}
        onClose={() => setReplyModalOpen(false)}
        transcript={transcript}
        context={context}
        onAskChatSense={(prompt) => {
          handleSendMessage(prompt);
        }}
      />
    </div>
  );
}
