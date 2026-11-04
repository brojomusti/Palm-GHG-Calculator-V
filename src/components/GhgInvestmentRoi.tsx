import React, { useState, useMemo } from 'react';
import {
  PalmGHGAssessmentResults,
  EstateParameters,
  MillParameters,
} from '../types/palmghg';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  Flame,
  Sprout,
  Droplets,
  Sun,
  ShieldCheck,
  BarChart3,
  Sliders,
  RotateCcw,
  Info,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Award,
  Clock,
  Landmark,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

interface Props {
  results: PalmGHGAssessmentResults;
  estate: EstateParameters;
  mill: MillParameters;
  isDark?: boolean;
}

export type ProjectArchetypeKey =
  | 'biogas_chp'
  | 'biogas_flare'
  | 'fertiliser_opt'
  | 'peat_rewetting'
  | 'solar_microgrid'
  | 'custom';

export interface ProjectArchetype {
  id: ProjectArchetypeKey;
  nameEn: string;
  nameId: string;
  badge: string;
  icon: string;
  descriptionEn: string;
  descriptionId: string;
  defaultCapex: number;
  defaultOpex: number;
  defaultSavings: number;
  defaultLifespan: number;
  baseAbatementRatio: (results: PalmGHGAssessmentResults, estate: EstateParameters, mill: MillParameters) => number;
  abatementRationaleEn: string;
  abatementRationaleId: string;
}

export interface CarbonMarketPreset {
  id: string;
  name: string;
  priceUsd: number;
  registry: string;
  descriptionEn: string;
  descriptionId: string;
}

export const CARBON_MARKET_PRESETS: CarbonMarketPreset[] = [
  {
    id: 'idx_carbon',
    name: 'IDXCarbon SPE-GRK (Indonesia Domestic)',
    priceUsd: 3.8,
    registry: 'SRN-PPI / IDXCarbon',
    descriptionEn: 'Indonesian national carbon registry traded units (Sertifikat Pengurangan Emisi Gas Rumah Kaca). Standard forestry & energy floor pricing.',
    descriptionId: 'Unit karbon terdaftar nasional Indonesia (Sertifikat Pengurangan Emisi GRK - SPE-GRK). Harga acuan pasar domestik.',
  },
  {
    id: 'verra_vcs',
    name: 'Verra VCS / VM0042 (Methane & Ag)',
    priceUsd: 8.5,
    registry: 'Verra Verified Carbon Standard',
    descriptionEn: 'Leading global voluntary market benchmark for agricultural waste management and anaerobic lagoon methane capture credits.',
    descriptionId: 'Tolok ukur pasar sukarela global terdepan untuk proyek penangkapan metana kolam limbah POME dan efisiensi pertanian.',
  },
  {
    id: 'gold_standard',
    name: 'Gold Standard / SDG Premium',
    priceUsd: 14.0,
    registry: 'Gold Standard for Global Goals',
    descriptionEn: 'High-integrity credits incorporating biodiversity co-benefits, rural electrification, and local community SDG outcomes.',
    descriptionId: 'Kredit integritas tinggi dengan sertifikasi manfaat tambahan keanekaragaman hayati dan pencapaian SDG masyarakat sekitar.',
  },
  {
    id: 'article6_corsia',
    name: 'Article 6.2 / CORSIA Aviation Compliance',
    priceUsd: 22.5,
    registry: 'UNFCCC / ICAO CORSIA',
    descriptionEn: 'Internationally Transferred Mitigation Outcomes (ITMOs) and airline CORSIA compliance-eligible units with Corresponding Adjustments.',
    descriptionId: 'Unit mitigasi internasional terverifikasi (ITMOs) dengan Corresponding Adjustment untuk kepatuhan penerbangan internasional CORSIA.',
  },
];

