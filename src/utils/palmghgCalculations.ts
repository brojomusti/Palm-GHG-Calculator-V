/**
 * RSPO PalmGHG Version 5 (V5) Calculation Engine
 * Aligned with GHG Protocol LSR Standard v1.1 and RSPO V5 Rules
 */

import {
  EstateParameters,
  MillParameters,
  FFBSourceAllocation,
  PalmGHGAssessmentResults,
} from '../types/palmghg';

// Emission Factors & IPCC AR5 Constants
export const CONSTANTS = {
  GWP_CH4: 28, // IPCC AR5 GWP100 for Methane
  GWP_N2O: 265, // IPCC AR5 GWP100 for Nitrous Oxide
  N2O_TO_N_RATIO: 44 / 28, // Molecular conversion factor for N to N2O

  // Peat Soil Factors (tCO2e/ha/year)
  PEAT_DEFAULT_EMISSION_FACTOR: 54.6, // RSPO default for drained oil palm peat
  PEAT_CONSERVATION_FACTOR: -5.5, // Avoided degradation/flux for rewetted/conserved peat

  // Sequestration Factors (tCO2e/ha/year)
  EXISTING_OIL_PALM_SEQUESTRATION: -7.8, // Net carbon stock balance over commercial cycle
  STANDING_RETIRED_PALM_SEQUESTRATION: -1.8, // RSPO V5 retired oil palm >25 years
  FOREST_CONSERVATION_RATE: -9.14, // RSPO default for High Conservation Value (HCV) forest
  NON_FOREST_CONSERVATION_RATE: -2.4, // RSPO V5 non-forest conservation (riparian, grassland, scrub)

  // Fertiliser N2O Factors (IPCC Tier 1)
  N2O_DIRECT_STANDARD_N: 0.010, // 1.0% of applied N converted to N2O-N
  N2O_DIRECT_INHIBITED_N: 0.0065, // 35% reduction with Nitrification/Urease Inhibitors (NI/UI)
  N2O_INDIRECT_VOLATILISATION: 0.0010, // Atmospheric deposition fraction
  N2O_INDIRECT_LEACHING: 0.0011, // Leaching & runoff fraction

  // Fertiliser Manufacturing (Scope 3 Cat 1) - kg CO2e / kg nutrient
  FERT_MFG_N: 3.85,
  FERT_MFG_P2O5: 0.82,
  FERT_MFG_K2O: 0.58,
  FERT_MFG_ROCK_PHOSPHATE: 0.12,

  // Fertiliser Transport (Scope 3 Cat 4) - kg CO2e / tonne.km
  FERT_TRANSPORT_FACTOR: 0.000105, // ~0.105 kg CO2e per t.km

  // Diesel Fuel Factors (kg CO2e / Liter)
  DIESEL_SCOPE1_FOSSIL: 2.68, // Fossil combustion emission
  DIESEL_SCOPE3_WTT: 0.62, // Well-to-Tank upstream fuel supply chain
  DIESEL_BIOGENIC_FACTOR: 2.50, // Biogenic CO2 for biodiesel fraction (e.g. Palm Methyl Ester)

  // Grid Electricity Factors (kg CO2e / kWh)
  GRID_SCOPE2_EMISSION: 0.76, // Regional average grid intensity (kg CO2e/kWh)
  GRID_SCOPE3_FERA_UPSTREAM: 0.11, // Upstream generation fuel & T&D losses

  // POME & Methane Accounting
  COD_TO_B0_CH4: 0.25, // Maximum methane production capacity (kg CH4 / kg COD)
  MCF_OPEN_LAGOON: 0.80, // Methane correction factor for open anaerobic lagoon
  MCF_COMPOSTING: 0.05, // Aerobic composting minimizes anaerobic pockets
  FLARE_OPEN_EFFICIENCY: 0.980, // 98% CH4 destruction
  FLARE_ENCLOSED_EFFICIENCY: 0.995, // 99.5% CH4 destruction
  GAS_ENGINE_EFFICIENCY: 0.995, // 99.5% combustion in gas engine

  // Biomass Energy Substitution / Avoided Emissions (tCO2e avoided / ton biomass exported)
  AVOIDED_PKS_DISPLACEMENT: 0.95, // Displacing coal in external industrial boilers
  AVOIDED_EFB_DISPLACEMENT: 0.45, // Displacing fossil fuels in power plants
  AVOIDED_MESOCARP_FIBRE_DISPLACEMENT: 0.52, // [NEW in V5]
  AVOIDED_GRID_EXPORT_FACTOR: 0.76 / 1000, // tCO2e avoided per kWh exported
  
  // 3rd Party FFB Purchase Factor (Scope 3 Cat 1)
  PURCHASED_FFB_DEFAULT_EMISSION_FACTOR: 0.165, // tCO2e / ton FFB (standard RSPO proxy for smallholders)
  FFB_TRANSPORT_FACTOR_PER_TON_KM: 0.000095, // tCO2e / ton.km
};

