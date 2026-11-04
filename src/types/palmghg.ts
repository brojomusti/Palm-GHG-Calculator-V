/**
 * RSPO PalmGHG Version 5 (V5) Data Types & Schemas
 * Aligned with GHG Protocol Land Sector and Removals (LSR) Standard v1.1
 */

export type SupplySourceType = 'own_within_uoc' | 'group_within_uoc' | 'group_outside_uoc' | 'third_party_independent' | 'third_party_collection';

export interface FFBSourceAllocation {
  id: string;
  sourceType: SupplySourceType;
  name: string;
  ffbVolumeTon: number; // Ton FFB / year
  transportDistanceKm: number; // km from estate to mill
  plantedAreaHa: number; // ha
  isDirectlyManaged: boolean; // Operational control
  yieldTonPerHa: number;
}

export interface EstateParameters {
  // 1. Planting Data & Land Management (LSR v1.1)
  totalPlantedAreaHa: number;
  peatSoilAreaHa: number;
  peatDrainageDepthCm: number; // default ~60 cm
  mineralSoilAreaHa: number;
  grossLucTotalTco2e: number; // Total gross Land Use Change carbon debt
  grossLucAmortisationYears: number; // Linear 25-year amortisation in V5
  croplandConversionHa: number; // Land Management: Cropland to Oil Palm
  croplandManagementFactor: number; // SOC factor change tCO2e/ha/yr

  // 2. Standing Retired Oil Palm (>25 years) [NEW in V5]
  standingRetiredPalmAreaHa: number;
  standingRetiredPalmSequestrationRate: number; // tCO2e/ha/yr (default ~1.8)

  // 3. Carbon Removals (Expanded Conservation Accounting) [NEW in V5]
  existingPlantationSequestrationRate: number; // tCO2e/ha/yr default ~ -7.5 to -9.36
  forestConservationAreaHa: number;
  forestConservationRate: number; // tCO2e/ha/yr default ~ -9.14
  nonForestConservationAreaHa: number; // Scrub/grassland default ~ -2.4
  nonForestConservationRate: number; // tCO2e/ha/yr default ~ -2.4
  peatlandConservationAreaHa: number; // Conserved pristine/rewetted peat default ~ -5.5
  otherEligibleCarbonRemovalsTco2e: number; // Custom verified removals

  // 4. Fertiliser Application (Synthetic, Inhibitors, and Recycled Organics)
  syntheticNStandardKg: number; // Standard inorganic Nitrogen (kg N/yr)
  syntheticNInhibitedKg: number; // NI/UI treated Nitrogen (kg N/yr) [NEW in V5]
  syntheticP2O5Kg: number; // Phosphorus (kg P2O5/yr)
  syntheticK2OKg: number; // Potassium (kg K2O/yr)
  rockPhosphateKg: number; // Rock phosphate (kg/yr)
  fertiliserTransportDistanceKm: number; // km transport to estate
  
  // Recycled Organics (Moved from Mill to Estate in V5)
  pomeLandApplicationM3: number; // m3 POME applied to land
  compostLandApplicationTon: number; // Ton compost applied to field
  efbMulchingTon: number; // Ton EFB applied to field for mulching

  // 5. Field Fuel & Electricity [NEW in V5: Upstream WTT & Biogenic]
  stationaryFuelDieselLiters: number; // Generator, stationary pumps
  mobileFuelDieselLiters: number; // Tractors, harvest trucks, heavy machinery
  biodieselBlendPercent: number; // e.g. 35 for B35 (35% biogenic palm methyl ester)
  estateGridElectricityKwh: number; // Estate housing/offices grid electricity
}

export interface MillParameters {
  // 1. Extraction and Products
  cpoExtractionRatePercent: number; // OER (e.g. 21.5%)
  pkExtractionRatePercent: number; // KER (e.g. 5.2%)
  efbGenerationRatePercent: number; // % of FFB (default ~22%)
  pksGenerationRatePercent: number; // % of FFB (default ~6%)
  fibreGenerationRatePercent: number; // Mesocarp fibre % of FFB (default ~13.5%)

  // 2. Biomass Export for External Electricity Generation [V5 Expanded to Mesocarp Fibre]
  pksExportTon: number;
  efbExportTon: number;
  mesocarpFibreExportTon: number; // [NEW in V5]

  // 3. Palm Oil Mill Effluent (POME) [V5: m3 unit, COD inlet, detailed pathways]
  pomeGenerationRatioM3PerTonFfb: number; // m3 POME / ton FFB (default ~0.65 m3/t FFB)
  codInletMgPerL: number; // COD inlet to WWTP system (default ~55,000 mg/L)
  
