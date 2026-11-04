import React, { useState, useMemo } from 'react';
import {
  EstateParameters,
  MillParameters,
  FFBSourceAllocation,
  PalmGHGAssessmentResults,
} from '../types/palmghg';
import {
  calculateSensitivityScenarios,
  SensitivityScenarioKey,
  SensitivityConfig,
  DEFAULT_SENSITIVITY_CONFIG,
} from '../utils/palmghgCalculations';
import {
  FileText,
  Download,
  TrendingDown,
  TrendingUp,
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Gauge,
  Percent,
  Check,
  Zap,
  Flame,
  Trees,
  ShieldAlert,
  History,
  Scale,
  Target,
  DollarSign,
  FlaskConical,
  Sprout,
} from 'lucide-react';
import { ChartJsWaterfall } from './ChartJsWaterfall';
import { ScenarioManager, SavedScenario } from './ScenarioManager';
import { NetGhgSparkline } from './NetGhgSparkline';
import { SensitivityAnalysis } from './SensitivityAnalysis';
import { D3CarbonSequestrationChart } from './D3CarbonSequestrationChart';
import { GhgHotspotsVisualization } from './GhgHotspotsVisualization';
import { HistoricalPerformance } from './HistoricalPerformance';
import { UncertaintyDataConfidence } from './UncertaintyDataConfidence';
import { NetZeroProgress } from './NetZeroProgress';
import { GwpComparisonModule } from './GwpComparisonModule';
import { GhgInvestmentRoi } from './GhgInvestmentRoi';
import { GhgSequestrationTrends } from './GhgSequestrationTrends';
import { FertilizerEmissionComparison } from './FertilizerEmissionComparison';
import { FfbYieldSensitivityWidget } from './FfbYieldSensitivityWidget';
import { GhgTippingPointsSensitivityGraph } from './GhgTippingPointsSensitivityGraph';

interface Props {
  estate: EstateParameters;
  mill: MillParameters;
  ffbSources: FFBSourceAllocation[];
  results: PalmGHGAssessmentResults;
  savedScenarios: SavedScenario[];
  onUpdateSavedScenarios: (scenarios: SavedScenario[]) => void;
  onLoadScenario: (estate: EstateParameters, mill: MillParameters, ffbSources: FFBSourceAllocation[]) => void;
  isDark?: boolean;
  onOpenAuditReport: () => void;
  onExportCsv: () => void;
  assessmentYear?: number;
}

