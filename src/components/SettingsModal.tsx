import React, { useState } from 'react';
import {
  X,
  Settings,
  Sliders,
  Shield,
  FileText,
  User,
  Sparkles,
  Check,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

export interface ChatSenseSettings {
  persona: string;
  relationshipType: string;
  customInstructions: string;
  detailLevel: 'deep' | 'concise';
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ChatSenseSettings;
  onSaveSettings: (newSettings: ChatSenseSettings) => void;
  transcript: string;
  context: string;
  onUpdateTranscript: (newTranscript: string, newContext: string) => void;
}

const PERSONA_OPTIONS = [
  {
    id: 'honest',
    label: 'Brutally Honest & Unapologetic',
    description: 'Zero sugarcoating. Calls out breadcrumbing, low investment, and delusions immediately.',
  },
  {
    id: 'dating',
    label: 'Tactical Dating & Frame Control',
    description: 'Focuses on tension, status, investment matching, and strategic flirting psychology.',
  },
  {
    id: 'corporate',
    label: 'High-Stakes Workplace Diplomat',
    description: 'Maintains airtight professional boundaries, handles passive-aggression, and documents leverage.',
  },
  {
    id: 'empathetic',
    label: 'Empathetic Behavioral Psychologist',
    description: 'Focuses on attachment styles, emotional safety, de-escalation, and thoughtful vulnerability.',
  },
];

const RELATIONSHIP_TYPES = [
  'Dating / Romance',
  'Workplace / Professional',
  'Ex / Past Partner',
  'Friendship / Social',
  'Family / In-Laws',
  'Other / Unspecified',
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  transcript,
  context,
  onUpdateTranscript,
}) => {
  const [activeTab, setActiveTab] = useState<'persona' | 'transcript' | 'preferences'>('persona');
  const [localSettings, setLocalSettings] = useState<ChatSenseSettings>(settings);
  const [localTranscript, setLocalTranscript] = useState(transcript);
  const [localContext, setLocalContext] = useState(context);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    onUpdateTranscript(localTranscript, localContext);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="p-4 sm:px-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300">
              <Settings className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">ChatSense Settings</h3>
              <p className="text-[11px] text-neutral-400">
                Configure analyst persona, relationship context, and custom instructions
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

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-neutral-800/80 bg-neutral-950/30 flex items-center gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('persona')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'persona'
                ? 'border-rose-500 text-rose-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Analyst Persona & Instructions</span>
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'transcript'
                ? 'border-rose-500 text-rose-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Active Transcript & Context</span>
            {localTranscript.trim() && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'preferences'
                ? 'border-rose-500 text-rose-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Output Preferences</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-neutral-200">
          {activeTab === 'persona' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-neutral-200 mb-2">
                  Psychological Posture & Coaching Persona
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PERSONA_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setLocalSettings({ ...localSettings, persona: opt.label })
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        localSettings.persona === opt.label
                          ? 'bg-rose-950/30 border-rose-500 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="font-semibold text-xs mb-1 flex items-center justify-between">
                        <span>{opt.label}</span>
                        {localSettings.persona === opt.label && (
                          <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 leading-relaxed">
                        {opt.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-200 mb-1.5">
                  Custom Instructions (System Persona Prompt)
                </label>
                <p className="text-[11px] text-neutral-400 mb-2 leading-relaxed">
                  How would you like ChatSense to respond? What rules or communication goals should always be respected?
                </p>
                <textarea
                  value={localSettings.customInstructions}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, customInstructions: e.target.value })
                  }
                  rows={4}
                  placeholder="e.g. Always prioritize maintaining high frame. Never advise double-texting. Point out passive aggression immediately. Keep replies concise and easy to copy."
                  className="w-full p-3 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500/50 leading-relaxed"
                />
              </div>
            </div>
          )}

          {activeTab === 'transcript' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-200 mb-1">
                  Relationship Category
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {RELATIONSHIP_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setLocalSettings({ ...localSettings, relationshipType: type })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        localSettings.relationshipType === type
                          ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-200 mb-1">
                  Background Context / User Notes
                </label>
                <input
                  type="text"
                  value={localContext}
                  onChange={(e) => setLocalContext(e.target.value)}
                  placeholder="e.g. Met 2 weeks ago, chemistry was 9/10, energy abruptly plummeted after Monday..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500/50 text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-200">
                    Active Raw Transcript
                  </label>
                  <span className="text-[11px] text-neutral-500">
                    {localTranscript.split('\n').filter((l) => l.trim()).length} lines
                  </span>
                </div>
                <textarea
                  value={localTranscript}
                  onChange={(e) => setLocalTranscript(e.target.value)}
                  rows={8}
                  placeholder="Paste or edit the continuous raw chat log here..."
                  className="w-full p-3 font-mono text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500/50 leading-relaxed"
                />
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-200 mb-2">
                  Analysis Depth
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setLocalSettings({ ...localSettings, detailLevel: 'deep' })
                    }
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      localSettings.detailLevel === 'deep'
                        ? 'bg-rose-950/30 border-rose-500 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-semibold text-xs mb-1">Full In-Depth Diagnostic</div>
                    <div className="text-[11px] text-neutral-400">
                      Complete 3-part breakdown with psychological motives, evidence citations, and tactical options.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setLocalSettings({ ...localSettings, detailLevel: 'concise' })
                    }
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      localSettings.detailLevel === 'concise'
                        ? 'bg-rose-950/30 border-rose-500 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-semibold text-xs mb-1">Razor-Sharp & Concise</div>
                    <div className="text-[11px] text-neutral-400">
                      High-density bullet points, instant scripts, and zero conversational fluff.
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800/80 space-y-1.5">
                <div className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Privacy Notice</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  All analysis is performed directly through secure AI Studio API calls. Your transcripts and notes remain strictly within your active browser session.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-950/40 transition-all flex items-center gap-1.5"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Apply & Save</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