  // Treatment allocation percentages (must sum to 100%)
  treatmentAllocationOpenLagoonPercent: number; // Anaerobic open pond
  treatmentAllocationCompostPercent: number; // Composting plant
  treatmentAllocationMethaneCapturePercent: number; // Biogas plant
  
  // Methane Capture parameters
  biogasMethaneContentPercent: number; // default ~60% CH4
  methaneCaptureEfficiencyPercent: number; // default ~90%
  methaneGasEngineUtilizationPercent: number; // % of captured gas to gas engines for electricity
  methaneBoilerUtilizationPercent: number; // % to biogas boilers for steam/power
  methaneEnclosedFlaringPercent: number; // % to enclosed flare (99.5% efficiency)
  methaneOpenFlaringPercent: number; // % to open flare (98% efficiency)

  // 4. Mill Energy & Fuel
  millStationaryDieselLiters: number; // Genset backup
  millMobileDieselLiters: number; // Mill wheel loaders, internal forklifts
  millGridElectricityKwh: number; // Grid electricity bought
  biomassBurnedBoilerTon: number; // Shell & Fibre burned in mill boiler (Biogenic)
  excessElectricityExportGridKwh: number; // Excess power sold to national grid
}

export interface EmissionItem {
  id: string;
  name: string;
  category: 'estate' | 'mill';
  scope: 'scope_1' | 'scope_2' | 'scope_3_cat1' | 'scope_3_cat3' | 'scope_3_cat4' | 'removal' | 'avoided' | 'biogenic';
  scopeLabel: string;
  subCategory: string;
  amountTco2e: number;
  isNewInV5: boolean;
  activityData: string;
  emissionFactorDescription: string;
  methodologyNote: string;
}

export interface PalmGHGAssessmentResults {
  // Estate Scope 1
  estateScope1FuelStationary: number;
  estateScope1FuelMobile: number;
  estateScope1FertiliserApp: number;
  estateScope1Peat: number;
  estateScope1LucAmortised: number;
  estateScope1LandManagement: number;
  totalEstateScope1: number;

  // Estate Scope 2
  estateScope2GridElectricity: number;

  // Estate Scope 3
  estateScope3Cat1FertiliserMfg: number;
  estateScope3Cat3FuelWtt: number;
  estateScope3Cat3ElectricityUpstream: number;
  estateScope3Cat4FertiliserTransport: number;
  totalEstateScope3: number;

  // Estate Optional Information
  estateRemovalExistingCropSeq: number;
  estateRemovalStandingPalmSeq: number;
  estateRemovalForestConservation: number;
  estateRemovalNonForestConservation: number;
  estateRemovalPeatlandConservation: number;
  estateRemovalOther: number;
  totalEstateCarbonRemovals: number;
  estateBiogenicFuelCarbon: number;

  // Mill Scope 1
  millScope1PomeLagoon: number;
  millScope1PomeMethaneUncombusted: number;
  millScope1FuelStationary: number;
  millScope1FuelMobile: number;
  totalMillScope1: number;

  // Mill Scope 2
  millScope2GridElectricity: number;

  // Mill Scope 3
  millScope3Cat1PurchasedFfb: number;
  millScope3Cat3FuelWtt: number;
  millScope3Cat3ElectricityUpstream: number;
  millScope3Cat4FfbTransport: number;
  totalMillScope3: number;

  // Mill Optional Information
  millAvoidedGridElectricityExport: number;
  millAvoidedBiomassExport: number;
  totalMillEmissionsAvoided: number;
  millBiogenicBoilerCarbon: number;

  // Totals & KPI Metrics
  totalScope1: number;
  totalScope2: number;
  totalScope3: number;
  totalGrossEmissions: number; // Scope 1 + Scope 2 + Scope 3
  totalCarbonRemovals: number;
  totalEmissionsAvoided: number;
  totalBiogenicCarbon: number;
  totalNetEmissions: number; // Total Gross - Total Carbon Removals - Total Emissions Avoided

  // Production Figures
  totalFfbProcessedTon: number;
  totalCpoProducedTon: number;
  totalPkProducedTon: number;
  
  // Intensities
  netGhgPerTonCpo: number; // tCO2e / t CPO
  grossGhgPerTonCpo: number;
  netGhgPerTonFfb: number; // tCO2e / t FFB
  grossGhgPerTonFfb: number;

  // Supply Base Allocations
  ownFfbTon: number;
  groupWithinUocFfbTon: number;
  groupOutsideUocFfbTon: number;
  thirdPartyFfbTon: number;
  scope1ManagedFfbTon: number;
  scope3PurchasedFfbTon: number;
}