export const PROJECT_ARCHETYPES: ProjectArchetype[] = [
  {
    id: 'biogas_chp',
    nameEn: 'Biogas Capture & 1.5 MW Gas Engine Power Gen',
    nameId: 'Penangkapan Biogas & Pembangkit Listrik Gas Engine 1.5 MW',
    badge: 'Highest Net Value',
    icon: 'zap',
    descriptionEn: 'Covered anaerobic lagoon system with H2S biological scrubber and gas engine gensets to displace mill diesel and export surplus power to the grid.',
    descriptionId: 'Sistem penutup kolam anaerobik dengan scrubber H2S dan genset gas engine untuk menggantikan diesel pabrik dan mengekspor listrik ke grid PLN.',
    defaultCapex: 2850000,
    defaultOpex: 125000,
    defaultSavings: 480000, // Diesel + grid power displacement
    defaultLifespan: 15,
    baseAbatementRatio: (results) => {
      // Abate 82% of uncaptured mill POME lagoon methane
      const pomeMethane = results.millScope1PomeLagoon || 24000;
      return Math.round(pomeMethane * 0.82);
    },
    abatementRationaleEn: 'Abates ~82% of open lagoon POME fugitive methane while displacing fossil fuel electricity.',
    abatementRationaleId: 'Mereduksi ~82% metana kolam POME terbuka sekaligus menggantikan konsumsi listrik berbasis bahan bakar fosil.',
  },
  {
    id: 'biogas_flare',
    nameEn: 'Biogas Covered Lagoon with High-Temp Enclosed Flare',
    nameId: 'Penutup Kolam Biogas dengan Enclosed Flare Suhu Tinggi',
    badge: 'Fastest Payback',
    icon: 'flame',
    descriptionEn: 'Cap the existing POME lagoons and install a 99.5% destruction efficiency enclosed flare. Pure carbon credit yield with minimal mechanical complexity.',
    descriptionId: 'Menutup kolam limbah POME yang ada dan memasang enclosed flare efisiensi 99.5%. Menghasilkan kredit karbon dengan biaya mekanikal minimal.',
    defaultCapex: 780000,
    defaultOpex: 38000,
    defaultSavings: 0, // No power generation, pure credit play
    defaultLifespan: 12,
    baseAbatementRatio: (results) => {
      const pomeMethane = results.millScope1PomeLagoon || 24000;
      return Math.round(pomeMethane * 0.85);
    },
    abatementRationaleEn: 'Direct thermal destruction of biogenic CH4 with 99.5% combustion efficiency.',
    abatementRationaleId: 'Pembakaran termal langsung gas CH4 biogenik dengan efisiensi destruksi 99.5%.',
  },
  {
    id: 'fertiliser_opt',
    nameEn: 'Precision Fertiliser & Inhibitor / Composting BMP',
    nameId: 'Pemupukan Presisi & Inhibitor Nitrifikasi / Pengomposan',
    badge: 'Direct Opex Savings',
    icon: 'sprout',
    descriptionEn: 'Adoption of variable-rate GPS spreaders, urease/nitrification inhibitors (NI/UI), and co-composting of empty fruit bunches (EFB) to replace synthetic N by 28%.',
    descriptionId: 'Penerapan alat sebar GPS presisi, inhibitor urease/nitrifikasi, dan pengomposan TKS untuk mengurangi 28% pembelian pupuk N anorganik.',
    defaultCapex: 420000,
    defaultOpex: 42000,
    defaultSavings: 185000, // Synthetic fertilizer purchase cost savings
    defaultLifespan: 10,
    baseAbatementRatio: (results) => {
      // Abates ~32% of synthetic fertilizer emissions (Scope 1 + Scope 3 mfg)
      const fertN2o = (results.estateScope1FertiliserApp || 8000) + (results.estateScope3Cat1FertiliserMfg || 4000);
      return Math.round(fertN2o * 0.32);
    },
    abatementRationaleEn: 'Eliminates 28% of synthetic urea purchases, directly curtailing direct N2O soil fluxes and upstream ammonia synthesis.',
    abatementRationaleId: 'Mengurangi 28% pembelian urea sintetis, memangkas emisi N2O tanah dan proses sintesis amonia hulu.',
  },
  {
    id: 'peat_rewetting',
    nameEn: 'Peatland Water-Table Rewetting & Canal Spillways',
    nameId: 'Pembasahan Lahan Gambut & Pengendalian Pintu Air Saluran',
    badge: 'Ecosystem Integrity',
    icon: 'droplets',
    descriptionEn: 'Installation of automated cascade control weirs and piezometers to raise the dry-season water table from -70cm to -40cm across cultivated peat blocks.',
    descriptionId: 'Pemasangan sekat kanal bertingkat otomatis dan piezometer untuk menaikkan muka air tanah gambut dari -70cm ke -40cm sesuai RSPO BMP.',
    defaultCapex: 520000,
    defaultOpex: 58000,
    defaultSavings: 25000, // Reduced fire mitigation/insurance costs
    defaultLifespan: 15,
    baseAbatementRatio: (results, estate) => {
      // Raising water table avoids ~18.2 tCO2e/ha/yr on drained peat
      const peatHa = estate?.peatSoilAreaHa || 1200;
      return Math.round(peatHa * 18.2);
    },
    abatementRationaleEn: 'Halts heterotrophic microbial oxidation of deep tropical peat soils and prevents catastrophic peat fire risks.',
    abatementRationaleId: 'Menghentikan oksidasi mikroba heterotrofik pada tanah gambut tropis dan mencegah risiko kebakaran gambut.',
  },
  {
    id: 'solar_microgrid',
    nameEn: 'Estate Rooftop Solar PV & BESS Microgrid',
    nameId: 'Solar PV Atap & Sistem Baterai (BESS) Perumahan/PKS',
    badge: 'Clean Energy',
    icon: 'sun',
    descriptionEn: '650 kWp rooftop solar PV on mill workshops and estate housing with 450 kWh lithium battery storage to shut down night-time auxiliary diesel generators.',
    descriptionId: '650 kWp PLTS atap bengkel pabrik dan perumahan kebun dilengkapi 450 kWh baterai lithium untuk mematikan genset diesel malam hari.',
    defaultCapex: 690000,
    defaultOpex: 16000,
    defaultSavings: 155000, // Diesel fuel avoided
    defaultLifespan: 20,
    baseAbatementRatio: (results) => {
      // Displaces stationary diesel combustion
      const dieselScope1 = (results.estateScope1FuelStationary || 600) + (results.millScope1FuelStationary || 450);
      return Math.round(dieselScope1 * 0.75) + 380;
    },
    abatementRationaleEn: 'Displaces 165,000 liters of diesel fuel annually used for off-grid estate illumination and backup pumps.',
    abatementRationaleId: 'Menggantikan 165.000 liter bahan bakar solar per tahun yang digunakan untuk penerangan dan pompa mandiri kebun.',
  },
  {
    id: 'custom',
    nameEn: 'Custom Emission Reduction Project',
    nameId: 'Proyek Pengurangan Emisi Kustom',
    badge: 'User Defined',
    icon: 'sliders',
    descriptionEn: 'Specify custom capital expenditure, annual operational expenditures, operational savings, and verified GHG abatement parameters.',
    descriptionId: 'Tentukan modal awal (Capex), biaya operasional tahunan (Opex), penghematan biaya, dan volume reduksi GRK secara fleksibel.',
    defaultCapex: 1000000,
    defaultOpex: 50000,
    defaultSavings: 120000,
    defaultLifespan: 15,
    baseAbatementRatio: () => 10000,
    abatementRationaleEn: 'User-configured emission abatement profile.',
    abatementRationaleId: 'Profil penurunan emisi yang dikonfigurasi pengguna.',
  },
];

// Helper: Calculate IRR using numerical bisection
export function calculateIrr(cashFlows: number[]): number | null {
  // Cash flows: [ -Capex, CF1, CF2, ..., CFn ]
  if (cashFlows.length < 2) return null;

  // Check if all cash flows after year 0 are non-positive
  const positiveFlows = cashFlows.slice(1).some((cf) => cf > 0);
  if (!positiveFlows) return null;

  // Check sum of cash flows
  const totalNominal = cashFlows.reduce((a, b) => a + b, 0);
  if (totalNominal < 0) {
    // Check if there is still a negative IRR
  }

  const npvAtRate = (rate: number): number => {
    let npv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
    }
    return npv;
  };

  let low = -0.9;
  let high = 5.0; // 500%
  let npvLow = npvAtRate(low);
  let npvHigh = npvAtRate(high);

  if (npvLow * npvHigh > 0) {
    // If not bracketing, try higher upper bound up to 20.0
    high = 20.0;
    npvHigh = npvAtRate(high);
    if (npvLow * npvHigh > 0) {
      // Test if pure negative return
      if (totalNominal <= 0) return null;
      return null;
    }
  }

  // Bisection algorithm (max 100 iterations)
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const npvMid = npvAtRate(mid);

    if (Math.abs(npvMid) < 1e-4 || (high - low) / 2 < 1e-5) {
      return mid * 100; // Return in percentage (e.g. 18.5)
    }

    if (npvLow * npvMid < 0) {
      high = mid;
      npvHigh = npvMid;
    } else {
      low = mid;
      npvLow = npvMid;
    }
  }

  return ((low + high) / 2) * 100;
}