export function calculatePalmGHGV5(
  estate: EstateParameters,
  mill: MillParameters,
  ffbSources: FFBSourceAllocation[]
): PalmGHGAssessmentResults {
  // 1. Supply Base & FFB Breakdown
  const totalFfbProcessedTon = ffbSources.reduce((sum, s) => sum + s.ffbVolumeTon, 0);
  
  let ownFfbTon = 0;
  let groupWithinUocFfbTon = 0;
  let groupOutsideUocFfbTon = 0;
  let thirdPartyFfbTon = 0;
  let scope1ManagedFfbTon = 0;
  let scope3PurchasedFfbTon = 0;
  let thirdPartyTransportTonKm = 0;

  ffbSources.forEach((source) => {
    if (source.sourceType === 'own_within_uoc') {
      ownFfbTon += source.ffbVolumeTon;
      scope1ManagedFfbTon += source.ffbVolumeTon;
    } else if (source.sourceType === 'group_within_uoc') {
      groupWithinUocFfbTon += source.ffbVolumeTon;
      if (source.isDirectlyManaged) {
        scope1ManagedFfbTon += source.ffbVolumeTon;
      } else {
        scope3PurchasedFfbTon += source.ffbVolumeTon;
        thirdPartyTransportTonKm += source.ffbVolumeTon * source.transportDistanceKm;
      }
    } else if (source.sourceType === 'group_outside_uoc') {
      groupOutsideUocFfbTon += source.ffbVolumeTon;
      scope3PurchasedFfbTon += source.ffbVolumeTon;
      thirdPartyTransportTonKm += source.ffbVolumeTon * source.transportDistanceKm;
    } else {
      // 3rd party independent or collection centre
      thirdPartyFfbTon += source.ffbVolumeTon;
      scope3PurchasedFfbTon += source.ffbVolumeTon;
      thirdPartyTransportTonKm += source.ffbVolumeTon * source.transportDistanceKm;
    }
  });

  // Calculate mill product yields
  const totalCpoProducedTon = totalFfbProcessedTon * (mill.cpoExtractionRatePercent / 100);
  const totalPkProducedTon = totalFfbProcessedTon * (mill.pkExtractionRatePercent / 100);

  // -------------------------------------------------------------
  // ESTATE CALCULATIONS
  // -------------------------------------------------------------
  
  // Fuel Blend Split (Fossil vs Biogenic)
  const bioRatio = Math.min(Math.max(estate.biodieselBlendPercent / 100, 0), 1);
  const fossilRatio = 1 - bioRatio;

  // Estate Scope 1: Fuel
  const estateScope1FuelStationary = (estate.stationaryFuelDieselLiters * fossilRatio * CONSTANTS.DIESEL_SCOPE1_FOSSIL) / 1000;
  const estateScope1FuelMobile = (estate.mobileFuelDieselLiters * fossilRatio * CONSTANTS.DIESEL_SCOPE1_FOSSIL) / 1000;

  // Estate Optional: Biogenic Carbon from Field Fuel
  const totalEstateDieselLiters = estate.stationaryFuelDieselLiters + estate.mobileFuelDieselLiters;
  const estateBiogenicFuelCarbon = (totalEstateDieselLiters * bioRatio * CONSTANTS.DIESEL_BIOGENIC_FACTOR) / 1000;

  // Estate Scope 1: Fertiliser Application (Direct & Indirect N2O)
  // Standard N direct + indirect
  const nStd = estate.syntheticNStandardKg;
  const stdDirectN2O_N = nStd * CONSTANTS.N2O_DIRECT_STANDARD_N;
  const stdIndirectN2O_N = nStd * (CONSTANTS.N2O_INDIRECT_VOLATILISATION + CONSTANTS.N2O_INDIRECT_LEACHING);
  const stdTotalN2O = (stdDirectN2O_N + stdIndirectN2O_N) * CONSTANTS.N2O_TO_N_RATIO;

  // Inhibited N (NI/UI treated) direct + indirect
  const nInh = estate.syntheticNInhibitedKg;
  const inhDirectN2O_N = nInh * CONSTANTS.N2O_DIRECT_INHIBITED_N;
  const inhIndirectN2O_N = nInh * (CONSTANTS.N2O_INDIRECT_VOLATILISATION + CONSTANTS.N2O_INDIRECT_LEACHING);
  const inhTotalN2O = (inhDirectN2O_N + inhIndirectN2O_N) * CONSTANTS.N2O_TO_N_RATIO;

  // Recycled Organics Soil N2O (Moved from Mill to Estate in V5)
  // POME applied to land (~3.5 kg N / m3) + Compost (~12 kg N / ton)
  const recycledN_Kg = (estate.pomeLandApplicationM3 * 0.0035 * 1000) + (estate.compostLandApplicationTon * 12);
  const recycledDirectN2O_N = recycledN_Kg * CONSTANTS.N2O_DIRECT_STANDARD_N;
  const recycledTotalN2O = recycledDirectN2O_N * CONSTANTS.N2O_TO_N_RATIO;

  const totalN2OTons = ((stdTotalN2O + inhTotalN2O + recycledTotalN2O) * CONSTANTS.GWP_N2O) / 1000;
  const estateScope1FertiliserApp = totalN2OTons;

  // Estate Scope 1: Peat Soil Emissions
  const estateScope1Peat = estate.peatSoilAreaHa * CONSTANTS.PEAT_DEFAULT_EMISSION_FACTOR;

  // Estate Scope 1: Land Use Change (Linear 25-Year Amortisation in V5)
  const estateScope1LucAmortised = estate.grossLucAmortisationYears > 0
    ? estate.grossLucTotalTco2e / estate.grossLucAmortisationYears
    : 0;

  // Estate Scope 1: Land Management (Cropland to Oil Palm)
  const estateScope1LandManagement = estate.croplandConversionHa * estate.croplandManagementFactor;

  const totalEstateScope1 =
    estateScope1FuelStationary +
    estateScope1FuelMobile +
    estateScope1FertiliserApp +
    estateScope1Peat +
    estateScope1LucAmortised +
    estateScope1LandManagement;

  // Estate Scope 2: Grid Electricity
  const estateScope2GridElectricity = (estate.estateGridElectricityKwh * CONSTANTS.GRID_SCOPE2_EMISSION) / 1000;

  // Estate Scope 3:
  // Cat 1: Fertiliser Manufacturing
  const fertMfgKgCo2e =
    (estate.syntheticNStandardKg + estate.syntheticNInhibitedKg) * CONSTANTS.FERT_MFG_N +
    estate.syntheticP2O5Kg * CONSTANTS.FERT_MFG_P2O5 +
    estate.syntheticK2OKg * CONSTANTS.FERT_MFG_K2O +
    estate.rockPhosphateKg * CONSTANTS.FERT_MFG_ROCK_PHOSPHATE;
  const estateScope3Cat1FertiliserMfg = fertMfgKgCo2e / 1000;

  // Cat 3: Fuel WTT and Upstream Electricity
  const estateScope3Cat3FuelWtt = (totalEstateDieselLiters * CONSTANTS.DIESEL_SCOPE3_WTT) / 1000;
  const estateScope3Cat3ElectricityUpstream = (estate.estateGridElectricityKwh * CONSTANTS.GRID_SCOPE3_FERA_UPSTREAM) / 1000;

  // Cat 4: Fertiliser Transport
  const totalFertiliserTons = (estate.syntheticNStandardKg + estate.syntheticNInhibitedKg + estate.syntheticP2O5Kg + estate.syntheticK2OKg + estate.rockPhosphateKg) / 1000;
  const estateScope3Cat4FertiliserTransport = totalFertiliserTons * estate.fertiliserTransportDistanceKm * CONSTANTS.FERT_TRANSPORT_FACTOR;

  const totalEstateScope3 =
    estateScope3Cat1FertiliserMfg +
    estateScope3Cat3FuelWtt +
    estateScope3Cat3ElectricityUpstream +
    estateScope3Cat4FertiliserTransport;

  // Estate Optional Information: Carbon Removals (Reported as positive magnitude for removals)
  const estateRemovalExistingCropSeq = Math.abs(estate.totalPlantedAreaHa * CONSTANTS.EXISTING_OIL_PALM_SEQUESTRATION);
  const estateRemovalStandingPalmSeq = Math.abs(estate.standingRetiredPalmAreaHa * estate.standingRetiredPalmSequestrationRate);
  const estateRemovalForestConservation = Math.abs(estate.forestConservationAreaHa * estate.forestConservationRate);
  const estateRemovalNonForestConservation = Math.abs(estate.nonForestConservationAreaHa * estate.nonForestConservationRate);
  const estateRemovalPeatlandConservation = Math.abs(estate.peatlandConservationAreaHa * CONSTANTS.PEAT_CONSERVATION_FACTOR);
  const estateRemovalOther = Math.abs(estate.otherEligibleCarbonRemovalsTco2e);

  const totalEstateCarbonRemovals =
    estateRemovalExistingCropSeq +
    estateRemovalStandingPalmSeq +
    estateRemovalForestConservation +
    estateRemovalNonForestConservation +
    estateRemovalPeatlandConservation +
    estateRemovalOther;

  // -------------------------------------------------------------
  // MILL CALCULATIONS
  // -------------------------------------------------------------
  
  // POME Methane Generation (m3 unit in V5)
  const totalPomeVolumeM3 = totalFfbProcessedTon * mill.pomeGenerationRatioM3PerTonFfb;
  const codInletKgPerM3 = mill.codInletMgPerL / 1000; // mg/L = g/m3 = 0.001 kg/m3
  const totalCodLoadKg = totalPomeVolumeM3 * codInletKgPerM3;

  // Maximum theoretical methane generated
  const totalPotentialCh4Kg = totalCodLoadKg * CONSTANTS.COD_TO_B0_CH4;

  // 1. Open Lagoon Pathway
  const lagoonRatio = mill.treatmentAllocationOpenLagoonPercent / 100;
  const lagoonCh4GeneratedKg = totalPotentialCh4Kg * lagoonRatio * CONSTANTS.MCF_OPEN_LAGOON;
  const millScope1PomeLagoon = (lagoonCh4GeneratedKg * CONSTANTS.GWP_CH4) / 1000;

  // 2. Methane Capture Pathway & Flaring/Engine Slip
  const captureRatio = mill.treatmentAllocationMethaneCapturePercent / 100;
  const potentialCapturedCh4Kg = totalPotentialCh4Kg * captureRatio * (mill.methaneCaptureEfficiencyPercent / 100);
  
  // Uncaptured fugitive loss from capture plant (leaks/slip)
  const fugitiveUncapturedCh4Kg = totalPotentialCh4Kg * captureRatio * (1 - mill.methaneCaptureEfficiencyPercent / 100) * CONSTANTS.MCF_OPEN_LAGOON;

  // Destruction efficiencies
  const openFlareCh4SlipKg = potentialCapturedCh4Kg * (mill.methaneOpenFlaringPercent / 100) * (1 - CONSTANTS.FLARE_OPEN_EFFICIENCY);
  const enclosedFlareCh4SlipKg = potentialCapturedCh4Kg * (mill.methaneEnclosedFlaringPercent / 100) * (1 - CONSTANTS.FLARE_ENCLOSED_EFFICIENCY);
  const engineCh4SlipKg = potentialCapturedCh4Kg * (mill.methaneGasEngineUtilizationPercent / 100) * (1 - CONSTANTS.GAS_ENGINE_EFFICIENCY);
  const boilerCh4SlipKg = potentialCapturedCh4Kg * (mill.methaneBoilerUtilizationPercent / 100) * (1 - CONSTANTS.GAS_ENGINE_EFFICIENCY);

  const totalUncombustedCh4Kg = fugitiveUncapturedCh4Kg + openFlareCh4SlipKg + enclosedFlareCh4SlipKg + engineCh4SlipKg + boilerCh4SlipKg;
  const millScope1PomeMethaneUncombusted = (totalUncombustedCh4Kg * CONSTANTS.GWP_CH4) / 1000;

  // Mill Fuel Combustion
  const millScope1FuelStationary = (mill.millStationaryDieselLiters * fossilRatio * CONSTANTS.DIESEL_SCOPE1_FOSSIL) / 1000;
  const millScope1FuelMobile = (mill.millMobileDieselLiters * fossilRatio * CONSTANTS.DIESEL_SCOPE1_FOSSIL) / 1000;

  const totalMillScope1 =
    millScope1PomeLagoon +
    millScope1PomeMethaneUncombusted +
    millScope1FuelStationary +
    millScope1FuelMobile;

  // Mill Scope 2: Grid Electricity
  const millScope2GridElectricity = (mill.millGridElectricityKwh * CONSTANTS.GRID_SCOPE2_EMISSION) / 1000;

  // Mill Scope 3:
  // Cat 1: Purchase of FFB from 3rd Party & Unmanaged Group
  const millScope3Cat1PurchasedFfb = scope3PurchasedFfbTon * CONSTANTS.PURCHASED_FFB_DEFAULT_EMISSION_FACTOR;

  // Cat 3: Fuel WTT and Upstream Electricity
  const totalMillDieselLiters = mill.millStationaryDieselLiters + mill.millMobileDieselLiters;
  const millScope3Cat3FuelWtt = (totalMillDieselLiters * CONSTANTS.DIESEL_SCOPE3_WTT) / 1000;
  const millScope3Cat3ElectricityUpstream = (mill.millGridElectricityKwh * CONSTANTS.GRID_SCOPE3_FERA_UPSTREAM) / 1000;

  // Cat 4: Upstream Transport of FFB from 3rd Party & Unmanaged Group
  const millScope3Cat4FfbTransport = thirdPartyTransportTonKm * CONSTANTS.FFB_TRANSPORT_FACTOR_PER_TON_KM;

  const totalMillScope3 =
    millScope3Cat1PurchasedFfb +
    millScope3Cat3FuelWtt +
    millScope3Cat3ElectricityUpstream +
    millScope3Cat4FfbTransport;

  // Mill Optional Information: Emissions Avoided
  const millAvoidedGridElectricityExport = mill.excessElectricityExportGridKwh * CONSTANTS.AVOIDED_GRID_EXPORT_FACTOR;
  
  // Biomass export: PKS, EFB, and [NEW in V5: Mesocarp Fibre]
  const millAvoidedBiomassExport =
    mill.pksExportTon * CONSTANTS.AVOIDED_PKS_DISPLACEMENT +
    mill.efbExportTon * CONSTANTS.AVOIDED_EFB_DISPLACEMENT +
    mill.mesocarpFibreExportTon * CONSTANTS.AVOIDED_MESOCARP_FIBRE_DISPLACEMENT;

  const totalMillEmissionsAvoided = millAvoidedGridElectricityExport + millAvoidedBiomassExport;

  // Biogenic Carbon: Biomass burned in boiler (Fibre & Shell)
  // Default ~1.65 t biogenic CO2 per ton biomass burned
  const millBiogenicBoilerCarbon = mill.biomassBurnedBoilerTon * 1.65;

  // -------------------------------------------------------------
  // TOTALS & INTENSITY METRICS
  // -------------------------------------------------------------
  const totalScope1 = totalEstateScope1 + totalMillScope1;
  const totalScope2 = estateScope2GridElectricity + millScope2GridElectricity;
  const totalScope3 = totalEstateScope3 + totalMillScope3;

  const totalGrossEmissions = totalScope1 + totalScope2 + totalScope3;
  const totalCarbonRemovals = totalEstateCarbonRemovals;
  const totalEmissionsAvoided = totalMillEmissionsAvoided;
  const totalBiogenicCarbon = estateBiogenicFuelCarbon + millBiogenicBoilerCarbon;

  // Net GHG Emissions = Gross - Removals - Avoided
  const totalNetEmissions = totalGrossEmissions - totalCarbonRemovals - totalEmissionsAvoided;

  const netGhgPerTonCpo = totalCpoProducedTon > 0 ? totalNetEmissions / totalCpoProducedTon : 0;
  const grossGhgPerTonCpo = totalCpoProducedTon > 0 ? totalGrossEmissions / totalCpoProducedTon : 0;
  const netGhgPerTonFfb = totalFfbProcessedTon > 0 ? totalNetEmissions / totalFfbProcessedTon : 0;
  const grossGhgPerTonFfb = totalFfbProcessedTon > 0 ? totalGrossEmissions / totalFfbProcessedTon : 0;

  return {
    estateScope1FuelStationary,
    estateScope1FuelMobile,
    estateScope1FertiliserApp,
    estateScope1Peat,
    estateScope1LucAmortised,
    estateScope1LandManagement,
    totalEstateScope1,

    estateScope2GridElectricity,

    estateScope3Cat1FertiliserMfg,
    estateScope3Cat3FuelWtt,
    estateScope3Cat3ElectricityUpstream,
    estateScope3Cat4FertiliserTransport,
    totalEstateScope3,

    estateRemovalExistingCropSeq,
    estateRemovalStandingPalmSeq,
    estateRemovalForestConservation,
    estateRemovalNonForestConservation,
    estateRemovalPeatlandConservation,
    estateRemovalOther,
    totalEstateCarbonRemovals,
    estateBiogenicFuelCarbon,

    millScope1PomeLagoon,
    millScope1PomeMethaneUncombusted,
    millScope1FuelStationary,
    millScope1FuelMobile,
    totalMillScope1,

    millScope2GridElectricity,

    millScope3Cat1PurchasedFfb,
    millScope3Cat3FuelWtt,
    millScope3Cat3ElectricityUpstream,
    millScope3Cat4FfbTransport,
    totalMillScope3,

    millAvoidedGridElectricityExport,
    millAvoidedBiomassExport,
    totalMillEmissionsAvoided,
    millBiogenicBoilerCarbon,

    totalScope1,
    totalScope2,
    totalScope3,
    totalGrossEmissions,
    totalCarbonRemovals,
    totalEmissionsAvoided,
    totalBiogenicCarbon,
    totalNetEmissions,

    totalFfbProcessedTon,
    totalCpoProducedTon,
    totalPkProducedTon,

    netGhgPerTonCpo,
    grossGhgPerTonCpo,
    netGhgPerTonFfb,
    grossGhgPerTonFfb,

    ownFfbTon,
    groupWithinUocFfbTon,
    groupOutsideUocFfbTon,
    thirdPartyFfbTon,
    scope1ManagedFfbTon,
    scope3PurchasedFfbTon,
  };
}

