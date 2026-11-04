import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  EstateParameters,
  MillParameters,
  FFBSourceAllocation,
  PalmGHGAssessmentResults,
} from '../types/palmghg';
import { calculatePalmGHGV5 } from '../utils/palmghgCalculations';
import {
  Sprout,
  TrendingDown,
  TrendingUp,
  Activity,
  Sliders,
  Scale,
  Sparkles,
  Layers,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  ArrowRight,
  Factory,
  Trees,
  Check,
} from 'lucide-react';

interface Props {
  estate: EstateParameters;
  mill: MillParameters;
  ffbSources: FFBSourceAllocation[];
  results: PalmGHGAssessmentResults;
  onUpdateSources?: (newSources: FFBSourceAllocation[]) => void;
  isDark?: boolean;
}

export interface YieldSensitivityPoint {
  yieldTonPerHa: number;
  totalFfbTon: number;
  totalCpoTon: number;
  totalNetEmissions: number;
  totalGrossEmissions: number;
  netGhgPerTonCpo: number;
  grossGhgPerTonCpo: number;
  deltaNetCpo: number;
  deltaNetCpoPercent: number;
  isBaseline: boolean;
  statusBadge: string;
  badgeColor: string;
}

export const FfbYieldSensitivityWidget: React.FC<Props> = ({
  estate,
  mill,
  ffbSources,
  results,
  onUpdateSources,
  isDark = false,
}) => {
  // 1. Calculate Baseline Total FFB and Weighted Average Yield
  const { baselineTotalFfb, baselinePlantedArea, baselineAvgYield } = useMemo(() => {
    let totalFfb = 0;
    let totalArea = 0;

    ffbSources.forEach((s) => {
      totalFfb += s.ffbVolumeTon;
      if (s.plantedAreaHa && s.plantedAreaHa > 0) {
        totalArea += s.plantedAreaHa;
      }
    });

    const estateArea = estate.totalPlantedAreaHa || 9300;
    const effectiveArea = totalArea > 0 ? totalArea : estateArea;
    const avgYield = totalFfb > 0 && effectiveArea > 0 ? totalFfb / effectiveArea : 20.5;

    return {
      baselineTotalFfb: totalFfb || 190000,
      baselinePlantedArea: effectiveArea,
      baselineAvgYield: Math.round(avgYield * 10) / 10,
    };
  }, [ffbSources, estate.totalPlantedAreaHa]);

  // Interactive Simulated Yield Slider (Default: baseline average yield)
  const [simulatedYield, setSimulatedYield] = useState<number>(baselineAvgYield);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  // Format Helper
  const fmt = (val: number, decimals: number = 2) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  // Function to simulate assessment results for any given FFB yield
  const evaluateYieldScenario = (targetYield: number): YieldSensitivityPoint => {
    const yieldMultiplier = targetYield / Math.max(0.1, baselineAvgYield);

    // Scale FFB volumes proportionally across supply sources
    const scaledSources: FFBSourceAllocation[] = ffbSources.map((s) => ({
      ...s,
      ffbVolumeTon: Math.round(s.ffbVolumeTon * yieldMultiplier),
      yieldTonPerHa: Math.round((s.yieldTonPerHa || baselineAvgYield) * yieldMultiplier * 10) / 10,
    }));

    const simResults = calculatePalmGHGV5(estate, mill, scaledSources);
    const baselineNetCpo = results.netGhgPerTonCpo || 1.15;
    const deltaNetCpo = simResults.netGhgPerTonCpo - baselineNetCpo;
    const deltaNetCpoPercent = (deltaNetCpo / Math.max(0.001, baselineNetCpo)) * 100;
    const isBaseline = Math.abs(targetYield - baselineAvgYield) < 0.15;

    let statusBadge = 'Normal';
    let badgeColor = 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800';

    if (simResults.netGhgPerTonCpo <= 0.85) {
      statusBadge = 'Pemimpin Hijau (Sangat Rendah)';
      badgeColor = 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300';
    } else if (simResults.netGhgPerTonCpo <= 1.1) {
      statusBadge = 'Efisien (Standar RSPO)';
      badgeColor = 'text-teal-700 bg-teal-100 dark:bg-teal-950/80 dark:text-teal-300 border-teal-300';
    } else if (simResults.netGhgPerTonCpo <= 1.4) {
      statusBadge = 'Moderat / Rata-rata';
      badgeColor = 'text-amber-700 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300';
    } else {
      statusBadge = 'Risiko Intensitas Tinggi';
      badgeColor = 'text-rose-700 bg-rose-100 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300';
    }

    return {
      yieldTonPerHa: targetYield,
      totalFfbTon: simResults.totalFfbProcessedTon,
      totalCpoTon: simResults.totalCpoProducedTon,
      totalNetEmissions: simResults.totalNetEmissions,
      totalGrossEmissions: simResults.totalGrossEmissions,
      netGhgPerTonCpo: simResults.netGhgPerTonCpo,
      grossGhgPerTonCpo: simResults.grossGhgPerTonCpo,
      deltaNetCpo,
      deltaNetCpoPercent,
      isBaseline,
      statusBadge,
      badgeColor,
    };
  };

  // Current Live Simulation Result based on slider
  const currentSimResult = useMemo(() => {
    return evaluateYieldScenario(simulatedYield);
  }, [simulatedYield, baselineAvgYield, ffbSources, estate, mill, results.netGhgPerTonCpo]);

  // Yield Spectrum Dataset for Recharts Curve (from 12 t/ha to 30 t/ha in 2 t/ha steps)
  const yieldSpectrumData = useMemo(() => {
    const yieldSteps = [12.0, 14.0, 16.0, 18.0, 20.0, 22.0, 24.0, 26.0, 28.0, 30.0];

    // Ensure baseline yield is included exactly in the dataset
    if (!yieldSteps.includes(baselineAvgYield)) {
      yieldSteps.push(baselineAvgYield);
      yieldSteps.sort((a, b) => a - b);
    }

    return yieldSteps.map((y) => {
      const pt = evaluateYieldScenario(y);
      return {
        yieldLabel: `${y.toFixed(1)} t/ha`,
        yieldVal: y,
        netGhgPerTonCpo: Math.round(pt.netGhgPerTonCpo * 100) / 100,
        cpoProductionTon: Math.round(pt.totalCpoTon),
        totalNetEmissions: Math.round(pt.totalNetEmissions),
        isBaseline: pt.isBaseline,
      };
    });
  }, [baselineAvgYield, ffbSources, estate, mill, results.netGhgPerTonCpo]);

  // Structured Scenario Table (Discrete Industry Benchmarks)
  const scenarioMatrix = useMemo(() => {
    const points = [
      Math.round(baselineAvgYield * 0.65 * 10) / 10, // Severe drought / pest (-35%)
      Math.round(baselineAvgYield * 0.80 * 10) / 10, // Sub-optimal / aged stand (-20%)
      Math.round(baselineAvgYield * 0.90 * 10) / 10, // Moderate deficit (-10%)
      baselineAvgYield,                             // Baseline
      Math.round(baselineAvgYield * 1.10 * 10) / 10, // BMP Agronomy (+10%)
      Math.round(baselineAvgYield * 1.25 * 10) / 10, // Precision Nutrients (+25%)
      Math.round(baselineAvgYield * 1.40 * 10) / 10, // Superior Clonal / DxP (+40%)
    ];

    const uniquePoints = Array.from(new Set(points)).sort((a, b) => a - b);
    return uniquePoints.map((y) => evaluateYieldScenario(y));
  }, [baselineAvgYield, ffbSources, estate, mill, results.netGhgPerTonCpo]);

  // Elasticity of CPO Intensity to FFB Yield
  // % change in CPO intensity / % change in FFB yield
  const yieldElasticity = useMemo(() => {
    const deltaYieldPct = ((simulatedYield - baselineAvgYield) / baselineAvgYield) * 100;
    if (Math.abs(deltaYieldPct) < 0.5) return -0.78; // Default empirical elasticity in RSPO PalmGHG
    return currentSimResult.deltaNetCpoPercent / deltaYieldPct;
  }, [simulatedYield, baselineAvgYield, currentSimResult.deltaNetCpoPercent]);

  // One-click apply simulated yield to active supply base
  const handleApplySimulatedYield = () => {
    if (!onUpdateSources) return;

    const yieldMultiplier = simulatedYield / Math.max(0.1, baselineAvgYield);
    const updatedSources: FFBSourceAllocation[] = ffbSources.map((s) => ({
      ...s,
      ffbVolumeTon: Math.round(s.ffbVolumeTon * yieldMultiplier),
      yieldTonPerHa: Math.round((s.yieldTonPerHa || baselineAvgYield) * yieldMultiplier * 10) / 10,
    }));

    onUpdateSources(updatedSources);
    setAppliedNotice(
      `Sukses menyelaraskan yield! Produksi TBS disesuaikan ke rata-rata ${simulatedYield.toFixed(1)} t/ha (Total: ${fmt(currentSimResult.totalFfbTon, 0)} ton TBS).`
    );
    setTimeout(() => setAppliedNotice(null), 8000);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Skenario Produktivitas TBS (t/ha)',
      'Total TBS Diproses (ton)',
      'Produksi CPO (ton)',
      'Total Emisi Netto (tCO2e)',
      'Intensitas Netto (tCO2e/ton CPO)',
      'Selisih vs Baseline (tCO2e/t CPO)',
      'Persentase Selisih (%)',
      'Status Efisiensi',
    ];

    const rows = scenarioMatrix.map((s) => [
      s.yieldTonPerHa.toFixed(1),
      Math.round(s.totalFfbTon),
      Math.round(s.totalCpoTon),
      Math.round(s.totalNetEmissions),
      s.netGhgPerTonCpo.toFixed(2),
      (s.deltaNetCpo >= 0 ? '+' : '') + s.deltaNetCpo.toFixed(2),
      (s.deltaNetCpoPercent >= 0 ? '+' : '') + s.deltaNetCpoPercent.toFixed(1) + '%',
      `"${s.statusBadge}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sensitivitas_Yield_TBS_vs_Intensitas_CPO_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-5">
      {/* HEADER STRIP */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 shrink-0 mt-0.5">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Analisis Sensitivitas Agronomi (Sensitivity Widget)
              </span>
              <span className="text-xs text-neutral-300 dark:text-neutral-700">·</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                FFB Yield (t/ha) → Intensitas Produk (tCO₂e/t CPO)
              </span>
              <span className="text-xs text-neutral-300 dark:text-neutral-700">·</span>
              <span className="text-[11px] font-mono text-neutral-500">
                RSPO PalmGHG V5 & GHG Protocol LSR
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-100 mt-0.5">
              Sensitivitas Produktivitas TBS terhadap Intensitas Emisi Karbon CPO
            </h3>
            <p className="text-xs text-neutral-500 max-w-3xl leading-relaxed mt-0.5">
              Simulasikan bagaimana kenaikan atau penurunan yield panen TBS (ton/ha) mengencerkan (*dilution effect*) emisi lahan tetap (oksidasi gambut, amortisasi LUC, serapan karbon, dan pupuk) terhadap volume CPO yang dihasilkan.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onUpdateSources && (
            <button
              onClick={handleApplySimulatedYield}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-colors whitespace-nowrap"
              title="Terapkan yield yang disimulasikan langsung ke sumber pasokan TBS"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Terapkan Yield Simulasi</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700"
            title="Unduh tabel matriks sensitivitas yield ke format CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* APPLIED NOTICE TOAST */}
      {appliedNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{appliedNotice}</span>
          </div>
          <button
            onClick={() => setAppliedNotice(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 font-bold px-2 py-0.5 rounded text-xs"
          >
            Tutup
          </button>
        </div>
      )}

      {/* INTERACTIVE SLIDER & LIVE IMPACT CARDS */}
      <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Slider Simulasi Produktivitas TBS Kebun (FFB Yield):
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Garis Pangkal (Baseline Rata-rata Kebun):{' '}
              <strong className="text-neutral-800 dark:text-neutral-200 font-mono">
                {baselineAvgYield.toFixed(1)} t/ha
              </strong>{' '}
              (Total Produksi: {fmt(baselineTotalFfb, 0)} ton TBS/thn)
            </p>
          </div>

          {/* Reset button */}
          <button
            onClick={() => setSimulatedYield(baselineAvgYield)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 transition-colors shrink-0"
          >
            <RotateCcw className="w-3 h-3 text-neutral-500" />
            <span>Reset ke Baseline ({baselineAvgYield.toFixed(1)} t/ha)</span>
          </button>
        </div>

        {/* The Slider Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-neutral-500">12.0 t/ha (Defisit Parah)</span>
            <div className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-base shadow-sm font-black flex items-center gap-2">
              <span>{simulatedYield.toFixed(1)} t/ha</span>
              <span className="text-xs font-normal opacity-90">
                ({simulatedYield >= baselineAvgYield ? '+' : ''}
                {(((simulatedYield - baselineAvgYield) / baselineAvgYield) * 100).toFixed(1)}% vs baseline)
              </span>
            </div>
            <span className="text-neutral-500">30.0 t/ha (Unggul Maksimal)</span>
          </div>

          <input
            type="range"
            min="12.0"
            max="30.0"
            step="0.5"
            value={simulatedYield}
            onChange={(e) => setSimulatedYield(Number(e.target.value))}
            className="w-full h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />

          <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
            <span>-41% (Kekeringan / Penuaan)</span>
            <span>-20%</span>
            <span className="text-emerald-600 font-bold">● Baseline ({baselineAvgYield.toFixed(1)})</span>
            <span>+20%</span>
            <span>+46% (Bibit Klon Unggul / DxP)</span>
          </div>
        </div>

        {/* 4 LIVE KPI COMPARISON CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* KPI 1: Intensitas Netto CPO */}
          <div className="p-3.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span>Intensitas Karbon CPO</span>
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-black font-mono text-neutral-900 dark:text-neutral-100 flex items-baseline gap-1">
              <span>{fmt(currentSimResult.netGhgPerTonCpo, 2)}</span>
              <span className="text-xs font-normal text-neutral-500">tCO₂e/t CPO</span>
            </div>
            <div className="text-[11px] font-semibold flex items-center justify-between">
              <span className="text-neutral-500">vs Baseline:</span>
              <span
                className={`font-mono font-bold ${
                  currentSimResult.deltaNetCpo <= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {currentSimResult.deltaNetCpo <= 0 ? '' : '+'}
                {fmt(currentSimResult.deltaNetCpo, 2)} ({fmt(currentSimResult.deltaNetCpoPercent, 1)}%)
              </span>
            </div>
          </div>

          {/* KPI 2: Total Produksi CPO */}
          <div className="p-3.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span>Output Minyak Sawit (CPO)</span>
              <Factory className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xl font-black font-mono text-neutral-900 dark:text-neutral-100 flex items-baseline gap-1">
              <span>{fmt(currentSimResult.totalCpoTon, 0)}</span>
              <span className="text-xs font-normal text-neutral-500">ton/thn</span>
            </div>
            <div className="text-[11px] font-semibold flex items-center justify-between">
              <span className="text-neutral-500">OER: {mill.cpoExtractionRatePercent}%</span>
              <span className="font-mono text-neutral-700 dark:text-neutral-300">
                {fmt(currentSimResult.totalFfbTon, 0)} t TBS
              </span>
            </div>
          </div>

          {/* KPI 3: Total Emisi Netto Estate & Mill */}
          <div className="p-3.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span>Total Emisi Netto Sistem</span>
              <Activity className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-xl font-black font-mono text-neutral-900 dark:text-neutral-100 flex items-baseline gap-1">
              <span>{fmt(currentSimResult.totalNetEmissions, 0)}</span>
              <span className="text-xs font-normal text-neutral-500">tCO₂e/thn</span>
            </div>
            <div className="text-[11px] text-neutral-500">
              POME Metana & Transport ikut berskala sejalan volume
            </div>
          </div>

          {/* KPI 4: Indeks Elastisitas Yield */}
          <div className="p-3.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span>Elastisitas Intensitas Yield</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-xl font-black font-mono text-purple-700 dark:text-purple-300 flex items-baseline gap-1">
              <span>{yieldElasticity.toFixed(2)}</span>
              <span className="text-xs font-normal text-neutral-500">indeks</span>
            </div>
            <div className="text-[11px] text-neutral-500 font-semibold">
              Tiap +10% yield memangkas ~{Math.abs(yieldElasticity * 10).toFixed(1)}% intensitas CPO
            </div>
          </div>
        </div>
      </div>

      {/* RECHARTS COMPOSED CHART: HYPERBOLIC YIELD DILUTION CURVE */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Kurva Non-Linear Hubungan Yield TBS vs Intensitas Emisi CPO (Dilution Effect Curve)
            </h4>
            <p className="text-[11px] text-neutral-500">
              Garis hijau menunjukkan penurunan eksponensial emisi per ton CPO saat yield bertambah; batang abu-abu menunjukkan volume produksi CPO.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              tCO₂e / ton CPO (Sumbu Kiri)
            </span>
            <span className="flex items-center gap-1 text-neutral-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-neutral-300 dark:bg-neutral-700 inline-block" />
              Ton CPO (Sumbu Kanan)
            </span>
          </div>
        </div>

        <div className="h-80 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={yieldSpectrumData} margin={{ top: 15, right: 25, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={isDark ? 0.2 : 0.4} />
              <XAxis
                dataKey="yieldLabel"
                stroke={isDark ? '#a3a3a3' : '#525252'}
                fontSize={11}
                tickLine={false}
              />
              {/* Left Y Axis: tCO2e / t CPO */}
              <YAxis
                yAxisId="left"
                stroke={isDark ? '#10b981' : '#059669'}
                fontSize={11}
                tickFormatter={(val) => `${val.toFixed(2)}`}
                domain={['auto', 'auto']}
                label={{
                  value: 'tCO₂e / ton CPO',
                  angle: -90,
                  position: 'insideLeft',
                  fill: isDark ? '#10b981' : '#059669',
                  fontSize: 10,
                  offset: 0,
                }}
              />
              {/* Right Y Axis: CPO production ton */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke={isDark ? '#a3a3a3' : '#737373'}
                fontSize={11}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                domain={[0, 'auto']}
                label={{
                  value: 'Produksi CPO (ton)',
                  angle: 90,
                  position: 'insideRight',
                  fill: isDark ? '#a3a3a3' : '#737373',
                  fontSize: 10,
                  offset: 0,
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 bg-neutral-900/95 dark:bg-neutral-800/95 text-white rounded-lg shadow-xl border border-neutral-700 text-xs space-y-1.5 font-mono">
                        <div className="font-bold border-b border-neutral-700 pb-1 text-emerald-400">
                          Yield: {data.yieldVal.toFixed(1)} ton TBS / ha
                          {data.isBaseline && ' (Baseline)'}
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-emerald-300">Intensitas Emisi:</span>
                          <span className="font-bold">{data.netGhgPerTonCpo.toFixed(2)} tCO₂e/t CPO</span>
                        </div>
                        <div className="flex justify-between gap-4 text-neutral-300">
                          <span>Output CPO:</span>
                          <span>{data.cpoProductionTon.toLocaleString()} ton</span>
                        </div>
                        <div className="flex justify-between gap-4 text-neutral-300">
                          <span>Total Emisi Netto:</span>
                          <span>{data.totalNetEmissions.toLocaleString()} tCO₂e/thn</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />

              {/* Baseline Reference Line */}
              <ReferenceLine
                yAxisId="left"
                y={results.netGhgPerTonCpo || 1.15}
                stroke="#d97706"
                strokeDasharray="4 4"
                label={{
                  value: `Baseline: ${fmt(results.netGhgPerTonCpo, 2)} tCO₂e/t`,
                  position: 'insideTopLeft',
                  fill: '#d97706',
                  fontSize: 10,
                }}
              />

              {/* RSPO Excellent Threshold: 1.0 tCO2e/t CPO */}
              <ReferenceLine
                yAxisId="left"
                y={1.0}
                stroke="#10b981"
                strokeDasharray="3 3"
                label={{
                  value: 'Tolok Ukur Efisiensi RSPO: 1.0 tCO₂e/t',
                  position: 'insideBottomLeft',
                  fill: '#10b981',
                  fontSize: 10,
                }}
              />

              {/* CPO Production Bar Chart */}
              <Bar
                yAxisId="right"
                dataKey="cpoProductionTon"
                name="Volume Produksi CPO (ton)"
                fill={isDark ? '#404040' : '#cbd5e1'}
                radius={[4, 4, 0, 0]}
                barSize={24}
              >
                {yieldSpectrumData.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={
                      entry.isBaseline
                        ? '#059669'
                        : isDark
                        ? '#3f3f46'
                        : '#cbd5e1'
                    }
                  />
                ))}
              </Bar>

              {/* Net GHG Per Ton CPO Line */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="netGhgPerTonCpo"
                name="Intensitas Netto (tCO₂e/ton CPO)"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 5, fill: '#10b981' }}
                activeDot={{ r: 8, stroke: '#047857', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DISCRETE SCENARIOS MATRIX TABLE */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
            Matriks Simulasi Multiskon Skenario Produktivitas TBS
          </h4>
          <span className="text-[11px] text-neutral-500 font-mono">
            Rentang -35% (Kekeringan Ekstrem) s.d. +40% (Varietas Klon Unggul)
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-bold border-b border-neutral-200 dark:border-neutral-700">
                <th className="p-3">Yield TBS (t/ha)</th>
                <th className="p-3">Total TBS (ton)</th>
                <th className="p-3">Output CPO (ton)</th>
                <th className="p-3">Total Netto (tCO₂e)</th>
                <th className="p-3 text-emerald-800 dark:text-emerald-300">Intensitas (tCO₂e/t CPO)</th>
                <th className="p-3">Selisih vs Baseline</th>
                <th className="p-3">Status Kinerja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {scenarioMatrix.map((sc, idx) => (
                <tr
                  key={`sc-${idx}`}
                  className={`transition-colors ${
                    sc.isBaseline
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 font-bold'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <td className="p-3 font-mono font-bold flex items-center gap-1.5">
                    {sc.isBaseline && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                    )}
                    <span>{sc.yieldTonPerHa.toFixed(1)} t/ha</span>
                    {sc.isBaseline && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-sans bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                        Baseline
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-neutral-600 dark:text-neutral-300">
                    {fmt(sc.totalFfbTon, 0)}
                  </td>
                  <td className="p-3 font-mono text-neutral-600 dark:text-neutral-300">
                    {fmt(sc.totalCpoTon, 0)}
                  </td>
                  <td className="p-3 font-mono text-neutral-600 dark:text-neutral-300">
                    {fmt(sc.totalNetEmissions, 0)}
                  </td>
                  <td className="p-3 font-mono font-black text-sm text-emerald-700 dark:text-emerald-300">
                    {fmt(sc.netGhgPerTonCpo, 2)}
                  </td>
                  <td className="p-3 font-mono font-semibold">
                    {sc.isBaseline ? (
                      <span className="text-neutral-400">—</span>
                    ) : (
                      <span
                        className={
                          sc.deltaNetCpo <= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }
                      >
                        {sc.deltaNetCpo <= 0 ? '' : '+'}
                        {fmt(sc.deltaNetCpo, 2)} ({fmt(sc.deltaNetCpoPercent, 1)}%)
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.badgeColor}`}>
                      {sc.statusBadge}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AGRONOMIC & METHODOLOGY INSIGHTS CARD */}
      <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/50 space-y-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
          <Info className="w-4 h-4 text-emerald-600" />
          <span>Mengapa Produktivitas (FFB Yield) Merupakan Tuas Dekarbonisasi Terbesar dalam RSPO PalmGHG?</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-neutral-600 dark:text-neutral-300 leading-relaxed text-[11px]">
          <div>
            <strong className="text-neutral-800 dark:text-neutral-100 block mb-0.5">
              1. Efek Pengenceran Beban Lahan Tetap (Fixed Land Burden):
            </strong>
            Emisi utama kebun kelapa sawit seperti oksidasi gambut (~54.6 tCO₂e/ha/thn), amortisasi utang pembukaan lahan (LUC Debt), dan dosis pupuk pemeliharaan bersifat konstan per hektar. Ketika tonase TBS per hektar naik, emisi tetap ini terbagi ke volume CPO yang jauh lebih besar, sehingga emisi per ton CPO berkurang secara dramatis.
          </div>
          <div>
            <strong className="text-neutral-800 dark:text-neutral-100 block mb-0.5">
              2. Implikasi Praktis Pengelolaan Kebun:
            </strong>
            Menaikkan produktivitas tanaman eksisting melalui manajemen hara presisi, perbaikan tata air gambut (depth 60 cm), pemupukan organik dengan POME/tandan kosong, dan replanting menggunakan benih unggul bersertifikat adalah strategi mitigasi iklim paling efektif tanpa memerlukan ekspansi lahan baru.
          </div>
        </div>
      </div>
    </div>
  );
};