export const GhgInvestmentRoi: React.FC<Props> = ({
  results,
  estate,
  mill,
  isDark = false,
}) => {
  const [lang, setLang] = useState<'en' | 'id'>('en');
  const [selectedArchetypeKey, setSelectedArchetypeKey] = useState<ProjectArchetypeKey>('biogas_chp');
  const [selectedMarketPresetId, setSelectedMarketPresetId] = useState<string>('verra_vcs');

  // Active archetype
  const activeArchetype = useMemo(() => {
    return PROJECT_ARCHETYPES.find((p) => p.id === selectedArchetypeKey) || PROJECT_ARCHETYPES[0];
  }, [selectedArchetypeKey]);

  // Initial values derived from archetype and current mill/estate results
  const defaultAbatement = useMemo(() => {
    return activeArchetype.baseAbatementRatio(results, estate, mill);
  }, [activeArchetype, results, estate, mill]);

  // Interactive state variables
  const [capexUsd, setCapexUsd] = useState<number>(activeArchetype.defaultCapex);
  const [opexUsd, setOpexUsd] = useState<number>(activeArchetype.defaultOpex);
  const [savingsUsd, setSavingsUsd] = useState<number>(activeArchetype.defaultSavings);
  const [annualAbatementTco2e, setAnnualAbatementTco2e] = useState<number>(defaultAbatement);
  const [carbonPriceUsd, setCarbonPriceUsd] = useState<number>(8.5);
  const [discountRatePercent, setDiscountRatePercent] = useState<number>(8.5);
  const [projectLifespanYears, setProjectLifespanYears] = useState<number>(activeArchetype.defaultLifespan);
  const [carbonPriceEscalationPercent, setCarbonPriceEscalationPercent] = useState<number>(2.5);
  const [registryIssuanceDeductionPercent, setRegistryIssuanceDeductionPercent] = useState<number>(8.0); // Registry fees + buffer pool

  // When changing project archetype, reset parameters cleanly
  const handleSelectArchetype = (archetypeKey: ProjectArchetypeKey) => {
    setSelectedArchetypeKey(archetypeKey);
    const arch = PROJECT_ARCHETYPES.find((p) => p.id === archetypeKey) || PROJECT_ARCHETYPES[0];
    setCapexUsd(arch.defaultCapex);
    setOpexUsd(arch.defaultOpex);
    setSavingsUsd(arch.defaultSavings);
    setProjectLifespanYears(arch.defaultLifespan);
    const calculatedAbatement = arch.baseAbatementRatio(results, estate, mill);
    setAnnualAbatementTco2e(calculatedAbatement);
  };

  // When picking a market preset
  const handleSelectMarketPreset = (presetId: string) => {
    setSelectedMarketPresetId(presetId);
    const preset = CARBON_MARKET_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setCarbonPriceUsd(preset.priceUsd);
    }
  };

  // Financial Engine Computations
  const financialModel = useMemo(() => {
    const lifespan = Math.max(5, Math.min(25, projectLifespanYears));
    const r = discountRatePercent / 100;
    const escalation = carbonPriceEscalationPercent / 100;
    const netCreditShare = (100 - registryIssuanceDeductionPercent) / 100;

    // Cash flows array: index 0 is Year 0 (-Capex)
    const nominalCashFlows: number[] = [-capexUsd];
    const discountedCashFlows: number[] = [-capexUsd];
    const cumulativeNominal: number[] = [-capexUsd];
    const cumulativeDiscounted: number[] = [-capexUsd];

    interface YearBreakdown {
      year: number;
      carbonRevenue: number;
      costSavings: number;
      totalInflow: number;
      opex: number;
      netCashFlow: number;
      discountedNetCashFlow: number;
      cumulativeCashFlow: number;
      cumulativeDiscountedCashFlow: number;
      effectiveCarbonPrice: number;
    }

    const yearDetails: YearBreakdown[] = [
      {
        year: 0,
        carbonRevenue: 0,
        costSavings: 0,
        totalInflow: 0,
        opex: 0,
        netCashFlow: -capexUsd,
        discountedNetCashFlow: -capexUsd,
        cumulativeCashFlow: -capexUsd,
        cumulativeDiscountedCashFlow: -capexUsd,
        effectiveCarbonPrice: carbonPriceUsd,
      },
    ];

    let cumNom = -capexUsd;
    let cumDisc = -capexUsd;

    let simplePaybackYears: number | null = null;
    let discountedPaybackYears: number | null = null;

    let totalDiscountedAbatement = 0;
    let totalDiscountedNetCosts = capexUsd; // Capex + PV(Opex - Savings)

    for (let t = 1; t <= lifespan; t++) {
      const priceT = carbonPriceUsd * Math.pow(1 + escalation, t - 1);
      const carbonRevT = annualAbatementTco2e * netCreditShare * priceT;
      const savingsT = savingsUsd; // could add inflation if needed
      const opexT = opexUsd;

      const netCFT = carbonRevT + savingsT - opexT;
      const discountFactor = Math.pow(1 + r, t);
      const discCFT = netCFT / discountFactor;

      const prevCumNom = cumNom;
      const prevCumDisc = cumDisc;

      cumNom += netCFT;
      cumDisc += discCFT;

      nominalCashFlows.push(netCFT);
      discountedCashFlows.push(discCFT);
      cumulativeNominal.push(cumNom);
      cumulativeDiscounted.push(cumDisc);

      // Check simple payback interpolation
      if (simplePaybackYears === null && cumNom >= 0) {
        if (prevCumNom < 0 && netCFT > 0) {
          const fraction = -prevCumNom / netCFT;
          simplePaybackYears = Number(((t - 1) + fraction).toFixed(2));
        } else {
          simplePaybackYears = t;
        }
      }

      // Check discounted payback interpolation
      if (discountedPaybackYears === null && cumDisc >= 0) {
        if (prevCumDisc < 0 && discCFT > 0) {
          const fraction = -prevCumDisc / discCFT;
          discountedPaybackYears = Number(((t - 1) + fraction).toFixed(2));
        } else {
          discountedPaybackYears = t;
        }
      }

      // Marginal Abatement Cost metrics
      totalDiscountedAbatement += annualAbatementTco2e / discountFactor;
      totalDiscountedNetCosts += (opexT - savingsT) / discountFactor;

      yearDetails.push({
        year: t,
        carbonRevenue: Math.round(carbonRevT),
        costSavings: Math.round(savingsT),
        totalInflow: Math.round(carbonRevT + savingsT),
        opex: Math.round(opexT),
        netCashFlow: Math.round(netCFT),
        discountedNetCashFlow: Math.round(discCFT),
        cumulativeCashFlow: Math.round(cumNom),
        cumulativeDiscountedCashFlow: Math.round(cumDisc),
        effectiveCarbonPrice: Number(priceT.toFixed(2)),
      });
    }

    // 10-Year or Full Lifespan NPV
    const npv = cumDisc;

    // IRR calculation
    const irr = calculateIrr(nominalCashFlows);

    // Marginal Abatement Cost (LCOA in $/tCO2e avoided)
    const macUsdPerTco2e =
      totalDiscountedAbatement > 0 ? totalDiscountedNetCosts / totalDiscountedAbatement : 0;

    // Benefit-Cost Ratio (BCR)
    let pvInflows = 0;
    let pvCosts = capexUsd;
    for (let t = 1; t <= lifespan; t++) {
      const discountFactor = Math.pow(1 + r, t);
      const priceT = carbonPriceUsd * Math.pow(1 + escalation, t - 1);
      const revT = annualAbatementTco2e * netCreditShare * priceT + savingsUsd;
      pvInflows += revT / discountFactor;
      pvCosts += opexUsd / discountFactor;
    }
    const benefitCostRatio = pvCosts > 0 ? pvInflows / pvCosts : 0;

    // Total lifetime CO2e abated
    const totalLifetimeTco2e = annualAbatementTco2e * lifespan;

    // Total gross carbon credit revenue
    const totalLifetimeCarbonRevenue = yearDetails
      .slice(1)
      .reduce((acc, y) => acc + y.carbonRevenue, 0);

    // Total lifetime savings
    const totalLifetimeSavings = yearDetails
      .slice(1)
      .reduce((acc, y) => acc + y.costSavings, 0);

    return {
      nominalCashFlows,
      discountedCashFlows,
      cumulativeNominal,
      cumulativeDiscounted,
      yearDetails,
      npv: Math.round(npv),
      irr: irr !== null ? Number(irr.toFixed(1)) : null,
      simplePaybackYears,
      discountedPaybackYears,
      macUsdPerTco2e: Number(macUsdPerTco2e.toFixed(2)),
      benefitCostRatio: Number(benefitCostRatio.toFixed(2)),
      totalLifetimeTco2e,
      totalLifetimeCarbonRevenue,
      totalLifetimeSavings,
      annualNetOcfYear1: yearDetails[1] ? yearDetails[1].netCashFlow : 0,
    };
  }, [
    capexUsd,
    opexUsd,
    savingsUsd,
    annualAbatementTco2e,
    carbonPriceUsd,
    discountRatePercent,
    projectLifespanYears,
    carbonPriceEscalationPercent,
    registryIssuanceDeductionPercent,
  ]);

  // Sensitivity Matrix: Carbon Price ($2, $5, $8.5, $15, $25) vs Capex (-20%, -10%, Base, +10%, +20%)
  const sensitivityMatrix = useMemo(() => {
    const priceScenarios = [3.0, 5.0, 8.5, 14.0, 22.5];
    const capexMultipliers = [0.8, 0.9, 1.0, 1.1, 1.2];
    const r = discountRatePercent / 100;
    const escalation = carbonPriceEscalationPercent / 100;
    const netCreditShare = (100 - registryIssuanceDeductionPercent) / 100;
    const lifespan = projectLifespanYears;

    return capexMultipliers.map((capexMult) => {
      const scenarioCapex = capexUsd * capexMult;
      const row = priceScenarios.map((pPrice) => {
        const cfs = [-scenarioCapex];
        let cumDisc = -scenarioCapex;
        let dPayback: number | null = null;

        for (let t = 1; t <= lifespan; t++) {
          const priceT = pPrice * Math.pow(1 + escalation, t - 1);
          const cfT = annualAbatementTco2e * netCreditShare * priceT + savingsUsd - opexUsd;
          const discT = cfT / Math.pow(1 + r, t);
          const prevCumDisc = cumDisc;
          cumDisc += discT;
          cfs.push(cfT);

          if (dPayback === null && cumDisc >= 0) {
            if (prevCumDisc < 0 && discT > 0) {
              dPayback = Number(((t - 1) + (-prevCumDisc / discT)).toFixed(1));
            } else {
              dPayback = t;
            }
          }
        }

        const scenIrr = calculateIrr(cfs);
        return {
          price: pPrice,
          irr: scenIrr !== null ? Number(scenIrr.toFixed(1)) : null,
          npv: Math.round(cumDisc),
          discountedPayback: dPayback,
        };
      });

      return {
        capexMultiplier: capexMult,
        capexAmount: scenarioCapex,
        columns: row,
      };
    });
  }, [
    capexUsd,
    opexUsd,
    savingsUsd,
    annualAbatementTco2e,
    discountRatePercent,
    carbonPriceEscalationPercent,
    registryIssuanceDeductionPercent,
    projectLifespanYears,
  ]);

  // Multi-Project Archetype Ranking Summary
  const archetypeComparisons = useMemo(() => {
    const r = discountRatePercent / 100;
    const netCreditShare = (100 - registryIssuanceDeductionPercent) / 100;

    return PROJECT_ARCHETYPES.filter((p) => p.id !== 'custom').map((arch) => {
      const c = arch.defaultCapex;
      const op = arch.defaultOpex;
      const sav = arch.defaultSavings;
      const life = arch.defaultLifespan;
      const abated = arch.baseAbatementRatio(results, estate, mill);

      const cfs = [-c];
      let cumDisc = -c;
      let dPayback: number | null = null;
      let totalDiscAbate = 0;
      let totalDiscNetCost = c;

      for (let t = 1; t <= life; t++) {
        const pT = carbonPriceUsd * Math.pow(1 + 0.025, t - 1);
        const cfT = abated * netCreditShare * pT + sav - op;
        const discT = cfT / Math.pow(1 + r, t);
        const prev = cumDisc;
        cumDisc += discT;
        cfs.push(cfT);

        if (dPayback === null && cumDisc >= 0) {
          dPayback = Number(((t - 1) + (-prev / discT)).toFixed(1));
        }

        totalDiscAbate += abated / Math.pow(1 + r, t);
        totalDiscNetCost += (op - sav) / Math.pow(1 + r, t);
      }

      const irr = calculateIrr(cfs);
      const mac = totalDiscAbate > 0 ? totalDiscNetCost / totalDiscAbate : 0;

      return {
        id: arch.id,
        name: lang === 'en' ? arch.nameEn : arch.nameId,
        badge: arch.badge,
        capex: c,
        abatement: abated,
        irr: irr !== null ? Number(irr.toFixed(1)) : null,
        npv: Math.round(cumDisc),
        payback: dPayback,
        mac: Number(mac.toFixed(2)),
      };
    });
  }, [results, estate, mill, carbonPriceUsd, discountRatePercent, registryIssuanceDeductionPercent, lang]);

  // Helpers
  const fmtUsd = (val: number) => {
    return '$' + val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const fmtNum = (val: number, dec: number = 0) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    {lang === 'en'
                      ? 'GHG Investment ROI & Carbon Abatement Economics'
                      : 'ROI Investasi GRK & Keekonomian Penurunan Emisi'}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    IRR & Payback
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {lang === 'en'
                    ? 'Evaluates Internal Rate of Return (IRR), discounted payback periods, and Marginal Abatement Cost (MAC) for palm oil decarbonization projects against active carbon market pricing.'
                    : 'Evaluasi Tingkat Pengembalian Internal (IRR), periode pengembalian modal terdiskon, dan Biaya Penurunan Emisi Marginal (MAC) berbasis harga pasar kredit karbon.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            {/* Language Toggle */}
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  lang === 'en'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('id')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  lang === 'id'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                ID
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleSelectArchetype(selectedArchetypeKey)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              title="Reset parameters to archetype defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Reset Defaults' : 'Reset Nilai'}</span>
            </button>
          </div>
        </div>

        {/* PROJECT ARCHETYPE SELECTOR BUTTONS */}
        <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2.5 flex items-center justify-between">
            <span>{lang === 'en' ? 'Select Decarbonization Project Archetype' : 'Pilih Arketipe Proyek Dekarbonisasi'}</span>
            <span className="text-[11px] normal-case text-neutral-400">
              {lang === 'en' ? 'Parameters link directly to your estate & mill emission baseline' : 'Parameter terhubung otomatis dengan baseline emisi kebun & pabrik'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {PROJECT_ARCHETYPES.map((arch) => {
              const isSelected = selectedArchetypeKey === arch.id;
              return (
                <button
                  key={arch.id}
                  type="button"
                  onClick={() => handleSelectArchetype(arch.id)}
                  className={`text-left p-3 rounded-xl border transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                      : 'bg-white dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {arch.icon === 'zap' && <Zap className="w-4 h-4 text-amber-500" />}
                        {arch.icon === 'flame' && <Flame className="w-4 h-4 text-orange-500" />}
                        {arch.icon === 'sprout' && <Sprout className="w-4 h-4 text-emerald-500" />}
                        {arch.icon === 'droplets' && <Droplets className="w-4 h-4 text-blue-500" />}
                        {arch.icon === 'sun' && <Sun className="w-4 h-4 text-yellow-500" />}
                        {arch.icon === 'sliders' && <Sliders className="w-4 h-4 text-purple-500" />}
                        <span className="line-clamp-1">{lang === 'en' ? arch.nameEn : arch.nameId}</span>
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 shrink-0">
                        {arch.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {lang === 'en' ? arch.descriptionEn : arch.descriptionId}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-neutral-500">{lang === 'en' ? 'Capex:' : 'Modal:'} {fmtUsd(arch.defaultCapex)}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      ~{fmtNum(arch.baseAbatementRatio(results, estate, mill))} tCO₂e/yr
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TOP 5 EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* CARD 1: IRR */}
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="font-semibold uppercase tracking-wider">
                {lang === 'en' ? 'Internal Rate of Return' : 'Tingkat Pengembalian (IRR)'}
              </span>
              <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              {financialModel.irr !== null ? (
                <>
                  <span
                    className={`text-2xl font-bold font-mono ${
                      financialModel.irr >= 15
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : financialModel.irr >= discountRatePercent
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {financialModel.irr}%
                  </span>
                  <span className="text-xs text-neutral-500">p.a.</span>
                </>
              ) : (
                <span className="text-base font-bold font-mono text-neutral-400">
                  {lang === 'en' ? 'Non-remunerative' : 'Tidak Menguntungkan'}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-500 flex items-center justify-between font-mono">
            <span>Hurdle: {discountRatePercent}%</span>
            <span
              className={
                financialModel.irr !== null && financialModel.irr >= discountRatePercent
                  ? 'text-emerald-600 font-bold'
                  : 'text-amber-600 font-bold'
              }
            >
              {financialModel.irr !== null && financialModel.irr >= discountRatePercent
                ? 'Pass Hurdle'
                : 'Below Hurdle'}
            </span>
          </div>
        </div>

        {/* CARD 2: DISCOUNTED PAYBACK */}
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="font-semibold uppercase tracking-wider">
                {lang === 'en' ? 'Discounted Payback' : 'Pengembalian Modal (DPB)'}
              </span>
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              {financialModel.discountedPaybackYears !== null ? (
                <>
                  <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                    {financialModel.discountedPaybackYears}
                  </span>
                  <span className="text-xs text-neutral-500">{lang === 'en' ? 'Years' : 'Tahun'}</span>
                </>
              ) : (
                <span className="text-sm font-bold text-amber-600">
                  &gt; {projectLifespanYears} {lang === 'en' ? 'Years' : 'Thn'}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-500 flex items-center justify-between font-mono">
            <span>{lang === 'en' ? 'Simple PB:' : 'PB Sederhana:'}</span>
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              {financialModel.simplePaybackYears !== null ? `${financialModel.simplePaybackYears} yrs` : 'N/A'}
            </span>
          </div>
        </div>

        {/* CARD 3: 10/15-YR NPV */}
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="font-semibold uppercase tracking-wider">
                {lang === 'en' ? `NPV (${projectLifespanYears}-Yr)` : `Nilai Sekarang (NPV)`}
              </span>
              <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-bold font-mono ${
                  financialModel.npv >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {fmtUsd(financialModel.npv)}
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-500 flex items-center justify-between font-mono">
            <span>Benefit/Cost Ratio:</span>
            <span className="font-bold text-neutral-800 dark:text-neutral-200">
              {financialModel.benefitCostRatio}x
            </span>
          </div>
        </div>

        {/* CARD 4: COST OF ABATEMENT (MAC) */}
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="font-semibold uppercase tracking-wider">
                {lang === 'en' ? 'Abatement Cost (MAC)' : 'Biaya Reduksi (MAC)'}
              </span>
              <TrendingDown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-bold font-mono ${
                  financialModel.macUsdPerTco2e <= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : financialModel.macUsdPerTco2e <= carbonPriceUsd
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {financialModel.macUsdPerTco2e <= 0 ? '-' : ''}${Math.abs(financialModel.macUsdPerTco2e)}
              </span>
              <span className="text-xs text-neutral-500">/tCO₂e</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-500 flex items-center justify-between font-mono">
            <span>Carbon Price:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">${carbonPriceUsd}/t</span>
          </div>
        </div>

        {/* CARD 5: ANNUAL GHG ABATEMENT */}
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="font-semibold uppercase tracking-wider">
                {lang === 'en' ? 'Annual Abatement' : 'Reduksi Tahunan'}
              </span>
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {fmtNum(annualAbatementTco2e)}
              </span>
              <span className="text-xs text-neutral-500">tCO₂e/yr</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-500 flex items-center justify-between font-mono">
            <span>Lifetime ({projectLifespanYears}y):</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {fmtNum(financialModel.totalLifetimeTco2e)} t
            </span>
          </div>
        </div>
      </div>

      {/* INTERACTIVE CONTROLS GRID: CARBON MARKET & PROJECT FINANCIAL TUNING */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: CARBON MARKET PRESETS & PRICING (4 COLS) */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {lang === 'en' ? 'Carbon Market Pricing Benchmark' : 'Tolok Ukur Harga Pasar Karbon'}
              </h4>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              ${carbonPriceUsd.toFixed(2)} / tCO₂e
            </span>
          </div>

          {/* Market Presets */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              {lang === 'en' ? 'Active Regulatory & Voluntary Standards' : 'Standar Pasar Sukarela & Regulasi'}
            </span>
            <div className="grid grid-cols-1 gap-2">
              {CARBON_MARKET_PRESETS.map((preset) => {
                const isPresetActive = selectedMarketPresetId === preset.id && carbonPriceUsd === preset.priceUsd;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectMarketPreset(preset.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                      isPresetActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/30'
                        : 'bg-neutral-50/50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 hover:border-emerald-400'
                    }`}
                  >
                    <div className="pr-2">
                      <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                        {lang === 'en' ? preset.descriptionEn : preset.descriptionId}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        ${preset.priceUsd.toFixed(2)}
                      </div>
                      <div className="text-[9px] text-neutral-400 uppercase tracking-tight">tCO₂e</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Carbon Price Slider */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-neutral-700 dark:text-neutral-300">
                {lang === 'en' ? 'Custom Carbon Price ($/tCO₂e)' : 'Kustom Harga Karbon ($/tCO₂e)'}
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                ${carbonPriceUsd.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="0.5"
              value={carbonPriceUsd}
              onChange={(e) => {
                setCarbonPriceUsd(Number(e.target.value));
                setSelectedMarketPresetId('custom');
              }}
              className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
              <span>$0.00 (No Credits)</span>
              <span>$15.00</span>
              <span>$50.00 / t</span>
            </div>
          </div>

          {/* Registry Fees and Price Escalator */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-neutral-600 dark:text-neutral-400 text-[11px]">
                  {lang === 'en' ? 'Annual Price Rise' : 'Eskalasi Harga'}
                </span>
                <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                  {carbonPriceEscalationPercent}%/yr
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={carbonPriceEscalationPercent}
                onChange={(e) => setCarbonPriceEscalationPercent(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-neutral-600 dark:text-neutral-400 text-[11px]">
                  {lang === 'en' ? 'Registry Buffer Pool' : 'Potongan Buffer/VVB'}
                </span>
                <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                  {registryIssuanceDeductionPercent}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={registryIssuanceDeductionPercent}
                onChange={(e) => setRegistryIssuanceDeductionPercent(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
              />
            </div>
          </div>

          {/* Effective Annual Carbon Inflow Display */}
          <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-medium text-emerald-900 dark:text-emerald-300">
              <span>{lang === 'en' ? 'Year 1 Carbon Revenue:' : 'Pendapatan Karbon Thn 1:'}</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {fmtUsd(financialModel.yearDetails[1]?.carbonRevenue || 0)} / yr
              </span>
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
              Net credits: {fmtNum(annualAbatementTco2e * (1 - registryIssuanceDeductionPercent / 100))} tCO₂e @ ${carbonPriceUsd}/t
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PROJECT CAPEX, OPEX, SAVINGS & DISCOUNT RATE (7 COLS) */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {lang === 'en' ? 'Engineering & Financial Inputs' : 'Parameter Finansial & Teknis Proyek'}
              </h4>
            </div>
            <span className="text-[11px] text-neutral-500">
              {lang === 'en' ? 'Customizable assumptions' : 'Asumsi dapat dimodifikasi'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Input 1: Capex */}
            <div className="p-3 bg-neutral-50/70 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {lang === 'en' ? 'Initial Capital (Capex)' : 'Biaya Modal Awal (Capex)'}
                </span>
                <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {fmtUsd(capexUsd)}
                </span>
              </div>
              <input
                type="range"
                min="100000"
                max="6000000"
                step="50000"
                value={capexUsd}
                onChange={(e) => setCapexUsd(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>$100k</span>
                <span>$3M</span>
                <span>$6M</span>
              </div>
            </div>

            {/* Input 2: Annual Opex */}
            <div className="p-3 bg-neutral-50/70 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {lang === 'en' ? 'Annual Opex ($/yr)' : 'Biaya Operasional Tahunan (Opex)'}
                </span>
                <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {fmtUsd(opexUsd)}
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="400000"
                step="5000"
                value={opexUsd}
                onChange={(e) => setOpexUsd(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>$5k</span>
                <span>$200k</span>
                <span>$400k</span>
              </div>
            </div>

            {/* Input 3: Operational Cost Savings */}
            <div className="p-3 bg-neutral-50/70 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {lang === 'en' ? 'Op/Energy Savings ($/yr)' : 'Penghematan Operasional/Energi'}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {fmtUsd(savingsUsd)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1000000"
                step="10000"
                value={savingsUsd}
                onChange={(e) => setSavingsUsd(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>$0</span>
                <span>$500k</span>
                <span>$1M</span>
              </div>
            </div>

            {/* Input 4: Annual GHG Abatement (tCO2e/yr) */}
            <div className="p-3 bg-neutral-50/70 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {lang === 'en' ? 'Annual GHG Abated' : 'Reduksi Emisi Tahunan'}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {fmtNum(annualAbatementTco2e)} tCO₂e
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="60000"
                step="500"
                value={annualAbatementTco2e}
                onChange={(e) => setAnnualAbatementTco2e(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>500 t</span>
                <span>30,000 t</span>
                <span>60,000 t</span>
              </div>
            </div>
          </div>

          {/* Lifespan & Discount Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-3 bg-white dark:bg-neutral-800/70 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  {lang === 'en' ? 'Discount Rate (WACC / Hurdle)' : 'Tingkat Diskonto (WACC)'}
                </span>
                <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {discountRatePercent}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="18"
                step="0.5"
                value={discountRatePercent}
                onChange={(e) => setDiscountRatePercent(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>5%</span>
                <span>10% (SE Asia Avg)</span>
                <span>18%</span>
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-neutral-800/70 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  {lang === 'en' ? 'Project Lifespan' : 'Masa Operasi Proyek'}
                </span>
                <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {projectLifespanYears} {lang === 'en' ? 'Years' : 'Tahun'}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="1"
                value={projectLifespanYears}
                onChange={(e) => setProjectLifespanYears(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>5 yrs</span>
                <span>15 yrs</span>
                <span>25 yrs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DUAL RECHARTS VISUALIZATION: CUMULATIVE BREAK-EVEN & ANNUAL CASH INFLOWS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHART 1: CUMULATIVE DISCOUNTED CASH FLOW & BREAK-EVEN WATERLINE */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                {lang === 'en' ? 'Cumulative Cash Flow & Break-Even Timeline' : 'Arus Kas Kumulatif & Titik Impas (Break-Even)'}
              </h4>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {lang === 'en'
                  ? 'Tracks cumulative un-discounted and discounted net flows from Year 0 to Year N.'
                  : 'Grafik akumulasi arus kas nominal dan terdiskon dari Tahun 0 hingga akhir proyek.'}
              </p>
            </div>
            {financialModel.discountedPaybackYears && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Break-even: Yr {financialModel.discountedPaybackYears}
              </span>
            )}
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={financialModel.yearDetails}
                margin={{ top: 10, right: 15, left: 15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#e5e7eb'} />
                <XAxis
                  dataKey="year"
                  stroke={isDark ? '#888' : '#666'}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `Y${val}`}
                />
                <YAxis
                  stroke={isDark ? '#888' : '#666'}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any, name: any) => {
                    const num = typeof val === 'number' ? val : 0;
                    return [`$${num.toLocaleString()}`, name];
                  }}
                  labelFormatter={(lbl) => `Year ${lbl}`}
                  contentStyle={{
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                    fontSize: '12px',
                    borderRadius: '8px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                />
                <ReferenceLine y={0} stroke={isDark ? '#ef4444' : '#dc2626'} strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="cumulativeDiscountedCashFlow"
                  name={lang === 'en' ? 'Discounted Cumulative ($)' : 'Kumulatif Terdiskon ($)'}
                  stroke="#059669"
                  fill="#10b981"
                  fillOpacity={0.15}
                  strokeWidth={2.5}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeCashFlow"
                  name={lang === 'en' ? 'Nominal Cumulative ($)' : 'Kumulatif Nominal ($)'}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: ANNUAL INFLOWS VS OPEX & NET CASH FLOW */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                {lang === 'en' ? 'Annual Revenue Streams & Net Cash Flow' : 'Arus Pendapatan Tahunan & Kas Bersih'}
              </h4>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {lang === 'en'
                  ? 'Carbon credit proceeds + operational savings stacked against annual maintenance opex.'
                  : 'Hasil penjualan kredit karbon + penghematan operasional dibanding biaya pemeliharaan.'}
              </p>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">
              Y1 Net: {fmtUsd(financialModel.annualNetOcfYear1)}
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={financialModel.yearDetails.slice(1)} // skip Year 0 capex for clear annual view
                margin={{ top: 10, right: 15, left: 15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#e5e7eb'} />
                <XAxis
                  dataKey="year"
                  stroke={isDark ? '#888' : '#666'}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `Y${val}`}
                />
                <YAxis
                  stroke={isDark ? '#888' : '#666'}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any, name: any) => {
                    const num = typeof val === 'number' ? val : 0;
                    return [`$${num.toLocaleString()}`, name];
                  }}
                  labelFormatter={(lbl) => `Year ${lbl}`}
                  contentStyle={{
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                    fontSize: '12px',
                    borderRadius: '8px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                />
                <Bar
                  dataKey="carbonRevenue"
                  name={lang === 'en' ? 'Carbon Revenue ($)' : 'Pendapatan Karbon ($)'}
                  stackId="a"
                  fill="#059669"
                />
                <Bar
                  dataKey="costSavings"
                  name={lang === 'en' ? 'Energy/Op Savings ($)' : 'Penghematan Energi/Op ($)'}
                  stackId="a"
                  fill="#0ea5e9"
                />
                <Bar
                  dataKey="opex"
                  name={lang === 'en' ? 'Annual Opex ($)' : 'Biaya Opex ($)'}
                  fill="#f43f5e"
                />
                <Line
                  type="monotone"
                  dataKey="netCashFlow"
                  name={lang === 'en' ? 'Net Annual Cash Flow ($)' : 'Arus Kas Bersih ($)'}
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2D SENSITIVITY MATRIX: CARBON CREDIT PRICE VS CAPEX VARIANCE */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              {lang === 'en' ? '2D Sensitivity Matrix: Carbon Price ($/t) vs. Capex Variance (±20%)' : 'Matriks Sensitivitas 2D: Harga Karbon ($/t) vs Variasi Capex (±20%)'}
            </h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              {lang === 'en'
                ? 'Displays Internal Rate of Return (IRR %) and Discounted Payback across market price swings and EPC cost variances.'
                : 'Menampilkan tingkat pengembalian modal (IRR) dan periode impas terdiskon terhadap fluktuasi harga karbon dan eskalasi biaya konstruksi.'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span> &ge; 18% IRR
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block"></span> 10 - 18%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span> &lt; 10%
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 font-semibold text-neutral-700 dark:text-neutral-300">
                <th className="p-3">
                  {lang === 'en' ? 'Capex Variance' : 'Variasi Capex'}
                </th>
                <th className="p-3 font-mono">
                  {lang === 'en' ? 'Capex ($)' : 'Nilai Capex'}
                </th>
                <th className="p-3 text-center font-mono">$3.00 / t<br/><span className="text-[10px] font-normal text-neutral-400">IDX Domestic</span></th>
                <th className="p-3 text-center font-mono">$5.00 / t<br/><span className="text-[10px] font-normal text-neutral-400">Regional Vol.</span></th>
                <th className="p-3 text-center font-mono">$8.50 / t<br/><span className="text-[10px] font-normal text-neutral-400">Verra Benchmark</span></th>
                <th className="p-3 text-center font-mono">$14.00 / t<br/><span className="text-[10px] font-normal text-neutral-400">Gold Standard</span></th>
                <th className="p-3 text-center font-mono">$22.50 / t<br/><span className="text-[10px] font-normal text-neutral-400">Art. 6 / CORSIA</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {sensitivityMatrix.map((row, idx) => {
                const isBaseRow = row.capexMultiplier === 1.0;
                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isBaseRow
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 font-semibold'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <td className="p-3">
                      <span className="flex items-center gap-1.5">
                        {isBaseRow ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                            Base Case
                          </span>
                        ) : (
                          <span className="font-mono text-neutral-600 dark:text-neutral-400">
                            {row.capexMultiplier < 1 ? '' : '+'}
                            {Math.round((row.capexMultiplier - 1) * 100)}%
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-neutral-700 dark:text-neutral-300">
                      {fmtUsd(row.capexAmount)}
                    </td>
                    {row.columns.map((col, colIdx) => {
                      const irrVal = col.irr;
                      let badgeBg = 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600';
                      if (irrVal !== null) {
                        if (irrVal >= 18) {
                          badgeBg = 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300';
                        } else if (irrVal >= 10) {
                          badgeBg = 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300';
                        } else {
                          badgeBg = 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300';
                        }
                      }

                      return (
                        <td key={colIdx} className="p-2.5 text-center">
                          <div className={`p-1.5 rounded-lg border text-center transition-all ${badgeBg}`}>
                            <div className="font-bold font-mono text-xs">
                              {irrVal !== null ? `${irrVal}%` : '< 0%'}
                            </div>
                            <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                              {col.discountedPayback !== null ? `${col.discountedPayback}y PB` : `>${projectLifespanYears}y`}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXECUTIVE MULTI-PROJECT RANKING & CAPITAL ALLOCATION TABLE */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              {lang === 'en' ? 'Portfolio Decarbonization Comparison (Capital Allocation)' : 'Perbandingan Portofolio Dekarbonisasi (Alokasi Modal)'}
            </h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              {lang === 'en'
                ? `Benchmark across all 5 standard mitigation projects at current market price ($${carbonPriceUsd}/tCO₂e) and ${discountRatePercent}% hurdle rate.`
                : `Perbandingan kelima opsi proyek mitigasi pada harga karbon aktif ($${carbonPriceUsd}/tCO₂e) dan hurdle rate ${discountRatePercent}%.`}
            </p>
          </div>

          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            {lang === 'en' ? 'Click row to select project' : 'Klik baris untuk memilih proyek'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 font-semibold text-neutral-700 dark:text-neutral-300">
                <th className="p-3">{lang === 'en' ? 'Mitigation Project' : 'Proyek Mitigasi'}</th>
                <th className="p-3 font-mono">{lang === 'en' ? 'Capex' : 'Modal'}</th>
                <th className="p-3 font-mono">{lang === 'en' ? 'Annual Abated' : 'Reduksi / Thn'}</th>
                <th className="p-3 font-mono">{lang === 'en' ? 'MAC ($/t)' : 'Biaya Reduksi'}</th>
                <th className="p-3 font-mono">{lang === 'en' ? 'IRR (%)' : 'IRR (%)'}</th>
                <th className="p-3 font-mono">{lang === 'en' ? 'Payback' : 'Impas'}</th>
                <th className="p-3 font-mono">{lang === 'en' ? 'NPV' : 'NPV'}</th>
                <th className="p-3 text-right">{lang === 'en' ? 'Recommendation' : 'Rekomendasi'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {archetypeComparisons.map((row) => {
                const isSelected = selectedArchetypeKey === row.id;
                return (
                  <tr
                    key={row.id}
                    onClick={() => handleSelectArchetype(row.id as ProjectArchetypeKey)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 font-semibold'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        <span className="text-neutral-900 dark:text-neutral-100">{row.name}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-neutral-700 dark:text-neutral-300">
                      {fmtUsd(row.capex)}
                    </td>
                    <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {fmtNum(row.abatement)} t/yr
                    </td>
                    <td className="p-3 font-mono">
                      <span className={row.mac <= 0 ? 'text-emerald-600 font-bold' : 'text-neutral-700 dark:text-neutral-300'}>
                        {row.mac <= 0 ? '-' : ''}${Math.abs(row.mac)}
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      {row.irr !== null ? (
                        <span className={`font-bold ${row.irr >= 15 ? 'text-emerald-600' : 'text-blue-600'}`}>
                          {row.irr}%
                        </span>
                      ) : (
                        <span className="text-neutral-400">N/A</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-neutral-700 dark:text-neutral-300">
                      {row.payback !== null ? `${row.payback} yrs` : '> Lifespan'}
                    </td>
                    <td className="p-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      {fmtUsd(row.npv)}
                    </td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                        {row.badge}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGULATORY METHODOLOGY & CARBON STANDARD ALIGNMENT FOOTNOTE */}
      <div className="p-4 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 text-xs text-neutral-600 dark:text-neutral-400 space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-neutral-100">
          <Info className="w-4 h-4 text-emerald-600" />
          <span>
            {lang === 'en'
              ? 'RSPO PalmGHG & Voluntary Carbon Accounting Methodology Notes'
              : 'Catatan Metodologi Akuntansi Karbon Sukarela & RSPO PalmGHG'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
          <p>
            {lang === 'en'
              ? '1. Biogas methane destruction calculations adhere to UNFCCC ACM0014 and Verra VM0042 standards. Baseline POME lagoon methane is quantified using COD inlet loadings (default 55,000 mg/L) with IPCC AR5 GWP-100 (28x).'
              : '1. Perhitungan reduksi metana biogas mengacu pada standar UNFCCC ACM0014 dan Verra VM0042. Emisi baseline dihitung dari beban COD inlet kolam anaerobik (default 55.000 mg/L) dengan faktor GWP-100 IPCC AR5 (28x).'}
          </p>
          <p>
            {lang === 'en'
              ? '2. Peatland water table rewetting follows RSPO BMP for Peatland Management and IPCC 2013 Wetlands Supplement Tier 2 emission factors (0.91 tCO2e/ha/yr reduction per cm water table increase).'
              : '2. Pembasahan lahan gambut mengacu pada Panduan Praktik Terbaik (BMP) RSPO dan IPCC 2013 Wetlands Supplement Tier 2 (pengurangan 0,91 tCO2e/ha/thn per cm kenaikan muka air tanah).'}
          </p>
        </div>
      </div>
    </div>
  );
};
