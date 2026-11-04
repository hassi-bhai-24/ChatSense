import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Copy, Check, MessageSquare } from 'lucide-react';

interface ReplyGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: string;
  context: string;
  onAskChatSense: (prompt: string) => void;
}

const COMMON_GOALS = [
  'Match their low energy without being petty',
  'Playful banter to reignite spark & test investment',
  'Set a firm boundary on inconsistent / late-night texting',
  'Clean, unbothered sign-off (hold high frame)',
  'Directly ask for clarity without sounding needy',
];

export const ReplyGeneratorModal: React.FC<ReplyGeneratorModalProps> = ({
  isOpen,
  onClose,
  transcript,
  context,
  onAskChatSense,
}) => {
  const [goal, setGoal] = useState(COMMON_GOALS[0]);
  const [customGoal, setCustomGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  // Reopening clears the previous result, so a stale result is never shown.
  // Closing aborts any in-flight request via the effect cleanup.
  useEffect(() => {
    if (!isOpen) return;
    setResult(null);
    setError(null);
    setCopiedScript(null);
    return () => {
      abortRef.current?.abort();
    };
  }, [isOpen]);

  const activeGoal = customGoal.trim() || goal;

  const handleGenerate = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/draft-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          context,
          goal: activeGoal,
        }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to draft replies.');
      }
      setResult(data.result);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Error drafting replies');
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  };

  // Copying can fail on non-secure origins or when permission is denied;
  // never let it throw inside a click handler.
  const copyText = async (text: string): Promise<boolean> => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return false;
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const handleCopy = async (text: string) => {
    const ok = await copyText(text);
    if (ok) {
      setCopiedScript(text);
      setTimeout(() => setCopiedScript(null), 2000);
    } else {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Response strategist and script generator" className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-neutral-100">
              Response Strategist & Script Generator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Select Your Communication Objective
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_GOALS.map((g, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setGoal(g);
                    setCustomGoal('');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left border ${
                    activeGoal === g
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="Or write custom goal (e.g. tease them about being late)..."
              className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500/50"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !transcript.trim()}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white shadow-lg shadow-rose-950/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Calibrating Tone & Strategic Leverage...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate 3 Calibrated Scripts</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
              {error}
            </div>
          )}

          {!transcript.trim() && !loading && (
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-400">
              Attach a transcript first to generate scripts grounded in your conversation.
            </div>
          )}

          {result && !loading && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-medium text-neutral-300">Generated Scripts & Rationale</span>
                <button
                  onClick={() => handleCopy(result)}
                  className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white"
                >
                  {copiedScript === result ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied All</span>
                    </>
                  ) : copyFailed ? (
                    <span className="text-amber-300">Copy failed — select the text manually</span>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy All</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs leading-relaxed text-neutral-200 whitespace-pre-wrap font-sans space-y-2">
                {result}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {result && !loading && (
          <div className="p-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end">
            <button
              onClick={() => {
                onAskChatSense(`Draft 2 more variations for the goal: "${activeGoal}", but make one even shorter and more aloof.`);
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>Refine in Chat</span>
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
