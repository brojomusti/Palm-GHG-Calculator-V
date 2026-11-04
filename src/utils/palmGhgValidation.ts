/**
 * RSPO PalmGHG Version 5 (V5) Data Validation & Agronomic Benchmarking Engine
 * Aligned with RSPO PalmGHG v5 Guidance, Principles & Criteria (P&C 2018/2024),
 * and GHG Protocol Land Sector and Removals (LSR) Standard v1.1.
 */

import { EstateParameters, MillParameters } from '../types/palmghg';

export type ValidationSeverity = 'valid' | 'warning' | 'error';

export interface FieldBenchmark {
  fieldKey: string;
  label: string;
  tab: 'planting' | 'fert-fuel' | 'mill-ops' | 'mill-pome';
  unit: string;
  perHaUnit?: string;
  typicalMin: number;
  typicalMax: number;
  hardMin: number;
  hardMax: number;
  defaultRspoValue: number;
  citation: string;
  description: string;
  isPerHectare?: boolean;
}

export interface ValidationIssue {
  fieldKey: string;
  label: string;
  tab: 'planting' | 'fert-fuel' | 'mill-ops' | 'mill-pome';
  severity: ValidationSeverity;
  currentValue: number;
  perHaValue?: number;
  unit: string;
  perHaUnit?: string;
  benchmarkRangeText: string;
  citation: string;
  message: string;
  rationale: string;
  suggestedValue: number;
}

export interface ValidationSummary {
  issues: ValidationIssue[];
  byField: Record<string, ValidationIssue>;
  byTab: Record<string, ValidationIssue[]>;
  totalErrors: number;
  totalWarnings: number;
  isFullyCompliant: boolean;
}

/**
 * RSPO PalmGHG v5 Canonical Benchmark Catalog
 */
export const RSPO_V5_BENCHMARKS: Record<string, FieldBenchmark> = {
  // --- TAB 1: PLANTING & PEAT ---
  totalPlantedAreaHa: {
    fieldKey: 'totalPlantedAreaHa',
    label: 'Total Planted Area',
    tab: 'planting',
    unit: 'ha',
    typicalMin: 50,
    typicalMax: 50000,
    hardMin: 1,
    hardMax: 150000,
    defaultRspoValue: 9300,
    citation: 'RSPO PalmGHG v5 Section 2.1 (Scope & Unit of Certification)',
    description: 'A certified management unit (MU) typically covers between 50 and 50,000 hectares. Values <= 0 are mathematically invalid.',
  },
  peatSoilAreaHa: {
    fieldKey: 'peatSoilAreaHa',
    label: 'Peat Soil Area',
    tab: 'planting',
    unit: 'ha',
    typicalMin: 0,
    typicalMax: 50000,
    hardMin: 0,
    hardMax: 150000,
    defaultRspoValue: 250,
    citation: 'RSPO PalmGHG v5 Section 2.3.1 (Peat Soil Accounting & Drainage)',
    description: 'Peat area cannot exceed total planted area. Drained peat carries a high carbon oxidation factor of ~54.6 tCO₂e/ha/yr.',
  },
  peatDrainageDepthCm: {
    fieldKey: 'peatDrainageDepthCm',
    label: 'Peat Water Table / Drainage Depth',
    tab: 'planting',
    unit: 'cm',
    typicalMin: 40,
    typicalMax: 80,
    hardMin: 20,
    hardMax: 120,
    defaultRspoValue: 60,
    citation: 'RSPO PalmGHG v5 Subbab 2.3.1.3 & P&C Criterion 7.7 (Peatland BMP)',
    description: 'RSPO BMP mandates a mean water table depth between 40–60 cm (drainage depth ~60–80 cm). Deep drainage (>80 cm) drastically accelerates peat oxidation, fire vulnerability, and carbon loss.',
  },
  grossLucAmortisationYears: {
    fieldKey: 'grossLucAmortisationYears',
    label: 'Gross LUC Amortisation Period',
    tab: 'planting',
    unit: 'years',
    typicalMin: 25,
    typicalMax: 25,
    hardMin: 10,
    hardMax: 50,
    defaultRspoValue: 25,
    citation: 'RSPO PalmGHG v5 Subbab 2.2 (GHG Protocol LSR v1.1 Alignment)',
    description: 'PalmGHG v5 standardises gross Land Use Change (LUC) carbon debt amortisation over exactly 25 years (linear 4% per year).',
  },

  // --- TAB 2: FERTILISER & FUEL ---
  syntheticNTotalPerHa: {
    fieldKey: 'syntheticNStandardKg', // evaluated across both standard and inhibited N
    label: 'Total Nitrogen Application Rate',
    tab: 'fert-fuel',
    unit: 'kg N/yr',
    perHaUnit: 'kg N/ha/yr',
    typicalMin: 80,
    typicalMax: 180,
    hardMin: 20,
    hardMax: 400,
    defaultRspoValue: 110,
    citation: 'RSPO PalmGHG v5 Section 2.3.2 & Corley & Tinker Oil Palm Agronomy',
    description: 'Mature commercial oil palm uptake rate is 80–180 kg N/ha/yr. Rates above 220 kg N/ha/yr trigger severe N₂O volatilisation and nitrate leaching. Rates >400 kg/ha/yr are agronomically toxic or indicate incorrect unit entry.',
    isPerHectare: true,
  },
  syntheticP2O5PerHa: {
    fieldKey: 'syntheticP2O5Kg',
    label: 'Phosphorus (P₂O₅) Rate',
    tab: 'fert-fuel',
    unit: 'kg P₂O₅/yr',
    perHaUnit: 'kg P₂O₅/ha/yr',
    typicalMin: 30,
    typicalMax: 120,
    hardMin: 0,
    hardMax: 350,
    defaultRspoValue: 45,
    citation: 'RSPO PalmGHG v5 Section 2.3.2 (Scope 1 & 3 Fertiliser Factors)',
    description: 'Standard maintenance rate for mature palms is 30–120 kg P₂O₅/ha/yr. Excessive rates (>200 kg/ha) lead to phosphorus fixation and aquatic eutrophication.',
    isPerHectare: true,
  },
  syntheticK2OPerHa: {
    fieldKey: 'syntheticK2OKg',
    label: 'Potassium (K₂O) Rate',
    tab: 'fert-fuel',
    unit: 'kg K₂O/yr',
    perHaUnit: 'kg K₂O/ha/yr',
    typicalMin: 120,
    typicalMax: 300,
    hardMin: 0,
    hardMax: 600,
    defaultRspoValue: 180,
    citation: 'RSPO PalmGHG v5 Section 2.3.2 (Scope 1 & 3 Fertiliser Factors)',
    description: 'Potassium is vital for FFB bunch formation with benchmark dressings of 120–300 kg K₂O/ha/yr. Rates above 450 kg/ha are economically wasteful and unabsorbed.',
    isPerHectare: true,
  },
  fertiliserTransportDistanceKm: {
    fieldKey: 'fertiliserTransportDistanceKm',
    label: 'Fertiliser Transport Distance',
    tab: 'fert-fuel',
    unit: 'km',
    typicalMin: 10,
    typicalMax: 500,
    hardMin: 0,
    hardMax: 2000,
    defaultRspoValue: 50,
    citation: 'RSPO PalmGHG v5 Section 2.3.2.4 (Scope 3 Cat 4 Upstream Freight)',
    description: 'Upstream logistics from port or blending plant to estate typically ranges from 10 to 500 km.',
  },
  estateDieselPerHa: {
    fieldKey: 'mobileFuelDieselLiters',
    label: 'Estate Field Diesel Rate',
    tab: 'fert-fuel',
    unit: 'Liters/yr',
    perHaUnit: 'L diesel/ha/yr',
    typicalMin: 40,
    typicalMax: 120,
    hardMin: 10,
    hardMax: 300,
    defaultRspoValue: 55,
    citation: 'RSPO PalmGHG v5 Subbab 2.3.3 & MPOB Field Fuel Benchmarks',
    description: 'Total field fuel (mobile harvesters/tractors + stationary pumps) averages 40–120 L diesel/ha/yr. Values >200 L/ha/yr suggest unmetered non-estate fuel use.',
    isPerHectare: true,
  },
  biodieselBlendPercent: {
    fieldKey: 'biodieselBlendPercent',
    label: 'Biodiesel Blend (B-fraction)',
    tab: 'fert-fuel',
    unit: '%',
    typicalMin: 0,
    typicalMax: 50,
    hardMin: 0,
    hardMax: 100,
    defaultRspoValue: 35,
    citation: 'RSPO PalmGHG v5 Subbab 2.3.3.3 (Biogenic Carbon Reporting)',
    description: 'Regional mandates specify B20 (Malaysia) or B35/B40 (Indonesia). Values must fall between 0% and 100%.',
  },

  // --- TAB 3: MILL OPERATIONS & EXTRACTION ---
  cpoExtractionRatePercent: {
    fieldKey: 'cpoExtractionRatePercent',
    label: 'CPO Extraction Rate (OER)',
    tab: 'mill-ops',
    unit: '%',
    typicalMin: 19.0,
    typicalMax: 24.5,
    hardMin: 14.0,
    hardMax: 28.0,
    defaultRspoValue: 21.5,
    citation: 'RSPO PalmGHG v5 Section 3.1 & Table 3.1 Mill Extraction Benchmarks',
    description: 'Commercial Tenera (DxP) palm oil mills average 19.5%–23.5% OER. Values below 16% reflect poor bunch ripeness or press loss; values above 26% exceed biological oil limits.',
  },
  pkExtractionRatePercent: {
    fieldKey: 'pkExtractionRatePercent',
    label: 'Palm Kernel Extraction Rate (KER)',
    tab: 'mill-ops',
    unit: '%',
    typicalMin: 4.5,
    typicalMax: 6.8,
    hardMin: 2.5,
    hardMax: 9.5,
    defaultRspoValue: 5.5,
    citation: 'RSPO PalmGHG v5 Section 3.1 & Table 3.1 Mill Extraction Benchmarks',
    description: 'Palm kernel extraction rate typically ranges between 4.5% and 6.5%. Abnormal KER indicates hydrocyclone or depericarper separation issues.',
  },
  efbGenerationRatePercent: {
    fieldKey: 'efbGenerationRatePercent',
    label: 'Empty Fruit Bunch (EFB) % of FFB',
    tab: 'mill-ops',
    unit: '%',
    typicalMin: 19.0,
    typicalMax: 25.0,
    hardMin: 12.0,
    hardMax: 32.0,
    defaultRspoValue: 22.0,
    citation: 'RSPO PalmGHG v5 Section 3.2 (Biomass By-Product Yields)',
    description: 'EFB generation is physically benchmarked at 20%–24% of processed FFB.',
  },
  pksGenerationRatePercent: {
    fieldKey: 'pksGenerationRatePercent',
    label: 'Palm Kernel Shell (PKS) % of FFB',
    tab: 'mill-ops',
    unit: '%',
    typicalMin: 4.5,
    typicalMax: 7.5,
    hardMin: 2.0,
    hardMax: 11.0,
    defaultRspoValue: 6.0,
    citation: 'RSPO PalmGHG v5 Section 3.2 (Biomass By-Product Yields)',
    description: 'Shell generation is benchmarked at 5%–7% of processed FFB.',
  },
  fibreGenerationRatePercent: {
    fieldKey: 'fibreGenerationRatePercent',
    label: 'Mesocarp Fibre % of FFB',
    tab: 'mill-ops',
    unit: '%',
    typicalMin: 11.5,
    typicalMax: 15.5,
    hardMin: 7.0,
    hardMax: 20.0,
    defaultRspoValue: 13.5,
    citation: 'RSPO PalmGHG v5 Section 3.2 (Biomass By-Product Yields)',
    description: 'Mesocarp fibre generation is benchmarked at 12%–15% of processed FFB.',
  },

  // --- TAB 4: POME, METHANE & ENERGY ---
  pomeGenerationRatioM3PerTonFfb: {
    fieldKey: 'pomeGenerationRatioM3PerTonFfb',
    label: 'POME Generation Ratio',
    tab: 'mill-pome',
    unit: 'm³/t FFB',
    typicalMin: 0.50,
    typicalMax: 0.85,
    hardMin: 0.30,
    hardMax: 1.30,
    defaultRspoValue: 0.65,
    citation: 'RSPO PalmGHG v5 Section 3.3.1 (POME Volume & COD Standards)',
    description: 'RSPO standard benchmark is 0.60–0.70 m³ POME / ton FFB (typical range 0.50–0.85). Ratios >1.0 m³/t indicate excess steriliser condensate or dilution water loss.',
  },
  codInletMgPerL: {
    fieldKey: 'codInletMgPerL',
    label: 'Raw POME COD Concentration',
    tab: 'mill-pome',
    unit: 'mg/L',
    typicalMin: 45000,
    typicalMax: 65000,
    hardMin: 20000,
    hardMax: 95000,
    defaultRspoValue: 55000,
    citation: 'RSPO PalmGHG v5 Section 3.3.1 & IPCC Wastewater Methane Factor',
    description: 'Raw effluent inlet COD benchmark is 45,000–65,000 mg/L (average ~55,000 mg/L). Highly diluted POME (<30,000 mg/L) indicates rainwater ingress; >80,000 mg/L indicates heavy oil loss.',
  },
  treatmentAllocationSum: {
    fieldKey: 'treatmentAllocationSplit',
    label: 'POME Treatment Allocation Total',
    tab: 'mill-pome',
    unit: '%',
    typicalMin: 100,
    typicalMax: 100,
    hardMin: 100,
    hardMax: 100,
    defaultRspoValue: 100,
    citation: 'RSPO PalmGHG v5 Section 3.3.2 (Effluent Pathway Split)',
    description: 'The sum of Open Lagoon %, Composting %, and Methane Capture % must equal exactly 100%.',
  },
  biogasMethaneContentPercent: {
    fieldKey: 'biogasMethaneContentPercent',
    label: 'Biogas Methane (CH₄) Content',
    tab: 'mill-pome',
    unit: '%',
    typicalMin: 55,
    typicalMax: 68,
    hardMin: 40,
    hardMax: 80,
    defaultRspoValue: 60,
    citation: 'RSPO PalmGHG v5 Subbab 3.3.3 (Biogas Plant Performance)',
    description: 'Standard mesophilic anaerobic digester biogas composition is 55%–65% CH₄ (balance CO₂ and trace H₂S).',
  },
  methaneCaptureEfficiencyPercent: {
    fieldKey: 'methaneCaptureEfficiencyPercent',
    label: 'Methane Capture Efficiency',
    tab: 'mill-pome',
    unit: '%',
    typicalMin: 85,
    typicalMax: 95,
    hardMin: 60,
    hardMax: 99.5,
    defaultRspoValue: 90,
    citation: 'RSPO PalmGHG v5 Subbab 3.3.3 (Methane Capture Audit Verification)',
    description: 'RSPO default capture efficiency is 90% for covered lagoon biodigesters and 95% for enclosed tank CSTR systems.',
  },
};

