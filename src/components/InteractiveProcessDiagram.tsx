import React, { useState } from 'react';
import {
  EstateParameters,
  MillParameters,
  PalmGHGAssessmentResults,
} from '../types/palmghg';
import { Info, Sparkles, ArrowRight, Zap, CheckCircle2, ChevronRight, Sliders } from 'lucide-react';

interface Props {
  estate: EstateParameters;
  mill: MillParameters;
  results: PalmGHGAssessmentResults;
  onNavigateToTab: (tabId: string) => void;
}

interface DiagramNode {
  id: string;
  name: string;
  section: 'estate' | 'transport' | 'mill' | 'outside';
  scopeTag: 'Scope 1' | 'Scope 2' | 'Scope 3 (Cat 1)' | 'Scope 3 (Cat 3)' | 'Scope 3 (Cat 4)' | 'Carbon Removal' | 'Avoided Emission' | 'Biogenic Carbon' | 'Process' | 'Product';
  scopeColor: string;
  isNewInV5: boolean;
  valueDisplay?: string;
  description: string;
  v5ChangeDetails: string;
  tabTarget: string;
}

export const InteractiveProcessDiagram: React.FC<Props> = ({
  estate,
  mill,
  results,
  onNavigateToTab,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('methane-capture');
  const [filterScope, setFilterScope] = useState<string>('all');

  const nodes: Record<string, DiagramNode> = {
    'land-prep-luc': {
      id: 'land-prep-luc',
      name: 'Land Use Change (Gross LUC)',
      section: 'estate',
      scopeTag: 'Scope 1',
      scopeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800',
      isNewInV5: true,
      valueDisplay: `${results.estateScope1LucAmortised.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'Forestland or secondary forest converted to oil palm plantation. Historical gross carbon debt.',
      v5ChangeDetails: 'Aligned with GHG Protocol LSR Standard v1.1: Weighted 25-year linear amortisation. Reported gross as Scope 1, separated completely from crop sequestration.',
      tabTarget: 'luc',
    },
    'land-prep-mgmt': {
      id: 'land-prep-mgmt',
      name: 'Land Management (Cropland to Oil Palm)',
      section: 'estate',
      scopeTag: 'Scope 1',
      scopeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800',
      isNewInV5: true,
      valueDisplay: `${results.estateScope1LandManagement.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'Conversion from existing cropland or agricultural land to oil palm, tracking soil organic carbon (SOC) shifts.',
      v5ChangeDetails: 'NEW accounting line in V5 following GHG Protocol LSR v1.1 Land Management guidelines.',
      tabTarget: 'estate-planting',
    },
    'peat-emission': {
      id: 'peat-emission',
      name: 'Peat Soil Drainage & Oxidation',
      section: 'estate',
      scopeTag: 'Scope 1',
      scopeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800',
      isNewInV5: false,
      valueDisplay: `${results.estateScope1Peat.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'CO2 and N2O emissions resulting from drainage and microbiological oxidation of tropical peat soil.',
      v5ChangeDetails: 'Remains unchanged in core methodology; captures peat area (ha) with drainage depth factors (~54.6 tCO2e/ha/yr).',
      tabTarget: 'estate-planting',
    },
    'crop-sequestration': {
      id: 'crop-sequestration',
      name: 'Existing Plantation Crop Sequestration',
      section: 'estate',
      scopeTag: 'Carbon Removal',
      scopeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800',
      isNewInV5: false,
      valueDisplay: `-${results.estateRemovalExistingCropSeq.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'Atmospheric carbon absorbed and sequestered into standing oil palm vegetative biomass over the replanting cycle.',
      v5ChangeDetails: 'Moved under Optional Information (Carbon Removals) instead of netting directly against gross LUC emissions, as required by GHG Protocol LSR v1.1.',
      tabTarget: 'estate-planting',
    },
    'standing-palm': {
      id: 'standing-palm',
      name: 'Standing Retired Oil Palm (>25 yrs)',
      section: 'estate',
      scopeTag: 'Carbon Removal',
      scopeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800',
      isNewInV5: true,
      valueDisplay: `-${results.estateRemovalStandingPalmSeq.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'Optional carbon sequestration accounting for standing oil palm older than 25 years after production harvesting has ceased.',
      v5ChangeDetails: 'BRAND NEW in PalmGHG V5. Allows growers to account for ongoing carbon stock conservation in retired palms without commercial harvesting.',
      tabTarget: 'estate-planting',
    },
    'conservation-areas': {
      id: 'conservation-areas',
      name: 'Conservation (Forest, Non-Forest, Peat)',
      section: 'estate',
      scopeTag: 'Carbon Removal',
      scopeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800',
      isNewInV5: true,
      valueDisplay: `-${(results.estateRemovalForestConservation + results.estateRemovalNonForestConservation + results.estateRemovalPeatlandConservation).toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'Conserved High Conservation Value (HCV) natural forest, riparian corridors, non-forest scrub, and peatland conservation within the concession.',
      v5ChangeDetails: 'EXPANDED in V5: Separates Forest Conservation, Non-Forest Conservation (grassland/riparian), and Peatland Conservation into distinct removal accounts.',
      tabTarget: 'estate-planting',
    },
    'fertiliser-app': {
      id: 'fertiliser-app',
      name: 'Fertiliser Application (Field N₂O)',
      section: 'estate',
      scopeTag: 'Scope 1',
      scopeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800',
      isNewInV5: true,
      valueDisplay: `${results.estateScope1FertiliserApp.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'Direct and indirect nitrous oxide (N2O) emissions generated from soil microbiological activity after applying nitrogen fertilisers.',
      v5ChangeDetails: 'Includes Nitrification Inhibitor (NI) and Urease Inhibitor (UI) treated fertilisers with reduced emission factors. Organic field applications (POME, Compost, EFB) moved from Mill to Estate.',
      tabTarget: 'estate-fert-fuel',
    },
    'fertiliser-mfg': {
      id: 'fertiliser-mfg',
      name: 'Fertiliser Manufacturing & Upstream',
      section: 'estate',
      scopeTag: 'Scope 3 (Cat 1)',
      scopeColor: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-800',
      isNewInV5: false,
      valueDisplay: `${results.estateScope3Cat1FertiliserMfg.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'Scope 3 Category 1 emissions embedded in the industrial synthesis and manufacturing of mineral fertilisers (N, P2O5, K2O, RP).',
      v5ChangeDetails: 'Classified under Scope 3 Category 1: Purchased Goods and Services in line with GHG Protocol Corporate Value Chain standard.',
      tabTarget: 'estate-fert-fuel',
    },
    'fertiliser-transport': {
      id: 'fertiliser-transport',
      name: 'Fertiliser Sea & Land Transport',
      section: 'estate',
      scopeTag: 'Scope 3 (Cat 4)',
      scopeColor: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-800',
      isNewInV5: false,
      valueDisplay: `${results.estateScope3Cat4FertiliserTransport.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'Scope 3 Category 4 upstream transportation of bulk fertiliser products from manufacturer/port to plantation stores.',
      v5ChangeDetails: 'Strictly assigned to Scope 3 Category 4: Upstream Transportation and Distribution.',
      tabTarget: 'estate-fert-fuel',
    },
    'estate-fuel-direct': {
      id: 'estate-fuel-direct',
      name: 'Estate Fuel (Stationary & Mobile)',
      section: 'estate',
      scopeTag: 'Scope 1',
      scopeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800',
      isNewInV5: true,
      valueDisplay: `${(results.estateScope1FuelStationary + results.estateScope1FuelMobile).toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'Direct combustion of fossil fuels in stationary gensets/pumps and mobile tractors, field trucks, and heavy harvest machinery.',
      v5ChangeDetails: 'NEW split: Explicitly distinguishes Stationary Combustion vs Mobile Combustion; extracts biogenic biodiesel fraction into separate Biogenic Carbon line.',
      tabTarget: 'estate-fert-fuel',
    },
    'estate-fuel-wtt': {
      id: 'estate-fuel-wtt',
      name: 'Estate Fuel Upstream (Well-To-Tank WTT)',
      section: 'estate',
      scopeTag: 'Scope 3 (Cat 3)',
      scopeColor: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-800',
      isNewInV5: true,
      valueDisplay: `${results.estateScope3Cat3FuelWtt.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'Upstream exploration, refining, transport, and distribution of fossil diesel purchased for plantation operations (FERA).',
      v5ChangeDetails: 'NEW in V5: Well-To-Tank (WTT) upstream fuel emissions are explicitly reported under Scope 3 Category 3 (Fuel- and Energy-Related Activities).',
      tabTarget: 'estate-fert-fuel',
    },
    'estate-biogenic-fuel': {
      id: 'estate-biogenic-fuel',
      name: 'Estate Fuel Biogenic Carbon',
      section: 'estate',
      scopeTag: 'Biogenic Carbon',
      scopeColor: 'bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-950 dark:text-violet-200 dark:border-violet-800',
      isNewInV5: true,
      valueDisplay: `${results.estateBiogenicFuelCarbon.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'CO2 released from the combustion of renewable bio-based fuels (e.g. Palm Methyl Ester in B35/B40 diesel blends).',
      v5ChangeDetails: 'NEW in V5: Biogenic emissions are reported separately under Optional Information and excluded from net fossil Scope 1 totals.',
      tabTarget: 'estate-fert-fuel',
    },
    'estate-electricity': {
      id: 'estate-electricity',
      name: 'Estate Grid Electricity Consumption',
      section: 'estate',
      scopeTag: 'Scope 2',
      scopeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800',
      isNewInV5: true,
      valueDisplay: `${results.estateScope2GridElectricity.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'Indirect emissions from grid electricity purchased for estate residential compounds, workshops, and offices.',
      v5ChangeDetails: 'NEW in V5: Estate grid electricity is formally accounted as Scope 2, with upstream transmission losses in Scope 3 Cat 3.',
      tabTarget: 'estate-fert-fuel',
    },
    'transport-ffb': {
      id: 'transport-ffb',
      name: 'Transport of FFB to Mill',
      section: 'transport',
      scopeTag: 'Scope 3 (Cat 4)',
      scopeColor: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-800',
      isNewInV5: true,
      valueDisplay: `${results.millScope3Cat4FfbTransport.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'Transportation of Fresh Fruit Bunches (FFB) from plantation estates to the palm oil mill ramp.',
      v5ChangeDetails: 'Strict boundary allocation: Own/managed estate transport is Scope 1 mobile; 3rd party independent smallholder FFB transport is Scope 3 Category 4.',
      tabTarget: 'supply-sources',
    },
    'third-party-ffb-purchase': {
      id: 'third-party-ffb-purchase',
      name: 'Purchase of 3rd Party FFB (Supply Base)',
      section: 'transport',
      scopeTag: 'Scope 3 (Cat 1)',
      scopeColor: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-800',
      isNewInV5: true,
      valueDisplay: `${results.millScope3Cat1PurchasedFfb.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'Emissions embodied in FFB purchased from independent smallholders, outgrowers, or collection centres not owned or managed by the UoC.',
      v5ChangeDetails: 'NEW clarify: Third-party FFB without dataset or operational control is reported as Scope 3 Category 1 (Purchased Goods and Services).',
      tabTarget: 'supply-sources',
    },
    'mill-operations': {
      id: 'mill-operations',
      name: 'Mill Operations (Sterilisation & Extraction)',
      section: 'mill',
      scopeTag: 'Process',
      scopeColor: 'bg-neutral-100 text-neutral-900 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700',
      isNewInV5: false,
      valueDisplay: `${results.totalFfbProcessedTon.toLocaleString()} t FFB Processed`,
      description: 'Physical process units: Sterilisation cage -> Threshing/stripper -> Digestion & screw pressing -> Clarification & purification -> Oil extraction.',
      v5ChangeDetails: 'Output combined and tracked: CPO, PK, EFB, PKS, and Mesocarp Fibre. PK crushing (PKO/PKE) remains outside mill UoC boundary.',
      tabTarget: 'mill-ops',
    },
    'pome-lagoon': {
      id: 'pome-lagoon',
      name: 'POME Open Anaerobic Lagoon',
      section: 'mill',
      scopeTag: 'Scope 1',
      scopeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800',
      isNewInV5: true,
      valueDisplay: `${results.millScope1PomeLagoon.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'Anaerobic microbial decomposition of Palm Oil Mill Effluent in open treatment lagoons, releasing fugitive methane (CH4) with GWP 28.',
      v5ChangeDetails: 'V5 shifts POME measurement unit from Ton to m³! Uses COD inlet based on WWTP system (mg/L). Captures allocation % across open pond, compost, and biogas.',
      tabTarget: 'mill-pome',
    },
    'methane-capture': {
      id: 'methane-capture',
      name: 'Methane Capture & Utilization Plant',
      section: 'mill',
      scopeTag: 'Avoided Emission',
      scopeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800',
      isNewInV5: true,
      valueDisplay: `${mill.treatmentAllocationMethaneCapturePercent}% Biogas Plant`,
      description: 'Covered lagoon or digester tank capturing biogas (60% CH4) for electricity generation via gas engines, biogas boilers, or flaring.',
      v5ChangeDetails: 'NEW detailed parameters in V5: Volume m³ biogas, CH4 content %, capture efficiency, and split between Gas Engine, Boiler, Open Flaring, and Enclosed Flaring (99.5% efficiency).',
      tabTarget: 'mill-pome',
    },
    'composting-plant': {
      id: 'composting-plant',
      name: 'Composting Plant (POME + EFB)',
      section: 'mill',
      scopeTag: 'Process',
      scopeColor: 'bg-neutral-100 text-neutral-900 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700',
      isNewInV5: true,
      valueDisplay: `${mill.treatmentAllocationCompostPercent}% POME diverted`,
      description: 'Aerobic composting combining POME and shredded EFB, minimizing anaerobic CH4 formation and generating high-nutrient organic compost.',
      v5ChangeDetails: 'Finished compost application is accounted under Estate Fertiliser in V5 rather than in the Mill section.',
      tabTarget: 'mill-pome',
    },
    'biomass-export': {
      id: 'biomass-export',
      name: 'Biomass Export for Electricity Generation',
      section: 'mill',
      scopeTag: 'Avoided Emission',
      scopeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800',
      isNewInV5: true,
      valueDisplay: `-${results.millAvoidedBiomassExport.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'Displacing fossil fuels (coal/diesel) in external power plants by exporting excess biomass (PKS, EFB, Mesocarp Fibre).',
      v5ChangeDetails: 'EXPANDED in V5: Mesocarp Fibre is now officially eligible alongside PKS and EFB for electricity generation displacement credits.',
      tabTarget: 'mill-ops',
    },
    'grid-electricity-export': {
      id: 'grid-electricity-export',
      name: 'Mill Excess Electricity Export to Grid',
      section: 'mill',
      scopeTag: 'Avoided Emission',
      scopeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800',
      isNewInV5: false,
      valueDisplay: `-${results.millAvoidedGridElectricityExport.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'Surplus renewable electricity generated from biogas engines or biomass turbogenerators fed into the national or local grid.',
      v5ChangeDetails: 'Displaces grid baseline emissions; reported under Optional Information: Emissions Avoided.',
      tabTarget: 'mill-pome',
    },
    'mill-biogenic-boiler': {
      id: 'mill-biogenic-boiler',
      name: 'Mill Biomass Boiler Combustion',
      section: 'mill',
      scopeTag: 'Biogenic Carbon',
      scopeColor: 'bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-950 dark:text-violet-200 dark:border-violet-800',
      isNewInV5: true,
      valueDisplay: `${results.millBiogenicBoilerCarbon.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'Steam generation in mill boiler through combustion of internal solid biomass (mesocarp fibre & palm kernel shells).',
      v5ChangeDetails: 'NEW in V5: Explicit reporting of Biogenic Carbon in Optional Information instead of omitting or blurring with fossil emissions.',
      tabTarget: 'mill-pome',
    },
    'mill-fuel-stationary-mobile': {
      id: 'mill-fuel-stationary-mobile',
      name: 'Mill Fuel (Stationary & Mobile)',
      section: 'mill',
      scopeTag: 'Scope 1',
      scopeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800',
      isNewInV5: true,
      valueDisplay: `${(results.millScope1FuelStationary + results.millScope1FuelMobile).toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr`,
      description: 'Diesel fuel consumed by mill auxiliary standby generators, wheel loaders, and internal transport forklifts.',
      v5ChangeDetails: 'NEW in V5: Covers only FFB milling (PK Crushing excluded), with stationary vs mobile combustion separated.',
      tabTarget: 'mill-pome',
    },
    'cpo-product': {
      id: 'cpo-product',
      name: 'Crude Palm Oil (CPO)',
      section: 'mill',
      scopeTag: 'Product',
      scopeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800',
      isNewInV5: false,
      valueDisplay: `${results.totalCpoProducedTon.toLocaleString()} Ton CPO`,
      description: 'Primary RSPO certified sustainable palm oil product produced by the extraction mill.',
      v5ChangeDetails: 'Key intensity denominator: Net GHG per ton CPO produced is the primary benchmark metric for RSPO audit compliance.',
      tabTarget: 'mill-ops',
    },
  };

  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : null;

  return (
    <div className="space-y-4">
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Interactive RSPO PalmGHG V5 Process Flow Map
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Click any process block to inspect operational boundary, V5 changes, and live greenhouse gas inventory figures.
          </p>
        </div>

        {/* Scope Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium">
          <button
            onClick={() => setFilterScope('all')}
            className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
              filterScope === 'all'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            All Nodes
          </button>
          <button
            onClick={() => setFilterScope('Scope 1')}
            className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
              filterScope === 'Scope 1'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-amber-700'
            }`}
          >
            Scope 1 (Direct)
          </button>
          <button
            onClick={() => setFilterScope('Scope 2')}
            className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
              filterScope === 'Scope 2'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-emerald-700'
            }`}
          >
            Scope 2
          </button>
          <button
            onClick={() => setFilterScope('Scope 3')}
            className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
              filterScope === 'Scope 3'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-sky-700'
            }`}
          >
            Scope 3 (Value Chain)
          </button>
          <button
            onClick={() => setFilterScope('Removals & Avoided')}
            className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
              filterScope === 'Removals & Avoided'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-teal-700'
            }`}
          >
            Removals & Avoided
          </button>
        </div>
      </div>

      {/* Main Process Diagram Canvas */}
      <div className="relative overflow-x-auto p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        
        {/* Stage Timeline Header */}
        <div className="grid grid-cols-4 gap-2 mb-4 text-xs font-semibold text-center text-neutral-600 dark:text-neutral-400">
          <div className="py-1 px-2 bg-neutral-100 dark:bg-neutral-800 rounded-md">
            1. Land Preparation
          </div>
          <div className="py-1 px-2 bg-neutral-100 dark:bg-neutral-800 rounded-md">
            2. Cultivation & Harvesting
          </div>
          <div className="py-1 px-2 bg-neutral-100 dark:bg-neutral-800 rounded-md">
            3. Transport of FFB to Mill
          </div>
          <div className="py-1 px-2 bg-neutral-100 dark:bg-neutral-800 rounded-md">
            4. Palm Oil Milling & Energy
          </div>
        </div>

        {/* Diagram Flow Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-w-[960px]">
          
          {/* SECTION 1: ESTATE BOUNDARY (7 COLS) */}
          <div className="lg:col-span-6 p-3 rounded-lg border-2 border-emerald-700/60 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Oil Palm Plantation / Estate Boundary (Within UoC)
              </span>
              <span className="text-[11px] font-mono text-neutral-500">Estate Scope 1 & 2</span>
            </div>

            {/* Land Preparation Row */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedNodeId('land-prep-luc')}
                className={`p-2.5 rounded-lg text-left transition-all border ${
                  selectedNodeId === 'land-prep-luc'
                    ? 'ring-2 ring-emerald-600 bg-white dark:bg-neutral-800 shadow-md'
                    : 'bg-white/80 dark:bg-neutral-800/80 hover:bg-white border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">Scope 1 · Gross LUC</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1 rounded font-medium">LSR v1.1</span>
                </div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Land Use Change (LUC)</div>
                <div className="text-[11px] font-mono text-neutral-500 mt-1">{results.estateScope1LucAmortised.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e</div>
              </button>

              <button
                onClick={() => setSelectedNodeId('land-prep-mgmt')}
                className={`p-2.5 rounded-lg text-left transition-all border ${
                  selectedNodeId === 'land-prep-mgmt'
                    ? 'ring-2 ring-emerald-600 bg-white dark:bg-neutral-800 shadow-md'
                    : 'bg-white/80 dark:bg-neutral-800/80 hover:bg-white border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">Scope 1 · Land Mgmt</span>
                  <span className="text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-1 rounded font-medium">NEW V5</span>
                </div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Cropland to Oil Palm</div>
                <div className="text-[11px] font-mono text-neutral-500 mt-1">{results.estateScope1LandManagement.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e</div>
              </button>
            </div>

            {/* Cultivation & Soils Row */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedNodeId('peat-emission')}
                className={`p-2.5 rounded-lg text-left transition-all border ${
                  selectedNodeId === 'peat-emission'
                    ? 'ring-2 ring-emerald-600 bg-white dark:bg-neutral-800 shadow-md'
                    : 'bg-white/80 dark:bg-neutral-800/80 hover:bg-white border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 mb-0.5">Scope 1 · Drained Soil</div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">Peat Oxidation</div>
                <div className="text-[11px] font-mono text-neutral-500 mt-1">{results.estateScope1Peat.toLocaleString(undefined, { maximumFractionDigits: 0 })} tCO₂e</div>
              </button>

              <button
                onClick={() => setSelectedNodeId('crop-sequestration')}
                className={`p-2.5 rounded-lg text-left transition-all border ${
                  selectedNodeId === 'crop-sequestration'
                    ? 'ring-2 ring-emerald-600 bg-white dark:bg-neutral-800 shadow-md'
                    : 'bg-white/80 dark:bg-neutral-800/80 hover:bg-white border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">Removals (Optional)</div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">Crop Sequestration</div>
                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">-{results.estateRemovalExistingCropSeq.toLocaleString(undefined, { maximumFractionDigits: 0 })} tCO₂e</div>
              </button>

              <button
                onClick={() => setSelectedNodeId('standing-palm')}
                className={`p-2.5 rounded-lg text-left transition-all border ${
                  selectedNodeId === 'standing-palm'
                    ? 'ring-2 ring-emerald-600 bg-white dark:bg-neutral-800 shadow-md'
                    : 'bg-white/80 dark:bg-neutral-800/80 hover:bg-white border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">Removals</span>
                  <span className="text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-1 rounded font-medium">NEW</span>
                </div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">Standing Palm {'>'}25y</div>
                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">-{results.estateRemovalStandingPalmSeq.toLocaleString(undefined, { maximumFractionDigits: 0 })} tCO₂e</div>
              </button>
            </div>

            {/* Inputs & Operations Row */}
            <div className="grid grid-cols-2 gap-2">
              {/* Fertilisers Card */}
              <div className="p-2.5 bg-white/90 dark:bg-neutral-800/90 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-1.5">
                <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
                  <span>Fertiliser System</span>
                  <span className="text-[10px] text-neutral-500">Field + WTT</span>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedNodeId('fertiliser-app')}
                    className={`w-full text-left p-1.5 rounded text-xs transition-colors ${
                      selectedNodeId === 'fertiliser-app' ? 'bg-amber-100 dark:bg-amber-950/60 font-semibold' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-amber-800 dark:text-amber-400">Scope 1: Field Application</span>
                      <span className="font-mono">{results.estateScope1FertiliserApp.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedNodeId('fertiliser-mfg')}
                    className={`w-full text-left p-1.5 rounded text-xs transition-colors ${
                      selectedNodeId === 'fertiliser-mfg' ? 'bg-sky-100 dark:bg-sky-950/60 font-semibold' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-sky-800 dark:text-sky-400">Scope 3 Cat 1: Mfg</span>
                      <span className="font-mono">{results.estateScope3Cat1FertiliserMfg.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Fuels & Energy Card */}
              <div className="p-2.5 bg-white/90 dark:bg-neutral-800/90 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-1.5">
                <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
                  <span>Field Fuel & Electricity</span>
                  <span className="text-[10px] text-neutral-500">Scope 1, 2, 3</span>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedNodeId('estate-fuel-direct')}
                    className={`w-full text-left p-1.5 rounded text-xs transition-colors ${
                      selectedNodeId === 'estate-fuel-direct' ? 'bg-amber-100 dark:bg-amber-950/60 font-semibold' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-amber-800 dark:text-amber-400">Scope 1: Stationary & Mobile</span>
                      <span className="font-mono">{(results.estateScope1FuelStationary + results.estateScope1FuelMobile).toFixed(0)}</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedNodeId('estate-fuel-wtt')}
                    className={`w-full text-left p-1.5 rounded text-xs transition-colors ${
                      selectedNodeId === 'estate-fuel-wtt' ? 'bg-sky-100 dark:bg-sky-950/60 font-semibold' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-sky-800 dark:text-sky-400">Scope 3 Cat 3: Fuel WTT</span>
                      <span className="font-mono">{results.estateScope3Cat3FuelWtt.toFixed(0)}</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedNodeId('estate-biogenic-fuel')}
                    className={`w-full text-left p-1.5 rounded text-xs transition-colors ${
                      selectedNodeId === 'estate-biogenic-fuel' ? 'bg-violet-100 dark:bg-violet-950/60 font-semibold' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-violet-800 dark:text-violet-400">Biogenic: B35/B40 Blend</span>
                      <span className="font-mono">{results.estateBiogenicFuelCarbon.toFixed(0)}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Conservation & Harvest Row */}
            <div className="flex items-center justify-between pt-2 border-t border-emerald-200 dark:border-emerald-900/60">
              <button
                onClick={() => setSelectedNodeId('conservation-areas')}
                className={`text-xs px-2.5 py-1.5 rounded-md border flex items-center gap-1.5 ${
                  selectedNodeId === 'conservation-areas'
                    ? 'border-emerald-600 bg-emerald-100 dark:bg-emerald-950 font-semibold'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>HCV Forest, Peat & Riparian Conservation</span>
              </button>
              <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Harvest: <span className="font-mono text-neutral-900 dark:text-neutral-100">{results.totalFfbProcessedTon.toLocaleString()} t FFB</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: SUPPLY BASE & TRANSPORT (2 COLS) */}
          <div className="lg:col-span-2 flex flex-col justify-between p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/40 space-y-3">
            <div>
              <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                FFB Supply Base
              </div>
              <p className="text-[11px] text-neutral-500 mb-2">
                Scope allocation driven by operational control
              </p>

              {/* 3rd Party Supplier Box (Dashed as outside UoC) */}
              <button
                onClick={() => setSelectedNodeId('third-party-ffb-purchase')}
                className={`w-full p-2 rounded-lg text-left border-2 border-dashed transition-all mb-2 ${
                  selectedNodeId === 'third-party-ffb-purchase'
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40'
                    : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-semibold text-sky-700 dark:text-sky-400">
                  <span>3rd Party FFB</span>
                  <span className="text-[9px] bg-sky-100 dark:bg-sky-900 px-1 rounded">Scope 3</span>
                </div>
                <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Independent Smallholders</div>
                <div className="text-[11px] font-mono text-neutral-500 mt-1">{results.thirdPartyFfbTon.toLocaleString()} t FFB</div>
              </button>

              {/* Transport to Mill Arrow Box */}
              <button
                onClick={() => setSelectedNodeId('transport-ffb')}
                className={`w-full p-2 rounded-lg text-left border transition-all ${
                  selectedNodeId === 'transport-ffb'
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Transport to Mill</span>
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5">Cat 4 for 3rd Party suppliers</div>
              </button>
            </div>

            {/* Recycled Organics Flow Note */}
            <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-[10px] text-emerald-900 dark:text-emerald-300">
              <span className="font-bold">Organic Recycling:</span> POME, compost, and EFB flow back to estate fertiliser.
            </div>
          </div>

          {/* SECTION 3: MILL OPERATIONS & PRODUCTS (4 COLS) */}
          <div className="lg:col-span-4 p-3 rounded-lg border-2 border-amber-600/60 bg-amber-50/20 dark:bg-amber-950/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Palm Oil Mill (POM) Boundary
              </span>
              <span className="text-[11px] font-mono text-neutral-500">Mill Scope 1 & 2</span>
            </div>

            {/* Milling Physical Train */}
            <button
              onClick={() => setSelectedNodeId('mill-operations')}
              className={`w-full p-2.5 rounded-lg text-left border transition-all ${
                selectedNodeId === 'mill-operations'
                  ? 'ring-2 ring-amber-600 bg-white dark:bg-neutral-800 shadow-md'
                  : 'bg-white/80 dark:bg-neutral-800/80 hover:bg-white border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">
                Sterilisation · Threshing · Clarification · Extraction
              </div>
              <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                Mill Processing Core
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-medium">
                  CPO: {results.totalCpoProducedTon.toLocaleString(undefined, { maximumFractionDigits: 0 })} t
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 font-medium">
                  PK: {results.totalPkProducedTon.toLocaleString(undefined, { maximumFractionDigits: 0 })} t
                </span>
              </div>
            </button>

            {/* POME & Methane Treatment Grid */}
            <div className="p-2.5 bg-white/90 dark:bg-neutral-800/90 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-800 dark:text-neutral-200">
                <span>POME & Methane Accounting</span>
                <span className="text-[10px] text-blue-600 font-mono">V5 in m³ & COD</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedNodeId('pome-lagoon')}
                  className={`p-2 rounded text-left border transition-colors ${
                    selectedNodeId === 'pome-lagoon'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60'
                      : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">Scope 1 · Open Lagoon</div>
                  <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">Anaerobic Pond</div>
                  <div className="text-[11px] font-mono text-neutral-500 mt-0.5">{results.millScope1PomeLagoon.toLocaleString(undefined, { maximumFractionDigits: 0 })} tCO₂e</div>
                </button>

                <button
                  onClick={() => setSelectedNodeId('methane-capture')}
                  className={`p-2 rounded text-left border transition-colors ${
                    selectedNodeId === 'methane-capture'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60'
                      : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <span>Biogas Plant</span>
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900 px-1 rounded">V5 Details</span>
                  </div>
                  <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">Methane Capture</div>
                  <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{mill.treatmentAllocationMethaneCapturePercent}% Captured</div>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <button
                  onClick={() => setSelectedNodeId('composting-plant')}
                  className={`p-1.5 rounded border text-left ${
                    selectedNodeId === 'composting-plant' ? 'border-neutral-500 font-semibold bg-neutral-100 dark:bg-neutral-800' : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  Composting: {mill.treatmentAllocationCompostPercent}% POME
                </button>
                <button
                  onClick={() => setSelectedNodeId('grid-electricity-export')}
                  className={`p-1.5 rounded border text-left ${
                    selectedNodeId === 'grid-electricity-export' ? 'border-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  Power Export: {(mill.excessElectricityExportGridKwh / 1000).toLocaleString()} MWh
                </button>
              </div>
            </div>

            {/* Mill Biomass & Boiler Energy */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedNodeId('biomass-export')}
                className={`p-2 rounded-lg text-left border transition-all ${
                  selectedNodeId === 'biomass-export'
                    ? 'ring-2 ring-emerald-600 bg-white dark:bg-neutral-800 shadow-md'
                    : 'bg-white/80 dark:bg-neutral-800/80 hover:bg-white border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">Emissions Avoided</span>
                  <span className="text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-1 rounded font-medium">+Fibre</span>
                </div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Biomass Export</div>
                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">-{results.millAvoidedBiomassExport.toLocaleString(undefined, { maximumFractionDigits: 0 })} tCO₂e</div>
              </button>

              <button
                onClick={() => setSelectedNodeId('mill-biogenic-boiler')}
                className={`p-2 rounded-lg text-left border transition-all ${
                  selectedNodeId === 'mill-biogenic-boiler'
                    ? 'ring-2 ring-violet-600 bg-white dark:bg-neutral-800 shadow-md'
                    : 'bg-white/80 dark:bg-neutral-800/80 hover:bg-white border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-semibold text-violet-700 dark:text-violet-400">Biogenic Carbon</span>
                  <span className="text-[9px] bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 px-1 rounded font-medium">V5 Line</span>
                </div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Boiler Solid Biofuel</div>
                <div className="text-[11px] font-mono text-neutral-500 mt-1">{results.millBiogenicBoilerCarbon.toLocaleString(undefined, { maximumFractionDigits: 0 })} tCO₂e</div>
              </button>
            </div>
          </div>
        </div>

        {/* Legend strip matching official RSPO slide */}
        <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 border-2 border-neutral-800 dark:border-neutral-200 bg-white dark:bg-neutral-800 rounded-xs"></span>
            <span>Component within UoC</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 border-2 border-dashed border-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-xs"></span>
            <span>Non-UoC / 3rd Party</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-500"></span>
            <span>Emission Flow</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-500"></span>
            <span>Sequestration / Avoided</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded font-semibold">NEW V5</span>
            <span>PalmGHG V5 New Methodology</span>
          </div>
        </div>
      </div>

      {/* Selected Node Inspector Drawer / Card */}
      {selectedNode && (
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <span className={`text-xs px-2.5 py-1 rounded-md border font-semibold ${selectedNode.scopeColor}`}>
                {selectedNode.scopeTag}
              </span>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {selectedNode.name}
              </h3>
              {selectedNode.isNewInV5 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-semibold">
                  NEW in PalmGHG V5
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedNode.valueDisplay && (
                <div className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">
                  {selectedNode.valueDisplay}
                </div>
              )}
              <button
                onClick={() => onNavigateToTab(selectedNode.tabTarget)}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust Parameters</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
            <div>
              <span className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Process Description & Scope Alignment:
              </span>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {selectedNode.description}
              </p>
            </div>
            <div>
              <span className="font-semibold text-emerald-800 dark:text-emerald-400 block mb-1">
                What's Changed from V4 to V5:
              </span>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {selectedNode.v5ChangeDetails}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
