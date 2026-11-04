import React, { useState, useMemo } from 'react';
import {
  EstateParameters,
  MillParameters,
  FFBSourceAllocation,
  PalmGHGAssessmentResults,
} from '../types/palmghg';
import { calculatePalmGHGV5, CONSTANTS } from '../utils/palmghgCalculations';
import {
  Scale,
  TrendingDown,
  TrendingUp,
  Info,
  CheckCircle2,
  Sparkles,
  Sliders,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Check,
  Globe2,
  AlertTriangle,
} from 'lucide-react';

export interface GwpStandardOption {
  id: string;
  code: string;
  name: string;
  shortLabel: string;
  sourceReport: string;
  ch4Gwp: number;
  n2oGwp: number;
  horizon: '100-year' | '20-year';
  isOfficialRspoV5: boolean;
  statusBadge: string;
  badgeColor: string;
  description: string;
  regulatoryScope: string;
}

export const GWP_STANDARDS: GwpStandardOption[] = [
  {
    id: 'AR5_100',
    code: 'IPCC AR5 (2014)',
    name: 'IPCC Fifth Assessment Report (AR5) GWP-100',
    shortLabel: 'AR5 (RSPO V5 Standard)',
    sourceReport: 'IPCC AR5 WG1 Chapter 8 (Table 8.7)',
    ch4Gwp: 28,
    n2oGwp: 265,
    horizon: '100-year',
    isOfficialRspoV5: true,
    statusBadge: 'Standar Resmi RSPO V5',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    description: 'Standar regulasi resmi yang diwajibkan dalam RSPO PalmGHG V5 dan GHG Protocol LSR v1.1. Menghitung CH₄ biogenik pada faktor 28 dan N₂O pada 265.',
    regulatoryScope: 'RSPO PalmGHG V5, ISCC EU, GHG Protocol Corporate Standard, SBTi FLAG',
  },
  {
    id: 'AR6_100',
    code: 'IPCC AR6 (2021)',
    name: 'IPCC Sixth Assessment Report (AR6) GWP-100',
    shortLabel: 'AR6 (UNFCCC / Paris Agreement)',
    sourceReport: 'IPCC AR6 WG1 Chapter 7 (Table 7.15)',
    ch4Gwp: 27.2,
    n2oGwp: 273,
    horizon: '100-year',
    isOfficialRspoV5: false,
    statusBadge: 'Konsensus Mutakhir Paris Agreement',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    description: 'Konsensus sains mutakhir IPCC. Diwajibkan oleh UNFCCC Decision 5/CMA.3 untuk pelaporan Paris Agreement BTR (Biennial Transparency Report) dan ISO 14067:2018.',
    regulatoryScope: 'UNFCCC Paris Agreement BTR (2024+), ISO 14067:2018, EU CSRD & CSDDD ESG Disclosures',
  },
  {
    id: 'AR4_100',
    code: 'IPCC AR4 (2007)',
    name: 'IPCC Fourth Assessment Report (AR4) GWP-100',
    shortLabel: 'AR4 (PalmGHG Legasi V1-V4)',
    sourceReport: 'IPCC AR4 WG1 (Table 2.14)',
    ch4Gwp: 25,
    n2oGwp: 298,
    horizon: '100-year',
    isOfficialRspoV5: false,
    statusBadge: 'Legasi PalmGHG V1-V4',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    description: 'Standar lama yang digunakan pada PalmGHG versi 1 hingga versi 4, skema kredit karbon CDM POME, dan pelaporan nasional Kyoto Protocol.',
    regulatoryScope: 'Audit historis RSPO PalmGHG v1-v4, CDM Biogas POME Projects, UNFCCC KP CP1',
  },
  {
    id: 'AR5_CC',
    code: 'AR5 + Feedbacks',
    name: 'IPCC AR5 dengan Umpan Balik Iklim-Karbon',
    shortLabel: 'AR5 + Feedbacks (Siklus Karbon)',
    sourceReport: 'IPCC AR5 WG1 Chapter 8 (coupled cc feedbacks)',
    ch4Gwp: 34,
    n2oGwp: 298,
    horizon: '100-year',
    isOfficialRspoV5: false,
    statusBadge: 'Kopel Iklim-Biosfer',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-700',
    description: 'Memperhitungkan efek umpan balik iklim-siklus karbon untuk gas non-CO₂, mencerminkan dampak kenaikan suhu terhadap respirasi tanah tropis dan vegetasi.',
    regulatoryScope: 'Kajian Akademis LCA Lanjutan & Riset Mitigasi Iklim Ekstrem',
  },
  {
    id: 'AR6_20',
    code: 'AR6 GWP-20',
    name: 'IPCC AR6 GWP-20 (Horizon Jangka Pendek 20 Tahun)',
    shortLabel: 'AR6 GWP-20 (Jangka Pendek 20 Thn)',
    sourceReport: 'IPCC AR6 WG1 Chapter 7 (20-year horizon)',
    ch4Gwp: 82.5,
    n2oGwp: 273,
    horizon: '20-year',
    isOfficialRspoV5: false,
    statusBadge: 'Fokus Metana Darurat',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-700',
    description: 'Menilai potensi pemanasan global jangka pendek 20 tahun. Sangat sensitif terhadap emisi metana POME karena masa paruh metana di atmosfer ~12 tahun.',
    regulatoryScope: 'Global Methane Pledge, Penilaian Risiko Transisi Iklim Jangka Pendek',
  },
];

