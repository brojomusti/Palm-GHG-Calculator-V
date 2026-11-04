import React, { useState, useMemo } from 'react';
import {
  EstateParameters,
  MillParameters,
  FFBSourceAllocation,
  PalmGHGAssessmentResults,
} from '../types/palmghg';
import { calculatePalmGHGV5 } from '../utils/palmghgCalculations';
import {
  Sliders,
  TrendingDown,
  TrendingUp,
  Activity,
  Layers,
  Sprout,
  Flame,
  Fuel,
  Droplets,
  Percent,
  Sparkles,
  Info,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

interface Props {
  estate: EstateParameters;
  mill: MillParameters;
  ffbSources: FFBSourceAllocation[];
  baselineResults: PalmGHGAssessmentResults;
  isDark?: boolean;
}

export interface ParameterSensitivityResult {
  id: string;
  name: string;
  category: 'Agronomy & Yield' | 'Fertiliser' | 'POME & Methane' | 'Peat Soil' | 'Energy & Fuel' | 'Mill Processing' | 'Land Use';
  icon: string;
  baselineParamValue: string;
  lowParamValue: string;
  highParamValue: string;
  
  // -10% Results
  lowNetEmissions: number;
  lowDeltaNetEmissions: number;
  lowDeltaPercent: number;
  lowNetCpo: number;
  lowDeltaNetCpo: number;

  // +10% Results
  highNetEmissions: number;
  highDeltaNetEmissions: number;
  highDeltaPercent: number;
  highNetCpo: number;
  highDeltaNetCpo: number;

  // Elasticity metrics
  totalSwingTco2e: number;
  totalSwingPercent: number;
  elasticityIndex: number; // % change in net emissions / % change in parameter
  rank: number;
  direction: 'direct' | 'inverse'; // direct = +param -> +GHG; inverse = +param -> -GHG
  operationalLever: string;
}

export const SensitivityAnalysis: React.FC<Props> = ({
  estate,
  mill,
  ffbSources,
  baselineResults,
  isDark = false,
}) => {
  // Configurable variance step (default: 10% as requested)
  const [variancePercent, setVariancePercent] = useState<number>(10);
  const [metricView, setMetricView] = useState<'total' | 'intensity'>('total');
  const [selectedParamId, setSelectedParamId] = useState<string>('fert');

  // Format helper
  const fmt = (val: number, decimals: number = 1) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  // Calculate sensitivity for each key parameter at -variancePercent and +variancePercent
  const sensitivityData = useMemo<ParameterSensitivityResult[]>(() => {
    const factor = variancePercent / 100;
    const baseNet = baselineResults.totalNetEmissions;
    const baseNetCpo = baselineResults.netGhgPerTonCpo;

    // Helper to calculate delta and construct result
    const evaluateSensitivity = (
      id: string,
      name: string,
      category: ParameterSensitivityResult['category'],
      icon: string,
      baselineParamValue: string,
      lowParamValue: string,
      highParamValue: string,
      lowEstate: EstateParameters,
      lowMill: MillParameters,
      lowSources: FFBSourceAllocation[],
      highEstate: EstateParameters,
      highMill: MillParameters,
      highSources: FFBSourceAllocation[],
      operationalLever: string
    ): Omit<ParameterSensitivityResult, 'rank'> => {
      const lowRes = calculatePalmGHGV5(lowEstate, lowMill, lowSources);
      const highRes = calculatePalmGHGV5(highEstate, highMill, highSources);

      const lowDeltaNet = lowRes.totalNetEmissions - baseNet;
      const lowDeltaPct = baseNet !== 0 ? (lowDeltaNet / Math.abs(baseNet)) * 100 : 0;
      const lowDeltaCpo = lowRes.netGhgPerTonCpo - baseNetCpo;

      const highDeltaNet = highRes.totalNetEmissions - baseNet;
      const highDeltaPct = baseNet !== 0 ? (highDeltaNet / Math.abs(baseNet)) * 100 : 0;
      const highDeltaCpo = highRes.netGhgPerTonCpo - baseNetCpo;

      const totalSwingTco2e = Math.abs(highRes.totalNetEmissions - lowRes.totalNetEmissions);
      const totalSwingPercent = baseNet !== 0 ? (totalSwingTco2e / Math.abs(baseNet)) * 100 : 0;
      const elasticityIndex = (totalSwingPercent / (2 * variancePercent));
      const direction: 'direct' | 'inverse' = highRes.totalNetEmissions > lowRes.totalNetEmissions ? 'direct' : 'inverse';

      return {
        id,
        name,
        category,
        icon,
        baselineParamValue,
        lowParamValue,
        highParamValue,
        lowNetEmissions: lowRes.totalNetEmissions,
        lowDeltaNetEmissions: lowDeltaNet,
        lowDeltaPercent: lowDeltaPct,
        lowNetCpo: lowRes.netGhgPerTonCpo,
        lowDeltaNetCpo: lowDeltaCpo,
        highNetEmissions: highRes.totalNetEmissions,
        highDeltaNetEmissions: highDeltaNet,
        highDeltaPercent: highDeltaPct,
        highNetCpo: highRes.netGhgPerTonCpo,
        highDeltaNetCpo: highDeltaCpo,
        totalSwingTco2e,
        totalSwingPercent,
        elasticityIndex,
        direction,
        operationalLever,
      };
    };

    // 1. FFB Yield (ton FFB/ha)
    // When FFB yield changes by +/- factor, throughput and CPO production scale accordingly
    const baseTotalFfb = ffbSources.reduce((acc, s) => acc + s.ffbVolumeTon, 0);
    const lowSourcesFfb = ffbSources.map((s) => ({
      ...s,
      ffbVolumeTon: s.ffbVolumeTon * (1 - factor),
      yieldTonPerHa: (s.yieldTonPerHa || 20) * (1 - factor),
    }));
    const highSourcesFfb = ffbSources.map((s) => ({
      ...s,
      ffbVolumeTon: s.ffbVolumeTon * (1 + factor),
      yieldTonPerHa: (s.yieldTonPerHa || 20) * (1 + factor),
    }));
    const resYield = evaluateSensitivity(
      'yield',
      'FFB Yield & Production',
      'Agronomy & Yield',
      'sprout',
      `${fmt(baseTotalFfb, 0)} t/yr (avg 20.5 t/ha)`,
      `${fmt(baseTotalFfb * (1 - factor), 0)} t/yr (-${variancePercent}%)`,
      `${fmt(baseTotalFfb * (1 + factor), 0)} t/yr (+${variancePercent}%)`,
      estate,
      mill,
      lowSourcesFfb,
      estate,
      mill,
      highSourcesFfb,
      'Optimizing crop yield dilutes fixed land emissions (LUC, peat, infrastructure) over larger CPO tonnage, lowering intensity.'
    );

    // 2. Synthetic Fertiliser Usage (N, P2O5, K2O)
    const totalNkg = estate.syntheticNStandardKg + estate.syntheticNInhibitedKg;
    const lowEstateFert: EstateParameters = {
      ...estate,
      syntheticNStandardKg: estate.syntheticNStandardKg * (1 - factor),
      syntheticNInhibitedKg: estate.syntheticNInhibitedKg * (1 - factor),
      syntheticP2O5Kg: estate.syntheticP2O5Kg * (1 - factor),
      syntheticK2OKg: estate.syntheticK2OKg * (1 - factor),
      rockPhosphateKg: estate.rockPhosphateKg * (1 - factor),
    };
    const highEstateFert: EstateParameters = {
      ...estate,
      syntheticNStandardKg: estate.syntheticNStandardKg * (1 + factor),
      syntheticNInhibitedKg: estate.syntheticNInhibitedKg * (1 + factor),
      syntheticP2O5Kg: estate.syntheticP2O5Kg * (1 + factor),
      syntheticK2OKg: estate.syntheticK2OKg * (1 + factor),
      rockPhosphateKg: estate.rockPhosphateKg * (1 + factor),
    };
    const resFert = evaluateSensitivity(
      'fert',
      'Fertiliser Usage (N, P, K)',
      'Fertiliser',
      'layers',
      `${fmt(totalNkg, 0)} kg N total`,
      `${fmt(totalNkg * (1 - factor), 0)} kg N (-${variancePercent}%)`,
      `${fmt(totalNkg * (1 + factor), 0)} kg N (+${variancePercent}%)`,
      lowEstateFert,
      mill,
      ffbSources,
      highEstateFert,
      mill,
      ffbSources,
      'Direct N2O and upstream manufacturing emissions drop with 4R nutrient stewardship and urease/nitrification inhibitor adoption.'
    );

    // 3. POME Methane Capture Efficiency (%)
    const baseMethaneEff = mill.methaneCaptureEfficiencyPercent;
    const lowMillMethane: MillParameters = {
      ...mill,
      methaneCaptureEfficiencyPercent: Math.max(0, baseMethaneEff * (1 - factor)),
    };
    const highMillMethane: MillParameters = {
      ...mill,
      methaneCaptureEfficiencyPercent: Math.min(99.5, baseMethaneEff * (1 + factor)),
    };
    const resMethane = evaluateSensitivity(
      'methane',
      'POME Methane Capture Efficiency',
      'POME & Methane',
      'flame',
      `${fmt(baseMethaneEff, 1)}%`,
      `${fmt(lowMillMethane.methaneCaptureEfficiencyPercent, 1)}% (-${variancePercent}%)`,
      `${fmt(highMillMethane.methaneCaptureEfficiencyPercent, 1)}% (+${variancePercent}%)`,
      estate,
      lowMillMethane,
      ffbSources,
      estate,
      highMillMethane,
      ffbSources,
      'Anaerobic biogas digester flaring/biogas power avoids raw CH4 venting from open wastewater lagoons (GWP = 28).'
    );

    // 4. Peat Soil Drainage / Water Table Depth (tCO2e/ha)
    // Drainage depth changes peat oxidation emissions proportionally
    const basePeatHa = estate.peatSoilAreaHa;
    const lowEstatePeat: EstateParameters = {
      ...estate,
      peatSoilAreaHa: basePeatHa * (1 - factor),
    };
    const highEstatePeat: EstateParameters = {
      ...estate,
      peatSoilAreaHa: basePeatHa * (1 + factor),
    };
    const resPeat = evaluateSensitivity(
      'peat',
      'Peat Soil Emissions & Water Table',
      'Peat Soil',
      'droplets',
      `${fmt(basePeatHa, 0)} ha drained (${fmt(basePeatHa * 54.6, 0)} tCO₂e)`,
      `${fmt(basePeatHa * (1 - factor), 0)} ha eq. (-${variancePercent}%)`,
      `${fmt(basePeatHa * (1 + factor), 0)} ha eq. (+${variancePercent}%)`,
      lowEstatePeat,
      mill,
      ffbSources,
      highEstatePeat,
      mill,
      ffbSources,
      'Maintaining water table at 40-50 cm suppresses microbial aerobic peat decomposition and subsidence emissions.'
    );

    // 5. Fuel / Diesel Consumption (Estate & Mill Machinery)
    const baseTotalDiesel = estate.stationaryFuelDieselLiters + estate.mobileFuelDieselLiters + mill.millStationaryDieselLiters + mill.millMobileDieselLiters;
    const lowEstateFuel: EstateParameters = {
      ...estate,
      stationaryFuelDieselLiters: estate.stationaryFuelDieselLiters * (1 - factor),
      mobileFuelDieselLiters: estate.mobileFuelDieselLiters * (1 - factor),
    };
    const lowMillFuel: MillParameters = {
      ...mill,
      millStationaryDieselLiters: mill.millStationaryDieselLiters * (1 - factor),
      millMobileDieselLiters: mill.millMobileDieselLiters * (1 - factor),
    };
    const highEstateFuel: EstateParameters = {
      ...estate,
      stationaryFuelDieselLiters: estate.stationaryFuelDieselLiters * (1 + factor),
      mobileFuelDieselLiters: estate.mobileFuelDieselLiters * (1 + factor),
    };
    const highMillFuel: MillParameters = {
      ...mill,
      millStationaryDieselLiters: mill.millStationaryDieselLiters * (1 + factor),
      millMobileDieselLiters: mill.millMobileDieselLiters * (1 + factor),
    };
    const resFuel = evaluateSensitivity(
      'fuel',
      'Fossil Diesel Fuel Consumption',
      'Energy & Fuel',
      'fuel',
      `${fmt(baseTotalDiesel, 0)} L/yr`,
      `${fmt(baseTotalDiesel * (1 - factor), 0)} L (-${variancePercent}%)`,
      `${fmt(baseTotalDiesel * (1 + factor), 0)} L (+${variancePercent}%)`,
      lowEstateFuel,
      lowMillFuel,
      ffbSources,
      highEstateFuel,
      highMillFuel,
      ffbSources,
      'Route optimization, electrification of yard prime-movers, and higher biodiesel blending ratios (B35/B40).'
    );

    // 6. CPO Oil Extraction Rate (OER %)
    const baseOer = mill.cpoExtractionRatePercent;
    const lowMillOer: MillParameters = {
      ...mill,
      cpoExtractionRatePercent: Math.max(14, baseOer * (1 - factor)),
    };
    const highMillOer: MillParameters = {
      ...mill,
      cpoExtractionRatePercent: Math.min(28, baseOer * (1 + factor)),
    };
    const resOer = evaluateSensitivity(
      'oer',
      'CPO Extraction Rate (OER)',
      'Mill Processing',
      'percent',
      `${fmt(baseOer, 2)}%`,
      `${fmt(lowMillOer.cpoExtractionRatePercent, 2)}% (-${variancePercent}%)`,
      `${fmt(highMillOer.cpoExtractionRatePercent, 2)}% (+${variancePercent}%)`,
      estate,
      lowMillOer,
      ffbSources,
      estate,
      highMillOer,
      ffbSources,
      'Higher mill pressing recovery efficiency produces more commercial CPO per ton FFB without burning additional energy.'
    );

    // 7. Land Use Change (LUC) Amortised Emissions
    const baseLuc = estate.grossLucTotalTco2e;
    const lowEstateLuc: EstateParameters = {
      ...estate,
      grossLucTotalTco2e: baseLuc * (1 - factor),
    };
    const highEstateLuc: EstateParameters = {
      ...estate,
      grossLucTotalTco2e: baseLuc * (1 + factor),
    };
    const resLuc = evaluateSensitivity(
      'luc',
      'Land Use Change (LUC) Total',
      'Land Use',
      'layers',
      `${fmt(baseLuc, 0)} tCO₂e (${fmt(baseLuc / 25, 0)} t/yr)`,
      `${fmt(baseLuc * (1 - factor), 0)} tCO₂e (-${variancePercent}%)`,
      `${fmt(baseLuc * (1 + factor), 0)} tCO₂e (+${variancePercent}%)`,
      lowEstateLuc,
      mill,
      ffbSources,
      highEstateLuc,
      mill,
      ffbSources,
      'RSPO 25-year linear amortisation. Prioritising planting on low-carbon degraded grassland rather than secondary vegetation.'
    );

    const all = [resYield, resFert, resMethane, resPeat, resFuel, resOer, resLuc];

    // Sort by total swing (largest leverage to smallest leverage) to form a true Tornado ranking
    all.sort((a, b) => b.totalSwingTco2e - a.totalSwingTco2e);

    return all.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [estate, mill, ffbSources, baselineResults, variancePercent]);

  // Selected parameter detail
  const selectedParam = useMemo(() => {
    return sensitivityData.find((p) => p.id === selectedParamId) || sensitivityData[0];
  }, [sensitivityData, selectedParamId]);

  // Tornado Chart Dataset: ordered from rank 1 down to rank 7
  const tornadoChartData = useMemo(() => {
    return sensitivityData.map((p) => {
      // For Tornado chart: show low delta vs high delta relative to baseline (0)
      const lowVal = metricView === 'total' ? p.lowDeltaNetEmissions : p.lowDeltaNetCpo;
      const highVal = metricView === 'total' ? p.highDeltaNetEmissions : p.highDeltaNetCpo;

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        lowVal,
        highVal,
        totalSwing: metricView === 'total' ? p.totalSwingTco2e : Math.abs(p.highDeltaNetCpo - p.lowDeltaNetCpo),
        direction: p.direction,
      };
    });
  }, [sensitivityData, metricView]);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 mt-0.5 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Modul Analisis Sensitivitas Parameter
                </span>
                <span className="text-xs text-neutral-300 dark:text-neutral-700">·</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  RSPO PalmGHG V5 / ISO 14067
                </span>
              </div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                Sensitivity Analysis (±{variancePercent}%) on Net GHG Emissions
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5 max-w-3xl">
                Mengukur elastisitas dan dampak fluktuasi parameter kunci operasional (seperti <strong>FFB yield</strong>, <strong>penggunaan pupuk nitrogen/NPK</strong>, <strong>efisiensi penangkapan metana POME</strong>, dan <strong>pengelolaan gambut</strong>) sebesar <strong>±{variancePercent}%</strong> terhadap total net emisi GRK tahunan dan intensitas per ton CPO.
              </p>
            </div>
          </div>

          {/* Variance Switcher and Metric View Controls */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Variance % selector */}
            <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <span className="text-[11px] font-bold text-neutral-500 px-2">Variasi:</span>
              {[5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setVariancePercent(pct)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    variancePercent === pct
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  ±{pct}%{pct === 10 ? ' (std)' : ''}
                </button>
              ))}
            </div>

            {/* Metric Toggle */}
            <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setMetricView('total')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  metricView === 'total'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Total Net (tCO₂e)
              </button>
              <button
                type="button"
                onClick={() => setMetricView('intensity')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  metricView === 'intensity'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Intensitas (tCO₂e/t CPO)
              </button>
            </div>
          </div>
        </div>

        {/* TOP SUMMARY KPI TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80">
            <span className="text-[11px] font-medium text-neutral-500">Baseline Net Emissions (2026)</span>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
              {fmt(baselineResults.totalNetEmissions, 0)} <span className="text-xs font-normal text-neutral-500">tCO₂e/yr</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5 font-mono">
              Intensitas: <strong>{fmt(baselineResults.netGhgPerTonCpo, 2)}</strong> tCO₂e/t CPO
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                Top Sensitivity Hotspot #1
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 rounded">
                Rank 1
              </span>
            </div>
            <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-1 truncate">
              {sensitivityData[0]?.name}
            </div>
            <div className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
              Swing: ±{fmt(sensitivityData[0]?.totalSwingTco2e / 2, 0)} tCO₂e (±{fmt(sensitivityData[0]?.totalSwingPercent / 2, 1)}%)
            </div>
          </div>

          <div className="p-3.5 bg-sky-50/70 dark:bg-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wide">
                Secondary Hotspot #2
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-sky-200 dark:bg-sky-900 text-sky-900 dark:text-sky-100 rounded">
                Rank 2
              </span>
            </div>
            <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-1 truncate">
              {sensitivityData[1]?.name}
            </div>
            <div className="text-[11px] font-mono font-semibold text-sky-700 dark:text-sky-400 mt-0.5">
              Swing: ±{fmt(sensitivityData[1]?.totalSwingTco2e / 2, 0)} tCO₂e (±{fmt(sensitivityData[1]?.totalSwingPercent / 2, 1)}%)
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                Total Swing Envelope
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 rounded">
                Combined
              </span>
            </div>
            <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              ±{fmt(sensitivityData.reduce((acc, p) => acc + p.totalSwingTco2e, 0) / (2 * sensitivityData.length), 0)} tCO₂e (Avg)
            </div>
            <div className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
              Evaluated across 7 operational variables
            </div>
          </div>
        </div>
      </div>

      {/* TORNADO CHART SECTION (SENSITIVITY RANKING) */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Tornado Chart: Ranking Elastisitas Parameter (Dampak Terhadap Net Emisi)
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Panjang bilah horizontal menunjukkan deviasi emisi (Δ) dari baseline saat parameter diturunkan (-{variancePercent}%) atau dinaikkan (+{variancePercent}%).
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-600 inline-block"></span>
              <span className="text-neutral-600 dark:text-neutral-400">Pengurangan Emisi (Mitigasi)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span>
              <span className="text-neutral-600 dark:text-neutral-400">Peningkatan Emisi (Liability)</span>
            </div>
          </div>
        </div>

        {/* Recharts Diverging / Tornado Horizontal Bar Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={tornadoChartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 160, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#333' : '#e5e7eb'} />
              <XAxis
                type="number"
                domain={['auto', 'auto']}
                tickFormatter={(val) => `${val > 0 ? '+' : ''}${fmt(val, metricView === 'total' ? 0 : 2)}`}
                stroke={isDark ? '#888' : '#666'}
                fontSize={11}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke={isDark ? '#aaa' : '#333'}
                fontSize={12}
                tickLine={false}
                width={150}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    const param = sensitivityData.find((p) => p.id === d.id);
                    if (!param) return null;
                    return (
                      <div className="p-3 bg-neutral-900 text-white rounded-xl shadow-lg border border-neutral-700 text-xs space-y-1.5 min-w-[260px]">
                        <div className="font-bold border-b border-neutral-700 pb-1 text-emerald-400 flex items-center justify-between">
                          <span>{param.name}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">Rank #{param.rank}</span>
                        </div>
                        <div className="text-[11px] text-neutral-300">
                          Baseline: <strong className="text-white font-mono">{param.baselineParamValue}</strong>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800 text-[10px]">
                          <div className="p-1.5 rounded bg-neutral-800/80">
                            <span className="text-neutral-400 block font-semibold">Saat -{variancePercent}%:</span>
                            <span className="font-mono text-emerald-400 font-bold block">
                              {param.lowDeltaNetEmissions > 0 ? '+' : ''}{fmt(metricView === 'total' ? param.lowDeltaNetEmissions : param.lowDeltaNetCpo, metricView === 'total' ? 0 : 2)} {metricView === 'total' ? 't' : 't/t'}
                            </span>
                            <span className="text-neutral-400 text-[9px] block">({fmt(param.lowDeltaPercent, 1)}%)</span>
                          </div>
                          <div className="p-1.5 rounded bg-neutral-800/80">
                            <span className="text-neutral-400 block font-semibold">Saat +{variancePercent}%:</span>
                            <span className="font-mono text-amber-400 font-bold block">
                              {param.highDeltaNetEmissions > 0 ? '+' : ''}{fmt(metricView === 'total' ? param.highDeltaNetEmissions : param.highDeltaNetCpo, metricView === 'total' ? 0 : 2)} {metricView === 'total' ? 't' : 't/t'}
                            </span>
                            <span className="text-neutral-400 text-[9px] block">({fmt(param.highDeltaPercent, 1)}%)</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-neutral-400 pt-1 border-t border-neutral-800">
                          Rentang Swing: <strong>{fmt(metricView === 'total' ? param.totalSwingTco2e : Math.abs(param.highDeltaNetCpo - param.lowDeltaNetCpo), metricView === 'total' ? 0 : 2)}</strong> {metricView === 'total' ? 'tCO₂e' : 'tCO₂e/t CPO'}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine x={0} stroke={isDark ? '#666' : '#999'} strokeWidth={1.5} />
              {/* High value (+variance) bar */}
              <Bar dataKey="highVal" name={`+${variancePercent}%`} radius={[0, 4, 4, 0]}>
                {tornadoChartData.map((entry, index) => (
                  <Cell
                    key={`high-${index}`}
                    fill={entry.highVal > 0 ? '#f59e0b' : '#10b981'}
                  />
                ))}
              </Bar>
              {/* Low value (-variance) bar */}
              <Bar dataKey="lowVal" name={`-${variancePercent}%`} radius={[4, 0, 0, 4]}>
                {tornadoChartData.map((entry, index) => (
                  <Cell
                    key={`low-${index}`}
                    fill={entry.lowVal > 0 ? '#f59e0b' : '#10b981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* COMPREHENSIVE PARAMETER SENSITIVITY MATRIX TABLE */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span>Matriks Lengkap Analisis Sensitivitas (±{variancePercent}%)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-normal">
                Disusun Berdasarkan Tingkat Pengaruh (Elasticity Rank)
              </span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Tabel perbandingan nilai input operasional, delta emisi absolut, persentase perubahan, serta indeks elastisitas.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border border-neutral-200 dark:border-neutral-700">
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold border-b border-neutral-200 dark:border-neutral-700">
                <th className="p-2.5 w-12 text-center">Rank</th>
                <th className="p-2.5 w-48">Parameter Operasional</th>
                <th className="p-2.5 w-32">Kategori</th>
                <th className="p-2.5 w-36">Nilai Baseline</th>
                <th className="p-2.5 w-44 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300">
                  Dampak (-{variancePercent}%)
                </th>
                <th className="p-2.5 w-44 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300">
                  Dampak (+{variancePercent}%)
                </th>
                <th className="p-2.5 w-32 text-right">Rentang Swing (Δ)</th>
                <th className="p-2.5 w-28 text-center">Indeks Elastisitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {sensitivityData.map((param) => {
                const isSelected = selectedParamId === param.id;
                return (
                  <tr
                    key={param.id}
                    onClick={() => setSelectedParamId(param.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 font-medium'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <td className="p-2.5 text-center">
                      <span
                        className={`inline-block w-6 h-6 leading-6 text-center rounded-full text-[11px] font-bold ${
                          param.rank === 1
                            ? 'bg-emerald-600 text-white'
                            : param.rank === 2
                            ? 'bg-sky-600 text-white'
                            : param.rank === 3
                            ? 'bg-amber-600 text-white'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {param.rank}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold text-neutral-900 dark:text-neutral-100">
                      <div className="flex items-center gap-1.5">
                        <span>{param.name}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>}
                      </div>
                    </td>
                    <td className="p-2.5 text-neutral-600 dark:text-neutral-400">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {param.category}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-neutral-700 dark:text-neutral-300">
                      {param.baselineParamValue}
                    </td>

                    {/* -10% Cell */}
                    <td className="p-2.5 bg-emerald-50/30 dark:bg-emerald-950/20">
                      <div className="font-mono font-semibold">
                        {param.lowDeltaNetEmissions > 0 ? '+' : ''}
                        {fmt(param.lowDeltaNetEmissions, 0)} tCO₂e
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {param.lowDeltaPercent > 0 ? '+' : ''}
                        {fmt(param.lowDeltaPercent, 1)}% ({fmt(param.lowNetCpo, 2)} t/t)
                      </div>
                    </td>

                    {/* +10% Cell */}
                    <td className="p-2.5 bg-amber-50/30 dark:bg-amber-950/20">
                      <div className="font-mono font-semibold">
                        {param.highDeltaNetEmissions > 0 ? '+' : ''}
                        {fmt(param.highDeltaNetEmissions, 0)} tCO₂e
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {param.highDeltaPercent > 0 ? '+' : ''}
                        {fmt(param.highDeltaPercent, 1)}% ({fmt(param.highNetCpo, 2)} t/t)
                      </div>
                    </td>

                    {/* Swing Range */}
                    <td className="p-2.5 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      {fmt(param.totalSwingTco2e, 0)} tCO₂e
                      <div className="text-[10px] font-normal text-neutral-500">
                        {fmt(param.totalSwingPercent, 1)}% swing
                      </div>
                    </td>

                    {/* Elasticity index */}
                    <td className="p-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                          param.elasticityIndex >= 0.5
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            : param.elasticityIndex >= 0.2
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                        }`}
                      >
                        {fmt(param.elasticityIndex, 2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SELECTED PARAMETER DEEP DIVE & OPERATIONAL RECOMMENDATION */}
      {selectedParam && (
        <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 font-bold text-xs">
                Rank #{selectedParam.rank}
              </span>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Analisis Rinci & Rekomendasi Aksi: {selectedParam.name}
                </h4>
                <span className="text-xs text-neutral-500">
                  Kategori: {selectedParam.category} · Arah Korelasi: {selectedParam.direction === 'direct' ? 'Positif (Menaikkan Emisi)' : 'Terbalik (Menurunkan Emisi)'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-neutral-500">Rentang Sensitivitas (±{variancePercent}%):</span>
              <div className="text-sm font-mono font-bold text-neutral-900 dark:text-neutral-100">
                ±{fmt(selectedParam.totalSwingTco2e / 2, 0)} tCO₂e / tahun
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <span className="text-[11px] font-semibold text-neutral-500">Kondisi Baseline Saat Ini</span>
              <div className="text-sm font-mono font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                {selectedParam.baselineParamValue}
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                Net Emisi: <strong className="font-mono">{fmt(baselineResults.totalNetEmissions, 0)}</strong> tCO₂e
              </div>
            </div>

            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                Skenario Penurunan -{variancePercent}%
              </span>
              <div className="text-sm font-mono font-bold text-emerald-900 dark:text-emerald-100 mt-1">
                {selectedParam.lowParamValue}
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 font-mono">
                {selectedParam.lowDeltaNetEmissions > 0 ? '+' : ''}{fmt(selectedParam.lowDeltaNetEmissions, 0)} tCO₂e ({fmt(selectedParam.lowDeltaPercent, 1)}%)
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                Skenario Peningkatan +{variancePercent}%
              </span>
              <div className="text-sm font-mono font-bold text-amber-900 dark:text-amber-100 mt-1">
                {selectedParam.highParamValue}
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300 mt-1 font-mono">
                {selectedParam.highDeltaNetEmissions > 0 ? '+' : ''}{fmt(selectedParam.highDeltaNetEmissions, 0)} tCO₂e ({fmt(selectedParam.highDeltaPercent, 1)}%)
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-neutral-100/70 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-start gap-3">
            <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-700 dark:text-neutral-300 space-y-1">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                Rekomendasi Kontrol Operasional PalmGHG V5:
              </div>
              <p>{selectedParam.operationalLever}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
