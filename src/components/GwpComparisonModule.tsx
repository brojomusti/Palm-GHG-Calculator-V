import React, { useState, useMemo } from 'react';
import {
  PalmGHGAssessmentResults,
  EstateParameters,
  MillParameters,
} from '../types/palmghg';
import { CONSTANTS } from '../utils/palmghgCalculations';
import {
  Scale,
  TrendingDown,
  TrendingUp,
  Info,
  Flame,
  Sprout,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  RefreshCw,
  FileCheck,
  Globe2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';

export interface GwpStandardPreset {
  id: string;
  name: string;
  shortLabel: string;
  ipccReport: string;
  horizonYears: number;
  ch4Gwp: number;
  n2oGwp: number;
  isBaseline?: boolean;
  statusTag: string;
  tagColor: string;
  descriptionEn: string;
  descriptionId: string;
  complianceUsage: string;
}

export const GWP_PRESETS: GwpStandardPreset[] = [
  {
    id: 'AR5_100',
    name: 'IPCC AR5 (2014) GWP-100',
    shortLabel: 'AR5 (100-yr)',
    ipccReport: 'Fifth Assessment Report (AR5, WG1 Ch 8)',
    horizonYears: 100,
    ch4Gwp: 28,
    n2oGwp: 265,
    isBaseline: true,
    statusTag: 'Current Baseline (RSPO V5)',
    tagColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    descriptionEn: 'The official regulatory standard adopted in RSPO PalmGHG V5 and GHG Protocol Land Sector and Removals (LSR) v1.1. Accounts for biogenic methane.',
    descriptionId: 'Standar regulasi resmi yang digunakan dalam RSPO PalmGHG V5 dan GHG Protocol Land Sector and Removals (LSR) v1.1. Menghitung metana biogenik.',
    complianceUsage: 'RSPO PalmGHG V5, ISCC EU, GHG Protocol Corporate Standard, SBTi FLAG',
  },
  {
    id: 'AR6_100',
    name: 'IPCC AR6 (2021) GWP-100',
    shortLabel: 'AR6 (100-yr)',
    ipccReport: 'Sixth Assessment Report (AR6, WG1 Ch 7)',
    horizonYears: 100,
    ch4Gwp: 27.2,
    n2oGwp: 273,
    statusTag: 'Latest UNFCCC / ISO 14067',
    tagColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    descriptionEn: 'Latest scientific consensus from IPCC AR6. Mandatory under UNFCCC Decision 5/CMA.3 for Paris Agreement Biennial Transparency Reports (BTR) and modern ISO 14067 LCAs.',
    descriptionId: 'Konsensus ilmiah terbaru dari IPCC AR6. Wajib digunakan berdasarkan Keputusan UNFCCC 5/CMA.3 untuk Laporan Transparansi Dua Tahunan (BTR) Perjanjian Paris dan LCA ISO 14067.',
    complianceUsage: 'Paris Agreement BTR (2024+), ISO 14067:2018, EU CSDDD & CSRD ESG Disclosures',
  },
  {
    id: 'AR4_100',
    name: 'IPCC AR4 (2007) GWP-100',
    shortLabel: 'AR4 (100-yr)',
    ipccReport: 'Fourth Assessment Report (AR4, WG1)',
    horizonYears: 100,
    ch4Gwp: 25,
    n2oGwp: 298,
    statusTag: 'Legacy PalmGHG V1-V4',
    tagColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    descriptionEn: 'Historical baseline utilized in earlier RSPO PalmGHG (v1 to v4) audits, Clean Development Mechanism (CDM), and initial national communications.',
    descriptionId: 'Tolok ukur historis yang digunakan dalam audit RSPO PalmGHG versi terdahulu (v1 hingga v4), Mekanisme Pembangunan Bersih (CDM), dan komunikasi awal nasional.',
    complianceUsage: 'Audit historis RSPO PalmGHG v1-v4, CDM Biogas POME Projects, UNFCCC KP CP1',
  },
  {
    id: 'AR5_CC',
    name: 'IPCC AR5 with Climate-Carbon Feedbacks',
    shortLabel: 'AR5 + cc Feedbacks',
    ipccReport: 'IPCC AR5 WG1 Chapter 8 (coupled feedback model)',
    horizonYears: 100,
    ch4Gwp: 34,
    n2oGwp: 298,
    statusTag: 'Biosphere Feedbacks',
    tagColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-700',
    descriptionEn: 'Includes climate-carbon cycle feedback loops for non-CO2 gases, representing secondary temperature impacts on tropical vegetation and soil respiration.',
    descriptionId: 'Memperhitungkan umpan balik siklus iklim-karbon untuk gas non-CO2, merepresentasikan dampak suhu sekunder pada vegetasi tropis dan respirasi tanah.',
    complianceUsage: 'Earth System Modeling, Comprehensive Academic LCA Studies, High-Ambition Scope 3 Audits',
  },
  {
    id: 'AR6_20',
    name: 'IPCC AR6 (2021) GWP-20 (Near-Term)',
    shortLabel: 'AR6 GWP-20 (20-yr)',
    ipccReport: 'IPCC AR6 WG1 Table 7.15 (20-year time horizon)',
    horizonYears: 20,
    ch4Gwp: 82.5,
    n2oGwp: 273,
    statusTag: 'Methane Urgency / Near-Term',
    tagColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-700',
    descriptionEn: 'Evaluates the immediate warming pulse over a 20-year horizon. Crucial for assessing fugitive methane slip and uncaptured POME lagoon risks under the Global Methane Pledge.',
    descriptionId: 'Mengevaluasi denyut pemanasan langsung dalam kurun waktu 20 tahun. Sangat penting untuk menilai risiko kebocoran metana dan kolam terbuka POME di bawah Ikrar Metana Global.',
    complianceUsage: 'Global Methane Pledge, UNEP IMEO Oil & Gas/Agri Methane Partnerships, Short-Lived Pollutants',
  },
];

interface Props {
  results: PalmGHGAssessmentResults;
  mill: MillParameters;
  estate: EstateParameters;
  isDark?: boolean;
}

export const GwpComparisonModule: React.FC<Props> = ({
  results,
  mill,
  estate,
  isDark = false,
}) => {
  const [selectedStandardId, setSelectedStandardId] = useState<string>('AR6_100');
  const [customCh4, setCustomCh4] = useState<number>(28);
  const [customN2o, setCustomN2o] = useState<number>(265);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  const [chartMetric, setChartMetric] = useState<'net_total' | 'cpo_intensity' | 'gas_breakdown'>('net_total');

  // Format helper
  const fmt = (num: number, decimals: number = 1) =>
    num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  // Calculate actual physical gas quantities emitted
  const physicalGases = useMemo(() => {
    // 1. Methane (CH4)
    // Base results used AR5 (GWP_CH4 = 28)
    const basePomeLagoonTco2e = results.millScope1PomeLagoon;
    const basePomeMethaneUncombustedTco2e = results.millScope1PomeMethaneUncombusted;
    const totalPomeCh4Tco2e = basePomeLagoonTco2e + basePomeMethaneUncombustedTco2e;
    const physicalCh4Tonnes = CONSTANTS.GWP_CH4 > 0 ? totalPomeCh4Tco2e / CONSTANTS.GWP_CH4 : 0;

    // 2. Nitrous Oxide (N2O)
    // Base results used AR5 (GWP_N2O = 265)
    const baseFertiliserTco2e = results.estateScope1FertiliserApp;
    const physicalN2OTonnes = CONSTANTS.GWP_N2O > 0 ? baseFertiliserTco2e / CONSTANTS.GWP_N2O : 0;

    // 3. Carbon Dioxide (CO2) - fixed GWP = 1.0 across all IPCC reports
    // All other gross emissions (fuels, peat decomposition, LUC, electricity, Scope 3 manufacturing/transport)
    const nonGwpVaryingGrossTco2e =
      results.totalGrossEmissions - totalPomeCh4Tco2e - baseFertiliserTco2e;

    // Deductions (removals and avoided) are pure carbon/energy offsets (GWP = 1)
    const totalRemovals = results.totalCarbonRemovals;
    const totalAvoided = results.totalEmissionsAvoided;

    const totalCpoProducedTon = results.totalCpoProducedTon > 0 ? results.totalCpoProducedTon : 1;
    const totalFfbProcessedTon = results.totalFfbProcessedTon > 0 ? results.totalFfbProcessedTon : 1;

    return {
      physicalCh4Tonnes,
      physicalN2OTonnes,
      nonGwpVaryingGrossTco2e,
      totalRemovals,
      totalAvoided,
      totalCpoProducedTon,
      totalFfbProcessedTon,
      baseNetEmissions: results.totalNetEmissions,
      baseNetPerTonCpo: results.netGhgPerTonCpo,
      baseNetPerTonFfb: results.netGhgPerTonFfb,
      basePomeCh4Tco2e: totalPomeCh4Tco2e,
      baseFertiliserTco2e,
    };
  }, [results]);

  // Function to re-calculate GHG inventory under any GWP factors
  const calculateWithGwp = (ch4Gwp: number, n2oGwp: number) => {
    const pomeCh4Tco2e = physicalGases.physicalCh4Tonnes * ch4Gwp;
    const fertiliserN2oTco2e = physicalGases.physicalN2OTonnes * n2oGwp;
    const totalGrossEmissions =
      physicalGases.nonGwpVaryingGrossTco2e + pomeCh4Tco2e + fertiliserN2oTco2e;
    const totalNetEmissions =
      totalGrossEmissions - physicalGases.totalRemovals - physicalGases.totalAvoided;
    const netGhgPerTonCpo = totalNetEmissions / physicalGases.totalCpoProducedTon;
    const netGhgPerTonFfb = totalNetEmissions / physicalGases.totalFfbProcessedTon;

    const deltaNetEmissions = totalNetEmissions - physicalGases.baseNetEmissions;
    const deltaNetPercent =
      physicalGases.baseNetEmissions !== 0
        ? (deltaNetEmissions / Math.abs(physicalGases.baseNetEmissions)) * 100
        : 0;
    const deltaNetPerTonCpo = netGhgPerTonCpo - physicalGases.baseNetPerTonCpo;

    return {
      ch4Gwp,
      n2oGwp,
      pomeCh4Tco2e,
      fertiliserN2oTco2e,
      co2GrossTco2e: physicalGases.nonGwpVaryingGrossTco2e,
      totalGrossEmissions,
      totalNetEmissions,
      netGhgPerTonCpo,
      netGhgPerTonFfb,
      deltaNetEmissions,
      deltaNetPercent,
      deltaNetPerTonCpo,
    };
  };

  // Compute for all presets
  const presetCalculations = useMemo(() => {
    return GWP_PRESETS.map((preset) => {
      const calc = calculateWithGwp(preset.ch4Gwp, preset.n2oGwp);
      return {
        ...preset,
        ...calc,
      };
    });
  }, [physicalGases]);

  // Active selected calculation
  const activeCalc = useMemo(() => {
    if (isCustomMode) {
      const calc = calculateWithGwp(customCh4, customN2o);
      return {
        ...calc,
        id: 'CUSTOM',
        name: 'Custom User-Defined GWP Values',
        shortLabel: `Custom (${customCh4}/${customN2o})`,
        ipccReport: 'Interactive User Sensitivity Model',
        horizonYears: 100,
        statusTag: 'Custom Parameter',
        tagColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
        descriptionEn: 'Custom user defined Global Warming Potentials for advanced research or regional policy simulation.',
        descriptionId: 'Nilai Potensi Pemanasan Global kustom untuk riset lanjutan atau simulasi regulasi regional.',
        complianceUsage: 'Research / Internal Carbon Pricing / Stress Testing',
      };
    }
    const found = presetCalculations.find((p) => p.id === selectedStandardId);
    return found || presetCalculations[0];
  }, [isCustomMode, selectedStandardId, customCh4, customN2o, presetCalculations]);

  // Chart data for comparing all 5 standard GWP metrics + active custom
  const chartData = useMemo(() => {
    const list = [...presetCalculations];
    if (isCustomMode) {
      list.push(activeCalc as any);
    }

    return list.map((item) => ({
      name: item.shortLabel,
      fullLabel: item.name,
      id: item.id,
      ch4Gwp: item.ch4Gwp,
      n2oGwp: item.n2oGwp,
      netEmissions: Math.round(item.totalNetEmissions),
      cpoIntensity: Number(item.netGhgPerTonCpo.toFixed(2)),
      pomeMethane: Math.round(item.pomeCh4Tco2e),
      fertN2o: Math.round(item.fertiliserN2oTco2e),
      co2AndOther: Math.round(item.co2GrossTco2e),
      deltaNetPercent: Number(item.deltaNetPercent.toFixed(1)),
      isSelected: isCustomMode ? item.id === 'CUSTOM' : item.id === selectedStandardId,
      isBaseline: item.isBaseline,
    }));
  }, [presetCalculations, isCustomMode, activeCalc, selectedStandardId]);

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 mt-0.5 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  {language === 'id' ? 'Modul Analisis GWP' : 'GWP Sensitivity & Recalculation Engine'}
                </span>
                <span className="text-xs text-neutral-300 dark:text-neutral-700">·</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  IPCC AR4 vs AR5 vs AR6 vs GWP-20
                </span>
              </div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                {language === 'id'
                  ? 'Simulasi Dampak Potensi Pemanasan Global (GWP) Terhadap Emisi CO₂e'
                  : 'Global Warming Potential (GWP) Metric Toggle & Carbon Footprint Impact'}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {language === 'id'
                  ? 'Bandingkan bagaimana perbedaan faktor konversi metana (CH₄) dan dinitrogen oksida (N₂O) antar laporan asesmen IPCC memengaruhi inventarisasi emisi dan intensitas CPO.'
                  : 'Evaluate how differing methane (CH₄) and nitrous oxide (N₂O) equivalence factors across IPCC Assessment Reports transform total net GHG emissions and CPO footprint.'}
              </p>
            </div>
          </div>

          {/* Controls: Language Toggle & Custom Mode Switch */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLanguage('id')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  language === 'id'
                    ? 'bg-white dark:bg-neutral-700 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  language === 'en'
                    ? 'bg-white dark:bg-neutral-700 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsCustomMode(!isCustomMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isCustomMode
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isCustomMode ? (language === 'id' ? 'Mode Kustom Aktif' : 'Custom Mode On') : (language === 'id' ? 'Kustom GWP' : 'Custom GWP')}</span>
            </button>
          </div>
        </div>

        {/* PHYSICAL GAS UNDERPINNINGS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Methane Gas Card */}
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                {language === 'id' ? 'Massa Fisik Metana (CH₄)' : 'Physical Methane (CH₄) Mass'}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                POME WWTP
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-amber-800 dark:text-amber-200">
                {fmt(physicalGases.physicalCh4Tonnes, 1)}
              </span>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                Ton CH₄ / {language === 'id' ? 'tahun' : 'year'}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-400/80">
              {language === 'id'
                ? `Setara ${fmt(activeCalc.pomeCh4Tco2e, 0)} tCO₂e pada GWP saat ini (${activeCalc.ch4Gwp}×)`
                : `Equivalent to ${fmt(activeCalc.pomeCh4Tco2e, 0)} tCO₂e under current GWP (${activeCalc.ch4Gwp}×)`}
            </div>
          </div>

          {/* Nitrous Oxide Gas Card */}
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {language === 'id' ? 'Massa Fisik Dinitrogen Oksida (N₂O)' : 'Physical Nitrous Oxide (N₂O) Mass'}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200">
                {language === 'id' ? 'Pupuk Kebun' : 'Fertiliser'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-emerald-800 dark:text-emerald-200">
                {fmt(physicalGases.physicalN2OTonnes, 2)}
              </span>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                Ton N₂O / {language === 'id' ? 'tahun' : 'year'}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
              {language === 'id'
                ? `Setara ${fmt(activeCalc.fertiliserN2oTco2e, 0)} tCO₂e pada GWP saat ini (${activeCalc.n2oGwp}×)`
                : `Equivalent to ${fmt(activeCalc.fertiliserN2oTco2e, 0)} tCO₂e under current GWP (${activeCalc.n2oGwp}×)`}
            </div>
          </div>

          {/* CO2 & Fixed Scope Card */}
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <Globe2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                {language === 'id' ? 'Emisi Karbon Dioksida (CO₂)' : 'Carbon Dioxide (CO₂) Emissions'}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-200/60 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200">
                GWP = 1.0 (Konstan)
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-blue-800 dark:text-blue-200">
                {fmt(physicalGases.nonGwpVaryingGrossTco2e, 0)}
              </span>
              <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                tCO₂e / {language === 'id' ? 'tahun' : 'year'}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-blue-700/80 dark:text-blue-400/80">
              {language === 'id'
                ? 'Lahan gambut, bahan bakar solar, listrik, LUC, dan manufaktur pupuk'
                : 'Peat oxidation, diesel fuels, electricity grid, LUC, and fert manufacturing'}
            </div>
          </div>
        </div>

        {/* CUSTOM GWP SLIDERS PANEL (IF ACTIVE) */}
        {isCustomMode && (
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  {language === 'id' ? 'Penyesuaian Manual Faktor GWP' : 'Manual GWP Factor Fine-Tuning'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCustomCh4(28);
                  setCustomN2o(265);
                }}
                className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                {language === 'id' ? 'Reset ke AR5' : 'Reset to AR5'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* CH4 Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {language === 'id' ? 'Faktor GWP Metana (CH₄)' : 'Methane (CH₄) GWP Factor'}
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {customCh4}× CO₂e
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="90"
                  step="0.5"
                  value={customCh4}
                  onChange={(e) => setCustomCh4(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>AR4: 25</span>
                  <span>AR6: 27.2</span>
                  <span>AR5: 28</span>
                  <span>AR5-cc: 34</span>
                  <span>20-Yr: 82.5</span>
                </div>
              </div>

              {/* N2O Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {language === 'id' ? 'Faktor GWP Dinitrogen Oksida (N₂O)' : 'Nitrous Oxide (N₂O) GWP Factor'}
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {customN2o}× CO₂e
                  </span>
                </div>
                <input
                  type="range"
                  min="240"
                  max="320"
                  step="1"
                  value={customN2o}
                  onChange={(e) => setCustomN2o(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>AR5: 265</span>
                  <span>AR6: 273</span>
                  <span>AR4: 298</span>
                  <span>SAR: 310</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5-STANDARD GWP SELECTOR CARDS */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2.5">
            {language === 'id' ? 'Pilih Standar GWP untuk Evaluasi:' : 'Select GWP Standard for Evaluation:'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {presetCalculations.map((preset) => {
              const isSelected = !isCustomMode && selectedStandardId === preset.id;
              const isBaseline = preset.isBaseline;

              return (
                <div
                  key={preset.id}
                  onClick={() => {
                    setIsCustomMode(false);
                    setSelectedStandardId(preset.id);
                  }}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between text-left relative ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 hover:border-blue-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-neutral-200 dark:border-neutral-700">
                      <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                        {preset.shortLabel}
                      </span>
                      {isSelected ? (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          {language === 'id' ? 'Aktif' : 'Active'}
                        </span>
                      ) : isBaseline ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          Base
                        </span>
                      ) : null}
                    </div>

                    {/* Factors badge */}
                    <div className="flex items-center gap-1.5 my-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-100/70 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300/60">
                        CH₄: {preset.ch4Gwp}×
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border border-emerald-300/60">
                        N₂O: {preset.n2oGwp}×
                      </span>
                    </div>

                    {/* Net CPO Footprint Under this Metric */}
                    <div className="mt-1">
                      <div className="text-[10px] text-neutral-500 font-medium">
                        {language === 'id' ? 'Intensitas CPO' : 'CPO Intensity'}
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
                          {fmt(preset.netGhgPerTonCpo, 2)}
                        </span>
                        <span className="text-[10px] text-neutral-500">tCO₂e/t</span>
                      </div>
                    </div>

                    {/* Delta Tag vs Baseline */}
                    <div className="mt-1.5">
                      {preset.isBaseline ? (
                        <span className="text-[10px] text-neutral-400 font-semibold">
                          {language === 'id' ? 'Tolok Ukur Acuan (±0.0%)' : 'Reference Baseline (±0.0%)'}
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded inline-block ${
                            preset.deltaNetPercent <= 0
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {preset.deltaNetPercent <= 0 ? '' : '+'}
                          {fmt(preset.deltaNetPercent, 1)}% vs Base
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 text-[10px] text-neutral-500">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      {preset.statusTag}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTIVE SELECTION IMPACT CALLOUT */}
        <div className="p-4 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/50 dark:from-blue-950/40 dark:via-neutral-900 dark:to-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-600" />
                {language === 'id' ? 'Hasil Evaluasi Metrik Terpilih:' : 'Selected Metric Evaluation:'}
              </span>
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60">
                {activeCalc.name}
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 max-w-3xl">
              {language === 'id' ? activeCalc.descriptionId : activeCalc.descriptionEn}
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-4 shrink-0 bg-white dark:bg-neutral-800 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div>
              <div className="text-[10px] text-neutral-500 font-medium">
                {language === 'id' ? 'Total Emisi Bersih' : 'Total Net GHG'}
              </div>
              <div className="text-base font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {fmt(activeCalc.totalNetEmissions, 0)} <span className="text-xs font-normal">tCO₂e</span>
              </div>
            </div>

            <div className="border-l border-neutral-200 dark:border-neutral-700 pl-3">
              <div className="text-[10px] text-neutral-500 font-medium">
                {language === 'id' ? 'Pergeseran vs Baseline' : 'Shift vs Baseline'}
              </div>
              <div
                className={`text-base font-bold font-mono ${
                  activeCalc.deltaNetEmissions <= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {activeCalc.deltaNetEmissions <= 0 ? '' : '+'}
                {fmt(activeCalc.deltaNetEmissions, 0)} <span className="text-xs font-normal">({fmt(activeCalc.deltaNetPercent, 1)}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMPARATIVE VISUALIZATIONS SECTION (RECHARTS) */}
      <div className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              {language === 'id'
                ? 'Visualisasi Komparasi Standar GWP'
                : 'Comparative GWP Standards Visualization'}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {language === 'id'
                ? 'Analisis perbedaan sensitivitas total emisi bersih dan kontribusi metana POME pada berbagai horizon waktu dan edisi IPCC.'
                : 'Evaluate sensitivity across different time horizons and IPCC assessment editions.'}
            </p>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setChartMetric('net_total')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                chartMetric === 'net_total'
                  ? 'bg-white dark:bg-neutral-700 text-blue-700 dark:text-blue-300 shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              {language === 'id' ? 'Total Emisi Bersih (tCO₂e)' : 'Total Net Inventory'}
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('cpo_intensity')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                chartMetric === 'cpo_intensity'
                  ? 'bg-white dark:bg-neutral-700 text-blue-700 dark:text-blue-300 shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              {language === 'id' ? 'Intensitas CPO (tCO₂e/t)' : 'CPO Intensity'}
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('gas_breakdown')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                chartMetric === 'gas_breakdown'
                  ? 'bg-white dark:bg-neutral-700 text-blue-700 dark:text-blue-300 shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              {language === 'id' ? 'Rincian Gas (CH₄ vs N₂O vs CO₂)' : 'Gas Composition'}
            </button>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-[340px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartMetric === 'gas_breakdown' ? (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#e5e7eb'} vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke={isDark ? '#888' : '#6b7280'}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke={isDark ? '#888' : '#6b7280'}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `${typeof val === 'number' ? fmt(val, 0) : val} tCO₂e`,
                    name === 'pomeMethane'
                      ? 'Metana POME (CH₄)'
                      : name === 'fertN2o'
                      ? 'Pupuk N₂O'
                      : 'CO₂ & Sumber Tetap',
                  ]}
                  contentStyle={{
                    backgroundColor: isDark ? '#171717' : '#ffffff',
                    borderColor: isDark ? '#333' : '#e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={36}
                  formatter={(value) => {
                    if (value === 'pomeMethane') return 'POME Methane (CH₄)';
                    if (value === 'fertN2o') return 'Fertiliser (N₂O)';
                    return 'CO₂ & Removals Baseline';
                  }}
                />
                <Bar dataKey="pomeMethane" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="fertN2o" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="co2AndOther" stackId="a" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : chartMetric === 'cpo_intensity' ? (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#e5e7eb'} vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke={isDark ? '#888' : '#6b7280'}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke={isDark ? '#888' : '#6b7280'}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${val.toFixed(1)}`}
                />
                <Tooltip
                  formatter={(val: any) => [
                    `${typeof val === 'number' ? fmt(val, 2) : val} tCO₂e / t CPO`,
                    'Intensitas Karbon CPO',
                  ]}
                  contentStyle={{
                    backgroundColor: isDark ? '#171717' : '#ffffff',
                    borderColor: isDark ? '#333' : '#e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine
                  y={physicalGases.baseNetPerTonCpo}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{
                    value: `Baseline AR5 (${fmt(physicalGases.baseNetPerTonCpo, 2)})`,
                    position: 'top',
                    fill: isDark ? '#34d399' : '#059669',
                    fontSize: 10,
                  }}
                />
                <Bar dataKey="cpoIntensity" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell
                      key={`cell-${entry.id}`}
                      fill={
                        entry.isSelected
                          ? '#2563eb'
                          : entry.isBaseline
                          ? '#10b981'
                          : entry.id === 'AR6_20'
                          ? '#f43f5e'
                          : '#64748b'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#e5e7eb'} vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke={isDark ? '#888' : '#6b7280'}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke={isDark ? '#888' : '#6b7280'}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [
                    `${typeof val === 'number' ? fmt(val, 0) : val} tCO₂e`,
                    'Total Emisi Bersih Tahunan',
                  ]}
                  contentStyle={{
                    backgroundColor: isDark ? '#171717' : '#ffffff',
                    borderColor: isDark ? '#333' : '#e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine
                  y={physicalGases.baseNetEmissions}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{
                    value: `Baseline AR5 (${fmt(physicalGases.baseNetEmissions, 0)})`,
                    position: 'top',
                    fill: isDark ? '#34d399' : '#059669',
                    fontSize: 10,
                  }}
                />
                <Bar dataKey="netEmissions" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell
                      key={`cell-${entry.id}`}
                      fill={
                        entry.isSelected
                          ? '#2563eb'
                          : entry.isBaseline
                          ? '#10b981'
                          : entry.id === 'AR6_20'
                          ? '#e11d48'
                          : '#94a3b8'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
              {language === 'id' ? 'Standar Aktif Terpilih' : 'Active Selected Standard'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              {language === 'id' ? 'Baseline Resmi AR5' : 'Official AR5 Baseline'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              {language === 'id' ? 'Horizon 20 Tahun (Urgen)' : '20-Year Horizon'}
            </span>
          </div>
          <span className="italic text-[11px]">
            {language === 'id'
              ? '*Garis putus-putus hijau menandai nilai baseline resmi PalmGHG V5 (AR5)'
              : '*Dashed green line denotes official PalmGHG V5 baseline (AR5)'}
          </span>
        </div>
      </div>

      {/* DETAILED COMPARISON DATA TABLE */}
      <div className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {language === 'id'
                ? 'Tabel Matriks Komparasi Standar GWP Lengkap'
                : 'Comprehensive GWP Multi-Standard Matrix'}
            </h3>
            <p className="text-xs text-neutral-500">
              {language === 'id'
                ? 'Rincian angka kuantitatif, faktor konversi, dan mandat kepatuhan untuk setiap standar'
                : 'Quantitative values, equivalence factors, and audit compliance application'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800">
                <th className="p-3 font-bold text-neutral-800 dark:text-neutral-200">
                  {language === 'id' ? 'Standar Laporan IPCC' : 'IPCC Assessment Standard'}
                </th>
                <th className="p-3 font-bold text-neutral-800 dark:text-neutral-200">
                  Horizon
                </th>
                <th className="p-3 font-bold text-neutral-800 dark:text-neutral-200">
                  GWP CH₄
                </th>
                <th className="p-3 font-bold text-neutral-800 dark:text-neutral-200">
                  GWP N₂O
                </th>
                <th className="p-3 font-bold text-neutral-800 dark:text-neutral-200">
                  {language === 'id' ? 'Metana POME (tCO₂e)' : 'POME CH₄ (tCO₂e)'}
                </th>
                <th className="p-3 font-bold text-neutral-800 dark:text-neutral-200">
                  {language === 'id' ? 'Pupuk N₂O (tCO₂e)' : 'Fertiliser N₂O (tCO₂e)'}
                </th>
                <th className="p-3 font-bold text-neutral-800 dark:text-neutral-200">
                  {language === 'id' ? 'Total Emisi Bersih' : 'Net GHG Total'}
                </th>
                <th className="p-3 font-bold text-neutral-800 dark:text-neutral-200">
                  {language === 'id' ? 'Intensitas CPO' : 'CPO Intensity'}
                </th>
                <th className="p-3 font-bold text-neutral-800 dark:text-neutral-200">
                  {language === 'id' ? 'Pergeseran Δ' : 'Shift Δ'}
                </th>
                <th className="p-3 font-bold text-neutral-800 dark:text-neutral-200">
                  {language === 'id' ? 'Aplikasi Regulasi' : 'Compliance Usage'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {presetCalculations.map((item) => {
                const isSelected = !isCustomMode && selectedStandardId === item.id;
                return (
                  <tr
                    key={item.id}
                    onClick={() => {
                      setIsCustomMode(false);
                      setSelectedStandardId(item.id);
                    }}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 font-semibold text-neutral-900 dark:text-neutral-100'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                        <span className="font-bold">{item.name}</span>
                      </div>
                      <div className="text-[10px] text-neutral-400">{item.ipccReport}</div>
                    </td>
                    <td className="p-3 font-mono">{item.horizonYears} yr</td>
                    <td className="p-3 font-mono font-bold text-amber-700 dark:text-amber-400">
                      {item.ch4Gwp}×
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {item.n2oGwp}×
                    </td>
                    <td className="p-3 font-mono">{fmt(item.pomeCh4Tco2e, 0)}</td>
                    <td className="p-3 font-mono">{fmt(item.fertiliserN2oTco2e, 0)}</td>
                    <td className="p-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      {fmt(item.totalNetEmissions, 0)} t
                    </td>
                    <td className="p-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {fmt(item.netGhgPerTonCpo, 2)} t/t
                    </td>
                    <td className="p-3">
                      {item.isBaseline ? (
                        <span className="text-[10px] text-neutral-400 font-semibold">Baseline</span>
                      ) : (
                        <span
                          className={`font-mono text-xs font-bold ${
                            item.deltaNetPercent <= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {item.deltaNetPercent <= 0 ? '' : '+'}
                          {fmt(item.deltaNetPercent, 1)}%
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-[11px] text-neutral-500 max-w-[200px]">
                      {item.complianceUsage}
                    </td>
                  </tr>
                );
              })}

              {/* Custom row if in custom mode */}
              {isCustomMode && (
                <tr className="bg-indigo-50/70 dark:bg-indigo-950/40 font-semibold text-neutral-900 dark:text-neutral-100">
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                      <span className="font-bold text-indigo-700 dark:text-indigo-300">Custom Parameter</span>
                    </div>
                    <div className="text-[10px] text-neutral-400">Interactive User Input</div>
                  </td>
                  <td className="p-3 font-mono">User</td>
                  <td className="p-3 font-mono font-bold text-amber-700 dark:text-amber-400">
                    {activeCalc.ch4Gwp}×
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {activeCalc.n2oGwp}×
                  </td>
                  <td className="p-3 font-mono">{fmt(activeCalc.pomeCh4Tco2e, 0)}</td>
                  <td className="p-3 font-mono">{fmt(activeCalc.fertiliserN2oTco2e, 0)}</td>
                  <td className="p-3 font-mono font-bold text-indigo-700 dark:text-indigo-300">
                    {fmt(activeCalc.totalNetEmissions, 0)} t
                  </td>
                  <td className="p-3 font-mono font-bold text-indigo-700 dark:text-indigo-300">
                    {fmt(activeCalc.netGhgPerTonCpo, 2)} t/t
                  </td>
                  <td className="p-3">
                    <span
                      className={`font-mono text-xs font-bold ${
                        activeCalc.deltaNetPercent <= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {activeCalc.deltaNetPercent <= 0 ? '' : '+'}
                      {fmt(activeCalc.deltaNetPercent, 1)}%
                    </span>
                  </td>
                  <td className="p-3 text-[11px] text-neutral-500">
                    Research / Sensitivity
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGULATORY CONTEXT & AUDIT TRACEABILITY GUIDANCE */}
      <div className="p-4 sm:p-5 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 space-y-3">
        <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-bold text-sm">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <span>
            {language === 'id'
              ? 'Panduan Regulasi & Kepatuhan Audit (RSPO vs Paris Agreement vs SBTi)'
              : 'Regulatory Context & Audit Compliance Guidance'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-neutral-600 dark:text-neutral-300">
          <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div className="font-bold text-neutral-800 dark:text-neutral-200 pb-1 border-b border-neutral-100 dark:border-neutral-800 mb-1.5 flex items-center justify-between">
              <span>RSPO PalmGHG V5 Default</span>
              <span className="text-[10px] text-emerald-600 font-mono">AR5 (100-yr)</span>
            </div>
            <p>
              {language === 'id'
                ? 'RSPO PalmGHG V5 secara normatif mengadopsi nilai IPCC AR5 (CH₄ = 28, N₂O = 265). Nilai ini wajib digunakan untuk pengesahan audit sertifikasi RSPO tahunan dan pelaporan resmi di RSPO PalmTrace.'
                : 'RSPO PalmGHG V5 officially standardizes on IPCC AR5 (CH₄ = 28, N₂O = 265). This is the mandatory baseline required for RSPO certification audits and official PalmTrace submissions.'}
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div className="font-bold text-neutral-800 dark:text-neutral-200 pb-1 border-b border-neutral-100 dark:border-neutral-800 mb-1.5 flex items-center justify-between">
              <span>UNFCCC & Paris Agreement</span>
              <span className="text-[10px] text-blue-600 font-mono">AR6 (100-yr)</span>
            </div>
            <p>
              {language === 'id'
                ? 'Mulai tahun 2024, Keputusan UNFCCC 5/CMA.3 mewajibkan seluruh negara anggota melaporkan Inventarisasi GRK Nasional dan NDC menggunakan nilai IPCC AR6 (CH₄ = 27.2, N₂O = 273). Ideal untuk harmonisasi ESG korporat dengan target nasional.'
                : 'Beginning in 2024, UNFCCC Decision 5/CMA.3 mandates all member states report National GHG Inventories and BTRs using IPCC AR6 values (CH₄ = 27.2, N₂O = 273). Critical for aligning corporate ESG with national NDCs.'}
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div className="font-bold text-neutral-800 dark:text-neutral-200 pb-1 border-b border-neutral-100 dark:border-neutral-800 mb-1.5 flex items-center justify-between">
              <span>Global Methane Pledge</span>
              <span className="text-[10px] text-rose-600 font-mono">AR6 (20-yr)</span>
            </div>
            <p>
              {language === 'id'
                ? 'Karena metana memiliki masa tinggal atmosfer pendek (~12 tahun), pemanasan jangka pendeknya 82.5× lebih intens daripada CO₂. GWP-20 menggarisbawahi urgensi mitigasi kolam terbuka POME dan kebocoran biogas flare.'
                : 'Because methane has an atmospheric lifetime of ~12 years, its near-term warming impact is 82.5× higher than CO₂. GWP-20 highlights the urgent climate imperative to eliminate open POME lagoons and fugitive flaring.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