// Default benchmark presets
export const DEFAULT_PRESET_BASELINE: {
  estate: EstateParameters;
  mill: MillParameters;
  ffbSources: FFBSourceAllocation[];
} = {
  ffbSources: [
    {
      id: 'src-1',
      sourceType: 'own_within_uoc',
      name: 'Main Central Estate (UoC)',
      ffbVolumeTon: 140000,
      transportDistanceKm: 12,
      plantedAreaHa: 6800,
      isDirectlyManaged: true,
      yieldTonPerHa: 20.6,
    },
    {
      id: 'src-2',
      sourceType: 'group_within_uoc',
      name: 'Sungai Raya Estate (Group Managed)',
      ffbVolumeTon: 45000,
      transportDistanceKm: 25,
      plantedAreaHa: 2200,
      isDirectlyManaged: true,
      yieldTonPerHa: 20.5,
    },
    {
      id: 'src-3',
      sourceType: 'third_party_independent',
      name: 'Independent Smallholder Cooperative',
      ffbVolumeTon: 25000,
      transportDistanceKm: 38,
      plantedAreaHa: 1350,
      isDirectlyManaged: false,
      yieldTonPerHa: 18.5,
    },
  ],
  estate: {
    totalPlantedAreaHa: 9000,
    peatSoilAreaHa: 1200, // 1,200 ha on peat
    peatDrainageDepthCm: 60,
    mineralSoilAreaHa: 7800,
    grossLucTotalTco2e: 125000, // 125k tCO2 debt
    grossLucAmortisationYears: 25, // 5,000 tCO2e/yr linear amortisation
    croplandConversionHa: 450,
    croplandManagementFactor: 1.2,

    standingRetiredPalmAreaHa: 150, // 150 ha retired palm
    standingRetiredPalmSequestrationRate: 1.8,

    existingPlantationSequestrationRate: 7.8,
    forestConservationAreaHa: 850,
    forestConservationRate: 9.14,
    nonForestConservationAreaHa: 220,
    nonForestConservationRate: 2.4,
    peatlandConservationAreaHa: 180,
    otherEligibleCarbonRemovalsTco2e: 0,

    syntheticNStandardKg: 950000,
    syntheticNInhibitedKg: 150000, // Partial NI/UI adoption
    syntheticP2O5Kg: 420000,
    syntheticK2OKg: 780000,
    rockPhosphateKg: 350000,
    fertiliserTransportDistanceKm: 65,

    pomeLandApplicationM3: 45000,
    compostLandApplicationTon: 12000,
    efbMulchingTon: 22000,

    stationaryFuelDieselLiters: 180000,
    mobileFuelDieselLiters: 480000,
    biodieselBlendPercent: 35, // B35
    estateGridElectricityKwh: 320000,
  },
  mill: {
    cpoExtractionRatePercent: 21.6,
    pkExtractionRatePercent: 5.3,
    efbGenerationRatePercent: 22.0,
    pksGenerationRatePercent: 6.0,
    fibreGenerationRatePercent: 13.5,

    pksExportTon: 2500,
    efbExportTon: 0,
    mesocarpFibreExportTon: 0,

    pomeGenerationRatioM3PerTonFfb: 0.65,
    codInletMgPerL: 54000,

    treatmentAllocationOpenLagoonPercent: 70, // 70% open lagoon
    treatmentAllocationCompostPercent: 20,
    treatmentAllocationMethaneCapturePercent: 10,

    biogasMethaneContentPercent: 60,
    methaneCaptureEfficiencyPercent: 88,
    methaneGasEngineUtilizationPercent: 0,
    methaneBoilerUtilizationPercent: 40,
    methaneEnclosedFlaringPercent: 0,
    methaneOpenFlaringPercent: 60,

    millStationaryDieselLiters: 95000,
    millMobileDieselLiters: 65000,
    millGridElectricityKwh: 450000,
    biomassBurnedBoilerTon: 36000,
    excessElectricityExportGridKwh: 0,
  },
};

