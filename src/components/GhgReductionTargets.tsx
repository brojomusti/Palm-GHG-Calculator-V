import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  EstateParameters,
  MillParameters,
  FFBSourceAllocation,
  PalmGHGAssessmentResults,
} from '../types/palmghg';
import {
  Target,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Calendar,
  ArrowRight,
  Sparkles,
  Download,
  RotateCcw,
  Layers,
  Trees,
  Flame,
  Zap,
  Scale,
  Percent,
  Clock,
  ChevronRight,
  Info,
  ShieldCheck,
  Check,
  Flag,
  Award,
} from 'lucide-react';

interface Props {
  estate: EstateParameters;
  mill: MillParameters;
  ffbSources: FFBSourceAllocation[];
  results: PalmGHGAssessmentResults;
  assessmentYear: number;
  onUpdateEstate: (newEstate: EstateParameters) => void;
  onUpdateMill: (newMill: MillParameters) => void;
  onLoadScenario?: (
    estate: EstateParameters,
    mill: MillParameters,
    ffbSources: FFBSourceAllocation[]
  ) => void;
  isDark?: boolean;
}

export type TargetMode = 'reduction_pct' | 'absolute_tco2e' | 'intensity_cpo';

export interface DecarbonizationLever {
  id: string;
  name: string;
  category: 'methane' | 'fertilizer' | 'peat' | 'energy' | 'biomass';
  description: string;
  potentialReductionTco2e: number;
  intensityReductionKgCpo: number;
  capexTier: '$' | '$$' | '$$$';
  timeframe: string;
  enabled: boolean;
  applyAction: (
    currentEstate: EstateParameters,
    currentMill: MillParameters
  ) => { estate: EstateParameters; mill: MillParameters };
}