interface Props {
  estate?: EstateParameters;
  mill?: MillParameters;
  ffbSources: FFBSourceAllocation[];
  results?: PalmGHGAssessmentResults;
  isDark?: boolean;
}

export const GwpConstantsSettingsPanel: React.FC<Props> = ({
  estate,
  mill,
  ffbSources,
  results,
  isDark = false,
}) => {
  const [selectedStandardId, setSelectedStandardId] = useState<string>('AR5_100');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Format Helper
  const fmt = (val: number, decimals: number = 1) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const selectedStandard = useMemo(() => {
    return GWP_STANDARDS.find((s) => s.id === selectedStandardId) || GWP_STANDARDS[0];
  }, [selectedStandardId]);

  // Baseline standard is AR5
  const baselineStandard = GWP_STANDARDS[0];

  // Baseline figures
  const baselineNetEmissions = results ? results.totalNetEmissions : 32450;
  const baselineCpoIntensity = results ? results.netGhgPerTonCpo : 1.15;

  // Approximate recalculation under the selected GWP constants:
  // In PalmGHG:
  // Methane emissions (POME open lagoon) scale with GWP_CH4 / 28
  // Fertiliser N2O emissions scale with GWP_N2O / 265
  const recalculatedInventory = useMemo(() => {
    if (!results) {
      const deltaRatio = (selectedStandard.ch4Gwp / 28 + selectedStandard.n2oGwp / 265) / 2;
      return {
        totalNetEmissions: baselineNetEmissions * deltaRatio,
        netCpoIntensity: baselineCpoIntensity * deltaRatio,
        deltaNetEmissions: baselineNetEmissions * deltaRatio - baselineNetEmissions,
        deltaPercent: ((deltaRatio - 1) * 100),
      };
    }

    const baselinePomeCh4Tco2e = results.millScope1PomeLagoon + results.millScope1PomeMethaneUncombusted;
    const baselineFertN2OTco2e = results.estateScope1FertiliserApp;

    // Adjusted POME Methane tCO2e
    const adjustedPomeCh4Tco2e = (baselinePomeCh4Tco2e / CONSTANTS.GWP_CH4) * selectedStandard.ch4Gwp;
    
    // Adjusted Fertiliser N2O tCO2e
    const adjustedFertN2OTco2e = (baselineFertN2OTco2e / CONSTANTS.GWP_N2O) * selectedStandard.n2oGwp;

    const deltaCh4 = adjustedPomeCh4Tco2e - baselinePomeCh4Tco2e;
    const deltaN2O = adjustedFertN2OTco2e - baselineFertN2OTco2e;
    const totalDeltaTco2e = deltaCh4 + deltaN2O;

    const recalculatedNetEmissions = Math.max(0, results.totalNetEmissions + totalDeltaTco2e);
    const totalCpo = Math.max(1, results.totalCpoProducedTon);
    const recalculatedCpoIntensity = recalculatedNetEmissions / totalCpo;

    const deltaPercent = results.totalNetEmissions !== 0
      ? (totalDeltaTco2e / Math.abs(results.totalNetEmissions)) * 100
      : 0;

    return {
      totalNetEmissions: recalculatedNetEmissions,
      netCpoIntensity: recalculatedCpoIntensity,
      deltaNetEmissions: totalDeltaTco2e,
      deltaPercent,
      adjustedPomeCh4Tco2e,
      adjustedFertN2OTco2e,
      deltaCh4,
      deltaN2O,
    };
  }, [results, selectedStandard, baselineNetEmissions, baselineCpoIntensity]);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-xs space-y-4">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Pengaturan Konstanta Nilai GWP (Global Warming Potential Settings)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold">
                IPCC AR4 / AR5 / AR6
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Ganti standar laporan asesmen IPCC untuk melihat pergeseran total inventarisasi emisi GRK (tCO₂e) akibat perbedaan faktor konversi metana (CH₄) dan dinitrogen oksida (N₂O).
            </p>
          </div>
        </div>

        <button
          onClick={() => setSelectedStandardId('AR5_100')}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-lg transition-colors shrink-0"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset ke RSPO V5 (AR5)</span>
        </button>
      </div>

      {/* STANDARD SELECTOR CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
        {GWP_STANDARDS.map((std) => {
          const isSelected = std.id === selectedStandardId;
          return (
            <button
              key={std.id}
              onClick={() => setSelectedStandardId(std.id)}
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                  : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${std.badgeColor}`}>
                    {std.code}
                  </span>
                  {std.isOfficialRspoV5 && (
                    <span className="text-[9px] font-extrabold uppercase bg-emerald-600 text-white px-1.5 py-0.2 rounded">
                      RSPO V5
                    </span>
                  )}
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 leading-tight">
                  {std.shortLabel}
                </div>

                {/* Constants Badges */}
                <div className="flex items-center gap-1.5 text-[11px] font-mono mt-2">
                  <span className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold">
                    CH₄: {std.ch4Gwp}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold">
                    N₂O: {std.n2oGwp}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 text-[10px] text-neutral-500 line-clamp-2">
                {std.regulatoryScope}
              </div>
            </button>
          );
        })}
      </div>

      {/* LIVE INVENTORY IMPACT CALCULATOR STRIP */}
      <div className="p-4 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-neutral-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-neutral-900 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-blue-200/50 dark:border-blue-800/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                Dampak terhadap Total Emisi GRK ({selectedStandard.name})
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                Horizon: {selectedStandard.horizon}
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
              {selectedStandard.description}
            </p>
          </div>

          {/* Delta Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-neutral-500">Selisih vs RSPO V5 Baseline:</span>
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                recalculatedInventory.deltaNetEmissions === 0
                  ? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-300'
                  : recalculatedInventory.deltaNetEmissions > 0
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
              }`}
            >
              {recalculatedInventory.deltaNetEmissions > 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              ) : recalculatedInventory.deltaNetEmissions < 0 ? (
                <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Check className="w-3.5 h-3.5 text-neutral-600" />
              )}
              <span>
                {recalculatedInventory.deltaNetEmissions > 0 ? '+' : ''}
                {fmt(recalculatedInventory.deltaNetEmissions, 0)} tCO₂e ({recalculatedInventory.deltaPercent > 0 ? '+' : ''}{fmt(recalculatedInventory.deltaPercent, 1)}%)
              </span>
            </div>
          </div>
        </div>

        {/* 3 KPI Comparison Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="text-[11px] text-neutral-500 mb-0.5">Total Emisi Netto Rekalkulasi</div>
            <div className="text-lg font-black font-mono text-neutral-900 dark:text-neutral-100">
              {fmt(recalculatedInventory.totalNetEmissions, 0)} <span className="text-xs font-normal text-neutral-500">tCO₂e</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
              Baseline AR5: {fmt(baselineNetEmissions, 0)} tCO₂e
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="text-[11px] text-neutral-500 mb-0.5">Intensitas Emisi CPO Rekalkulasi</div>
            <div className="text-lg font-black font-mono text-blue-700 dark:text-blue-300">
              {fmt(recalculatedInventory.netCpoIntensity, 2)} <span className="text-xs font-normal text-neutral-500">tCO₂e/t CPO</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
              Baseline AR5: {fmt(baselineCpoIntensity, 2)} tCO₂e/t CPO
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="text-[11px] text-neutral-500 mb-0.5">Dampak Gas Spesifik</div>
            <div className="space-y-0.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Metana (CH₄ POME):</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  {selectedStandard.ch4Gwp} (vs 28)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Nitrogen (N₂O Pupuk):</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  {selectedStandard.n2oGwp} (vs 265)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory Citation Notice */}
        <div className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-start gap-1.5 pt-1">
          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <strong>Catatan Audit RSPO:</strong> Seluruh laporan resmi PalmGHG V5 untuk sertifikasi RSPO dan PalmTrace <strong>wajib menggunakan IPCC AR5</strong>. Nilai AR6 atau GWP-20 di atas disediakan untuk keperluan perbandingan audit transnasional (UNFCCC, Paris Agreement BTR, atau ISO 14067).
          </span>
        </div>
      </div>
    </div>
  );
};
