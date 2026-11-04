import React, { useState } from 'react';
import { ValidationSummary, ValidationIssue } from '../utils/palmGhgValidation';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Info,
} from 'lucide-react';
import { EstateParameters, MillParameters } from '../types/palmghg';

interface ValidationBannerProps {
  summary: ValidationSummary;
  activeTab: string;
  onSelectTab: (tabKey: string) => void;
  onApplyIssueFix: (fieldKey: string, tab: string, suggestedValue: number) => void;
  onResetAllBenchmarks: () => void;
  onLoadAnomalyTestSample: () => void;
}

export const ValidationBanner: React.FC<ValidationBannerProps> = ({
  summary,
  activeTab,
  onSelectTab,
  onApplyIssueFix,
  onResetAllBenchmarks,
  onLoadAnomalyTestSample,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { totalErrors, totalWarnings, issues } = summary;
  const hasIssues = issues.length > 0;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-hidden transition-all">
      {/* Top Bar */}
      <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              totalErrors > 0
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                : totalWarnings > 0
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            }`}
          >
            {totalErrors > 0 ? (
              <AlertCircle className="w-4 h-4" />
            ) : totalWarnings > 0 ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                RSPO PalmGHG v5 Data Validation & Audit Compliance
              </span>
              {hasIssues ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  {totalErrors > 0 && `${totalErrors} Plausibility Error${totalErrors > 1 ? 's' : ''}`}
                  {totalErrors > 0 && totalWarnings > 0 && ' • '}
                  {totalWarnings > 0 && `${totalWarnings} Benchmark Warning${totalWarnings > 1 ? 's' : ''}`}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  100% Benchmark Compliant (18 Parameters Verified)
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Live checks against RSPO PalmGHG v5 agronomic baselines, extraction limits, and P&C Criterion 7.7 peat water standards.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
          {hasIssues ? (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-1 transition-colors"
            >
              <span>{isExpanded ? 'Hide Issues' : `Review Issues (${issues.length})`}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={onLoadAnomalyTestSample}
              title="Test validation module with intentional out-of-benchmark values (e.g. 310 kg N/ha, 85 cm peat drainage, 27.5% OER)"
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Simulate Out-of-Range Anomaly</span>
            </button>
          )}

          {hasIssues && (
            <button
              type="button"
              onClick={onResetAllBenchmarks}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Auto-Fix All to Benchmarks</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Audit Log / Issue Inspector Tray */}
      {isExpanded && hasIssues && (
        <div className="border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-800 dark:text-neutral-200">
              Active RSPO PalmGHG v5 Validation Findings:
            </span>
            <span className="text-[11px] text-neutral-500">
              Click &quot;Fix&quot; to apply standard RSPO default benchmark or &quot;Navigate&quot; to edit manually.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {issues.map((issue) => {
              const isErr = issue.severity === 'error';
              return (
                <div
                  key={`${issue.tab}-${issue.fieldKey}`}
                  className={`p-3 rounded-lg border text-xs space-y-2 transition-all ${
                    isErr
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-neutral-900 dark:text-neutral-100'
                      : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-neutral-900 dark:text-neutral-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      {isErr ? (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                      <span>{issue.label}</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      Tab: {issue.tab}
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">
                    {issue.message}
                  </p>

                  <div className="p-2 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Current Input:</span>
                      <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        {issue.currentValue.toLocaleString()} {issue.unit}
                        {issue.perHaValue !== undefined && ` (${issue.perHaValue.toFixed(1)} ${issue.perHaUnit})`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">RSPO Benchmark:</span>
                      <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                        {issue.benchmarkRangeText}
                      </span>
                    </div>
                    <div className="text-[9px] text-neutral-400 pt-1 border-t border-neutral-100 dark:border-neutral-700">
                      Citation: {issue.citation}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectTab(issue.tab)}
                      className="text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Navigate to Input</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onApplyIssueFix(issue.fieldKey, issue.tab, issue.suggestedValue)}
                      className="px-2.5 py-1 rounded bg-white dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold shadow-2xs transition-colors"
                    >
                      Fix to Benchmark ({issue.suggestedValue.toLocaleString()})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