export const DEFAULT_PRESET_SUSTAINABLE: {
  estate: EstateParameters;
  mill: MillParameters;
  ffbSources: FFBSourceAllocation[];
} = {
  ffbSources: [
    {
      id: 'src-1',
      sourceType: 'own_within_uoc',
      name: 'Main Central Estate (Certified UoC)',
      ffbVolumeTon: 155000,
      transportDistanceKm: 10,
      plantedAreaHa: 7000,
      isDirectlyManaged: true,
      yieldTonPerHa: 22.1,
    },
    {
      id: 'src-2',
      sourceType: 'group_within_uoc',
      name: 'Bukit Makmur Estate (Certified Group)',
      ffbVolumeTon: 50000,
      transportDistanceKm: 18,
      plantedAreaHa: 2300,
      isDirectlyManaged: true,
      yieldTonPerHa: 21.7,
    },
    {
      id: 'src-3',
      sourceType: 'third_party_independent',
      name: 'RSPO Certified Independent Smallholders',
      ffbVolumeTon: 20000,
      transportDistanceKm: 25,
      plantedAreaHa: 1000,
      isDirectlyManaged: false,
      yieldTonPerHa: 20.0,
    },
  ],
  estate: {
    totalPlantedAreaHa: 9300,
    peatSoilAreaHa: 250, // Minimal peat, largely mineral
    peatDrainageDepthCm: 45,
    mineralSoilAreaHa: 9050,
    grossLucTotalTco2e: 45000,
    grossLucAmortisationYears: 25,
    croplandConversionHa: 600,
    croplandManagementFactor: 0.5,

    standingRetiredPalmAreaHa: 280, // Certified standing retired palm
    standingRetiredPalmSequestrationRate: 1.8,

    existingPlantationSequestrationRate: 7.8,
    forestConservationAreaHa: 1850, // Extensive HCV forest
    forestConservationRate: 9.14,
    nonForestConservationAreaHa: 450,
    nonForestConservationRate: 2.4,
    peatlandConservationAreaHa: 520, // Dedicated conserved peat
    otherEligibleCarbonRemovalsTco2e: 1200,

    syntheticNStandardKg: 300000,
    syntheticNInhibitedKg: 650000, // 68% NI/UI inhibitors
    syntheticP2O5Kg: 380000,
    syntheticK2OKg: 720000,
    rockPhosphateKg: 280000,
    fertiliserTransportDistanceKm: 40,

    pomeLandApplicationM3: 65000,
    compostLandApplicationTon: 24000,
    efbMulchingTon: 35000,

    stationaryFuelDieselLiters: 90000,
    mobileFuelDieselLiters: 380000,
    biodieselBlendPercent: 40, // B40
    estateGridElectricityKwh: 180000,
  },
  mill: {
    cpoExtractionRatePercent: 22.8,
    pkExtractionRatePercent: 5.5,
    efbGenerationRatePercent: 22.0,
    pksGenerationRatePercent: 6.0,
    fibreGenerationRatePercent: 13.5,

    pksExportTon: 7500, // Biomass export
    efbExportTon: 8000,
    mesocarpFibreExportTon: 4500, // [NEW in V5]

    pomeGenerationRatioM3PerTonFfb: 0.62,
    codInletMgPerL: 52000,

    treatmentAllocationOpenLagoonPercent: 5,
    treatmentAllocationCompostPercent: 15,
    treatmentAllocationMethaneCapturePercent: 80, // 80% methane capture

    biogasMethaneContentPercent: 64,
    methaneCaptureEfficiencyPercent: 96,
    methaneGasEngineUtilizationPercent: 75, // 75% utilized in gas engines
    methaneBoilerUtilizationPercent: 15,
    methaneEnclosedFlaringPercent: 10,
    methaneOpenFlaringPercent: 0,

    millStationaryDieselLiters: 35000,
    millMobileDieselLiters: 42000,
    millGridElectricityKwh: 120000,
    biomassBurnedBoilerTon: 41000,
    excessElectricityExportGridKwh: 2850000, // 2.85 GWh clean export to grid
  },
};