export const AssessmentResultsTable: React.FC<Props> = ({
  estate,
  mill,
  ffbSources,
  results: baselineResults,
  savedScenarios,
  onUpdateSavedScenarios,
  onLoadScenario,
  isDark = false,
  onOpenAuditReport,
  onExportCsv,
  assessmentYear = 2026,
}) => {
  const [activeView, setActiveView] = useState<'matrix' | 'scenarios' | 'sensitivity' | 'tipping_points' | 'yield_sensitivity' | 'waterfall' | 'sequestration' | 'sequestration_trends' | 'hotspots' | 'historical' | 'uncertainty' | 'netzero' | 'gwp' | 'roi' | 'fertilizer'>('matrix');
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<SensitivityScenarioKey>('likely');
  const [isTuningOpen, setIsTuningOpen] = useState(false);
  const [sensitivityConfig, setSensitivityConfig] = useState<SensitivityConfig>(DEFAULT_SENSITIVITY_CONFIG);

  // Compute 3 Sensitivity Scenarios (Best Case, Likely, Worst Case) with programmatic variable configuration
  const sensitivityScenarios = useMemo(() => {
    return calculateSensitivityScenarios(estate, mill, ffbSources, sensitivityConfig);
  }, [estate, mill, ffbSources, sensitivityConfig]);

  // Active displayed results depend on the selected sensitivity scenario
  const activeScenario = sensitivityScenarios[selectedScenarioKey];
  const activeResults = activeScenario.results;

  // Format helper
  const fmt = (val: number, decimals: number = 1) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  // Waterfall steps based on active scenario
  const waterfallSteps = [
    { label: 'Estate Scope 1', value: activeResults.totalEstateScope1, type: 'gross', color: '#d97706' },
    { label: 'Estate Scope 2', value: activeResults.estateScope2GridElectricity, type: 'gross', color: '#10b981' },
    { label: 'Estate Scope 3', value: activeResults.totalEstateScope3, type: 'gross', color: '#0284c7' },
    { label: 'Mill Scope 1', value: activeResults.totalMillScope1, type: 'gross', color: '#ea580c' },
    { label: 'Mill Scope 2', value: activeResults.millScope2GridElectricity, type: 'gross', color: '#059669' },
    { label: 'Mill Scope 3', value: activeResults.totalMillScope3, type: 'gross', color: '#0369a1' },
    { label: 'Carbon Removals', value: -activeResults.totalCarbonRemovals, type: 'deduction', color: '#16a34a' },
    { label: 'Emissions Avoided', value: -activeResults.totalEmissionsAvoided, type: 'deduction', color: '#14b8a6' },
  ];

  const maxVal = Math.max(
    activeResults.totalGrossEmissions,
    activeResults.totalCarbonRemovals + activeResults.totalEmissionsAvoided,
    1
  );

  const bestScen = sensitivityScenarios.best_case;
  const likelyScen = sensitivityScenarios.likely;
  const worstScen = sensitivityScenarios.worst_case;

  return (
    <div className="space-y-6">
      
      {/* COMPREHENSIVE SENSITIVITY ANALYSIS CONTROL PANEL */}
      <div className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        {/* Panel Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 mt-0.5 shrink-0">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Sensitivity Analysis Engine
                </span>
                <span className="text-xs text-neutral-300 dark:text-neutral-700">·</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  RSPO PalmGHG V5 / GHG Protocol LSR
                </span>
              </div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                Sensitivity Analysis Control Panel & Variable Elasticity
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Simulate and stress-test critical operational variables (Methane Capture Efficiency, Land Use Change Amortisation, and Peat Drainage) on Net GHG emissions.
              </p>
            </div>
          </div>

          {/* Action Buttons: Fine-Tuning Drawer & Reset */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsTuningOpen(!isTuningOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isTuningOpen
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Variable Tuning (±{sensitivityConfig.methaneVariancePercent}% CH₄, ±{sensitivityConfig.lucVariancePercent}% LUC)</span>
              {isTuningOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {(sensitivityConfig.methaneVariancePercent !== DEFAULT_SENSITIVITY_CONFIG.methaneVariancePercent ||
              sensitivityConfig.lucVariancePercent !== DEFAULT_SENSITIVITY_CONFIG.lucVariancePercent ||
              sensitivityConfig.peatVariancePercent !== DEFAULT_SENSITIVITY_CONFIG.peatVariancePercent ||
              sensitivityConfig.inhibitorVariancePercent !== DEFAULT_SENSITIVITY_CONFIG.inhibitorVariancePercent) && (
              <button
                type="button"
                onClick={() => setSensitivityConfig(DEFAULT_SENSITIVITY_CONFIG)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Reset tuning to RSPO default variance"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Variances</span>
              </button>
            )}
          </div>
        </div>

        {/* EXPANDABLE VARIABLE FINE-TUNING DRAWER */}
        {isTuningOpen && (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700/80 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200/60 dark:border-neutral-700">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                  Programmatic Parameter Tuning (Stress-Test Deltas)
                </h3>
              </div>
              <span className="text-[11px] text-neutral-500">
                Adjust the sensitivity swing percentage to observe the elasticity envelope across Best and Worst cases.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Variable 1: Methane Capture Efficiency */}
              <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    Methane Capture (±%)
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ±{sensitivityConfig.methaneVariancePercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="30"
                  step="1"
                  value={sensitivityConfig.methaneVariancePercent}
                  onChange={(e) =>
                    setSensitivityConfig((prev) => ({
                      ...prev,
                      methaneVariancePercent: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
                />
                <div className="flex items-center justify-between gap-1 pt-1">
                  {[5, 10, 15, 20].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        setSensitivityConfig((prev) => ({
                          ...prev,
                          methaneVariancePercent: val,
                        }))
                      }
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                        sensitivityConfig.methaneVariancePercent === val
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                      }`}
                    >
                      ±{val}%{val === 10 ? ' (std)' : ''}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-neutral-500 flex justify-between pt-1 border-t border-neutral-100 dark:border-neutral-700/60 font-mono">
                  <span>Best: {Math.min(99.5, mill.methaneCaptureEfficiencyPercent + sensitivityConfig.methaneVariancePercent).toFixed(0)}%</span>
                  <span>Base: {mill.methaneCaptureEfficiencyPercent}%</span>
                  <span>Worst: {Math.max(40, mill.methaneCaptureEfficiencyPercent - sensitivityConfig.methaneVariancePercent).toFixed(0)}%</span>
                </div>
              </div>

              {/* Variable 2: Land Use Change (LUC) Factor & Amortisation */}
              <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    LUC Amortisation (±%)
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ±{sensitivityConfig.lucVariancePercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="5"
                  value={sensitivityConfig.lucVariancePercent}
                  onChange={(e) =>
                    setSensitivityConfig((prev) => ({
                      ...prev,
                      lucVariancePercent: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
                />
                <div className="flex items-center justify-between gap-1 pt-1">
                  {[10, 20, 30].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        setSensitivityConfig((prev) => ({
                          ...prev,
                          lucVariancePercent: val,
                        }))
                      }
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                        sensitivityConfig.lucVariancePercent === val
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                      }`}
                    >
                      ±{val}%{val === 20 ? ' (std)' : ''}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-neutral-500 flex justify-between pt-1 border-t border-neutral-100 dark:border-neutral-700/60 font-mono">
                  <span>Best: {Math.min(35, Math.round(25 * (1 + sensitivityConfig.lucVariancePercent / 100)))}y</span>
                  <span>Base: 25y</span>
                  <span>Worst: {Math.max(15, Math.round(25 * (1 - sensitivityConfig.lucVariancePercent / 100)))}y</span>
                </div>
              </div>

              {/* Variable 3: Peat Drainage Water Table & Oxidation */}
              <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-600" />
                    Peat Oxidation (±%)
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ±{sensitivityConfig.peatVariancePercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="45"
                  step="5"
                  value={sensitivityConfig.peatVariancePercent}
                  onChange={(e) =>
                    setSensitivityConfig((prev) => ({
                      ...prev,
                      peatVariancePercent: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
                />
                <div className="flex items-center justify-between gap-1 pt-1">
                  {[15, 25, 35].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        setSensitivityConfig((prev) => ({
                          ...prev,
                          peatVariancePercent: val,
                        }))
                      }
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                        sensitivityConfig.peatVariancePercent === val
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                      }`}
                    >
                      ±{val}%{val === 25 ? ' (std)' : ''}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-neutral-500 flex justify-between pt-1 border-t border-neutral-100 dark:border-neutral-700/60 font-mono">
                  <span>Best: {(54.6 * (1 - sensitivityConfig.peatVariancePercent / 100)).toFixed(1)} t/ha</span>
                  <span>Base: 54.6 t/ha</span>
                  <span>Worst: {(54.6 * (1 + sensitivityConfig.peatVariancePercent / 100)).toFixed(1)} t/ha</span>
                </div>
              </div>

              {/* Variable 4: NI/UI Fertiliser Inhibitors */}
              <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    Inhibitor Adoption (±%)
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ±{sensitivityConfig.inhibitorVariancePercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={sensitivityConfig.inhibitorVariancePercent}
                  onChange={(e) =>
                    setSensitivityConfig((prev) => ({
                      ...prev,
                      inhibitorVariancePercent: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
                />
                <div className="flex items-center justify-between gap-1 pt-1">
                  {[20, 30, 40].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        setSensitivityConfig((prev) => ({
                          ...prev,
                          inhibitorVariancePercent: val,
                        }))
                      }
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                        sensitivityConfig.inhibitorVariancePercent === val
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                      }`}
                    >
                      ±{val}%{val === 30 ? ' (std)' : ''}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-neutral-500 flex justify-between pt-1 border-t border-neutral-100 dark:border-neutral-700/60 font-mono">
                  <span>Best: 90% N</span>
                  <span>Base: Direct</span>
                  <span>Worst: 0% N</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3-TIER SIDE-BY-SIDE REAL-TIME COMPARISON CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* TIER 1: BEST CASE */}
          <div
            onClick={() => setSelectedScenarioKey('best_case')}
            className={`cursor-pointer rounded-xl p-4 transition-all border-2 relative flex flex-col justify-between ${
              selectedScenarioKey === 'best_case'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                : 'bg-neutral-50/60 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/80 hover:border-emerald-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200/50 dark:border-emerald-800/40">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Best Case Tier
                  </span>
                </div>
                {selectedScenarioKey === 'best_case' ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full">
                    <Check className="w-3 h-3" /> Active Display
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold hover:underline">
                    Click to Apply
                  </span>
                )}
              </div>

              {/* Net GHG / Ton CPO Metric */}
              <div className="mt-3">
                <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                  Net GHG / Ton CPO
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                    {fmt(bestScen.results.netGhgPerTonCpo, 2)}
                  </span>
                  <span className="text-xs text-neutral-500">tCO₂e/t</span>
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 rounded">
                    {fmt(bestScen.deltaNetCpo, 2)} ({fmt(bestScen.deltaNetCpoPercent, 1)}%)
                  </span>
                </div>
              </div>

              {/* Total Net Emissions */}
              <div className="mt-2.5 pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Total Net Inventory:</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                    {fmt(bestScen.results.totalNetEmissions, 0)} tCO₂e
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Net per Ton FFB:</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                    {fmt(bestScen.results.netGhgPerTonFfb, 3)} tCO₂e/t
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">POME Scope 1:</span>
                  <span className="font-mono text-neutral-700 dark:text-neutral-300">
                    {fmt(bestScen.results.millScope1PomeLagoon + bestScen.results.millScope1PomeMethaneUncombusted, 0)} t
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-emerald-200/40 dark:border-emerald-800/30 text-[10px] text-neutral-600 dark:text-neutral-400">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">Assumptions:</span>{' '}
              {bestScen.assumptions.methaneCapture}; {bestScen.assumptions.peatDrainage}.
            </div>
          </div>

          {/* TIER 2: LIKELY BASELINE */}
          <div
            onClick={() => setSelectedScenarioKey('likely')}
            className={`cursor-pointer rounded-xl p-4 transition-all border-2 relative flex flex-col justify-between ${
              selectedScenarioKey === 'likely'
                ? 'bg-neutral-100 dark:bg-neutral-800/90 border-neutral-900 dark:border-neutral-200 shadow-sm ring-2 ring-neutral-400/20'
                : 'bg-neutral-50/60 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/80 hover:border-neutral-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                  <span className="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                    Likely Baseline Tier
                  </span>
                </div>
                {selectedScenarioKey === 'likely' ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full">
                    <Check className="w-3 h-3" /> Active Display
                  </span>
                ) : (
                  <span className="text-[10px] text-neutral-600 dark:text-neutral-400 font-semibold hover:underline">
                    Click to Apply
                  </span>
                )}
              </div>

              {/* Net GHG / Ton CPO Metric */}
              <div className="mt-3">
                <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                  Net GHG / Ton CPO
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                    {fmt(likelyScen.results.netGhgPerTonCpo, 2)}
                  </span>
                  <span className="text-xs text-neutral-500">tCO₂e/t</span>
                  <span className="text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded">
                    Verified Baseline
                  </span>
                </div>
              </div>

              {/* Total Net Emissions */}
              <div className="mt-2.5 pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Total Net Inventory:</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                    {fmt(likelyScen.results.totalNetEmissions, 0)} tCO₂e
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Net per Ton FFB:</span>
                  <span className="font-mono text-neutral-800 dark:text-neutral-200 font-semibold">
                    {fmt(likelyScen.results.netGhgPerTonFfb, 3)} tCO₂e/t
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">POME Scope 1:</span>
                  <span className="font-mono text-neutral-700 dark:text-neutral-300">
                    {fmt(likelyScen.results.millScope1PomeLagoon + likelyScen.results.millScope1PomeMethaneUncombusted, 0)} t
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-700 text-[10px] text-neutral-600 dark:text-neutral-400">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">Assumptions:</span>{' '}
              {likelyScen.assumptions.methaneCapture}; {likelyScen.assumptions.peatDrainage}.
            </div>
          </div>

          {/* TIER 3: WORST CASE */}
          <div
            onClick={() => setSelectedScenarioKey('worst_case')}
            className={`cursor-pointer rounded-xl p-4 transition-all border-2 relative flex flex-col justify-between ${
              selectedScenarioKey === 'worst_case'
                ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-600 shadow-sm ring-2 ring-amber-500/20'
                : 'bg-neutral-50/60 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/80 hover:border-amber-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-amber-200/50 dark:border-amber-800/40">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Worst Case Tier
                  </span>
                </div>
                {selectedScenarioKey === 'worst_case' ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-600 text-white rounded-full">
                    <Check className="w-3 h-3" /> Active Display
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold hover:underline">
                    Click to Apply
                  </span>
                )}
              </div>

              {/* Net GHG / Ton CPO Metric */}
              <div className="mt-3">
                <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                  Net GHG / Ton CPO
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300">
                    {fmt(worstScen.results.netGhgPerTonCpo, 2)}
                  </span>
                  <span className="text-xs text-neutral-500">tCO₂e/t</span>
                  <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950 rounded">
                    +{fmt(worstScen.deltaNetCpo, 2)} (+{fmt(worstScen.deltaNetCpoPercent, 1)}%)
                  </span>
                </div>
              </div>

              {/* Total Net Emissions */}
              <div className="mt-2.5 pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Total Net Inventory:</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                    {fmt(worstScen.results.totalNetEmissions, 0)} tCO₂e
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Net per Ton FFB:</span>
                  <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold">
                    {fmt(worstScen.results.netGhgPerTonFfb, 3)} tCO₂e/t
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">POME Scope 1:</span>
                  <span className="font-mono text-neutral-700 dark:text-neutral-300">
                    {fmt(worstScen.results.millScope1PomeLagoon + worstScen.results.millScope1PomeMethaneUncombusted, 0)} t
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-amber-200/40 dark:border-amber-800/30 text-[10px] text-neutral-600 dark:text-neutral-400">
              <span className="font-semibold text-amber-800 dark:text-amber-300">Assumptions:</span>{' '}
              {worstScen.assumptions.methaneCapture}; {worstScen.assumptions.peatDrainage}.
            </div>
          </div>
        </div>

        {/* Real-time Dynamic Delta Impact Banner */}
        <div className="p-3 bg-neutral-100/80 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded font-bold border ${activeScenario.badgeColor}`}>
              Viewing: {activeScenario.label}
            </span>
            <span className="text-neutral-700 dark:text-neutral-300">
              {selectedScenarioKey === 'likely' ? (
                <>Showing verified baseline data. Select <strong>Best Case</strong> or <strong>Worst Case</strong> above to evaluate elasticity on the assessment matrix.</>
              ) : selectedScenarioKey === 'best_case' ? (
                <>
                  Net GHG decreases by{' '}
                  <strong className="text-emerald-700 dark:text-emerald-400">
                    {fmt(activeScenario.deltaNetCpo, 2)} tCO₂e/t CPO ({fmt(activeScenario.deltaNetCpoPercent, 1)}%)
                  </strong>
                  , reducing annual net footprint by <strong>{fmt(Math.abs(activeScenario.deltaNetEmissions), 0)} tCO₂e</strong>.
                </>
              ) : (
                <>
                  Net GHG increases by{' '}
                  <strong className="text-amber-700 dark:text-amber-400">
                    +{fmt(activeScenario.deltaNetCpo, 2)} tCO₂e/t CPO (+{fmt(activeScenario.deltaNetCpoPercent, 1)}%)
                  </strong>
                  , adding <strong>+{fmt(activeScenario.deltaNetEmissions, 0)} tCO₂e</strong> of liability.
                </>
              )}
            </span>
          </div>

          {selectedScenarioKey !== 'likely' && (
            <button
              onClick={() => setSelectedScenarioKey('likely')}
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Likely Baseline</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Strip (Synchronized in Real-Time by Active Scenario) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span>Net GHG / Ton CPO</span>
              {selectedScenarioKey !== 'likely' && (
                <span className={`text-[10px] font-mono font-bold ${activeScenario.deltaNetCpo <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {activeScenario.deltaNetCpo <= 0 ? '' : '+'}{fmt(activeScenario.deltaNetCpo, 2)} ({fmt(activeScenario.deltaNetCpoPercent, 1)}%)
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-xl font-bold font-mono ${activeResults.netGhgPerTonCpo <= 1.2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {fmt(activeResults.netGhgPerTonCpo, 2)}
              </span>
              <span className="text-xs text-neutral-500">tCO₂e / t CPO</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              Gross: {fmt(activeResults.grossGhgPerTonCpo, 2)} tCO₂e/t
            </div>
          </div>
          {/* Mini Sparkline embedded in KPI card */}
          <NetGhgSparkline
            currentResults={activeResults}
            scenarioKey={selectedScenarioKey}
            scenarioLabel={activeScenario.label}
            assessmentYear={assessmentYear}
            isDark={isDark}
            variant="mini"
          />
        </div>

        <div
          onClick={() => setActiveView('gwp')}
          className="p-3.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs cursor-pointer hover:border-blue-500/50 transition-all flex flex-col justify-between"
          title="Click to compare IPCC AR4 vs AR5 vs AR6 GWP metric values"
        >
          <div>
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span>Net GHG / Ton FFB</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5">
                <Scale className="w-3 h-3" /> GWP (AR5/6)
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {fmt(activeResults.netGhgPerTonFfb, 3)}
              </span>
              <span className="text-xs text-neutral-500">tCO₂e / t FFB</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5 flex items-center justify-between">
              <span>Total FFB: {activeResults.totalFfbProcessedTon.toLocaleString()} Ton</span>
              <span className="text-blue-600 dark:text-blue-400 underline">Ubah GWP →</span>
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveView('netzero')}
          className="p-3.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs cursor-pointer hover:border-emerald-500/50 transition-all flex flex-col justify-between"
          title="Click to view Net Zero Progress & Residual Emissions Gauge"
        >
          <div>
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span>Total Net Residual</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                <Target className="w-3 h-3" /> Net Zero Gauge
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {fmt(activeResults.totalNetEmissions, 0)}
              </span>
              <span className="text-xs text-neutral-500">tCO₂e/yr</span>
              {selectedScenarioKey !== 'likely' && (
                <span className={`text-[10px] font-mono font-bold ml-auto ${activeScenario.deltaNetEmissions <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {activeScenario.deltaNetEmissions <= 0 ? '' : '+'}{fmt(activeScenario.deltaNetEmissions, 0)} t
                </span>
              )}
            </div>
          </div>
          <div className="text-[10px] text-neutral-400 mt-1 flex items-center justify-between font-medium">
            <span>Gross: {fmt(activeResults.totalGrossEmissions, 0)} tCO₂e</span>
            <span className="text-emerald-600 dark:text-emerald-400 underline">Lihat Progress →</span>
          </div>
        </div>

        <div
          onClick={() => setActiveView('sequestration_trends')}
          className="p-3.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs cursor-pointer hover:border-emerald-500/50 transition-all flex flex-col justify-between"
          title="Click to view GHG Sequestration Trends vs. Annual Emissions"
        >
          <div>
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span>Carbon Removals (LSR)</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                <Trees className="w-3 h-3" /> Recharts Trends
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                -{fmt(activeResults.totalCarbonRemovals, 0)}
              </span>
              <span className="text-xs text-neutral-500">tCO₂e</span>
            </div>
          </div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 flex items-center justify-between font-medium">
            <span>HCV + Peatland + Standing</span>
            <span className="underline">Lihat Tren Grafik →</span>
          </div>
        </div>
      </div>

      {/* 5-YEAR NET GHG EMISSIONS TREND SPARKLINE CARD (RECHARTS) */}
      <NetGhgSparkline
        currentResults={activeResults}
        scenarioKey={selectedScenarioKey}
        scenarioLabel={activeScenario.label}
        assessmentYear={assessmentYear}
        isDark={isDark}
        variant="card"
      />

      {/* Main Assessment Results Container */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Official Standard Matrix
              </span>
              <span className="text-xs text-neutral-400">·</span>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                PalmGHG V5 Assessment Results
              </h2>
              {selectedScenarioKey !== 'likely' && (
                <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  Viewing: {activeScenario.label}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Emissions reported under Scope 1, 2, & 3, alongside Optional Information as per GHG Protocol LSR Standard.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium">
              <button
                onClick={() => setActiveView('matrix')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeView === 'matrix' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Full Matrix
              </button>
              <button
                onClick={() => setActiveView('scenarios')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  activeView === 'scenarios' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Scenario Manager</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold">
                  {savedScenarios.length}/3
                </span>
              </button>
              <button
                onClick={() => setActiveView('sensitivity')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  activeView === 'sensitivity' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sensitivity Analysis</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono font-bold">
                  ±10%
                </span>
              </button>
              <button
                onClick={() => setActiveView('tipping_points')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  activeView === 'tipping_points' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tipping Points & Curves</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                  Recharts
                </span>
              </button>
              <button
                onClick={() => setActiveView('yield_sensitivity')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  activeView === 'yield_sensitivity' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                <span>FFB Yield Sensitivity</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold">
                  t/ha → tCO₂e/t
                </span>
              </button>
              <button
                onClick={() => setActiveView('waterfall')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeView === 'waterfall' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Waterfall Breakdown
              </button>
              <button
                onClick={() => setActiveView('sequestration_trends')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  activeView === 'sequestration_trends' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Trees className="w-3.5 h-3.5 text-emerald-600" />
                <span>GHG Sequestration Trends</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                  Recharts
                </span>
              </button>
              <button
                onClick={() => setActiveView('sequestration')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  activeView === 'sequestration' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Trees className="w-3.5 h-3.5 text-emerald-600" />
                <span>10-Yr Sequestration (D3)</span>
              </button>
              <button
                onClick={() => setActiveView('hotspots')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  activeView === 'hotspots' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>GHG Hotspots</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold">
                  Radar
                </span>
              </button>
              <button
                onClick={() => setActiveView('historical')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  activeView === 'historical' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <History className="w-3.5 h-3.5 text-emerald-600" />
                <span>Historical Performance</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                  4-Yr Line
                </span>
              </button>
              <button
                onClick={() => setActiveView('uncertainty')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  activeView === 'uncertainty' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-blue-600" />
                <span>Uncertainty & Confidence</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-bold">
                  ± Range
                </span>
              </button>
              <button
                onClick={() => setActiveView('netzero')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  activeView === 'netzero' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                <span>Net Zero Progress</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold">
                  Gauge
                </span>
              </button>
              <button
                onClick={() => setActiveView('gwp')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  activeView === 'gwp' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-blue-600" />
                <span>GWP Values</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-bold">
                  AR4/5/6
                </span>
              </button>
              <button
                onClick={() => setActiveView('roi')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  activeView === 'roi' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>GHG Investment ROI</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold">
                  IRR & Payback
                </span>
              </button>
              <button
                onClick={() => setActiveView('fertilizer')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  activeView === 'fertilizer' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
                <span>Fertilizer Intensities</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold">
                  Synthetic vs Bio vs NI/UI
                </span>
              </button>
            </div>

            <button
              onClick={onExportCsv}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenAuditReport}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Report</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: OFFICIAL V5 ASSESSMENT RESULTS TABLE MATRIX */}
        {activeView === 'matrix' && (
          <div className="space-y-3">
            {/* INLINE SENSITIVITY TOGGLE & LIVE IMPACT STRIP */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/70 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      Sensitivity Analysis Toggle Control:
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${activeScenario.badgeColor}`}>
                      {activeScenario.label}
                    </span>
                    {selectedScenarioKey !== 'likely' && (
                      <span className="text-[10px] text-neutral-500 font-mono">
                        (Net CPO: {activeScenario.deltaNetCpo <= 0 ? '' : '+'}{fmt(activeScenario.deltaNetCpo, 2)} tCO₂e/t)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Modelling critical variables: <strong>Methane Capture Efficiency (±{sensitivityConfig.methaneVariancePercent}%)</strong>, <strong>LUC Amortisation Period (±{sensitivityConfig.lucVariancePercent}%)</strong>, & <strong>Peat Water Table (±{sensitivityConfig.peatVariancePercent}%)</strong>.
                  </p>
                </div>
              </div>

              {/* 3-State Sensitivity Toggle Buttons */}
              <div className="flex items-center gap-1 p-1 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedScenarioKey('best_case')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                    selectedScenarioKey === 'best_case'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-emerald-700'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Best Case</span>
                  <span className="text-[10px] font-mono opacity-85">
                    ({fmt(sensitivityScenarios.best_case.deltaNetCpo, 2)})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedScenarioKey('likely')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                    selectedScenarioKey === 'likely'
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Likely (Baseline)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedScenarioKey('worst_case')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                    selectedScenarioKey === 'worst_case'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-amber-700'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Worst Case</span>
                  <span className="text-[10px] font-mono opacity-85">
                    (+{fmt(sensitivityScenarios.worst_case.deltaNetCpo, 2)})
                  </span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[1020px]">
              {/* Table Column Headers */}
              <thead>
                <tr className="border-b border-neutral-300 dark:border-neutral-700">
                  <th className="w-[18%] p-3 font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800">
                    Emission Category
                  </th>
                  <th className="w-[20%] p-3 font-bold text-white bg-amber-700">
                    Scope 1 (Direct)
                    <div className="text-[10px] font-normal text-amber-100">Direct GHG emissions from owned/controlled activities</div>
                  </th>
                  <th className="w-[18%] p-3 font-bold text-white bg-emerald-700">
                    Scope 2 (Purchased Energy)
                    <div className="text-[10px] font-normal text-emerald-100">Indirect GHG emissions from purchased energy</div>
                  </th>
                  <th className="w-[22%] p-3 font-bold text-white bg-sky-800">
                    Scope 3 (Value Chain)
                    <div className="text-[10px] font-normal text-sky-100">Other indirect GHG emissions (Cat 1, Cat 3, Cat 4)</div>
                  </th>
                  <th className="w-[22%] p-3 font-bold text-white bg-teal-800">
                    Optional Information
                    <div className="text-[10px] font-normal text-teal-100">Carbon Removals, Avoided Emissions, Biogenic</div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {/* ROW 1: ESTATE EMISSION */}
                <tr className="align-top hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                  <td className="p-3 bg-neutral-50 dark:bg-neutral-900/60 font-semibold border-r border-neutral-200 dark:border-neutral-800">
                    <div className="text-sm font-bold text-emerald-900 dark:text-emerald-400">Estate Emission</div>
                    <p className="text-[10px] text-neutral-500 mt-1 leading-snug">
                      Applies to "Own Plantation" only. "Group" & "Third Party" classified under Scope 3.
                    </p>
                    <div className="mt-4 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-[11px] font-mono">
                      <div className="text-neutral-500">Estate Gross:</div>
                      <div className="font-bold text-neutral-900 dark:text-neutral-100">
                        {fmt(activeResults.totalEstateScope1 + activeResults.estateScope2GridElectricity + activeResults.totalEstateScope3, 0)} tCO₂e
                      </div>
                    </div>
                  </td>

                  {/* Estate Scope 1 */}
                  <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 bg-amber-50/20 dark:bg-amber-950/10">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-neutral-800 dark:text-neutral-200">
                          • Estate Fuel (Stationary) <span className="text-blue-600 text-[9px] font-bold">[NEW]</span>
                        </span>
                        <span className="font-mono font-medium">{fmt(activeResults.estateScope1FuelStationary)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-neutral-800 dark:text-neutral-200">
                          • Estate Fuel (Mobile) <span className="text-blue-600 text-[9px] font-bold">[NEW]</span>
                        </span>
                        <span className="font-mono font-medium">{fmt(activeResults.estateScope1FuelMobile)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-neutral-800 dark:text-neutral-200">
                          • Fertiliser Application
                          {selectedScenarioKey === 'best_case' && (
                            <span className="ml-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                              [{((activeScenario.estateParams.syntheticNInhibitedKg / (estate.syntheticNStandardKg + estate.syntheticNInhibitedKg || 1)) * 100).toFixed(0)}% NI/UI]
                            </span>
                          )}
                          {selectedScenarioKey === 'worst_case' && (
                            <span className="ml-1 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                              [0% NI/UI]
                            </span>
                          )}
                        </span>
                        <span className="font-mono font-medium">{fmt(activeResults.estateScope1FertiliserApp)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-neutral-800 dark:text-neutral-200">
                          • Peat Emission
                          {selectedScenarioKey === 'best_case' && (
                            <span className="ml-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                              [-{sensitivityConfig.peatVariancePercent}% oxidation / 40cm]
                            </span>
                          )}
                          {selectedScenarioKey === 'worst_case' && (
                            <span className="ml-1 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                              [+{sensitivityConfig.peatVariancePercent}% oxidation / 80cm]
                            </span>
                          )}
                        </span>
                        <span className="font-mono font-medium">{fmt(activeResults.estateScope1Peat)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-neutral-800 dark:text-neutral-200">
                          • Land Use Change ({activeScenario.estateParams.grossLucAmortisationYears}y amort.)
                          {selectedScenarioKey === 'best_case' && (
                            <span className="ml-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                              [{activeScenario.estateParams.grossLucAmortisationYears}y extended]
                            </span>
                          )}
                          {selectedScenarioKey === 'worst_case' && (
                            <span className="ml-1 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                              [{activeScenario.estateParams.grossLucAmortisationYears}y accelerated]
                            </span>
                          )}
                        </span>
                        <span className="font-mono font-medium">{fmt(activeResults.estateScope1LucAmortised)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-neutral-800 dark:text-neutral-200">
                          • Land Management <span className="text-blue-600 text-[9px] font-bold">[NEW]</span>
                        </span>
                        <span className="font-mono font-medium">{fmt(activeResults.estateScope1LandManagement)}</span>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-1.5 border-t border-amber-200 dark:border-amber-800 flex justify-between font-bold font-mono text-amber-900 dark:text-amber-300">
                      <span>Subtotal:</span>
                      <span>{fmt(activeResults.totalEstateScope1)} tCO₂e</span>
                    </div>
                  </td>

                  {/* Estate Scope 2 */}
                  <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 bg-emerald-50/20 dark:bg-emerald-950/10">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-neutral-800 dark:text-neutral-200">
                          • Estate Grid Electricity <span className="text-blue-600 text-[9px] font-bold">[NEW]</span>
                        </span>
                        <span className="font-mono font-medium">{fmt(activeResults.estateScope2GridElectricity)}</span>
                      </div>
                    </div>
                    <div className="mt-6 pt-1.5 border-t border-emerald-200 dark:border-emerald-800 flex justify-between font-bold font-mono text-emerald-900 dark:text-emerald-300">
                      <span>Subtotal:</span>
                      <span>{fmt(activeResults.estateScope2GridElectricity)} tCO₂e</span>
                    </div>
                  </td>

                  {/* Estate Scope 3 */}
                  <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 bg-sky-50/20 dark:bg-sky-950/10">
                    <div className="space-y-2">
                      <div>
                        <div className="text-[10px] font-bold text-sky-800 dark:text-sky-300">CAT 1: Purchased Goods</div>
                        <div className="flex justify-between items-baseline pl-1">
                          <span className="text-neutral-700 dark:text-neutral-300">• Fertiliser Manufacturing</span>
                          <span className="font-mono font-medium">{fmt(activeResults.estateScope3Cat1FertiliserMfg)}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-sky-800 dark:text-sky-300">CAT 3: FERA</div>
                        <div className="flex justify-between items-baseline pl-1">
                          <span className="text-neutral-700 dark:text-neutral-300">• Estate Fuel Purchase (WTT)</span>
                          <span className="font-mono font-medium">{fmt(activeResults.estateScope3Cat3FuelWtt)}</span>
                        </div>
                        <div className="flex justify-between items-baseline pl-1">
                          <span className="text-neutral-700 dark:text-neutral-300">
                            • Upstream Electricity <span className="text-blue-600 text-[9px] font-bold">[NEW]</span>
                          </span>
                          <span className="font-mono font-medium">{fmt(activeResults.estateScope3Cat3ElectricityUpstream)}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-sky-800 dark:text-sky-300">CAT 4: Upstream Transport</div>
                        <div className="flex justify-between items-baseline pl-1">
                          <span className="text-neutral-700 dark:text-neutral-300">• Fertiliser Transport</span>
                          <span className="font-mono font-medium">{fmt(activeResults.estateScope3Cat4FertiliserTransport)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-1.5 border-t border-sky-200 dark:border-sky-800 flex justify-between font-bold font-mono text-sky-900 dark:text-sky-300">
                      <span>Subtotal:</span>
                      <span>{fmt(activeResults.totalEstateScope3)} tCO₂e</span>
                    </div>
                  </td>

                  {/* Estate Optional Information */}
                  <td className="p-3 bg-teal-50/20 dark:bg-teal-950/10">
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">Carbon Removals (LSR)</div>
                          <button
                            type="button"
                            onClick={() => setActiveView('sequestration')}
                            className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5 px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60"
                            title="Buka Proyeksi D3 10-Tahun Sekuestrasi Karbon"
                          >
                            <Trees className="w-2.5 h-2.5" /> 10-Yr D3 →
                          </button>
                        </div>
                        <div className="flex justify-between items-baseline pl-1">
                          <span className="text-neutral-700 dark:text-neutral-300">• Crop Sequestration (Existing)</span>
                          <span className="font-mono text-emerald-600 font-medium">-{fmt(activeResults.estateRemovalExistingCropSeq)}</span>
                        </div>
                        <div className="flex justify-between items-baseline pl-1">
                          <span className="text-neutral-700 dark:text-neutral-300">
                            • Standing Oil Palm {'>'}25y <span className="text-blue-600 text-[9px] font-bold">[NEW]</span>
                          </span>
                          <span className="font-mono text-emerald-600 font-medium">-{fmt(activeResults.estateRemovalStandingPalmSeq)}</span>
                        </div>
                        <div className="flex justify-between items-baseline pl-1">
                          <span className="text-neutral-700 dark:text-neutral-300">• Forest Conservation</span>
                          <span className="font-mono text-emerald-600 font-medium">-{fmt(activeResults.estateRemovalForestConservation)}</span>
                        </div>
                        <div className="flex justify-between items-baseline pl-1">
                          <span className="text-neutral-700 dark:text-neutral-300">
                            • Non-Forest Conservation <span className="text-blue-600 text-[9px] font-bold">[NEW]</span>
                          </span>
                          <span className="font-mono text-emerald-600 font-medium">-{fmt(activeResults.estateRemovalNonForestConservation)}</span>
                        </div>
                        <div className="flex justify-between items-baseline pl-1">
                          <span className="text-neutral-700 dark:text-neutral-300">
                            • Peatland Conservation <span className="text-blue-600 text-[9px] font-bold">[NEW]</span>
                          </span>
                          <span className="font-mono text-emerald-600 font-medium">-{fmt(activeResults.estateRemovalPeatlandConservation)}</span>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-teal-200 dark:border-teal-800">
                        <div className="text-[10px] font-bold text-violet-800 dark:text-violet-300">Biogenic Carbon</div>
                        <div className="flex justify-between items-baseline pl-1">
                          <span className="text-neutral-700 dark:text-neutral-300">
                            • Estate Fuel Biogenic (B35/B40) <span className="text-blue-600 text-[9px] font-bold">[NEW]</span>
                          </span>
                          <span className="font-mono text-violet-700 dark:text-violet-300 font-medium">{fmt(activeResults.estateBiogenicFuelCarbon)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-1.5 border-t border-teal-200 dark:border-teal-800 flex justify-between font-bold font-mono text-teal-900 dark:text-teal-300">
                      <span>Total Removals:</span>
                      <span>-{fmt(activeResults.totalEstateCarbonRemovals)} tCO₂e</span>
                    </div>
                  </td>
                </tr>

                {/* ROW 2: MILL EMISSION */}
                <tr className="align-top hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                  <td className="p-3 bg-neutral-50 dark:bg-neutral-900/60 font-semibold border-r border-neutral-200 dark:border-neutral-800">
                    <div className="text-sm font-bold text-amber-900 dark:text-amber-400">Mill Emission</div>
                    <p className="text-[10px] text-neutral-500 mt-1 leading-snug">
                      FFB processing, wastewater (POME), energy & auxiliary combustion.
                    </p>
                    <div className="mt-4 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-[11px] font-mono">
                      <div className="text-neutral-500">Mill Gross:</div>
                      <div className="font-bold text-neutral-900 dark:text-neutral-100">
                        {fmt(activeResults.totalMillScope1 + activeResults.millScope2GridElectricity + activeResults.totalMillScope3, 0)} tCO₂e
                      </div>
                    </div>
                  </td>

                  {/* Mill Scope 1 */}
                  <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 bg-amber-50/20 dark:bg-amber-950/10">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-neutral-800 dark:text-neutral-200">
                          • POME Open Lagoon <span className="text-blue-600 text-[9px] font-bold">[m³ COD]</span>
                          {selectedScenarioKey === 'best_case' && (
                            <span className="ml-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                              [{activeScenario.millParams.methaneCaptureEfficiencyPercent.toFixed(0)}% capture eff]
                            </span>
                          )}
                          {selectedScenarioKey === 'worst_case' && (
                            <span className="ml-1 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                              [{activeScenario.millParams.methaneCaptureEfficiencyPercent.toFixed(0)}% capture upset]
                            </span>
                          )}
                        </span>
                        <span className="font-mono font-medium">{fmt(activeResults.millScope1PomeLagoon)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-neutral-800 dark:text-neutral-200">
                          • POME Uncombusted CH₄ Slip
                          {selectedScenarioKey === 'best_case' && (
                            <span className="ml-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                              [Enclosed flare 99.5%]
                            </span>
                          )}
                          {selectedScenarioKey === 'worst_case' && (
                            <span className="ml-1 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                              [Open flare slip]
                            </span>
                          )}
                        </span>
                        <span className="font-mono font-medium">{fmt(activeResults.millScope1PomeMethaneUncombusted)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-neutral-800 dark:text-neutral-200">
                          • Mill Fuel (Stationary) <span className="text-blue-600 text-[9px] font-bold">[NEW]</span>
                        </span>
                        <span className="font-mono font-medium">{fmt(activeResults.millScope1FuelStationary)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-neutral-800 dark:text-neutral-200">
                          • Mill Fuel (Mobile) <span className="text-blue-600 text-[9px] font-bold">[NEW]</span>
                        </span>
                        <span className="font-mono font-medium">{fmt(activeResults.millScope1FuelMobile)}</span>
                      </div>
                    </div>
                    <div className="mt-8 pt-1.5 border-t border-amber-200 dark:border-amber-800 flex justify-between font-bold font-mono text-amber-900 dark:text-amber-300">
                      <span>Subtotal:</span>
                      <span>{fmt(activeResults.totalMillScope1)} tCO₂e</span>
                    </div>
                  </td>

                  {/* Mill Scope 2 */}
                  <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 bg-emerald-50/20 dark:bg-emerald-950/10">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-neutral-800 dark:text-neutral-200">• Mill Grid Electricity Use</span>
                        <span className="font-mono font-medium">{fmt(activeResults.millScope2GridElectricity)}</span>
                      </div>
                    </div>
                    <div className="mt-8 pt-1.5 border-t border-emerald-200 dark:border-emerald-800 flex justify-between font-bold font-mono text-emerald-900 dark:text-emerald-300">
                      <span>Subtotal:</span>
                      <span>{fmt(activeResults.millScope2GridElectricity)} tCO₂e</span>
                    </div>
                  </td>

                  {/* Mill Scope 3 */}
                  <td className="p-3 border-r border-neutral-200 dark:border-neutral-800 bg-sky-50/20 dark:bg-sky-950/10">
                    <div className="space-y-2">
                      <div>
                        <div className="text-[10px] font-bold text-sky-800 dark:text-sky-300">CAT 1: Purchased Goods</div>
                        <div className="flex justify-between items-baseline pl-1">
                          <span className="text-neutral-700 dark:text-neutral-300">
                            • Purchase 3rd Party FFB <span className="text-blue-600 text-[9px] font-bold">[NEW]</span>
                          </span>
                          <span className="font-mono font-medium">{fmt(activeResults.millScope3Cat1PurchasedFfb)}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-sky-800 dark:text-sky-300">CAT 3: FERA</div>
                        <div className="flex justify-between items-baseline pl-1">
                          <span className="text-neutral-700 dark:text-neutral-300">• Mill Fuel Purchase (WTT)</span>
                          <span className="font-mono font-medium">{fmt(activeResults.millScope3Cat3FuelWtt)}</span>
                        </div>
                        <div className="flex justify-between items-baseline pl-1">
                          <span className="text-neutral-700 dark:text-neutral-300">
                            • Upstream Grid Electricity <span className="text-blue-600 text-[9px] font-bold">[NEW]</span>
                          </span>
                          <span className="font-mono font-medium">{fmt(activeResults.millScope3Cat3ElectricityUpstream)}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-sky-800 dark:text-sky-300">CAT 4: Upstream Transport</div>
                        <div className="flex justify-between items-baseline pl-1">
                          <span className="text-neutral-700 dark:text-neutral-300">
                            • Transport 3rd Party FFB <span className="text-blue-600 text-[9px] font-bold">[NEW]</span>
                          </span>
                          <span className="font-mono font-medium">{fmt(activeResults.millScope3Cat4FfbTransport)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-1.5 border-t border-sky-200 dark:border-sky-800 flex justify-between font-bold font-mono text-sky-900 dark:text-sky-300">
                      <span>Subtotal:</span>
                      <span>{fmt(activeResults.totalMillScope3)} tCO₂e</span>
                    </div>
                  </td>

                  {/* Mill Optional Information */}
                  <td className="p-3 bg-teal-50/20 dark:bg-teal-950/10">
                    <div className="space-y-2">
                      <div>
                        <div className="text-[10px] font-bold text-teal-800 dark:text-teal-300">Emissions Avoided</div>
                        <div className="flex justify-between items-baseline pl-1">
                          <span className="text-neutral-700 dark:text-neutral-300">• Mill Excess Electricity Export</span>
                          <span className="font-mono text-teal-600 font-medium">-{fmt(activeResults.millAvoidedGridElectricityExport)}</span>
                        </div>
                        <div className="flex justify-between items-baseline pl-1">
                          <span className="text-neutral-700 dark:text-neutral-300">
                            • Biomass Export (PKS, EFB, Fibre) <span className="text-blue-600 text-[9px] font-bold">[NEW]</span>
                          </span>
                          <span className="font-mono text-teal-600 font-medium">-{fmt(activeResults.millAvoidedBiomassExport)}</span>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-teal-200 dark:border-teal-800">
                        <div className="text-[10px] font-bold text-violet-800 dark:text-violet-300">Biogenic Carbon</div>
                        <div className="flex justify-between items-baseline pl-1">
                          <span className="text-neutral-700 dark:text-neutral-300">
                            • Mill Boiler Solid Biofuel <span className="text-blue-600 text-[9px] font-bold">[NEW]</span>
                          </span>
                          <span className="font-mono text-violet-700 dark:text-violet-300 font-medium">{fmt(activeResults.millBiogenicBoilerCarbon)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 pt-1.5 border-t border-teal-200 dark:border-teal-800 flex justify-between font-bold font-mono text-teal-900 dark:text-teal-300">
                      <span>Total Avoided:</span>
                      <span>-{fmt(activeResults.totalMillEmissionsAvoided)} tCO₂e</span>
                    </div>
                  </td>
                </tr>

                {/* ROW 3: TOTAL INVENTORY SUMMARY */}
                <tr className="bg-neutral-100 dark:bg-neutral-800 font-bold border-t-2 border-neutral-300 dark:border-neutral-700">
                  <td className="p-3 text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                    Total PalmGHG Inventory
                  </td>
                  <td className="p-3 font-mono text-amber-900 dark:text-amber-300">
                    {fmt(activeResults.totalScope1, 0)} tCO₂e
                  </td>
                  <td className="p-3 font-mono text-emerald-900 dark:text-emerald-300">
                    {fmt(activeResults.totalScope2, 0)} tCO₂e
                  </td>
                  <td className="p-3 font-mono text-sky-900 dark:text-sky-300">
                    {fmt(activeResults.totalScope3, 0)} tCO₂e
                  </td>
                  <td className="p-3 font-mono text-teal-900 dark:text-teal-300">
                    Removals: -{fmt(activeResults.totalCarbonRemovals, 0)}<br />
                    Avoided: -{fmt(activeResults.totalEmissionsAvoided, 0)}<br />
                    Biogenic: {fmt(activeResults.totalBiogenicCarbon, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SENSITIVITY ANALYSIS WIDGET: FFB YIELD (t/ha) IMPACT ON tCO2e/tCPO */}
          <FfbYieldSensitivityWidget
            estate={estate}
            mill={mill}
            ffbSources={ffbSources}
            results={activeResults}
            onUpdateSources={(newSources) => onLoadScenario(estate, mill, newSources)}
            isDark={isDark}
          />
        </div>
        )}

        {/* VIEW: DEDICATED TIPPING POINTS & SENSITIVITY CURVES (RECHARTS) */}
        {activeView === 'tipping_points' && (
          <GhgTippingPointsSensitivityGraph
            estate={estate}
            mill={mill}
            ffbSources={ffbSources}
            baselineResults={activeResults}
            isDark={isDark}
          />
        )}

        {/* VIEW: DEDICATED FFB YIELD SENSITIVITY VIEW */}
        {activeView === 'yield_sensitivity' && (
          <FfbYieldSensitivityWidget
            estate={estate}
            mill={mill}
            ffbSources={ffbSources}
            results={activeResults}
            onUpdateSources={(newSources) => onLoadScenario(estate, mill, newSources)}
            isDark={isDark}
          />
        )}

        {/* VIEW 2: DEDICATED SENSITIVITY ANALYSIS COMPONENT (±10% ON KEY PARAMETERS & TIPPING POINTS) */}
        {activeView === 'sensitivity' && (
          <div className="space-y-6">
            <GhgTippingPointsSensitivityGraph
              estate={estate}
              mill={mill}
              ffbSources={ffbSources}
              baselineResults={activeResults}
              isDark={isDark}
            />

            <FfbYieldSensitivityWidget
              estate={estate}
              mill={mill}
              ffbSources={ffbSources}
              results={activeResults}
              onUpdateSources={(newSources) => onLoadScenario(estate, mill, newSources)}
              isDark={isDark}
            />

            <SensitivityAnalysis
              estate={estate}
              mill={mill}
              ffbSources={ffbSources}
              baselineResults={baselineResults}
              isDark={isDark}
            />

            {/* Collapsible 3-Tier Scenario Matrix (Best / Likely / Worst Case) */}
            <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                    Side-by-Side Scenario Tier Comparison Table
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Evaluasi komprehensif seluruh Scope 1, 2, 3, dan Removals untuk ketiga tingkatan skenario.
                  </p>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  Best · Baseline · Worst
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-neutral-200 dark:border-neutral-700">
                  <thead>
                    <tr className="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold border-b border-neutral-200 dark:border-neutral-700">
                      <th className="p-3 w-[25%]">Parameter & Metric</th>
                      <th className="p-3 w-[25%] text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30">
                        Best Case Scenario
                      </th>
                      <th className="p-3 w-[25%] text-neutral-800 dark:text-neutral-200 bg-neutral-100/80 dark:bg-neutral-800/80">
                        Likely Baseline (Current)
                      </th>
                      <th className="p-3 w-[25%] text-amber-800 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/30">
                        Worst Case Scenario
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    <tr className="bg-white dark:bg-neutral-900 font-semibold">
                      <td className="p-2.5 font-bold">Net GHG / Ton CPO</td>
                      <td className="p-2.5 font-mono text-emerald-600 text-sm font-bold bg-emerald-50/30 dark:bg-emerald-950/20">
                        {fmt(sensitivityScenarios.best_case.results.netGhgPerTonCpo, 2)} tCO₂e/t
                        <div className="text-[10px] font-normal text-emerald-700">
                          {fmt(sensitivityScenarios.best_case.deltaNetCpo, 2)} ({fmt(sensitivityScenarios.best_case.deltaNetCpoPercent, 1)}%)
                        </div>
                      </td>
                      <td className="p-2.5 font-mono text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {fmt(sensitivityScenarios.likely.results.netGhgPerTonCpo, 2)} tCO₂e/t
                        <div className="text-[10px] font-normal text-neutral-500">Baseline</div>
                      </td>
                      <td className="p-2.5 font-mono text-amber-600 text-sm font-bold bg-amber-50/30 dark:bg-amber-950/20">
                        {fmt(sensitivityScenarios.worst_case.results.netGhgPerTonCpo, 2)} tCO₂e/t
                        <div className="text-[10px] font-normal text-amber-700">
                          +{fmt(sensitivityScenarios.worst_case.deltaNetCpo, 2)} (+{fmt(sensitivityScenarios.worst_case.deltaNetCpoPercent, 1)}%)
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2.5">Total Net Emissions (tCO₂e)</td>
                      <td className="p-2.5 font-mono text-emerald-600 font-semibold bg-emerald-50/30 dark:bg-emerald-950/20">
                        {fmt(sensitivityScenarios.best_case.results.totalNetEmissions, 0)}
                      </td>
                      <td className="p-2.5 font-mono font-semibold">
                        {fmt(sensitivityScenarios.likely.results.totalNetEmissions, 0)}
                      </td>
                      <td className="p-2.5 font-mono text-amber-600 font-semibold bg-amber-50/30 dark:bg-amber-950/20">
                        {fmt(sensitivityScenarios.worst_case.results.totalNetEmissions, 0)}
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2.5">Gross Scope 1 Emissions (tCO₂e)</td>
                      <td className="p-2.5 font-mono bg-emerald-50/30 dark:bg-emerald-950/20">
                        {fmt(sensitivityScenarios.best_case.results.totalScope1, 0)}
                      </td>
                      <td className="p-2.5 font-mono">
                        {fmt(sensitivityScenarios.likely.results.totalScope1, 0)}
                      </td>
                      <td className="p-2.5 font-mono bg-amber-50/30 dark:bg-amber-950/20">
                        {fmt(sensitivityScenarios.worst_case.results.totalScope1, 0)}
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2.5">POME Wastewater Scope 1 (tCO₂e)</td>
                      <td className="p-2.5 font-mono bg-emerald-50/30 dark:bg-emerald-950/20">
                        {fmt(sensitivityScenarios.best_case.results.millScope1PomeLagoon + sensitivityScenarios.best_case.results.millScope1PomeMethaneUncombusted, 0)}
                      </td>
                      <td className="p-2.5 font-mono">
                        {fmt(sensitivityScenarios.likely.results.millScope1PomeLagoon + sensitivityScenarios.likely.results.millScope1PomeMethaneUncombusted, 0)}
                      </td>
                      <td className="p-2.5 font-mono bg-amber-50/30 dark:bg-amber-950/20">
                        {fmt(sensitivityScenarios.worst_case.results.millScope1PomeLagoon + sensitivityScenarios.worst_case.results.millScope1PomeMethaneUncombusted, 0)}
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2.5">Peat Soil Scope 1 (tCO₂e)</td>
                      <td className="p-2.5 font-mono bg-emerald-50/30 dark:bg-emerald-950/20">
                        {fmt(sensitivityScenarios.best_case.results.estateScope1Peat, 0)}
                      </td>
                      <td className="p-2.5 font-mono">
                        {fmt(sensitivityScenarios.likely.results.estateScope1Peat, 0)}
                      </td>
                      <td className="p-2.5 font-mono bg-amber-50/30 dark:bg-amber-950/20">
                        {fmt(sensitivityScenarios.worst_case.results.estateScope1Peat, 0)}
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2.5">Gross LUC Amortised (tCO₂e/yr)</td>
                      <td className="p-2.5 font-mono bg-emerald-50/30 dark:bg-emerald-950/20">
                        {fmt(sensitivityScenarios.best_case.results.estateScope1LucAmortised, 0)}
                      </td>
                      <td className="p-2.5 font-mono">
                        {fmt(sensitivityScenarios.likely.results.estateScope1LucAmortised, 0)}
                      </td>
                      <td className="p-2.5 font-mono bg-amber-50/30 dark:bg-amber-950/20">
                        {fmt(sensitivityScenarios.worst_case.results.estateScope1LucAmortised, 0)}
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2.5">Carbon Removals (LSR)</td>
                      <td className="p-2.5 font-mono text-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20">
                        -{fmt(sensitivityScenarios.best_case.results.totalCarbonRemovals, 0)}
                      </td>
                      <td className="p-2.5 font-mono text-emerald-600">
                        -{fmt(sensitivityScenarios.likely.results.totalCarbonRemovals, 0)}
                      </td>
                      <td className="p-2.5 font-mono text-emerald-600 bg-amber-50/30 dark:bg-amber-950/20">
                        -{fmt(sensitivityScenarios.worst_case.results.totalCarbonRemovals, 0)}
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2.5">Emissions Avoided (Power & Biomass)</td>
                      <td className="p-2.5 font-mono text-teal-600 bg-emerald-50/30 dark:bg-emerald-950/20">
                        -{fmt(sensitivityScenarios.best_case.results.totalEmissionsAvoided, 0)}
                      </td>
                      <td className="p-2.5 font-mono text-teal-600">
                        -{fmt(sensitivityScenarios.likely.results.totalEmissionsAvoided, 0)}
                      </td>
                      <td className="p-2.5 font-mono text-teal-600 bg-amber-50/30 dark:bg-amber-950/20">
                        -{fmt(sensitivityScenarios.worst_case.results.totalEmissionsAvoided, 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SCENARIO MANAGER (WHAT-IF MODELING) */}
        {activeView === 'scenarios' && (
          <ScenarioManager
            currentEstate={estate}
            currentMill={mill}
            currentFfbSources={ffbSources}
            currentResults={baselineResults}
            savedScenarios={savedScenarios}
            onUpdateSavedScenarios={onUpdateSavedScenarios}
            onLoadScenario={onLoadScenario}
            isDark={isDark}
          />
        )}

        {/* VIEW 3: CHART.JS WATERFALL BREAKDOWN VISUALIZATION */}
        {activeView === 'waterfall' && (
          <div className="space-y-4">
            <ChartJsWaterfall
              results={activeResults}
              scenarioLabel={activeScenario.label}
              isDark={isDark}
            />
          </div>
        )}

        {/* VIEW 4: GHG SEQUESTRATION TRENDS (CONSERVATION REMOVALS VS ANNUAL EMISSIONS) - RECHARTS */}
        {activeView === 'sequestration_trends' && (
          <GhgSequestrationTrends
            estate={estate}
            mill={mill}
            results={activeResults}
            assessmentYear={assessmentYear}
            isDark={isDark}
          />
        )}

        {/* VIEW 4B: D3.JS 10-YEAR CARBON SEQUESTRATION PROJECTION BAR CHART */}
        {activeView === 'sequestration' && (
          <D3CarbonSequestrationChart
            estate={estate}
            results={activeResults}
            assessmentYear={assessmentYear}
            isDark={isDark}
          />
        )}

        {/* VIEW 5: LIFE-CYCLE GHG HOTSPOTS VISUALIZATION (RADAR & HEATMAP MATRIX) */}
        {activeView === 'hotspots' && (
          <GhgHotspotsVisualization
            results={activeResults}
            scenarioLabel={activeScenario.label}
            isDark={isDark}
          />
        )}

        {/* VIEW 6: HISTORICAL PERFORMANCE 4-YEAR TREND LINE CHART (RECHARTS) */}
        {activeView === 'historical' && (
          <HistoricalPerformance
            currentResults={activeResults}
            scenarioLabel={activeScenario.label}
            scenarioKey={selectedScenarioKey}
            assessmentYear={assessmentYear}
            isDark={isDark}
          />
        )}

        {/* VIEW 7: UNCERTAINTY & DATA CONFIDENCE (IPCC TIER 1 ERROR PROPAGATION) */}
        {activeView === 'uncertainty' && (
          <UncertaintyDataConfidence
            results={activeResults}
            scenarioLabel={activeScenario.label}
            isDark={isDark}
          />
        )}

        {/* VIEW 8: NET ZERO PROGRESS & RESIDUAL EMISSIONS GAUGE */}
        {activeView === 'netzero' && (
          <NetZeroProgress
            results={activeResults}
            estate={estate}
            mill={mill}
            scenarioLabel={activeScenario.label}
            isDark={isDark}
          />
        )}

        {/* VIEW 9: GWP COMPARISON & SENSITIVITY MODULE (AR4 vs AR5 vs AR6 vs GWP-20) */}
        {activeView === 'gwp' && (
          <GwpComparisonModule
            results={activeResults}
            estate={estate}
            mill={mill}
            isDark={isDark}
          />
        )}

        {/* VIEW 10: GHG INVESTMENT ROI & CARBON ABATEMENT ECONOMICS (IRR & PAYBACK) */}
        {activeView === 'roi' && (
          <GhgInvestmentRoi
            results={activeResults}
            estate={estate}
            mill={mill}
            isDark={isDark}
          />
        )}

        {/* VIEW 11: FERTILIZER EMISSION INTENSITIES & OPTIMIZATION (SYNTHETIC VS ORGANIC VS NI/UI) */}
        {activeView === 'fertilizer' && (
          <FertilizerEmissionComparison
            estate={estate}
            mill={mill}
            results={activeResults}
            onUpdateEstate={(newEstate) => onLoadScenario(newEstate, mill, ffbSources)}
            isDark={isDark}
          />
        )}
      </div>
    </div>
  );
};
