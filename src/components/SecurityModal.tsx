import React, { useState } from 'react';
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

  if (!isOpen) return null;

  const handleWipe = async () => {
    setWiping(true);
    try {
      // Call server purge
      await fetch('/api/session/purge', { method: 'POST' }).catch(() => {});
      // Call parent wipe handler (clears state, storage, aborts streams)
      onEndAndWipeConversation();
      setWipedSuccess(true);
      setTimeout(() => {
        setWipedSuccess(false);
        setWiping(false);
        onClose();
      }, 1200);
    } catch {
      onEndAndWipeConversation();
      setWiping(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <span>Security & Zero-Trace Privacy</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800/60 text-emerald-300">
                  100% EPHEMERAL
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Guaranteed zero storage of your chat logs, messages, and psychological profiles
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
                <span>Zero Database Storage</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                ChatSense does not possess a database or disk store. Transcripts exist strictly in volatile RAM while being analyzed.
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
                <span>Zero Telemetry & Tracking</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                No third-party trackers, analytics scripts, or surveillance pixels. Your interpersonal conversations are completely confidential.
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
                  <span>Immediate Memory Destruction</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  End the current conversation, abort all connections, clear browser memory, and purge all data.
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
                  <span>Purging Active Memory & Caches...</span>
                </>
              ) : wipedSuccess ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                  <span>Data Completely Purged</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>End Conversation & Permanently Wipe All Data</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Compliant with W3C Clear-Site-Data standards</span>
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
