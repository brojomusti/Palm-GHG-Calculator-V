/**
 * RSPO PalmGHG Version 5 CSV Inventory Import & Export Handler
 * Aligned with GHG Protocol Land Sector and Removals (LSR) Standard v1.1
 */

import { EstateParameters, MillParameters } from '../types/palmghg';
import { validatePalmGhgData, ValidationIssue } from './palmGhgValidation';

export interface ParameterDefinition {
  key: string;
  domain: 'estate' | 'mill';
  category: string;
  label: string;
  unit: string;
  defaultValue: number;
  description: string;
  rspoRef: string;
}

export const INVENTORY_PARAMETERS: ParameterDefinition[] = [
  // --- ESTATE: Planting & Land Management (LSR v1.1) ---
  {
    key: 'totalPlantedAreaHa',
    domain: 'estate',
    category: 'Planting & Peat',
    label: 'Total Planted Area',
    unit: 'ha',
    defaultValue: 9000,
    description: 'Gross certified oil palm planted area within UoC operational boundary',
    rspoRef: 'RSPO PalmGHG v5 §3.1 / LSR v1.1',
  },
  {
    key: 'peatSoilAreaHa',
    domain: 'estate',
    category: 'Planting & Peat',
    label: 'Peat Soil Area',
    unit: 'ha',
    defaultValue: 1200,
    description: 'Cultivated organic soil area with active drainage canals',
    rspoRef: 'RSPO PalmGHG v5 §3.2 (54.6 tCO2e/ha/yr default)',
  },
  {
    key: 'peatDrainageDepthCm',
    domain: 'estate',
    category: 'Planting & Peat',
    label: 'Mean Water Table / Drainage Depth',
    unit: 'cm',
    defaultValue: 60,
    description: 'Average peat water table drainage depth below ground level (RSPO BMP 40-60 cm)',
    rspoRef: 'RSPO BMP Peat Drain Depth',
  },
  {
    key: 'mineralSoilAreaHa',
    domain: 'estate',
    category: 'Planting & Peat',
    label: 'Mineral Soil Area',
    unit: 'ha',
    defaultValue: 7800,
    description: 'Cultivated mineral upland/alluvial soil area',
    rspoRef: 'RSPO PalmGHG v5 §3.1',
  },
  {
    key: 'grossLucTotalTco2e',
    domain: 'estate',
    category: 'Planting & Peat',
    label: 'Gross Land Use Change (LUC) Carbon Debt',
    unit: 'tCO2e',
    defaultValue: 125000,
    description: 'Total historical land conversion carbon debt for 25-year amortisation',
    rspoRef: 'GHG Protocol LSR §4.2 Linear Amortisation',
  },
  {
    key: 'grossLucAmortisationYears',
    domain: 'estate',
    category: 'Planting & Peat',
    label: 'LUC Amortisation Period',
    unit: 'years',
    defaultValue: 25,
    description: 'V5 mandates 25-year linear amortisation period',
    rspoRef: 'RSPO V5 Rules §4.1',
  },
  {
    key: 'croplandConversionHa',
    domain: 'estate',
    category: 'Planting & Peat',
    label: 'Cropland Conversion Area',
    unit: 'ha',
    defaultValue: 450,
    description: 'Previous agricultural cropland converted to perennial oil palm',
    rspoRef: 'IPCC Tier 1 SOC Factors',
  },
  {
    key: 'croplandManagementFactor',
    domain: 'estate',
    category: 'Planting & Peat',
    label: 'Cropland Soil Carbon Factor Change',
    unit: 'tCO2e/ha/yr',
    defaultValue: 1.2,
    description: 'Soil organic carbon stock enhancement factor over mineral cropland',
    rspoRef: 'IPCC 2019 Refinement',
  },

  // --- ESTATE: Standing Retired Palm & Carbon Removals (LSR v1.1) ---
  {
    key: 'standingRetiredPalmAreaHa',
    domain: 'estate',
    category: 'Carbon Removals (LSR)',
    label: 'Standing Retired Oil Palm Area (>25 yrs)',
    unit: 'ha',
    defaultValue: 150,
    description: 'Unharvested, non-commercial mature stands preserved past commercial cycle',
    rspoRef: 'RSPO V5 New Feature §5.2',
  },
  {
    key: 'standingRetiredPalmSequestrationRate',
    domain: 'estate',
    category: 'Carbon Removals (LSR)',
    label: 'Standing Retired Palm Sequestration Rate',
    unit: 'tCO2e/ha/yr',
    defaultValue: 1.8,
    description: 'Empirical net carbon sequestration rate for unharvested mature palms',
    rspoRef: 'RSPO V5 Default 1.8 tCO2e/ha/yr',
  },
  {
    key: 'existingPlantationSequestrationRate',
    domain: 'estate',
    category: 'Carbon Removals (LSR)',
    label: 'Commercial Plantation Carbon Balance Rate',
    unit: 'tCO2e/ha/yr',
    defaultValue: 7.8,
    description: 'Gross biomass accumulation rate during 25-year commercial replanting cycle',
    rspoRef: 'RSPO Standard ~7.5 to 9.36 tCO2e/ha/yr',
  },
  {
    key: 'forestConservationAreaHa',
    domain: 'estate',
    category: 'Carbon Removals (LSR)',
    label: 'HCV Forest Conservation Area',
    unit: 'ha',
    defaultValue: 850,
    description: 'Protected primary/secondary High Conservation Value forest corridors',
    rspoRef: 'RSPO PalmGHG v5 §5.1 (-9.14 tCO2e/ha/yr)',
  },
  {
    key: 'forestConservationRate',
    domain: 'estate',
    category: 'Carbon Removals (LSR)',
    label: 'Forest Conservation Removals Rate',
    unit: 'tCO2e/ha/yr',
    defaultValue: 9.14,
    description: 'Verified annual sequestration rate for conserved tropical forest',
    rspoRef: 'RSPO V5 Default 9.14 tCO2e/ha/yr',
  },
  {
    key: 'nonForestConservationAreaHa',
    domain: 'estate',
    category: 'Carbon Removals (LSR)',
    label: 'Non-Forest Conservation Area',
    unit: 'ha',
    defaultValue: 220,
    description: 'Conserved scrubland, grasslands, and riparian buffer belts',
    rspoRef: 'RSPO V5 New Category (-2.4 tCO2e/ha/yr)',
  },
  {
    key: 'nonForestConservationRate',
    domain: 'estate',
    category: 'Carbon Removals (LSR)',
    label: 'Non-Forest Conservation Removals Rate',
    unit: 'tCO2e/ha/yr',
    defaultValue: 2.4,
    description: 'Verified annual sequestration rate for conserved non-forest buffers',
    rspoRef: 'RSPO V5 Default 2.4 tCO2e/ha/yr',
  },
  {
    key: 'peatlandConservationAreaHa',
    domain: 'estate',
    category: 'Carbon Removals (LSR)',
    label: 'Peatland Conservation / Rewetted Area',
    unit: 'ha',
    defaultValue: 180,
    description: 'Undrained, conserved or rewetted peatland tracts with positive water tables',
    rspoRef: 'RSPO PalmGHG v5 (-5.5 tCO2e/ha/yr avoided flux)',
  },
  {
    key: 'otherEligibleCarbonRemovalsTco2e',
    domain: 'estate',
    category: 'Carbon Removals (LSR)',
    label: 'Other Eligible Verified Removals',
    unit: 'tCO2e',
    defaultValue: 0,
    description: 'Third-party audited carbon removals complying with GHG Protocol LSR',
    rspoRef: 'LSR v1.1 Verification Criteria',
  },

  // --- ESTATE: Fertiliser Application & Recycled Organics ---
  {
    key: 'syntheticNStandardKg',
    domain: 'estate',
    category: 'Fertilisers',
    label: 'Standard Synthetic Nitrogen',
    unit: 'kg N/yr',
    defaultValue: 950000,
    description: 'Untreated synthetic nitrogen fertiliser applied (Urea, Ammonium Nitrate/Sulfate)',
    rspoRef: 'IPCC Tier 1 Direct (1%) + Indirect Volatilization',
  },
  {
    key: 'syntheticNInhibitedKg',
    domain: 'estate',
    category: 'Fertilisers',
    label: 'NI/UI Treated Synthetic Nitrogen',
    unit: 'kg N/yr',
    defaultValue: 150000,
    description: 'Nitrogen fertiliser treated with Nitrification or Urease Inhibitors (35% N2O reduction)',
    rspoRef: 'RSPO V5 Advanced Technology §6.1',
  },
  {
    key: 'syntheticP2O5Kg',
    domain: 'estate',
    category: 'Fertilisers',
    label: 'Phosphate Fertiliser (P2O5)',
    unit: 'kg P2O5/yr',
    defaultValue: 420000,
    description: 'Processed phosphate mineral fertilisers (TSP, DAP, MAP)',
    rspoRef: 'Scope 3 Cat 1 Manufacturing Emitted',
  },
  {
    key: 'syntheticK2OKg',
    domain: 'estate',
    category: 'Fertilisers',
    label: 'Potassium Fertiliser (K2O)',
    unit: 'kg K2O/yr',
    defaultValue: 780000,
    description: 'Muriate of Potash (MOP / Potassium Chloride)',
    rspoRef: 'Scope 3 Cat 1 Manufacturing Emitted',
  },
  {
    key: 'rockPhosphateKg',
    domain: 'estate',
    category: 'Fertilisers',
    label: 'Ground Rock Phosphate',
    unit: 'kg/yr',
    defaultValue: 350000,
    description: 'Direct application reactive rock phosphate (low embodied footprint)',
    rspoRef: 'Scope 3 Cat 1 Manufacturing Emitted',
  },
  {
    key: 'fertiliserTransportDistanceKm',
    domain: 'estate',
    category: 'Fertilisers',
    label: 'Fertiliser Transport Distance to Estate',
    unit: 'km',
    defaultValue: 65,
    description: 'Average haulage distance from regional port/blending depot to estate store',
    rspoRef: 'Scope 3 Cat 4 Inbound Freight',
  },
  {
    key: 'pomeLandApplicationM3',
    domain: 'estate',
    category: 'Recycled Organics',
    label: 'POME Land Application Volume',
    unit: 'm3/yr',
    defaultValue: 45000,
    description: 'Anaerobically treated or raw POME applied to furrow/flatbeds in estate blocks',
    rspoRef: 'RSPO V5 Estate Recycled Organics §6.3',
  },
  {
    key: 'compostLandApplicationTon',
    domain: 'estate',
    category: 'Recycled Organics',
    label: 'Compost Field Application',
    unit: 'ton/yr',
    defaultValue: 12000,
    description: 'Composted biomass (EFB + POME) returned to estate oil palm fields',
    rspoRef: 'RSPO V5 Organics Nutrient Cycling',
  },
  {
    key: 'efbMulchingTon',
    domain: 'estate',
    category: 'Recycled Organics',
    label: 'Empty Fruit Bunch (EFB) Mulching',
    unit: 'ton/yr',
    defaultValue: 22000,
    description: 'Raw empty fruit bunches distributed around palm weeded circles for mulch',
    rspoRef: 'RSPO V5 Circular Biomass',
  },

  // --- ESTATE: Fuels & Electricity ---
  {
    key: 'stationaryFuelDieselLiters',
    domain: 'estate',
    category: 'Fuels & Energy',
    label: 'Estate Stationary Diesel',
    unit: 'liters/yr',
    defaultValue: 180000,
    description: 'Stationary pumps, backup gensets, estate clinic and workshop generators',
    rspoRef: 'Scope 1 Combustion + Scope 3 Cat 3 WTT',
  },
  {
    key: 'mobileFuelDieselLiters',
    domain: 'estate',
    category: 'Fuels & Energy',
    label: 'Estate Mobile Diesel',
    unit: 'liters/yr',
    defaultValue: 480000,
    description: 'Tractors, heavy field prime movers, harvest lorries, wheel loaders',
    rspoRef: 'Scope 1 Combustion + Scope 3 Cat 3 WTT',
  },
  {
    key: 'biodieselBlendPercent',
    domain: 'estate',
    category: 'Fuels & Energy',
    label: 'Biodiesel Blend Rate (B-rating)',
    unit: '%',
    defaultValue: 35,
    description: 'Palm methyl ester blend percentage in diesel fuel (e.g. 35 for Indonesian B35)',
    rspoRef: 'Biogenic Carbon Partitioning §7.1',
  },
  {
    key: 'estateGridElectricityKwh',
    domain: 'estate',
    category: 'Fuels & Energy',
    label: 'Estate Purchased Grid Electricity',
    unit: 'kWh/yr',
    defaultValue: 320000,
    description: 'Public utility grid power consumed across estate office and division facilities',
    rspoRef: 'Scope 2 Location-Based + Scope 3 Cat 3 T&D',
  },

  // --- MILL: Production & Extraction Rates ---
  {
    key: 'cpoExtractionRatePercent',
    domain: 'mill',
    category: 'Mill Operations',
    label: 'Oil Extraction Rate (OER)',
    unit: '%',
    defaultValue: 21.6,
    description: 'CPO yield percentage per tonne of FFB processed (typical range 18% - 24%)',
    rspoRef: 'RSPO PalmGHG Production Metrics §2.1',
  },
  {
    key: 'pkExtractionRatePercent',
    domain: 'mill',
    category: 'Mill Operations',
    label: 'Kernel Extraction Rate (KER)',
    unit: '%',
    defaultValue: 5.3,
    description: 'Palm Kernel yield percentage per tonne of FFB processed (typical 4.5% - 7%)',
    rspoRef: 'RSPO PalmGHG Production Metrics §2.2',
  },
  {
    key: 'efbGenerationRatePercent',
    domain: 'mill',
    category: 'Mill Operations',
    label: 'EFB Generation Rate',
    unit: '%',
    defaultValue: 22.0,
    description: 'Empty Fruit Bunch co-product yield relative to raw FFB volume',
    rspoRef: 'RSPO V5 Default 22.0%',
  },
  {
    key: 'pksGenerationRatePercent',
    domain: 'mill',
    category: 'Mill Operations',
    label: 'PKS Generation Rate',
    unit: '%',
    defaultValue: 6.0,
    description: 'Palm Kernel Shell co-product yield relative to raw FFB volume',
    rspoRef: 'RSPO V5 Default 6.0%',
  },
  {
    key: 'fibreGenerationRatePercent',
    domain: 'mill',
    category: 'Mill Operations',
    label: 'Mesocarp Fibre Generation Rate',
    unit: '%',
    defaultValue: 13.5,
    description: 'Press cake mesocarp fibre yield relative to raw FFB volume',
    rspoRef: 'RSPO V5 Default 13.5%',
  },

  // --- MILL: Biomass Export & Avoided Emissions ---
  {
    key: 'pksExportTon',
    domain: 'mill',
    category: 'Biomass Export',
    label: 'PKS Exported for External Power',
    unit: 'ton/yr',
    defaultValue: 2500,
    description: 'Palm Kernel Shell sold externally for industrial boiler fuel substitution',
    rspoRef: 'Avoided Fossil Fuel Displacement §8.1',
  },
  {
    key: 'efbExportTon',
    domain: 'mill',
    category: 'Biomass Export',
    label: 'EFB Exported for External Energy',
    unit: 'ton/yr',
    defaultValue: 0,
    description: 'Dry or shredded EFB exported to external power plants or paper mills',
    rspoRef: 'Avoided Fossil Fuel Displacement §8.2',
  },
  {
    key: 'mesocarpFibreExportTon',
    domain: 'mill',
    category: 'Biomass Export',
    label: 'Mesocarp Fibre Exported',
    unit: 'ton/yr',
    defaultValue: 0,
    description: 'Surplus mesocarp fibre exported for off-site power generation',
    rspoRef: 'RSPO V5 Expanded Scope §8.3',
  },

  // --- MILL: POME & Wastewater Treatment ---
  {
    key: 'pomeGenerationRatioM3PerTonFfb',
    domain: 'mill',
    category: 'POME & Biogas',
    label: 'POME Generation Ratio',
    unit: 'm3/t FFB',
    defaultValue: 0.65,
    description: 'Liquid effluent generated per tonne of fresh fruit bunch processed (0.5 - 0.85)',
    rspoRef: 'RSPO V5 Standard m3 Metric §9.1',
  },
  {
    key: 'codInletMgPerL',
    domain: 'mill',
    category: 'POME & Biogas',
    label: 'Raw POME COD Inlet Concentration',
    unit: 'mg/L',
    defaultValue: 54000,
    description: 'Chemical Oxygen Demand entering the primary treatment system (typical 45k - 65k mg/L)',
    rspoRef: 'RSPO PalmGHG v5 §9.2 Methane Stoichiometry',
  },
  {
    key: 'treatmentAllocationOpenLagoonPercent',
    domain: 'mill',
    category: 'POME & Biogas',
    label: 'POME Allocation: Open Anaerobic Lagoon',
    unit: '%',
    defaultValue: 70,
    description: 'Fraction of total effluent directed to un-captured open anaerobic ponds (MCF 0.80)',
    rspoRef: 'IPCC Wastewater MCF 0.80',
  },
  {
    key: 'treatmentAllocationCompostPercent',
    domain: 'mill',
    category: 'POME & Biogas',
    label: 'POME Allocation: Aerobic Composting',
    unit: '%',
    defaultValue: 20,
    description: 'Fraction of total effluent pumped to co-composting windrows (MCF 0.05)',
    rspoRef: 'RSPO V5 Mitigation §9.4',
  },
  {
    key: 'treatmentAllocationMethaneCapturePercent',
    domain: 'mill',
    category: 'POME & Biogas',
    label: 'POME Allocation: Biogas Digester / Methane Capture',
    unit: '%',
    defaultValue: 10,
    description: 'Fraction of total effluent processed in enclosed covered lagoon or CSTR digester',
    rspoRef: 'RSPO V5 Biogas Mitigation §9.5',
  },

  // --- MILL: Methane Utilization & Flaring ---
  {
    key: 'biogasMethaneContentPercent',
    domain: 'mill',
    category: 'POME & Biogas',
    label: 'Biogas Methane (CH4) Concentration',
    unit: '%',
    defaultValue: 60,
    description: 'Volumetric percentage of methane in raw biogas (typical 55% - 65%)',
    rspoRef: 'RSPO V5 Default 60% CH4',
  },
  {
    key: 'methaneCaptureEfficiencyPercent',
    domain: 'mill',
    category: 'POME & Biogas',
    label: 'Digester Methane Capture Efficiency',
    unit: '%',
    defaultValue: 88,
    description: 'Capture efficiency of the gas containment system before fugitive vents',
    rspoRef: 'RSPO V5 Digester Performance (85-95%)',
  },
  {
    key: 'methaneGasEngineUtilizationPercent',
    domain: 'mill',
    category: 'POME & Biogas',
    label: 'Biogas Utilization: Gas Engine Gensets',
    unit: '%',
    defaultValue: 0,
    description: 'Fraction of captured methane piped to reciprocating gas engines for power',
    rspoRef: 'RSPO V5 Energy Recovery §9.6',
  },
  {
    key: 'methaneBoilerUtilizationPercent',
    domain: 'mill',
    category: 'POME & Biogas',
    label: 'Biogas Utilization: Mill Steam Boilers',
    unit: '%',
    defaultValue: 40,
    description: 'Fraction of captured methane co-fired in mill steam boilers',
    rspoRef: 'RSPO V5 Thermal Energy §9.7',
  },
  {
    key: 'methaneEnclosedFlaringPercent',
    domain: 'mill',
    category: 'POME & Biogas',
    label: 'Biogas Flaring: High-Efficiency Enclosed Flare',
    unit: '%',
    defaultValue: 0,
    description: 'Fraction combusted in high-temperature enclosed ground flare (99.5% destruction)',
    rspoRef: 'RSPO V5 Enclosed Flare 99.5%',
  },
  {
    key: 'methaneOpenFlaringPercent',
    domain: 'mill',
    category: 'POME & Biogas',
    label: 'Biogas Flaring: Standard Open Flare / Candle',
    unit: '%',
    defaultValue: 60,
    description: 'Fraction combusted in elevated open flare stack (98% destruction efficiency)',
    rspoRef: 'RSPO V5 Open Flare 98.0%',
  },

  // --- MILL: Energy, Fuel & Export ---
  {
    key: 'millStationaryDieselLiters',
    domain: 'mill',
    category: 'Mill Energy & Fuel',
    label: 'Mill Stationary Diesel',
    unit: 'liters/yr',
    defaultValue: 95000,
    description: 'Mill backup gensets and auxiliary emergency black-start diesel generators',
    rspoRef: 'Scope 1 Stationary Combustion',
  },
  {
    key: 'millMobileDieselLiters',
    domain: 'mill',
    category: 'Mill Energy & Fuel',
    label: 'Mill Mobile Diesel',
    unit: 'liters/yr',
    defaultValue: 65000,
    description: 'Mill front-end loaders, overhead crane shunters, yard trucks and forklifts',
    rspoRef: 'Scope 1 Mobile Combustion',
  },
  {
    key: 'millGridElectricityKwh',
    domain: 'mill',
    category: 'Mill Energy & Fuel',
    label: 'Mill Purchased Grid Electricity',
    unit: 'kWh/yr',
    defaultValue: 450000,
    description: 'Grid electricity imported during mill maintenance shut-downs and non-processing hours',
    rspoRef: 'Scope 2 Location-Based Electricity',
  },
  {
    key: 'biomassBurnedBoilerTon',
    domain: 'mill',
    category: 'Mill Energy & Fuel',
    label: 'Solid Biomass Burned in Boilers (Shell & Fibre)',
    unit: 'ton/yr',
    defaultValue: 36000,
    description: 'Internal co-products combusted in biomass water-tube boiler for process steam and turbo-alternator',
    rspoRef: 'Biogenic Carbon Accounting §10.1',
  },
  {
    key: 'excessElectricityExportGridKwh',
    domain: 'mill',
    category: 'Mill Energy & Fuel',
    label: 'Excess Clean Electricity Exported to National Grid',
    unit: 'kWh/yr',
    defaultValue: 0,
    description: 'Surplus power generated from biomass steam turbine or biogas engines exported to the public grid',
    rspoRef: 'Avoided Emissions Grid Displacement §10.2',
  },
];