// -------------------------------------------------------------
// SENSITIVITY ANALYSIS SCENARIOS ENGINE
// -------------------------------------------------------------

export type SensitivityScenarioKey = 'best_case' | 'likely' | 'worst_case';

export interface SensitivityConfig {
  methaneVariancePercent: number; // e.g. 10 for +/- 10% methane capture efficiency
  lucVariancePercent: number; // e.g. 20 for +/- 20% LUC factor / amortisation duration
  peatVariancePercent: number; // e.g. 25 for +/- 25% peat oxidation flux
  inhibitorVariancePercent: number; // e.g. 30 for +/- 30% NI/UI inhibitor adoption
}

export const DEFAULT_SENSITIVITY_CONFIG: SensitivityConfig = {
  methaneVariancePercent: 10,
  lucVariancePercent: 20,
  peatVariancePercent: 25,
  inhibitorVariancePercent: 30,
};

export interface SensitivityScenario {
  key: SensitivityScenarioKey;
  label: string;
  badgeColor: string;
  description: string;
  estateParams: EstateParameters;
  millParams: MillParameters;
  results: PalmGHGAssessmentResults;
  deltaNetCpo: number; // difference in tCO2e/t CPO vs likely
  deltaNetCpoPercent: number; // % difference vs likely
  deltaNetEmissions: number; // difference in tCO2e total vs likely
  deltaNetEmissionsPercent: number;
  assumptions: {
    methaneCapture: string;
    peatDrainage: string;
    grossLuc: string;
    fertiliserNIUI: string;
  };
}

