import React, { useState, useMemo } from 'react';
import { EstateParameters } from '../types/palmghg';
import {
  Layers,
  TreePine,
  CheckCircle2,
  AlertTriangle,
  Info,
  RotateCcw,
  Plus,
  Trash2,
  Download,
  Sparkles,
  Calendar,
  Compass,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Percent,
  Sliders,
  Scale,
  Clock,
} from 'lucide-react';

export type HistoricalLandCoverType =
  | 'primary_forest'
  | 'disturbed_forest'
  | 'shrubland'
  | 'grassland'
  | 'previous_tree_crop'
  | 'cropland'
  | 'bare_land'
  | 'custom';

export type SoilType = 'mineral' | 'peat';

export interface LucParcel {
  id: string;
  name: string;
  areaHa: number;
  historicalLandCover: HistoricalLandCoverType;
  customCarbonStockTCPerHa?: number;
  soilType: SoilType;
  conversionYear: number;
}

// RSPO PalmGHG v5 Default Biomass Carbon Stocks (tC / ha)
// Source: RSPO PalmGHG v5 Subbab 2.2 Table 2.1 & GHG Protocol Land Sector and Removals
export const HISTORICAL_LAND_COVER_DATA: Record<
  HistoricalLandCoverType,
  { label: string; labelId: string; defaultCarbonStockTC: number; description: string; citation: string }
> = {
  primary_forest: {
    label: 'Primary / Intact High Density Forest',
    labelId: 'Hutan Primer / Alami Utuh',
    defaultCarbonStockTC: 250,
    description: 'Hutan hujan tropis klimaks kanopi tertutup tidak terganggu.',
    citation: 'RSPO PalmGHG v5 Tab 2.1 (250 tC/ha)',
  },
  disturbed_forest: {
    label: 'Disturbed / Logged-over Secondary Forest',
    labelId: 'Hutan Sekunder / Bekas Tebangan',
    defaultCarbonStockTC: 150,
    description: 'Hutan terdegradasi atau bekas tebangan tebang pilih (logged-over).',
    citation: 'RSPO PalmGHG v5 Tab 2.1 (150 tC/ha)',
  },
  shrubland: {
    label: 'Shrubland / Dense Scrub (Belukar)',
    labelId: 'Semak Belukar Tebal',
    defaultCarbonStockTC: 45,
    description: 'Vegetasi sekunder awal berkayu rendah dan semak lebat.',
    citation: 'RSPO PalmGHG v5 Tab 2.1 (45 tC/ha)',
  },
  grassland: {
    label: 'Grassland / Imperata (Padang Alang-alang)',
    labelId: 'Padang Rumput / Alang-alang',
    defaultCarbonStockTC: 15,
    description: 'Padang rumput terbuka monokultur alang-alang atau savana.',
    citation: 'RSPO PalmGHG v5 Tab 2.1 (15 tC/ha)',
  },
  previous_tree_crop: {
    label: 'Previous Tree Crops / Old Palm Replanting',
    labelId: 'Perkebunan Pohon / Sawit Replanting',
    defaultCarbonStockTC: 75,
    description: 'Karet, kakao tua, atau peremajaan (replanting) kelapa sawit siklus 2.',
    citation: 'RSPO PalmGHG v5 Tab 2.1 (75 tC/ha)',
  },
  cropland: {
    label: 'Annual Cropland / Food Crops',
    labelId: 'Pertanian Semusim / Pangan',
    defaultCarbonStockTC: 10,
    description: 'Lahan sawah, jagung, ubi, atau budidaya tanaman pangan semusim.',
    citation: 'RSPO PalmGHG v5 Tab 2.1 (10 tC/ha)',
  },
  bare_land: {
    label: 'Degraded Bare Land / Open Soil',
    labelId: 'Lahan Terbuka / Bekas Tambang',
    defaultCarbonStockTC: 2,
    description: 'Lahan gundul terbuka tanpa tutupan vegetasi signifikan.',
    citation: 'RSPO PalmGHG v5 Tab 2.1 (2 tC/ha)',
  },
  custom: {
    label: 'Custom Certified Carbon Stock (HCSA Study)',
    labelId: 'Nilai Khusus Terverifikasi (Kajian HCSA)',
    defaultCarbonStockTC: 80,
    description: 'Hasil inventarisasi biomassa lapangan berstandar HCS Approach.',
    citation: 'Nilai DV Khusus Terverifikasi LS',
  },
};