// Quick index lookup
export const PARAMETER_MAP = new Map<string, ParameterDefinition>(
  INVENTORY_PARAMETERS.map((p) => [p.key.toLowerCase(), p])
);

/**
 * Result structure for diff preview
 */
export interface CsvParamDiff {
  key: string;
  domain: 'estate' | 'mill';
  category: string;
  label: string;
  unit: string;
  currentValue: number;
  importedValue: number;
  hasChanged: boolean;
  rspoRef: string;
  status: 'updated' | 'unchanged' | 'warning' | 'error';
  auditNote?: string;
}

export interface CsvParseResult {
  newEstate: EstateParameters;
  newMill: MillParameters;
  diffs: CsvParamDiff[];
  detectedDelimiter: string;
  totalParsedRows: number;
  recognizedCount: number;
  changedCount: number;
  unrecognizedKeys: string[];
  parseWarnings: string[];
  validationIssues: ValidationIssue[];
}

/**
 * Generate CSV text template
 */
export function generateSampleCsvContent(
  mode: 'template' | 'current' = 'template',
  currentEstate?: EstateParameters,
  currentMill?: MillParameters
): string {
  const lines: string[] = [];

  // Metadata comments header
  lines.push('# ==============================================================================');
  lines.push('# RSPO PalmGHG Version 5 (V5) - Standard GHG Inventory Data Import Template');
  lines.push('# Aligned with GHG Protocol Land Sector and Removals (LSR) Standard v1.1');
  lines.push(`# Export Timestamp: ${new Date().toISOString()}`);
  lines.push('#');
  lines.push('# Instructions for filling:');
  lines.push('# 1. Modify the values in the "Value" column for your Unit of Certification (UoC).');
  lines.push('# 2. Do NOT alter the "Category" or "Parameter_Key" columns.');
  lines.push('# 3. Numerical values should not contain currency symbols or unit text.');
  lines.push('# 4. Both comma (,) and semicolon (;) separated files are automatically supported.');
  lines.push('# ==============================================================================');
  lines.push('');
  
  // CSV Column Headers
  lines.push('Category,Parameter_Key,Parameter_Label,Value,Unit,RSPO_Reference_Notes');

  for (const def of INVENTORY_PARAMETERS) {
    let val = def.defaultValue;
    if (mode === 'current') {
      if (def.domain === 'estate' && currentEstate) {
        const currentVal = (currentEstate as unknown as Record<string, number>)[def.key];
        if (typeof currentVal === 'number') val = currentVal;
      } else if (def.domain === 'mill' && currentMill) {
        const currentVal = (currentMill as unknown as Record<string, number>)[def.key];
        if (typeof currentVal === 'number') val = currentVal;
      }
    }

    const domainLabel = def.domain === 'estate' ? 'Estate' : 'Mill';
    // Quote string fields that might have commas
    const escapedLabel = `"${def.label.replace(/"/g, '""')}"`;
    const escapedUnit = `"${def.unit}"`;
    const escapedRef = `"${(def.description + ' (' + def.rspoRef + ')').replace(/"/g, '""')}"`;

    lines.push(`${domainLabel},${def.key},${escapedLabel},${val},${escapedUnit},${escapedRef}`);
  }

  return lines.join('\r\n');
}

