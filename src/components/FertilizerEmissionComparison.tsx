import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  AreaChart,
  Area,
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
  PalmGHGAssessmentResults,
} from '../types/palmghg';
import { CONSTANTS } from '../utils/palmghgCalculations';
import {
  FlaskConical,
  Sprout,
  TrendingDown,
  Sparkles,
  Layers,
  Scale,
  CheckCircle2,
  Info,
  Download,
  RotateCcw,
  Sliders,
  Leaf,
  ShieldCheck,
  Zap,
  ArrowRight,
  Target,
} from 'lucide-react';

interface Props {
  estate: EstateParameters;
  mill: MillParameters;
  results: PalmGHGAssessmentResults;
  onUpdateEstate?: (newEstate: EstateParameters) => void;
  isDark?: boolean;
}

export interface FertilizerTypeIntensity {
  id: string;
  name: string;
  shortName: string;
  category: 'synthetic_standard' | 'synthetic_ni_ui' | 'organic_recycled' | 'minerals';
  color: string;
  appliedQuantityDisplay: string;
  nEquivalentKg: number;
  scope1DirectN2O_Tco2e: number;
  scope1IndirectN2O_Tco2e: number;
  scope3Mfg_Tco2e: number;
  scope3Freight_Tco2e: number;
  totalGhgTco2e: number;
  intensityPerKgN: number; // kg CO2e / kg N
  intensityPerHa: number; // tCO2e / ha
  intensityPerTonCpo: number; // kg CO2e / t CPO
}

export interface OptimizationScenario {
  id: string;
  name: string;
  description: string;
  badge: string;
  badgeColor: string;
  stdN_Kg: number;
  inhN_Kg: number;
  pomeM3: number;
  compostTon: number;
  efbTon: number;
  totalScope1N2O_Tco2e: number;
  totalScope3Mfg_Tco2e: number;
  totalFreight_Tco2e: number;
  totalFertilizerGhgTco2e: number;
  ghgPerTonCpoKg: number;
  deltaBaselineTco2e: number;
  deltaPercent: number;
}