// RSPO PalmGHG v5 Standard Constants for LUC
export const OIL_PALM_EQUILIBRIUM_CARBON_STOCK_TC = 40; // 40 tC/ha time-averaged over 25-yr commercial cycle
export const C_TO_CO2_FACTOR = 44 / 12; // 3.6667 tCO2 per tC
export const AMORTISATION_PERIOD_YEARS = 25; // 25 years straight-line amortisation
export const PEAT_CLEARING_DRAINAGE_FACTOR_TCO2E = 100; // Benchmark one-off clearing oxidation debt for peat

interface Props {
  estate: EstateParameters;
  onUpdateEstate: (newEstate: EstateParameters) => void;
  assessmentYear?: number;
  isDark?: boolean;
}

export const LucCalculatorModule: React.FC<Props> = ({
  estate,
  onUpdateEstate,
  assessmentYear = 2026,
  isDark = false,
}) => {
  // Preset default parcels tailored to the estate's planted area
  const initialParcels = useMemo<LucParcel[]>(() => {
    const totalArea = estate.totalPlantedAreaHa || 9300;
    const peatArea = estate.peatSoilAreaHa || 1400;
    const mineralArea = Math.max(0, totalArea - peatArea);

    return [
      {
        id: 'parcel-1',
        name: 'Divisi I - Blok Utara (Konversi Hutan Sekunder)',
        areaHa: Math.round(mineralArea * 0.45) || 3500,
        historicalLandCover: 'disturbed_forest',
        soilType: 'mineral',
        conversionYear: assessmentYear - 14, // e.g. 2012 (14 years ago, in active 25y amortisation)
      },
      {
        id: 'parcel-2',
        name: 'Divisi II - Blok Replanting Sawit Generasi 1',
        areaHa: Math.round(mineralArea * 0.35) || 2800,
        historicalLandCover: 'previous_tree_crop',
        soilType: 'mineral',
        conversionYear: assessmentYear - 6, // e.g. 2020
      },
      {
        id: 'parcel-3',
        name: 'Divisi III - Blok Timur (Semak Belukar)',
        areaHa: Math.round(mineralArea * 0.20) || 1600,
        historicalLandCover: 'shrubland',
        soilType: 'mineral',
        conversionYear: assessmentYear - 9, // e.g. 2017
      },
      {
        id: 'parcel-4',
        name: 'Divisi IV - Blok Gambut (Konversi Bersejarah)',
        areaHa: peatArea || 1400,
        historicalLandCover: 'shrubland',
        soilType: 'peat',
        conversionYear: assessmentYear - 11, // e.g. 2015
      },
    ];
  }, [estate.totalPlantedAreaHa, estate.peatSoilAreaHa, assessmentYear]);

  const [parcels, setParcels] = useState<LucParcel[]>(initialParcels);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Formatting helper
  const fmt = (val: number, decimals: number = 0) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  // Calculate detailed parcel emissions
  const calculatedParcels = useMemo(() => {
    return parcels.map((parcel) => {
      const coverConfig = HISTORICAL_LAND_COVER_DATA[parcel.historicalLandCover];
      const carbonBeforeTC =
        parcel.historicalLandCover === 'custom'
          ? parcel.customCarbonStockTCPerHa ?? 80
          : coverConfig.defaultCarbonStockTC;

      const carbonAfterTC = OIL_PALM_EQUILIBRIUM_CARBON_STOCK_TC; // 40 tC/ha
      const deltaCarbonTC = Math.max(0, carbonBeforeTC - carbonAfterTC);
      const biomassDebtPerHaTco2e = deltaCarbonTC * C_TO_CO2_FACTOR;

      // Peat initial land clearing & drainage factor
      const peatDebtPerHaTco2e =
        parcel.soilType === 'peat' ? PEAT_CLEARING_DRAINAGE_FACTOR_TCO2E : 0;

      const totalDebtPerHaTco2e = biomassDebtPerHaTco2e + peatDebtPerHaTco2e;
      const totalGrossParcelDebtTco2e = totalDebtPerHaTco2e * parcel.areaHa;

      // Amortisation timing
      const elapsedYears = assessmentYear - parcel.conversionYear;
      const isExpired = elapsedYears >= AMORTISATION_PERIOD_YEARS;
      const isFuture = elapsedYears < 0;
      const isActive = !isExpired && !isFuture;

      const annualAmortisedTco2e = isActive
        ? totalGrossParcelDebtTco2e / AMORTISATION_PERIOD_YEARS
        : 0;

      const cumulativeAmortisedTco2e = isExpired
        ? totalGrossParcelDebtTco2e
        : isActive
        ? (totalGrossParcelDebtTco2e / AMORTISATION_PERIOD_YEARS) * elapsedYears
        : 0;

      const remainingDebtTco2e = Math.max(
        0,
        totalGrossParcelDebtTco2e - cumulativeAmortisedTco2e
      );

      // Regulatory milestone status
      let regulatoryStatus = '';
      let regulatoryColor = '';
      if (parcel.conversionYear < 2005) {
        regulatoryStatus = 'Pre-Nov 2005 (Legacy RSPO)';
        regulatoryColor = 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800';
      } else if (parcel.conversionYear <= 2018) {
        regulatoryStatus = 'Nov 2005 – Nov 2018 (RaCP Scope)';
        regulatoryColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300';
      } else {
        regulatoryStatus = 'Post-Nov 2018 (2018 P&C / NDPE)';
        regulatoryColor = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300';
      }

      return {
        ...parcel,
        carbonBeforeTC,
        carbonAfterTC,
        biomassDebtPerHaTco2e,
        peatDebtPerHaTco2e,
        totalDebtPerHaTco2e,
        totalGrossParcelDebtTco2e,
        elapsedYears,
        isExpired,
        isFuture,
        isActive,
        remainingYears: Math.max(0, AMORTISATION_PERIOD_YEARS - elapsedYears),
        annualAmortisedTco2e,
        cumulativeAmortisedTco2e,
        remainingDebtTco2e,
        regulatoryStatus,
        regulatoryColor,
      };
    });
  }, [parcels, assessmentYear]);

  // Aggregate Totals across all parcels
  const totals = useMemo(() => {
    let totalAreaHa = 0;
    let totalMineralHa = 0;
    let totalPeatHa = 0;
    let totalGrossDebtTco2e = 0;
    let totalAnnualAmortisedTco2e = 0;
    let totalCumulativeAmortisedTco2e = 0;
    let totalRemainingDebtTco2e = 0;
    let activeParcelsCount = 0;
    let expiredParcelsCount = 0;

    calculatedParcels.forEach((p) => {
      totalAreaHa += p.areaHa;
      if (p.soilType === 'peat') totalPeatHa += p.areaHa;
      else totalMineralHa += p.areaHa;

      totalGrossDebtTco2e += p.totalGrossParcelDebtTco2e;
      totalAnnualAmortisedTco2e += p.annualAmortisedTco2e;
      totalCumulativeAmortisedTco2e += p.cumulativeAmortisedTco2e;
      totalRemainingDebtTco2e += p.remainingDebtTco2e;

      if (p.isActive) activeParcelsCount++;
      if (p.isExpired) expiredParcelsCount++;
    });

    return {
      totalAreaHa,
      totalMineralHa,
      totalPeatHa,
      totalGrossDebtTco2e,
      totalAnnualAmortisedTco2e,
      totalCumulativeAmortisedTco2e,
      totalRemainingDebtTco2e,
      activeParcelsCount,
      expiredParcelsCount,
    };
  }, [calculatedParcels]);

  // Add new blank parcel
  const handleAddParcel = () => {
    const newId = `parcel-${Date.now()}`;
    const newParcel: LucParcel = {
      id: newId,
      name: `Blok Baru #${parcels.length + 1}`,
      areaHa: 500,
      historicalLandCover: 'disturbed_forest',
      soilType: 'mineral',
      conversionYear: assessmentYear - 5,
    };
    setParcels([...parcels, newParcel]);
  };

  // Update existing parcel
  const handleUpdateParcel = (id: string, updates: Partial<LucParcel>) => {
    setParcels(parcels.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  // Remove parcel
  const handleRemoveParcel = (id: string) => {
    if (parcels.length <= 1) return;
    setParcels(parcels.filter((p) => p.id !== id));
  };

  // One-Click Synchronize with Estate Parameters
  const handleSyncToEstate = () => {
    // In PalmGHG V5: Scope 1 Annual LUC is grossLucTotalTco2e / grossLucAmortisationYears.
    // If some parcels are active and some expired, the weighted equivalent grossLucTotal is:
    // annualAmortised * 25 years.
    const calculatedGrossDebt = Math.round(totals.totalAnnualAmortisedTco2e * AMORTISATION_PERIOD_YEARS);

    onUpdateEstate({
      ...estate,
      grossLucTotalTco2e: calculatedGrossDebt,
      grossLucAmortisationYears: AMORTISATION_PERIOD_YEARS,
    });

    setSyncNotice(
      `Sukses menyelaraskan! Utang Bruto LUC disinkronkan sebesar ${fmt(calculatedGrossDebt)} tCO₂e (Amortisasi Tahunan Scope 1: ${fmt(totals.totalAnnualAmortisedTco2e)} tCO₂e/thn).`
    );

    setTimeout(() => {
      setSyncNotice(null);
    }, 8000);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'ID Blok / Parcel',
      'Nama Blok',
      'Luas (ha)',
      'Tutupan Lahan Awal',
      'Stok Karbon Awal (tC/ha)',
      'Stok Karbon Sawit (tC/ha)',
      'Jenis Tanah',
      'Tahun Konversi',
      'Status Amortisasi',
      'Tahun Berlalu',
      'Sisa Tahun Amortisasi',
      'Utang Bruto LUC (tCO2e)',
      'Amortisasi Tahunan Scope 1 (tCO2e/thn)',
      'Kumulatif Teramortisasi (tCO2e)',
      'Sisa Utang Belum Amortisasi (tCO2e)',
      'Status Regulasi RSPO',
    ];

    const rows = calculatedParcels.map((p) => [
      p.id,
      `"${p.name}"`,
      p.areaHa,
      `"${HISTORICAL_LAND_COVER_DATA[p.historicalLandCover].labelId}"`,
      p.carbonBeforeTC,
      p.carbonAfterTC,
      p.soilType === 'peat' ? 'Gambut' : 'Mineral',
      p.conversionYear,
      p.isExpired ? 'Kedaluwarsa (>25 Thn)' : p.isActive ? 'Aktif' : 'Masa Depan',
      p.elapsedYears,
      p.remainingYears,
      Math.round(p.totalGrossParcelDebtTco2e),
      Math.round(p.annualAmortisedTco2e),
      Math.round(p.cumulativeAmortisedTco2e),
      Math.round(p.remainingDebtTco2e),
      `"${p.regulatoryStatus}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LUC_Calculator_RSPO_PalmGHG_V5_${assessmentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Preset Scenario Loaders
  const handleLoadScenarioPreset = (presetKey: 'mixed' | 'low_carbon' | 'high_peat' | 'replanting') => {
    const area = estate.totalPlantedAreaHa || 9300;
    if (presetKey === 'mixed') {
      setParcels(initialParcels);
    } else if (presetKey === 'low_carbon') {
      setParcels([
        {
          id: 'p-low-1',
          name: 'Blok Semak Belukar Padat',
          areaHa: Math.round(area * 0.6),
          historicalLandCover: 'shrubland',
          soilType: 'mineral',
          conversionYear: assessmentYear - 8,
        },
        {
          id: 'p-low-2',
          name: 'Blok Padang Alang-alang & Lahan Terbuka',
          areaHa: Math.round(area * 0.4),
          historicalLandCover: 'grassland',
          soilType: 'mineral',
          conversionYear: assessmentYear - 5,
        },
      ]);
    } else if (presetKey === 'high_peat') {
      setParcels([
        {
          id: 'p-peat-1',
          name: 'Afdeling Gambut Dalam Bekas Tebangan',
          areaHa: Math.round(area * 0.4),
          historicalLandCover: 'disturbed_forest',
          soilType: 'peat',
          conversionYear: assessmentYear - 12,
        },
        {
          id: 'p-peat-2',
          name: 'Afdeling Gambut Semak Belukar',
          areaHa: Math.round(area * 0.3),
          historicalLandCover: 'shrubland',
          soilType: 'peat',
          conversionYear: assessmentYear - 10,
        },
        {
          id: 'p-min-1',
          name: 'Afdeling Mineral Hutan Sekunder',
          areaHa: Math.round(area * 0.3),
          historicalLandCover: 'disturbed_forest',
          soilType: 'mineral',
          conversionYear: assessmentYear - 15,
        },
      ]);
    } else if (presetKey === 'replanting') {
      setParcels([
        {
          id: 'p-rep-1',
          name: 'Blok Peremajaan Sawit ke Sawit (Siklus 2)',
          areaHa: area,
          historicalLandCover: 'previous_tree_crop',
          soilType: 'mineral',
          conversionYear: assessmentYear - 4,
        },
      ]);
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER BANNER */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-400 shrink-0 mt-0.5">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  Modul Kalkulator Perubahan Tutupan Lahan
                </span>
                <span className="text-xs text-neutral-300 dark:text-neutral-700">·</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                  Land Use Change (LUC) Engine
                </span>
                <span className="text-xs text-neutral-300 dark:text-neutral-700">·</span>
                <span className="text-[11px] font-mono text-neutral-500">
                  RSPO PalmGHG v5 Subbab 2.2 & LSR v1.1
                </span>
              </div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                Kalkulator Emisi Konversi Lahan & Amortisasi 25 Tahun
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Hitung utang karbon pembukaan lahan otomatis berdasarkan tutupan vegetasi historis (C_before), jenis tanah (mineral vs gambut), dan tahun konversi ke kelapa sawit (C_after = 40 tC/ha).
              </p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSyncToEstate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-all whitespace-nowrap"
              title="Salin hasil perhitungan utang LUC langsung ke parameter kalkulator kebun"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Terapkan ke Kalkulator Kebun</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700"
              title="Unduh rekapitulasi data parcel konversi dalam format CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* NOTIFIKASI SYNC */}
        {syncNotice && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{syncNotice}</span>
            </div>
            <button
              onClick={() => setSyncNotice(null)}
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 font-bold px-2 py-0.5 rounded text-xs"
            >
              Tutup
            </button>
          </div>
        )}

        {/* AGGREGATE KPI SUMMARY METRICS */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Card 1: Annual Scope 1 Amortised */}
          <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50">
            <div className="flex items-center justify-between text-[11px] font-medium text-amber-900 dark:text-amber-300">
              <span>Amortisasi Scope 1 (Thn {assessmentYear})</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-amber-800 dark:text-amber-300">
                {fmt(totals.totalAnnualAmortisedTco2e, 0)}
              </span>
              <span className="text-xs text-neutral-500">tCO₂e/thn</span>
            </div>
            <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">
              Masuk langsung ke Emisi Kebun Scope 1
            </div>
          </div>

          {/* Card 2: Total Gross LUC Debt */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span>Total Utang Bruto LUC</span>
              <Scale className="w-3.5 h-3.5 text-neutral-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {fmt(totals.totalGrossDebtTco2e, 0)}
              </span>
              <span className="text-xs text-neutral-500">tCO₂e</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              Total beban biomassa & kliring awal
            </div>
          </div>

          {/* Card 3: Remaining Debt */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span>Sisa Utang Belum Amortisasi</span>
              <Clock className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400">
                {fmt(totals.totalRemainingDebtTco2e, 0)}
              </span>
              <span className="text-xs text-neutral-500">tCO₂e</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              Teramortisasi: {fmt(totals.totalCumulativeAmortisedTco2e, 0)} tCO₂e
            </div>
          </div>

          {/* Card 4: Total Area Reconciliation */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span>Total Luas Terdata</span>
              <TreePine className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {fmt(totals.totalAreaHa, 0)}
              </span>
              <span className="text-xs text-neutral-500">ha</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1 flex justify-between">
              <span>Mineral: {fmt(totals.totalMineralHa, 0)} ha</span>
              <span>Gambut: {fmt(totals.totalPeatHa, 0)} ha</span>
            </div>
          </div>

          {/* Card 5: Parcel Amortisation Status */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span>Status Amortisasi Parcel</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {totals.activeParcelsCount} Aktif
              </span>
              {totals.expiredParcelsCount > 0 && (
                <span className="text-xs text-neutral-500 font-mono">
                  / {totals.expiredParcelsCount} Lunas
                </span>
              )}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              {totals.expiredParcelsCount > 0 ? 'Parcel >25 thn bebas beban tahunan' : 'Semua parcel dalam jendela 25 thn'}
            </div>
          </div>
        </div>

        {/* PRESET SKENARIO HISTORIS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              Skenario Cepat Konversi Lahan:
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleLoadScenarioPreset('mixed')}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600 shadow-2xs"
            >
              Standar Campuran (Hutan Sekunder & Replanting)
            </button>
            <button
              onClick={() => handleLoadScenarioPreset('low_carbon')}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600 shadow-2xs"
            >
              Semak & Alang-alang Rendah Karbon
            </button>
            <button
              onClick={() => handleLoadScenarioPreset('high_peat')}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs"
            >
              Konversi Gambut Tinggi Emisi
            </button>
            <button
              onClick={() => handleLoadScenarioPreset('replanting')}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs"
            >
              100% Replanting Sawit ke Sawit
            </button>
          </div>
        </div>
      </div>

      {/* MULTI-PARCEL LEDGER TABLE */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
              Daftar Blok & Parcel Konversi Lahan Historis
            </span>
            <span className="text-xs text-neutral-400">·</span>
            <span className="text-[11px] text-neutral-500">
              Input data tutupan vegetasi historis, jenis tanah, dan tahun konversi
            </span>
          </div>

          <button
            onClick={handleAddParcel}
            className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 hover:bg-emerald-200 rounded-lg transition-colors border border-emerald-300 dark:border-emerald-800"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Blok Baru</span>
          </button>
        </div>

        {/* PARCEL TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-400 font-semibold">
                <th className="p-2.5">Nama Blok / Parcel</th>
                <th className="p-2.5 w-24">Luas (ha)</th>
                <th className="p-2.5 w-44">Tutupan Lahan Awal</th>
                <th className="p-2.5 w-28">Jenis Tanah</th>
                <th className="p-2.5 w-24">Tahun Konversi</th>
                <th className="p-2.5 text-right w-28">Stok Karbon ($C_{'{'}before{'}'}$)</th>
                <th className="p-2.5 text-right w-32">Utang Bruto (tCO₂e)</th>
                <th className="p-2.5 text-right w-32 text-amber-700 dark:text-amber-400">Scope 1 / Thn</th>
                <th className="p-2.5 text-center w-28">Status Amortisasi</th>
                <th className="p-2.5 text-center w-12">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {calculatedParcels.map((parcel) => (
                <tr
                  key={parcel.id}
                  className={`hover:bg-neutral-50/70 dark:hover:bg-neutral-800/50 transition-colors ${
                    parcel.isExpired
                      ? 'opacity-70 bg-neutral-50/40 dark:bg-neutral-900/40'
                      : ''
                  }`}
                >
                  {/* Nama Blok */}
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={parcel.name}
                      onChange={(e) => handleUpdateParcel(parcel.id, { name: e.target.value })}
                      className="w-full px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs font-medium focus:ring-1 focus:ring-emerald-600 outline-none"
                    />
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      {parcel.regulatoryStatus}
                    </div>
                  </td>

                  {/* Luas ha */}
                  <td className="p-2.5">
                    <input
                      type="number"
                      min="1"
                      value={parcel.areaHa}
                      onChange={(e) => handleUpdateParcel(parcel.id, { areaHa: Math.max(0, Number(e.target.value)) })}
                      className="w-full px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono text-xs focus:ring-1 focus:ring-emerald-600 outline-none"
                    />
                  </td>

                  {/* Tutupan Lahan Awal */}
                  <td className="p-2.5">
                    <select
                      value={parcel.historicalLandCover}
                      onChange={(e) =>
                        handleUpdateParcel(parcel.id, {
                          historicalLandCover: e.target.value as HistoricalLandCoverType,
                        })
                      }
                      className="w-full px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs font-medium focus:ring-1 focus:ring-emerald-600 outline-none"
                    >
                      <option value="primary_forest">Hutan Primer (250 tC/ha)</option>
                      <option value="disturbed_forest">Hutan Sekunder (150 tC/ha)</option>
                      <option value="shrubland">Semak Belukar (45 tC/ha)</option>
                      <option value="grassland">Padang Rumput (15 tC/ha)</option>
                      <option value="previous_tree_crop">Sawit / Karet Tua (75 tC/ha)</option>
                      <option value="cropland">Pertanian Semusim (10 tC/ha)</option>
                      <option value="bare_land">Lahan Terbuka (2 tC/ha)</option>
                      <option value="custom">Nilai Khusus HCSA...</option>
                    </select>

                    {parcel.historicalLandCover === 'custom' && (
                      <div className="mt-1 flex items-center gap-1 text-[11px]">
                        <span className="text-neutral-500">Stok:</span>
                        <input
                          type="number"
                          value={parcel.customCarbonStockTCPerHa ?? 80}
                          onChange={(e) =>
                            handleUpdateParcel(parcel.id, {
                              customCarbonStockTCPerHa: Number(e.target.value),
                            })
                          }
                          className="w-16 px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 font-mono text-xs"
                        />
                        <span className="text-neutral-500">tC/ha</span>
                      </div>
                    )}
                  </td>

                  {/* Jenis Tanah */}
                  <td className="p-2.5">
                    <select
                      value={parcel.soilType}
                      onChange={(e) => handleUpdateParcel(parcel.id, { soilType: e.target.value as SoilType })}
                      className={`w-full px-2 py-1 rounded border text-xs font-semibold outline-none ${
                        parcel.soilType === 'peat'
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                          : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <option value="mineral">Tanah Mineral</option>
                      <option value="peat">Lahan Gambut (+100 tCO₂e/ha)</option>
                    </select>
                  </td>

                  {/* Tahun Konversi */}
                  <td className="p-2.5">
                    <input
                      type="number"
                      min="1980"
                      max={assessmentYear + 5}
                      value={parcel.conversionYear}
                      onChange={(e) =>
                        handleUpdateParcel(parcel.id, { conversionYear: Number(e.target.value) })
                      }
                      className="w-full px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono text-xs focus:ring-1 focus:ring-emerald-600 outline-none"
                    />
                    <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                      {parcel.elapsedYears} thn lalu
                    </div>
                  </td>

                  {/* Stok Karbon Awal */}
                  <td className="p-2.5 text-right font-mono text-neutral-700 dark:text-neutral-300">
                    <div>{parcel.carbonBeforeTC} tC/ha</div>
                    <div className="text-[10px] text-neutral-400">
                      Sawit: 40 tC/ha
                    </div>
                  </td>

                  {/* Utang Bruto */}
                  <td className="p-2.5 text-right font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                    <div>{fmt(parcel.totalGrossParcelDebtTco2e, 0)} t</div>
                    <div className="text-[10px] text-neutral-400">
                      {fmt(parcel.totalDebtPerHaTco2e, 1)} t/ha
                    </div>
                  </td>

                  {/* Amortisasi Scope 1 Tahunan */}
                  <td className="p-2.5 text-right font-mono font-bold text-amber-700 dark:text-amber-400">
                    {parcel.isExpired ? (
                      <span className="text-neutral-400 font-normal">0 t (Lunas)</span>
                    ) : (
                      <span>{fmt(parcel.annualAmortisedTco2e, 1)} t/thn</span>
                    )}
                    <div className="text-[10px] font-normal text-neutral-400">
                      Sisa: {fmt(parcel.remainingDebtTco2e, 0)} t
                    </div>
                  </td>

                  {/* Status Amortisasi */}
                  <td className="p-2.5 text-center">
                    {parcel.isExpired ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        ✓ Lunas ({'>'}25 Thn)
                      </span>
                    ) : parcel.isActive ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        Thn {parcel.elapsedYears}/25 (Sisa {parcel.remainingYears}y)
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                        Rencana Masa Depan
                      </span>
                    )}
                  </td>

                  {/* Aksi Hapus */}
                  <td className="p-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveParcel(parcel.id)}
                      disabled={parcels.length <= 1}
                      className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      title="Hapus baris blok ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* BOTTOM SYNCHRONIZATION AND SUMMARY BAR */}
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="text-neutral-600 dark:text-neutral-400">
              Total Utang Amortisasi Tahunan yang dihitung:{' '}
              <strong className="text-amber-700 dark:text-amber-400 font-mono text-sm">
                {fmt(totals.totalAnnualAmortisedTco2e, 1)} tCO₂e/thn
              </strong>{' '}
              (Beban Utang Bruto Setara: <strong>{fmt(totals.totalAnnualAmortisedTco2e * AMORTISATION_PERIOD_YEARS, 0)} tCO₂e</strong> selama 25 tahun).
            </span>
          </div>

          <button
            onClick={handleSyncToEstate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-all shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Terapkan ke Parameter Kebun</span>
          </button>
        </div>
      </div>

      {/* METODOLOGI & REGULASI CALLOUT */}
      <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 space-y-3 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
        <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <span>Panduan Metodologi Perhitungan LUC (RSPO PalmGHG V5 Subbab 2.2)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-emerald-100 dark:border-emerald-800/50 space-y-1">
            <h4 className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <span>1. Formula Stok Karbon Biomassa</span>
            </h4>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
              ΔC = (C_before - C_after) × (44 / 12). Nilai C_after untuk kelapa sawit ditetapkan baku sebesar <strong>40 tC/ha</strong> (rata-rata siklus 25 tahun). Jika tutupan asal memiliki stok lebih rendah (seperti alang-alang 15 tC/ha), utang konversi bernilai 0.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-emerald-100 dark:border-emerald-800/50 space-y-1">
            <h4 className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <span>2. Aturan Amortisasi Linier 25 Tahun</span>
            </h4>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
              Emisi konversi diamortisasi secara garis lurus merata selama <strong>25 tahun</strong>. Blok yang dibuka lebih dari 25 tahun sebelum tahun penilaian (misal konversi 1998 dinilai pada 2026 = 28 tahun) dinyatakan <em>lunas (amortised)</em> dengan beban emisi tahunan = 0.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-emerald-100 dark:border-emerald-800/50 space-y-1">
            <h4 className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <span>3. Faktor Kliring Gambut & RSPO RaCP</span>
            </h4>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
              Pembukaan lahan gambut memicu penalti emisi kliring awal sebesar <strong>100 tCO₂e/ha</strong> di luar oksidasi drainase tahunan (54,6 tCO₂e/ha/thn). Konversi pasca-November 2005 tanpa kajian HCV wajib mengikuti prosedur RSPO Remediation and Compensation Procedure (RaCP).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
