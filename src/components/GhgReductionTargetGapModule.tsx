import React, { useState, useMemo } from 'react';
import { PalmGHGAssessmentResults } from '../types/palmghg';
import { MassUnit } from '../utils/unitConversion';
import {
  Target,
  TrendingDown,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  Sparkles,
  Percent,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

interface Props {
  results: PalmGHGAssessmentResults;
  assessmentYear?: number;
  massUnit?: MassUnit;
}

type PresetKey = 'rspo_2030' | 'sbti_15' | 'aggressive_pome' | 'net_zero_2050' | 'custom';

export const GhgReductionTargetGapModule: React.FC<Props> = ({
  results,
  assessmentYear = 2026,
  massUnit = 'metric',
}) => {
  // Target Configuration State
  const [targetYear, setTargetYear] = useState<number>(2030);
  const [targetType, setTargetType] = useState<'percent' | 'intensity'>('percent');
  const [targetPercent, setTargetPercent] = useState<number>(30); // 30% reduction default
  const [targetIntensity, setTargetIntensity] = useState<number>(0.85); // tCO2e/t CPO
  const [activePreset, setActivePreset] = useState<PresetKey>('rspo_2030');

  // Baseline figures from current operational assessment
  const baselineNetCpo = results.netGhgPerTonCpo;
  const baselineNetTotal = results.totalNetEmissions;
  const cpoVolume = results.totalCpoProducedTon || 38300;

  // Years count
  const yearsCount = Math.max(1, targetYear - assessmentYear);

  // Apply Presets
  const handleApplyPreset = (preset: PresetKey) => {
    setActivePreset(preset);
    if (preset === 'rspo_2030') {
      setTargetYear(2030);
      setTargetType('percent');
      setTargetPercent(30);
    } else if (preset === 'sbti_15') {
      setTargetYear(2030);
      setTargetType('percent');
      setTargetPercent(42);
    } else if (preset === 'aggressive_pome') {
      setTargetYear(2028);
      setTargetType('percent');
      setTargetPercent(35);
    } else if (preset === 'net_zero_2050') {
      setTargetYear(2050);
      setTargetType('percent');
      setTargetPercent(90);
    }
  };

  // Calculated Target Figures
  const effectiveTargetNetCpo = useMemo(() => {
    if (targetType === 'percent') {
      return Number(Math.max(0.01, baselineNetCpo * (1 - targetPercent / 100)).toFixed(3));
    }
    return Number(Math.max(0.01, targetIntensity).toFixed(3));
  }, [targetType, targetPercent, targetIntensity, baselineNetCpo]);

  const effectiveTargetPercent = useMemo(() => {
    if (targetType === 'percent') return targetPercent;
    if (baselineNetCpo <= 0) return 0;
    return Number((((baselineNetCpo - effectiveTargetNetCpo) / baselineNetCpo) * 100).toFixed(1));
  }, [targetType, targetPercent, baselineNetCpo, effectiveTargetNetCpo]);

  const effectiveTargetTotalNet = useMemo(() => {
    return Math.round(effectiveTargetNetCpo * cpoVolume);
  }, [effectiveTargetNetCpo, cpoVolume]);

  // Gaps to close
  const intensityGap = Math.max(0, baselineNetCpo - effectiveTargetNetCpo);
  const totalInventoryGap = Math.max(0, baselineNetTotal - effectiveTargetTotalNet);

  // Annual required decarbonisation rate
  const annualIntensityReduction = intensityGap / yearsCount;
  const annualTotalReduction = totalInventoryGap / yearsCount;
  const annualRatePercent = effectiveTargetPercent / yearsCount;

  // Trajectory Multi-Year Data for Recharts
  const trajectoryData = useMemo(() => {
    const data = [];
    for (let i = 0; i <= yearsCount; i++) {
      const year = assessmentYear + i;
      const progressFraction = i / yearsCount;
      const projectedIntensity = Number(
        (baselineNetCpo - intensityGap * progressFraction).toFixed(2)
      );
      const projectedTotal = Math.round(baselineNetTotal - totalInventoryGap * progressFraction);
      const cumulativeAbated = Math.round(totalInventoryGap * progressFraction);

      data.push({
        year,
        label: `${year}`,
        projectedIntensity,
        projectedTotal,
        cumulativeAbated,
        isBaseline: i === 0,
        isTarget: i === yearsCount,
        baselineIntensity: Number(baselineNetCpo.toFixed(2)),
        targetCap: Number(effectiveTargetNetCpo.toFixed(2)),
      });
    }
    return data;
  }, [assessmentYear, yearsCount, baselineNetCpo, intensityGap, baselineNetTotal, totalInventoryGap, effectiveTargetNetCpo]);

  // Estimated lever contribution toward closing the gap
  const levers = useMemo(() => {
    const methanePomeEmissions = results.millScope1PomeLagoon + results.millScope1PomeMethaneUncombusted;
    const peatEmissions = results.estateScope1Peat;
    const fertiliserN2o = results.estateScope1FertiliserApp;
    const scope3Ffb = results.millScope3Cat1PurchasedFfb + results.millScope3Cat4FfbTransport;

    // Potential reductions based on RSPO V5 best practices:
    // POME biogas capture: ~80% of open lagoon emissions
    const pomePotential = Math.min(totalInventoryGap * 0.7, methanePomeEmissions * 0.85);
    // Peat water table control (40 cm): ~30% reduction in oxidation flux
    const peatPotential = Math.min(totalInventoryGap * 0.5, peatEmissions * 0.30);
    // NI/UI inhibitors: ~35% reduction in direct soil N2O
    const inhibitorPotential = Math.min(totalInventoryGap * 0.25, fertiliserN2o * 0.35);
    // 3rd party supply engagement: ~20% of Cat 1 Scope 3
    const scope3Potential = Math.min(totalInventoryGap * 0.2, scope3Ffb * 0.20);

    return [
      {
        id: 'pome',
        title: 'Pemasangan Biogas Methane Capture PKS',
        scope: 'Scope 1 Mill (Operasional Terkendali)',
        description: 'Menutup kolam anaerobik terbuka dan memanfaatkan biogas untuk gas engine / boiler.',
        potentialTco2e: pomePotential,
        coveragePct: totalInventoryGap > 0 ? Math.min(100, (pomePotential / totalInventoryGap) * 100) : 0,
        icon: Flame,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      },
      {
        id: 'peat',
        title: 'Manajemen Muka Air Gambut (40–50 cm)',
        scope: 'Scope 1 Estate (Kebun Sendiri)',
        description: 'Pengendalian sekat kanal untuk menekan emisi dekomposisi dan oksidasi tanah gambut.',
        potentialTco2e: peatPotential,
        coveragePct: totalInventoryGap > 0 ? Math.min(100, (peatPotential / totalInventoryGap) * 100) : 0,
        icon: Activity,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      },
      {
        id: 'inhibitor',
        title: 'Penerapan Pupuk Inhibitor (NI / UI)',
        scope: 'Scope 1 Estate (Aplikasi Lapangan)',
        description: 'Substitusi pupuk nitrogen konvensional dengan inhibitor nitrifikasi dan urease.',
        potentialTco2e: inhibitorPotential,
        coveragePct: totalInventoryGap > 0 ? Math.min(100, (inhibitorPotential / totalInventoryGap) * 100) : 0,
        icon: Sparkles,
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
      },
      {
        id: 'scope3',
        title: 'Program Pembinaan Pekebun Swadaya (Third Party)',
        scope: 'Scope 3 Cat 1 & Cat 4 (Rantai Pasok)',
        description: 'Penyuluhan agronomi dan efisiensi logistik pada pekebun independen yang memasok TBS.',
        potentialTco2e: scope3Potential,
        coveragePct: totalInventoryGap > 0 ? Math.min(100, (scope3Potential / totalInventoryGap) * 100) : 0,
        icon: Layers,
        color: 'text-sky-600 dark:text-sky-400',
        bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800',
      },
    ];
  }, [results, totalInventoryGap]);

  const fmt = (val: number, dec: number = 2) =>
    val.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });

  return (
    <div className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 mt-0.5 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Target Setting & Gap Engine
              </span>
              <span className="text-xs text-neutral-300 dark:text-neutral-700">·</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                Operational Control Decarbonisation
              </span>
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
              Penetapan Target Reduksi Emisi GRK & Analisis Kesenjangan (Gap Analysis)
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5 max-w-3xl">
              Tetapkan target dekarbonisasi tahunan (misal target RSPO 2030 atau SBTi 1.5°C), lalu hitung defisit reduksi emisi serta laju penurunan tahunan yang wajib dicapai dari garis dasar (baseline) operasional saat ini.
            </p>
          </div>
        </div>

        {/* Quick Presets Strip */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <span className="text-[11px] font-semibold text-neutral-500 mr-1">Preset Target:</span>
          <button
            type="button"
            onClick={() => handleApplyPreset('rspo_2030')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              activePreset === 'rspo_2030'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
            }`}
          >
            RSPO 2030 (-30%)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('sbti_15')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              activePreset === 'sbti_15'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
            }`}
          >
            SBTi 1.5°C (-42%)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('net_zero_2050')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              activePreset === 'net_zero_2050'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
            }`}
          >
            Net Zero 2050
          </button>
        </div>
      </div>

      {/* Target Configuration Controls */}
      <div className="p-4 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Control 1: Target Year Selection */}
        <div className="space-y-1.5">
          <label className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tahun Target Capaian (Target Year)</span>
          </label>
          <div className="flex items-center gap-2">
            <select
              value={targetYear}
              onChange={(e) => {
                setTargetYear(Number(e.target.value));
                setActivePreset('custom');
              }}
              className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-semibold text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-emerald-500"
            >
              {[2027, 2028, 2029, 2030, 2032, 2035, 2040, 2050].map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr} ({yr - assessmentYear} tahun horizon dari {assessmentYear})
                </option>
              ))}
            </select>
          </div>
          <p className="text-[10px] text-neutral-500">
            Jangka waktu mitigasi: <strong>{yearsCount} tahun</strong> ({assessmentYear} – {targetYear}).
          </p>
        </div>

        {/* Control 2: Target Type & Percent/Intensity Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-blue-600" />
              <span>Bentuk Target Reduksi</span>
            </label>
            <div className="flex items-center gap-1 text-[10px] bg-neutral-200 dark:bg-neutral-700 p-0.5 rounded-md">
              <button
                type="button"
                onClick={() => setTargetType('percent')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  targetType === 'percent' ? 'bg-white dark:bg-neutral-800 font-bold shadow-xs' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Persentase (%)
              </button>
              <button
                type="button"
                onClick={() => setTargetType('intensity')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  targetType === 'intensity' ? 'bg-white dark:bg-neutral-800 font-bold shadow-xs' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Intensitas (t/t CPO)
              </button>
            </div>
          </div>

          {targetType === 'percent' ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-500">Target Pemotongan:</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">-{targetPercent}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                step="5"
                value={targetPercent}
                onChange={(e) => {
                  setTargetPercent(Number(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>-10%</span>
                <span>-30% (RSPO)</span>
                <span>-50%</span>
                <span>-90%</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-500">Batas Maksimal Emisi:</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">{targetIntensity} tCO₂e/t</span>
              </div>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max={baselineNetCpo}
                value={targetIntensity}
                onChange={(e) => {
                  setTargetIntensity(Number(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono font-semibold text-neutral-900 dark:text-neutral-100"
              />
              <div className="text-[10px] text-neutral-400">
                Baseline saat ini: {fmt(baselineNetCpo, 2)} tCO₂e/t CPO.
              </div>
            </div>
          )}
        </div>

        {/* Control 3: Scope & Boundary Context */}
        <div className="space-y-1.5">
          <label className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Batas Kendali Operasional (Operational Scope)</span>
          </label>
          <div className="p-2.5 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1">
            <div className="flex justify-between">
              <span>Fasilitas Terkendali (Scope 1 & 2):</span>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">Direct Policy Authority</span>
            </div>
            <div className="flex justify-between">
              <span>Rantai Pasok Swadaya (Scope 3):</span>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">Supplier Engagement</span>
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium pt-0.5 border-t border-neutral-100 dark:border-neutral-700">
              ✓ Selaras dengan GHG Protocol Corporate Standard
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPI Summary Cards for Target & Gap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Baseline Saat Ini */}
        <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
            1. Garis Dasar (Baseline {assessmentYear})
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {fmt(baselineNetCpo, 2)}
            </span>
            <span className="text-xs text-neutral-500">tCO₂e / t CPO</span>
          </div>
          <div className="text-[10px] text-neutral-500">
            Total Net: {fmt(baselineNetTotal, 0)} tCO₂e/thn
          </div>
        </div>

        {/* Card 2: Target Capaian */}
        <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-300 dark:border-emerald-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
            <span>2. Target ({targetYear})</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-mono">
              -{effectiveTargetPercent}%
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
              {fmt(effectiveTargetNetCpo, 2)}
            </span>
            <span className="text-xs text-emerald-800 dark:text-emerald-400">tCO₂e / t CPO</span>
          </div>
          <div className="text-[10px] text-emerald-800/80 dark:text-emerald-400">
            Batas Maksimal: {fmt(effectiveTargetTotalNet, 0)} tCO₂e/thn
          </div>
        </div>

        {/* Card 3: Defisit / Gap Reduksi yang Harus Ditutup */}
        <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-300 dark:border-amber-800 space-y-1">
          <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
            3. Defisit Gap Reduksi (Mitigation Gap)
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300">
              {fmt(intensityGap, 2)}
            </span>
            <span className="text-xs text-amber-800 dark:text-amber-400">tCO₂e / t CPO</span>
          </div>
          <div className="text-[10px] font-mono text-amber-800/80 dark:text-amber-400">
            Wajib dipotong: {fmt(totalInventoryGap, 0)} tCO₂e/thn
          </div>
        </div>

        {/* Card 4: Laju Penurunan Tahunan yang Diperlukan */}
        <div className="p-3.5 bg-sky-50/70 dark:bg-sky-950/30 rounded-xl border border-sky-300 dark:border-sky-800 space-y-1">
          <div className="text-[11px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wide">
            4. Laju Penurunan per Tahun
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-sky-700 dark:text-sky-300">
              {fmt(annualIntensityReduction, 3)}
            </span>
            <span className="text-xs text-sky-800 dark:text-sky-400">t/t CPO/thn</span>
          </div>
          <div className="text-[10px] text-sky-800/80 dark:text-sky-400 font-mono">
            ~{fmt(annualTotalReduction, 0)} tCO₂e/thn ({fmt(annualRatePercent, 1)}%/thn)
          </div>
        </div>
      </div>

      {/* Trajectory Visual Chart (Recharts) */}
      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-emerald-600" />
              Trajektori Dekarbonisasi Tahunan ({assessmentYear} – {targetYear})
            </h4>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Jalur penurunan linier untuk mencapai target {effectiveTargetNetCpo} tCO₂e/t CPO (-{effectiveTargetPercent}%) pada tahun {targetYear}.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span className="text-neutral-600 dark:text-neutral-400">Jalur Target Cap</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-neutral-400" />
              <span className="text-neutral-600 dark:text-neutral-400">Garis Batas Baseline</span>
            </div>
          </div>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trajectoryData} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
              <defs>
                <linearGradient id="targetGapGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(v) => `${v.toFixed(2)}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="p-3 rounded-lg bg-neutral-900 text-white text-xs shadow-xl border border-neutral-700 space-y-1.5 min-w-[200px]">
                      <div className="font-bold flex items-center justify-between pb-1 border-b border-neutral-700">
                        <span>Tahun {data.year}</span>
                        {data.isBaseline && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-700 text-neutral-200">
                            Baseline
                          </span>
                        )}
                        {data.isTarget && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-semibold">
                            Target Cap
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Target Intensitas:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {data.projectedIntensity} tCO₂e/t CPO
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Batas Total Emisi:</span>
                        <span className="font-mono text-neutral-200">
                          {data.projectedTotal.toLocaleString()} tCO₂e
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-neutral-800 text-[11px]">
                        <span className="text-neutral-400">Akumulasi Reduksi:</span>
                        <span className="font-mono font-bold text-amber-400">
                          -{data.cumulativeAbated.toLocaleString()} tCO₂e
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={Number(baselineNetCpo.toFixed(2))}
                stroke="#9ca3af"
                strokeDasharray="4 4"
                label={{
                  value: `Baseline: ${baselineNetCpo.toFixed(2)} t/t`,
                  position: 'insideTopRight',
                  fill: '#6b7280',
                  fontSize: 10,
                }}
              />
              <ReferenceLine
                y={Number(effectiveTargetNetCpo.toFixed(2))}
                stroke="#10b981"
                strokeDasharray="2 2"
                label={{
                  value: `Target Cap: ${effectiveTargetNetCpo.toFixed(2)} t/t`,
                  position: 'insideBottomRight',
                  fill: '#059669',
                  fontSize: 10,
                }}
              />
              <Area
                type="monotone"
                dataKey="projectedIntensity"
                stroke="#059669"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#targetGapGradient)"
                activeDot={{ r: 5, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Actionable Mitigation Levers (Connecting Operational Control to Closing the Gap) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
              Tuas Aksi Mitigasi Berdasarkan Batas Kendali Operasional (Operational Levers)
            </h4>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Rincian intervensi teknis yang dapat dieksekusi perusahaan untuk menutup defisit kesenjangan sebesar <strong>{fmt(totalInventoryGap, 0)} tCO₂e/thn</strong>:
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950">
            Defisit Wajib Ditutup: {fmt(totalInventoryGap, 0)} tCO₂e
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {levers.map((lever) => {
            const Icon = lever.icon;
            return (
              <div
                key={lever.id}
                className={`p-3.5 rounded-xl border ${lever.bg} flex flex-col justify-between space-y-2`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 shadow-xs">
                        <Icon className={`w-4 h-4 ${lever.color}`} />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                          {lever.title}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          {lever.scope}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-neutral-800 shadow-xs text-neutral-900 dark:text-neutral-100">
                      ~{fmt(lever.potentialTco2e, 0)} tCO₂e/thn
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
                    {lever.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500">Kontribusi Penutupan Gap:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, lever.coveragePct)}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {lever.coveragePct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