export const FertilizerEmissionComparison: React.FC<Props> = ({
  estate,
  mill,
  results,
  onUpdateEstate,
  isDark = false,
}) => {
  const [activeTab, setActiveTab] = useState<'intensity_breakdown' | 'scenarios' | 'sensitivity_slider'>('intensity_breakdown');
  const [interactiveInhibitorAdoption, setInteractiveInhibitorAdoption] = useState<number>(50); // 0 - 100%
  const [interactiveOrganicSubstitution, setInteractiveOrganicSubstitution] = useState<number>(15); // 0 - 40%
  const [applyNotification, setApplyNotification] = useState<string | null>(null);

  // Formatting helper
  const fmt = (val: number, decimals: number = 1) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const cpoTon = results.totalCpoProducedTon || 38300;
  const plantedAreaHa = Math.max(1, estate.totalPlantedAreaHa || 9300);
  const freightKm = estate.fertiliserTransportDistanceKm || 250;

  // 1. Calculate Intensity across Individual Fertilizer Types
  const fertilizerComparisonData = useMemo<FertilizerTypeIntensity[]>(() => {
    // A. Standard Synthetic Nitrogen
    const stdN = Math.max(0, estate.syntheticNStandardKg);
    const stdDirectT = (stdN * CONSTANTS.N2O_DIRECT_STANDARD_N * CONSTANTS.N2O_TO_N_RATIO * CONSTANTS.GWP_N2O) / 1000;
    const stdIndirectT = (stdN * (CONSTANTS.N2O_INDIRECT_VOLATILISATION + CONSTANTS.N2O_INDIRECT_LEACHING) * CONSTANTS.N2O_TO_N_RATIO * CONSTANTS.GWP_N2O) / 1000;
    const stdMfgT = (stdN * CONSTANTS.FERT_MFG_N) / 1000;
    const stdFreightT = (stdN / 1000) * freightKm * CONSTANTS.FERT_TRANSPORT_FACTOR;
    const stdTotalT = stdDirectT + stdIndirectT + stdMfgT + stdFreightT;

    // B. NI/UI Treated Synthetic Nitrogen (35% reduction in direct N2O)
    const inhN = Math.max(0, estate.syntheticNInhibitedKg);
    const inhDirectT = (inhN * CONSTANTS.N2O_DIRECT_INHIBITED_N * CONSTANTS.N2O_TO_N_RATIO * CONSTANTS.GWP_N2O) / 1000;
    const inhIndirectT = (inhN * (CONSTANTS.N2O_INDIRECT_VOLATILISATION + CONSTANTS.N2O_INDIRECT_LEACHING) * CONSTANTS.N2O_TO_N_RATIO * CONSTANTS.GWP_N2O) / 1000;
    const inhMfgT = (inhN * CONSTANTS.FERT_MFG_N) / 1000; // Same base mfg footprint
    const inhFreightT = (inhN / 1000) * freightKm * CONSTANTS.FERT_TRANSPORT_FACTOR;
    const inhTotalT = inhDirectT + inhIndirectT + inhMfgT + inhFreightT;

    // C. Organic Recycled Biomass (POME + Compost + EFB)
    const pomeM3 = estate.pomeLandApplicationM3 || 0;
    const compostTon = estate.compostLandApplicationTon || 0;
    const efbTon = estate.efbMulchingTon || 0;
    const pomeN_Kg = pomeM3 * 0.0035 * 1000; // 3.5 kg N / m3
    const compostN_Kg = compostTon * 12; // 12 kg N / ton compost
    const totalRecycledN_Kg = pomeN_Kg + compostN_Kg;
    const recycledDirectT = (totalRecycledN_Kg * CONSTANTS.N2O_DIRECT_STANDARD_N * CONSTANTS.N2O_TO_N_RATIO * CONSTANTS.GWP_N2O) / 1000;
    const recycledMfgT = 0; // Zero upstream industrial synthesis
    const recycledFreightT = 0; // Zero external freight (on-site circular)
    const recycledTotalT = recycledDirectT;

    // D. Phosphorus (P2O5 + Rock Phosphate)
    const p2o5Kg = estate.syntheticP2O5Kg || 0;
    const rockPhosKg = estate.rockPhosphateKg || 0;
    const pMfgT = (p2o5Kg * CONSTANTS.FERT_MFG_P2O5 + rockPhosKg * CONSTANTS.FERT_MFG_ROCK_PHOSPHATE) / 1000;
    const pFreightT = ((p2o5Kg + rockPhosKg) / 1000) * freightKm * CONSTANTS.FERT_TRANSPORT_FACTOR;
    const pTotalT = pMfgT + pFreightT;

    // E. Potassium (K2O)
    const k2oKg = estate.syntheticK2OKg || 0;
    const kMfgT = (k2oKg * CONSTANTS.FERT_MFG_K2O) / 1000;
    const kFreightT = (k2oKg / 1000) * freightKm * CONSTANTS.FERT_TRANSPORT_FACTOR;
    const kTotalT = kMfgT + kFreightT;

    return [
      {
        id: 'std_n',
        name: 'Standard Synthetic Nitrogen',
        shortName: 'Standard N (Urea/CAN)',
        category: 'synthetic_standard',
        color: '#f59e0b',
        appliedQuantityDisplay: `${fmt(stdN, 0)} kg N`,
        nEquivalentKg: stdN,
        scope1DirectN2O_Tco2e: stdDirectT,
        scope1IndirectN2O_Tco2e: stdIndirectT,
        scope3Mfg_Tco2e: stdMfgT,
        scope3Freight_Tco2e: stdFreightT,
        totalGhgTco2e: stdTotalT,
        intensityPerKgN: stdN > 0 ? (stdTotalT * 1000) / stdN : 8.89,
        intensityPerHa: stdTotalT / plantedAreaHa,
        intensityPerTonCpo: (stdTotalT * 1000) / cpoTon,
      },
      {
        id: 'inh_n',
        name: 'NI/UI Treated Nitrogen',
        shortName: 'NI/UI Treated N',
        category: 'synthetic_ni_ui',
        color: '#10b981',
        appliedQuantityDisplay: `${fmt(inhN, 0)} kg N`,
        nEquivalentKg: inhN,
        scope1DirectN2O_Tco2e: inhDirectT,
        scope1IndirectN2O_Tco2e: inhIndirectT,
        scope3Mfg_Tco2e: inhMfgT,
        scope3Freight_Tco2e: inhFreightT,
        totalGhgTco2e: inhTotalT,
        intensityPerKgN: inhN > 0 ? (inhTotalT * 1000) / inhN : 7.42,
        intensityPerHa: inhTotalT / plantedAreaHa,
        intensityPerTonCpo: (inhTotalT * 1000) / cpoTon,
      },
      {
        id: 'organic',
        name: 'Circular Recycled Organics',
        shortName: 'Organics (POME/Compost)',
        category: 'organic_recycled',
        color: '#06b6d4',
        appliedQuantityDisplay: `${fmt(totalRecycledN_Kg, 0)} kg N eq`,
        nEquivalentKg: totalRecycledN_Kg,
        scope1DirectN2O_Tco2e: recycledDirectT,
        scope1IndirectN2O_Tco2e: 0,
        scope3Mfg_Tco2e: recycledMfgT,
        scope3Freight_Tco2e: recycledFreightT,
        totalGhgTco2e: recycledTotalT,
        intensityPerKgN: totalRecycledN_Kg > 0 ? (recycledTotalT * 1000) / totalRecycledN_Kg : 5.04,
        intensityPerHa: recycledTotalT / plantedAreaHa,
        intensityPerTonCpo: (recycledTotalT * 1000) / cpoTon,
      },
      {
        id: 'phosphorus',
        name: 'Phosphorus (P₂O₅ & Rock Phos)',
        shortName: 'P₂O₅ & Rock Phos',
        category: 'minerals',
        color: '#8b5cf6',
        appliedQuantityDisplay: `${fmt(p2o5Kg + rockPhosKg, 0)} kg`,
        nEquivalentKg: 0,
        scope1DirectN2O_Tco2e: 0,
        scope1IndirectN2O_Tco2e: 0,
        scope3Mfg_Tco2e: pMfgT,
        scope3Freight_Tco2e: pFreightT,
        totalGhgTco2e: pTotalT,
        intensityPerKgN: 0,
        intensityPerHa: pTotalT / plantedAreaHa,
        intensityPerTonCpo: (pTotalT * 1000) / cpoTon,
      },
      {
        id: 'potassium',
        name: 'Potassium (K₂O / MOP)',
        shortName: 'K₂O MOP',
        category: 'minerals',
        color: '#ec4899',
        appliedQuantityDisplay: `${fmt(k2oKg, 0)} kg K₂O`,
        nEquivalentKg: 0,
        scope1DirectN2O_Tco2e: 0,
        scope1IndirectN2O_Tco2e: 0,
        scope3Mfg_Tco2e: kMfgT,
        scope3Freight_Tco2e: kFreightT,
        totalGhgTco2e: kTotalT,
        intensityPerKgN: 0,
        intensityPerHa: kTotalT / plantedAreaHa,
        intensityPerTonCpo: (kTotalT * 1000) / cpoTon,
      },
    ];
  }, [estate, plantedAreaHa, freightKm, cpoTon]);

  // Aggregate current estate fertilizer total
  const currentTotalFertilizerGhg = useMemo(() => {
    return fertilizerComparisonData.reduce((acc, curr) => acc + curr.totalGhgTco2e, 0);
  }, [fertilizerComparisonData]);

  const totalNAppliedKg = estate.syntheticNStandardKg + estate.syntheticNInhibitedKg;
  const currentNIntensityPerHa = totalNAppliedKg / plantedAreaHa;
  const currentInhibitorAdoptionPct = totalNAppliedKg > 0 ? (estate.syntheticNInhibitedKg / totalNAppliedKg) * 100 : 0;

  // 2. Generate Optimization Scenarios to Compare Input Choices
  const optimizationScenarios = useMemo<OptimizationScenario[]>(() => {
    const totalN = totalNAppliedKg || 1200000;
    const baseP2O5Mfg = (estate.syntheticP2O5Kg * CONSTANTS.FERT_MFG_P2O5 + estate.rockPhosphateKg * CONSTANTS.FERT_MFG_ROCK_PHOSPHATE) / 1000;
    const baseK2OMfg = (estate.syntheticK2OKg * CONSTANTS.FERT_MFG_K2O) / 1000;
    const baseMineralsMfg = baseP2O5Mfg + baseK2OMfg;

    const calcScenario = (
      id: string,
      name: string,
      description: string,
      badge: string,
      badgeColor: string,
      stdN: number,
      inhN: number,
      pomeM3: number,
      compostTon: number,
      efbTon: number
    ): OptimizationScenario => {
      // Direct & Indirect N2O
      const stdDir = (stdN * CONSTANTS.N2O_DIRECT_STANDARD_N * CONSTANTS.N2O_TO_N_RATIO * CONSTANTS.GWP_N2O) / 1000;
      const stdInd = (stdN * (CONSTANTS.N2O_INDIRECT_VOLATILISATION + CONSTANTS.N2O_INDIRECT_LEACHING) * CONSTANTS.N2O_TO_N_RATIO * CONSTANTS.GWP_N2O) / 1000;
      const inhDir = (inhN * CONSTANTS.N2O_DIRECT_INHIBITED_N * CONSTANTS.N2O_TO_N_RATIO * CONSTANTS.GWP_N2O) / 1000;
      const inhInd = (inhN * (CONSTANTS.N2O_INDIRECT_VOLATILISATION + CONSTANTS.N2O_INDIRECT_LEACHING) * CONSTANTS.N2O_TO_N_RATIO * CONSTANTS.GWP_N2O) / 1000;

      const recN_Kg = (pomeM3 * 0.0035 * 1000) + (compostTon * 12);
      const recDir = (recN_Kg * CONSTANTS.N2O_DIRECT_STANDARD_N * CONSTANTS.N2O_TO_N_RATIO * CONSTANTS.GWP_N2O) / 1000;

      const totalScope1 = stdDir + stdInd + inhDir + inhInd + recDir;
      const totalMfg = ((stdN + inhN) * CONSTANTS.FERT_MFG_N) / 1000 + baseMineralsMfg;
      const totalFertTon = (stdN + inhN + estate.syntheticP2O5Kg + estate.syntheticK2OKg + estate.rockPhosphateKg) / 1000;
      const totalFreight = totalFertTon * freightKm * CONSTANTS.FERT_TRANSPORT_FACTOR;

      const totalGhg = totalScope1 + totalMfg + totalFreight;
      const deltaBaseline = totalGhg - currentTotalFertilizerGhg;
      const deltaPercent = currentTotalFertilizerGhg > 0 ? (deltaBaseline / currentTotalFertilizerGhg) * 100 : 0;

      return {
        id,
        name,
        description,
        badge,
        badgeColor,
        stdN_Kg: stdN,
        inhN_Kg: inhN,
        pomeM3,
        compostTon,
        efbTon,
        totalScope1N2O_Tco2e: totalScope1,
        totalScope3Mfg_Tco2e: totalMfg,
        totalFreight_Tco2e: totalFreight,
        totalFertilizerGhgTco2e: totalGhg,
        ghgPerTonCpoKg: (totalGhg * 1000) / cpoTon,
        deltaBaselineTco2e: deltaBaseline,
        deltaPercent,
      };
    };

    return [
      calcScenario(
        'current',
        'Current Estate Practice',
        'Parameter aktual kebun saat ini.',
        'Current Baseline',
        'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border-neutral-300',
        estate.syntheticNStandardKg,
        estate.syntheticNInhibitedKg,
        estate.pomeLandApplicationM3,
        estate.compostLandApplicationTon,
        estate.efbMulchingTon
      ),
      calcScenario(
        'conventional',
        '100% Conventional Synthetic',
        'Semua nitrogen sintetis berupa pupuk konvensional tanpa inhibitor (Urea biasa).',
        'High Emission Baseline',
        'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300',
        totalN,
        0,
        0,
        0,
        0
      ),
      calcScenario(
        'sub_50_ni',
        '50% NI/UI Inhibitor Substitution',
        'Mengganti 50% N sintetis dengan pupuk ber-inhibitor urease/nitrifikasi.',
        'Moderate Reduction',
        'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
        Math.round(totalN * 0.5),
        Math.round(totalN * 0.5),
        estate.pomeLandApplicationM3,
        estate.compostLandApplicationTon,
        estate.efbMulchingTon
      ),
      calcScenario(
        'full_100_ni',
        '100% NI/UI Full Adoption',
        'Seluruh nitrogen sintetis menggunakan teknologi inhibitor (35% reduksi N₂O langsung).',
        'Recommended Best Practice',
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
        0,
        totalN,
        estate.pomeLandApplicationM3,
        estate.compostLandApplicationTon,
        estate.efbMulchingTon
      ),
      calcScenario(
        'circular_synergy',
        'Circular Organics + 100% NI/UI',
        'Maksimalisasi kompos & aplikasi POME untuk menyubstitusi 25% N kimia, sisa N sintetis 100% NI/UI.',
        'Net-Zero Leader',
        'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300',
        0,
        Math.round(totalN * 0.75),
        Math.max(estate.pomeLandApplicationM3, 40000),
        Math.max(estate.compostLandApplicationTon, 8000),
        Math.max(estate.efbMulchingTon, 12000)
      ),
    ];
  }, [estate, totalNAppliedKg, freightKm, currentTotalFertilizerGhg, cpoTon]);

  // 3. Generate Sensitivity Curve Points across Adoption Rates
  const sensitivityCurveData = useMemo(() => {
    const points = [];
    const totalN = totalNAppliedKg || 1200000;
    const baseMinerals = fertilizerComparisonData
      .filter((d) => d.category === 'minerals')
      .reduce((acc, curr) => acc + curr.totalGhgTco2e, 0);

    for (let pct = 0; pct <= 100; pct += 10) {
      const inhN = (totalN * pct) / 100;
      const stdN = totalN - inhN;

      const stdDir = (stdN * CONSTANTS.N2O_DIRECT_STANDARD_N * CONSTANTS.N2O_TO_N_RATIO * CONSTANTS.GWP_N2O) / 1000;
      const stdInd = (stdN * (CONSTANTS.N2O_INDIRECT_VOLATILISATION + CONSTANTS.N2O_INDIRECT_LEACHING) * CONSTANTS.N2O_TO_N_RATIO * CONSTANTS.GWP_N2O) / 1000;
      const inhDir = (inhN * CONSTANTS.N2O_DIRECT_INHIBITED_N * CONSTANTS.N2O_TO_N_RATIO * CONSTANTS.GWP_N2O) / 1000;
      const inhInd = (inhN * (CONSTANTS.N2O_INDIRECT_VOLATILISATION + CONSTANTS.N2O_INDIRECT_LEACHING) * CONSTANTS.N2O_TO_N_RATIO * CONSTANTS.GWP_N2O) / 1000;

      const nScope1 = stdDir + stdInd + inhDir + inhInd;
      const nMfg = (totalN * CONSTANTS.FERT_MFG_N) / 1000;
      const nFreight = (totalN / 1000) * freightKm * CONSTANTS.FERT_TRANSPORT_FACTOR;

      const totalEmissions = nScope1 + nMfg + nFreight + baseMinerals;
      const intensityCpo = (totalEmissions * 1000) / cpoTon;

      points.push({
        adoptionRate: `${pct}%`,
        adoptionNumber: pct,
        totalGhgTco2e: Math.round(totalEmissions),
        scope1N2O: Math.round(nScope1),
        scope3Mfg: Math.round(nMfg + baseMinerals),
        intensityKgPerTonCpo: Number(intensityCpo.toFixed(1)),
      });
    }
    return points;
  }, [totalNAppliedKg, fertilizerComparisonData, freightKm, cpoTon]);

  // Handle Apply Scenario directly to Estate
  const handleApplyScenario = (scenario: OptimizationScenario) => {
    if (!onUpdateEstate) return;
    onUpdateEstate({
      ...estate,
      syntheticNStandardKg: scenario.stdN_Kg,
      syntheticNInhibitedKg: scenario.inhN_Kg,
      pomeLandApplicationM3: scenario.pomeM3,
      compostLandApplicationTon: scenario.compostTon,
      efbMulchingTon: scenario.efbTon,
    });
    setApplyNotification(
      `Sukses menerapkan skenario "${scenario.name}". Parameter pupuk kebun telah disinkronkan otomatis!`
    );
    setTimeout(() => setApplyNotification(null), 8000);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Jenis Pupuk',
      'Kategori',
      'Jumlah Diaplikasikan',
      'Scope 1 N2O Langsung (tCO2e)',
      'Scope 1 N2O Tidak Langsung (tCO2e)',
      'Scope 3 Manufaktur (tCO2e)',
      'Scope 3 Transportasi (tCO2e)',
      'Total Emisi Siklus Hidup (tCO2e)',
      'Intensitas per kg N (kg CO2e/kg N)',
      'Intensitas per ha (tCO2e/ha)',
      'Intensitas per ton CPO (kg CO2e/t CPO)',
    ];

    const rows = fertilizerComparisonData.map((d) => [
      `"${d.name}"`,
      d.category,
      `"${d.appliedQuantityDisplay}"`,
      d.scope1DirectN2O_Tco2e.toFixed(1),
      d.scope1IndirectN2O_Tco2e.toFixed(1),
      d.scope3Mfg_Tco2e.toFixed(1),
      d.scope3Freight_Tco2e.toFixed(1),
      d.totalGhgTco2e.toFixed(1),
      d.intensityPerKgN.toFixed(2),
      d.intensityPerHa.toFixed(3),
      d.intensityPerTonCpo.toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fertilizer_Emission_Intensities_Comparison_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* HEADER STRIP */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-400 shrink-0 mt-0.5">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-400">
                  Fertilizer Emission Intensities & Decarbonisation Matrix
                </span>
                <span className="text-xs text-neutral-300 dark:text-neutral-700">·</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                  Synthetic vs Organic vs NI/UI
                </span>
                <span className="text-xs text-neutral-300 dark:text-neutral-700">·</span>
                <span className="text-[11px] font-mono text-neutral-500">
                  RSPO PalmGHG v5 Section 2.3.2 & GHG Protocol LSR
                </span>
              </div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                Komparasi Intensitas Emisi Pupuk & Optimasi Input Agronomi
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Bandingkan jejak karbon siklus hidup (Scope 1 N₂O tanah + Scope 3 manufaktur & transportasi) antara pupuk sintetis konvensional, pupuk terinhibisi (NI/UI), dan bahan organik daur ulang (kompos & POME).
              </p>
            </div>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700 shrink-0"
            title="Download comparative fertilizer breakdown as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>

        {/* NOTIFIKASI SYNC */}
        {applyNotification && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{applyNotification}</span>
            </div>
            <button
              onClick={() => setApplyNotification(null)}
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 font-bold px-2 py-0.5 rounded text-xs"
            >
              Tutup
            </button>
          </div>
        )}

        {/* TOP LEVEL KPI STAT CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Card 1: Total Fertilizer Footprint */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span>Total Emisi Pupuk</span>
              <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">
                {fmt(currentTotalFertilizerGhg, 0)}
              </span>
              <span className="text-xs text-neutral-500">tCO₂e/thn</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              Scope 1 N₂O + Scope 3 Manufaktur
            </div>
          </div>

          {/* Card 2: Nitrogen Application Rate */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span>Dosis Nitrogen Kebun</span>
              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {fmt(currentNIntensityPerHa, 1)}
              </span>
              <span className="text-xs text-neutral-500">kg N/ha/thn</span>
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">
              Benchmark RSPO: 80 – 180 kg N/ha
            </div>
          </div>

          {/* Card 3: NI/UI Adoption Level */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span>Adopsi Inhibitor (NI/UI)</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {fmt(currentInhibitorAdoptionPct, 1)}%
              </span>
              <span className="text-xs text-neutral-500">dari N sintetis</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              Reduksi 35% emisi N₂O langsung
            </div>
          </div>

          {/* Card 4: Emission Intensity per Ton CPO */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span>Beban Pupuk per Ton CPO</span>
              <Target className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400">
                {fmt((currentTotalFertilizerGhg * 1000) / cpoTon, 1)}
              </span>
              <span className="text-xs text-neutral-500">kg CO₂e / t</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              Kontribusi terhadap jejak karbon produk
            </div>
          </div>

          {/* Card 5: Maximum Potential Decarbonisation */}
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-300 dark:border-emerald-800">
            <div className="flex items-center justify-between text-[11px] font-medium text-emerald-900 dark:text-emerald-300">
              <span>Potensi Pengurangan Maks</span>
              <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                -{fmt(Math.abs(optimizationScenarios[4].deltaBaselineTco2e), 0)}
              </span>
              <span className="text-xs text-neutral-500">tCO₂e</span>
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">
              Turun {Math.abs(optimizationScenarios[4].deltaPercent).toFixed(1)}% dengan sinergi NI/UI & Organik
            </div>
          </div>
        </div>

        {/* NAVIGATION SUB-TABS */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('intensity_breakdown')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'intensity_breakdown'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span>1. Komparasi Intensitas Siklus Hidup (Life-Cycle Intensities)</span>
          </button>

          <button
            onClick={() => setActiveTab('scenarios')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'scenarios'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            <span>2. Skenario Optimasi Pilihan Input (Input Choice Scenarios)</span>
          </button>

          <button
            onClick={() => setActiveTab('sensitivity_slider')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'sensitivity_slider'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-purple-600" />
            <span>3. Kurva Sensitivitas & Interaktif Substitusi (Substitution Curve)</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: LIFE-CYCLE INTENSITY BREAKDOWN (RECHARTS BAR CHART) */}
      {activeTab === 'intensity_breakdown' && (
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Grafik Komparasi Emisi Berdasarkan Jenis Pupuk
              </span>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Breakdown komparatif Scope 1 (N₂O Langsung & Tidak Langsung) vs Scope 3 (Manufaktur & Transportasi) dalam tCO₂e/tahun.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-neutral-500">Standar N Intensity:</span>
              <span className="font-bold text-amber-600">8.89 kg CO₂e/kg N</span>
              <span className="text-neutral-400">vs</span>
              <span className="text-neutral-500">NI/UI Treated:</span>
              <span className="font-bold text-emerald-600">7.42 kg CO₂e/kg N (-16.5%)</span>
            </div>
          </div>

          {/* RECHARTS STACKED BAR CHART */}
          <div className="h-[380px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={fertilizerComparisonData}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333333' : '#e5e7eb'} vertical={false} />
                <XAxis dataKey="shortName" stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={11} tickLine={false} />
                <YAxis
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${fmt(val / 1000, 1)}k`}
                  label={{
                    value: 'Emisi GRK Siklus Hidup (tCO₂e / thn)',
                    angle: -90,
                    position: 'insideLeft',
                    fontSize: 11,
                    fill: isDark ? '#9ca3af' : '#6b7280',
                  }}
                />
                <Tooltip content={<CustomFertilizerTooltip isDark={isDark} fmt={fmt} />} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />

                <Bar dataKey="scope1DirectN2O_Tco2e" name="Scope 1: N₂O Tanah Langsung" stackId="ghg" fill="#f59e0b" />
                <Bar dataKey="scope1IndirectN2O_Tco2e" name="Scope 1: N₂O Tidak Langsung (Leaching & Volatilisasi)" stackId="ghg" fill="#fbbf24" />
                <Bar dataKey="scope3Mfg_Tco2e" name="Scope 3 Cat 1: Manufaktur Industri Pupuk" stackId="ghg" fill="#0284c7" />
                <Bar dataKey="scope3Freight_Tco2e" name="Scope 3 Cat 4: Transportasi Pasokan" stackId="ghg" fill="#64748b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* KEY AG-TECH INSIGHTS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800/40">
              <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-bold text-xs mb-1">
                <FlaskConical className="w-4 h-4 text-amber-600" />
                <span>Pupuk Sintetis Standar</span>
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Urea dan ammonium konvensional memiliki faktor emisi langsung <strong>1,0% N</strong>. Menghasilkan total <strong>8,89 kg CO₂e per kg N</strong> akibat proses sintesis Haber-Bosch yang intensif bahan bakar fosil.
              </p>
            </div>

            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
              <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300 font-bold text-xs mb-1">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Pupuk Inhibitor (NI/UI) [NEW V5]</span>
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Inhibitor nitrifikasi & urease menahan konversi mikroba cepat ke nitrat dan gas N₂O, menurunkan emisi tanah langsung sebesar <strong>35% (0,65% N)</strong> tanpa menurunkan hasil produksi TBS.
              </p>
            </div>

            <div className="p-3 bg-sky-50/50 dark:bg-sky-950/20 rounded-lg border border-sky-200 dark:border-sky-800/40">
              <div className="flex items-center gap-1.5 text-sky-900 dark:text-sky-300 font-bold text-xs mb-1">
                <Leaf className="w-4 h-4 text-sky-600" />
                <span>Bahan Organik Sirkular</span>
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                POME terolah dan kompos tandan kosong memiliki <strong>0 kg CO₂e emisi manufaktur</strong> dan nol transportasi jarak jauh, menggantikan hara anorganik sekaligus memperbaiki kapasitas tukar kation tanah.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: OPTIMIZATION SCENARIOS COMPARISON */}
      {activeTab === 'scenarios' && (
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Skenario Optimasi Pilihan Input Agronomi (Decision Support)
              </span>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Simulasi dampak peralihan formulasi pupuk terhadap total emisi tahunan kebun dan jejak karbon per ton CPO.
              </p>
            </div>
            <span className="text-xs text-neutral-500 font-mono">
              Produksi Basis: {fmt(cpoTon, 0)} MT CPO
            </span>
          </div>

          {/* COMPOSED RECHARTS BAR & LINE CHART */}
          <div className="h-[360px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={optimizationScenarios}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333333' : '#e5e7eb'} vertical={false} />
                <XAxis dataKey="name" stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={10.5} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${fmt(val / 1000, 1)}k`}
                  label={{
                    value: 'Total Emisi Pupuk (tCO₂e/thn)',
                    angle: -90,
                    position: 'insideLeft',
                    fontSize: 11,
                    fill: isDark ? '#9ca3af' : '#6b7280',
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${fmt(val, 0)}`}
                  label={{
                    value: 'Jejak per Ton CPO (kg CO₂e/t)',
                    angle: 90,
                    position: 'insideRight',
                    fontSize: 11,
                    fill: isDark ? '#9ca3af' : '#6b7280',
                  }}
                />
                <Tooltip content={<CustomScenarioTooltip isDark={isDark} fmt={fmt} />} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />

                <Bar yAxisId="left" dataKey="totalScope1N2O_Tco2e" name="Scope 1 N₂O Tanah" stackId="em" fill="#10b981" />
                <Bar yAxisId="left" dataKey="totalScope3Mfg_Tco2e" name="Scope 3 Manufaktur Pupuk" stackId="em" fill="#0284c7" />
                <Bar yAxisId="left" dataKey="totalFreight_Tco2e" name="Scope 3 Transportasi" stackId="em" fill="#64748b" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="ghgPerTonCpoKg"
                  name="Intensitas per Ton CPO (kg/t)"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#ef4444' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* SCENARIO ACTION CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
            {optimizationScenarios.map((scen) => (
              <div
                key={scen.id}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                  scen.id === 'current'
                    ? 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-300 dark:border-neutral-700'
                    : scen.id === 'circular_synergy'
                    ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-emerald-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      {scen.badge}
                    </span>
                    {scen.deltaPercent !== 0 && (
                      <span className={`text-[10px] font-mono font-bold ${scen.deltaPercent < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {scen.deltaPercent < 0 ? '' : '+'}{scen.deltaPercent.toFixed(1)}%
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mt-2">
                    {scen.name}
                  </h4>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-snug">
                    {scen.description}
                  </p>

                  <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Total GRK:</span>
                      <strong className="text-neutral-900 dark:text-neutral-100">{fmt(scen.totalFertilizerGhgTco2e, 0)} t</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">per Ton CPO:</span>
                      <span className="text-blue-600 font-bold">{fmt(scen.ghgPerTonCpoKg, 1)} kg</span>
                    </div>
                  </div>
                </div>

                {onUpdateEstate && scen.id !== 'current' && (
                  <button
                    onClick={() => handleApplyScenario(scen)}
                    className="mt-3 w-full py-1.5 px-2 rounded-lg text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-neutral-700 dark:text-neutral-300 transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Terapkan Skenario</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: SENSITIVITY SLIDER & CONTINUOUS ADOPTION CURVE */}
      {activeTab === 'sensitivity_slider' && (
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Kurva Sensitivitas Adopsi Inhibitor & Daur Ulang Organik
              </span>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Modelkan kurva penurunan emisi linier saat adopsi NI/UI ditingkatkan dari 0% hingga 100%.
              </p>
            </div>
            <span className="text-xs text-neutral-500 font-mono">
              Faktor Reduksi Langsung: -35% N₂O
            </span>
          </div>

          {/* AREA CHART FOR DECARBONISATION TRAJECTORY */}
          <div className="h-[340px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={sensitivityCurveData}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333333' : '#e5e7eb'} vertical={false} />
                <XAxis dataKey="adoptionRate" stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={11} tickLine={false} />
                <YAxis
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${fmt(val / 1000, 1)}k`}
                  label={{
                    value: 'Emisi Pupuk Kebun (tCO₂e/thn)',
                    angle: -90,
                    position: 'insideLeft',
                    fontSize: 11,
                    fill: isDark ? '#9ca3af' : '#6b7280',
                  }}
                />
                <Tooltip content={<CustomSensitivityTooltip isDark={isDark} fmt={fmt} />} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />

                <Area
                  type="monotone"
                  dataKey="totalGhgTco2e"
                  name="Total Jejak Karbon Pupuk (tCO₂e)"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.25}
                  strokeWidth={3}
                />
                <Area
                  type="monotone"
                  dataKey="scope1N2O"
                  name="Scope 1 N₂O Tanah Terinhibisi (tCO₂e)"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* INTERACTIVE SUBSTITUTION SLIDER */}
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                  Simulator Adopsi Real-Time (What-If Interactive Sliders)
                </h4>
              </div>
              <span className="text-[11px] text-neutral-500">
                Geser persentase untuk mensimulasikan target pengadaan pupuk hijau perusahaan.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Slider 1: NI/UI Adoption */}
              <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Tingkat Adopsi Inhibitor (NI/UI):
                  </span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">
                    {interactiveInhibitorAdoption}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={interactiveInhibitorAdoption}
                  onChange={(e) => setInteractiveInhibitorAdoption(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>0% (Standar)</span>
                  <span>50% (Transisi)</span>
                  <span>100% (Full Net-Zero)</span>
                </div>
              </div>

              {/* Dynamic Impact Display */}
              <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-medium text-neutral-500">
                    Estimasi Reduksi Emisi Tahunan:
                  </span>
                  {(() => {
                    const totalN = totalNAppliedKg || 1200000;
                    const baselineStdDir = (totalN * CONSTANTS.N2O_DIRECT_STANDARD_N * CONSTANTS.N2O_TO_N_RATIO * CONSTANTS.GWP_N2O) / 1000;
                    const simInhN = (totalN * interactiveInhibitorAdoption) / 100;
                    const simStdN = totalN - simInhN;
                    const simDir = ((simStdN * CONSTANTS.N2O_DIRECT_STANDARD_N + simInhN * CONSTANTS.N2O_DIRECT_INHIBITED_N) * CONSTANTS.N2O_TO_N_RATIO * CONSTANTS.GWP_N2O) / 1000;
                    const savedTco2e = Math.max(0, baselineStdDir - simDir);
                    const savedCpo = (savedTco2e * 1000) / cpoTon;

                    return (
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                          -{fmt(savedTco2e, 0)} tCO₂e/thn
                        </span>
                        <span className="text-xs text-neutral-500">
                          (-{fmt(savedCpo, 1)} kg/t CPO)
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {onUpdateEstate && (
                  <button
                    onClick={() => {
                      const totalN = totalNAppliedKg || 1200000;
                      const inhN = Math.round((totalN * interactiveInhibitorAdoption) / 100);
                      const stdN = Math.max(0, totalN - inhN);
                      onUpdateEstate({
                        ...estate,
                        syntheticNStandardKg: stdN,
                        syntheticNInhibitedKg: inhN,
                      });
                      setApplyNotification(
                        `Sukses menerapkan ${interactiveInhibitorAdoption}% adopsi inhibitor ke parameter kebun aktif!`
                      );
                      setTimeout(() => setApplyNotification(null), 7000);
                    }}
                    className="mt-2 py-1 px-3 rounded text-[11px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
                  >
                    Terapkan Pengaturan Slider Ini ke Kebun
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED DATA TABLE */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
              Matriks Numerik Intensitas Emisi Pupuk (Audit Grade)
            </span>
            <span className="text-xs text-neutral-400">·</span>
            <span className="text-[11px] text-neutral-500">
              Rincian Scope 1, Scope 3, dan Intensitas per Produk CPO
            </span>
          </div>

          <span className="text-[11px] font-mono text-neutral-500">
            {fertilizerComparisonData.length} Kategori Pupuk
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-400 font-semibold">
                <th className="p-2.5">Kategori Pupuk</th>
                <th className="p-2.5">Aplikasi Saat Ini</th>
                <th className="p-2.5 text-right">Scope 1 N₂O Tanah</th>
                <th className="p-2.5 text-right">Scope 3 Manufaktur</th>
                <th className="p-2.5 text-right">Scope 3 Transportasi</th>
                <th className="p-2.5 text-right font-bold">Total Emisi (tCO₂e)</th>
                <th className="p-2.5 text-right font-bold text-emerald-700 dark:text-emerald-400">Intensitas per kg N</th>
                <th className="p-2.5 text-right text-blue-700 dark:text-blue-400">Beban per Ton CPO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
              {fertilizerComparisonData.map((d) => (
                <tr key={d.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="p-2.5 font-sans font-medium flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span>{d.name}</span>
                  </td>
                  <td className="p-2.5 text-neutral-700 dark:text-neutral-300">
                    {d.appliedQuantityDisplay}
                  </td>
                  <td className="p-2.5 text-right text-amber-700 dark:text-amber-400">
                    {fmt(d.scope1DirectN2O_Tco2e + d.scope1IndirectN2O_Tco2e, 1)} t
                  </td>
                  <td className="p-2.5 text-right text-sky-700 dark:text-sky-400">
                    {fmt(d.scope3Mfg_Tco2e, 1)} t
                  </td>
                  <td className="p-2.5 text-right text-neutral-500">
                    {fmt(d.scope3Freight_Tco2e, 1)} t
                  </td>
                  <td className="p-2.5 text-right font-bold text-neutral-900 dark:text-neutral-100">
                    {fmt(d.totalGhgTco2e, 1)} t
                  </td>
                  <td className="p-2.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                    {d.intensityPerKgN > 0 ? `${fmt(d.intensityPerKgN, 2)} kg/kg` : '—'}
                  </td>
                  <td className="p-2.5 text-right text-blue-700 dark:text-blue-400 font-semibold">
                    {fmt(d.intensityPerTonCpo, 2)} kg/t
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
              Kepatuhan Metodologi RSPO PalmGHG v5 & GHG Protocol LSR:
            </strong>{' '}
            Dalam PalmGHG V5, penggunaan pupuk dengan <em>Nitrification Inhibitors (NI)</em> atau <em>Urease Inhibitors (UI)</em> secara eksplisit diakui dengan faktor emisi N₂O tanah langsung <strong>0,0065 kg N₂O-N/kg N</strong> (dibandingkan 0,010 pada N standar). Seluruh pupuk daur ulang organik (kompos dan POME) dihitung langsung di tingkat kebun dengan emisi manufaktur Scope 3 sebesar nol, mendukung prinsip efisiensi <em>4R Nutrient Stewardship</em>.
          </div>
        </div>
      </div>
    </div>
  );
};

// Tooltip Components for Recharts
interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  isDark: boolean;
  fmt: (val: number, decimals?: number) => string;
}

const CustomFertilizerTooltip: React.FC<TooltipProps> = ({ active, payload, label, isDark, fmt }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload as FertilizerTypeIntensity;
  if (!data) return null;

  return (
    <div className={`p-3 rounded-xl shadow-lg border text-xs max-w-xs ${
      isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-200 text-neutral-900'
    }`}>
      <div className="font-bold border-b border-neutral-200 dark:border-neutral-700 pb-1 mb-2 flex items-center justify-between">
        <span>{data.name}</span>
        <span className="text-[10px] text-neutral-500 font-mono">{data.appliedQuantityDisplay}</span>
      </div>

      <div className="space-y-1 font-mono text-[11px]">
        <div className="flex justify-between items-center text-amber-600">
          <span className="font-sans">Scope 1 N₂O Langsung:</span>
          <strong>{fmt(data.scope1DirectN2O_Tco2e, 1)} tCO₂e</strong>
        </div>
        <div className="flex justify-between items-center text-amber-500">
          <span className="font-sans">Scope 1 N₂O Tidak Langsung:</span>
          <strong>{fmt(data.scope1IndirectN2O_Tco2e, 1)} tCO₂e</strong>
        </div>
        <div className="flex justify-between items-center text-sky-600">
          <span className="font-sans">Scope 3 Manufaktur:</span>
          <strong>{fmt(data.scope3Mfg_Tco2e, 1)} tCO₂e</strong>
        </div>
        <div className="flex justify-between items-center text-neutral-500">
          <span className="font-sans">Scope 3 Transportasi:</span>
          <strong>{fmt(data.scope3Freight_Tco2e, 1)} tCO₂e</strong>
        </div>
        <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 pt-1 border-t border-neutral-200 dark:border-neutral-700 font-bold">
          <span className="font-sans">Total Emisi:</span>
          <strong>{fmt(data.totalGhgTco2e, 1)} tCO₂e</strong>
        </div>
        {data.intensityPerKgN > 0 && (
          <div className="flex justify-between items-center text-purple-600">
            <span className="font-sans">Intensitas per kg N:</span>
            <strong>{fmt(data.intensityPerKgN, 2)} kg CO₂e/kg N</strong>
          </div>
        )}
      </div>
    </div>
  );
};

const CustomScenarioTooltip: React.FC<TooltipProps> = ({ active, payload, isDark, fmt }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload as OptimizationScenario;
  if (!data) return null;

  return (
    <div className={`p-3 rounded-xl shadow-lg border text-xs max-w-xs ${
      isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-200 text-neutral-900'
    }`}>
      <div className="font-bold border-b border-neutral-200 dark:border-neutral-700 pb-1 mb-2">
        <div>{data.name}</div>
        <div className="text-[10px] text-neutral-500 font-normal">{data.badge}</div>
      </div>

      <div className="space-y-1 font-mono text-[11px]">
        <div className="flex justify-between items-center text-emerald-600">
          <span className="font-sans">Scope 1 N₂O Tanah:</span>
          <strong>{fmt(data.totalScope1N2O_Tco2e, 1)} tCO₂e</strong>
        </div>
        <div className="flex justify-between items-center text-sky-600">
          <span className="font-sans">Scope 3 Manufaktur:</span>
          <strong>{fmt(data.totalScope3Mfg_Tco2e, 1)} tCO₂e</strong>
        </div>
        <div className="flex justify-between items-center font-bold text-neutral-900 dark:text-neutral-100 pt-1 border-t border-neutral-200 dark:border-neutral-700">
          <span className="font-sans">Total Emisi:</span>
          <strong>{fmt(data.totalFertilizerGhgTco2e, 1)} tCO₂e</strong>
        </div>
        <div className="flex justify-between items-center text-red-600 font-bold">
          <span className="font-sans">Jejak per Ton CPO:</span>
          <strong>{fmt(data.ghgPerTonCpoKg, 1)} kg/t CPO</strong>
        </div>
        {data.deltaPercent !== 0 && (
          <div className={`flex justify-between items-center font-bold ${data.deltaPercent < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            <span className="font-sans">Delta Baseline:</span>
            <strong>{data.deltaPercent < 0 ? '' : '+'}{data.deltaPercent.toFixed(1)}%</strong>
          </div>
        )}
      </div>
    </div>
  );
};

const CustomSensitivityTooltip: React.FC<TooltipProps> = ({ active, payload, isDark, fmt }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className={`p-3 rounded-xl shadow-lg border text-xs max-w-xs ${
      isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-200 text-neutral-900'
    }`}>
      <div className="font-bold border-b border-neutral-200 dark:border-neutral-700 pb-1 mb-2">
        <span>Adopsi Inhibitor: {data.adoptionRate}</span>
      </div>
      <div className="space-y-1 font-mono text-[11px]">
        <div className="flex justify-between items-center text-emerald-600">
          <span className="font-sans">Total Emisi:</span>
          <strong>{fmt(data.totalGhgTco2e, 0)} tCO₂e</strong>
        </div>
        <div className="flex justify-between items-center text-amber-600">
          <span className="font-sans">Scope 1 N₂O Tanah:</span>
          <strong>{fmt(data.scope1N2O, 0)} tCO₂e</strong>
        </div>
        <div className="flex justify-between items-center text-blue-600">
          <span className="font-sans">Jejak per Ton CPO:</span>
          <strong>{fmt(data.intensityKgPerTonCpo, 1)} kg/t</strong>
        </div>
      </div>
    </div>
  );
};
