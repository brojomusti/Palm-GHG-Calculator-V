import React, { useState, useMemo } from 'react';
import { PalmGHGAssessmentResults } from '../types/palmghg';
import { MassUnit } from '../utils/unitConversion';
import {
  Target,
  TrendingDown,
  Calendar,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Flame,
  Leaf,
  Layers,
  Sparkles,
  Sliders,
  RotateCcw,
  Building2,
  Users,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

interface Props {
  results: PalmGHGAssessmentResults;
  assessmentYear?: number;
  massUnit?: MassUnit;
}

export const GhgReductionTargetModule: React.FC<Props> = ({
  results,
  assessmentYear = 2026,
  massUnit = 'metric',
}) => {
  const [targetYear, setTargetYear] = useState<number>(2030);
  const [metricMode, setMetricMode] = useState<'intensity' | 'total'>('intensity');
  const [targetReductionPercent, setTargetReductionPercent] = useState<number>(30); // 30% reduction by default
  const [activePreset, setActivePreset] = useState<
    'custom' | 'rspo_benchmark' | 'sbti_15c' | 'aggressive_50' | 'net_zero'
  >('sbti_15c');

  // Simulated Abatement Levers state
  const [enabledLevers, setEnabledLevers] = useState<{
    methaneCapture: boolean;
    peatWaterTable: boolean;
    fertiliserInhibitor: boolean;
    biomassExport: boolean;
    smallholderScope3: boolean;
  }>({
    methaneCapture: true,
    peatWaterTable: true,
    fertiliserInhibitor: false,
    biomassExport: true,
    smallholderScope3: false,
  });

  const fmt = (val: number, decimals: number = 2) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  // Base Values
  const baselineIntensity = results.netGhgPerTonCpo;
  const baselineTotalNet = results.totalNetEmissions;

  // Selected Target Values
  const targetIntensity = baselineIntensity * (1 - targetReductionPercent / 100);
  const targetTotalNet = baselineTotalNet * (1 - targetReductionPercent / 100);

  const currentBaselineVal = metricMode === 'intensity' ? baselineIntensity : baselineTotalNet;
  const currentTargetVal = metricMode === 'intensity' ? targetIntensity : targetTotalNet;
  const absoluteGap = Math.max(0, currentBaselineVal - currentTargetVal);
  const yearsRemaining = Math.max(1, targetYear - assessmentYear);
  const requiredAnnualReduction = absoluteGap / yearsRemaining;

  // Abatement Levers Estimation (in tCO2e/t CPO and tCO2e/yr)
  const abatementLevers = useMemo(() => {
    // 1. Methane Capture (Biogas capture & utilization)
    const methaneCpoReduction = Math.min(0.38, baselineIntensity * 0.28);
    const methaneTotalReduction = baselineTotalNet * 0.28;

    // 2. Peat Soil Drainage Control (water table at 40cm, -30% oxidation)
    const peatCpoReduction = (results.estateScope1Peat / (results.totalCpoProducedTon || 1)) * 0.30;
    const peatTotalReduction = results.estateScope1Peat * 0.30;

    // 3. Fertiliser Inhibitors (NI/UI adoption, -35% field N2O)
    const fertCpoReduction = (results.estateScope1FertiliserApp / (results.totalCpoProducedTon || 1)) * 0.35;
    const fertTotalReduction = results.estateScope1FertiliserApp * 0.35;

    // 4. Biomass Export & Excess Electricity (Avoided emissions)
    const biomassCpoReduction = 0.12;
    const biomassTotalReduction = (results.totalCpoProducedTon || 40000) * 0.12;

    // 5. Smallholder Scope 3 Supply Decarbonization
    const smallholderCpoReduction = (results.totalMillScope3 / (results.totalCpoProducedTon || 1)) * 0.25;
    const smallholderTotalReduction = results.totalMillScope3 * 0.25;

    return [
      {
        id: 'methaneCapture',
        name: 'Penangkapan & Pemanfaatan Biogas POME',
        scope: 'Scope 1 (PKS - Kendali Langsung 100%)',
        description: 'Pemasangan covered lagoon / digester tank 98% efisiensi dengan gas engine atau enclosed flare (99,5%).',
        reductionCpo: methaneCpoReduction,
        reductionTotal: methaneTotalReduction,
        icon: Flame,
        color: 'text-amber-600',
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      },
      {
        id: 'peatWaterTable',
        name: 'Pengendalian Muka Air Gambut (Water Table 40-50 cm)',
        scope: 'Scope 1 (Kebun Sendiri - Kendali Langsung)',
        description: 'Pemasangan sekat kanal (canal blocking) dan monitoring muka air untuk menekan laju oksidasi gambut hingga 30%.',
        reductionCpo: peatCpoReduction,
        reductionTotal: peatTotalReduction,
        icon: Leaf,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      },
      {
        id: 'fertiliserInhibitor',
        name: 'Adopsi Pupuk Berinhibitor Nitrifikasi (NI / UI)',
        scope: 'Scope 1 (Kebun Sendiri - Pengadaan Pupuk)',
        description: 'Substitusi pupuk urea/ZA konvensional dengan pupuk ber-inhibitor untuk memotong emisi langsung N₂O tanah sebesar 35%.',
        reductionCpo: fertCpoReduction,
        reductionTotal: fertTotalReduction,
        icon: Sparkles,
        color: 'text-purple-600',
        bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
      },
      {
        id: 'biomassExport',
        name: 'Ekspor Biomassa (Cangkang/Serat) & Listrik Hijau',
        scope: 'Optional Avoided (PKS & Pembangkit Listrik)',
        description: 'Pemanfaatan serat mesokarp & PKS surplus untuk menggantikan batubara industri atau ekspor listrik ke jaringan PLN.',
        reductionCpo: biomassCpoReduction,
        reductionTotal: biomassTotalReduction,
        icon: Zap,
        color: 'text-teal-600',
        bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
      },
      {
        id: 'smallholderScope3',
        name: 'Dekarbonisasi Rantai Pasok TBS Petani Swadaya (Scope 3)',
        scope: 'Scope 3 Cat 1 & Cat 4 (Pengaruh Operasional)',
        description: 'Pendampingan sertifikasi RSPO petani mandiri, optimasi rute logistik TBS, dan pelatihan efisiensi pemupukan.',
        reductionCpo: smallholderCpoReduction,
        reductionTotal: smallholderTotalReduction,
        icon: Users,
        color: 'text-sky-600',
        bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800',
      },
    ];
  }, [results, baselineIntensity, baselineTotalNet]);

  // Total Simulated Abatement
  const totalSimulatedAbatement = useMemo(() => {
    let cpoSum = 0;
    let totalSum = 0;

    abatementLevers.forEach((lever) => {
      if (enabledLevers[lever.id as keyof typeof enabledLevers]) {
        cpoSum += lever.reductionCpo;
        totalSum += lever.reductionTotal;
      }
    });

    return {
      cpo: cpoSum,
      total: totalSum,
      activeMetric: metricMode === 'intensity' ? cpoSum : totalSum,
    };
  }, [abatementLevers, enabledLevers, metricMode]);

  // Remaining Gap after simulated levers
  const remainingGap = Math.max(0, absoluteGap - totalSimulatedAbatement.activeMetric);
  const gapClosurePercent = absoluteGap > 0 ? Math.min(100, (totalSimulatedAbatement.activeMetric / absoluteGap) * 100) : 100;

  // Presets Handlers
  const handleApplyPreset = (preset: typeof activePreset) => {
    setActivePreset(preset);
    switch (preset) {
      case 'rspo_benchmark':
        // Target 1.00 tCO2e/t CPO
        if (baselineIntensity > 1.0) {
          const pct = ((baselineIntensity - 1.0) / baselineIntensity) * 100;
          setTargetReductionPercent(Math.round(pct));
        } else {
          setTargetReductionPercent(15);
        }
        setTargetYear(2028);
        break;
      case 'sbti_15c':
        // 42% reduction by 2030 (SBTi 1.5°C standard)
        setTargetReductionPercent(42);
        setTargetYear(2030);
        break;
      case 'aggressive_50':
        // 50% reduction by 2030
        setTargetReductionPercent(50);
        setTargetYear(2030);
        break;
      case 'net_zero':
        // 80% reduction by 2035 (Net Zero trajectory with permanent removals)
        setTargetReductionPercent(80);
        setTargetYear(2035);
        break;
      default:
        break;
    }
  };

  // Trajectory Chart Data Generation (Recharts)
  const trajectoryChartData = useMemo(() => {
    const data = [];
    const totalSteps = Math.max(1, targetYear - assessmentYear);

    for (let yr = assessmentYear; yr <= targetYear; yr++) {
      const step = yr - assessmentYear;
      const progress = step / totalSteps;

      // Business as usual (slight 1% annual creep without action)
      const bauIntensity = Number((baselineIntensity * (1 + 0.008 * step)).toFixed(2));
      const bauTotal = Math.round(baselineTotalNet * (1 + 0.008 * step));

      // Target Linear Glidepath
      const targetLinearIntensity = Number((baselineIntensity - (baselineIntensity - targetIntensity) * progress).toFixed(2));
      const targetLinearTotal = Math.round(baselineTotalNet - (baselineTotalNet - targetTotalNet) * progress);

      // Lever-Assisted Projection Trajectory
      const maxLevers = totalSimulatedAbatement.activeMetric;
      const leverAssistedVal = metricMode === 'intensity'
        ? Number((baselineIntensity - maxLevers * Math.min(1, progress * 1.25)).toFixed(2))
        : Math.round(baselineTotalNet - maxLevers * Math.min(1, progress * 1.25));

      data.push({
        year: yr.toString(),
        yearNum: yr,
        bau: metricMode === 'intensity' ? bauIntensity : bauTotal,
        target: metricMode === 'intensity' ? targetLinearIntensity : targetLinearTotal,
        withLevers: leverAssistedVal,
      });
    }

    return data;
  }, [assessmentYear, targetYear, baselineIntensity, targetIntensity, baselineTotalNet, targetTotalNet, metricMode, totalSimulatedAbatement]);

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-5">
      {/* Module Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 mt-0.5 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Operational Control Decarbonization Roadmap
              </span>
              <span className="text-xs text-neutral-300 dark:text-neutral-700">·</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                Target & Gap Analysis Engine
              </span>
            </div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
              Penetapan Target Pengurangan Emisi GRK & Analisis Kesenjangan (Baseline Gap)
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5 max-w-3xl">
              Tetapkan target penurunan emisi tahunan berbasis kendali operasional (Scope 1 & 2 terkelola langsung vs Scope 3 rantai pasok) dan hitung kesenjangan terhadap baseline PalmGHG V5.
            </p>
          </div>
        </div>

        {/* Metric Selector Toggle (Intensity vs Total) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMetricMode('intensity')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                metricMode === 'intensity'
                  ? 'bg-white dark:bg-neutral-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Intensitas (tCO₂e / t CPO)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('total')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                metricMode === 'total'
                  ? 'bg-white dark:bg-neutral-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Total Emisi (tCO₂e / thn)
            </button>
          </div>
        </div>
      </div>

      {/* Target Setting Presets & Sliders Panel */}
      <div className="p-4 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700/80 space-y-4">
        {/* Preset Selector Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Pilih Skema Target Penurunan Emisi:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleApplyPreset('rspo_benchmark')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activePreset === 'rspo_benchmark'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
              }`}
            >
              RSPO Best Practice (≤1.0 t/t)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('sbti_15c')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activePreset === 'sbti_15c'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
              }`}
            >
              SBTi 1.5°C (-42% / 2030)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('aggressive_50')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activePreset === 'aggressive_50'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
              }`}
            >
              Agresif (-50% / 2030)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('net_zero')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activePreset === 'net_zero'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
              }`}
            >
              Net Zero Roadmap (-80% / 2035)
            </button>
          </div>
        </div>

        {/* Interactive Sliders & Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {/* Target Reduction Percentage Slider */}
          <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Target Pengurangan Emisi (%):
              </span>
              <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                -{targetReductionPercent}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="90"
              step="1"
              value={targetReductionPercent}
              onChange={(e) => {
                setTargetReductionPercent(Number(e.target.value));
                setActivePreset('custom');
              }}
              className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
              <span>Min: -5%</span>
              <span>Moderat: -30%</span>
              <span>Net Zero: -80%</span>
            </div>
          </div>

          {/* Target Milestone Year Selector */}
          <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Tahun Target Pencapaian:
              </span>
              <span className="text-sm font-bold font-mono text-neutral-900 dark:text-neutral-100 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                {targetYear} ({yearsRemaining} tahun lagi)
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 pt-1">
              {[2028, 2030, 2032, 2035].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => {
                    setTargetYear(yr);
                    setActivePreset('custom');
                  }}
                  className={`py-1 rounded text-xs font-semibold transition-colors ${
                    targetYear === yr
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {/* Target Value Preview */}
          <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-1">
            <div className="text-[11px] font-semibold text-neutral-500">
              Hasil Target Emisi ({targetYear}):
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {metricMode === 'intensity' ? fmt(targetIntensity, 2) : fmt(targetTotalNet, 0)}
              </span>
              <span className="text-xs text-neutral-500">
                {metricMode === 'intensity' ? 'tCO₂e / t CPO' : 'tCO₂e / tahun'}
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              Baseline: {metricMode === 'intensity' ? fmt(baselineIntensity, 2) : fmt(baselineTotalNet, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPI Summary Cards (Baseline vs Target vs Gap vs Run-rate) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Current Baseline */}
        <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <div className="text-[11px] font-medium text-neutral-500 flex items-center justify-between">
            <span>Baseline Saat Ini ({assessmentYear})</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
              Terverifikasi
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {metricMode === 'intensity' ? fmt(baselineIntensity, 2) : fmt(baselineTotalNet, 0)}
            </span>
            <span className="text-xs text-neutral-500">
              {metricMode === 'intensity' ? 'tCO₂e/t' : 'tCO₂e'}
            </span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">
            Scope 1 & 2: {fmt(results.totalScope1 + results.totalScope2, 0)} tCO₂e
          </div>
        </div>

        {/* Card 2: Target Goal */}
        <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <div className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <span>Target Emisi ({targetYear})</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
              -{targetReductionPercent}%
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
              {metricMode === 'intensity' ? fmt(currentTargetVal, 2) : fmt(currentTargetVal, 0)}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400">
              {metricMode === 'intensity' ? 'tCO₂e/t' : 'tCO₂e'}
            </span>
          </div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
            Komitmen dekarbonisasi jangka menengah
          </div>
        </div>

        {/* Card 3: Emission Gap */}
        <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="text-[11px] font-medium text-amber-800 dark:text-amber-300 flex items-center justify-between">
            <span>Kesenjangan Emisi (Gap)</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
              Harus Ditutup
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300">
              {metricMode === 'intensity' ? fmt(absoluteGap, 2) : fmt(absoluteGap, 0)}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {metricMode === 'intensity' ? 'tCO₂e/t' : 'tCO₂e'}
            </span>
          </div>
          <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
            Gap closure: {fmt(gapClosurePercent, 0)}% via tuas teraktivasi
          </div>
        </div>

        {/* Card 4: Required Annual Run-Rate */}
        <div className="p-3.5 bg-sky-50/60 dark:bg-sky-950/20 rounded-xl border border-sky-200 dark:border-sky-800">
          <div className="text-[11px] font-medium text-sky-800 dark:text-sky-300 flex items-center justify-between">
            <span>Target Laju Reduksi Tahunan</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-200 dark:bg-sky-900 text-sky-900 dark:text-sky-200 font-mono">
              {yearsRemaining} Tahun
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-bold font-mono text-sky-700 dark:text-sky-300">
              -{metricMode === 'intensity' ? fmt(requiredAnnualReduction, 3) : fmt(requiredAnnualReduction, 0)}
            </span>
            <span className="text-xs text-sky-600 dark:text-sky-400">
              {metricMode === 'intensity' ? 't/t/thn' : 't/thn'}
            </span>
          </div>
          <div className="text-[10px] text-sky-700 dark:text-sky-400 mt-0.5">
            Laju penurunan rata-rata yang konsisten
          </div>
        </div>
      </div>

      {/* Trajectory Projection Chart (Recharts) */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-600" />
              Proyeksi Lintasan Dekarbonisasi ({assessmentYear} – {targetYear})
            </h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Simulasi perbandingan lintasan emisi: Tanpa Aksi (BAU) vs Target Linier vs Implementasi Tuas Operasional.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-neutral-400 inline-block" />
              <span className="text-neutral-600 dark:text-neutral-400 text-[11px]">BAU (Tanpa Aksi)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 inline-block stroke-dasharray" />
              <span className="text-neutral-600 dark:text-neutral-400 text-[11px]">Target Linier</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">Dengan Tuas Pilihan</span>
            </div>
          </div>
        </div>

        <div className="h-56 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trajectoryChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <XAxis dataKey="year" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
              <YAxis
                stroke="#9ca3af"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(v) =>
                  metricMode === 'intensity' ? `${v.toFixed(1)}` : `${(v / 1000).toFixed(0)}k`
                }
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="p-2.5 rounded-lg bg-neutral-900/95 text-white text-xs shadow-xl border border-neutral-700 space-y-1">
                      <div className="font-bold text-neutral-300 pb-1 border-b border-neutral-700">
                        Tahun {data.year}
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-neutral-400">BAU (Tanpa Aksi):</span>
                        <span className="font-mono text-neutral-300">
                          {metricMode === 'intensity' ? `${data.bau} t/t` : `${data.bau.toLocaleString()} t`}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-amber-400">Target Linier:</span>
                        <span className="font-mono font-semibold text-amber-400">
                          {metricMode === 'intensity' ? `${data.target} t/t` : `${data.target.toLocaleString()} t`}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-emerald-400">Dengan Tuas Terpilih:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {metricMode === 'intensity' ? `${data.withLevers} t/t` : `${data.withLevers.toLocaleString()} t`}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="bau"
                stroke="#9ca3af"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                name="BAU"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: '#f59e0b' }}
                name="Target"
              />
              <Line
                type="monotone"
                dataKey="withLevers"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981' }}
                name="Dengan Tuas"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Operational Decarbonization Abatement Levers (Interactive Simulator) */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Simulasi Tuas Dekarbonisasi Berbasis Kendali Operasional
            </h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Centang tuas dekarbonisasi untuk memproyeksikan kontribusi penutupan kesenjangan emisi (Closing the Gap).
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-neutral-500">Sisa Kesenjangan (Remaining Gap): </span>
            <span className={`font-mono text-sm font-bold ${remainingGap === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {metricMode === 'intensity' ? fmt(remainingGap, 2) : fmt(remainingGap, 0)} {metricMode === 'intensity' ? 't/t CPO' : 'tCO₂e'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {abatementLevers.map((lever) => {
            const isEnabled = enabledLevers[lever.id as keyof typeof enabledLevers];
            const Icon = lever.icon;
            const reductionDisplay = metricMode === 'intensity'
              ? `-${fmt(lever.reductionCpo, 2)} tCO₂e/t CPO`
              : `-${fmt(lever.reductionTotal, 0)} tCO₂e/thn`;

            return (
              <div
                key={lever.id}
                onClick={() =>
                  setEnabledLevers((prev) => ({
                    ...prev,
                    [lever.id]: !prev[lever.id as keyof typeof prev],
                  }))
                }
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isEnabled
                    ? `${lever.bg} shadow-xs`
                    : 'bg-neutral-50/70 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 opacity-60 hover:opacity-90'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => {}} // handled by parent div
                    className="w-4 h-4 mt-0.5 text-emerald-600 rounded cursor-pointer accent-emerald-600 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${lever.color}`} />
                        {lever.name}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-white/80 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">
                        {lever.scope}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                      {lever.description}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-xs font-mono font-bold px-2 py-1 rounded-lg ${isEnabled ? 'bg-white/80 dark:bg-neutral-800 text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-neutral-500'}`}>
                    {reductionDisplay}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gap Closure Progress Bar */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              Tingkat Penutupan Kesenjangan Emisi (Gap Closure Progress):
            </span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              {fmt(gapClosurePercent, 1)}%
            </span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                gapClosurePercent >= 100 ? 'bg-emerald-600' : 'bg-emerald-500'
              }`}
              style={{ width: `${gapClosurePercent}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-500">
            {gapClosurePercent >= 100
              ? 'Target pengurangan emisi Anda terbukti dapat tercapai sepenuhnya dengan mengaktifkan tuas operasional terpilih!'
              : `Masih terdapat kesenjangan ${fmt(100 - gapClosurePercent, 1)}% untuk mencapai target tahun ${targetYear}. Pertimbangkan peningkatan adopsi inhibitor pupuk dan sertifikasi petani swadaya.`}
          </p>
        </div>
      </div>
    </div>
  );
};
