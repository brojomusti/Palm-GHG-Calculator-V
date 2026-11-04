import React, { useState, useRef, useEffect } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Leaf,
  Factory,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Layers,
  BarChart2,
  Minimize2,
  Maximize2,
  Target,
} from 'lucide-react';
import { PalmGHGAssessmentResults } from '../types/palmghg';

interface GhgPerformanceSummaryWidgetProps {
  results: PalmGHGAssessmentResults;
  massUnit?: 'metric' | 'imperial';
  activePreset?: 'baseline' | 'sustainable' | 'custom';
  assessmentYear?: number;
  uocName?: string;
  onNavigate?: (tab: string) => void;
}

export const GhgPerformanceSummaryWidget: React.FC<GhgPerformanceSummaryWidgetProps> = ({
  results,
  massUnit = 'metric',
  activePreset = 'custom',
  assessmentYear = 2024,
  uocName = 'PT Sawit Sejahtera Mill & Estate',
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinnedExpanded, setIsPinnedExpanded] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Mass unit conversion factors (tCO2e stays standard, but intensity can be reflected)
  const unitLabel = massUnit === 'imperial' ? 'ton CO₂e' : 'tCO₂e';
  const cpoUnitLabel = massUnit === 'imperial' ? 'ton CPO' : 't CPO';
  const unitMultiplier = massUnit === 'imperial' ? 1.10231 : 1.0;

  const netEmissions = results.totalNetEmissions * unitMultiplier;
  const grossEmissions = results.totalGrossEmissions * unitMultiplier;
  const carbonRemovals = results.totalCarbonRemovals * unitMultiplier;
  const avoidedEmissions = results.totalEmissionsAvoided * unitMultiplier;
  const totalOffset = carbonRemovals + avoidedEmissions;
  const netGhgPerTonCpo = results.netGhgPerTonCpo;

  // Determine RSPO GHG Benchmark tier
  const getBenchmarkBadge = (intensity: number) => {
    if (intensity <= 0.8) {
      return {
        label: 'RSPO Leader (<0.8)',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
        dotColor: 'bg-emerald-500',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        status: 'Optimal Low Emission',
      };
    } else if (intensity <= 1.4) {
      return {
        label: 'RSPO Standard (<1.4)',
        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-700',
        dotColor: 'bg-blue-500',
        textColor: 'text-blue-700 dark:text-blue-400',
        status: 'Compliant with PalmGHG Target',
      };
    } else if (intensity <= 2.2) {
      return {
        label: 'Moderate (1.4-2.2)',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700',
        dotColor: 'bg-amber-500',
        textColor: 'text-amber-700 dark:text-amber-400',
        status: 'Reduction Plan Recommended',
      };
    } else {
      return {
        label: 'High Emission (>2.2)',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700',
        dotColor: 'bg-rose-500',
        textColor: 'text-rose-700 dark:text-rose-400',
        status: 'Requires Methane Capture / Peat Action',
      };
    }
  };

  const benchmark = getBenchmarkBadge(netGhgPerTonCpo);
  const isNetNegative = netEmissions < 0;

  // Offset percentage
  const offsetPercentage = grossEmissions > 0 
    ? Math.min(100, Math.round((totalOffset / grossEmissions) * 100)) 
    : 0;

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      {/* Persistent Widget Pill Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700/80 bg-neutral-50/90 hover:bg-neutral-100 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 transition-all shadow-2xs hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        title="RSPO PalmGHG Real-Time Performance Summary — Click to expand breakdown"
        aria-expanded={isOpen}
      >
        {/* Pulsing Live calculation indicator */}
        <div className="relative flex items-center justify-center shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
          <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 relative" />
        </div>

        {/* Real-time Total Net Emissions Metric */}
        <div className="flex flex-col items-start text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-500 dark:text-neutral-400">
              Net GHG:
            </span>
            <span className={`font-mono text-xs sm:text-sm font-bold tracking-tight ${
              isNetNegative ? 'text-emerald-700 dark:text-emerald-400' : 'text-neutral-900 dark:text-neutral-100'
            }`}>
              {netEmissions >= 0 ? '+' : ''}
              {netEmissions.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              <span className="text-[10px] ml-1 font-sans font-medium text-neutral-500 dark:text-neutral-400">
                {unitLabel}
              </span>
            </span>
          </div>
        </div>

        {/* Intensity divider & secondary figure (visible on desktop/tablet) */}
        <div className="hidden sm:flex items-center gap-1.5 pl-1.5 border-l border-neutral-200 dark:border-neutral-700 text-xs">
          <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300">
            {netGhgPerTonCpo.toFixed(3)}
          </span>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
            {unitLabel}/{cpoUnitLabel}
          </span>
        </div>

        {/* Compact RSPO Status Pill */}
        <span className={`hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${benchmark.badgeClass}`}>
          {benchmark.label}
        </span>

        {/* Chevron Indicator */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Flyout Breakdown Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl p-4 z-50 text-neutral-900 dark:text-neutral-100 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5" />
                  Real-Time Engine
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  {assessmentYear}
                </span>
              </div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                GHG Performance Summary
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-[240px]">
                {uocName}
              </p>
            </div>

            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${benchmark.badgeClass}`}>
              {benchmark.status}
            </span>
          </div>

          {/* Primary High-Impact Metric Cards */}
          <div className="grid grid-cols-2 gap-2 my-3">
            <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-0.5">
                Total Net Emissions
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`font-mono text-base font-bold ${
                  isNetNegative ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-900 dark:text-neutral-100'
                }`}>
                  {netEmissions >= 0 ? '+' : ''}
                  {netEmissions.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </span>
                <span className="text-[10px] text-neutral-500">{unitLabel}</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-neutral-500">
                {isNetNegative ? (
                  <TrendingDown className="w-3 h-3 text-emerald-600" />
                ) : (
                  <TrendingUp className="w-3 h-3 text-neutral-400" />
                )}
                <span>Active scenario balance</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-0.5">
                Carbon Intensity
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {netGhgPerTonCpo.toFixed(3)}
                </span>
                <span className="text-[10px] text-neutral-500">
                  {unitLabel}/{cpoUnitLabel}
                </span>
              </div>
              <div className="mt-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                {netGhgPerTonCpo <= 1.4 ? '✓ Within RSPO Target' : '⚠ Exceeds Best Practice'}
              </div>
            </div>
          </div>

          {/* Gross vs Removals & Avoidance Balance Bar */}
          <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-2 mb-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-neutral-600 dark:text-neutral-300">Emissions Mitigation Ratio</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400">
                {offsetPercentage}% offset
              </span>
            </div>

            {/* Visual stacked progress */}
            <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden flex">
              <div
                className="bg-emerald-600 dark:bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, offsetPercentage)}%` }}
                title={`Offset: ${totalOffset.toFixed(1)} ${unitLabel}`}
              />
              <div
                className="bg-neutral-400 dark:bg-neutral-600 h-full transition-all duration-300 flex-1"
                title={`Residual: ${Math.max(0, netEmissions).toFixed(1)} ${unitLabel}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-neutral-500 block text-[10px]">Gross Emissions</span>
                <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                  {grossEmissions.toLocaleString(undefined, { maximumFractionDigits: 1 })} {unitLabel}
                </span>
              </div>
              <div className="text-right">
                <span className="text-neutral-500 block text-[10px]">Removals & Captures</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  -{totalOffset.toLocaleString(undefined, { maximumFractionDigits: 1 })} {unitLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Scope & Module Breakdown */}
          <div className="space-y-1.5 text-xs mb-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Life-Cycle Scope Breakdown
            </div>

            <div className="flex items-center justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
              <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Estate Gross (Scope 1+2+3)
              </span>
              <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                {(results.totalEstateScope1 + results.estateScope2GridElectricity + results.totalEstateScope3).toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
              <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                <Factory className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Mill Gross (Scope 1+2+3)
              </span>
              <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                {(results.totalMillScope1 + results.millScope2GridElectricity + results.totalMillScope3).toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
              <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                Carbon Removals (HCV/Sinks)
              </span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                -{results.totalCarbonRemovals.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                Avoided Grid & Methane
              </span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                -{results.totalEmissionsAvoided.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
            </div>
          </div>

          {/* Quick Production Context */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-100/70 dark:bg-neutral-800/40 text-[11px] text-neutral-600 dark:text-neutral-400 mb-3">
            <span>CPO Output: <strong className="font-mono text-neutral-900 dark:text-neutral-200">{results.totalCpoProducedTon.toLocaleString()} t</strong></span>
            <span>FFB: <strong className="font-mono text-neutral-900 dark:text-neutral-200">{results.totalFfbProcessedTon.toLocaleString()} t</strong></span>
            <span>Preset: <strong className="capitalize text-emerald-700 dark:text-emerald-400">{activePreset}</strong></span>
          </div>

          {/* Navigation Action Buttons */}
          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            {onNavigate && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('results');
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
                >
                  <BarChart2 className="w-3 h-3" />
                  <span>Results</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('targets');
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Target className="w-3 h-3 text-emerald-600" />
                  <span>Targets</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('calculator');
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Layers className="w-3 h-3" />
                  <span>Edit Data</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
