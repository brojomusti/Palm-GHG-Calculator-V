import React, { useState, useMemo } from 'react';
import { PalmGHGAssessmentResults } from '../types/palmghg';
import {
  Flame,
  Droplets,
  Layers,
  Sprout,
  Fuel,
  Package,
  Truck,
  Zap,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Info,
  Sliders,
  Filter,
  BarChart3,
  Radar as RadarIcon,
  Grid3X3,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from 'recharts';

export interface LifeCycleHotspotItem {
  id: string;
  name: string;
  shortName: string;
  category: 'Land & Agriculture' | 'Mill Processing' | 'Energy & Fuel' | 'Supply Chain (Scope 3)';
  scope: 'Scope 1' | 'Scope 2' | 'Scope 3';
  scopeDetail: string;
  amountTco2e: number;
  percentageOfGross: number;
  percentageOfNet: number;
  intensityPerTonCpo: number;
  benchmarkPercent: number; // Typical conventional palm mill distribution
  severity: 'critical' | 'high' | 'moderate' | 'low';
  severityColor: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconName: string;
  primaryDriver: string;
  mitigationLever: string;
}

interface Props {
  results: PalmGHGAssessmentResults;
  scenarioLabel?: string;
  isDark?: boolean;
}

export const GhgHotspotsVisualization: React.FC<Props> = ({
  results,
  scenarioLabel = 'Likely Baseline',
  isDark = false,
}) => {
  // Visual Mode: 'radar' or 'heatmap' or 'split'
  const [viewMode, setViewMode] = useState<'radar' | 'heatmap' | 'split'>('split');
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>('pome');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'scope_1' | 'scope_2' | 'scope_3'>('all');

  // Format helper
  const fmt = (val: number, decimals: number = 1) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  // Calculate life-cycle stages from results
  const hotspotItems = useMemo<LifeCycleHotspotItem[]>(() => {
    const grossTotal = Math.max(1, results.totalGrossEmissions);
    const netTotal = Math.max(1, results.totalNetEmissions);
    const cpoTon = results.totalCpoProducedTon || 38300;

    // 1. POME Wastewater Treatment & Methane
    const pomeTotal = results.millScope1PomeLagoon + results.millScope1PomeMethaneUncombusted;
    // 2. Peat Soil Oxidation & Drainage
    const peatTotal = results.estateScope1Peat;
    // 3. Fertiliser Application (Soil Direct & Indirect N2O)
    const fertAppTotal = results.estateScope1FertiliserApp;
    // 4. Land Conversion & LUC Amortisation
    const lucTotal = results.estateScope1LucAmortised + results.estateScope1LandManagement;
    // 5. Operational Fossil Fuel Combustion
    const fuelTotal =
      results.estateScope1FuelStationary +
      results.estateScope1FuelMobile +
      results.millScope1FuelStationary +
      results.millScope1FuelMobile;
    // 6. Upstream Fertiliser Manufacturing & Transport
    const fertUpstreamTotal = results.estateScope3Cat1FertiliserMfg + results.estateScope3Cat4FertiliserTransport;
    // 7. Third-Party Purchased FFB & Supply Chain
    const thirdPartyFfbTotal = results.millScope3Cat1PurchasedFfb + results.millScope3Cat4FfbTransport;
    // 8. Purchased Grid Electricity & Transmission Losses
    const gridTotal =
      results.estateScope2GridElectricity +
      results.millScope2GridElectricity +
      results.estateScope3Cat3ElectricityUpstream +
      results.millScope3Cat3ElectricityUpstream;
    // 9. Fuel Upstream Well-to-Tank (WTT)
    const fuelWttTotal = results.estateScope3Cat3FuelWtt + results.millScope3Cat3FuelWtt;

    const rawStages = [
      {
        id: 'pome',
        name: 'POME Wastewater & Anaerobic Lagoons',
        shortName: 'POME Methane',
        category: 'Mill Processing' as const,
        scope: 'Scope 1' as const,
        scopeDetail: 'Mill Scope 1 (Lagoon + Fugitive Slip)',
        amountTco2e: pomeTotal,
        benchmarkPercent: 28.5,
        iconName: 'flame',
        primaryDriver: 'Organic COD digestion in anaerobic ponds emitting biogenic CH4 (GWP = 28).',
        mitigationLever: 'Biogas capture dome with enclosed high-efficiency flaring or gas engine power generation.',
      },
      {
        id: 'peat',
        name: 'Peat Soil Drainage & Oxidation',
        shortName: 'Peat Soil',
        category: 'Land & Agriculture' as const,
        scope: 'Scope 1' as const,
        scopeDetail: 'Estate Scope 1 (Peat Subsidence)',
        amountTco2e: peatTotal,
        benchmarkPercent: 24.0,
        iconName: 'droplets',
        primaryDriver: 'Microbial aerobic oxidation of drained tropical peatland (54.6 tCO2e/ha/yr).',
        mitigationLever: 'Maintain groundwater table at 40-50 cm via weir cascades and piezometer monitoring.',
      },
      {
        id: 'fert_app',
        name: 'Fertiliser Field Application (Soil N2O)',
        shortName: 'Fertiliser N2O',
        category: 'Land & Agriculture' as const,
        scope: 'Scope 1' as const,
        scopeDetail: 'Estate Scope 1 (Direct & Indirect N2O)',
        amountTco2e: fertAppTotal,
        benchmarkPercent: 14.5,
        iconName: 'sprout',
        primaryDriver: 'Nitrification and denitrification of applied synthetic and recycled organic nitrogen.',
        mitigationLever: 'Incorporate nitrification/urease inhibitors (NI/UI) and precision 4R placement.',
      },
      {
        id: 'luc',
        name: 'Land Conversion & LUC Amortisation',
        shortName: 'LUC Conversion',
        category: 'Land & Agriculture' as const,
        scope: 'Scope 1' as const,
        scopeDetail: 'Estate Scope 1 (25-Yr Amortisation)',
        amountTco2e: lucTotal,
        benchmarkPercent: 12.0,
        iconName: 'layers',
        primaryDriver: 'Linear 25-year amortisation of original vegetative clearing carbon balance.',
        mitigationLever: 'Strict zero-deforestation commitment and development only on low-carbon grassland.',
      },
      {
        id: 'fuel',
        name: 'Operational Machinery & Fossil Fuel',
        shortName: 'Fossil Diesel',
        category: 'Energy & Fuel' as const,
        scope: 'Scope 1' as const,
        scopeDetail: 'Estate & Mill Scope 1 (Mobile + Genset)',
        amountTco2e: fuelTotal,
        benchmarkPercent: 6.8,
        iconName: 'fuel',
        primaryDriver: 'Diesel combustion in harvesters, tractors, transport trucks, and mill diesel gensets.',
        mitigationLever: 'Electrification of yard wheel loaders, telematics optimization, and B35/B40 biodiesel.',
      },
      {
        id: 'fert_upstream',
        name: 'Fertiliser Manufacturing & Transport',
        shortName: 'Fertiliser Mfg (S3)',
        category: 'Supply Chain (Scope 3)' as const,
        scope: 'Scope 3' as const,
        scopeDetail: 'Estate Scope 3 Cat 1 & Cat 4',
        amountTco2e: fertUpstreamTotal,
        benchmarkPercent: 5.5,
        iconName: 'package',
        primaryDriver: 'Upstream fossil energy consumed in Haber-Bosch chemical fertilizer synthesis.',
        mitigationLever: 'Maximize organic nutrient recycling (EFB mulching, composting, treated POME land application).',
      },
      {
        id: 'third_party_ffb',
        name: '3rd-Party Purchased FFB Supply Chain',
        shortName: '3rd-Party FFB (S3)',
        category: 'Supply Chain (Scope 3)' as const,
        scope: 'Scope 3' as const,
        scopeDetail: 'Mill Scope 3 Cat 1 & Cat 4',
        amountTco2e: thirdPartyFfbTotal,
        benchmarkPercent: 5.2,
        iconName: 'truck',
        primaryDriver: 'Agricultural footprint of external independent smallholders and transit hauling.',
        mitigationLever: 'Supplier engagement, jurisdictional certification, and traceability geofencing.',
      },
      {
        id: 'grid_electricity',
        name: 'Purchased Grid Electricity & Losses',
        shortName: 'Grid Power (S2/S3)',
        category: 'Energy & Fuel' as const,
        scope: 'Scope 2' as const,
        scopeDetail: 'Estate & Mill Scope 2 & Scope 3 Cat 3',
        amountTco2e: gridTotal,
        benchmarkPercent: 2.3,
        iconName: 'zap',
        primaryDriver: 'Off-site electricity purchased from national grid with fossil generation mix.',
        mitigationLever: 'Maximize self-generation using biomass cogeneration boilers (EFB and palm kernel shell).',
      },
      {
        id: 'fuel_wtt',
        name: 'Fuel Upstream Supply Chain (WTT)',
        shortName: 'Fuel WTT (S3)',
        category: 'Supply Chain (Scope 3)' as const,
        scope: 'Scope 3' as const,
        scopeDetail: 'Estate & Mill Scope 3 Cat 3',
        amountTco2e: fuelWttTotal,
        benchmarkPercent: 1.2,
        iconName: 'fuel',
        primaryDriver: 'Well-to-tank crude oil extraction, refining, and diesel transport pipeline.',
        mitigationLever: 'Transition to certified renewable biodiesel and reduced overall fuel volume.',
      },
    ];

    // Determine severity thresholds and styling
    return rawStages
      .map((s) => {
        const pctGross = (s.amountTco2e / grossTotal) * 100;
        const pctNet = (s.amountTco2e / netTotal) * 100;
        const intensity = cpoTon > 0 ? s.amountTco2e / cpoTon : 0;

        let severity: LifeCycleHotspotItem['severity'] = 'low';
        let severityColor = '#10b981';
        let bgColor = 'bg-emerald-50 dark:bg-emerald-950/20';
        let borderColor = 'border-emerald-200 dark:border-emerald-800';
        let textColor = 'text-emerald-700 dark:text-emerald-400';

        if (pctGross >= 25) {
          severity = 'critical';
          severityColor = '#ef4444';
          bgColor = 'bg-red-50 dark:bg-red-950/30';
          borderColor = 'border-red-300 dark:border-red-800';
          textColor = 'text-red-700 dark:text-red-400';
        } else if (pctGross >= 15) {
          severity = 'high';
          severityColor = '#f97316';
          bgColor = 'bg-orange-50 dark:bg-orange-950/30';
          borderColor = 'border-orange-300 dark:border-orange-800';
          textColor = 'text-orange-700 dark:text-orange-400';
        } else if (pctGross >= 5) {
          severity = 'moderate';
          severityColor = '#f59e0b';
          bgColor = 'bg-amber-50 dark:bg-amber-950/20';
          borderColor = 'border-amber-200 dark:border-amber-800';
          textColor = 'text-amber-700 dark:text-amber-400';
        }

        return {
          ...s,
          percentageOfGross: pctGross,
          percentageOfNet: pctNet,
          intensityPerTonCpo: intensity,
          severity,
          severityColor,
          bgColor,
          borderColor,
          textColor,
        };
      })
      .sort((a, b) => b.amountTco2e - a.amountTco2e);
  }, [results]);

  // Selected Item details
  const selectedHotspot = useMemo(() => {
    return hotspotItems.find((h) => h.id === selectedHotspotId) || hotspotItems[0];
  }, [hotspotItems, selectedHotspotId]);

  // Filtered Items for Heatmap
  const filteredHotspots = useMemo(() => {
    if (scopeFilter === 'all') return hotspotItems;
    if (scopeFilter === 'scope_1') return hotspotItems.filter((h) => h.scope === 'Scope 1');
    if (scopeFilter === 'scope_2') return hotspotItems.filter((h) => h.scope === 'Scope 2');
    return hotspotItems.filter((h) => h.scope === 'Scope 3');
  }, [hotspotItems, scopeFilter]);

  // Radar Chart Dataset: Normalised scale (0 to 100) or actual percentage of gross
  const radarChartData = useMemo(() => {
    return hotspotItems.map((h) => ({
      stage: h.shortName,
      fullName: h.name,
      currentScenario: Number(h.percentageOfGross.toFixed(1)),
      industryBenchmark: Number(h.benchmarkPercent.toFixed(1)),
      amountTco2e: h.amountTco2e,
      severity: h.severity,
    }));
  }, [hotspotItems]);

  // Top 3 cumulative Pareto share
  const top3Share = useMemo(() => {
    const sumTop3 = hotspotItems.slice(0, 3).reduce((acc, h) => acc + h.percentageOfGross, 0);
    return Math.min(100, sumTop3);
  }, [hotspotItems]);

  // Primary Hotspot & Secondary Hotspot
  const primaryHotspot = hotspotItems[0];
  const secondaryHotspot = hotspotItems[1];

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-400 mt-0.5 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  Analisis Hotspot Emisi Siklus Hidup (LCA)
                </span>
                <span className="text-xs text-neutral-300 dark:text-neutral-700">·</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  Skenario: {scenarioLabel}
                </span>
              </div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                Life-Cycle GHG Hotspots Identification & Multi-Axis Radar
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5 max-w-3xl">
                Mengidentifikasi tahapan siklus hidup rantai nilai kelapa sawit (konversi lahan, pupuk kimia, limbah POME, bahan bakar, dan rantai pasok) yang memberikan kontribusi paling signifikan terhadap total jejak karbon CO₂e.
              </p>
            </div>
          </div>

          {/* View Mode Toggle Controls */}
          <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Split View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('radar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'radar'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
              }`}
            >
              <RadarIcon className="w-3.5 h-3.5 text-amber-600" />
              <span>Radar Chart</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('heatmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'heatmap'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5 text-sky-600" />
              <span>Heatmap Matrix</span>
            </button>
          </div>
        </div>

        {/* 4 TOP KPI SUMMARY TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 bg-red-50/70 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-red-800 dark:text-red-300 uppercase tracking-wide">
                Primary Hotspot #1
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100 rounded">
                CRITICAL
              </span>
            </div>
            <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-1 truncate">
              {primaryHotspot?.name}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-red-700 dark:text-red-400">
                {fmt(primaryHotspot?.amountTco2e, 0)}
              </span>
              <span className="text-xs text-neutral-500">tCO₂e</span>
              <span className="text-xs font-mono font-bold text-red-700 dark:text-red-400">
                ({fmt(primaryHotspot?.percentageOfGross, 1)}%)
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-orange-50/70 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wide">
                Secondary Hotspot #2
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-orange-200 dark:bg-orange-900 text-orange-900 dark:text-orange-100 rounded">
                HIGH
              </span>
            </div>
            <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-1 truncate">
              {secondaryHotspot?.name}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-orange-700 dark:text-orange-400">
                {fmt(secondaryHotspot?.amountTco2e, 0)}
              </span>
              <span className="text-xs text-neutral-500">tCO₂e</span>
              <span className="text-xs font-mono font-bold text-orange-700 dark:text-orange-400">
                ({fmt(secondaryHotspot?.percentageOfGross, 1)}%)
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                Pareto Concentration (Top 3)
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 rounded">
                80/20 Rule
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
              {fmt(top3Share, 1)}%
            </div>
            <div className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
              Tiga tahapan teratas mendominasi mayoritas emisi kotor operasional.
            </div>
          </div>

          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80">
            <span className="text-[11px] font-medium text-neutral-500">Total Gross Footprint Dianalisis</span>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
              {fmt(results.totalGrossEmissions, 0)} <span className="text-xs font-normal text-neutral-500">tCO₂e</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5 font-mono">
              Net: <strong>{fmt(results.totalNetEmissions, 0)}</strong> tCO₂e ({fmt(results.netGhgPerTonCpo, 2)} t/t)
            </div>
          </div>
        </div>
      </div>

      {/* MAIN VISUALIZATION GRID */}
      <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        {/* RADAR CHART PANEL */}
        {(viewMode === 'radar' || viewMode === 'split') && (
          <div
            className={`p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 ${
              viewMode === 'split' ? 'lg:col-span-6' : 'w-full'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <RadarIcon className="w-4 h-4 text-amber-500" />
                  <span>Life-Cycle Stages Radar Chart (% of Gross Emissions)</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Membandingkan profil hotspot skenario aktif terhadap profil benchmark industri kelapa sawit konvensional.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                  <span className="text-neutral-700 dark:text-neutral-300">Skenario Aktif</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-400 inline-block"></span>
                  <span className="text-neutral-700 dark:text-neutral-300">Benchmark RSPO</span>
                </div>
              </div>
            </div>

            {/* Recharts Radar Chart */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarChartData} outerRadius="75%">
                  <PolarGrid stroke={isDark ? '#333' : '#e5e7eb'} />
                  <PolarAngleAxis
                    dataKey="stage"
                    tick={{ fill: isDark ? '#d1d5db' : '#374151', fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 'auto']}
                    tick={{ fill: isDark ? '#888' : '#9ca3af', fontSize: 9, fontFamily: 'monospace' }}
                    stroke={isDark ? '#444' : '#d1d5db'}
                  />
                  <Radar
                    name="Skenario Aktif (%)"
                    dataKey="currentScenario"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.4}
                  />
                  <Radar
                    name="RSPO Benchmark (%)"
                    dataKey="industryBenchmark"
                    stroke="#38bdf8"
                    fill="#38bdf8"
                    fillOpacity={0.2}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 bg-neutral-900 text-white rounded-xl shadow-lg border border-neutral-700 text-xs space-y-1.5 min-w-[220px]">
                            <div className="font-bold border-b border-neutral-700 pb-1 text-amber-400 flex items-center justify-between">
                              <span>{data.fullName}</span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                  data.severity === 'critical'
                                    ? 'bg-red-900 text-red-200'
                                    : data.severity === 'high'
                                    ? 'bg-orange-900 text-orange-200'
                                    : 'bg-amber-900 text-amber-200'
                                }`}
                              >
                                {data.severity}
                              </span>
                            </div>
                            <div className="space-y-1 text-[11px]">
                              <div className="flex justify-between">
                                <span className="text-neutral-400">Emisi Skenario:</span>
                                <span className="font-mono font-bold text-white">
                                  {fmt(data.amountTco2e, 0)} tCO₂e
                                </span>
                              </div>
                              <div className="flex justify-between text-amber-400">
                                <span>Porsi Emisi Kotor:</span>
                                <span className="font-mono font-bold">{data.currentScenario}%</span>
                              </div>
                              <div className="flex justify-between text-sky-400">
                                <span>Benchmark Industri:</span>
                                <span className="font-mono font-bold">{data.industryBenchmark}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* HEATMAP MATRIX PANEL */}
        {(viewMode === 'heatmap' || viewMode === 'split') && (
          <div
            className={`p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 ${
              viewMode === 'split' ? 'lg:col-span-6' : 'w-full'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4 text-sky-500" />
                  <span>Interactive Hotspots Heatmap Matrix</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Tingkat keparahan emisi diberi kode warna: Merah (Kritis {'>'}25%), Oranye (Tinggi 15-25%), Kuning (Sedang 5-15%), Hijau (Rendah {'<'}5%).
                </p>
              </div>

              {/* Filter by Scope */}
              <div className="flex items-center gap-1 p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-semibold shrink-0">
                {(['all', 'scope_1', 'scope_2', 'scope_3'] as const).map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setScopeFilter(sc)}
                    className={`px-2 py-1 rounded-md transition-colors ${
                      scopeFilter === sc
                        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    {sc === 'all' ? 'All' : sc === 'scope_1' ? 'Scope 1' : sc === 'scope_2' ? 'Scope 2' : 'Scope 3'}
                  </button>
                ))}
              </div>
            </div>

            {/* Heatmap Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
              {filteredHotspots.map((item, idx) => {
                const isSelected = selectedHotspotId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedHotspotId(item.id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      item.bgColor
                    } ${
                      isSelected
                        ? `${item.borderColor} ring-2 ring-amber-500/30 shadow-xs scale-[1.01]`
                        : 'border-transparent hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/70 dark:bg-black/30 text-neutral-700 dark:text-neutral-300 font-mono">
                          #{idx + 1} · {item.scope}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            item.severity === 'critical'
                              ? 'bg-red-600 text-white'
                              : item.severity === 'high'
                              ? 'bg-orange-600 text-white'
                              : item.severity === 'moderate'
                              ? 'bg-amber-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {item.severity}
                        </span>
                      </div>
                      <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 mt-1.5 line-clamp-1">
                        {item.name}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex items-baseline justify-between">
                      <div>
                        <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
                          {fmt(item.amountTco2e, 0)}
                        </span>
                        <span className="text-[10px] text-neutral-500 ml-1">tCO₂e</span>
                      </div>
                      <span className={`text-xs font-mono font-bold ${item.textColor}`}>
                        {fmt(item.percentageOfGross, 1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SELECTED HOTSPOT DEEP DIVE & MITIGATION RECOMMENDATION */}
      {selectedHotspot && (
        <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <span
                className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                  selectedHotspot.severity === 'critical'
                    ? 'bg-red-500'
                    : selectedHotspot.severity === 'high'
                    ? 'bg-orange-500'
                    : 'bg-amber-500'
                }`}
              ></span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {selectedHotspot.name}
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      selectedHotspot.severity === 'critical'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        : selectedHotspot.severity === 'high'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    Level: {selectedHotspot.severity}
                  </span>
                </div>
                <span className="text-xs text-neutral-500">
                  {selectedHotspot.scopeDetail} · Kategori: {selectedHotspot.category}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-neutral-500">Intensitas Emisi:</span>
              <div className="text-sm font-mono font-bold text-neutral-900 dark:text-neutral-100">
                {fmt(selectedHotspot.intensityPerTonCpo, 3)} tCO₂e / ton CPO
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <span className="text-[11px] font-semibold text-neutral-500">Kuantitas Emisi Tahunan</span>
              <div className="text-base font-mono font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                {fmt(selectedHotspot.amountTco2e, 0)} <span className="text-xs font-normal text-neutral-500">tCO₂e/yr</span>
              </div>
              <div className="text-xs text-neutral-500 mt-0.5 font-mono">
                Porsi Kotor: <strong>{fmt(selectedHotspot.percentageOfGross, 1)}%</strong>
              </div>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <span className="text-[11px] font-semibold text-neutral-500">Akar Penyebab Utama (Root Cause)</span>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1 leading-snug">
                {selectedHotspot.primaryDriver}
              </p>
            </div>

            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Tuas Mitigasi PalmGHG V5
              </span>
              <p className="text-xs text-emerald-900 dark:text-emerald-200 mt-1 leading-snug">
                {selectedHotspot.mitigationLever}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE HOTSPOTS RANKING TABLE */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Tabel Peringkat Kontribusi Hotspot Emisi Siklus Hidup
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Urutan kontribusi emisi dari yang paling dominan hingga terkecil dengan target intervensi operasional.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border border-neutral-200 dark:border-neutral-700">
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold border-b border-neutral-200 dark:border-neutral-700">
                <th className="p-2.5 w-12 text-center">Rank</th>
                <th className="p-2.5 w-52">Tahapan Siklus Hidup</th>
                <th className="p-2.5 w-24 text-center">Scope</th>
                <th className="p-2.5 text-right w-32">Emisi (tCO₂e)</th>
                <th className="p-2.5 text-right w-28">Porsi Kotor (%)</th>
                <th className="p-2.5 text-right w-32">Intensitas (t/t CPO)</th>
                <th className="p-2.5 text-center w-28">Klasifikasi</th>
                <th className="p-2.5">Aksi Mitigasi Rekomendasi RSPO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {hotspotItems.map((item, idx) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedHotspotId(item.id)}
                  className={`cursor-pointer transition-colors ${
                    selectedHotspotId === item.id
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 font-medium'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <td className="p-2.5 text-center font-bold">
                    <span
                      className={`inline-block w-5 h-5 leading-5 rounded-full text-[10px] text-white ${
                        idx === 0
                          ? 'bg-red-600'
                          : idx === 1
                          ? 'bg-orange-600'
                          : idx === 2
                          ? 'bg-amber-600'
                          : 'bg-neutral-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="p-2.5 font-bold text-neutral-900 dark:text-neutral-100">
                    {item.name}
                  </td>
                  <td className="p-2.5 text-center font-mono">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {item.scope}
                    </span>
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                    {fmt(item.amountTco2e, 0)}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-amber-700 dark:text-amber-400">
                    {fmt(item.percentageOfGross, 1)}%
                  </td>
                  <td className="p-2.5 text-right font-mono text-neutral-700 dark:text-neutral-300">
                    {fmt(item.intensityPerTonCpo, 3)}
                  </td>
                  <td className="p-2.5 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.severity === 'critical'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : item.severity === 'high'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                          : item.severity === 'moderate'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </td>
                  <td className="p-2.5 text-xs text-neutral-600 dark:text-neutral-400">
                    {item.mitigationLever}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
