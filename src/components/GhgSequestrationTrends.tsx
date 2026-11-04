import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  EstateParameters,
  MillParameters,
  PalmGHGAssessmentResults,
} from '../types/palmghg';
import { CONSTANTS } from '../utils/palmghgCalculations';
import {
  Trees,
  TrendingDown,
  TrendingUp,
  Sliders,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Leaf,
  Target,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  estate: EstateParameters;
  mill: MillParameters;
  results: PalmGHGAssessmentResults;
  assessmentYear?: number;
  isDark?: boolean;
}

export interface SequestrationYearData {
  year: number;
  label: string;
  isCurrent: boolean;
  // Emissions totals
  grossEmissions: number;
  netEmissions: number;
  emissionsAvoided: number;
  // Conservation area removals
  forestConservationSeq: number;
  peatlandConservationSeq: number;
  nonForestConservationSeq: number;
  standingRetiredPalmSeq: number;
  otherRemovalsSeq: number;
  totalSequestration: number;
  // Coverage & Gap
  netResidualEmissions: number;
  sequestrationCoveragePercent: number;
  cumulativeSequestration: number;
}

export const GhgSequestrationTrends: React.FC<Props> = ({
  estate,
  mill,
  results,
  assessmentYear = 2026,
  isDark = false,
}) => {
  // Horizon selection
  const [horizonYears, setHorizonYears] = useState<number>(10); // 5, 8, 10
  const [includeHistorical, setIncludeHistorical] = useState<boolean>(true); // show previous 2 baseline years
  const [viewMode, setViewMode] = useState<'composed' | 'stacked_removals' | 'coverage_gap'>('composed');

  // Policy / Pathway toggles
  const [emissionsPathway, setEmissionsPathway] = useState<'bau' | 'decarb' | 'sbti'>('decarb');
  const [conservationStrategy, setConservationStrategy] = useState<'status_quo' | 'moderate' | 'aggressive'>('moderate');

  // Interactive Area Customization Drawer
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);
  const [customForestHa, setCustomForestHa] = useState<number>(
    estate.forestConservationAreaHa > 0 ? estate.forestConservationAreaHa : 350
  );
  const [customPeatHa, setCustomPeatHa] = useState<number>(
    estate.peatlandConservationAreaHa > 0 ? estate.peatlandConservationAreaHa : 150
  );
  const [customNonForestHa, setCustomNonForestHa] = useState<number>(
    estate.nonForestConservationAreaHa > 0 ? estate.nonForestConservationAreaHa : 80
  );
  const [customRetiredPalmHa, setCustomRetiredPalmHa] = useState<number>(
    estate.standingRetiredPalmAreaHa > 0 ? estate.standingRetiredPalmAreaHa : 50
  );

  // Number formatting
  const fmt = (val: number, decimals: number = 0) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  // Rates from active parameters or defaults
  const forestRate = Math.abs(estate.forestConservationRate || CONSTANTS.FOREST_CONSERVATION_RATE); // 9.4 tCO2e/ha/yr
  const peatRate = Math.abs(CONSTANTS.PEAT_CONSERVATION_FACTOR); // 5.5 tCO2e/ha/yr
  const nonForestRate = Math.abs(estate.nonForestConservationRate || CONSTANTS.NON_FOREST_CONSERVATION_RATE); // 3.5 tCO2e/ha/yr
  const retiredPalmRate = Math.abs(estate.standingRetiredPalmSequestrationRate || 2.0); // 2.0 tCO2e/ha/yr
  const otherRemovals = Math.abs(estate.otherEligibleCarbonRemovalsTco2e || 0);

  // Annual emissions reduction rate based on pathway
  const annualEmissionsDecay = useMemo(() => {
    switch (emissionsPathway) {
      case 'bau':
        return 0.0; // 0%
      case 'decarb':
        return 0.035; // 3.5% per year
      case 'sbti':
        return 0.055; // 5.5% per year
      default:
        return 0.03;
    }
  }, [emissionsPathway]);

  // Conservation growth rate based on strategy
  const { areaGrowthMultiplier, rateEnrichmentMultiplier } = useMemo(() => {
    switch (conservationStrategy) {
      case 'status_quo':
        return { areaGrowthMultiplier: 1.0, rateEnrichmentMultiplier: 1.0 };
      case 'moderate':
        return { areaGrowthMultiplier: 1.03, rateEnrichmentMultiplier: 1.015 }; // +3% area / +1.5% density/yr
      case 'aggressive':
        return { areaGrowthMultiplier: 1.06, rateEnrichmentMultiplier: 1.025 }; // +6% area / +2.5% density/yr
      default:
        return { areaGrowthMultiplier: 1.0, rateEnrichmentMultiplier: 1.0 };
    }
  }, [conservationStrategy]);

  // Generate Multi-Year Trend Dataset
  const trendData = useMemo<SequestrationYearData[]>(() => {
    const data: SequestrationYearData[] = [];
    const baseGross = Math.max(100, results.totalGrossEmissions);
    const baseAvoided = Math.max(0, results.totalEmissionsAvoided);

    // If includeHistorical, start 2 years prior
    const startOffset = includeHistorical ? -2 : 0;
    const endOffset = horizonYears - 1;

    let cumulativeSeq = 0;

    for (let offset = startOffset; offset <= endOffset; offset++) {
      const year = assessmentYear + offset;
      const isCurrent = offset === 0;
      const isPast = offset < 0;

      // Project emissions: past had slightly higher emissions (+4% each year back)
      let grossEmissions: number;
      if (isPast) {
        grossEmissions = baseGross * Math.pow(1.04, Math.abs(offset));
      } else {
        grossEmissions = baseGross * Math.pow(1 - annualEmissionsDecay, offset);
      }

      // Emissions avoided (grows slowly if decarb/sbti)
      const emissionsAvoided = isPast
        ? baseAvoided * Math.pow(0.92, Math.abs(offset))
        : baseAvoided * (1 + offset * 0.03);

      // Conservation Areas and Sequestration
      let areaFactor = 1.0;
      let densityFactor = 1.0;

      if (!isPast && offset > 0) {
        areaFactor = Math.pow(areaGrowthMultiplier, offset);
        densityFactor = Math.pow(rateEnrichmentMultiplier, offset);
      } else if (isPast) {
        // In past years, slightly less established area
        areaFactor = Math.pow(0.96, Math.abs(offset));
        densityFactor = 0.95;
      }

      const activeForestHa = customForestHa * areaFactor;
      const activePeatHa = customPeatHa * areaFactor;
      const activeNonForestHa = customNonForestHa * areaFactor;
      const activeRetiredPalmHa = customRetiredPalmHa;

      const forestSeq = activeForestHa * forestRate * densityFactor;
      const peatSeq = activePeatHa * peatRate * densityFactor;
      const nonForestSeq = activeNonForestHa * nonForestRate * densityFactor;
      const retiredPalmSeq = activeRetiredPalmHa * retiredPalmRate;
      const otherSeq = otherRemovals;

      const totalSeq = forestSeq + peatSeq + nonForestSeq + retiredPalmSeq + otherSeq;
      cumulativeSeq += totalSeq;

      const netResidual = Math.max(0, grossEmissions - totalSeq - emissionsAvoided);
      const netEmissions = grossEmissions - totalSeq - emissionsAvoided;
      const coveragePercent = grossEmissions > 0 ? (totalSeq / grossEmissions) * 100 : 0;

      data.push({
        year,
        label: isCurrent ? `${year} (Current)` : `${year}`,
        isCurrent,
        grossEmissions: Math.round(grossEmissions),
        netEmissions: Math.round(netEmissions),
        emissionsAvoided: Math.round(emissionsAvoided),
        forestConservationSeq: Math.round(forestSeq),
        peatlandConservationSeq: Math.round(peatSeq),
        nonForestConservationSeq: Math.round(nonForestSeq),
        standingRetiredPalmSeq: Math.round(retiredPalmSeq),
        otherRemovalsSeq: Math.round(otherSeq),
        totalSequestration: Math.round(totalSeq),
        netResidualEmissions: Math.round(netResidual),
        sequestrationCoveragePercent: Number(coveragePercent.toFixed(1)),
        cumulativeSequestration: Math.round(cumulativeSeq),
      });
    }

    return data;
  }, [
    assessmentYear,
    horizonYears,
    includeHistorical,
    annualEmissionsDecay,
    areaGrowthMultiplier,
    rateEnrichmentMultiplier,
    customForestHa,
    customPeatHa,
    customNonForestHa,
    customRetiredPalmHa,
    forestRate,
    peatRate,
    nonForestRate,
    retiredPalmRate,
    otherRemovals,
    results.totalGrossEmissions,
    results.totalEmissionsAvoided,
  ]);

  // Current year metrics
  const currentRecord = useMemo(() => {
    return trendData.find((d) => d.isCurrent) || trendData[0];
  }, [trendData]);

  // Horizon end record
  const endRecord = useMemo(() => {
    return trendData[trendData.length - 1];
  }, [trendData]);

  // Find Net Neutrality / Crossover Year if any
  const crossoverYear = useMemo(() => {
    const crossover = trendData.find((d) => d.netEmissions <= 0);
    return crossover ? crossover.year : null;
  }, [trendData]);

  // Total cumulative sequestration over the horizon
  const horizonCumulativeRemovals = useMemo(() => {
    return trendData
      .filter((d) => d.year >= assessmentYear)
      .reduce((acc, curr) => acc + curr.totalSequestration, 0);
  }, [trendData, assessmentYear]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Year',
      'Gross Emissions (tCO2e)',
      'Forest Conservation (tCO2e)',
      'Peatland Rewetted (tCO2e)',
      'Non-Forest Riparian (tCO2e)',
      'Retired Palm (tCO2e)',
      'Total Sequestration (tCO2e)',
      'Emissions Avoided (tCO2e)',
      'Net Emissions (tCO2e)',
      'Coverage Ratio (%)',
    ];

    const rows = trendData.map((d) => [
      d.year,
      d.grossEmissions,
      d.forestConservationSeq,
      d.peatlandConservationSeq,
      d.nonForestConservationSeq,
      d.standingRetiredPalmSeq,
      d.totalSequestration,
      d.emissionsAvoided,
      d.netEmissions,
      `${d.sequestrationCoveragePercent}%`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GHG_Sequestration_Trends_${assessmentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset to original estate inputs
  const handleResetCustomAreas = () => {
    setCustomForestHa(estate.forestConservationAreaHa > 0 ? estate.forestConservationAreaHa : 350);
    setCustomPeatHa(estate.peatlandConservationAreaHa > 0 ? estate.peatlandConservationAreaHa : 150);
    setCustomNonForestHa(estate.nonForestConservationAreaHa > 0 ? estate.nonForestConservationAreaHa : 80);
    setCustomRetiredPalmHa(estate.standingRetiredPalmAreaHa > 0 ? estate.standingRetiredPalmAreaHa : 50);
  };

  return (
    <div className="space-y-4">
      {/* HEADER STRIP & CONTROLS */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 shrink-0 mt-0.5">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Carbon Removals (LSR) vs. Gross Totals
                </span>
                <span className="text-xs text-neutral-300 dark:text-neutral-700">·</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                  Recharts Multi-Year Trajectory
                </span>
                <span className="text-xs text-neutral-300 dark:text-neutral-700">·</span>
                <span className="text-[11px] font-mono text-neutral-500">
                  RSPO PalmGHG v5 Subbab 2.4
                </span>
              </div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                GHG Sequestration Trends & Decarbonisation Crossover
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Model potential carbon sequestration from verified conservation areas (Forest, Peatland Rewetting, Riparian & Retired Palms) against annual emissions.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsCustomizing(!isCustomizing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isCustomizing
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Conservation Area Tuning</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700"
              title="Download trend trajectory data as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* TOP LEVEL KPI STAT CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Card 1: Current Annual Sequestration */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span>Annual Sequestration</span>
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                -{fmt(currentRecord.totalSequestration, 0)}
              </span>
              <span className="text-xs text-neutral-500">tCO₂e/yr</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              Forest + Peat + Riparian Removals
            </div>
          </div>

          {/* Card 2: Annual Gross Emissions */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span>Gross Annual Emissions</span>
              <span className="text-[10px] font-mono font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded">
                Scope 1+2+3
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">
                {fmt(currentRecord.grossEmissions, 0)}
              </span>
              <span className="text-xs text-neutral-500">tCO₂e/yr</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              Full Mill & Estate operational load
            </div>
          </div>

          {/* Card 3: Sequestration Coverage Ratio */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span>Sequestration Offset Ratio</span>
              <Target className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {currentRecord.sequestrationCoveragePercent}%
              </span>
              <span className="text-xs text-neutral-500">coverage</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              Target: 100% (Gross Removals Parity)
            </div>
          </div>

          {/* Card 4: Net Residual Emissions */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span>Net Residual Footprint</span>
              <TrendingDown className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {fmt(currentRecord.netEmissions, 0)}
              </span>
              <span className="text-xs text-neutral-500">tCO₂e</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              Gross less removals & avoided
            </div>
          </div>

          {/* Card 5: Net Zero Crossover Status */}
          <div className={`p-3 rounded-xl border ${
            crossoverYear
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
              : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700/80'
          }`}>
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span>Net-Zero Crossover</span>
              <CheckCircle2 className={`w-3.5 h-3.5 ${crossoverYear ? 'text-emerald-600' : 'text-neutral-400'}`} />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-xl font-bold font-mono ${crossoverYear ? 'text-emerald-700 dark:text-emerald-300' : 'text-neutral-700 dark:text-neutral-300'}`}>
                {crossoverYear ? `Year ${crossoverYear}` : `>${endRecord.year}`}
              </span>
              {crossoverYear && (
                <span className="text-[11px] text-emerald-600 font-semibold">
                  (in {crossoverYear - assessmentYear}y)
                </span>
              )}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              {crossoverYear ? 'Removals overtake residual' : `Gap at Y${horizonYears}: ${fmt(endRecord.netResidualEmissions, 0)} t`}
            </div>
          </div>
        </div>

        {/* INTERACTIVE AREA CUSTOMIZATION DRAWER */}
        {isCustomizing && (
          <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200/60 dark:border-emerald-800/40">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                  What-If Conservation Area Potential Sliders
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-500">
                  Test the impact of designating new conservation hectares on future carbon removals.
                </span>
                <button
                  type="button"
                  onClick={handleResetCustomAreas}
                  className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to Estate Values</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Forest Conservation Ha */}
              <div className="p-2.5 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Forest Conservation
                  </span>
                  <span className="font-mono font-bold text-emerald-600">
                    {customForestHa} ha
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="25"
                  value={customForestHa}
                  onChange={(e) => setCustomForestHa(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                  <span>Factor: -{forestRate} t/ha</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                    -{fmt(customForestHa * forestRate, 0)} t/yr
                  </span>
                </div>
              </div>

              {/* Peatland Rewetting Ha */}
              <div className="p-2.5 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Peatland Rewetted
                  </span>
                  <span className="font-mono font-bold text-teal-600">
                    {customPeatHa} ha
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1500"
                  step="25"
                  value={customPeatHa}
                  onChange={(e) => setCustomPeatHa(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                  <span>Factor: -{peatRate} t/ha</span>
                  <span className="font-mono text-teal-700 dark:text-teal-400 font-semibold">
                    -{fmt(customPeatHa * peatRate, 0)} t/yr
                  </span>
                </div>
              </div>

              {/* Riparian / Non-Forest Ha */}
              <div className="p-2.5 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Non-Forest / Riparian
                  </span>
                  <span className="font-mono font-bold text-sky-600">
                    {customNonForestHa} ha
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="800"
                  step="10"
                  value={customNonForestHa}
                  onChange={(e) => setCustomNonForestHa(Number(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                  <span>Factor: -{nonForestRate} t/ha</span>
                  <span className="font-mono text-sky-700 dark:text-sky-400 font-semibold">
                    -{fmt(customNonForestHa * nonForestRate, 0)} t/yr
                  </span>
                </div>
              </div>

              {/* Standing Retired Palm Ha */}
              <div className="p-2.5 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Retired Palms {'>'}25y
                  </span>
                  <span className="font-mono font-bold text-indigo-600">
                    {customRetiredPalmHa} ha
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={customRetiredPalmHa}
                  onChange={(e) => setCustomRetiredPalmHa(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                  <span>Factor: -{retiredPalmRate} t/ha</span>
                  <span className="font-mono text-indigo-700 dark:text-indigo-400 font-semibold">
                    -{fmt(customRetiredPalmHa * retiredPalmRate, 0)} t/yr
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCENARIO POLICY & VIEW TOGGLES */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* View Mode */}
            <span className="text-neutral-500 font-medium">Chart Mode:</span>
            <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg font-medium">
              <button
                onClick={() => setViewMode('composed')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'composed'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                Dual Trend (Composed)
              </button>
              <button
                onClick={() => setViewMode('stacked_removals')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'stacked_removals'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                Conservation Breakdown
              </button>
              <button
                onClick={() => setViewMode('coverage_gap')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'coverage_gap'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                Net Residual Gap
              </button>
            </div>

            {/* Time Horizon */}
            <span className="text-neutral-400 ml-2">|</span>
            <span className="text-neutral-500 font-medium ml-1">Horizon:</span>
            <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg font-medium">
              {[5, 8, 10].map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizonYears(h)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                    horizonYears === h
                      ? 'bg-white dark:bg-neutral-700 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  {h} Years
                </button>
              ))}
            </div>

            <button
              onClick={() => setIncludeHistorical(!includeHistorical)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                includeHistorical
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
              }`}
            >
              {includeHistorical ? '✓ Past 2 Years Shown' : '+ Show Past 2 Years'}
            </button>
          </div>

          {/* Strategic Pathways */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500 font-medium">Emissions Pathway:</span>
              <select
                value={emissionsPathway}
                onChange={(e) => setEmissionsPathway(e.target.value as any)}
                className="px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-medium text-xs outline-none"
              >
                <option value="bau">BAU (0% reduction)</option>
                <option value="decarb">Planned Decarb (-3.5%/yr)</option>
                <option value="sbti">SBTi 1.5°C (-5.5%/yr)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500 font-medium">Conservation Action:</span>
              <select
                value={conservationStrategy}
                onChange={(e) => setConservationStrategy(e.target.value as any)}
                className="px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-medium text-xs outline-none"
              >
                <option value="status_quo">Status Quo (Maintain current ha)</option>
                <option value="moderate">Active Forest Enrichment (+3%/yr ha)</option>
                <option value="aggressive">Aggressive Rewetting & Corridor (+6%/yr ha)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* RECHARTS MAIN VISUALIZATION CARD */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Trajectory Visualization ({trendData[0]?.year} – {trendData[trendData.length - 1]?.year})
            </span>
            <span className="text-xs text-neutral-400">·</span>
            <span className="text-[11px] text-neutral-500">
              {viewMode === 'composed'
                ? 'Emissions vs Sequestration Removals with Right-Axis Coverage %'
                : viewMode === 'stacked_removals'
                ? 'Stacked Sequestration Removals by Conservation Category vs Gross Emissions'
                : 'Decarbonisation Envelope: Gross vs Sequestration vs Net Residual Gap'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-neutral-500">10-Yr Removals Total:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              -{fmt(horizonCumulativeRemovals, 0)} tCO₂e
            </span>
          </div>
        </div>

        {/* THE RECHARTS CONTAINER */}
        <div className="h-[420px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'composed' ? (
              <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333333' : '#e5e7eb'} vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${fmt(val / 1000, 1)}k`}
                  label={{
                    value: 'GHG Volume (tCO₂e / yr)',
                    angle: -90,
                    position: 'insideLeft',
                    fontSize: 11,
                    fill: isDark ? '#9ca3af' : '#6b7280',
                    offset: 0,
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                  fontSize={11}
                  tickLine={false}
                  domain={[0, Math.max(100, ...trendData.map((d) => d.sequestrationCoveragePercent * 1.15))]}
                  tickFormatter={(val) => `${val}%`}
                  label={{
                    value: 'Coverage Ratio (%)',
                    angle: 90,
                    position: 'insideRight',
                    fontSize: 11,
                    fill: isDark ? '#9ca3af' : '#6b7280',
                    offset: 0,
                  }}
                />
                <Tooltip content={<CustomTooltip isDark={isDark} fmt={fmt} />} />
                <Legend
                  wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }}
                />
                <ReferenceLine
                  yAxisId="left"
                  x={`${assessmentYear} (Current)`}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Current Year',
                    position: 'top',
                    fill: '#10b981',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                />
                {crossoverYear && (
                  <ReferenceLine
                    yAxisId="left"
                    x={crossoverYear === assessmentYear ? `${crossoverYear} (Current)` : `${crossoverYear}`}
                    stroke="#059669"
                    strokeWidth={2}
                    label={{
                      value: 'Net-Zero Crossover',
                      position: 'insideTopRight',
                      fill: '#059669',
                      fontSize: 10,
                      fontWeight: 'bold',
                    }}
                  />
                )}

                {/* Gross Emissions Bar */}
                <Bar
                  yAxisId="left"
                  dataKey="grossEmissions"
                  name="Gross Annual Emissions"
                  fill="#f59e0b"
                  fillOpacity={isDark ? 0.8 : 0.85}
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />

                {/* Total Sequestration Removals Area (Negative or positive baseline) */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalSequestration"
                  name="Conservation Sequestration"
                  fill="#10b981"
                  stroke="#059669"
                  fillOpacity={0.3}
                  strokeWidth={2.5}
                />

                {/* Net Residual Emissions Line */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="netResidualEmissions"
                  name="Net Residual Footprint"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#2563eb' }}
                  activeDot={{ r: 6 }}
                />

                {/* Coverage % Line on Right Axis */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="sequestrationCoveragePercent"
                  name="Sequestration Offset %"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#8b5cf6' }}
                />
              </ComposedChart>
            ) : viewMode === 'stacked_removals' ? (
              <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333333' : '#e5e7eb'} vertical={false} />
                <XAxis dataKey="label" stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={11} tickLine={false} />
                <YAxis
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${fmt(val / 1000, 1)}k`}
                  label={{
                    value: 'GHG Removals by Category (tCO₂e/yr)',
                    angle: -90,
                    position: 'insideLeft',
                    fontSize: 11,
                    fill: isDark ? '#9ca3af' : '#6b7280',
                  }}
                />
                <Tooltip content={<CustomTooltip isDark={isDark} fmt={fmt} />} />
                <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }} />
                <ReferenceLine
                  x={`${assessmentYear} (Current)`}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{ value: 'Current Year', position: 'top', fill: '#10b981', fontSize: 10 }}
                />

                {/* Stacked Areas for Sequestration Components */}
                <Area
                  type="monotone"
                  dataKey="forestConservationSeq"
                  name="Forest Conservation"
                  stackId="removals"
                  fill="#059669"
                  stroke="#047857"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="peatlandConservationSeq"
                  name="Peatland Rewetting"
                  stackId="removals"
                  fill="#0d9488"
                  stroke="#0f766e"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="nonForestConservationSeq"
                  name="Riparian & Non-Forest"
                  stackId="removals"
                  fill="#0284c7"
                  stroke="#0369a1"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="standingRetiredPalmSeq"
                  name="Standing Retired Palms"
                  stackId="removals"
                  fill="#6366f1"
                  stroke="#4f46e5"
                  fillOpacity={0.8}
                />

                {/* Gross Emissions as reference line */}
                <Line
                  type="monotone"
                  dataKey="grossEmissions"
                  name="Gross Annual Emissions (Target to Offset)"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#f59e0b' }}
                />
              </ComposedChart>
            ) : (
              /* Decarbonisation & Residual Gap View */
              <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333333' : '#e5e7eb'} vertical={false} />
                <XAxis dataKey="label" stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={11} tickLine={false} />
                <YAxis
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${fmt(val / 1000, 1)}k`}
                  label={{
                    value: 'Emissions Residual Gap (tCO₂e/yr)',
                    angle: -90,
                    position: 'insideLeft',
                    fontSize: 11,
                    fill: isDark ? '#9ca3af' : '#6b7280',
                  }}
                />
                <Tooltip content={<CustomTooltip isDark={isDark} fmt={fmt} />} />
                <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }} />
                <ReferenceLine y={0} stroke="#6b7280" />

                <Area
                  type="monotone"
                  dataKey="grossEmissions"
                  name="Gross Emissions Baseline"
                  fill="#fef3c7"
                  stroke="#d97706"
                  strokeWidth={2}
                  fillOpacity={isDark ? 0.2 : 0.4}
                />
                <Area
                  type="monotone"
                  dataKey="netResidualEmissions"
                  name="Residual Gap (Unmitigated Liability)"
                  fill="#fee2e2"
                  stroke="#dc2626"
                  strokeWidth={2.5}
                  fillOpacity={isDark ? 0.3 : 0.5}
                />
                <Line
                  type="monotone"
                  dataKey="totalSequestration"
                  name="Total Conservation Removals"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* DETAILED YEAR-BY-YEAR SUMMARY TABLE */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
              Trajectory Numerical Matrix
            </span>
            <span className="text-xs text-neutral-400">·</span>
            <span className="text-[11px] text-neutral-500">
              Annual Removals Breakdown & Net Emissions Balance
            </span>
          </div>

          <span className="text-[11px] font-mono text-neutral-500">
            {trendData.length} Assessment Periods
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-400 font-semibold">
                <th className="p-2.5">Year</th>
                <th className="p-2.5 text-right">Gross Emissions</th>
                <th className="p-2.5 text-right text-emerald-700 dark:text-emerald-400">Forest Seq</th>
                <th className="p-2.5 text-right text-teal-700 dark:text-teal-400">Peatland Seq</th>
                <th className="p-2.5 text-right text-sky-700 dark:text-sky-400">Riparian Seq</th>
                <th className="p-2.5 text-right font-bold text-emerald-800 dark:text-emerald-300">Total Sequestration</th>
                <th className="p-2.5 text-right text-amber-700 dark:text-amber-400">Avoided</th>
                <th className="p-2.5 text-right font-bold">Net Footprint</th>
                <th className="p-2.5 text-right text-purple-700 dark:text-purple-400">Coverage %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
              {trendData.map((d) => (
                <tr
                  key={d.year}
                  className={`hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 transition-colors ${
                    d.isCurrent
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 font-semibold'
                      : ''
                  }`}
                >
                  <td className="p-2.5 flex items-center gap-1.5 font-sans">
                    <span>{d.year}</span>
                    {d.isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-bold">
                        Current
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-right text-neutral-700 dark:text-neutral-300">
                    {fmt(d.grossEmissions, 0)} t
                  </td>
                  <td className="p-2.5 text-right text-emerald-600">
                    -{fmt(d.forestConservationSeq, 0)}
                  </td>
                  <td className="p-2.5 text-right text-teal-600">
                    -{fmt(d.peatlandConservationSeq, 0)}
                  </td>
                  <td className="p-2.5 text-right text-sky-600">
                    -{fmt(d.nonForestConservationSeq, 0)}
                  </td>
                  <td className="p-2.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                    -{fmt(d.totalSequestration, 0)} t
                  </td>
                  <td className="p-2.5 text-right text-amber-600">
                    -{fmt(d.emissionsAvoided, 0)}
                  </td>
                  <td className={`p-2.5 text-right font-bold ${d.netEmissions <= 0 ? 'text-emerald-600' : 'text-neutral-900 dark:text-neutral-100'}`}>
                    {d.netEmissions <= 0 ? '0 (Net Negative)' : `${fmt(d.netEmissions, 0)} t`}
                  </td>
                  <td className="p-2.5 text-right font-bold text-purple-600 dark:text-purple-400">
                    {d.sequestrationCoveragePercent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* REGULATORY CONTEXT FOOTER */}
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-neutral-800 dark:text-neutral-200">
              PalmGHG V5 & GHG Protocol Land Sector and Removals (LSR) Compliance:
            </strong>{' '}
            Carbon removals from conservation areas (HCV forest, rewetted peat, riparian buffers) are strictly classified under <em>Removals / Sequestration</em> and reported separately from gross Scope 1 biogenic and fossil emissions. In RSPO audits, conservation areas must have documented baseline surveys, GPS boundaries, and operational protection against degradation to qualify for carbon sequestration accounting.
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom Tooltip Component for Recharts
interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  isDark: boolean;
  fmt: (val: number, decimals?: number) => string;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label, isDark, fmt }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload as SequestrationYearData;
  if (!data) return null;

  return (
    <div className={`p-3 rounded-xl shadow-lg border text-xs max-w-xs ${
      isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-200 text-neutral-900'
    }`}>
      <div className="font-bold border-b border-neutral-200 dark:border-neutral-700 pb-1 mb-2 flex items-center justify-between">
        <span>Year {data.year}</span>
        {data.isCurrent && (
          <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-semibold">
            Assessment Baseline
          </span>
        )}
      </div>

      <div className="space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
          <span className="font-sans">Gross Emissions:</span>
          <strong>{fmt(data.grossEmissions, 0)} tCO₂e</strong>
        </div>

        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
          <span className="font-sans">Total Sequestration:</span>
          <strong>-{fmt(data.totalSequestration, 0)} tCO₂e</strong>
        </div>

        <div className="pl-2 border-l border-emerald-500/30 text-[10px] space-y-0.5 text-neutral-500 dark:text-neutral-400">
          <div className="flex justify-between">
            <span>• Forest:</span>
            <span>-{fmt(data.forestConservationSeq, 0)} t</span>
          </div>
          <div className="flex justify-between">
            <span>• Peat Rewetted:</span>
            <span>-{fmt(data.peatlandConservationSeq, 0)} t</span>
          </div>
          <div className="flex justify-between">
            <span>• Riparian/Non-forest:</span>
            <span>-{fmt(data.nonForestConservationSeq, 0)} t</span>
          </div>
          {data.standingRetiredPalmSeq > 0 && (
            <div className="flex justify-between">
              <span>• Retired Palms:</span>
              <span>-{fmt(data.standingRetiredPalmSeq, 0)} t</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center text-blue-600 dark:text-blue-400 pt-1 border-t border-neutral-200 dark:border-neutral-700">
          <span className="font-sans">Net Residual:</span>
          <strong>{fmt(data.netResidualEmissions, 0)} tCO₂e</strong>
        </div>

        <div className="flex justify-between items-center text-purple-600 dark:text-purple-400">
          <span className="font-sans">Offset Coverage:</span>
          <strong>{data.sequestrationCoveragePercent}%</strong>
        </div>
      </div>
    </div>
  );
};