export const GhgReductionTargets: React.FC<Props> = ({
  estate,
  mill,
  ffbSources,
  results,
  assessmentYear = 2026,
  onUpdateEstate,
  onUpdateMill,
  onLoadScenario,
  isDark = false,
}) => {
  // Target Configuration States
  const [targetMode, setTargetMode] = useState<TargetMode>('reduction_pct');
  const [baselineYear, setBaselineYear] = useState<number>(2020);
  const [targetYear, setTargetYear] = useState<number>(2030);

  // Baseline net emissions (default typical RSPO palm unit baseline ~65,000 tCO2e, or customizable)
  const [baselineEmissionsTco2e, setBaselineEmissionsTco2e] = useState<number>(68500);
  const [baselineIntensityCpo, setBaselineIntensityCpo] = useState<number>(1.48);

  // Target input values
  const [targetReductionPct, setTargetReductionPct] = useState<number>(35.0); // 35% reduction
  const [targetAbsoluteTco2e, setTargetAbsoluteTco2e] = useState<number>(35000); // 35,000 tCO2e/yr
  const [targetIntensityCpo, setTargetIntensityCpo] = useState<number>(0.75); // 0.75 tCO2e/t CPO

  // Active Tab View within Targets Tab
  const [activeSubView, setActiveSubView] = useState<'gap_analysis' | 'trajectory' | 'levers' | 'audit_matrix'>('gap_analysis');
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  // Format Helper
  const fmt = (val: number, decimals: number = 0) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  // Current Assessment Figures
  const currentNetEmissions = Math.max(0, results.totalNetEmissions);
  const currentGrossEmissions = Math.max(0, results.totalGrossEmissions);
  const currentTotalCpoTon = Math.max(1, results.totalCpoProducedTon || 46224);
  const currentIntensityCpo = results.netGhgPerTonCpo || (currentTotalCpoTon > 0 ? currentNetEmissions / currentTotalCpoTon : 0);

  // Compute Target Emission Ceiling depending on active mode
  const targetCeilingTco2e = useMemo(() => {
    if (targetMode === 'reduction_pct') {
      return Math.round(baselineEmissionsTco2e * (1 - targetReductionPct / 100));
    }
    if (targetMode === 'absolute_tco2e') {
      return targetAbsoluteTco2e;
    }
    if (targetMode === 'intensity_cpo') {
      return Math.round(targetIntensityCpo * currentTotalCpoTon);
    }
    return 35000;
  }, [targetMode, baselineEmissionsTco2e, targetReductionPct, targetAbsoluteTco2e, targetIntensityCpo, currentTotalCpoTon]);

  // Derived Target Percentage relative to baseline
  const effectiveReductionPct = useMemo(() => {
    if (baselineEmissionsTco2e <= 0) return 0;
    return ((baselineEmissionsTco2e - targetCeilingTco2e) / baselineEmissionsTco2e) * 100;
  }, [baselineEmissionsTco2e, targetCeilingTco2e]);

  // Emission Gap: Current vs Target Goal
  // positive = gap remaining to be closed (emissions too high)
  // negative = surplus/cushion achieved (emissions already below target)
  const emissionGapTco2e = currentNetEmissions - targetCeilingTco2e;
  const isTargetAchieved = emissionGapTco2e <= 0;
  const absGapTco2e = Math.abs(emissionGapTco2e);

  // Progress Calculation:
  // Baseline (0% progress) -> Target (100% progress)
  const totalRequiredReduction = Math.max(1, baselineEmissionsTco2e - targetCeilingTco2e);
  const achievedReductionSoFar = baselineEmissionsTco2e - currentNetEmissions;
  const progressPercentage = Math.min(
    150,
    Math.max(0, (achievedReductionSoFar / totalRequiredReduction) * 100)
  );

  // Timeline Pace & Required Annual Reduction
  const yearsRemaining = Math.max(1, targetYear - assessmentYear);
  const requiredAnnualReductionRateTco2e = isTargetAchieved
    ? 0
    : Math.round(emissionGapTco2e / yearsRemaining);
  const requiredAnnualReductionRatePct = currentNetEmissions > 0
    ? (requiredAnnualReductionRateTco2e / currentNetEmissions) * 100
    : 0;

  // Preset Industry Decarbonization Targets
  const handleApplyPreset = (preset: 'sbti_flag' | 'rspo_2035' | 'netzero_2045' | 'cpo_premium') => {
    if (preset === 'sbti_flag') {
      setTargetMode('reduction_pct');
      setBaselineYear(2020);
      setTargetYear(2030);
      setTargetReductionPct(30.3); // SBTi FLAG standard 1.5°C 30.3% by 2030
    } else if (preset === 'rspo_2035') {
      setTargetMode('reduction_pct');
      setBaselineYear(2020);
      setTargetYear(2035);
      setTargetReductionPct(50.0); // RSPO 50% decarbonization roadmap by 2035
    } else if (preset === 'netzero_2045') {
      setTargetMode('reduction_pct');
      setBaselineYear(2020);
      setTargetYear(2045);
      setTargetReductionPct(85.0); // Palm Net Zero milestone
    } else if (preset === 'cpo_premium') {
      setTargetMode('intensity_cpo');
      setBaselineYear(2020);
      setTargetYear(2030);
      setTargetIntensityCpo(0.55); // High-demand sustainable buyer threshold
    }
  };

  // Interactive Decarbonization Levers to Simulate Closing the Gap
  const [levers, setLevers] = useState<DecarbonizationLever[]>([
    {
      id: 'lever-biogas',
      name: 'POME Biogas Methane Capture & Gas Engine (70% Allocation)',
      category: 'methane',
      description:
        'Tangkap gas metana dari kolam anaerobik POME dengan efisiensi 90% dan manfaatkan untuk turbin/mesin gas serta flaring tertutup.',
      potentialReductionTco2e: 18500,
      intensityReductionKgCpo: 400,
      capexTier: '$$$',
      timeframe: '12 – 18 bulan',
      enabled: mill.treatmentAllocationMethaneCapturePercent >= 50,
      applyAction: (est, m) => ({
        estate: est,
        mill: {
          ...m,
          treatmentAllocationMethaneCapturePercent: 75,
          treatmentAllocationOpenLagoonPercent: 15,
          treatmentAllocationCompostPercent: 10,
          biogasMethaneContentPercent: 60,
          methaneCaptureEfficiencyPercent: 92,
          methaneGasEngineUtilizationPercent: 60,
          methaneBoilerUtilizationPercent: 20,
          methaneEnclosedFlaringPercent: 20,
          methaneOpenFlaringPercent: 0,
          excessElectricityExportGridKwh: 3500000,
        },
      }),
    },
    {
      id: 'lever-ni-ui',
      name: 'Konversi 100% Pupuk Nitrogen ke NI/UI Inhibitor',
      category: 'fertilizer',
      description:
        'Ganti seluruh urea standar dengan pupuk yang diperkaya Nitrification & Urease Inhibitors untuk menurunkan emisi langsung N₂O sebesar 35%.',
      potentialReductionTco2e: 2850,
      intensityReductionKgCpo: 62,
      capexTier: '$',
      timeframe: 'Segera (< 3 bulan)',
      enabled: estate.syntheticNInhibitedKg > 0 && estate.syntheticNStandardKg === 0,
      applyAction: (est, m) => {
        const totalN = (est.syntheticNStandardKg || 0) + (est.syntheticNInhibitedKg || 0);
        return {
          estate: {
            ...est,
            syntheticNStandardKg: 0,
            syntheticNInhibitedKg: totalN > 0 ? totalN : Math.round(est.totalPlantedAreaHa * 95),
          },
          mill: m,
        };
      },
    },
    {
      id: 'lever-peat-water',
      name: 'Tata Air Gambut BMP (Muka Air Saluran 60 cm)',
      category: 'peat',
      description:
        'Terapkan zonasi sekat kanal (canal blocking) untuk menjaga muka air saluran gambut rata-rata pada kedalaman 60 cm (BMP RSPO).',
      potentialReductionTco2e: 6800,
      intensityReductionKgCpo: 147,
      capexTier: '$$',
      timeframe: '6 – 12 bulan',
      enabled: estate.peatDrainageDepthCm === 60,
      applyAction: (est, m) => ({
        estate: {
          ...est,
          peatDrainageDepthCm: 60,
        },
        mill: m,
      }),
    },
    {
      id: 'lever-compost',
      name: 'Sinergi POME & Kompos Tandan Kosong (EFB Mulch)',
      category: 'biomass',
      description:
        'Alihkan 30% volume POME dan tandan kosong kelapa sawit ke composting aerobik untuk mensubstitusi pupuk sintetis di piringan sawit.',
      potentialReductionTco2e: 3900,
      intensityReductionKgCpo: 84,
      capexTier: '$$',
      timeframe: '6 bulan',
      enabled: mill.treatmentAllocationCompostPercent >= 20,
      applyAction: (est, m) => ({
        estate: {
          ...est,
          compostLandApplicationTon: Math.round(est.totalPlantedAreaHa * 4.5),
          pomeLandApplicationM3: Math.round(est.totalPlantedAreaHa * 2.2),
        },
        mill: {
          ...m,
          treatmentAllocationCompostPercent: 25,
          treatmentAllocationOpenLagoonPercent: Math.max(0, 100 - (m.treatmentAllocationMethaneCapturePercent || 0) - 25),
        },
      }),
    },
    {
      id: 'lever-diesel',
      name: 'Elektrifikasi & B35 Biodiesel Penuh Mesin Lapangan',
      category: 'energy',
      description:
        'Tingkatkan mandatori campuran biodiesel B35/B40 dan efisiensi konsumsi solar kendaraan angkut TBS dan genset stasioner.',
      potentialReductionTco2e: 1650,
      intensityReductionKgCpo: 36,
      capexTier: '$',
      timeframe: 'Segera (< 3 bulan)',
      enabled: estate.biodieselBlendPercent >= 35,
      applyAction: (est, m) => ({
        estate: {
          ...est,
          biodieselBlendPercent: 35,
          mobileFuelDieselLiters: Math.round((est.mobileFuelDieselLiters || 450000) * 0.88),
          stationaryFuelDieselLiters: Math.round((est.stationaryFuelDieselLiters || 150000) * 0.82),
        },
        mill: m,
      }),
    },
    {
      id: 'lever-conservation',
      name: 'Ekspansi Konservasi Gambut & Koridor HCV (LSR v1.1)',
      category: 'peat',
      description:
        'Tingkatkan area konservasi gambut dan tutupan riparian hutan bernilai konservasi tinggi untuk memaksimalkan kredit serapan karbon biogenik.',
      potentialReductionTco2e: 9500,
      intensityReductionKgCpo: 205,
      capexTier: '$$',
      timeframe: '12 – 24 bulan',
      enabled: (estate.peatlandConservationAreaHa || 0) >= 1500,
      applyAction: (est, m) => ({
        estate: {
          ...est,
          peatlandConservationAreaHa: Math.max(est.peatlandConservationAreaHa || 0, 1600),
          forestConservationAreaHa: Math.max(est.forestConservationAreaHa || 0, 950),
          nonForestConservationAreaHa: Math.max(est.nonForestConservationAreaHa || 0, 450),
        },
        mill: m,
      }),
    },
  ]);

  const toggleLever = (id: string) => {
    setLevers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  // Compute Total Potential Abatement from Enabled Levers
  const totalEnabledAbatementTco2e = useMemo(() => {
    return levers
      .filter((l) => l.enabled)
      .reduce((acc, curr) => acc + curr.potentialReductionTco2e, 0);
  }, [levers]);

  // Projected Net Emissions after applying all enabled levers
  const projectedNetEmissionsTco2e = Math.max(0, currentNetEmissions - totalEnabledAbatementTco2e);
  const projectedGapTco2e = projectedNetEmissionsTco2e - targetCeilingTco2e;
  const isProjectedTargetMet = projectedGapTco2e <= 0;

  // Apply selected levers to live estate & mill states
  const handleApplySelectedLevers = () => {
    let currentEstate = JSON.parse(JSON.stringify(estate));
    let currentMill = JSON.parse(JSON.stringify(mill));

    levers.forEach((lever) => {
      if (lever.enabled) {
        const updated = lever.applyAction(currentEstate, currentMill);
        currentEstate = updated.estate;
        currentMill = updated.mill;
      }
    });

    onUpdateEstate(currentEstate);
    onUpdateMill(currentMill);

    setAppliedNotice(
      `Sukses menerapkan ${levers.filter((l) => l.enabled).length} aksi dekarbonisasi ke kalkulator! Estimasi reduksi: ${fmt(totalEnabledAbatementTco2e)} tCO₂e/thn.`
    );
    setTimeout(() => setAppliedNotice(null), 8000);
  };

  // Trajectory Dataset for Recharts ComposedChart
  const trajectoryData = useMemo(() => {
    const data: Array<{
      year: number;
      label: string;
      baselineRef: number;
      targetTrajectory: number;
      bauEmissions: number;
      projectedWithLevers: number;
      actualEmissions?: number;
    }> = [];

    // Years range from baseline (e.g. 2020) to 2040/2050
    const startYr = Math.min(baselineYear, 2020);
    const endYr = Math.max(targetYear + 5, 2040);

    for (let yr = startYr; yr <= endYr; yr++) {
      // Linear glidepath from baseline to target year, then continuing towards net zero
      let targetPath = baselineEmissionsTco2e;
      if (yr <= targetYear) {
        const factor = (yr - baselineYear) / Math.max(1, targetYear - baselineYear);
        targetPath = baselineEmissionsTco2e - factor * (baselineEmissionsTco2e - targetCeilingTco2e);
      } else {
        // Post target year trajectory towards 80% reduction by 2045
        const postFactor = (yr - targetYear) / Math.max(1, 2045 - targetYear);
        const residual = targetCeilingTco2e * 0.15;
        targetPath = Math.max(residual, targetCeilingTco2e - postFactor * (targetCeilingTco2e - residual));
      }

      // BAU: slight growth (+0.5%/yr) if no interventions
      const bau = Math.round(
        yr < assessmentYear
          ? baselineEmissionsTco2e - ((baselineEmissionsTco2e - currentNetEmissions) / (assessmentYear - baselineYear)) * (yr - baselineYear)
          : currentNetEmissions * Math.pow(1.004, yr - assessmentYear)
      );

      // Projected with planned interventions
      let proj = bau;
      if (yr >= assessmentYear) {
        const rampUpFactor = Math.min(1, (yr - assessmentYear + 1) / 3);
        const reductionApplied = totalEnabledAbatementTco2e * rampUpFactor;
        proj = Math.max(0, bau - reductionApplied);
      }

      const item: any = {
        year: yr,
        label: yr.toString(),
        baselineRef: baselineEmissionsTco2e,
        targetTrajectory: Math.round(Math.max(0, targetPath)),
        bauEmissions: Math.round(bau),
        projectedWithLevers: Math.round(proj),
      };

      if (yr === baselineYear) {
        item.actualEmissions = baselineEmissionsTco2e;
      } else if (yr === assessmentYear) {
        item.actualEmissions = Math.round(currentNetEmissions);
      }

      data.push(item);
    }

    return data;
  }, [baselineYear, targetYear, baselineEmissionsTco2e, targetCeilingTco2e, assessmentYear, currentNetEmissions, totalEnabledAbatementTco2e]);

  // Export Target Strategy Summary to CSV
  const handleExportCsv = () => {
    const headers = [
      'Indikator Sasaran Dekarbonisasi',
      'Nilai Parameter',
      'Satuan',
      'Status Regulasi / Acuan',
    ];

    const rows = [
      ['Tahun Baseline', baselineYear, 'Tahun', 'Acuan ACOP RSPO'],
      ['Emisi Netto Baseline', baselineEmissionsTco2e, 'tCO2e/thn', 'Kalkulasi PalmGHG Terverifikasi'],
      ['Intensitas Baseline CPO', baselineIntensityCpo, 'tCO2e/t CPO', 'Garis Pangkal Produk'],
      ['Tahun Target', targetYear, 'Tahun', 'Target Perusahaan / SBTi FLAG'],
      ['Target Reduksi Persentase', `${targetReductionPct.toFixed(1)}%`, '% dari Baseline', 'Target RSPO 2030/2035'],
      ['Plafon Emisi Target (Ceiling)', targetCeilingTco2e, 'tCO2e/thn', 'Target Batas Maksimum'],
      ['Tahun Asesmen Saat Ini', assessmentYear, 'Tahun', 'Inventarisasi Berjalan'],
      ['Emisi Netto Saat Ini', Math.round(currentNetEmissions), 'tCO2e/thn', 'Hasil Kalkulasi PalmGHG V5'],
      ['Intensitas CPO Saat Ini', currentIntensityCpo.toFixed(2), 'tCO2e/t CPO', 'Kinerja Terkini'],
      ['Kesenjangan Emisi (Gap)', Math.round(emissionGapTco2e), 'tCO2e/thn', isTargetAchieved ? 'Surplus / Target Terlampaui' : 'Defisit Emisi yang Harus Ditutup'],
      ['Progres Capaian Target', `${progressPercentage.toFixed(1)}%`, '% Tercapai', isTargetAchieved ? 'On Track' : 'Memerlukan Intervensi'],
      ['Sisa Waktu Menuju Target', yearsRemaining, 'Tahun', 'Jendela Eksekusi'],
      ['Laju Reduksi Tahunan yang Diperlukan', requiredAnnualReductionRateTco2e, 'tCO2e/thn', 'Kecepatan Dekarbonisasi Minimal'],
      ['Total Potensi Abatement dari 6 Aksi', totalEnabledAbatementTco2e, 'tCO2e/thn', 'Simulasi Intervensi Terpilih'],
      ['Proyeksi Emisi Pasca Intervensi', Math.round(projectedNetEmissionsTco2e), 'tCO2e/thn', isProjectedTargetMet ? 'Target Berhasil Dipenuhi' : 'Masih Ada Sisa Kesenjangan'],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RSPO_GHG_Reduction_Targets_Gap_Analysis_${assessmentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* HEADER HERO BANNER */}
      <div className="p-5 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-2xl text-white shadow-md border border-emerald-800/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                P&C RSPO 2024 · Indikator 7.6.1 & 7.6.2
              </span>
              <span className="text-xs text-emerald-300">·</span>
              <span className="text-xs text-emerald-200 font-mono">
                SBTi FLAG 1.5°C Aligned
              </span>
              <span className="text-xs text-emerald-300">·</span>
              <span className="text-xs text-emerald-200">
                Tahun Asesmen: <strong>{assessmentYear}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/60 border border-emerald-400/40 flex items-center justify-center text-white shrink-0 shadow-inner">
                <Target className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Target & Kesenjangan Dekarbonisasi (GHG Reduction Goals)
                </h1>
                <p className="text-xs text-emerald-100 max-w-3xl leading-relaxed mt-0.5">
                  Tetapkan target pengurangan emisi tahunan berbasis persentase (%), plafon absolut (tCO₂e/thn), atau intensitas CPO. Pantau kesenjangan (emission gap) terhadap proyeksi emisi dan simulasikan intervensi mitigasi untuk menutup kesenjangan secara terukur.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleApplySelectedLevers}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all whitespace-nowrap border border-emerald-400/40"
              title="Terapkan parameter aksi mitigasi yang dicentang langsung ke kalkulator kebun & PKS"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Terapkan Aksi Mitigasi ke Kalkulator</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-100 bg-emerald-900/80 hover:bg-emerald-800 transition-colors border border-emerald-700/60 whitespace-nowrap"
              title="Ekspor rekap target dan analisis kesenjangan ke CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* SYNC NOTIFICATION TOAST */}
      {appliedNotice && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in duration-200">
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

      {/* TARGET DEFINITION CONTROL PANEL */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Konfigurasi Parameter Target Pengurangan Emisi
            </h2>
          </div>

          {/* Target Mode Toggle Switcher */}
          <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setTargetMode('reduction_pct')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                targetMode === 'reduction_pct'
                  ? 'bg-white dark:bg-neutral-700 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Persentase (%)</span>
            </button>

            <button
              onClick={() => setTargetMode('absolute_tco2e')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                targetMode === 'absolute_tco2e'
                  ? 'bg-white dark:bg-neutral-700 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Plafon Absolut (tCO₂e)</span>
            </button>

            <button
              onClick={() => setTargetMode('intensity_cpo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                targetMode === 'intensity_cpo'
                  ? 'bg-white dark:bg-neutral-700 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Intensitas CPO (tCO₂e/t)</span>
            </button>
          </div>
        </div>

        {/* PRESET SHORTCUTS STRIP */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-neutral-500 whitespace-nowrap flex items-center gap-1">
            <Flag className="w-3 h-3 text-emerald-600" />
            Preset Standar Industri:
          </span>

          <button
            onClick={() => handleApplyPreset('sbti_flag')}
            className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 font-semibold border border-emerald-200 dark:border-emerald-800/60 whitespace-nowrap transition-colors"
          >
            SBTi FLAG 1.5°C (-30.3% pada 2030)
          </button>

          <button
            onClick={() => handleApplyPreset('rspo_2035')}
            className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 hover:bg-blue-100 font-semibold border border-blue-200 dark:border-blue-800/60 whitespace-nowrap transition-colors"
          >
            Roadmap RSPO 2035 (-50% Net)
          </button>

          <button
            onClick={() => handleApplyPreset('netzero_2045')}
            className="px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 hover:bg-purple-100 font-semibold border border-purple-200 dark:border-purple-800/60 whitespace-nowrap transition-colors"
          >
            Palm Net-Zero 2045 (-85%)
          </button>

          <button
            onClick={() => handleApplyPreset('cpo_premium')}
            className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 font-semibold border border-amber-200 dark:border-amber-800/60 whitespace-nowrap transition-colors"
          >
            Pasar Premium EU (≤ 0.55 tCO₂e/t CPO)
          </button>
        </div>

        {/* INPUT FORM CONTROLS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Baseline Year & Baseline Emissions */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-1.5">
            <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block">
              Tahun Garis Pangkal (Baseline Year)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={baselineYear}
                onChange={(e) => setBaselineYear(Number(e.target.value) || 2020)}
                className="w-20 px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono text-neutral-900 dark:text-neutral-100 font-bold"
              />
              <span className="text-[11px] text-neutral-500">Tahun referensi</span>
            </div>
            <div className="pt-1">
              <span className="text-[10px] text-neutral-500 block">Emisi Netto Baseline:</span>
              <input
                type="number"
                value={baselineEmissionsTco2e}
                onChange={(e) => setBaselineEmissionsTco2e(Number(e.target.value) || 0)}
                className="w-full mt-0.5 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono text-neutral-900 dark:text-neutral-100 font-bold"
              />
              <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">tCO₂e / tahun</span>
            </div>
          </div>

          {/* Target Year */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-1.5">
            <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block">
              Tahun Target Capaian (Target Year)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={targetYear}
                onChange={(e) => setTargetYear(Number(e.target.value) || 2030)}
                className="w-24 px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono text-neutral-900 dark:text-neutral-100 font-bold text-emerald-600 dark:text-emerald-400"
              />
              <span className="text-[11px] text-neutral-500 font-semibold">
                ({yearsRemaining} tahun lagi)
              </span>
            </div>
            <div className="pt-2 text-[11px] text-neutral-500">
              <span>Tahun asesmen berjalan: </span>
              <strong className="text-neutral-800 dark:text-neutral-200 font-mono">{assessmentYear}</strong>
            </div>
          </div>

          {/* Target Value Input (Dynamic based on Mode) */}
          <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800/50 space-y-1.5">
            <label className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 block">
              {targetMode === 'reduction_pct'
                ? 'Target Pengurangan Emisi (%)'
                : targetMode === 'absolute_tco2e'
                ? 'Target Plafon Emisi (tCO₂e/thn)'
                : 'Target Intensitas Produk CPO'}
            </label>

            {targetMode === 'reduction_pct' && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={targetReductionPct}
                    onChange={(e) => setTargetReductionPct(Number(e.target.value) || 0)}
                    className="w-24 px-2.5 py-1 rounded-md border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-neutral-800 font-mono text-emerald-700 dark:text-emerald-300 font-extrabold text-sm"
                  />
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">% reduksi</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={targetReductionPct}
                  onChange={(e) => setTargetReductionPct(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
            )}

            {targetMode === 'absolute_tco2e' && (
              <div className="space-y-1">
                <input
                  type="number"
                  value={targetAbsoluteTco2e}
                  onChange={(e) => setTargetAbsoluteTco2e(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1 rounded-md border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-neutral-800 font-mono text-emerald-700 dark:text-emerald-300 font-extrabold text-sm"
                />
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block font-mono">
                  Setara reduksi {effectiveReductionPct.toFixed(1)}% vs baseline
                </span>
              </div>
            )}

            {targetMode === 'intensity_cpo' && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    value={targetIntensityCpo}
                    onChange={(e) => setTargetIntensityCpo(Number(e.target.value) || 0)}
                    className="w-24 px-2.5 py-1 rounded-md border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-neutral-800 font-mono text-emerald-700 dark:text-emerald-300 font-extrabold text-sm"
                  />
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">tCO₂e / t CPO</span>
                </div>
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block font-mono">
                  Baseline: {baselineIntensityCpo} · Terkini: {currentIntensityCpo.toFixed(2)}
                </span>
              </div>
            )}

            <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold pt-1 border-t border-emerald-200/50 dark:border-emerald-800/40">
              Plafon Target: <span className="font-mono font-bold">{fmt(targetCeilingTco2e)}</span> tCO₂e
            </div>
          </div>

          {/* Current Performance Snapshot */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-1">
            <span className="text-[11px] font-semibold text-neutral-500 block">Kondisi Emisi Saat Ini ({assessmentYear})</span>
            <div className="text-lg font-black font-mono text-neutral-900 dark:text-neutral-100">
              {fmt(currentNetEmissions)} <span className="text-xs font-normal text-neutral-500">tCO₂e</span>
            </div>
            <div className="text-[11px] text-neutral-500 font-mono">
              Intensitas: <strong>{currentIntensityCpo.toFixed(2)}</strong> tCO₂e/t CPO
            </div>
            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="text-neutral-500">Reduksi dari 2020:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                -{(( (baselineEmissionsTco2e - currentNetEmissions) / baselineEmissionsTco2e ) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CORE GAP ANALYSIS & PROGRESS BAR DASHBOARD CARD */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Visualisasi Kesenjangan Emisi (Emission Gap Tracker)
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isTargetAchieved
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                    : progressPercentage >= 60
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300'
                }`}
              >
                {isTargetAchieved ? '✓ Target Tercapai / On Track' : progressPercentage >= 60 ? '⚡ Dalam Jangkauan' : '⚠ Perlu Akselerasi Mitigasi'}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100 mt-0.5">
              Progres Capaian Target Reduksi Menuju Tahun {targetYear}
            </h3>
          </div>

          {/* Quick Stats Highlights */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-neutral-500 block">Kesenjangan Emisi (Gap):</span>
              <span
                className={`text-lg font-black font-mono ${
                  isTargetAchieved
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isTargetAchieved ? '-' : '+'}{fmt(absGapTco2e)} <span className="text-xs font-normal">tCO₂e/thn</span>
              </span>
            </div>
          </div>
        </div>

        {/* PROMINENT VISUAL PROGRESS BAR WITH MILESTONES */}
        <div className="space-y-2.5 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span>Progres Reduksi Kumulatif:</span>
              <strong className="text-emerald-700 dark:text-emerald-400 text-sm font-mono font-black">
                {progressPercentage.toFixed(1)}%
              </strong>
              <span className="text-[11px] text-neutral-500">
                ({fmt(achievedReductionSoFar)} tCO₂e dari target {fmt(totalRequiredReduction)} tCO₂e)
              </span>
            </div>

            <div className="text-right font-mono text-[11px]">
              {isTargetAchieved ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Surplus aman {fmt(absGapTco2e)} tCO₂e di bawah plafon
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  Sisa kesenjangan: {fmt(emissionGapTco2e)} tCO₂e/thn
                </span>
              )}
            </div>
          </div>

          {/* Multi-segmented visual progress bar */}
          <div className="relative h-6 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden shadow-inner flex">
            {/* Achieved reduction portion */}
            <div
              style={{ width: `${Math.min(100, progressPercentage)}%` }}
              className={`h-full transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-bold text-white shadow-xs ${
                isTargetAchieved ? 'bg-emerald-600' : 'bg-emerald-500'
              }`}
            >
              {progressPercentage >= 15 && `${progressPercentage.toFixed(0)}%`}
            </div>

            {/* Remaining gap portion */}
            {!isTargetAchieved && (
              <div
                style={{ width: `${Math.max(0, 100 - progressPercentage)}%` }}
                className="h-full bg-gradient-to-r from-amber-400 to-rose-400 dark:from-amber-600 dark:to-rose-600 transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-neutral-900 dark:text-white"
              >
                Gap: {((1 - progressPercentage / 100) * 100).toFixed(0)}%
              </div>
            )}
          </div>

          {/* Milestone markers strip below progress bar */}
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-1">
            <div>
              <span className="font-bold text-neutral-700 dark:text-neutral-300">Baseline ({baselineYear})</span>
              <div className="text-[10px]">{fmt(baselineEmissionsTco2e)} tCO₂e</div>
            </div>

            <div className="text-center">
              <span className="font-bold text-neutral-800 dark:text-neutral-200">Kondisi {assessmentYear}</span>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                {fmt(currentNetEmissions)} tCO₂e
              </div>
            </div>

            <div className="text-right">
              <span className="font-bold text-emerald-700 dark:text-emerald-300">Target Goal ({targetYear})</span>
              <div className="text-[10px] font-bold">{fmt(targetCeilingTco2e)} tCO₂e</div>
            </div>
          </div>
        </div>

        {/* 4 DETAILED KPI SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Plafon Target */}
          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/70 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between text-neutral-500 text-[11px] mb-1">
              <span>Plafon Emisi Target</span>
              <Target className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-black font-mono text-neutral-900 dark:text-neutral-100">
              {fmt(targetCeilingTco2e)} <span className="text-xs font-normal text-neutral-500">tCO₂e</span>
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
              -{effectiveReductionPct.toFixed(1)}% vs baseline 2020
            </div>
          </div>

          {/* Card 2: Status Kesenjangan */}
          <div
            className={`p-3.5 rounded-xl border ${
              isTargetAchieved
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className={isTargetAchieved ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}>
                Kesenjangan ke Target (Gap)
              </span>
              {isTargetAchieved ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              )}
            </div>
            <div
              className={`text-xl font-black font-mono ${
                isTargetAchieved ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
              }`}
            >
              {isTargetAchieved ? '0' : fmt(emissionGapTco2e)}{' '}
              <span className="text-xs font-normal">tCO₂e/thn</span>
            </div>
            <div className="text-[11px] mt-1 font-semibold">
              {isTargetAchieved ? (
                <span className="text-emerald-700 dark:text-emerald-400">Target telah terpenuhi</span>
              ) : (
                <span className="text-rose-700 dark:text-rose-400">Harus dipangkas sebelum {targetYear}</span>
              )}
            </div>
          </div>

          {/* Card 3: Kecepatan Reduksi yang Dibutuhkan */}
          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/70 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between text-neutral-500 text-[11px] mb-1">
              <span>Kecepatan Tahunan Diperlukan</span>
              <Clock className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-xl font-black font-mono text-neutral-900 dark:text-neutral-100">
              {isTargetAchieved ? '0' : fmt(requiredAnnualReductionRateTco2e)}{' '}
              <span className="text-xs font-normal text-neutral-500">tCO₂e/thn</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {isTargetAchieved ? (
                <span className="text-emerald-600 font-semibold">Pertahankan kinerja</span>
              ) : (
                <span>~{requiredAnnualReductionRatePct.toFixed(1)}%/tahun selama {yearsRemaining} tahun</span>
              )}
            </div>
          </div>

          {/* Card 4: Potensi Intervensi Mitigasi */}
          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/70 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between text-neutral-500 text-[11px] mb-1">
              <span>Potensi Aksi Mitigasi Terpilih</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xl font-black font-mono text-amber-700 dark:text-amber-400">
              {fmt(totalEnabledAbatementTco2e)} <span className="text-xs font-normal text-neutral-500">tCO₂e</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {isProjectedTargetMet ? (
                <span className="text-emerald-600 font-bold">Cukup untuk menutup gap!</span>
              ) : (
                <span className="text-amber-600 font-semibold">Sisa gap: {fmt(projectedGapTco2e)} tCO₂e</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SUB-VIEW NAVIGATION (TRAJECTORY VS LEVERS VS AUDIT MATRIX) */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveSubView('gap_analysis')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors whitespace-nowrap ${
            activeSubView === 'gap_analysis'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-bold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-600" />
          <span>Rincian Gap per Scope & Area</span>
        </button>

        <button
          onClick={() => setActiveSubView('trajectory')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors whitespace-nowrap ${
            activeSubView === 'trajectory'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-bold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5 text-blue-600" />
          <span>Kurva Trajektori Penurunan Emisi ({baselineYear} – {Math.max(targetYear + 5, 2040)})</span>
        </button>

        <button
          onClick={() => setActiveSubView('levers')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors whitespace-nowrap ${
            activeSubView === 'levers'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-bold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-amber-600" />
          <span>Simulasi Aksi Dekarbonisasi ({levers.filter((l) => l.enabled).length}/{levers.length} Aktif)</span>
        </button>

        <button
          onClick={() => setActiveSubView('audit_matrix')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors whitespace-nowrap ${
            activeSubView === 'audit_matrix'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-bold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Matriks Kepatuhan Audit RSPO & SBTi</span>
        </button>
      </div>

      {/* VIEW 1: DETAILED GAP BREAKDOWN PER SCOPE & SOURCE */}
      {activeSubView === 'gap_analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Scope 1 Plantation Breakdown */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Trees className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Scope 1 Operasional Kebun (Plantation Operations)
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
                {fmt(results.totalEstateScope1 || 0)} tCO₂e
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                <span>Oksidasi Lahan Gambut (Drainage):</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                  {fmt(results.estateScope1Peat || 0)} tCO₂e
                </span>
              </div>
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, ((results.estateScope1Peat || 0) / Math.max(1, results.totalEstateScope1 || 1)) * 100)}%`,
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400 pt-1">
                <span>Aplikasi Pupuk Kimia N₂O (Direct & Indirect):</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                  {fmt(results.estateScope1FertiliserApp || 0)} tCO₂e
                </span>
              </div>
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, ((results.estateScope1FertiliserApp || 0) / Math.max(1, results.totalEstateScope1 || 1)) * 100)}%`,
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400 pt-1">
                <span>Bahan Bakar Lapangan (Solar & B35):</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                  {fmt((results.estateScope1FuelMobile || 0) + (results.estateScope1FuelStationary || 0))} tCO₂e
                </span>
              </div>
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-neutral-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (((results.estateScope1FuelMobile || 0) + (results.estateScope1FuelStationary || 0)) / Math.max(1, results.totalEstateScope1 || 1)) * 100)}%`,
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400 pt-1">
                <span>Amortisasi Konversi Lahan (LUC Debt):</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                  {fmt(results.estateScope1LucAmortised || 0)} tCO₂e
                </span>
              </div>
            </div>
          </div>

          {/* Scope 1 Mill & Scope 3 Upstream */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-600" />
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Scope 1 Pabrik PKS & Scope 3 Rantai Pasok
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
                {fmt((results.totalMillScope1 || 0) + (results.totalScope3 || 0))} tCO₂e
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                <span>Metana Kolam POME Terbuka:</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                  {fmt((results.millScope1PomeLagoon || 0) + (results.millScope1PomeMethaneUncombusted || 0))} tCO₂e
                </span>
              </div>
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (((results.millScope1PomeLagoon || 0) + (results.millScope1PomeMethaneUncombusted || 0)) / Math.max(1, results.totalMillScope1 || 1)) * 100)}%`,
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400 pt-1">
                <span>Scope 3 Pasokan TBS Pihak Ketiga:</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                  {fmt(results.millScope3Cat1PurchasedFfb || 0)} tCO₂e
                </span>
              </div>
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, ((results.millScope3Cat1PurchasedFfb || 0) / Math.max(1, results.totalScope3 || 1)) * 100)}%`,
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400 pt-1">
                <span>Kredit Serapan Karbon Konservasi (LSR v1.1):</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  -{fmt(results.totalCarbonRemovals || 0)} tCO₂e
                </span>
              </div>

              <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400 pt-1">
                <span>Kredit Penghindaran Ekspor Listrik/Biomassa:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  -{fmt(results.totalEmissionsAvoided || 0)} tCO₂e
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: TRAJECTORY & DECARBONIZATION GLIDEPATH (RECHARTS) */}
      {activeSubView === 'trajectory' && (
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Kurva Trajektori Penurunan Emisi: Garis Pangkal vs Target vs Proyeksi Intervensi
              </h4>
              <p className="text-[11px] text-neutral-500">
                Memvisualisasikan trajektori linear menuju target {targetYear} dibandingkan proyeksi Tanpa Aksi (BAU) dan Skenario Intervensi Terpilih.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                Target Trajectory
              </span>
              <span className="flex items-center gap-1 text-rose-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                BAU Projection
              </span>
              <span className="flex items-center gap-1 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                Projected (With Levers)
              </span>
            </div>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trajectoryData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={isDark ? 0.2 : 0.4} />
                <XAxis
                  dataKey="year"
                  stroke={isDark ? '#a3a3a3' : '#525252'}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke={isDark ? '#a3a3a3' : '#525252'}
                  fontSize={11}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 bg-neutral-900/95 dark:bg-neutral-800/95 text-white rounded-lg shadow-xl border border-neutral-700 text-xs space-y-1">
                          <div className="font-bold border-b border-neutral-700 pb-1">
                            Tahun {label}
                          </div>
                          {payload.map((entry: any, index: number) => (
                            <div key={`entry-${index}`} className="flex justify-between gap-4 font-mono">
                              <span style={{ color: entry.color }}>{entry.name}:</span>
                              <span className="font-bold">{fmt(entry.value)} tCO₂e</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />

                {/* Target Ceiling Reference Line */}
                <ReferenceLine
                  y={targetCeilingTco2e}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{
                    value: `Plafon Target: ${fmt(targetCeilingTco2e)} t`,
                    position: 'insideTopLeft',
                    fill: '#10b981',
                    fontSize: 10,
                  }}
                />

                {/* Target Year Vertical Reference */}
                <ReferenceLine
                  x={targetYear}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  label={{
                    value: `Target ${targetYear}`,
                    position: 'insideTopRight',
                    fill: '#10b981',
                    fontSize: 10,
                  }}
                />

                {/* Current Assessment Year Vertical Reference */}
                <ReferenceLine
                  x={assessmentYear}
                  stroke="#3b82f6"
                  strokeDasharray="2 2"
                  label={{
                    value: `Terkini (${assessmentYear})`,
                    position: 'insideBottomLeft',
                    fill: '#3b82f6',
                    fontSize: 10,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="bauEmissions"
                  name="Tanpa Aksi (BAU)"
                  fill="#f43f5e"
                  fillOpacity={0.08}
                  stroke="#f43f5e"
                  strokeWidth={2}
                />

                <Area
                  type="monotone"
                  dataKey="projectedWithLevers"
                  name="Proyeksi Intervensi"
                  fill="#3b82f6"
                  fillOpacity={0.15}
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                />

                <Line
                  type="monotone"
                  dataKey="targetTrajectory"
                  name="Trajektori Sasaran (Target)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                />

                <Line
                  type="monotone"
                  dataKey="actualEmissions"
                  name="Kondisi Faktual"
                  stroke="#059669"
                  strokeWidth={4}
                  dot={{ r: 6, fill: '#059669' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIEW 3: INTERACTIVE DECARBONIZATION LEVERS SIMULATION */}
      {activeSubView === 'levers' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Pilih & Simulasikan Aksi Mitigasi untuk Menutup Gap ({fmt(totalEnabledAbatementTco2e)} tCO₂e Terpilih)
              </h4>
              <p className="text-[11px] text-neutral-500">
                Centang intervensi operasional berikut untuk melihat dampaknya terhadap sisa kesenjangan target secara real-time.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleApplySelectedLevers}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-colors whitespace-nowrap"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Terapkan ke Kalkulator</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {levers.map((lever) => (
              <div
                key={lever.id}
                onClick={() => toggleLever(lever.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  lever.enabled
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-xs ring-1 ring-emerald-500/20'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 opacity-75 hover:opacity-100 hover:border-neutral-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          lever.enabled
                            ? 'bg-emerald-600 text-white'
                            : 'border border-neutral-300 dark:border-neutral-600 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <h5 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                        {lever.name}
                      </h5>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                      Biaya: {lever.capexTier}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 pl-7 leading-relaxed">
                    {lever.description}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between pl-7 text-[11px]">
                  <span className="text-neutral-500">Waktu: {lever.timeframe}</span>
                  <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    -{fmt(lever.potentialReductionTco2e)} tCO₂e/thn
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: AUDIT COMPLIANCE MATRIX (RSPO P&C & SBTI FLAG) */}
      {activeSubView === 'audit_matrix' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Kesesuaian dengan Standar Regulasi & Audit Sertifikasi
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg space-y-2">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 block">
                RSPO P&C 2024 Indikator 7.6.1 (K) & 7.6.2 (K)
              </span>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-[11px]">
                Unit Pengelolaan (MU) wajib memiliki rencana mitigasi emisi GRK yang terdokumentasi dengan target terukur, dilaporkan setiap tahun melalui PalmGHG, dan ditinjau secara berkala untuk mengevaluasi efektivitas intervensi.
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-emerald-600 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Memenuhi prasyarat pelaporan inventarisasi dan target pengurangan bertahap.</span>
              </div>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg space-y-2">
              <span className="font-bold text-blue-700 dark:text-blue-400 block">
                Science Based Targets initiative (SBTi) FLAG Guidance
              </span>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-[11px]">
                Mengharuskan perusahaan komoditas kelapa sawit menetapkan target emisi sektor lahan terpisah dari emisi industri/energi, dengan batas minimum reduksi tahunan ~3.03%/tahun menuju nol deforestasi dan pengelolaan gambut berkelanjutan.
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-blue-600 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Selaras dengan jalur dekarbonisasi 1.5°C untuk komoditas berbasis lahan.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
