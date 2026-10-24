import React, { useState, useEffect } from 'react';
import { X, Sparkles, MessageSquareQuote, Check, Copy, AlertTriangle, ArrowRight } from 'lucide-react';

interface LineDecoderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLine: string;
  transcript: string;
  context: string;
  onAskChatSense: (prompt: string) => void;
}

export const LineDecoderModal: React.FC<LineDecoderModalProps> = ({
  isOpen,
  onClose,
  selectedLine,
  transcript,
  context,
  onAskChatSense,
}) => {
  const [line, setLine] = useState(selectedLine);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (selectedLine) {
      setLine(selectedLine);
      handleDecode(selectedLine);
    }
  }, [selectedLine]);

  const handleDecode = async (targetLine: string) => {
    if (!targetLine.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/decode-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line: targetLine,
          transcript,
          context,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to decode line.');
      }
      setResult(data.result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error decoding line');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-neutral-100">
              Psychological Subtext Decoder
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Specific Message or Phrase to Decode
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={line}
                onChange={(e) => setLine(e.target.value)}
                placeholder='e.g., "Let&apos;s see how things shake out toward the weekend!"'
                className="flex-1 px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500/50"
              />
              <button
                onClick={() => handleDecode(line)}
                disabled={loading || !line.trim()}
                className="px-3.5 py-2 text-xs font-medium bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl transition-colors shrink-0 flex items-center gap-1.5"
              >
                {loading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Decode</span>
              </button>
            </div>
          </div>

          {/* Decoding Output */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-rose-500/20 border-t-rose-500 animate-spin" />
              <div className="text-xs font-medium text-neutral-400">
                Evaluating behavioral probability distributions & subtext motives...
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-medium text-neutral-300">
                  Ranked Interpretations & Hidden Subtext
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy analysis</span>
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
          <div className="p-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end gap-2">
            <button
              onClick={() => {
                onAskChatSense(`What did they mean when they said: "${line}"? Break down their true emotional motive and how I should respond.`);
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>Ask in Main Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
