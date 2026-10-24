import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  Check,
  Sparkles,
  BookOpen,
  Upload,
  AlertCircle,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setTranscript(text);
        setCleanFeedback(`Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB, ${text.split('\n').length.toLocaleString()} lines)`);
        setTimeout(() => setCleanFeedback(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  // Optional tool to filter out WhatsApp/iMessage system clutter
  const handleCleanSystemLines = () => {
    const rawLines = transcript.split('\n');
    const cleaned = rawLines.filter((line) => {
      const lower = line.toLowerCase();
      if (lower.includes('messages and calls are end-to-end encrypted')) return false;
      if (lower.includes('<media omitted>')) return false;
      if (lower.includes('image omitted')) return false;
      if (lower.includes('audio omitted')) return false;
      if (lower.includes('sticker omitted')) return false;
      if (lower.includes('missed voice call') || lower.includes('missed video call')) return false;
      if (lower.includes('joined using this group\'s invite link')) return false;
      return true;
    });

    const removedCount = rawLines.length - cleaned.length;
    setTranscript(cleaned.join('\n'));
    setCleanFeedback(`Filtered out ${removedCount} media/system notice lines`);
    setTimeout(() => setCleanFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
              }}
            />
            <div className="flex flex-col items-center justify-center space-y-1">
              <Upload className="w-5 h-5 text-neutral-400" />
              <div className="font-medium text-neutral-200">
                Click or drag & drop exported chat file (.txt, .chat, .log)
              </div>
              <p className="text-[11px] text-neutral-500">
                Supports WhatsApp exports, iMessage logs, Slack DMs, Telegram, or Instagram history. Up to 50MB supported.
              </p>
            </div>
          </div>

          {/* Clean notices or file feedback */}
          {cleanFeedback && (
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center justify-between">
              <span>{cleanFeedback}</span>
              <Check className="w-3.5 h-3.5" />
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
              <span className="text-neutral-500 block text-[10px]">Gemini 1M Capacity</span>
              <span className="text-emerald-400 font-semibold">
                {Math.max(1, Math.min(100, Math.round((estimatedTokens / 1_000_000) * 100)))}% used
              </span>
            </div>
          </div>

          {/* Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-neutral-200">
                Raw Chat Transcript
              </label>
              <div className="flex items-center gap-2">
                {linesCount > 10 && (
                  <button
                    onClick={handleCleanSystemLines}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                  >
                    <Filter className="w-3 h-3" />
                    <span>Strip media/system notices</span>
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
              <strong>Zero Server Storage:</strong> Your transcript is processed strictly in-memory during this active browser session. When you end the conversation, all data is permanently destroyed.
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