export function calculateSensitivityScenarios(
  estate: EstateParameters,
  mill: MillParameters,
  ffbSources: FFBSourceAllocation[],
  config: Partial<SensitivityConfig> = {}
): Record<SensitivityScenarioKey, SensitivityScenario> {
  const mergedConfig: SensitivityConfig = {
    ...DEFAULT_SENSITIVITY_CONFIG,
    ...config,
  };

  const methaneVar = Math.max(1, Math.min(40, mergedConfig.methaneVariancePercent));
  const lucVar = Math.max(5, Math.min(50, mergedConfig.lucVariancePercent));
  const peatVar = Math.max(5, Math.min(50, mergedConfig.peatVariancePercent));
  const inhibVar = Math.max(5, Math.min(50, mergedConfig.inhibitorVariancePercent));

  // 1. Likely (Current Baseline)
  const likelyResults = calculatePalmGHGV5(estate, mill, ffbSources);
  const totalN = estate.syntheticNStandardKg + estate.syntheticNInhibitedKg;
  const currentNiUiPct = totalN > 0 ? (estate.syntheticNInhibitedKg / totalN) * 100 : 0;
  const baseLucYears = estate.grossLucAmortisationYears || 25;
  const baseLucAnnualDebt = estate.grossLucTotalTco2e / baseLucYears;

  const likelyScenario: SensitivityScenario = {
    key: 'likely',
    label: 'Likely Case (Baseline)',
    badgeColor: 'bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200',
    description: 'Current verified operational parameters and standard RSPO V5 / IPCC Tier 1 default emission factors.',
    estateParams: estate,
    millParams: mill,
    results: likelyResults,
    deltaNetCpo: 0,
    deltaNetCpoPercent: 0,
    deltaNetEmissions: 0,
    deltaNetEmissionsPercent: 0,
    assumptions: {
      methaneCapture: `${mill.treatmentAllocationMethaneCapturePercent}% capture allocation (${mill.methaneCaptureEfficiencyPercent}% capture efficiency)`,
      peatDrainage: `${estate.peatSoilAreaHa.toLocaleString()} ha peat @ standard 54.6 tCO₂e/ha/yr`,
      grossLuc: `${baseLucYears}-year linear amortisation (${baseLucAnnualDebt.toFixed(0)} tCO₂e/yr)`,
      fertiliserNIUI: `${currentNiUiPct.toFixed(0)}% NI/UI treated nitrogen`,
    },
  };

  // 2. Best Case Scenario
  // - High methane capture efficiency: mill.methaneCaptureEfficiencyPercent + methaneVar (up to 99.5%)
  // - Peat water table managed (-peatVar% oxidation)
  // - Extended LUC amortisation (up to 35y, e.g. base * (1 + lucVar/100))
  // - Higher NI/UI inhibitor adoption (up to 100%)
  const bestMethaneEff = Math.min(99.5, Math.max(80, mill.methaneCaptureEfficiencyPercent + methaneVar));
  const bestMethaneCaptureAlloc = Math.min(95, Math.max(mill.treatmentAllocationMethaneCapturePercent + 15, 65));
  const bestCompostAlloc = mill.treatmentAllocationCompostPercent;
  const bestOpenLagoonAlloc = Math.max(0, 100 - bestMethaneCaptureAlloc - bestCompostAlloc);

  const bestLucYears = Math.min(35, Math.max(25, Math.round(baseLucYears * (1 + lucVar / 100))));
  const bestPeatMultiplier = Math.max(0.4, 1 - peatVar / 100);
  const bestNiUiPct = Math.min(100, Math.max(50, currentNiUiPct + inhibVar));

  const bestEstate: EstateParameters = {
    ...estate,
    peatSoilAreaHa: estate.peatSoilAreaHa * bestPeatMultiplier,
    grossLucAmortisationYears: bestLucYears,
    syntheticNInhibitedKg: (totalN * bestNiUiPct) / 100,
    syntheticNStandardKg: totalN * (1 - bestNiUiPct / 100),
    forestConservationAreaHa: estate.forestConservationAreaHa * 1.15,
    peatlandConservationAreaHa: estate.peatlandConservationAreaHa * 1.15,
    standingRetiredPalmAreaHa: estate.standingRetiredPalmAreaHa * 1.15,
  };

  const bestMill: MillParameters = {
    ...mill,
    treatmentAllocationMethaneCapturePercent: bestMethaneCaptureAlloc,
    treatmentAllocationOpenLagoonPercent: bestOpenLagoonAlloc,
    treatmentAllocationCompostPercent: bestCompostAlloc,
    methaneCaptureEfficiencyPercent: bestMethaneEff,
    methaneGasEngineUtilizationPercent: 85,
    methaneBoilerUtilizationPercent: 10,
    methaneEnclosedFlaringPercent: 5,
    methaneOpenFlaringPercent: 0,
    mesocarpFibreExportTon: mill.mesocarpFibreExportTon * 1.25,
    pksExportTon: mill.pksExportTon * 1.20,
    excessElectricityExportGridKwh: Math.max(mill.excessElectricityExportGridKwh * 1.30, 1500000),
  };

  const bestResults = calculatePalmGHGV5(bestEstate, bestMill, ffbSources);
  const bestDeltaCpo = bestResults.netGhgPerTonCpo - likelyResults.netGhgPerTonCpo;
  const bestDeltaCpoPct = likelyResults.netGhgPerTonCpo !== 0 ? (bestDeltaCpo / likelyResults.netGhgPerTonCpo) * 100 : 0;
  const bestDeltaEmissions = bestResults.totalNetEmissions - likelyResults.totalNetEmissions;
  const bestDeltaEmissionsPct = likelyResults.totalNetEmissions !== 0 ? (bestDeltaEmissions / likelyResults.totalNetEmissions) * 100 : 0;

  const bestScenario: SensitivityScenario = {
    key: 'best_case',
    label: 'Best Case Scenario',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
    description: `High biogas capture efficiency (${bestMethaneEff.toFixed(0)}%, +${methaneVar}%), peat water table control (-${peatVar}% oxidation), ${bestLucYears}y LUC amortisation, and ${bestNiUiPct.toFixed(0)}% NI/UI inhibitor adoption.`,
    estateParams: bestEstate,
    millParams: bestMill,
    results: bestResults,
    deltaNetCpo: bestDeltaCpo,
    deltaNetCpoPercent: bestDeltaCpoPct,
    deltaNetEmissions: bestDeltaEmissions,
    deltaNetEmissionsPercent: bestDeltaEmissionsPct,
    assumptions: {
      methaneCapture: `${bestMethaneEff.toFixed(0)}% efficiency (+${methaneVar}% vs ${mill.methaneCaptureEfficiencyPercent}%), ${bestMethaneCaptureAlloc}% allocation, enclosed flaring`,
      peatDrainage: `Controlled water table reducing peat oxidation by -${peatVar}% (${(54.6 * bestPeatMultiplier).toFixed(1)} tCO₂e/ha/yr)`,
      grossLuc: `${bestLucYears}-year extended amortisation (+${lucVar}%), annual debt ${(estate.grossLucTotalTco2e / bestLucYears).toFixed(0)} tCO₂e/yr`,
      fertiliserNIUI: `${bestNiUiPct.toFixed(0)}% nitrogen converted to NI/UI inhibitors (-35% direct N₂O)`,
    },
  };

  // 3. Worst Case Scenario
  // - Low methane capture efficiency: mill.methaneCaptureEfficiencyPercent - methaneVar (clamped min 40%)
  // - Peat over-drainage (+peatVar% oxidation)
  // - Accelerated 20-year or shorter LUC amortisation (base * (1 - lucVar/100))
  // - Lower or zero NI/UI inhibitor adoption
  const worstMethaneEff = Math.max(40, mill.methaneCaptureEfficiencyPercent - methaneVar);
  const worstMethaneCaptureAlloc = Math.max(10, mill.treatmentAllocationMethaneCapturePercent - 25);
  const worstCompostAlloc = mill.treatmentAllocationCompostPercent;
  const worstOpenLagoonAlloc = Math.min(100 - worstCompostAlloc, Math.max(0, 100 - worstMethaneCaptureAlloc - worstCompostAlloc));

  const worstLucYears = Math.max(15, Math.min(25, Math.round(baseLucYears * (1 - lucVar / 100))));
  const worstPeatMultiplier = 1 + peatVar / 100;
  const worstNiUiPct = Math.max(0, currentNiUiPct - inhibVar);

  const worstEstate: EstateParameters = {
    ...estate,
    peatSoilAreaHa: estate.peatSoilAreaHa * worstPeatMultiplier,
    grossLucAmortisationYears: worstLucYears,
    syntheticNInhibitedKg: (totalN * worstNiUiPct) / 100,
    syntheticNStandardKg: totalN * (1 - worstNiUiPct / 100),
    standingRetiredPalmAreaHa: 0, // No retired palm credits
  };

  const worstMill: MillParameters = {
    ...mill,
    treatmentAllocationMethaneCapturePercent: worstMethaneCaptureAlloc,
    treatmentAllocationOpenLagoonPercent: worstOpenLagoonAlloc,
    treatmentAllocationCompostPercent: worstCompostAlloc,
    methaneCaptureEfficiencyPercent: worstMethaneEff,
    methaneGasEngineUtilizationPercent: 20,
    methaneBoilerUtilizationPercent: 10,
    methaneEnclosedFlaringPercent: 0,
    methaneOpenFlaringPercent: 70, // Inefficient open flaring with slip
    mesocarpFibreExportTon: 0, // No export credits
    pksExportTon: 0,
    efbExportTon: 0,
    excessElectricityExportGridKwh: 0,
  };

  const worstResults = calculatePalmGHGV5(worstEstate, worstMill, ffbSources);
  const worstDeltaCpo = worstResults.netGhgPerTonCpo - likelyResults.netGhgPerTonCpo;
  const worstDeltaCpoPct = likelyResults.netGhgPerTonCpo !== 0 ? (worstDeltaCpo / likelyResults.netGhgPerTonCpo) * 100 : 0;
  const worstDeltaEmissions = worstResults.totalNetEmissions - likelyResults.totalNetEmissions;
  const worstDeltaEmissionsPct = likelyResults.totalNetEmissions !== 0 ? (worstDeltaEmissions / likelyResults.totalNetEmissions) * 100 : 0;

  const worstScenario: SensitivityScenario = {
    key: 'worst_case',
    label: 'Worst Case Scenario',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
    description: `Biogas capture upset (${worstMethaneEff.toFixed(0)}%, -${methaneVar}%), deep peat drainage (+${peatVar}% oxidation), accelerated ${worstLucYears}y LUC amortisation, and 0% biomass export credits.`,
    estateParams: worstEstate,
    millParams: worstMill,
    results: worstResults,
    deltaNetCpo: worstDeltaCpo,
    deltaNetCpoPercent: worstDeltaCpoPct,
    deltaNetEmissions: worstDeltaEmissions,
    deltaNetEmissionsPercent: worstDeltaEmissionsPct,
    assumptions: {
      methaneCapture: `${worstMethaneEff.toFixed(0)}% efficiency (-${methaneVar}% vs ${mill.methaneCaptureEfficiencyPercent}%), ${worstMethaneCaptureAlloc}% allocation, open flaring slip`,
      peatDrainage: `Deep over-drainage increasing peat oxidation by +${peatVar}% (${(54.6 * worstPeatMultiplier).toFixed(1)} tCO₂e/ha/yr)`,
      grossLuc: `${worstLucYears}-year accelerated amortisation (-${lucVar}%), annual debt ${(estate.grossLucTotalTco2e / worstLucYears).toFixed(0)} tCO₂e/yr`,
      fertiliserNIUI: `${worstNiUiPct.toFixed(0)}% NI/UI inhibitor adoption (-${inhibVar}% vs baseline)`,
    },
  };

  return {
    best_case: bestScenario,
    likely: likelyScenario,
    worst_case: worstScenario,
  };
}

