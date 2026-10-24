import React, { useState } from 'react';
import { Copy, Check, Sparkles, MessageSquareQuote, ShieldAlert, ArrowRight } from 'lucide-react';

interface ReportFormatterProps {
  content: string;
  onSelectLineForDecode?: (line: string) => void;
  onInsertPrompt?: (prompt: string) => void;
}

export const ReportFormatter: React.FC<ReportFormatterProps> = ({
  content,
  onSelectLineForDecode,
  onInsertPrompt,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Parse lines to detect key sections or scripts
  const renderFormattedContent = () => {
    // Process markdown-like lines
    const paragraphs = content.split('\n\n');

    return paragraphs.map((para, pIdx) => {
      const trimmed = para.trim();
      if (!trimmed) return null;

      // Header 1 or 2
      if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
        const title = trimmed.replace(/^#+\s*/, '');
        const isEmotional = title.includes('Emotional') || title.includes('Diagnostic');
        const isPower = title.includes('Power Dynamics') || title.includes('Subtext');
        const isPlaybook = title.includes('Behavioral') || title.includes('Playbook');

        return (
          <div
            key={pIdx}
            className={`mt-6 mb-3 pb-2 border-b flex items-center justify-between ${
              isEmotional
                ? 'border-rose-500/20 text-rose-300'
                : isPower
                ? 'border-indigo-500/20 text-indigo-300'
                : isPlaybook
                ? 'border-emerald-500/20 text-emerald-300'
                : 'border-neutral-800 text-neutral-200'
            }`}
          >
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">{title}</h3>
          </div>
        );
      }

      // Check if this paragraph contains a script / Option quote
      const optionMatch = trimmed.match(/(Option [A-C]|🎭|🎯|🧊).*?["“]([^"”]+)["”]/i);
      if (optionMatch && optionMatch[2]) {
        const scriptText = optionMatch[2];
        const scriptId = `script-${pIdx}`;
        const isCopied = copiedIndex === scriptId;

        return (
          <div
            key={pIdx}
            className="my-3 p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 transition-all group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>Recommended Reply Script</span>
                </div>
                <div className="text-sm font-medium text-neutral-100 bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800/80 font-sans select-all">
                  "{scriptText}"
                </div>
                {trimmed.includes('Why it works') && (
                  <p className="text-xs text-neutral-400 leading-relaxed pt-1">
                    {trimmed.substring(trimmed.indexOf('Why it works'))}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleCopy(scriptText, scriptId)}
                className="shrink-0 p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 text-xs"
                title="Copy script"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
      }

      // Check for quote/evidence blocks
      if (trimmed.startsWith('> ') || trimmed.includes('Evidence from Chat') || trimmed.includes('• "') || trimmed.includes('- "')) {
        return (
          <div key={pIdx} className="my-2 space-y-1.5">
            {trimmed.split('\n').map((line, lIdx) => {
              const quoteMatch = line.match(/["“]([^"”]+)["”]/);
              return (
                <div key={lIdx} className="text-sm leading-relaxed text-neutral-300">
                  {renderLineWithInlineFormatting(line)}
                  {quoteMatch && onSelectLineForDecode && (
                    <button
                      onClick={() => onSelectLineForDecode(quoteMatch[1])}
                      className="ml-2 inline-flex items-center gap-1 text-[11px] text-rose-400/80 hover:text-rose-300 underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      <MessageSquareQuote className="w-3 h-3" />
                      Decode this line
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        );
      }

      // Standard list or paragraph
      const lines = trimmed.split('\n');
      return (
        <div key={pIdx} className="my-2 space-y-1 text-sm leading-relaxed text-neutral-200">
          {lines.map((line, lIdx) => (
            <div key={lIdx} className="leading-relaxed">
              {renderLineWithInlineFormatting(line)}
            </div>
          ))}
        </div>
      );
    });
  };

  const renderLineWithInlineFormatting = (text: string) => {
    // Check if line is a bullet item
    const isBullet = text.trim().startsWith('- ') || text.trim().startsWith('* ') || /^\d+\.\s/.test(text.trim());
    const cleanText = text.replace(/^[-*]\s+|\d+\.\s+/, '');

    // Highlight key badges like Interest Level: [Low | High | etc.]
    let processedText = cleanText;

    // Split by bold (**text**)
    const parts = processedText.split(/(\*\*.*?\*\*)/g);

    return (
      <div className={`flex items-start gap-2 ${isBullet ? 'pl-2' : ''}`}>
        {isBullet && (
          <span className="text-neutral-500 select-none mt-1 text-xs">•</span>
        )}
        <div className="flex-1">
          {parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              const raw = part.slice(2, -2);

              // Interest Level highlighting
              if (raw.toLowerCase().includes('overall interest level')) {
                return (
                  <span key={idx} className="font-semibold text-rose-400">
                    {raw}
                  </span>
                );
              }
              if (raw.toLowerCase().includes('core emotional stance')) {
                return (
                  <span key={idx} className="font-semibold text-amber-300">
                    {raw}
                  </span>
                );
              }
              if (raw.toLowerCase().includes('red flags') || raw.toLowerCase().includes('3 things you must not do')) {
                return (
                  <span key={idx} className="font-semibold text-rose-400">
                    {raw}
                  </span>
                );
              }
              if (raw.toLowerCase().includes('green flags') || raw.toLowerCase().includes('3 things you must do')) {
                return (
                  <span key={idx} className="font-semibold text-emerald-400">
                    {raw}
                  </span>
                );
              }

              return (
                <strong key={idx} className="font-semibold text-neutral-100">
                  {raw}
                </strong>
              );
            }

            // Highlight quotes with italics and subtle coloring
            if (part.includes('"') || part.includes('“')) {
              return (
                <span key={idx} className="text-neutral-300">
                  {part}
                </span>
              );
            }

            return <span key={idx}>{part}</span>;
          })}
        </div>
      </div>
    );
  };

  return <div className="space-y-1">{renderFormattedContent()}</div>;
};
