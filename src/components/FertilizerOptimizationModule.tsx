import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { EstateParameters } from '../types/palmghg';
import { CONSTANTS } from '../utils/palmghgCalculations';
import {
  Sparkles,
  TrendingDown,
  Sprout,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  Sliders,
  RotateCcw,
  Scale,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
} from 'lucide-react';

interface Props {
  estate: EstateParameters;
  onUpdateEstate: (newEstate: EstateParameters) => void;
  isDark?: boolean;
}

export const FertilizerOptimizationModule: React.FC<Props> = ({
  estate,
  onUpdateEstate,
  isDark = false,
}) => {
  const plantedAreaHa = Math.max(1, estate.totalPlantedAreaHa || 9300);
  const totalStandardNkg = estate.syntheticNStandardKg || 0;
  const totalInhibitedNkg = estate.syntheticNInhibitedKg || 0;
  const currentTotalNkg = totalStandardNkg + totalInhibitedNkg;
  const currentNRateKgPerHa = Math.round((currentTotalNkg / plantedAreaHa) * 10) / 10;

  // Recommended Agronomic Optimum Nitrogen Rate for Mature Oil Palm (RSPO BMP / CIRAD benchmark)
  const AGRONOMIC_OPTIMUM_N_RATE = 105; // kg N / ha / yr

  // Interactive Target Optimization Slider (Default: 105 kg N/ha or 100% NI/UI)
  const [targetNRate, setTargetNRate] = useState<number>(
    Math.min(currentNRateKgPerHa, AGRONOMIC_OPTIMUM_N_RATE)
  );
  const [targetInhibitorAdoptionPct, setTargetInhibitorAdoptionPct] = useState<number>(100);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Format Helper
  const fmt = (val: number, decimals: number = 2) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  // Calculate emissions per hectare for any N rate and inhibitor %
  const calculateNEmissionsPerHa = (nRateKgHa: number, inhibitorPct: number) => {
    const stdFraction = 1 - inhibitorPct / 100;
    const inhFraction = inhibitorPct / 100;

    const stdN = nRateKgHa * stdFraction;
    const inhN = nRateKgHa * inhFraction;

    // Scope 1 Direct N2O
    const directN2O_N =
      stdN * CONSTANTS.N2O_DIRECT_STANDARD_N + inhN * CONSTANTS.N2O_DIRECT_INHIBITED_N;

    // Scope 1 Indirect N2O (Volatilisation + Leaching)
    const indirectN2O_N =
      (stdN + inhN) * (CONSTANTS.N2O_INDIRECT_VOLATILISATION + CONSTANTS.N2O_INDIRECT_LEACHING);

    const totalN2O_Kg = (directN2O_N + indirectN2O_N) * CONSTANTS.N2O_TO_N_RATIO;
    const scope1Tco2e = (totalN2O_Kg * CONSTANTS.GWP_N2O) / 1000;

    // Scope 3 Manufacturing (3.85 kg CO2e / kg N)
    const scope3Tco2e = (nRateKgHa * CONSTANTS.FERT_MFG_N) / 1000;

    // Scope 3 Freight (0.000105 tCO2e / t.km)
    const transportKm = estate.fertiliserTransportDistanceKm || 150;
    const scope3FreightTco2e = (nRateKgHa / 1000) * transportKm * CONSTANTS.FERT_TRANSPORT_FACTOR;

    return {
      scope1Tco2e,
      scope3Tco2e,
      totalTco2ePerHa: scope1Tco2e + scope3Tco2e + scope3FreightTco2e,
    };
  };

  // Yield response model: Mitscherlich law of diminishing returns for mature oil palm
  // Max yield asymptote ~22.5 t FFB/ha, base unfertilized ~12.5 t FFB/ha
  const calculateYieldResponse = (nRateKgHa: number, inhibitorPct: number) => {
    // Inhibitor increases nutrient use efficiency by ~10%
    const effectiveN = nRateKgHa * (1 + (inhibitorPct / 100) * 0.10);
    const maxY = 22.8;
    const baseUnfertilizedY = 12.8;
    // Mitscherlich curvature: Y = Max - (Max - Base) * exp(-c * N)
    const yieldResponse = maxY - (maxY - baseUnfertilizedY) * Math.exp(-0.024 * effectiveN);
    return Math.round(yieldResponse * 10) / 10;
  };

  // Current Baseline Footprint per Ha
  const currentInhibitorPct = currentTotalNkg > 0 ? (totalInhibitedNkg / currentTotalNkg) * 100 : 0;
  const currentEmissions = useMemo(() => {
    return calculateNEmissionsPerHa(currentNRateKgPerHa, currentInhibitorPct);
  }, [currentNRateKgPerHa, currentInhibitorPct, estate.fertiliserTransportDistanceKm]);

  const currentYieldEstimate = useMemo(() => {
    return calculateYieldResponse(currentNRateKgPerHa, currentInhibitorPct);
  }, [currentNRateKgPerHa, currentInhibitorPct]);

  // Optimized Footprint per Ha
  const optimizedEmissions = useMemo(() => {
    return calculateNEmissionsPerHa(targetNRate, targetInhibitorAdoptionPct);
  }, [targetNRate, targetInhibitorAdoptionPct, estate.fertiliserTransportDistanceKm]);

  const optimizedYieldEstimate = useMemo(() => {
    return calculateYieldResponse(targetNRate, targetInhibitorAdoptionPct);
  }, [targetNRate, targetInhibitorAdoptionPct]);

  // Key Trade-off Deltas
  const deltaTco2ePerHa = currentEmissions.totalTco2ePerHa - optimizedEmissions.totalTco2ePerHa;
  const totalEstateAbatementTco2e = deltaTco2ePerHa * plantedAreaHa;
  const deltaYieldTonne = optimizedYieldEstimate - currentYieldEstimate;

  // Chart Curve Dataset (0 to 180 kg N/ha spectrum)
  const tradeOffCurveData = useMemo(() => {
    const points: Array<{
      nRate: number;
      label: string;
      yieldProductivity: number;
      standardEmissionsTco2e: number;
      inhibitedEmissionsTco2e: number;
    }> = [];

    for (let n = 0; n <= 180; n += 20) {
      const y = calculateYieldResponse(n, 0);
      const stdEm = calculateNEmissionsPerHa(n, 0);
      const inhEm = calculateNEmissionsPerHa(n, 100);

      points.push({
        nRate: n,
        label: `${n} kg`,
        yieldProductivity: y,
        standardEmissionsTco2e: Math.round(stdEm.totalTco2ePerHa * 100) / 100,
        inhibitedEmissionsTco2e: Math.round(inhEm.totalTco2ePerHa * 100) / 100,
      });
    }

    return points;
  }, [estate.fertiliserTransportDistanceKm]);

  // Apply Optimization directly to estate state
  const handleApplyOptimization = () => {
    const newTotalN = Math.round(targetNRate * plantedAreaHa);
    const newInhibitedN = Math.round(newTotalN * (targetInhibitorAdoptionPct / 100));
    const newStandardN = Math.max(0, newTotalN - newInhibitedN);

    onUpdateEstate({
      ...estate,
      syntheticNStandardKg: newStandardN,
      syntheticNInhibitedKg: newInhibitedN,
    });

    setSuccessToast(
      `Dosis pemupukan berhasil dioptimalkan ke ${targetNRate} kg N/ha (${targetInhibitorAdoptionPct}% NI/UI). Potensi reduksi emisi: ${fmt(deltaTco2ePerHa, 2)} tCO₂e/ha (Total: ${fmt(totalEstateAbatementTco2e, 0)} tCO₂e/thn)!`
    );
    setTimeout(() => setSuccessToast(null), 8000);
  };

  return (
    <div className="p-4 bg-gradient-to-br from-emerald-50/80 via-white to-sky-50/50 dark:from-emerald-950/40 dark:via-neutral-900 dark:to-sky-950/20 rounded-xl border-2 border-emerald-500/30 dark:border-emerald-600/30 shadow-xs space-y-4 animate-in fade-in duration-200">
      {/* Title & Concept Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/60 dark:border-emerald-800/40">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                Fertilizer Optimization Engine (Agronomic Trade-Off)
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border border-emerald-300">
                Hukum Hasil yang Menurun (Law of Diminishing Returns)
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
              Visualisasikan titik temu optimal antara dosis nitrogen hara, produktivitas TBS, dan emisi gas rumah kaca per hektar.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleApplyOptimization}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-colors shrink-0"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Terapkan Dosis Optimal</span>
        </button>
      </div>

      {/* TOAST NOTIFICATION */}
      {successToast && (
        <div className="p-3 bg-emerald-100/90 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 rounded-lg flex items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:underline font-bold text-xs"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 4 COMPARATIVE IMPACT TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Tile 1: Potential tCO2e reduction per hectare */}
        <div className="p-3 bg-white dark:bg-neutral-800/80 rounded-xl border border-emerald-300/80 dark:border-emerald-800/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">
            <span>Potensi Reduksi Emisi / Ha</span>
            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">
            {deltaTco2ePerHa >= 0 ? '-' : '+'}
            {fmt(Math.abs(deltaTco2ePerHa), 2)} <span className="text-xs font-normal">tCO₂e/ha</span>
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">
            {fmt(currentEmissions.totalTco2ePerHa, 2)} → {fmt(optimizedEmissions.totalTco2ePerHa, 2)} tCO₂e/ha
          </div>
        </div>

        {/* Tile 2: Total Estate Abatement */}
        <div className="p-3 bg-white dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">
            <span>Total Penurunan Emisi Kebun</span>
            <FlaskConical className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-xl font-black font-mono text-neutral-900 dark:text-neutral-100">
            {deltaTco2ePerHa >= 0 ? '-' : '+'}
            {fmt(Math.abs(totalEstateAbatementTco2e), 0)} <span className="text-xs font-normal text-neutral-500">tCO₂e/thn</span>
          </div>
          <div className="text-[10px] text-neutral-500">
            Luas kebun: {plantedAreaHa.toLocaleString()} ha
          </div>
        </div>

        {/* Tile 3: Yield Productivity Trade-Off */}
        <div className="p-3 bg-white dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">
            <span>Estimasi Produktivitas TBS</span>
            <Sprout className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-black font-mono text-neutral-900 dark:text-neutral-100">
            {optimizedYieldEstimate.toFixed(1)} <span className="text-xs font-normal text-neutral-500">t FFB/ha</span>
          </div>
          <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            {deltaYieldTonne >= 0
              ? `+${deltaYieldTonne.toFixed(1)} t/ha (Yield Aman / Bertambah)`
              : `${deltaYieldTonne.toFixed(1)} t/ha (Minimal)`}
          </div>
        </div>

        {/* Tile 4: Nitrification Inhibitor Adoption */}
        <div className="p-3 bg-white dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">
            <span>Adopsi Inhibitor (NI/UI)</span>
            <Zap className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-black font-mono text-blue-700 dark:text-blue-400">
            {targetInhibitorAdoptionPct}%
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">
            -35% Direct N₂O per kg N diaplikasikan
          </div>
        </div>
      </div>

      {/* INTERACTIVE CONTROLS */}
      <div className="p-3 bg-white dark:bg-neutral-800/90 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target N Rate Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-neutral-700 dark:text-neutral-300">
                Target Dosis Aplikasi Nitrogen:
              </span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                {targetNRate} kg N/ha/thn
              </span>
            </div>
            <input
              type="range"
              min="60"
              max="160"
              step="5"
              value={targetNRate}
              onChange={(e) => setTargetNRate(Number(e.target.value))}
              className="w-full accent-emerald-600 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
              <span>60 kg (Defisit)</span>
              <span className="text-emerald-600 font-bold">105 kg (Optimum Agronomi)</span>
              <span>160 kg (Luxury Uptake / Boros)</span>
            </div>
          </div>

          {/* NI/UI Adoption Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-neutral-700 dark:text-neutral-300">
                Proporsi Inhibitor Nitrifikasi/Urease (NI/UI):
              </span>
              <span className="font-mono font-bold text-blue-700 dark:text-blue-400 text-sm">
                {targetInhibitorAdoptionPct}% Konversi
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={targetInhibitorAdoptionPct}
              onChange={(e) => setTargetInhibitorAdoptionPct(Number(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
              <span>0% (Urea Konvensional)</span>
              <span>50% Campuran</span>
              <span className="text-blue-600 font-bold">100% Enhanced Efficiency</span>
            </div>
          </div>
        </div>
      </div>

      {/* RECHARTS TRADE-OFF CURVE GRAPH */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-neutral-800 dark:text-neutral-200">
            Kurva Respon Dosis Nitrogen: Produktivitas TBS vs Emisi GRK per Hektar
          </span>
          <span className="text-[11px] font-mono text-neutral-500">
            Garis Emas = Produktivitas TBS (t/ha) · Garis Biru = Emisi tCO₂e/ha
          </span>
        </div>

        <div className="h-64 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={tradeOffCurveData} margin={{ top: 10, right: 25, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={isDark ? 0.2 : 0.4} />
              <XAxis
                dataKey="label"
                stroke={isDark ? '#a3a3a3' : '#525252'}
                fontSize={10}
                tickLine={false}
              />
              {/* Left Y Axis: Yield t/ha */}
              <YAxis
                yAxisId="yield"
                stroke="#d97706"
                fontSize={10}
                domain={[10, 25]}
                tickFormatter={(v) => `${v.toFixed(0)} t/ha`}
                label={{
                  value: 'Yield TBS (t/ha)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#d97706',
                  fontSize: 10,
                  offset: 0,
                }}
              />
              {/* Right Y Axis: tCO2e / ha */}
              <YAxis
                yAxisId="emissions"
                orientation="right"
                stroke="#0284c7"
                fontSize={10}
                domain={[0, 2.5]}
                tickFormatter={(v) => `${v.toFixed(1)} t`}
                label={{
                  value: 'Emisi (tCO₂e/ha)',
                  angle: 90,
                  position: 'insideRight',
                  fill: '#0284c7',
                  fontSize: 10,
                  offset: 0,
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 bg-neutral-900/95 text-white rounded-lg shadow-xl border border-neutral-700 text-xs space-y-1 font-mono">
                        <div className="font-bold border-b border-neutral-700 pb-1 text-emerald-400">
                          Dosis: {data.nRate} kg N/ha/thn
                        </div>
                        <div className="flex justify-between gap-4 text-amber-300">
                          <span>Yield TBS:</span>
                          <span className="font-bold">{data.yieldProductivity} t FFB/ha</span>
                        </div>
                        <div className="flex justify-between gap-4 text-rose-300">
                          <span>Emisi Standar Urea:</span>
                          <span>{data.standardEmissionsTco2e} tCO₂e/ha</span>
                        </div>
                        <div className="flex justify-between gap-4 text-sky-300">
                          <span>Emisi NI/UI Treated:</span>
                          <span className="font-bold">{data.inhibitedEmissionsTco2e} tCO₂e/ha</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />

              {/* Reference Line for Current Application Rate */}
              <ReferenceLine
                yAxisId="yield"
                x={`${Math.round(currentNRateKgPerHa / 20) * 20} kg`}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{
                  value: `Saat Ini: ${currentNRateKgPerHa} kg/ha`,
                  position: 'insideTopLeft',
                  fill: '#ef4444',
                  fontSize: 9,
                }}
              />

              {/* Reference Line for Agronomic Optimum */}
              <ReferenceLine
                yAxisId="yield"
                x="100 kg"
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{
                  value: 'Optimum: 105 kg/ha',
                  position: 'insideBottomRight',
                  fill: '#10b981',
                  fontSize: 9,
                }}
              />

              {/* FFB Yield Response Curve */}
              <Line
                yAxisId="yield"
                type="monotone"
                dataKey="yieldProductivity"
                name="Produktivitas TBS (t FFB/ha)"
                stroke="#d97706"
                strokeWidth={3}
                dot={{ r: 3, fill: '#d97706' }}
              />

              {/* Standard Nitrogen Emissions Curve */}
              <Line
                yAxisId="emissions"
                type="monotone"
                dataKey="standardEmissionsTco2e"
                name="Emisi Urea Standar (tCO₂e/ha)"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 2 }}
              />

              {/* NI/UI Inhibited Emissions Curve */}
              <Line
                yAxisId="emissions"
                type="monotone"
                dataKey="inhibitedEmissionsTco2e"
                name="Emisi NI/UI Treated (tCO₂e/ha)"
                stroke="#0284c7"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#0284c7' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
