import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Trash2,
  CheckCircle,
  EyeOff,
  ServerOff,
  DatabaseZap,
  RefreshCw,
} from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEndAndWipeConversation: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  onEndAndWipeConversation,
}) => {
  const [wiping, setWiping] = useState(false);
  const [wipedSuccess, setWipedSuccess] = useState(false);
  const [wipeError, setWipeError] = useState<string | null>(null);
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

  // Reset the wipe state whenever the modal opens, so a previous result is
  // never shown as if it belonged to this session.
  useEffect(() => {
    if (isOpen) {
      setWiping(false);
      setWipedSuccess(false);
      setWipeError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleWipe = async () => {
    setWiping(true);
    setWipeError(null);
    // Wait for the purge response and report a failure honestly instead of
    // claiming success when the request never completed.
    let purgeFailed = false;
    try {
      const res = await fetch('/api/session/purge', { method: 'POST' });
      if (!res.ok) purgeFailed = true;
    } catch {
      purgeFailed = true;
    }
    // Clear this app's in-memory copy either way; the purge request only
    // affects this origin's browser cache.
    onEndAndWipeConversation();
    setWipedSuccess(true);
    // wiping must be cleared here: the button renders the "Clearing..."
    // label whenever wiping is true, so leaving it set would hide the
    // success label until the modal closes 1600 ms later.
    setWiping(false);
    if (purgeFailed) {
      setWipeError(
        'The browser cache-purge request failed. This app\'s in-memory copy was still cleared.',
      );
    }
    setTimeout(() => {
      setWipedSuccess(false);
      setWiping(false);
      onClose();
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Security and privacy" className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <span>Security & Privacy</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800/60 text-emerald-300">
                  NO APP STORAGE
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                What ChatSense stores, what it sends for analysis, and what ending a session clears
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 text-xs text-neutral-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-rose-400 font-semibold">
                <DatabaseZap className="w-4 h-4" />
                <span>No App Database</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                ChatSense has no database, no disk store, and saves nothing in browser storage. Sessions live only in memory and are lost when you leave or refresh.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                <ServerOff className="w-4 h-4" />
                <span>Anti-Caching Headers</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Every API call enforces <code className="text-[10px] bg-neutral-900 px-1 py-0.5 rounded">Cache-Control: no-store</code> to prevent intermediate proxies or browser caches from saving chat logs.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <EyeOff className="w-4 h-4" />
                <span>Sent to Google's Gemini API</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Transcripts are sent to Google's Gemini API for analysis. Google's retention policy applies to that copy — this app cannot delete it. No analytics scripts or tracking pixels are loaded.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <Lock className="w-4 h-4" />
                <span>Server-Side Model Proxy</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                AI calls are proxied securely on the backend. No API keys or tokens are ever exposed to the client browser.
              </p>
            </div>
          </div>

          {/* Action Box to Destroy Data */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Clear This App's Copy</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  End the current conversation, abort all connections, and clear this app's in-memory copy. This cannot delete copies already sent to Google's Gemini API.
                </p>
              </div>
            </div>

            <button
              onClick={handleWipe}
              disabled={wiping}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-rose-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {wiping ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Clearing This App's Copy...</span>
                </>
              ) : wipedSuccess ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                  <span>This App's Copy Cleared</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>End Conversation & Clear This App's Copy</span>
                </>
              )}
            </button>
            {wipeError && (
              <p className="text-[11px] text-amber-300 leading-relaxed">{wipeError}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Clear-Site-Data only clears this origin's cache; it cannot remove data already sent to Google's Gemini API.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
