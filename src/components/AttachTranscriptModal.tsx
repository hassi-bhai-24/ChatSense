import React, { useState } from 'react';
import { X, FileText, Check, Sparkles, BookOpen } from 'lucide-react';
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

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-neutral-100">
              Attach Chat Transcript
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
                Or load a pre-configured scenario:
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

          <div>
            <label className="block font-semibold text-neutral-200 mb-1">
              Raw Chat Transcript
            </label>
            <p className="text-[11px] text-neutral-400 mb-2">
              Paste lines from iMessage, WhatsApp, Slack, Tinder, Hinge, or Instagram.
            </p>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={8}
              placeholder="Paste chat transcript here...
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
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end gap-2.5">
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
            <span>Attach to Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
