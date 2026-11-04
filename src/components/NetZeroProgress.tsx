import React, { useState, useMemo } from 'react';
import {
  Target,
  Trees,
  Flame,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Sliders,
  Copy,
  Check,
  Info,
  Sparkles,
  TrendingDown,
  Layers,
  Leaf,
  Factory,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  PalmGHGAssessmentResults,
  EstateParameters,
  MillParameters
} from '../types/palmghg';

interface Props {
  results: PalmGHGAssessmentResults;
  estate?: EstateParameters;
  mill?: MillParameters;
  scenarioLabel?: string;
  isDark?: boolean;
}

interface DecarbonizationLever {
  id: string;
  name: string;
  category: 'methane' | 'sequestration' | 'fertiliser' | 'energy';
  description: string;
  impactTco2e: number;
  costTier: '$' | '$$' | '$$$';
  timeframe: 'Immediate (< 1 yr)' | 'Medium-Term (1-3 yrs)' | 'Long-Term (3-5 yrs)';
  applied: boolean;
}

export const NetZeroProgress: React.FC<Props> = ({
  results,
  estate,
  mill,
  scenarioLabel = 'Likely Baseline',
  isDark = false,
}) => {
  // Display mode for gauge: progress towards 100% Net Zero vs remaining residual percentage
  const [gaugeMode, setGaugeMode] = useState<'progress' | 'residual'>('progress');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isLeversOpen, setIsLeversOpen] = useState(true);

  // 1. Calculate Core Emissions & Offsets
  const grossEmissions = Math.max(0, results.totalGrossEmissions);
  
  // Sequestration Removals (LSR)
  const sequestrationTotal = Math.max(0, results.totalCarbonRemovals);
  const sequestrationForest = results.estateRemovalForestConservation || 0;
  const sequestrationPeat = results.estateRemovalPeatlandConservation || 0;
  const sequestrationStandingPalm = results.estateRemovalStandingPalmSeq || 0;
  const sequestrationExistingCrop = results.estateRemovalExistingCropSeq || 0;
  const sequestrationOther = (results.estateRemovalNonForestConservation || 0) + (results.estateRemovalOther || 0);

  // Methane Capture & Emissions Avoided Calculation
  // Calculate POME methane avoided if mill params are available, otherwise use verified avoided totals
  const pomeMethaneCapturedTco2e = useMemo(() => {
    if (!mill || !results.totalFfbProcessedTon) {
      // Fallback proxy: If mill has methane capture allocated, calculate typical avoidance
      return (results.millAvoidedGridElectricityExport || 0) + (results.millAvoidedBiomassExport || 0);
    }
    const ffbTon = results.totalFfbProcessedTon;
    const pomeM3 = ffbTon * mill.pomeGenerationRatioM3PerTonFfb;
    const codKg = pomeM3 * (mill.codInletMgPerL / 1000);
    const potentialCh4Kg = codKg * 0.25; // COD to B0 CH4 default
    const captureRatio = (mill.treatmentAllocationMethaneCapturePercent || 0) / 100;
    const efficiency = (mill.methaneCaptureEfficiencyPercent || 0) / 100;
    const capturedCh4Kg = potentialCh4Kg * captureRatio * efficiency;
    
    // Destruction factor (average ~98% across flare and engine)
    const destroyedCh4Kg = capturedCh4Kg * 0.985;
    return (destroyedCh4Kg * 28) / 1000; // GWP of CH4 is 28
  }, [mill, results.totalFfbProcessedTon, results.millAvoidedGridElectricityExport, results.millAvoidedBiomassExport]);

  // Clean Export Credits (Grid export & surplus biomass sold)
  const cleanEnergyExportCredits = Math.max(0, results.totalEmissionsAvoided);

  // Total Offsets & Removals (Avoidance + Removals)
  const totalOffsetAndMitigated = sequestrationTotal + cleanEnergyExportCredits;

  // Actual Net Residual Emissions as per RSPO PalmGHG (Gross - Removals - Avoided)
  const actualResidualEmissions = Math.max(0, results.totalNetEmissions);
  
  // Baseline Net Zero Progress Percentage
  const baselineProgressPercent = grossEmissions > 0
    ? Math.min(100, Math.max(0, ((grossEmissions - actualResidualEmissions) / grossEmissions) * 100))
    : 100;

  // 2. Interactive Decarbonization Roadmap Levers
  const [levers, setLevers] = useState<DecarbonizationLever[]>([
    {
      id: 'methane_capture_upgrade',
      name: 'POME Biogas Flare/Gas-Engine Upgrade (99% Capture)',
      category: 'methane',
      description: 'Enclose remaining open lagoons and install SCADA-controlled enclosed flare & CHP biogas engine to eradicate fugitive CH4 slip.',
      impactTco2e: Math.round(results.millScope1PomeLagoon * 0.85 + results.millScope1PomeMethaneUncombusted * 0.5),
      costTier: '$$$',
      timeframe: 'Medium-Term (1-3 yrs)',
      applied: false,
    },
    {
      id: 'peatland_rewetting_expansion',
      name: 'Peatland Rewetting & Conservation Corridor (+350 ha)',
      category: 'sequestration',
      description: 'Block redundant agricultural drainage canals to raise water table to -30cm, reducing oxidation and sequestering soil carbon.',
      impactTco2e: Math.round(350 * 5.5 + (estate?.peatSoilAreaHa ? estate.peatSoilAreaHa * 0.15 * 54.6 * 0.25 : 1200)),
      costTier: '$$',
      timeframe: 'Immediate (< 1 yr)',
      applied: false,
    },
    {
      id: 'fertiliser_inhibitor_compost',
      name: '100% Nitrification Inhibitor (NI/UI) & Compost Mulch',
      category: 'fertiliser',
      description: 'Substitute 40% synthetic inorganic urea with mill compost & apply DMPP nitrification inhibitors across all mature blocks.',
      impactTco2e: Math.round(results.estateScope1FertiliserApp * 0.35 + results.estateScope3Cat1FertiliserMfg * 0.3),
      costTier: '$',
      timeframe: 'Immediate (< 1 yr)',
      applied: false,
    },
    {
      id: 'biomass_boiler_cogeneration',
      name: 'Surplus EFB & Mesocarp Fibre Power Export (+2.5 GWh)',
      category: 'energy',
      description: 'Optimize high-pressure biomass boiler to eliminate fossil diesel backup and displace carbon-intensive regional grid electricity.',
      impactTco2e: Math.round(results.millScope2GridElectricity + results.millScope1FuelStationary + 1800),
      costTier: '$$$',
      timeframe: 'Long-Term (3-5 yrs)',
      applied: false,
    },
  ]);

  const toggleLever = (id: string) => {
    setLevers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, applied: !item.applied } : item))
    );
  };

  const resetAllLevers = () => {
    setLevers((prev) => prev.map((item) => ({ ...item, applied: false })));
  };

  // Additional Simulated Reductions from Active Levers
  const simulatedAdditionalReductions = useMemo(() => {
    return levers.reduce((sum, lever) => sum + (lever.applied ? lever.impactTco2e : 0), 0);
  }, [levers]);

  // Simulated Net Residual Emissions after applied levers
  const simulatedResidualEmissions = Math.max(0, actualResidualEmissions - simulatedAdditionalReductions);

  // Effective progress percentage after levers
  const effectiveProgressPercent = grossEmissions > 0
    ? Math.min(100, Math.max(0, ((grossEmissions - simulatedResidualEmissions) / grossEmissions) * 100))
    : 100;

  const effectiveResidualPercent = Math.max(0, 100 - effectiveProgressPercent);

  // Format Helper
  const fmt = (val: number, decimals: number = 0) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  // Copy Summary to Clipboard
  const handleCopySummary = () => {
    const text = `RSPO PalmGHG V5 Net Zero Progress Assessment Summary
Scenario: ${scenarioLabel}
Gross GHG Footprint: ${fmt(grossEmissions)} tCO₂e/yr
Carbon Sequestration (LSR Removals): -${fmt(sequestrationTotal)} tCO₂e/yr
Emissions Avoided & Clean Credits: -${fmt(cleanEnergyExportCredits)} tCO₂e/yr
Estimated POME Methane Abatement: ${fmt(pomeMethaneCapturedTco2e)} tCO₂e/yr
----------------------------------------
Net Residual Emissions: ${fmt(actualResidualEmissions)} tCO₂e/yr
Net Zero Decarbonization Progress: ${fmt(baselineProgressPercent, 1)}%
Remaining Net Zero Gap: ${fmt(100 - baselineProgressPercent, 1)}%
CPO Net Carbon Intensity: ${fmt(results.netGhgPerTonCpo, 2)} tCO₂e / t CPO
Generated via RSPO PalmGHG V5 Decarbonization Engine`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // -------------------------------------------------------------
  // GAUGE CHART GEOMETRY CALCULATIONS
  // -------------------------------------------------------------
  // Semicircle gauge: angle from -180 deg (left) to 0 deg (right)
  // Or angle from PI to 0
  const gaugeRadius = 115;
  const strokeWidth = 22;
  const cx = 160;
  const cy = 150;
  
  // Gauge value: 0 to 100
  const gaugeValue = gaugeMode === 'progress' ? effectiveProgressPercent : effectiveResidualPercent;
  
  // Angle: 0% -> 180 degrees (Math.PI radians), 100% -> 0 degrees (0 radians)
  const currentAngleRad = Math.PI - (gaugeValue / 100) * Math.PI;
  const needleLength = gaugeRadius - 14;
  const needleX = cx + needleLength * Math.cos(currentAngleRad);
  const needleY = cy - needleLength * Math.sin(currentAngleRad);

  // SVG Arc generator for track
  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const startX = x + radius * Math.cos(startAngle);
    const startY = y - radius * Math.sin(startAngle);
    const endX = x + radius * Math.cos(endAngle);
    const endY = y - radius * Math.sin(endAngle);
    const arcSweep = endAngle - startAngle <= Math.PI ? 0 : 1;
    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${arcSweep} 1 ${endX} ${endY}`;
  };

  // Background Arc (180 to 0 degrees)
  const bgArcPath = describeArc(cx, cy, gaugeRadius, Math.PI, 0);

  // Active Value Arc
  const activeArcPath = describeArc(cx, cy, gaugeRadius, Math.PI, currentAngleRad);

  // Determine Gauge Color Palette
  const getGaugeColor = (pct: number, mode: 'progress' | 'residual') => {
    if (mode === 'progress') {
      if (pct >= 85) return { stroke: '#10b981', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300', status: 'Near Net Zero Horizon' };
      if (pct >= 60) return { stroke: '#14b8a6', text: 'text-teal-700 dark:text-teal-400', badge: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300', status: 'Advanced Decarbonization' };
      if (pct >= 35) return { stroke: '#f59e0b', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300', status: 'Transitional Mitigation' };
      return { stroke: '#ef4444', text: 'text-rose-700 dark:text-rose-400', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300', status: 'High Residual Carbon' };
    } else {
      // Residual view: lower is better
      if (pct <= 15) return { stroke: '#10b981', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300', status: 'Low Residual Burden' };
      if (pct <= 40) return { stroke: '#14b8a6', text: 'text-teal-700 dark:text-teal-400', badge: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300', status: 'Moderate Residual' };
      if (pct <= 65) return { stroke: '#f59e0b', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300', status: 'Substantial Residual' };
      return { stroke: '#ef4444', text: 'text-rose-700 dark:text-rose-400', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300', status: 'Heavy Residual Debt' };
    }
  };

  const gaugeTheme = getGaugeColor(gaugeValue, gaugeMode);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Context */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900/10 via-teal-900/5 to-transparent dark:from-emerald-950/40 dark:via-neutral-900 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/60 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0 mt-0.5">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Decarbonization & Climate Strategy
                </span>
                <span className="text-xs text-neutral-300 dark:text-neutral-700">·</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  SBTi FLAG & RSPO V5
                </span>
                {scenarioLabel && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    Scenario: {scenarioLabel}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                Net Zero Progress & Residual Emissions Gauge
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 max-w-3xl">
                Evaluating gross supply chain emissions against verified carbon removals (HCV conservation, peatland rewetting, crop biomass) and methane abatement to determine the remaining net residual emissions liability.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all shadow-xs"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards Strip: Gross, Offsets/Removals, Methane Capture, and Net Residual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Gross GHG Footprint */}
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <span>Gross Inventory</span>
            <Factory className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {fmt(grossEmissions)}
            </span>
            <span className="text-xs font-medium text-neutral-500">tCO₂e/yr</span>
          </div>
          <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 flex justify-between">
            <span>Estate: {fmt(results.totalEstateScope1 + results.estateScope2GridElectricity + results.totalEstateScope3)} t</span>
            <span>Mill: {fmt(results.totalMillScope1 + results.millScope2GridElectricity + results.totalMillScope3)} t</span>
          </div>
        </div>

        {/* Card 2: Carbon Sequestration (LSR) */}
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-emerald-800 dark:text-emerald-400">
            <span className="flex items-center gap-1 font-semibold">
              <Trees className="w-3.5 h-3.5" /> Carbon Sequestration
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
              Removals
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
              -{fmt(sequestrationTotal)}
            </span>
            <span className="text-xs font-medium text-neutral-500">tCO₂e/yr</span>
          </div>
          <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 flex justify-between">
            <span>HCV Forest: -{fmt(sequestrationForest)} t</span>
            <span>Peatland: -{fmt(sequestrationPeat)} t</span>
          </div>
        </div>

        {/* Card 3: Methane Capture & Clean Avoidance */}
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-teal-800 dark:text-teal-400">
            <span className="flex items-center gap-1 font-semibold">
              <Flame className="w-3.5 h-3.5" /> Methane & Credits
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-mono font-bold">
              Avoided
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-bold font-mono text-teal-700 dark:text-teal-300">
              -{fmt(cleanEnergyExportCredits)}
            </span>
            <span className="text-xs font-medium text-neutral-500">tCO₂e/yr</span>
          </div>
          <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 flex justify-between">
            <span>Biogas Flare/Pwr: {fmt(pomeMethaneCapturedTco2e)} t CH₄ abated</span>
            <span>Grid Export: -{fmt(results.millAvoidedGridElectricityExport)} t</span>
          </div>
        </div>

        {/* Card 4: Net Residual Emissions Liability */}
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border-2 border-emerald-500/30 dark:border-emerald-600/30 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300">
            <span className="font-bold flex items-center gap-1 text-emerald-800 dark:text-emerald-400">
              <Target className="w-3.5 h-3.5" /> Net Residual Emissions
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${gaugeTheme.badge}`}>
              {fmt(baselineProgressPercent, 1)}% Zero
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {fmt(simulatedResidualEmissions)}
            </span>
            <span className="text-xs font-medium text-neutral-500">tCO₂e/yr</span>
            {simulatedAdditionalReductions > 0 && (
              <span className="text-[11px] font-mono font-semibold text-emerald-600 ml-auto">
                -{fmt(simulatedAdditionalReductions)} t
              </span>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 flex justify-between">
            <span>Intensity: {fmt(results.netGhgPerTonCpo, 2)} t/t CPO</span>
            <span>Target: 0.00 tCO₂e</span>
          </div>
        </div>
      </div>

      {/* 3. Main Centerpiece: The Simple Semicircle Gauge Chart & Residual Decomposition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Semi-Circular Gauge Chart */}
        <div className="lg:col-span-6 p-5 sm:p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <div>
            {/* Gauge Mode Switcher */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Visual Gauge Display
                </span>
                <span className="text-xs text-neutral-300 dark:text-neutral-700">·</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${gaugeTheme.badge}`}>
                  {gaugeTheme.status}
                </span>
              </div>

              {/* Mode Toggle Buttons */}
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setGaugeMode('progress')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    gaugeMode === 'progress'
                      ? 'bg-white dark:bg-neutral-700 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  Net Zero %
                </button>
                <button
                  type="button"
                  onClick={() => setGaugeMode('residual')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    gaugeMode === 'residual'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  Residual Gap %
                </button>
              </div>
            </div>

            {/* Gauge SVG Canvas */}
            <div className="relative flex flex-col items-center justify-center pt-5 pb-2">
              <svg
                viewBox="0 0 320 185"
                className="w-full max-w-[340px] overflow-visible"
              >
                <defs>
                  {/* Arc Gradient: Red -> Amber -> Teal -> Emerald */}
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="35%" stopColor="#f59e0b" />
                    <stop offset="70%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>

                  {/* Residual Gradient: Inverse (Emerald -> Amber -> Red) */}
                  <linearGradient id="residualGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="30%" stopColor="#14b8a6" />
                    <stop offset="65%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>

                  <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
                  </filter>
                </defs>

                {/* Background Full Track (180 deg) */}
                <path
                  d={bgArcPath}
                  fill="none"
                  stroke={isDark ? '#262626' : '#e5e7eb'}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />

                {/* Sub-threshold milestone tick arcs */}
                {/* 25% tick */}
                <line
                  x1={cx + (gaugeRadius + 14) * Math.cos(Math.PI * 0.75)}
                  y1={cy - (gaugeRadius + 14) * Math.sin(Math.PI * 0.75)}
                  x2={cx + (gaugeRadius - 14) * Math.cos(Math.PI * 0.75)}
                  y2={cy - (gaugeRadius - 14) * Math.sin(Math.PI * 0.75)}
                  stroke={isDark ? '#525252' : '#cbd5e1'}
                  strokeWidth="1.5"
                />
                {/* 50% milestone (SBTi 2030) */}
                <line
                  x1={cx}
                  y1={cy - (gaugeRadius + 16)}
                  x2={cx}
                  y2={cy - (gaugeRadius - 16)}
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />
                {/* 75% tick */}
                <line
                  x1={cx + (gaugeRadius + 14) * Math.cos(Math.PI * 0.25)}
                  y1={cy - (gaugeRadius + 14) * Math.sin(Math.PI * 0.25)}
                  x2={cx + (gaugeRadius - 14) * Math.cos(Math.PI * 0.25)}
                  y2={cy - (gaugeRadius - 14) * Math.sin(Math.PI * 0.25)}
                  stroke={isDark ? '#525252' : '#cbd5e1'}
                  strokeWidth="1.5"
                />

                {/* Active Colored Arc Path */}
                {gaugeValue > 0.5 && (
                  <path
                    d={activeArcPath}
                    fill="none"
                    stroke={gaugeMode === 'progress' ? 'url(#gaugeGradient)' : 'url(#residualGradient)'}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                )}

                {/* Needle Pointer */}
                <g filter="url(#needleGlow)" className="transition-all duration-700 ease-out">
                  {/* Needle line */}
                  <line
                    x1={cx}
                    y1={cy}
                    x2={needleX}
                    y2={needleY}
                    stroke={isDark ? '#f5f5f5' : '#1e293b'}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Center Hub Outer Circle */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="8.5"
                    fill={isDark ? '#171717' : '#ffffff'}
                    stroke={isDark ? '#f5f5f5' : '#1e293b'}
                    strokeWidth="3"
                  />
                  {/* Center Pivot Point */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="3.5"
                    fill={gaugeTheme.stroke}
                  />
                </g>

                {/* Milestone Text Markers */}
                <text x="32" y="165" fill={isDark ? '#737373' : '#94a3b8'} fontSize="10" fontWeight="600" textAnchor="middle">
                  {gaugeMode === 'progress' ? '0%' : '100%'}
                </text>
                <text x="160" y="24" fill="#f59e0b" fontSize="10" fontWeight="700" textAnchor="middle">
                  50% (SBTi 2030)
                </text>
                <text x="288" y="165" fill="#10b981" fontSize="10" fontWeight="700" textAnchor="middle">
                  {gaugeMode === 'progress' ? '100% Net Zero' : '0% Residual'}
                </text>
              </svg>

              {/* Gauge Digital Readout Overlay */}
              <div className="text-center mt-[-10px] space-y-0.5">
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  {gaugeMode === 'progress' ? 'Net Zero Decarbonization Index' : 'Remaining Net Residual Carbon'}
                </div>
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className={`text-4xl font-extrabold font-mono tracking-tight ${gaugeTheme.text}`}>
                    {fmt(gaugeValue, 1)}%
                  </span>
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                  {gaugeMode === 'progress' ? (
                    <>
                      <strong className="text-neutral-900 dark:text-neutral-100">{fmt(simulatedResidualEmissions)} tCO₂e</strong> remaining net residual liability
                    </>
                  ) : (
                    <>
                      <strong className="text-neutral-900 dark:text-neutral-100">{fmt(grossEmissions - simulatedResidualEmissions)} tCO₂e</strong> already abated or sequestered
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Context Footnote */}
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-neutral-400" />
              RSPO V5 Linear Accounting
            </span>
            <span className="font-mono text-neutral-600 dark:text-neutral-300">
              Net: {fmt(simulatedResidualEmissions)} t / Gross: {fmt(grossEmissions)} t
            </span>
          </div>
        </div>

        {/* Right Side: Neutralization Ledger & Residual Profile Breakdown */}
        <div className="lg:col-span-6 p-5 sm:p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Emissions Neutralization Ledger
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Deductions verified under GHG Protocol Land Sector and Removals (LSR) v1.1
                  </p>
                </div>
              </div>
            </div>

            {/* Ledger Item Breakdown */}
            <div className="mt-4 space-y-3">
              {/* Item 1: Forest Conservation Removals */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <Trees className="w-4 h-4 text-emerald-600" />
                    HCV Forest & Peatland Conservation Removals
                  </span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    -{fmt(sequestrationForest + sequestrationPeat)} tCO₂e
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-neutral-500">
                  <span>Forest Area: {estate?.forestConservationAreaHa || 0} ha</span>
                  <span>·</span>
                  <span>Peat Conservation: {estate?.peatlandConservationAreaHa || 0} ha</span>
                  <span>·</span>
                  <span className="font-mono text-emerald-600">
                    {grossEmissions > 0 ? (( (sequestrationForest + sequestrationPeat) / grossEmissions ) * 100).toFixed(1) : 0}% of Gross
                  </span>
                </div>
              </div>

              {/* Item 2: Crop Biomass & Standing Retired Palm Sequestration */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <Leaf className="w-4 h-4 text-emerald-500" />
                    Standing Palm & Biomass Crop Sequestration
                  </span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    -{fmt(sequestrationStandingPalm + sequestrationExistingCrop + sequestrationOther)} tCO₂e
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-neutral-500">
                  <span>Standing Retired: {estate?.standingRetiredPalmAreaHa || 0} ha</span>
                  <span>·</span>
                  <span>Plantation Area: {estate?.totalPlantedAreaHa || 0} ha</span>
                  <span>·</span>
                  <span className="font-mono text-emerald-600">
                    {grossEmissions > 0 ? (( (sequestrationStandingPalm + sequestrationExistingCrop + sequestrationOther) / grossEmissions ) * 100).toFixed(1) : 0}% of Gross
                  </span>
                </div>
              </div>

              {/* Item 3: POME Methane Capture & Clean Energy Avoided */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-teal-600" />
                    POME Methane Capture & Surplus Power Export
                  </span>
                  <span className="font-mono font-bold text-teal-700 dark:text-teal-400">
                    -{fmt(cleanEnergyExportCredits)} tCO₂e
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-neutral-500">
                  <span>Biogas Efficiency: {mill?.methaneCaptureEfficiencyPercent || 0}%</span>
                  <span>·</span>
                  <span>Grid Export: {mill?.excessElectricityExportGridKwh?.toLocaleString() || 0} kWh</span>
                  <span>·</span>
                  <span className="font-mono text-teal-600">
                    {grossEmissions > 0 ? (( cleanEnergyExportCredits / grossEmissions ) * 100).toFixed(1) : 0}% of Gross
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Residual Stack Progress Bar */}
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-neutral-600 dark:text-neutral-400">
                Total Supply Chain Carbon Split
              </span>
              <span className="font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {fmt(grossEmissions)} tCO₂e (100%)
              </span>
            </div>

            {/* Stacked Percentage Bar */}
            <div className="w-full h-3 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex">
              {/* Sequestration Segment */}
              <div
                style={{ width: `${Math.min(100, (sequestrationTotal / grossEmissions) * 100)}%` }}
                className="bg-emerald-600 h-full transition-all duration-500"
                title={`Sequestration: ${fmt(sequestrationTotal)} tCO₂e`}
              />
              {/* Avoided Emissions Segment */}
              <div
                style={{ width: `${Math.min(100, (cleanEnergyExportCredits / grossEmissions) * 100)}%` }}
                className="bg-teal-500 h-full transition-all duration-500"
                title={`Avoided Emissions: ${fmt(cleanEnergyExportCredits)} tCO₂e`}
              />
              {/* Additional Lever Simulation */}
              {simulatedAdditionalReductions > 0 && (
                <div
                  style={{ width: `${Math.min(100, (simulatedAdditionalReductions / grossEmissions) * 100)}%` }}
                  className="bg-blue-500 h-full transition-all duration-500 animate-pulse"
                  title={`Simulated Levers: ${fmt(simulatedAdditionalReductions)} tCO₂e`}
                />
              )}
              {/* Net Residual Liability */}
              <div
                style={{ width: `${Math.max(0, (simulatedResidualEmissions / grossEmissions) * 100)}%` }}
                className="bg-rose-500 h-full transition-all duration-500"
                title={`Net Residual: ${fmt(simulatedResidualEmissions)} tCO₂e`}
              />
            </div>

            {/* Legend for Stacked Bar */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] text-neutral-500 pt-1 font-medium">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Sequestration ({fmt((sequestrationTotal / grossEmissions) * 100, 1)}%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Methane & Export ({fmt((cleanEnergyExportCredits / grossEmissions) * 100, 1)}%)
              </span>
              {simulatedAdditionalReductions > 0 && (
                <span className="flex items-center gap-1 text-blue-600 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Levers ({fmt((simulatedAdditionalReductions / grossEmissions) * 100, 1)}%)
                </span>
              )}
              <span className="flex items-center gap-1 text-rose-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Residual ({fmt((simulatedResidualEmissions / grossEmissions) * 100, 1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Actionable Net Zero Roadmap Levers (Interactive Simulator to close the gap) */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Decarbonization Roadmap: Levers to Close the Net Zero Gap
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold font-mono">
                  {levers.filter((l) => l.applied).length}/{levers.length} Applied
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Toggle prospective operational investments below to observe live needle adjustments on the Net Zero gauge.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {simulatedAdditionalReductions > 0 && (
              <button
                type="button"
                onClick={resetAllLevers}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Levers</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsLeversOpen(!isLeversOpen)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {isLeversOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isLeversOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {levers.map((lever) => (
              <div
                key={lever.id}
                onClick={() => toggleLever(lever.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  lever.applied
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-neutral-50/60 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/80 hover:border-blue-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-200/50 dark:border-neutral-700/50">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={lever.applied}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600 rounded border-neutral-300 dark:border-neutral-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {lever.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-400">
                      -{fmt(lever.impactTco2e)} tCO₂e
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
                    {lever.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Capex Tier: <strong className="text-neutral-700 dark:text-neutral-300">{lever.costTier}</strong></span>
                  <span>Horizon: {lever.timeframe}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live Simulation Callout Banner */}
        {simulatedAdditionalReductions > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Roadmap levers close an additional{' '}
                <strong className="font-mono font-bold">-{fmt(simulatedAdditionalReductions)} tCO₂e</strong> of emissions, lifting Net Zero progress from{' '}
                <strong>{fmt(baselineProgressPercent, 1)}%</strong> to{' '}
                <strong className="text-emerald-700 dark:text-emerald-400">{fmt(effectiveProgressPercent, 1)}%</strong>.
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] font-mono font-semibold text-neutral-600 dark:text-neutral-400">
                New Residual: {fmt(simulatedResidualEmissions)} tCO₂e
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5. RSPO & SBTi FLAG Compliance Verification Checklist */}
      <div className="p-4 sm:p-5 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
            RSPO V5 & GHG Protocol Land Sector (LSR) Assurance Requirements
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200/80 dark:border-neutral-700 space-y-1">
            <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              No External Paper Offsets
            </div>
            <p className="text-[11px] text-neutral-500">
              Only in-boundary carbon removals (HCV reserves, conserved peatland, and biomass) are recognized. Carbon credits purchased outside the Unit of Certification cannot be used to claim PalmGHG Net Zero.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200/80 dark:border-neutral-700 space-y-1">
            <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Methane Capture Flare Assurance
            </div>
            <p className="text-[11px] text-neutral-500">
              Enclosed flares must demonstrate 99.5% destruction efficiency with continuous thermocouple logs. Uncombusted slip must be accounted as Scope 1 fugitive CH4 in the inventory.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200/80 dark:border-neutral-700 space-y-1">
            <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Permanence & Monitoring (100-Yr)
            </div>
            <p className="text-[11px] text-neutral-500">
              Conserved peat and forest removals require registered HCV management plans with satellite fire/deforestation monitoring to prevent carbon reversal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
