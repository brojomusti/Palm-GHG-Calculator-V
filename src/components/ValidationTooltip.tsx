import React, { useState, useRef, useEffect } from 'react';
import { ValidationIssue } from '../utils/palmGhgValidation';
import { AlertTriangle, AlertCircle, Info, Check, ArrowRight, Sparkles } from 'lucide-react';

interface ValidationTooltipProps {
  issue?: ValidationIssue;
  benchmarkRange?: string;
  citation?: string;
  onApplySuggested?: (suggestedValue: number) => void;
  inlineHelp?: string;
}

export const ValidationTooltip: React.FC<ValidationTooltipProps> = ({
  issue,
  benchmarkRange,
  citation,
  onApplySuggested,
  inlineHelp,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!issue && !benchmarkRange && !inlineHelp) {
    return null;
  }

  const isError = issue?.severity === 'error';
  const isWarning = issue?.severity === 'warning';

  return (
    <div className="relative inline-flex items-center ml-1.5" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View RSPO benchmark validation details"
        className={`inline-flex items-center justify-center rounded-full transition-transform active:scale-95 ${
          isError
            ? 'text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/60 p-0.5'
            : isWarning
            ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700 bg-amber-50 dark:bg-amber-950/60 p-0.5 animate-pulse'
            : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
        }`}
      >
        {isError ? (
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        ) : isWarning ? (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        ) : (
          <Info className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
        )}
      </button>

      {/* Floating Tooltip / Popover */}
      {isOpen && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-3.5 rounded-xl shadow-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-left text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
          style={{ filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.15))' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-1.5">
              {isError ? (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                  RSPO Limit Exceeded
                </span>
              ) : isWarning ? (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  RSPO Benchmark Warning
                </span>
              ) : (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  <Check className="w-3 h-3 text-emerald-600" />
                  RSPO v5 Benchmark Standard
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xs font-bold leading-none"
            >
              ×
            </button>
          </div>

          {/* Issue Message or Description */}
          {issue ? (
            <div className="space-y-1.5">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-[11px] leading-snug">
                {issue.message}
              </p>
              <p className="text-[10px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {issue.rationale}
              </p>
            </div>
          ) : inlineHelp ? (
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {inlineHelp}
            </p>
          ) : null}

          {/* Range & Citation Metrics */}
          <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700/60 text-[10px] space-y-1">
            <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
              <span className="font-medium">RSPO PalmGHG v5 Benchmark:</span>
              <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                {issue?.benchmarkRangeText || benchmarkRange}
              </span>
            </div>
            {issue?.perHaValue !== undefined && (
              <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                <span className="font-medium">Calculated Field Rate:</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                  {issue.perHaValue.toFixed(1)} {issue.perHaUnit}
                </span>
              </div>
            )}
            <div className="pt-1 border-t border-neutral-200/60 dark:border-neutral-700/60 text-[9px] text-neutral-500 flex items-start gap-1">
              <span className="font-medium text-neutral-600 dark:text-neutral-400 shrink-0">Source:</span>
              <span>{issue?.citation || citation}</span>
            </div>
          </div>

          {/* Quick Fix / Reset Action */}
          {issue && onApplySuggested && (
            <button
              type="button"
              onClick={() => {
                onApplySuggested(issue.suggestedValue);
                setIsOpen(false);
              }}
              className="w-full py-1.5 px-2.5 rounded-lg text-[10px] font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Reset to RSPO Benchmark ({issue.suggestedValue.toLocaleString()} {issue.unit})</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          )}

          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-white dark:border-t-neutral-900" />
        </div>
      )}
    </div>
  );
};

/**
 * Inline validation notice rendered directly beneath an input for immediate feedback.
 */
export const ValidationInlineNotice: React.FC<{
  issue?: ValidationIssue;
  onApplySuggested?: (suggestedValue: number) => void;
}> = ({ issue, onApplySuggested }) => {
  if (!issue) return null;

  const isError = issue.severity === 'error';

  return (
    <div
      className={`mt-1.5 p-2 rounded-lg border text-[11px] flex items-start justify-between gap-2 ${
        isError
          ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
          : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
      }`}
    >
      <div className="flex items-start gap-1.5 flex-1 min-w-0">
        {isError ? (
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        )}
        <div className="min-w-0">
          <p className="font-semibold leading-tight">{issue.message}</p>
          <p className="text-[10px] opacity-85 mt-0.5 leading-snug">
            RSPO PalmGHG v5 benchmark: <span className="font-medium underline">{issue.benchmarkRangeText}</span>. {issue.rationale}
          </p>
        </div>
      </div>

      {onApplySuggested && (
        <button
          type="button"
          onClick={() => onApplySuggested(issue.suggestedValue)}
          className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 shadow-2xs transition-colors whitespace-nowrap"
        >
          Fix: {issue.suggestedValue.toLocaleString()}
        </button>
      )}
    </div>
  );
};