/**
 * Browser file download helper
 */
export function triggerFileDownload(content: string, filename: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Detect delimiter from text sample
 */
function detectDelimiter(text: string): string {
  const sample = text.slice(0, 4000);
  const commaCount = (sample.match(/,/g) || []).length;
  const semicolonCount = (sample.match(/;/g) || []).length;
  const tabCount = (sample.match(/\t/g) || []).length;

  if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
  if (semicolonCount > commaCount) return ';';
  return ',';
}

/**
 * Robust CSV line splitter that respects quoted strings containing delimiters
 */
function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Clean and parse float from string, handling European decimals and commas in numbers
 */
function cleanNumericValue(raw: string): number {
  if (!raw) return NaN;
  let s = raw.trim().replace(/["']/g, '');
  // If format is like "9,300" or "9 300"
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
    s = s.replace(/,/g, '');
  } else if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    // European style 9.300,50 -> 9300.50
    s = s.replace(/\./g, '').replace(/,/g, '.');
  } else if (/^-?\d+,\d+$/.test(s)) {
    // European decimal 21,5 -> 21.5
    s = s.replace(/,/g, '.');
  }
  return parseFloat(s);
}

/**
 * Main CSV Parser for RSPO PalmGHG v5 GHG Inventory data
 */
export function parseInventoryCsv(
  csvText: string,
  currentEstate: EstateParameters,
  currentMill: MillParameters
): CsvParseResult {
  const delimiter = detectDelimiter(csvText);
  const rawLines = csvText.split(/\r?\n/);
  
  const unrecognizedKeys: string[] = [];
  const parseWarnings: string[] = [];
  const extractedMap = new Map<string, number>();

  let totalParsedRows = 0;
  let headerColumns: string[] | null = null;
  let isWideFormat = false;

  for (let lineIndex = 0; lineIndex < rawLines.length; lineIndex++) {
    const rawLine = rawLines[lineIndex].trim();
    if (!rawLine || rawLine.startsWith('#')) {
      continue; // skip empty and commented lines
    }

    const columns = splitCsvLine(rawLine, delimiter);
    if (columns.length === 0) continue;

    // Check if this is a header row
    const lowerFirst = columns[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (
      lowerFirst === 'category' ||
      lowerFirst === 'parameterkey' ||
      lowerFirst === 'key' ||
      lowerFirst === 'parameter'
    ) {
      headerColumns = columns.map((c) => c.toLowerCase().trim());
      continue;
    }

    // Check for wide format: Row 1 had multiple parameter keys
    if (lineIndex === 0 && columns.some((c) => PARAMETER_MAP.has(c.toLowerCase().trim()))) {
      isWideFormat = true;
      headerColumns = columns.map((c) => c.trim());
      continue;
    }

    if (isWideFormat && headerColumns) {
      // Row contains values corresponding to headerColumns
      headerColumns.forEach((colKey, colIdx) => {
        const matched = PARAMETER_MAP.get(colKey.toLowerCase());
        if (matched && colIdx < columns.length) {
          const num = cleanNumericValue(columns[colIdx]);
          if (!isNaN(num)) {
            extractedMap.set(matched.key, num);
          }
        }
      });
      totalParsedRows++;
      continue;
    }

    // Standard row format:
    // Columns might be:
    // [Category, Key, Label, Value, Unit, ...] -> Key is index 1, Value is index 3
    // or [Key, Value] -> Key is index 0, Value is index 1
    // or [Category, Key, Value] -> Key is index 1, Value is index 2
    totalParsedRows++;
    let candidateKey = '';
    let candidateValueStr = '';

    if (columns.length >= 4 && (columns[0].toLowerCase() === 'estate' || columns[0].toLowerCase() === 'mill')) {
      candidateKey = columns[1];
      candidateValueStr = columns[3];
    } else if (columns.length === 2) {
      candidateKey = columns[0];
      candidateValueStr = columns[1];
    } else if (columns.length === 3) {
      // Could be [Estate, Key, Value] or [Key, Label, Value]
      if (columns[0].toLowerCase() === 'estate' || columns[0].toLowerCase() === 'mill') {
        candidateKey = columns[1];
        candidateValueStr = columns[2];
      } else {
        candidateKey = columns[0];
        candidateValueStr = columns[2];
      }
    } else if (columns.length > 4) {
      // Try to find known key in first 3 columns
      for (let ci = 0; ci < Math.min(3, columns.length); ci++) {
        const testKey = columns[ci].toLowerCase().trim();
        if (PARAMETER_MAP.has(testKey)) {
          candidateKey = columns[ci];
          // Value is usually the next column or column 3
          candidateValueStr = columns[ci === 1 ? 3 : ci + 1] || columns[ci + 1];
          break;
        }
      }
    }

    if (!candidateKey) {
      continue;
    }

    const cleanKey = candidateKey.trim().replace(/^["']|["']$/g, '');
    const matchedParam = PARAMETER_MAP.get(cleanKey.toLowerCase());

    if (!matchedParam) {
      unrecognizedKeys.push(cleanKey);
      continue;
    }

    const numericVal = cleanNumericValue(candidateValueStr);
    if (isNaN(numericVal)) {
      parseWarnings.push(`Row ${lineIndex + 1}: Could not parse numerical value "${candidateValueStr}" for parameter "${matchedParam.label}".`);
      continue;
    }

    extractedMap.set(matchedParam.key, numericVal);
  }

  // Construct updated Estate and Mill objects
  const newEstate: EstateParameters = { ...currentEstate };
  const newMill: MillParameters = { ...currentMill };

  for (const [key, val] of extractedMap.entries()) {
    const def = PARAMETER_MAP.get(key.toLowerCase());
    if (def) {
      if (def.domain === 'estate') {
        (newEstate as unknown as Record<string, number>)[def.key] = val;
      } else {
        (newMill as unknown as Record<string, number>)[def.key] = val;
      }
    }
  }

  // Run RSPO PalmGHG v5 benchmark validation engine on updated dataset
  const validationSummary = validatePalmGhgData(newEstate, newMill);
  const issuesByField = new Map<string, ValidationIssue>();
  for (const issue of validationSummary.issues) {
    issuesByField.set(issue.fieldKey, issue);
  }

  // Build diff records for all recognized parameters
  const diffs: CsvParamDiff[] = [];
  let recognizedCount = 0;
  let changedCount = 0;

  for (const def of INVENTORY_PARAMETERS) {
    const isImported = extractedMap.has(def.key);
    let currentVal = 0;
    let importedVal = 0;

    if (def.domain === 'estate') {
      currentVal = (currentEstate as unknown as Record<string, number>)[def.key] ?? 0;
      importedVal = isImported ? extractedMap.get(def.key)! : currentVal;
    } else {
      currentVal = (currentMill as unknown as Record<string, number>)[def.key] ?? 0;
      importedVal = isImported ? extractedMap.get(def.key)! : currentVal;
    }

    if (isImported) recognizedCount++;
    const hasChanged = isImported && Math.abs(currentVal - importedVal) > 0.00001;
    if (hasChanged) changedCount++;

    const issue = issuesByField.get(def.key);
    let status: 'updated' | 'unchanged' | 'warning' | 'error' = 'unchanged';
    if (issue) {
      status = issue.severity === 'error' ? 'error' : 'warning';
    } else if (hasChanged) {
      status = 'updated';
    }

    diffs.push({
      key: def.key,
      domain: def.domain,
      category: def.category,
      label: def.label,
      unit: def.unit,
      currentValue: currentVal,
      importedValue: importedVal,
      hasChanged,
      rspoRef: def.rspoRef,
      status,
      auditNote: issue ? `${issue.message} (${issue.benchmarkRangeText})` : undefined,
    });
  }

  return {
    newEstate,
    newMill,
    diffs,
    detectedDelimiter: delimiter === '\t' ? 'Tab (TSV)' : delimiter === ';' ? 'Semicolon (;)' : 'Comma (,)',
    totalParsedRows,
    recognizedCount,
    changedCount,
    unrecognizedKeys,
    parseWarnings,
    validationIssues: validationSummary.issues,
  };
}
