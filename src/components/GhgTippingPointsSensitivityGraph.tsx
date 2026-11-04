import React, { useState, useMemo } from 'react';
import {
  EstateParameters,
  MillParameters,
  FFBSourceAllocation,
  PalmGHGAssessmentResults,
} from '../types/palmghg';
import { calculatePalmGHGV5 } from '../utils/palmghgCalculations';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Flame,
  Sprout,
  Droplets,
  Layers,
  Fuel,
  Info,
  Scale,
} from 'lucide-react';

interface Props {
  estate: EstateParameters;
  mill: MillParameters;
  ffbSources: FFBSourceAllocation[];
  baselineResults: PalmGHGAssessmentResults;
  isDark?: boolean;
}

type MetricMode = 'totalNet' | 'cpoIntensity';

interface ParameterConfig {
  id: string;
  name: string;
  shortName: string;
  unit: string;
  color: string;
  active: boolean;
  baselineValue: number;
  category: string;
  icon: any;
  tippingPointDesc: string;
}

export const GhgTippingPointsSensitivityGraph: React.FC<Props> = ({
  estate,
  mill,
  ffbSources,
  baselineResults,
  isDark = false,
}) => {
  const [metricMode, setMetricMode] = useState<MetricMode>('totalNet');
  const [activeParams, setActiveParams] = useState<Record<string, boolean>>({
    ffbYield: true,
    fertilizerN: true,
    methaneCapture: true,
    peatDepth: true,
    fieldDiesel: false,
  });

  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  // Baseline key values
  const totalArea = ffbSources.reduce((acc, s) => acc + s.plantedAreaHa, 0) || estate.totalPlantedAreaHa || 1;
  const totalVolume = ffbSources.reduce((acc, s) => acc + s.ffbVolumeTon, 0);
  const baseFfbYield = totalArea > 0 && totalVolume > 0 ? totalVolume / totalArea : 21.5;

  const baseFertN = estate.syntheticNStandardKg + estate.syntheticNInhibitedKg;
  const baseMethaneCapture = mill.methaneCaptureEfficiencyPercent;
  const basePeatDepth = estate.peatDrainageDepthCm;
  const baseDiesel = estate.mobileFuelDieselLiters + estate.stationaryFuelDieselLiters;

  const parameterDefinitions: ParameterConfig[] = [
    {
      id: 'ffbYield',
      name: 'FFB Yield (t/ha)',
      shortName: 'FFB Yield',
      unit: 't/ha',
      color: '#10b981', // emerald-500
      active: activeParams.ffbYield,
      baselineValue: Number(baseFfbYield.toFixed(1)),
      category: 'Agronomy',
      icon: Sprout,
      tippingPointDesc: 'Higher yield dilutes fixed plantation footprint (Scope 1 LUC/Peat) across more CPO output.',
    },
    {
      id: 'fertilizerN',
      name: 'Synthetic N Application (kg N)',
      shortName: 'Fertilizer N Rate',
      unit: 'kg N',
      color: '#f59e0b', // amber-500
      active: activeParams.fertilizerN,
      baselineValue: baseFertN,
      category: 'Inputs',
      icon: Droplets,
      tippingPointDesc: 'Non-linear direct N₂O (1.0% N) & indirect volatilization (0.21%) beyond crop uptake optimum.',
    },
    {
      id: 'methaneCapture',
      name: 'Methane Capture Efficiency (%)',
      shortName: 'CH₄ Capture',
      unit: '%',
      color: '#3b82f6', // blue-500
      active: activeParams.methaneCapture,
      baselineValue: baseMethaneCapture,
      category: 'Mill Operations',
      icon: Flame,
      tippingPointDesc: 'Flaring or biogas generation avoids up to 90% of massive POME open lagoon methane emissions.',
    },
    {
      id: 'peatDepth',
      name: 'Peat Water Table Drainage (cm)',
      shortName: 'Peat Drainage',
      unit: 'cm',
      color: '#ec4899', // pink-500
      active: activeParams.peatDepth,
      baselineValue: basePeatDepth,
      category: 'Soil & LUC',
      icon: Layers,
      tippingPointDesc: 'Every 10 cm over-drainage accelerates microbial aerobic oxidation of tropical peat carbon.',
    },
    {
      id: 'fieldDiesel',
      name: 'Field & Transport Diesel (L)',
      shortName: 'Diesel Fuel',
      unit: 'Liters',
      color: '#8b5cf6', // violet-500
      active: activeParams.fieldDiesel,
      baselineValue: baseDiesel,
      category: 'Energy',
      icon: Fuel,
      tippingPointDesc: 'Upstream WTT fuel extraction + direct Scope 1 tailpipe exhaust from heavy tractors and transport.',
    },
  ];

  const toggleParam = (id: string) => {
    setActiveParams(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Variance percentages across -30% to +30%
  const varianceSteps = [-30, -20, -10, -5, 0, 5, 10, 20, 30];

  // Calculate curve points across variances
  const sensitivityData = useMemo(() => {
    return varianceSteps.map((pct) => {
      const factor = 1 + pct / 100;
      const point: any = {
        pct,
        pctLabel: pct === 0 ? 'Baseline (0%)' : `${pct > 0 ? '+' : ''}${pct}%`,
      };

      // 1. FFB Yield Variation
      const simSources = ffbSources.map(s => {
        const newYield = Math.max(5, s.yieldTonPerHa * factor);
        return {
          ...s,
          yieldTonPerHa: Number(newYield.toFixed(2)),
          ffbVolumeTon: Math.round(s.plantedAreaHa * newYield),
        };
      });
      const resYield = calculatePalmGHGV5(estate, mill, simSources);
      point.ffbYield_totalNet = Math.round(resYield.totalNetEmissions);
      point.ffbYield_cpo = Number(resYield.netGhgPerTonCpo.toFixed(3));
      point.ffbYield_val = (baseFfbYield * factor).toFixed(1);

      // 2. Fertilizer N Variation
      const simEstateFert: EstateParameters = {
        ...estate,
        syntheticNStandardKg: Math.max(0, Math.round(estate.syntheticNStandardKg * factor)),
        syntheticNInhibitedKg: Math.max(0, Math.round(estate.syntheticNInhibitedKg * factor)),
      };
      const resFert = calculatePalmGHGV5(simEstateFert, mill, ffbSources);
      point.fertilizerN_totalNet = Math.round(resFert.totalNetEmissions);
      point.fertilizerN_cpo = Number(resFert.netGhgPerTonCpo.toFixed(3));
      point.fertilizerN_val = Math.round(baseFertN * factor);

      // 3. Methane Capture Variation
      const simMethaneEff = Math.max(0, Math.min(99, baseMethaneCapture * factor));
      const simMillMethane: MillParameters = {
        ...mill,
        methaneCaptureEfficiencyPercent: Number(simMethaneEff.toFixed(1)),
      };
      const resMethane = calculatePalmGHGV5(estate, simMillMethane, ffbSources);
      point.methaneCapture_totalNet = Math.round(resMethane.totalNetEmissions);
      point.methaneCapture_cpo = Number(resMethane.netGhgPerTonCpo.toFixed(3));
      point.methaneCapture_val = simMethaneEff.toFixed(1);

      // 4. Peat Drainage Depth Variation
      const simPeatDepth = Math.max(10, Math.min(120, Math.round(basePeatDepth * factor)));
      const simEstatePeat: EstateParameters = {
        ...estate,
        peatDrainageDepthCm: simPeatDepth,
      };
      const resPeat = calculatePalmGHGV5(simEstatePeat, mill, ffbSources);
      point.peatDepth_totalNet = Math.round(resPeat.totalNetEmissions);
      point.peatDepth_cpo = Number(resPeat.netGhgPerTonCpo.toFixed(3));
      point.peatDepth_val = simPeatDepth;

      // 5. Field Diesel Fuel Variation
      const simEstateDiesel: EstateParameters = {
        ...estate,
        mobileFuelDieselLiters: Math.max(0, Math.round(estate.mobileFuelDieselLiters * factor)),
        stationaryFuelDieselLiters: Math.max(0, Math.round(estate.stationaryFuelDieselLiters * factor)),
      };
      const resDiesel = calculatePalmGHGV5(simEstateDiesel, mill, ffbSources);
      point.fieldDiesel_totalNet = Math.round(resDiesel.totalNetEmissions);
      point.fieldDiesel_cpo = Number(resDiesel.netGhgPerTonCpo.toFixed(3));
      point.fieldDiesel_val = Math.round(baseDiesel * factor);

      return point;
    });
  }, [estate, mill, ffbSources, baseFfbYield, baseFertN, baseMethaneCapture, basePeatDepth, baseDiesel]);

  // Compute Elasticity (% change in Net GHG per 10% change in parameter)
  const elasticitySummary = useMemo(() => {
    const baseNet = baselineResults.totalNetEmissions;
    const baseCpo = baselineResults.netGhgPerTonCpo;
    if (baseNet === 0 || baseCpo === 0) return [];

    const pPlus10 = sensitivityData.find(d => d.pct === 10);
    const pMinus10 = sensitivityData.find(d => d.pct === -10);
    if (!pPlus10 || !pMinus10) return [];

    return parameterDefinitions.map(p => {
      const netDelta = (pPlus10[`${p.id}_totalNet`] - pMinus10[`${p.id}_totalNet`]) / 2;
      const netPctDelta = (netDelta / Math.abs(baseNet)) * 100;

      const cpoDelta = (pPlus10[`${p.id}_cpo`] - pMinus10[`${p.id}_cpo`]) / 2;
      const cpoPctDelta = (cpoDelta / Math.abs(baseCpo)) * 100;

      // Sensitivity index: absolute impact
      const sensitivityRating = Math.abs(netPctDelta) > 10 ? 'High' : Math.abs(netPctDelta) > 3 ? 'Medium' : 'Low';

      return {
        ...p,
        netDelta,
        netPctDelta,
        cpoDelta,
        cpoPctDelta,
        sensitivityRating,
      };
    }).sort((a, b) => Math.abs(b.netPctDelta) - Math.abs(a.netPctDelta));
  }, [sensitivityData, baselineResults]);

  // RSPO Sustainable Benchmark threshold for CPO intensity
  const rspoBenchmarkCpo = 1.0; // tCO2e/t CPO
  const currentCpoIntensity = baselineResults.netGhgPerTonCpo;
  const currentTotalNet = baselineResults.totalNetEmissions;

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs text-emerald-300 mt-0.5 shrink-0 border border-white/10">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Interactive Sensitivity & Tipping Points Engine
                </span>
                <span className="text-white/40">·</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  RSPO PalmGHG V5 / ISO 14067
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                Multi-Variable Sensitivity Curves & Critical GHG Tipping Points
              </h2>
              <p className="text-xs text-emerald-100/80 mt-0.5 max-w-2xl">
                Identify the non-linear thresholds and tipping points where operational adjustments trigger disproportionate swings in net emissions and product carbon intensity.
              </p>
            </div>
          </div>

          {/* Metric Toggle & Active Summary */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center p-1 bg-black/30 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setMetricMode('totalNet')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  metricMode === 'totalNet'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                Total Net GHG (tCO₂e)
              </button>
              <button
                type="button"
                onClick={() => setMetricMode('cpoIntensity')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  metricMode === 'cpoIntensity'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                CPO Intensity (tCO₂e/t CPO)
              </button>
            </div>
            <div className="text-[11px] font-mono text-emerald-200/90">
              Current Baseline:{' '}
              <strong className="text-white">
                {metricMode === 'totalNet'
                  ? `${Math.round(currentTotalNet).toLocaleString()} tCO₂e/yr`
                  : `${currentCpoIntensity.toFixed(2)} tCO₂e/t CPO`}
              </strong>
            </div>
          </div>
        </div>

        {/* 4 Critical Tipping Point Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-white/15">
          {/* Tipping Point 1: RSPO 1.0 Benchmark */}
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs flex items-start gap-2">
            <div className={`p-1.5 rounded-lg shrink-0 ${
              currentCpoIntensity <= 1.0 ? 'bg-emerald-500/30 text-emerald-300' : 'bg-amber-500/30 text-amber-300'
            }`}>
              {currentCpoIntensity <= 1.0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-1">
                <span>RSPO 1.0 Tipping Point</span>
              </div>
              <p className="text-[10px] text-emerald-100/70 mt-0.5">
                {currentCpoIntensity <= 1.0
                  ? `Safe: Current ${currentCpoIntensity.toFixed(2)} is ${(1.0 - currentCpoIntensity).toFixed(2)} under RSPO threshold.`
                  : `Alert: Current ${currentCpoIntensity.toFixed(2)} breaches RSPO 1.0 limit by +${(currentCpoIntensity - 1.0).toFixed(2)} t.`}
              </p>
            </div>
          </div>

          {/* Tipping Point 2: Net-Zero Carbon Neutrality */}
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs flex items-start gap-2">
            <div className={`p-1.5 rounded-lg shrink-0 ${
              currentTotalNet <= 0 ? 'bg-emerald-500/30 text-emerald-300' : 'bg-blue-500/30 text-blue-300'
            }`}>
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">Net-Zero Neutrality (0 t)</div>
              <p className="text-[10px] text-emerald-100/70 mt-0.5">
                {currentTotalNet <= 0
                  ? 'Carbon negative! Sequestration exceeds gross emissions.'
                  : `Requires ${Math.round(currentTotalNet).toLocaleString()} tCO₂e abatement to reach carbon neutrality.`}
              </p>
            </div>
          </div>

          {/* Tipping Point 3: Nitrogen Law of Diminishing Returns */}
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs flex items-start gap-2">
            <div className="p-1.5 rounded-lg shrink-0 bg-amber-500/30 text-amber-300">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">N Volatilization Tipping Point</div>
              <p className="text-[10px] text-emerald-100/70 mt-0.5">
                {baseFertN / Math.max(1, estate.totalPlantedAreaHa) > 130
                  ? 'Excess N rate (>130 kg/ha): high direct & indirect N₂O losses.'
                  : 'Current N application is within standard agronomic uptake zone.'}
              </p>
            </div>
          </div>

          {/* Tipping Point 4: Peat Soil Runaway Oxidation */}
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs flex items-start gap-2">
            <div className={`p-1.5 rounded-lg shrink-0 ${
              estate.peatDrainageDepthCm > 60 ? 'bg-rose-500/30 text-rose-300' : 'bg-emerald-500/30 text-emerald-300'
            }`}>
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">Peat Drainage Limit (60 cm)</div>
              <p className="text-[10px] text-emerald-100/70 mt-0.5">
                {estate.peatDrainageDepthCm > 60
                  ? `Over-drained (${estate.peatDrainageDepthCm} cm): rapid carbon loss.`
                  : `Regulated (${estate.peatDrainageDepthCm} cm): complies with RSPO BMP water management.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Parameter Active Filter Toggles */}
      <div className="p-3.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Compare Variable Sensitivity Curves:
          </span>
          <span className="text-[11px] text-neutral-500">
            (toggle to show/hide lines)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {parameterDefinitions.map((param) => {
            const Icon = param.icon;
            const isParamActive = activeParams[param.id];
            return (
              <button
                key={param.id}
                type="button"
                onClick={() => toggleParam(param.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isParamActive
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: param.color }}
                />
                <Icon className="w-3.5 h-3.5" />
                <span>{param.shortName}</span>
                <span className="text-[10px] opacity-75 font-mono">
                  ({param.baselineValue.toLocaleString()} {param.unit})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Recharts Line Graph */}
      <div className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span>Sensitivity Trajectory Across Operational Variance (-30% to +30%)</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded font-normal bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                X-Axis: Operational Parameter % Deviation
              </span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Steeper slope indicates higher elasticity. Observe intersection points with critical policy benchmarks.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-neutral-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-neutral-400 inline-block" /> Baseline (0%)
            </span>
            {metricMode === 'cpoIntensity' && (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                <span className="w-3 h-0.5 bg-rose-500 border border-dashed border-rose-500 inline-block" /> RSPO Benchmark (1.0 tCO₂e/t)
              </span>
            )}
            {metricMode === 'totalNet' && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-3 h-0.5 bg-emerald-500 border border-dashed border-emerald-500 inline-block" /> Net Zero Neutrality (0 t)
              </span>
            )}
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-80 sm:h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={sensitivityData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              onMouseMove={(state: any) => {
                if (state?.activePayload?.[0]?.payload) {
                  setHoveredPoint(state.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333333' : '#e5e7eb'} />
              
              <XAxis
                dataKey="pct"
                type="number"
                domain={[-30, 30]}
                ticks={[-30, -20, -10, 0, 10, 20, 30]}
                tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}%`}
                stroke={isDark ? '#9ca3af' : '#6b7280'}
                fontSize={11}
                tickLine={false}
              />

              <YAxis
                stroke={isDark ? '#9ca3af' : '#6b7280'}
                fontSize={11}
                tickLine={false}
                domain={metricMode === 'totalNet' ? ['auto', 'auto'] : [0, 'auto']}
                tickFormatter={(val) =>
                  metricMode === 'totalNet'
                    ? `${(val / 1000).toFixed(0)}k`
                    : val.toFixed(2)
                }
                label={{
                  value: metricMode === 'totalNet' ? 'Net GHG Emissions (tCO₂e/yr)' : 'Product Carbon Intensity (tCO₂e / t CPO)',
                  angle: -90,
                  position: 'insideLeft',
                  fontSize: 11,
                  fill: isDark ? '#9ca3af' : '#6b7280',
                  offset: 0,
                }}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const numLabel = typeof label === 'number' ? label : Number(label) || 0;
                    return (
                      <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 text-xs space-y-2 min-w-56">
                        <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                          <span className="font-bold text-neutral-900 dark:text-neutral-100">
                            Variance: {numLabel > 0 ? `+${numLabel}` : numLabel}%
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            {numLabel === 0 ? 'Verified Baseline' : 'Simulated Point'}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {parameterDefinitions.map((param) => {
                            if (!activeParams[param.id]) return null;
                            const key = metricMode === 'totalNet' ? `${param.id}_totalNet` : `${param.id}_cpo`;
                            const currentVal = data[key];
                            const baseKey = metricMode === 'totalNet' ? currentTotalNet : currentCpoIntensity;
                            const delta = currentVal - baseKey;

                            return (
                              <div key={param.id} className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: param.color }} />
                                  <span>{param.shortName}</span>
                                </span>
                                <div className="text-right font-mono">
                                  <strong className="text-neutral-900 dark:text-neutral-100">
                                    {metricMode === 'totalNet'
                                      ? `${Math.round(currentVal).toLocaleString()} t`
                                      : `${currentVal.toFixed(2)} tCO₂e/t`}
                                  </strong>
                                  {numLabel !== 0 && (
                                    <span className={`text-[10px] ml-1 font-bold ${delta <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                      ({delta > 0 ? '+' : ''}{metricMode === 'totalNet' ? Math.round(delta) : delta.toFixed(2)})
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="pt-1.5 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-400">
                          Click parameter toggles above to isolate curves.
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Legend
                verticalAlign="top"
                height={36}
                formatter={(val) => {
                  const param = parameterDefinitions.find(p => p.id === val);
                  return (
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      {param ? param.shortName : val}
                    </span>
                  );
                }}
              />

              {/* Baseline Reference Line (X = 0) */}
              <ReferenceLine
                x={0}
                stroke={isDark ? '#6b7280' : '#9ca3af'}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                label={{
                  value: '0% Baseline',
                  position: 'top',
                  fill: isDark ? '#9ca3af' : '#6b7280',
                  fontSize: 10,
                }}
              />

              {/* Policy Tipping Point: RSPO 1.0 Benchmark Line */}
              {metricMode === 'cpoIntensity' && (
                <ReferenceLine
                  y={rspoBenchmarkCpo}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  label={{
                    value: 'RSPO Benchmark (1.0 tCO₂e/t CPO)',
                    position: 'insideTopRight',
                    fill: '#ef4444',
                    fontSize: 11,
                    fontWeight: 'bold',
                  }}
                />
              )}

              {/* Policy Tipping Point: Net Zero 0 tCO2e Line */}
              {metricMode === 'totalNet' && (
                <ReferenceLine
                  y={0}
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  label={{
                    value: 'Net-Zero Carbon Neutral (0 tCO₂e)',
                    position: 'insideBottomRight',
                    fill: '#10b981',
                    fontSize: 11,
                    fontWeight: 'bold',
                  }}
                />
              )}

              {/* Active Lines */}
              {parameterDefinitions.map((param) => {
                if (!activeParams[param.id]) return null;
                const dataKey = metricMode === 'totalNet' ? `${param.id}_totalNet` : `${param.id}_cpo`;
                return (
                  <Line
                    key={param.id}
                    type="monotone"
                    dataKey={dataKey}
                    name={param.id}
                    stroke={param.color}
                    strokeWidth={hoveredPoint ? 2.5 : 2}
                    dot={{ r: 3, fill: param.color, strokeWidth: 1 }}
                    activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Elasticity Ranking & Decision Support Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {elasticitySummary.map((item, idx) => {
          const isHighest = idx === 0;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                isHighest
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-xs'
                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {item.name}
                  </h4>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  item.sensitivityRating === 'High'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : item.sensitivityRating === 'Medium'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                }`}>
                  {item.sensitivityRating} Elasticity
                </span>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-neutral-500">10% Parameter Shift Impact:</span>
                  <span className={`text-sm font-mono font-bold ${item.netPctDelta <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {item.netPctDelta > 0 ? '+' : ''}{item.netPctDelta.toFixed(1)}% ({item.netDelta > 0 ? '+' : ''}{Math.round(item.netDelta).toLocaleString()} t)
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-neutral-500">CPO Intensity Delta:</span>
                  <span className="font-mono text-neutral-700 dark:text-neutral-300">
                    {item.cpoDelta > 0 ? '+' : ''}{item.cpoDelta.toFixed(3)} tCO₂e/t
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700/60 text-[11px] text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-1 font-semibold text-neutral-800 dark:text-neutral-200 mb-0.5">
                    <Info className="w-3 h-3 text-emerald-600" />
                    <span>Tipping Point Rationale</span>
                  </div>
                  {item.tippingPointDesc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
