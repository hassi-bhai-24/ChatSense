import React, { useState } from 'react';
import {
  FileText,
  X,
  Sparkles,
  MessageSquareQuote,
  Edit3,
  Check,
  RotateCcw,
  BookOpen,
  ArrowRight,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';
import { SAMPLE_TRANSCRIPTS, SampleTranscript } from '../data/sampleTranscripts';

interface TranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: string;
  context: string;
  onUpdateTranscript: (newTranscript: string, newContext: string, title?: string) => void;
  onSelectLineForDecode: (line: string) => void;
  onTriggerAnalysis: () => void;
}

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({
  isOpen,
  onClose,
  transcript,
  context,
  onUpdateTranscript,
  onSelectLineForDecode,
  onTriggerAnalysis,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(transcript);
  const [editContext, setEditContext] = useState(context);
  const [selectedSample, setSelectedSample] = useState<string>('');

  // Parse lines for interactive viewer
  const rawLines = transcript.split('\n').filter(l => l.trim().length > 0);

  // Calculate quick metrics
  const otherLines = rawLines.filter(l =>
    /other|them|she|he|partner|lead|manager|marcus/i.test(l.split(':')[0] || '')
  );
  const userLines = rawLines.filter(l =>
    /user|me|i /i.test(l.split(':')[0] || '')
  );

  const handleSaveEdit = () => {
    onUpdateTranscript(editText, editContext);
    setIsEditing(false);
  };

  const handleLoadSample = (sample: SampleTranscript) => {
    setEditText(sample.transcript);
    setEditContext(sample.context);
    onUpdateTranscript(sample.transcript, sample.context, sample.title);
    setSelectedSample(sample.id);
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[520px] bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right"
      aria-label="Active Transcript Panel"
    >
      {/* Drawer Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-rose-400" />
          <h2 className="text-sm font-semibold text-neutral-100">
            Active Chat Transcript
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => {
                setEditText(transcript);
                setEditContext(context);
                setIsEditing(true);
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
              <span>Edit / Paste</span>
            </button>
          ) : (
            <button
              onClick={handleSaveEdit}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Update</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Close transcript"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Sample Scenario Quick Selector */}
        <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1 font-medium text-neutral-300">
              <BookOpen className="w-3.5 h-3.5 text-rose-400" />
              Load Real-World Scenario
            </span>
            <span>{SAMPLE_TRANSCRIPTS.length} presets</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {SAMPLE_TRANSCRIPTS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleLoadSample(sample)}
                className={`p-2 rounded-lg text-left text-xs transition-colors border ${
                  selectedSample === sample.id
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                    : 'bg-neutral-900 border-neutral-800/60 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                <div className="font-medium truncate">{sample.title}</div>
                <div className="text-[11px] text-neutral-500 truncate">{sample.category}</div>
              </button>
            ))}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Relationship Context / Background (Optional)
              </label>
              <input
                type="text"
                value={editContext}
                onChange={(e) => setEditContext(e.target.value)}
                placeholder="e.g., Met on Hinge 2 weeks ago, had 1 date, recent vibe shift..."
                className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Raw Chat Transcript
              </label>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={14}
                placeholder="Paste chat log here...
[10:15 AM] User: Hey! Free this evening?
[12:30 PM] Other: Hey! Super packed today unfortunately!"
                className="w-full p-3 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500/50 leading-relaxed"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Apply Transcript
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80 text-xs text-neutral-400">
              <div>
                <span className="text-[11px] text-neutral-500 block">Total Messages</span>
                <span className="font-mono font-medium text-neutral-200">{rawLines.length}</span>
              </div>
              <div>
                <span className="text-[11px] text-neutral-500 block">User Lines</span>
                <span className="font-mono font-medium text-neutral-200">{userLines.length || '~'}</span>
              </div>
              <div>
                <span className="text-[11px] text-neutral-500 block">Other Lines</span>
                <span className="font-mono font-medium text-neutral-200">{otherLines.length || '~'}</span>
              </div>
            </div>

            {/* Context Note */}
            {context && (
              <div className="p-2.5 rounded-lg bg-neutral-950/40 border border-neutral-800/60 text-xs">
                <span className="text-[11px] text-neutral-500 font-medium block mb-0.5">Background Context:</span>
                <p className="text-neutral-300 leading-relaxed">{context}</p>
              </div>
            )}

            {/* Line by line interactive list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Click any message to decode subtext:</span>
                <span className="text-[11px] text-rose-400/80">Interactive</span>
              </div>

              {rawLines.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No transcript pasted yet. Click "Edit / Paste" or select a sample above.
                </div>
              ) : (
                rawLines.map((line, idx) => {
                  const isUser = /user|me\b/i.test(line.split(':')[0] || '');
                  const isOther = /other|them\b/i.test(line.split(':')[0] || '');

                  return (
                    <div
                      key={idx}
                      onClick={() => onSelectLineForDecode(line)}
                      className={`group p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isUser
                          ? 'bg-neutral-950/90 border-neutral-800 hover:border-neutral-700'
                          : isOther
                          ? 'bg-rose-950/10 border-rose-900/30 hover:border-rose-700/50'
                          : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-neutral-200 break-words leading-relaxed flex-1">
                          {line}
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-rose-400 p-1">
                          <MessageSquareQuote className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 space-y-2">
        <button
          onClick={() => {
            onClose();
            onTriggerAnalysis();
          }}
          disabled={!transcript.trim()}
          className="w-full py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:pointer-events-none text-white shadow-lg shadow-rose-950/40 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate Structured Diagnostic Report</span>
        </button>
      </div>
    </aside>
  );
};