/**
 * Validates Estate and Mill parameters against RSPO PalmGHG v5 benchmarks.
 */
export function validatePalmGhgData(
  estate: EstateParameters,
  mill: MillParameters
): ValidationSummary {
  const issues: ValidationIssue[] = [];

  const plantedArea = Math.max(estate.totalPlantedAreaHa, 0);

  // 1. Total Planted Area
  if (estate.totalPlantedAreaHa <= 0) {
    issues.push({
      fieldKey: 'totalPlantedAreaHa',
      label: 'Total Planted Area',
      tab: 'planting',
      severity: 'error',
      currentValue: estate.totalPlantedAreaHa,
      unit: 'ha',
      benchmarkRangeText: '50 – 50,000 ha',
      citation: RSPO_V5_BENCHMARKS.totalPlantedAreaHa.citation,
      message: 'Total planted area must be greater than zero.',
      rationale: 'Zero or negative planted area prevents per-hectare carbon stock, fertiliser intensity, and yield calculations.',
      suggestedValue: 9300,
    });
  } else if (estate.totalPlantedAreaHa > RSPO_V5_BENCHMARKS.totalPlantedAreaHa.typicalMax) {
    issues.push({
      fieldKey: 'totalPlantedAreaHa',
      label: 'Total Planted Area',
      tab: 'planting',
      severity: 'warning',
      currentValue: estate.totalPlantedAreaHa,
      unit: 'ha',
      benchmarkRangeText: '50 – 50,000 ha',
      citation: RSPO_V5_BENCHMARKS.totalPlantedAreaHa.citation,
      message: `Planted area (${estate.totalPlantedAreaHa.toLocaleString()} ha) is unusually large for a single RSPO certified unit.`,
      rationale: 'Verify whether multiple estate management units should be segregated into individual supply base assessments.',
      suggestedValue: 12000,
    });
  }

  // 2. Peat Soil Area & Mineral Consistency
  if (estate.peatSoilAreaHa < 0) {
    issues.push({
      fieldKey: 'peatSoilAreaHa',
      label: 'Peat Soil Area',
      tab: 'planting',
      severity: 'error',
      currentValue: estate.peatSoilAreaHa,
      unit: 'ha',
      benchmarkRangeText: '≥ 0 ha',
      citation: RSPO_V5_BENCHMARKS.peatSoilAreaHa.citation,
      message: 'Peat soil area cannot be negative.',
      rationale: 'Negative land area is physically impossible.',
      suggestedValue: 0,
    });
  } else if (plantedArea > 0 && estate.peatSoilAreaHa > plantedArea) {
    issues.push({
      fieldKey: 'peatSoilAreaHa',
      label: 'Peat Soil Area',
      tab: 'planting',
      severity: 'error',
      currentValue: estate.peatSoilAreaHa,
      unit: 'ha',
      benchmarkRangeText: `≤ Planted Area (${plantedArea.toLocaleString()} ha)`,
      citation: RSPO_V5_BENCHMARKS.peatSoilAreaHa.citation,
      message: `Peat soil area (${estate.peatSoilAreaHa.toLocaleString()} ha) exceeds total planted area (${plantedArea.toLocaleString()} ha).`,
      rationale: 'Peat soil area cannot be larger than the total planted estate footprint.',
      suggestedValue: plantedArea,
    });
  } else if (plantedArea > 0 && estate.peatSoilAreaHa / plantedArea > 0.8) {
    const pct = Math.round((estate.peatSoilAreaHa / plantedArea) * 100);
    issues.push({
      fieldKey: 'peatSoilAreaHa',
      label: 'Peat Soil Area',
      tab: 'planting',
      severity: 'warning',
      currentValue: estate.peatSoilAreaHa,
      unit: 'ha',
      benchmarkRangeText: 'RSPO Peat BMP Compliant',
      citation: 'RSPO P&C Criterion 7.7 (Peat Drainability Assessment)',
      message: `Extensive peat soil: Peat comprises ${pct}% of total planted area.`,
      rationale: 'Under RSPO P&C 7.7, plantations on peat require documented drainability assessments and water management plans prior to replanting.',
      suggestedValue: Math.round(plantedArea * 0.2),
    });
  }

  // 3. Peat Drainage Depth
  if (estate.peatSoilAreaHa > 0) {
    const depth = estate.peatDrainageDepthCm || 60;
    if (depth < RSPO_V5_BENCHMARKS.peatDrainageDepthCm.hardMin) {
      issues.push({
        fieldKey: 'peatDrainageDepthCm',
        label: 'Peat Drainage Depth',
        tab: 'planting',
        severity: 'warning',
        currentValue: depth,
        unit: 'cm',
        benchmarkRangeText: '40 – 80 cm (BMP standard ~60 cm)',
        citation: RSPO_V5_BENCHMARKS.peatDrainageDepthCm.citation,
        message: `Water table depth (${depth} cm) is below 20 cm (prolonged flooding).`,
        rationale: 'Water table shallower than 20 cm causes severe root waterlogging and yield depression for commercial palms.',
        suggestedValue: 60,
      });
    } else if (depth > RSPO_V5_BENCHMARKS.peatDrainageDepthCm.hardMax) {
      issues.push({
        fieldKey: 'peatDrainageDepthCm',
        label: 'Peat Drainage Depth',
        tab: 'planting',
        severity: 'error',
        currentValue: depth,
        unit: 'cm',
        benchmarkRangeText: '40 – 80 cm (BMP standard ~60 cm)',
        citation: RSPO_V5_BENCHMARKS.peatDrainageDepthCm.citation,
        message: `Extreme drainage depth (${depth} cm) exceeds RSPO allowable threshold (>120 cm).`,
        rationale: 'Excessive drainage accelerates peat microbial oxidation (>70 tCO₂e/ha/yr) and triggers irreversible peat subsidence and catastrophic fire hazard.',
        suggestedValue: 60,
      });
    } else if (depth > RSPO_V5_BENCHMARKS.peatDrainageDepthCm.typicalMax) {
      issues.push({
        fieldKey: 'peatDrainageDepthCm',
        label: 'Peat Drainage Depth',
        tab: 'planting',
        severity: 'warning',
        currentValue: depth,
        unit: 'cm',
        benchmarkRangeText: '40 – 80 cm (BMP standard ~60 cm)',
        citation: RSPO_V5_BENCHMARKS.peatDrainageDepthCm.citation,
        message: `Drainage depth (${depth} cm) exceeds RSPO Best Management Practice (40–60 cm).`,
        rationale: 'Water tables deeper than 80 cm increase annual CO₂ emissions by ~20–30% compared to well-managed peat.',
        suggestedValue: 60,
      });
    }
  }

  // 4. Gross LUC Amortisation Years
  if (
    estate.grossLucAmortisationYears &&
    (estate.grossLucAmortisationYears < 20 || estate.grossLucAmortisationYears > 30)
  ) {
    issues.push({
      fieldKey: 'grossLucAmortisationYears',
      label: 'Gross LUC Amortisation Years',
      tab: 'planting',
      severity: 'warning',
      currentValue: estate.grossLucAmortisationYears,
      unit: 'years',
      benchmarkRangeText: '25 years (RSPO v5 fixed)',
      citation: RSPO_V5_BENCHMARKS.grossLucAmortisationYears.citation,
      message: `Non-standard amortisation (${estate.grossLucAmortisationYears} years). RSPO PalmGHG v5 standard is 25 years.`,
      rationale: 'RSPO PalmGHG v5 aligned with GHG Protocol LSR Standard v1.1 mandates a 25-year linear amortisation period for Land Use Change carbon debts.',
      suggestedValue: 25,
    });
  }

  // 5. Total Nitrogen Application Rate (Standard + Inhibited)
  if (plantedArea > 0) {
    const totalN = estate.syntheticNStandardKg + estate.syntheticNInhibitedKg;
    const nPerHa = totalN / plantedArea;

    if (totalN < 0) {
      issues.push({
        fieldKey: 'syntheticNStandardKg',
        label: 'Nitrogen Application (Standard N)',
        tab: 'fert-fuel',
        severity: 'error',
        currentValue: estate.syntheticNStandardKg,
        unit: 'kg N/yr',
        benchmarkRangeText: '≥ 0 kg N/yr',
        citation: RSPO_V5_BENCHMARKS.syntheticNTotalPerHa.citation,
        message: 'Nitrogen application rate cannot be negative.',
        rationale: 'Negative nutrient application is invalid.',
        suggestedValue: 0,
      });
    } else if (nPerHa < RSPO_V5_BENCHMARKS.syntheticNTotalPerHa.hardMin) {
      issues.push({
        fieldKey: 'syntheticNStandardKg',
        label: 'Total Nitrogen Rate',
        tab: 'fert-fuel',
        severity: 'warning',
        currentValue: totalN,
        perHaValue: nPerHa,
        unit: 'kg N/yr',
        perHaUnit: 'kg N/ha/yr',
        benchmarkRangeText: '80 – 180 kg N/ha/yr',
        citation: RSPO_V5_BENCHMARKS.syntheticNTotalPerHa.citation,
        message: `Low nitrogen application: ${nPerHa.toFixed(1)} kg N/ha/yr (benchmark 80–180 kg/ha).`,
        rationale: 'Mature commercial oil palm typically requires 80–180 kg N/ha/yr to avoid severe vegetative chlorosis and bunch abort.',
        suggestedValue: Math.round(110 * plantedArea),
      });
    } else if (nPerHa > RSPO_V5_BENCHMARKS.syntheticNTotalPerHa.hardMax) {
      issues.push({
        fieldKey: 'syntheticNStandardKg',
        label: 'Total Nitrogen Rate',
        tab: 'fert-fuel',
        severity: 'error',
        currentValue: totalN,
        perHaValue: nPerHa,
        unit: 'kg N/yr',
        perHaUnit: 'kg N/ha/yr',
        benchmarkRangeText: '80 – 180 kg N/ha/yr (max 400 kg/ha)',
        citation: RSPO_V5_BENCHMARKS.syntheticNTotalPerHa.citation,
        message: `Agronomically impossible nitrogen rate: ${nPerHa.toFixed(1)} kg N/ha/yr (>400 kg/ha).`,
        rationale: 'Exceeds physiological palm uptake limits; causes severe leaf scorching, osmotic root burn, and massive nitrate groundwater pollution. Check whether input was entered in MT instead of kg.',
        suggestedValue: Math.round(120 * plantedArea),
      });
    } else if (nPerHa > RSPO_V5_BENCHMARKS.syntheticNTotalPerHa.typicalMax) {
      issues.push({
        fieldKey: 'syntheticNStandardKg',
        label: 'Total Nitrogen Rate',
        tab: 'fert-fuel',
        severity: 'warning',
        currentValue: totalN,
        perHaValue: nPerHa,
        unit: 'kg N/yr',
        perHaUnit: 'kg N/ha/yr',
        benchmarkRangeText: '80 – 180 kg N/ha/yr',
        citation: RSPO_V5_BENCHMARKS.syntheticNTotalPerHa.citation,
        message: `Atypical high nitrogen: ${nPerHa.toFixed(1)} kg N/ha/yr (exceeds typical 180 kg/ha benchmark).`,
        rationale: 'Application rates above 180 kg N/ha/yr generate steep direct and indirect N₂O emissions without corresponding yield benefit.',
        suggestedValue: Math.round(130 * plantedArea),
      });
    }

    // 6. Phosphorus (P2O5)
    const p2o5PerHa = estate.syntheticP2O5Kg / plantedArea;
    if (estate.syntheticP2O5Kg < 0) {
      issues.push({
        fieldKey: 'syntheticP2O5Kg',
        label: 'Phosphorus (P₂O₅)',
        tab: 'fert-fuel',
        severity: 'error',
        currentValue: estate.syntheticP2O5Kg,
        unit: 'kg P₂O₅/yr',
        benchmarkRangeText: '≥ 0 kg/yr',
        citation: RSPO_V5_BENCHMARKS.syntheticP2O5PerHa.citation,
        message: 'Phosphorus application cannot be negative.',
        rationale: 'Negative value is invalid.',
        suggestedValue: 0,
      });
    } else if (p2o5PerHa > RSPO_V5_BENCHMARKS.syntheticP2O5PerHa.hardMax) {
      issues.push({
        fieldKey: 'syntheticP2O5Kg',
        label: 'Phosphorus Rate',
        tab: 'fert-fuel',
        severity: 'error',
        currentValue: estate.syntheticP2O5Kg,
        perHaValue: p2o5PerHa,
        unit: 'kg P₂O₅/yr',
        perHaUnit: 'kg P₂O₅/ha/yr',
        benchmarkRangeText: '30 – 120 kg P₂O₅/ha/yr',
        citation: RSPO_V5_BENCHMARKS.syntheticP2O5PerHa.citation,
        message: `Excessive phosphorus rate: ${p2o5PerHa.toFixed(1)} kg P₂O₅/ha/yr (>350 kg/ha limit).`,
        rationale: 'P₂O₅ application above 350 kg/ha exceeds agronomic requirements by over 3x and risks toxic phosphorus fixation.',
        suggestedValue: Math.round(50 * plantedArea),
      });
    } else if (p2o5PerHa > RSPO_V5_BENCHMARKS.syntheticP2O5PerHa.typicalMax) {
      issues.push({
        fieldKey: 'syntheticP2O5Kg',
        label: 'Phosphorus Rate',
        tab: 'fert-fuel',
        severity: 'warning',
        currentValue: estate.syntheticP2O5Kg,
        perHaValue: p2o5PerHa,
        unit: 'kg P₂O₅/yr',
        perHaUnit: 'kg P₂O₅/ha/yr',
        benchmarkRangeText: '30 – 120 kg P₂O₅/ha/yr',
        citation: RSPO_V5_BENCHMARKS.syntheticP2O5PerHa.citation,
        message: `High phosphorus rate: ${p2o5PerHa.toFixed(1)} kg P₂O₅/ha/yr (benchmark 30–120 kg/ha).`,
        rationale: 'Above typical agronomic benchmark for mature palms; inspect leaf analysis (frond 17) to verify requirement.',
        suggestedValue: Math.round(60 * plantedArea),
      });
    }

    // 7. Potassium (K2O)
    const k2oPerHa = estate.syntheticK2OKg / plantedArea;
    if (estate.syntheticK2OKg < 0) {
      issues.push({
        fieldKey: 'syntheticK2OKg',
        label: 'Potassium (K₂O)',
        tab: 'fert-fuel',
        severity: 'error',
        currentValue: estate.syntheticK2OKg,
        unit: 'kg K₂O/yr',
        benchmarkRangeText: '≥ 0 kg/yr',
        citation: RSPO_V5_BENCHMARKS.syntheticK2OPerHa.citation,
        message: 'Potassium application cannot be negative.',
        rationale: 'Negative value is invalid.',
        suggestedValue: 0,
      });
    } else if (k2oPerHa > RSPO_V5_BENCHMARKS.syntheticK2OPerHa.hardMax) {
      issues.push({
        fieldKey: 'syntheticK2OKg',
        label: 'Potassium Rate',
        tab: 'fert-fuel',
        severity: 'error',
        currentValue: estate.syntheticK2OKg,
        perHaValue: k2oPerHa,
        unit: 'kg K₂O/yr',
        perHaUnit: 'kg K₂O/ha/yr',
        benchmarkRangeText: '120 – 300 kg K₂O/ha/yr',
        citation: RSPO_V5_BENCHMARKS.syntheticK2OPerHa.citation,
        message: `Excessive potassium rate: ${k2oPerHa.toFixed(1)} kg K₂O/ha/yr (>600 kg/ha limit).`,
        rationale: 'Extreme K application can induce magnesium deficiency (orange frond syndrome) and represents an input error.',
        suggestedValue: Math.round(180 * plantedArea),
      });
    } else if (k2oPerHa > RSPO_V5_BENCHMARKS.syntheticK2OPerHa.typicalMax) {
      issues.push({
        fieldKey: 'syntheticK2OKg',
        label: 'Potassium Rate',
        tab: 'fert-fuel',
        severity: 'warning',
        currentValue: estate.syntheticK2OKg,
        perHaValue: k2oPerHa,
        unit: 'kg K₂O/yr',
        perHaUnit: 'kg K₂O/ha/yr',
        benchmarkRangeText: '120 – 300 kg K₂O/ha/yr',
        citation: RSPO_V5_BENCHMARKS.syntheticK2OPerHa.citation,
        message: `High potassium rate: ${k2oPerHa.toFixed(1)} kg K₂O/ha/yr (benchmark 120–300 kg/ha).`,
        rationale: 'Elevated rate; verify bunch yield targets and frond 17 foliar nutrient records.',
        suggestedValue: Math.round(200 * plantedArea),
      });
    }

    // 8. Estate Diesel Fuel Rate
    const totalDiesel = estate.stationaryFuelDieselLiters + estate.mobileFuelDieselLiters;
    const dieselPerHa = totalDiesel / plantedArea;
    if (totalDiesel < 0) {
      issues.push({
        fieldKey: 'mobileFuelDieselLiters',
        label: 'Estate Diesel Fuel',
        tab: 'fert-fuel',
        severity: 'error',
        currentValue: totalDiesel,
        unit: 'Liters/yr',
        benchmarkRangeText: '≥ 0 Liters',
        citation: RSPO_V5_BENCHMARKS.estateDieselPerHa.citation,
        message: 'Diesel fuel volume cannot be negative.',
        rationale: 'Negative fuel consumption is invalid.',
        suggestedValue: 0,
      });
    } else if (dieselPerHa < RSPO_V5_BENCHMARKS.estateDieselPerHa.hardMin) {
      issues.push({
        fieldKey: 'mobileFuelDieselLiters',
        label: 'Estate Diesel Rate',
        tab: 'fert-fuel',
        severity: 'warning',
        currentValue: totalDiesel,
        perHaValue: dieselPerHa,
        unit: 'Liters/yr',
        perHaUnit: 'L/ha/yr',
        benchmarkRangeText: '40 – 120 L diesel/ha/yr',
        citation: RSPO_V5_BENCHMARKS.estateDieselPerHa.citation,
        message: `Unusually low estate fuel: ${dieselPerHa.toFixed(1)} L/ha/yr (benchmark 40–120 L/ha).`,
        rationale: 'Mechanised harvesting, internal collection tractors, and gensets typically consume at least 40 L/ha/yr in commercial estates.',
        suggestedValue: Math.round(55 * plantedArea),
      });
    } else if (dieselPerHa > RSPO_V5_BENCHMARKS.estateDieselPerHa.hardMax) {
      issues.push({
        fieldKey: 'mobileFuelDieselLiters',
        label: 'Estate Diesel Rate',
        tab: 'fert-fuel',
        severity: 'error',
        currentValue: totalDiesel,
        perHaValue: dieselPerHa,
        unit: 'Liters/yr',
        perHaUnit: 'L/ha/yr',
        benchmarkRangeText: '40 – 120 L diesel/ha/yr',
        citation: RSPO_V5_BENCHMARKS.estateDieselPerHa.citation,
        message: `Plausibility alert: Estate diesel ${dieselPerHa.toFixed(1)} L/ha/yr (>300 L/ha limit).`,
        rationale: 'Consumption exceeds 300 L/ha/yr; verify if external logistics, mill transport, or contractor trucks were mistakenly included in estate boundary.',
        suggestedValue: Math.round(65 * plantedArea),
      });
    } else if (dieselPerHa > RSPO_V5_BENCHMARKS.estateDieselPerHa.typicalMax) {
      issues.push({
        fieldKey: 'mobileFuelDieselLiters',
        label: 'Estate Diesel Rate',
        tab: 'fert-fuel',
        severity: 'warning',
        currentValue: totalDiesel,
        perHaValue: dieselPerHa,
        unit: 'Liters/yr',
        perHaUnit: 'L/ha/yr',
        benchmarkRangeText: '40 – 120 L diesel/ha/yr',
        citation: RSPO_V5_BENCHMARKS.estateDieselPerHa.citation,
        message: `High estate diesel consumption: ${dieselPerHa.toFixed(1)} L/ha/yr (benchmark 40–120 L/ha).`,
        rationale: 'Elevated fuel use elevates Scope 1 and Well-to-Tank (WTT) Scope 3 emissions.',
        suggestedValue: Math.round(75 * plantedArea),
      });
    }
  }

  // 9. Biodiesel Blend Percentage
  if (estate.biodieselBlendPercent < 0 || estate.biodieselBlendPercent > 100) {
    issues.push({
      fieldKey: 'biodieselBlendPercent',
      label: 'Biodiesel Blend %',
      tab: 'fert-fuel',
      severity: 'error',
      currentValue: estate.biodieselBlendPercent,
      unit: '%',
      benchmarkRangeText: '0% – 100% (e.g. B35/B40)',
      citation: RSPO_V5_BENCHMARKS.biodieselBlendPercent.citation,
      message: 'Biodiesel blend percentage must be between 0% and 100%.',
      rationale: 'A fuel blend proportion outside 0% to 100% is physically undefined.',
      suggestedValue: 35,
    });
  }

  // 10. Mill Extraction Rate (OER %)
  if (
    mill.cpoExtractionRatePercent < RSPO_V5_BENCHMARKS.cpoExtractionRatePercent.hardMin ||
    mill.cpoExtractionRatePercent > RSPO_V5_BENCHMARKS.cpoExtractionRatePercent.hardMax
  ) {
    issues.push({
      fieldKey: 'cpoExtractionRatePercent',
      label: 'CPO Extraction Rate (OER)',
      tab: 'mill-ops',
      severity: 'error',
      currentValue: mill.cpoExtractionRatePercent,
      unit: '%',
      benchmarkRangeText: '19.0% – 24.5%',
      citation: RSPO_V5_BENCHMARKS.cpoExtractionRatePercent.citation,
      message: `Physically implausible OER: ${mill.cpoExtractionRatePercent}% (allowable 14%–28%).`,
      rationale: 'Commercial dura/tenera fresh bunch mesocarp oil limits extraction between 14% and 28%. Check mill mass balance.',
      suggestedValue: 21.5,
    });
  } else if (
    mill.cpoExtractionRatePercent < RSPO_V5_BENCHMARKS.cpoExtractionRatePercent.typicalMin ||
    mill.cpoExtractionRatePercent > RSPO_V5_BENCHMARKS.cpoExtractionRatePercent.typicalMax
  ) {
    issues.push({
      fieldKey: 'cpoExtractionRatePercent',
      label: 'CPO Extraction Rate (OER)',
      tab: 'mill-ops',
      severity: 'warning',
      currentValue: mill.cpoExtractionRatePercent,
      unit: '%',
      benchmarkRangeText: '19.0% – 24.5%',
      citation: RSPO_V5_BENCHMARKS.cpoExtractionRatePercent.citation,
      message: `Atypical OER: ${mill.cpoExtractionRatePercent}% (standard RSPO benchmark 19.0%–24.5%).`,
      rationale: 'Values below 19% indicate suboptimal ripeness or mill screw press losses; values >24.5% occur only in top-quartile clonal plantings.',
      suggestedValue: 22.0,
    });
  }

  // 11. Palm Kernel Extraction Rate (KER %)
  if (
    mill.pkExtractionRatePercent < RSPO_V5_BENCHMARKS.pkExtractionRatePercent.hardMin ||
    mill.pkExtractionRatePercent > RSPO_V5_BENCHMARKS.pkExtractionRatePercent.hardMax
  ) {
    issues.push({
      fieldKey: 'pkExtractionRatePercent',
      label: 'Kernel Extraction Rate (KER)',
      tab: 'mill-ops',
      severity: 'error',
      currentValue: mill.pkExtractionRatePercent,
      unit: '%',
      benchmarkRangeText: '4.5% – 6.8%',
      citation: RSPO_V5_BENCHMARKS.pkExtractionRatePercent.citation,
      message: `Implausible KER: ${mill.pkExtractionRatePercent}% (allowable 2.5%–9.5%).`,
      rationale: 'KER outside this range indicates nut cracker malfunction or inaccurate weighbridge records.',
      suggestedValue: 5.5,
    });
  } else if (
    mill.pkExtractionRatePercent < RSPO_V5_BENCHMARKS.pkExtractionRatePercent.typicalMin ||
    mill.pkExtractionRatePercent > RSPO_V5_BENCHMARKS.pkExtractionRatePercent.typicalMax
  ) {
    issues.push({
      fieldKey: 'pkExtractionRatePercent',
      label: 'Kernel Extraction Rate (KER)',
      tab: 'mill-ops',
      severity: 'warning',
      currentValue: mill.pkExtractionRatePercent,
      unit: '%',
      benchmarkRangeText: '4.5% – 6.8%',
      citation: RSPO_V5_BENCHMARKS.pkExtractionRatePercent.citation,
      message: `Atypical KER: ${mill.pkExtractionRatePercent}% (standard RSPO benchmark 4.5%–6.8%).`,
      rationale: 'Nut recovery deviates from standard PalmGHG benchmark.',
      suggestedValue: 5.5,
    });
  }

  // 12. POME Generation Ratio
  if (
    mill.pomeGenerationRatioM3PerTonFfb < RSPO_V5_BENCHMARKS.pomeGenerationRatioM3PerTonFfb.hardMin ||
    mill.pomeGenerationRatioM3PerTonFfb > RSPO_V5_BENCHMARKS.pomeGenerationRatioM3PerTonFfb.hardMax
  ) {
    issues.push({
      fieldKey: 'pomeGenerationRatioM3PerTonFfb',
      label: 'POME Generation Ratio',
      tab: 'mill-pome',
      severity: 'error',
      currentValue: mill.pomeGenerationRatioM3PerTonFfb,
      unit: 'm³/t FFB',
      benchmarkRangeText: '0.50 – 0.85 m³/t FFB',
      citation: RSPO_V5_BENCHMARKS.pomeGenerationRatioM3PerTonFfb.citation,
      message: `Implausible POME ratio: ${mill.pomeGenerationRatioM3PerTonFfb} m³/t FFB (limit 0.30–1.30).`,
      rationale: 'Standard wet milling process cannot generate effluent outside 0.30 to 1.30 m³/ton FFB without major process abnormalities.',
      suggestedValue: 0.65,
    });
  } else if (
    mill.pomeGenerationRatioM3PerTonFfb < RSPO_V5_BENCHMARKS.pomeGenerationRatioM3PerTonFfb.typicalMin ||
    mill.pomeGenerationRatioM3PerTonFfb > RSPO_V5_BENCHMARKS.pomeGenerationRatioM3PerTonFfb.typicalMax
  ) {
    issues.push({
      fieldKey: 'pomeGenerationRatioM3PerTonFfb',
      label: 'POME Generation Ratio',
      tab: 'mill-pome',
      severity: 'warning',
      currentValue: mill.pomeGenerationRatioM3PerTonFfb,
      unit: 'm³/t FFB',
      benchmarkRangeText: '0.50 – 0.85 m³/t FFB',
      citation: RSPO_V5_BENCHMARKS.pomeGenerationRatioM3PerTonFfb.citation,
      message: `Atypical POME ratio: ${mill.pomeGenerationRatioM3PerTonFfb} m³/t FFB (benchmark 0.50–0.85).`,
      rationale: 'Higher ratios indicate excessive fresh water use in dilution or sterilisation; lower ratios may undercount effluent discharge.',
      suggestedValue: 0.65,
    });
  }

  // 13. Raw POME COD Inlet Concentration
  if (
    mill.codInletMgPerL < RSPO_V5_BENCHMARKS.codInletMgPerL.hardMin ||
    mill.codInletMgPerL > RSPO_V5_BENCHMARKS.codInletMgPerL.hardMax
  ) {
    issues.push({
      fieldKey: 'codInletMgPerL',
      label: 'POME COD Concentration',
      tab: 'mill-pome',
      severity: 'error',
      currentValue: mill.codInletMgPerL,
      unit: 'mg/L',
      benchmarkRangeText: '45,000 – 65,000 mg/L',
      citation: RSPO_V5_BENCHMARKS.codInletMgPerL.citation,
      message: `Implausible COD: ${mill.codInletMgPerL.toLocaleString()} mg/L (limit 20,000–95,000).`,
      rationale: 'Undiluted raw palm oil mill effluent COD cannot physically be below 20,000 or above 95,000 mg/L without extreme contamination or concentration.',
      suggestedValue: 55000,
    });
  } else if (
    mill.codInletMgPerL < RSPO_V5_BENCHMARKS.codInletMgPerL.typicalMin ||
    mill.codInletMgPerL > RSPO_V5_BENCHMARKS.codInletMgPerL.typicalMax
  ) {
    issues.push({
      fieldKey: 'codInletMgPerL',
      label: 'POME COD Concentration',
      tab: 'mill-pome',
      severity: 'warning',
      currentValue: mill.codInletMgPerL,
      unit: 'mg/L',
      benchmarkRangeText: '45,000 – 65,000 mg/L',
      citation: RSPO_V5_BENCHMARKS.codInletMgPerL.citation,
      message: `Atypical COD: ${mill.codInletMgPerL.toLocaleString()} mg/L (RSPO benchmark 45,000–65,000 mg/L).`,
      rationale: 'Raw POME organic loading directly governs stoichiometric methane production (B0 = 0.25 kg CH₄ / kg COD).',
      suggestedValue: 55000,
    });
  }

  // 14. POME Treatment Allocation Split (Must sum to 100%)
  const splitSum =
    mill.treatmentAllocationOpenLagoonPercent +
    mill.treatmentAllocationCompostPercent +
    mill.treatmentAllocationMethaneCapturePercent;

  if (Math.abs(splitSum - 100) > 0.1) {
    issues.push({
      fieldKey: 'treatmentAllocationSplit',
      label: 'Treatment Allocation Split',
      tab: 'mill-pome',
      severity: 'error',
      currentValue: splitSum,
      unit: '%',
      benchmarkRangeText: 'Exactly 100%',
      citation: RSPO_V5_BENCHMARKS.treatmentAllocationSum.citation,
      message: `Treatment split sums to ${splitSum.toFixed(1)}% instead of 100%.`,
      rationale: 'RSPO PalmGHG mass balance requires all generated POME to be accounted for across Open Lagoon, Composting, or Methane Capture.',
      suggestedValue: 100,
    });
  }

  // 15. Biogas Methane Content %
  if (mill.treatmentAllocationMethaneCapturePercent > 0) {
    if (
      mill.biogasMethaneContentPercent < RSPO_V5_BENCHMARKS.biogasMethaneContentPercent.hardMin ||
      mill.biogasMethaneContentPercent > RSPO_V5_BENCHMARKS.biogasMethaneContentPercent.hardMax
    ) {
      issues.push({
        fieldKey: 'biogasMethaneContentPercent',
        label: 'Biogas Methane Content',
        tab: 'mill-pome',
        severity: 'error',
        currentValue: mill.biogasMethaneContentPercent,
        unit: '%',
        benchmarkRangeText: '55% – 68% CH₄',
        citation: RSPO_V5_BENCHMARKS.biogasMethaneContentPercent.citation,
        message: `Implausible biogas methane content: ${mill.biogasMethaneContentPercent}% CH₄.`,
        rationale: 'Anaerobic microbial digestate off-gas cannot sustain methane fractions below 40% or above 80% under standard biological methanogenesis.',
        suggestedValue: 60,
      });
    } else if (
      mill.biogasMethaneContentPercent < RSPO_V5_BENCHMARKS.biogasMethaneContentPercent.typicalMin ||
      mill.biogasMethaneContentPercent > RSPO_V5_BENCHMARKS.biogasMethaneContentPercent.typicalMax
    ) {
      issues.push({
        fieldKey: 'biogasMethaneContentPercent',
        label: 'Biogas Methane Content',
        tab: 'mill-pome',
        severity: 'warning',
        currentValue: mill.biogasMethaneContentPercent,
        unit: '%',
        benchmarkRangeText: '55% – 68% CH₄',
        citation: RSPO_V5_BENCHMARKS.biogasMethaneContentPercent.citation,
        message: `Atypical CH₄ concentration: ${mill.biogasMethaneContentPercent}% (typical 55%–68%).`,
        rationale: 'Verify biogas GC (gas chromatograph) or continuous inline analyzer calibration.',
        suggestedValue: 60,
      });
    }

    // 16. Methane Capture Efficiency %
    if (
      mill.methaneCaptureEfficiencyPercent < RSPO_V5_BENCHMARKS.methaneCaptureEfficiencyPercent.hardMin ||
      mill.methaneCaptureEfficiencyPercent > RSPO_V5_BENCHMARKS.methaneCaptureEfficiencyPercent.hardMax
    ) {
      issues.push({
        fieldKey: 'methaneCaptureEfficiencyPercent',
        label: 'Methane Capture Efficiency',
        tab: 'mill-pome',
        severity: 'error',
        currentValue: mill.methaneCaptureEfficiencyPercent,
        unit: '%',
        benchmarkRangeText: '85% – 95%',
        citation: RSPO_V5_BENCHMARKS.methaneCaptureEfficiencyPercent.citation,
        message: `Implausible capture efficiency: ${mill.methaneCaptureEfficiencyPercent}%.`,
        rationale: 'Values below 60% indicate severe membrane tear or flare failure; values >99.5% are unachievable due to fugitive slip.',
        suggestedValue: 90,
      });
    } else if (
      mill.methaneCaptureEfficiencyPercent < RSPO_V5_BENCHMARKS.methaneCaptureEfficiencyPercent.typicalMin
    ) {
      issues.push({
        fieldKey: 'methaneCaptureEfficiencyPercent',
        label: 'Methane Capture Efficiency',
        tab: 'mill-pome',
        severity: 'warning',
        currentValue: mill.methaneCaptureEfficiencyPercent,
        unit: '%',
        benchmarkRangeText: '85% – 95%',
        citation: RSPO_V5_BENCHMARKS.methaneCaptureEfficiencyPercent.citation,
        message: `Low capture efficiency: ${mill.methaneCaptureEfficiencyPercent}% (RSPO default 90%).`,
        rationale: 'Reduced capture efficiency leads to significant uncaptured fugitive methane venting.',
        suggestedValue: 90,
      });
    }
  }

  // 17. Mineral Soil Area
  if (estate.mineralSoilAreaHa < 0) {
    issues.push({
      fieldKey: 'mineralSoilAreaHa',
      label: 'Mineral Soil Area',
      tab: 'planting',
      severity: 'error',
      currentValue: estate.mineralSoilAreaHa,
      unit: 'ha',
      benchmarkRangeText: '≥ 0 ha',
      citation: 'RSPO PalmGHG v5 Section 2.1 (Estate Land Boundaries)',
      message: 'Mineral soil area cannot be negative.',
      rationale: 'Negative land area is physically impossible.',
      suggestedValue: Math.max(0, plantedArea - estate.peatSoilAreaHa),
    });
  } else if (plantedArea > 0 && Math.abs(estate.mineralSoilAreaHa + estate.peatSoilAreaHa - plantedArea) > 5) {
    issues.push({
      fieldKey: 'mineralSoilAreaHa',
      label: 'Soil Area Reconciliation',
      tab: 'planting',
      severity: 'warning',
      currentValue: estate.mineralSoilAreaHa,
      unit: 'ha',
      benchmarkRangeText: `Peat + Mineral = Total Planted (${plantedArea.toLocaleString()} ha)`,
      citation: 'RSPO PalmGHG v5 Section 2.1 (Estate Land Reconciliation)',
      message: `Soil area discrepancy: Mineral (${estate.mineralSoilAreaHa.toLocaleString()} ha) + Peat (${estate.peatSoilAreaHa.toLocaleString()} ha) = ${(estate.mineralSoilAreaHa + estate.peatSoilAreaHa).toLocaleString()} ha (does not equal Total Planted ${plantedArea.toLocaleString()} ha).`,
      rationale: 'RSPO audit guidelines require planted area to equal the sum of peat and mineral soil partitions.',
      suggestedValue: Math.max(0, plantedArea - estate.peatSoilAreaHa),
    });
  }

  // 18. Gross LUC Total Debt
  if (estate.grossLucTotalTco2e < 0) {
    issues.push({
      fieldKey: 'grossLucTotalTco2e',
      label: 'Gross LUC Total Debt',
      tab: 'planting',
      severity: 'error',
      currentValue: estate.grossLucTotalTco2e,
      unit: 'tCO2e',
      benchmarkRangeText: '≥ 0 tCO2e',
      citation: 'RSPO PalmGHG v5 Subbab 2.2 (LSR v1.1 Gross LUC Debt)',
      message: 'Gross LUC carbon debt cannot be negative.',
      rationale: 'Under GHG Protocol LSR v1.1, gross clearance carbon debt is an absolute positive liability amortised over 25 years.',
      suggestedValue: 0,
    });
  }

  // 19. Cropland Conversion Area & SOC Factor
  if (estate.croplandConversionHa < 0) {
    issues.push({
      fieldKey: 'croplandConversionHa',
      label: 'Cropland Conversion Area',
      tab: 'planting',
      severity: 'error',
      currentValue: estate.croplandConversionHa,
      unit: 'ha',
      benchmarkRangeText: '≥ 0 ha and ≤ Planted Area',
      citation: 'RSPO PalmGHG v5 Subbab 2.2.3 (Land Management Transitions)',
      message: 'Cropland conversion area cannot be negative.',
      rationale: 'Land management area must be a non-negative value.',
      suggestedValue: 0,
    });
  } else if (plantedArea > 0 && estate.croplandConversionHa > plantedArea) {
    issues.push({
      fieldKey: 'croplandConversionHa',
      label: 'Cropland Conversion Area',
      tab: 'planting',
      severity: 'warning',
      currentValue: estate.croplandConversionHa,
      unit: 'ha',
      benchmarkRangeText: `≤ Planted Area (${plantedArea.toLocaleString()} ha)`,
      citation: 'RSPO PalmGHG v5 Subbab 2.2.3',
      message: `Cropland conversion (${estate.croplandConversionHa.toLocaleString()} ha) exceeds total planted area.`,
      rationale: 'Land converted from cropland cannot exceed the estate total planted boundary.',
      suggestedValue: plantedArea,
    });
  }

  // 20. Standing Retired Palm (>25 Years)
  if (estate.standingRetiredPalmAreaHa < 0) {
    issues.push({
      fieldKey: 'standingRetiredPalmAreaHa',
      label: 'Standing Retired Palm Area',
      tab: 'planting',
      severity: 'error',
      currentValue: estate.standingRetiredPalmAreaHa,
      unit: 'ha',
      benchmarkRangeText: '≥ 0 ha and ≤ Planted Area',
      citation: 'RSPO PalmGHG v5 Subbab 2.2.4 (Standing Retired Palms)',
      message: 'Standing retired palm area cannot be negative.',
      rationale: 'Area of non-harvested mature palms must be non-negative.',
      suggestedValue: 0,
    });
  } else if (plantedArea > 0 && estate.standingRetiredPalmAreaHa > plantedArea) {
    issues.push({
      fieldKey: 'standingRetiredPalmAreaHa',
      label: 'Standing Retired Palm Area',
      tab: 'planting',
      severity: 'warning',
      currentValue: estate.standingRetiredPalmAreaHa,
      unit: 'ha',
      benchmarkRangeText: `≤ Planted Area (${plantedArea.toLocaleString()} ha)`,
      citation: 'RSPO PalmGHG v5 Subbab 2.2.4',
      message: `Retired palm area (${estate.standingRetiredPalmAreaHa.toLocaleString()} ha) exceeds total planted area.`,
      rationale: 'Retired oil palm footprint cannot exceed total certified planted area.',
      suggestedValue: Math.round(plantedArea * 0.05),
    });
  }

  if (estate.standingRetiredPalmSequestrationRate < 0 || estate.standingRetiredPalmSequestrationRate > 6.0) {
    issues.push({
      fieldKey: 'standingRetiredPalmSequestrationRate',
      label: 'Retired Palm Sequestration Rate',
      tab: 'planting',
      severity: 'warning',
      currentValue: estate.standingRetiredPalmSequestrationRate,
      unit: 'tCO2e/ha/yr',
      benchmarkRangeText: '1.0 – 3.0 tCO2e/ha/yr (standard ~1.8)',
      citation: 'RSPO PalmGHG v5 Subbab 2.2.4',
      message: `Atypical sequestration rate: ${estate.standingRetiredPalmSequestrationRate} tCO2e/ha/yr.`,
      rationale: 'Scientific studies indicate older non-producing palms sequester 1.2 to 2.2 tCO2e/ha/yr in wood and root biomass.',
      suggestedValue: 1.8,
    });
  }

  // 21. Conservation Areas (Forest, Non-Forest, Peatland)
  if (estate.forestConservationAreaHa < 0) {
    issues.push({
      fieldKey: 'forestConservationAreaHa',
      label: 'Forest Conservation Area',
      tab: 'planting',
      severity: 'error',
      currentValue: estate.forestConservationAreaHa,
      unit: 'ha',
      benchmarkRangeText: '≥ 0 ha',
      citation: 'RSPO PalmGHG v5 Subbab 2.4.1 (HCV Forest Accounting)',
      message: 'Forest conservation area cannot be negative.',
      rationale: 'Conservation area must be zero or a positive land footprint.',
      suggestedValue: 0,
    });
  }
  if (estate.nonForestConservationAreaHa < 0) {
    issues.push({
      fieldKey: 'nonForestConservationAreaHa',
      label: 'Non-Forest Conservation Area',
      tab: 'planting',
      severity: 'error',
      currentValue: estate.nonForestConservationAreaHa,
      unit: 'ha',
      benchmarkRangeText: '≥ 0 ha',
      citation: 'RSPO PalmGHG v5 Subbab 2.4.2 (Non-Forest Removals)',
      message: 'Non-forest conservation area cannot be negative.',
      rationale: 'Conservation area must be zero or a positive land footprint.',
      suggestedValue: 0,
    });
  }
  if (estate.peatlandConservationAreaHa < 0) {
    issues.push({
      fieldKey: 'peatlandConservationAreaHa',
      label: 'Peatland Conservation Area',
      tab: 'planting',
      severity: 'error',
      currentValue: estate.peatlandConservationAreaHa,
      unit: 'ha',
      benchmarkRangeText: '≥ 0 ha',
      citation: 'RSPO PalmGHG v5 Subbab 2.4.3 (Conserved Peatland Accounting)',
      message: 'Peatland conservation area cannot be negative.',
      rationale: 'Conserved or rewetted peatland area cannot be negative.',
      suggestedValue: 0,
    });
  }
  if (estate.otherEligibleCarbonRemovalsTco2e < 0) {
    issues.push({
      fieldKey: 'otherEligibleCarbonRemovalsTco2e',
      label: 'Other Carbon Removals',
      tab: 'planting',
      severity: 'error',
      currentValue: estate.otherEligibleCarbonRemovalsTco2e,
      unit: 'tCO2e/yr',
      benchmarkRangeText: '≥ 0 tCO2e',
      citation: 'RSPO PalmGHG v5 Subbab 2.4 (Verified Removals)',
      message: 'Other verified carbon removals cannot be negative.',
      rationale: 'Removals are credited as positive values representing carbon sequestration.',
      suggestedValue: 0,
    });
  }

  // 22. Fertiliser Transport Distance
  if (estate.fertiliserTransportDistanceKm < 0) {
    issues.push({
      fieldKey: 'fertiliserTransportDistanceKm',
      label: 'Fertiliser Transport Distance',
      tab: 'fert-fuel',
      severity: 'error',
      currentValue: estate.fertiliserTransportDistanceKm,
      unit: 'km',
      benchmarkRangeText: '≥ 0 km',
      citation: RSPO_V5_BENCHMARKS.fertiliserTransportDistanceKm.citation,
      message: 'Fertiliser transport distance cannot be negative.',
      rationale: 'Logistics distance must be non-negative.',
      suggestedValue: 50,
    });
  } else if (estate.fertiliserTransportDistanceKm > 2000) {
    issues.push({
      fieldKey: 'fertiliserTransportDistanceKm',
      label: 'Fertiliser Transport Distance',
      tab: 'fert-fuel',
      severity: 'warning',
      currentValue: estate.fertiliserTransportDistanceKm,
      unit: 'km',
      benchmarkRangeText: '10 – 500 km (typical max ~1000 km)',
      citation: RSPO_V5_BENCHMARKS.fertiliserTransportDistanceKm.citation,
      message: `Unusually long transport distance: ${estate.fertiliserTransportDistanceKm} km (>2000 km).`,
      rationale: 'Inland trucking logistics rarely exceeds 1,000 km. Verify if maritime shipping was mistakenly included.',
      suggestedValue: 150,
    });
  }

  // 23. Synthetic N Inhibited & Rock Phosphate
  if (estate.syntheticNInhibitedKg < 0) {
    issues.push({
      fieldKey: 'syntheticNInhibitedKg',
      label: 'NI/UI Treated Nitrogen',
      tab: 'fert-fuel',
      severity: 'error',
      currentValue: estate.syntheticNInhibitedKg,
      unit: 'kg N/yr',
      benchmarkRangeText: '≥ 0 kg N/yr',
      citation: 'RSPO PalmGHG v5 Subbab 2.3.2.2 (Inhibited Nitrogen)',
      message: 'Inhibited nitrogen application cannot be negative.',
      rationale: 'Nutrient application volume must be non-negative.',
      suggestedValue: 0,
    });
  }
  if (estate.rockPhosphateKg < 0) {
    issues.push({
      fieldKey: 'rockPhosphateKg',
      label: 'Rock Phosphate',
      tab: 'fert-fuel',
      severity: 'error',
      currentValue: estate.rockPhosphateKg,
      unit: 'kg/yr',
      benchmarkRangeText: '≥ 0 kg/yr',
      citation: 'RSPO PalmGHG v5 Section 2.3.2 (Fertiliser Standards)',
      message: 'Rock phosphate application cannot be negative.',
      rationale: 'Negative nutrient volume is invalid.',
      suggestedValue: 0,
    });
  }

  // 24. Recycled Organics (POME to Land, Compost, EFB Mulching)
  if (estate.pomeLandApplicationM3 < 0) {
    issues.push({
      fieldKey: 'pomeLandApplicationM3',
      label: 'POME Land Application',
      tab: 'fert-fuel',
      severity: 'error',
      currentValue: estate.pomeLandApplicationM3,
      unit: 'm³',
      benchmarkRangeText: '≥ 0 m³',
      citation: 'RSPO PalmGHG v5 Section 2.3.2.3 (Organic Nutrients in Estate)',
      message: 'POME land application volume cannot be negative.',
      rationale: 'Treated effluent volume applied to trenches must be non-negative.',
      suggestedValue: 0,
    });
  }
  if (estate.compostLandApplicationTon < 0) {
    issues.push({
      fieldKey: 'compostLandApplicationTon',
      label: 'Compost Field Application',
      tab: 'fert-fuel',
      severity: 'error',
      currentValue: estate.compostLandApplicationTon,
      unit: 'Ton',
      benchmarkRangeText: '≥ 0 Ton',
      citation: 'RSPO PalmGHG v5 Section 2.3.2.3 (Organic Nutrients)',
      message: 'Compost application cannot be negative.',
      rationale: 'Organic compost tonnage must be non-negative.',
      suggestedValue: 0,
    });
  }
  if (estate.efbMulchingTon < 0) {
    issues.push({
      fieldKey: 'efbMulchingTon',
      label: 'EFB Mulching Field Application',
      tab: 'fert-fuel',
      severity: 'error',
      currentValue: estate.efbMulchingTon,
      unit: 'Ton',
      benchmarkRangeText: '≥ 0 Ton',
      citation: 'RSPO PalmGHG v5 Section 2.3.2.3 (EFB Mulching)',
      message: 'EFB field mulching cannot be negative.',
      rationale: 'Empty fruit bunch mulching tonnage must be non-negative.',
      suggestedValue: 0,
    });
  }

  // 25. Stationary Fuel & Estate Electricity
  if (estate.stationaryFuelDieselLiters < 0) {
    issues.push({
      fieldKey: 'stationaryFuelDieselLiters',
      label: 'Stationary Diesel Fuel',
      tab: 'fert-fuel',
      severity: 'error',
      currentValue: estate.stationaryFuelDieselLiters,
      unit: 'Liters',
      benchmarkRangeText: '≥ 0 Liters',
      citation: 'RSPO PalmGHG v5 Subbab 2.3.3.1 (Stationary Combustion)',
      message: 'Stationary diesel fuel cannot be negative.',
      rationale: 'Fuel consumption must be non-negative.',
      suggestedValue: 0,
    });
  }
  if (estate.estateGridElectricityKwh < 0) {
    issues.push({
      fieldKey: 'estateGridElectricityKwh',
      label: 'Estate Grid Electricity',
      tab: 'fert-fuel',
      severity: 'error',
      currentValue: estate.estateGridElectricityKwh,
      unit: 'kWh',
      benchmarkRangeText: '≥ 0 kWh',
      citation: 'RSPO PalmGHG v5 Subbab 2.3.4 (Estate Scope 2 Electricity)',
      message: 'Estate grid electricity cannot be negative.',
      rationale: 'Purchased electricity consumption must be non-negative.',
      suggestedValue: 0,
    });
  }

  // 26. Mill By-Product Generation Rates (EFB, PKS, Fibre)
  if (
    mill.efbGenerationRatePercent < RSPO_V5_BENCHMARKS.efbGenerationRatePercent.hardMin ||
    mill.efbGenerationRatePercent > RSPO_V5_BENCHMARKS.efbGenerationRatePercent.hardMax
  ) {
    issues.push({
      fieldKey: 'efbGenerationRatePercent',
      label: 'EFB Generation Rate %',
      tab: 'mill-ops',
      severity: 'error',
      currentValue: mill.efbGenerationRatePercent,
      unit: '%',
      benchmarkRangeText: '19.0% – 25.0% of FFB',
      citation: RSPO_V5_BENCHMARKS.efbGenerationRatePercent.citation,
      message: `Implausible EFB rate: ${mill.efbGenerationRatePercent}% (allowable 12%–32%).`,
      rationale: 'Fresh fruit bunches physically yield between 19% and 25% empty bunch biomass.',
      suggestedValue: 22.0,
    });
  }
  if (
    mill.pksGenerationRatePercent < RSPO_V5_BENCHMARKS.pksGenerationRatePercent.hardMin ||
    mill.pksGenerationRatePercent > RSPO_V5_BENCHMARKS.pksGenerationRatePercent.hardMax
  ) {
    issues.push({
      fieldKey: 'pksGenerationRatePercent',
      label: 'PKS Generation Rate %',
      tab: 'mill-ops',
      severity: 'error',
      currentValue: mill.pksGenerationRatePercent,
      unit: '%',
      benchmarkRangeText: '4.5% – 7.5% of FFB',
      citation: RSPO_V5_BENCHMARKS.pksGenerationRatePercent.citation,
      message: `Implausible PKS rate: ${mill.pksGenerationRatePercent}% (allowable 2%–11%).`,
      rationale: 'Kernel shell generation is benchmarked at 5%–7% of processed FFB.',
      suggestedValue: 6.0,
    });
  }
  if (
    mill.fibreGenerationRatePercent < RSPO_V5_BENCHMARKS.fibreGenerationRatePercent.hardMin ||
    mill.fibreGenerationRatePercent > RSPO_V5_BENCHMARKS.fibreGenerationRatePercent.hardMax
  ) {
    issues.push({
      fieldKey: 'fibreGenerationRatePercent',
      label: 'Mesocarp Fibre Rate %',
      tab: 'mill-ops',
      severity: 'error',
      currentValue: mill.fibreGenerationRatePercent,
      unit: '%',
      benchmarkRangeText: '11.5% – 15.5% of FFB',
      citation: RSPO_V5_BENCHMARKS.fibreGenerationRatePercent.citation,
      message: `Implausible fibre rate: ${mill.fibreGenerationRatePercent}% (allowable 7%–20%).`,
      rationale: 'Press mesocarp fibre yields 12%–15% of processed bunch mass.',
      suggestedValue: 13.5,
    });
  }

  // 27. Biomass Export Quantities
  if (mill.pksExportTon < 0) {
    issues.push({
      fieldKey: 'pksExportTon',
      label: 'PKS Biomass Export',
      tab: 'mill-ops',
      severity: 'error',
      currentValue: mill.pksExportTon,
      unit: 'Ton',
      benchmarkRangeText: '≥ 0 Ton',
      citation: 'RSPO PalmGHG v5 Section 3.2.1 (Biomass Export Credits)',
      message: 'Exported PKS tonnage cannot be negative.',
      rationale: 'Export quantity must be non-negative.',
      suggestedValue: 0,
    });
  }
  if (mill.efbExportTon < 0) {
    issues.push({
      fieldKey: 'efbExportTon',
      label: 'EFB Biomass Export',
      tab: 'mill-ops',
      severity: 'error',
      currentValue: mill.efbExportTon,
      unit: 'Ton',
      benchmarkRangeText: '≥ 0 Ton',
      citation: 'RSPO PalmGHG v5 Section 3.2.1',
      message: 'Exported EFB tonnage cannot be negative.',
      rationale: 'Export quantity must be non-negative.',
      suggestedValue: 0,
    });
  }
  if (mill.mesocarpFibreExportTon < 0) {
    issues.push({
      fieldKey: 'mesocarpFibreExportTon',
      label: 'Mesocarp Fibre Export',
      tab: 'mill-ops',
      severity: 'error',
      currentValue: mill.mesocarpFibreExportTon,
      unit: 'Ton',
      benchmarkRangeText: '≥ 0 Ton',
      citation: 'RSPO PalmGHG v5 Section 3.2.1 (Mesocarp Fibre Export [NEW])',
      message: 'Exported mesocarp fibre tonnage cannot be negative.',
      rationale: 'Export quantity must be non-negative.',
      suggestedValue: 0,
    });
  }

  // 28. Methane Utilization Routing Split
  if (mill.treatmentAllocationMethaneCapturePercent > 0) {
    const utilSum =
      mill.methaneGasEngineUtilizationPercent +
      mill.methaneBoilerUtilizationPercent +
      mill.methaneEnclosedFlaringPercent +
      mill.methaneOpenFlaringPercent;

    if (Math.abs(utilSum - 100) > 0.5) {
      issues.push({
        fieldKey: 'methaneUtilizationSplit',
        label: 'Methane Utilization Routing Split',
        tab: 'mill-pome',
        severity: 'warning',
        currentValue: utilSum,
        unit: '%',
        benchmarkRangeText: 'Sum to 100% (Gas Engine + Boiler + Flares)',
        citation: 'RSPO PalmGHG v5 Subbab 3.3.3.4 (Methane Destination Accounting)',
        message: `Methane utilization routes sum to ${utilSum.toFixed(1)}% instead of 100%.`,
        rationale: 'Captured methane must be accounted across gas engines, boilers, or flaring.',
        suggestedValue: 100,
      });
    }
  }

  // 29. Mill Auxiliary Fuel, Biomass Boiler & Electricity
  if (mill.millStationaryDieselLiters < 0) {
    issues.push({
      fieldKey: 'millStationaryDieselLiters',
      label: 'Mill Stationary Diesel',
      tab: 'mill-pome',
      severity: 'error',
      currentValue: mill.millStationaryDieselLiters,
      unit: 'Liters',
      benchmarkRangeText: '≥ 0 Liters',
      citation: 'RSPO PalmGHG v5 Section 3.4.1 (Mill Auxiliary Fuel)',
      message: 'Mill stationary diesel volume cannot be negative.',
      rationale: 'Fuel volume must be non-negative.',
      suggestedValue: 0,
    });
  }
  if (mill.millMobileDieselLiters < 0) {
    issues.push({
      fieldKey: 'millMobileDieselLiters',
      label: 'Mill Mobile Diesel',
      tab: 'mill-pome',
      severity: 'error',
      currentValue: mill.millMobileDieselLiters,
      unit: 'Liters',
      benchmarkRangeText: '≥ 0 Liters',
      citation: 'RSPO PalmGHG v5 Section 3.4.1 (Mill Mobile Equipment)',
      message: 'Mill mobile diesel volume cannot be negative.',
      rationale: 'Fuel volume must be non-negative.',
      suggestedValue: 0,
    });
  }
  if (mill.biomassBurnedBoilerTon < 0) {
    issues.push({
      fieldKey: 'biomassBurnedBoilerTon',
      label: 'Biomass Burned in Boiler',
      tab: 'mill-pome',
      severity: 'error',
      currentValue: mill.biomassBurnedBoilerTon,
      unit: 'Ton',
      benchmarkRangeText: '≥ 0 Ton',
      citation: 'RSPO PalmGHG v5 Section 3.4.2 (Biogenic Boiler Combustion)',
      message: 'Boiler biomass fuel cannot be negative.',
      rationale: 'Biomass fuel tonnage must be non-negative.',
      suggestedValue: 0,
    });
  }
  if (mill.millGridElectricityKwh < 0) {
    issues.push({
      fieldKey: 'millGridElectricityKwh',
      label: 'Mill Grid Electricity',
      tab: 'mill-pome',
      severity: 'error',
      currentValue: mill.millGridElectricityKwh,
      unit: 'kWh',
      benchmarkRangeText: '≥ 0 kWh',
      citation: 'RSPO PalmGHG v5 Section 3.4.3 (Mill Scope 2 Electricity)',
      message: 'Mill grid electricity cannot be negative.',
      rationale: 'Purchased electricity consumption must be non-negative.',
      suggestedValue: 0,
    });
  }
  if (mill.excessElectricityExportGridKwh < 0) {
    issues.push({
      fieldKey: 'excessElectricityExportGridKwh',
      label: 'Electricity Export to Grid',
      tab: 'mill-pome',
      severity: 'error',
      currentValue: mill.excessElectricityExportGridKwh,
      unit: 'kWh',
      benchmarkRangeText: '≥ 0 kWh',
      citation: 'RSPO PalmGHG v5 Section 3.4.4 (Emissions Avoided Export)',
      message: 'Grid electricity export cannot be negative.',
      rationale: 'Exported renewable power must be non-negative.',
      suggestedValue: 0,
    });
  }

  // Construct summary records
  const byField: Record<string, ValidationIssue> = {};
  const byTab: Record<string, ValidationIssue[]> = {
    planting: [],
    'fert-fuel': [],
    'mill-ops': [],
    'mill-pome': [],
  };

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const issue of issues) {
    byField[issue.fieldKey] = issue;
    if (byTab[issue.tab]) {
      byTab[issue.tab].push(issue);
    }
    if (issue.severity === 'error') totalErrors++;
    if (issue.severity === 'warning') totalWarnings++;
  }

  return {
    issues,
    byField,
    byTab,
    totalErrors,
    totalWarnings,
    isFullyCompliant: issues.length === 0,
  };
}
