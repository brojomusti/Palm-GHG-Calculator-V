import React, { useState, useMemo } from 'react';
import { EstateParameters, MillParameters } from '../types/palmghg';
import {
  MassUnit,
  toDisplayTons,
  fromInputTons,
  getUnitLabel,
  getUnitSuffix,
} from '../utils/unitConversion';
import {
  Sprout,
  TreePine,
  FlaskConical,
  Factory,
  Flame,
  Zap,
  Info,
  Layers,
  Sparkles,
  Scale,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  FileText,
  Sliders,
} from 'lucide-react';
import { validatePalmGhgData, ValidationIssue } from '../utils/palmGhgValidation';
import { ValidationTooltip, ValidationInlineNotice } from './ValidationTooltip';
import { ValidationBanner } from './ValidationBanner';
import { CsvImportModal } from './CsvImportModal';
import { generateSampleCsvContent, triggerFileDownload } from '../utils/csvInventoryHandler';
import { LucCalculatorModule } from './LucCalculatorModule';
import { FertilizerOptimizationModule } from './FertilizerOptimizationModule';

interface Props {
  estate: EstateParameters;
  mill: MillParameters;
  onUpdateEstate: (estate: EstateParameters) => void;
  onUpdateMill: (mill: MillParameters) => void;
  activeSubTab?: string;
  massUnit?: MassUnit;
  onToggleMassUnit?: (unit: MassUnit) => void;
  isDark?: boolean;
  assessmentYear?: number;
}

export const CalculatorForm: React.FC<Props> = ({
  estate,
  mill,
  onUpdateEstate,
  onUpdateMill,
  activeSubTab,
  massUnit: externalMassUnit,
  onToggleMassUnit,
  isDark = false,
  assessmentYear = 2026,
}) => {
  const [tab, setTab] = useState<string>(activeSubTab || 'planting');
  const [internalMassUnit, setInternalMassUnit] = useState<MassUnit>('metric');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isFertOptimizerOpen, setIsFertOptimizerOpen] = useState(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  const currentMassUnit = externalMassUnit ?? internalMassUnit;
  const setMassUnit = (unit: MassUnit) => {
    if (onToggleMassUnit) {
      onToggleMassUnit(unit);
    } else {
      setInternalMassUnit(unit);
    }
  };

  const handleApplyInventory = (newEstate: EstateParameters, newMill: MillParameters, summaryText: string) => {
    onUpdateEstate(newEstate);
    onUpdateMill(newMill);
    setImportNotification(summaryText);
    setTimeout(() => {
      setImportNotification(null);
    }, 9000);
  };

  const handleDownloadTemplate = () => {
    const templateContent = generateSampleCsvContent('template');
    triggerFileDownload(templateContent, 'rspo_palmghg_v5_inventory_template.csv');
  };

  const handleExportCurrentInventory = () => {
    const currentContent = generateSampleCsvContent('current', estate, mill);
    triggerFileDownload(currentContent, `rspo_palmghg_v5_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Run RSPO PalmGHG v5 benchmark validation engine
  const validationSummary = useMemo(() => {
    return validatePalmGhgData(estate, mill);
  }, [estate, mill]);

  // Helper for dynamic input border highlighting based on audit severity
  const getInputClass = (issue?: ValidationIssue, customWidth?: string) => {
    const width = customWidth || 'w-full';
    if (issue?.severity === 'error') {
      return `${width} px-3 py-1.5 rounded-lg border-2 border-rose-500 dark:border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 font-mono text-neutral-900 dark:text-neutral-100 ring-2 ring-rose-400/20 transition-all`;
    }
    if (issue?.severity === 'warning') {
      return `${width} px-3 py-1.5 rounded-lg border-2 border-amber-400 dark:border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 font-mono text-neutral-900 dark:text-neutral-100 ring-2 ring-amber-400/20 transition-all`;
    }
    return `${width} px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono text-neutral-900 dark:text-neutral-100 transition-all`;
  };

  // Fix individual parameter to suggested RSPO benchmark
  const handleApplyIssueFix = (fieldKey: string, tabKey: string, suggestedValue: number) => {
    if (tabKey === 'planting' || tabKey === 'fert-fuel') {
      if (fieldKey === 'totalPlantedAreaHa') {
        updateEstate('totalPlantedAreaHa', suggestedValue);
      } else if (fieldKey === 'peatSoilAreaHa') {
        updateEstate('peatSoilAreaHa', suggestedValue);
      } else if (fieldKey === 'mineralSoilAreaHa') {
        updateEstate('mineralSoilAreaHa', suggestedValue);
      } else if (fieldKey === 'peatDrainageDepthCm') {
        updateEstate('peatDrainageDepthCm', suggestedValue);
      } else if (fieldKey === 'grossLucTotalTco2e') {
        updateEstate('grossLucTotalTco2e', suggestedValue);
      } else if (fieldKey === 'grossLucAmortisationYears') {
        updateEstate('grossLucAmortisationYears', suggestedValue);
      } else if (fieldKey === 'croplandConversionHa') {
        updateEstate('croplandConversionHa', suggestedValue);
      } else if (fieldKey === 'standingRetiredPalmAreaHa') {
        updateEstate('standingRetiredPalmAreaHa', suggestedValue);
      } else if (fieldKey === 'standingRetiredPalmSequestrationRate') {
        updateEstate('standingRetiredPalmSequestrationRate', suggestedValue);
      } else if (fieldKey === 'forestConservationAreaHa') {
        updateEstate('forestConservationAreaHa', suggestedValue);
      } else if (fieldKey === 'nonForestConservationAreaHa') {
        updateEstate('nonForestConservationAreaHa', suggestedValue);
      } else if (fieldKey === 'peatlandConservationAreaHa') {
        updateEstate('peatlandConservationAreaHa', suggestedValue);
      } else if (fieldKey === 'otherEligibleCarbonRemovalsTco2e') {
        updateEstate('otherEligibleCarbonRemovalsTco2e', suggestedValue);
      } else if (fieldKey === 'syntheticNStandardKg') {
        const remaining = Math.max(0, suggestedValue - estate.syntheticNInhibitedKg);
        updateEstate('syntheticNStandardKg', remaining);
      } else if (fieldKey === 'syntheticNInhibitedKg') {
        updateEstate('syntheticNInhibitedKg', suggestedValue);
      } else if (fieldKey === 'syntheticP2O5Kg') {
        updateEstate('syntheticP2O5Kg', suggestedValue);
      } else if (fieldKey === 'syntheticK2OKg') {
        updateEstate('syntheticK2OKg', suggestedValue);
      } else if (fieldKey === 'rockPhosphateKg') {
        updateEstate('rockPhosphateKg', suggestedValue);
      } else if (fieldKey === 'fertiliserTransportDistanceKm') {
        updateEstate('fertiliserTransportDistanceKm', suggestedValue);
      } else if (fieldKey === 'pomeLandApplicationM3') {
        updateEstate('pomeLandApplicationM3', suggestedValue);
      } else if (fieldKey === 'compostLandApplicationTon') {
        updateEstate('compostLandApplicationTon', suggestedValue);
      } else if (fieldKey === 'efbMulchingTon') {
        updateEstate('efbMulchingTon', suggestedValue);
      } else if (fieldKey === 'stationaryFuelDieselLiters') {
        updateEstate('stationaryFuelDieselLiters', suggestedValue);
      } else if (fieldKey === 'mobileFuelDieselLiters') {
        const remaining = Math.max(0, suggestedValue - estate.stationaryFuelDieselLiters);
        updateEstate('mobileFuelDieselLiters', remaining);
      } else if (fieldKey === 'biodieselBlendPercent') {
        updateEstate('biodieselBlendPercent', suggestedValue);
      } else if (fieldKey === 'estateGridElectricityKwh') {
        updateEstate('estateGridElectricityKwh', suggestedValue);
      }
    } else {
      if (fieldKey === 'cpoExtractionRatePercent') {
        updateMill('cpoExtractionRatePercent', suggestedValue);
      } else if (fieldKey === 'pkExtractionRatePercent') {
        updateMill('pkExtractionRatePercent', suggestedValue);
      } else if (fieldKey === 'efbGenerationRatePercent') {
        updateMill('efbGenerationRatePercent', suggestedValue);
      } else if (fieldKey === 'pksGenerationRatePercent') {
        updateMill('pksGenerationRatePercent', suggestedValue);
      } else if (fieldKey === 'fibreGenerationRatePercent') {
        updateMill('fibreGenerationRatePercent', suggestedValue);
      } else if (fieldKey === 'pksExportTon') {
        updateMill('pksExportTon', suggestedValue);
      } else if (fieldKey === 'efbExportTon') {
        updateMill('efbExportTon', suggestedValue);
      } else if (fieldKey === 'mesocarpFibreExportTon') {
        updateMill('mesocarpFibreExportTon', suggestedValue);
      } else if (fieldKey === 'pomeGenerationRatioM3PerTonFfb') {
        updateMill('pomeGenerationRatioM3PerTonFfb', suggestedValue);
      } else if (fieldKey === 'codInletMgPerL') {
        updateMill('codInletMgPerL', suggestedValue);
      } else if (fieldKey === 'treatmentAllocationSplit') {
        onUpdateMill({
          ...mill,
          treatmentAllocationOpenLagoonPercent: 20,
          treatmentAllocationCompostPercent: 10,
          treatmentAllocationMethaneCapturePercent: 70,
        });
      } else if (fieldKey === 'biogasMethaneContentPercent') {
        updateMill('biogasMethaneContentPercent', suggestedValue);
      } else if (fieldKey === 'methaneCaptureEfficiencyPercent') {
        updateMill('methaneCaptureEfficiencyPercent', suggestedValue);
      } else if (fieldKey === 'methaneUtilizationSplit') {
        onUpdateMill({
          ...mill,
          methaneGasEngineUtilizationPercent: 50,
          methaneBoilerUtilizationPercent: 30,
          methaneEnclosedFlaringPercent: 20,
          methaneOpenFlaringPercent: 0,
        });
      } else if (fieldKey === 'millStationaryDieselLiters') {
        updateMill('millStationaryDieselLiters', suggestedValue);
      } else if (fieldKey === 'millMobileDieselLiters') {
        updateMill('millMobileDieselLiters', suggestedValue);
      } else if (fieldKey === 'biomassBurnedBoilerTon') {
        updateMill('biomassBurnedBoilerTon', suggestedValue);
      } else if (fieldKey === 'millGridElectricityKwh') {
        updateMill('millGridElectricityKwh', suggestedValue);
      } else if (fieldKey === 'excessElectricityExportGridKwh') {
        updateMill('excessElectricityExportGridKwh', suggestedValue);
      }
    }
  };

  // Auto-reset all parameters with warnings or errors to certified RSPO PalmGHG v5 benchmarks
  const handleResetAllBenchmarks = () => {
    const pArea = Math.max(estate.totalPlantedAreaHa, 9300);
    onUpdateEstate({
      ...estate,
      totalPlantedAreaHa: pArea,
      peatSoilAreaHa: Math.min(estate.peatSoilAreaHa, pArea * 0.1),
      peatDrainageDepthCm: 60,
      grossLucAmortisationYears: 25,
      syntheticNStandardKg: Math.round(pArea * 40),
      syntheticNInhibitedKg: Math.round(pArea * 70), // 110 kg N/ha total
      syntheticP2O5Kg: Math.round(pArea * 45),
      syntheticK2OKg: Math.round(pArea * 180),
      mobileFuelDieselLiters: Math.round(pArea * 45),
      stationaryFuelDieselLiters: Math.round(pArea * 15),
      biodieselBlendPercent: 35,
    });
    onUpdateMill({
      ...mill,
      cpoExtractionRatePercent: 21.8,
      pkExtractionRatePercent: 5.4,
      pomeGenerationRatioM3PerTonFfb: 0.65,
      codInletMgPerL: 55000,
      treatmentAllocationOpenLagoonPercent: 20,
      treatmentAllocationCompostPercent: 10,
      treatmentAllocationMethaneCapturePercent: 70,
      biogasMethaneContentPercent: 60,
      methaneCaptureEfficiencyPercent: 90,
    });
  };

  // Simulate an out-of-range benchmark scenario for testing and audit training
  const handleLoadAnomalyTestSample = () => {
    const pArea = Math.max(estate.totalPlantedAreaHa, 9300);
    onUpdateEstate({
      ...estate,
      syntheticNStandardKg: Math.round(pArea * 270), // ~330 kg N/ha (exceeds 180 kg/ha benchmark)
      syntheticNInhibitedKg: Math.round(pArea * 60),
      peatDrainageDepthCm: 90, // exceeds RSPO BMP 40-60 cm
    });
    onUpdateMill({
      ...mill,
      cpoExtractionRatePercent: 27.5, // exceeds 24.5% biological benchmark
      pomeGenerationRatioM3PerTonFfb: 1.12, // exceeds 0.85 m3/t FFB benchmark
      codInletMgPerL: 88000, // exceeds 65,000 mg/L benchmark
    });
  };

  // React to prop changes if requested externally (e.g. from the interactive diagram)
  React.useEffect(() => {
    if (activeSubTab) {
      if (activeSubTab === 'estate-planting') setTab('planting');
      else if (activeSubTab === 'estate-fert-fuel') setTab('fert-fuel');
      else if (activeSubTab === 'mill-ops') setTab('mill-ops');
      else if (activeSubTab === 'mill-pome') setTab('mill-pome');
      else if (activeSubTab === 'luc' || activeSubTab === 'estate-luc') setTab('luc');
    }
  }, [activeSubTab]);

  const updateEstate = (field: keyof EstateParameters, value: number) => {
    onUpdateEstate({
      ...estate,
      [field]: isNaN(value) ? 0 : value,
    });
  };

  const updateMill = (field: keyof MillParameters, value: number) => {
    onUpdateMill({
      ...mill,
      [field]: isNaN(value) ? 0 : value,
    });
  };

  // Tab issue badges
  const plantingIssues = validationSummary.byTab.planting || [];
  const fertFuelIssues = validationSummary.byTab['fert-fuel'] || [];
  const millOpsIssues = validationSummary.byTab['mill-ops'] || [];
  const millPomeIssues = validationSummary.byTab['mill-pome'] || [];

  return (
    <div className="space-y-4">
      {/* GLOBAL UNIT CONVERSION UTILITY BAR */}
      <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <div>
            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span>Global Mass Unit Conversion Utility</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-normal bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                1 MT = 1.1023 Short Tons (2,000 lbs)
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Toggle input fields between Metric (tonnes) and Imperial (US short tons). Values automatically convert to the RSPO standard metric calculation baseline.
            </p>
          </div>
        </div>

        {/* Unit Toggle Control */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-semibold shrink-0">
          <button
            onClick={() => setMassUnit('metric')}
            className={`px-3 py-1 rounded-md transition-all whitespace-nowrap ${
              currentMassUnit === 'metric'
                ? 'bg-white dark:bg-neutral-700 text-emerald-800 dark:text-emerald-300 shadow-xs font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Metric (Tonnes / t)
          </button>
          <button
            onClick={() => setMassUnit('imperial')}
            className={`px-3 py-1 rounded-md transition-all whitespace-nowrap ${
              currentMassUnit === 'imperial'
                ? 'bg-white dark:bg-neutral-700 text-blue-800 dark:text-blue-300 shadow-xs font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Imperial (Short Tons / tn)
          </button>
        </div>
      </div>

      {/* CSV INVENTORY DATA MANAGEMENT UTILITY BAR */}
      <div className="p-3 bg-neutral-50/70 dark:bg-neutral-900/60 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span>RSPO GHG Inventory Data Ingestion</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-normal bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                CSV / TSV Bulk Import
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Upload pre-formatted operational records for estate planting, fertilisers, fuels, and mill mass balances. Includes diff preview and audit verification.
            </p>
          </div>
        </div>

        {/* CSV Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors shadow-2xs"
            title="Download blank sample template with standard RSPO PalmGHG v5 parameter keys"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Sample Template (.csv)</span>
          </button>

          <button
            onClick={handleExportCurrentInventory}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 transition-colors"
            title="Export current session estate and mill parameters to CSV"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export (.csv)</span>
          </button>

          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>
        </div>
      </div>

      {/* IMPORT SUCCESS TOAST NOTIFICATION */}
      {importNotification && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{importNotification}</span>
          </div>
          <button
            onClick={() => setImportNotification(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 font-bold px-2 py-0.5 rounded text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* RSPO PALMGHG V5 BENCHMARK & AUDIT DATA QUALITY BANNER */}
      <ValidationBanner
        summary={validationSummary}
        activeTab={tab}
        onSelectTab={setTab}
        onApplyIssueFix={handleApplyIssueFix}
        onResetAllBenchmarks={handleResetAllBenchmarks}
        onLoadAnomalyTestSample={handleLoadAnomalyTestSample}
      />

      {/* Tab Navigation with Dynamic Validation Badges */}
      <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setTab('planting')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            tab === 'planting'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <Sprout className="w-3.5 h-3.5 text-emerald-600" />
          <span>1. Planting, Peat & Removals (LSR v1.1)</span>
          {plantingIssues.length > 0 && (
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                plantingIssues.some((i) => i.severity === 'error')
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {plantingIssues.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('fert-fuel')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            tab === 'fert-fuel'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5 text-sky-600" />
          <span>2. Fertiliser, Fuels & Field Energy</span>
          {fertFuelIssues.length > 0 && (
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                fertFuelIssues.some((i) => i.severity === 'error')
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {fertFuelIssues.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('mill-ops')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            tab === 'mill-ops'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <Factory className="w-3.5 h-3.5 text-amber-600" />
          <span>3. Mill Extraction & Biomass Export</span>
          {millOpsIssues.length > 0 && (
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                millOpsIssues.some((i) => i.severity === 'error')
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {millOpsIssues.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('mill-pome')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            tab === 'mill-pome'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-orange-600" />
          <span>4. POME, Methane Capture & Energy</span>
          {millPomeIssues.length > 0 && (
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                millPomeIssues.some((i) => i.severity === 'error')
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {millPomeIssues.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('luc')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            tab === 'luc'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          <span>5. Land Use Change (LUC) Calculator</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            V5 Engine
          </span>
        </button>
      </div>

      {/* TAB 1: PLANTING DATA, PEAT & REMOVALS */}
      {tab === 'planting' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: Planting & Gross LUC (LSR v1.1) */}
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Planting Data & Land Use Change (LSR v1.1)
                </h3>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded font-semibold">
                LSR Amortised
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                    <span>Total Planted Area (ha)</span>
                    <ValidationTooltip
                      issue={validationSummary.byField.totalPlantedAreaHa}
                      benchmarkRange="50 – 50,000 ha"
                      citation="RSPO PalmGHG v5 Section 2.1 (Scope & Unit of Certification)"
                      onApplySuggested={(val) => updateEstate('totalPlantedAreaHa', val)}
                    />
                  </label>
                  <span className="text-[10px] text-neutral-500 font-mono">Benchmark: 50 – 50,000 ha</span>
                </div>
                <input
                  type="number"
                  value={estate.totalPlantedAreaHa}
                  onChange={(e) => updateEstate('totalPlantedAreaHa', Number(e.target.value))}
                  className={getInputClass(validationSummary.byField.totalPlantedAreaHa)}
                />
                <ValidationInlineNotice
                  issue={validationSummary.byField.totalPlantedAreaHa}
                  onApplySuggested={(val) => updateEstate('totalPlantedAreaHa', val)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                      <span>Peat Soil Area (ha)</span>
                      <ValidationTooltip
                        issue={validationSummary.byField.peatSoilAreaHa}
                        benchmarkRange="≤ Planted Area"
                        citation="RSPO PalmGHG v5 Section 2.3.1 (Peat Soil Accounting)"
                        onApplySuggested={(val) => updateEstate('peatSoilAreaHa', val)}
                      />
                    </label>
                  </div>
                  <input
                    type="number"
                    value={estate.peatSoilAreaHa}
                    onChange={(e) => updateEstate('peatSoilAreaHa', Number(e.target.value))}
                    className={getInputClass(validationSummary.byField.peatSoilAreaHa)}
                  />
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Emission factor: ~54.6 tCO₂e/ha/yr</span>
                  <ValidationInlineNotice
                    issue={validationSummary.byField.peatSoilAreaHa}
                    onApplySuggested={(val) => updateEstate('peatSoilAreaHa', val)}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                      <span>Mineral Soil Area (ha)</span>
                      <ValidationTooltip
                        issue={validationSummary.byField.mineralSoilAreaHa}
                        benchmarkRange="≥ 0 ha (Peat + Mineral = Planted)"
                        citation="RSPO PalmGHG v5 Section 2.1"
                        onApplySuggested={(val) => handleApplyIssueFix('mineralSoilAreaHa', 'planting', val)}
                      />
                    </label>
                  </div>
                  <input
                    type="number"
                    value={estate.mineralSoilAreaHa}
                    onChange={(e) => updateEstate('mineralSoilAreaHa', Number(e.target.value))}
                    className={getInputClass(validationSummary.byField.mineralSoilAreaHa)}
                  />
                  <ValidationInlineNotice
                    issue={validationSummary.byField.mineralSoilAreaHa}
                    onApplySuggested={(val) => handleApplyIssueFix('mineralSoilAreaHa', 'planting', val)}
                  />
                </div>
              </div>

              {/* RSPO V5 Subbab 2.3.1.3: Peat Water Management Depth (60, 75, 100 cm) */}
              {estate.peatSoilAreaHa > 0 && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">
                    <div className="flex items-center gap-1">
                      <span>Pengelolaan Air Gambut (Subbab 2.3.1.3):</span>
                      <ValidationTooltip
                        issue={validationSummary.byField.peatDrainageDepthCm}
                        benchmarkRange="40 – 80 cm (BMP standard ~60 cm)"
                        citation="RSPO PalmGHG v5 Subbab 2.3.1.3 & P&C 7.7"
                        onApplySuggested={(val) => updateEstate('peatDrainageDepthCm', val)}
                      />
                    </div>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {estate.peatDrainageDepthCm || 60} cm
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => updateEstate('peatDrainageDepthCm', 60)}
                      className={`p-2 rounded-lg text-center border transition-all ${
                        (estate.peatDrainageDepthCm || 60) === 60
                          ? 'bg-emerald-600 text-white font-bold border-emerald-700 shadow-xs'
                          : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-emerald-400'
                      }`}
                    >
                      <span className="block font-bold">60 cm</span>
                      <span className="text-[9px] opacity-85">Terkelola Baik</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateEstate('peatDrainageDepthCm', 75)}
                      className={`p-2 rounded-lg text-center border transition-all ${
                        estate.peatDrainageDepthCm === 75
                          ? 'bg-amber-600 text-white font-bold border-amber-700 shadow-xs'
                          : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-amber-400'
                      }`}
                    >
                      <span className="block font-bold">75 cm</span>
                      <span className="text-[9px] opacity-85">Sebagian</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateEstate('peatDrainageDepthCm', 100)}
                      className={`p-2 rounded-lg text-center border transition-all ${
                        estate.peatDrainageDepthCm === 100
                          ? 'bg-red-600 text-white font-bold border-red-700 shadow-xs'
                          : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-red-400'
                      }`}
                    >
                      <span className="block font-bold">100 cm</span>
                      <span className="text-[9px] opacity-85">Tanpa Kelola</span>
                    </button>
                  </div>
                  <ValidationInlineNotice
                    issue={validationSummary.byField.peatDrainageDepthCm}
                    onApplySuggested={(val) => updateEstate('peatDrainageDepthCm', val)}
                  />
                </div>
              )}

              {/* Gross LUC with Linear 25-yr Amortisation */}
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800/40 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-200">
                  <span>Gross Land Use Change (LUC) Debt</span>
                  <span>Linear 25-Year Amortisation</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center">
                        <span>Gross LUC Debt (tCO₂e)</span>
                        <ValidationTooltip
                          issue={validationSummary.byField.grossLucTotalTco2e}
                          benchmarkRange="≥ 0 tCO₂e"
                          citation="RSPO PalmGHG v5 Subbab 2.2"
                          onApplySuggested={(val) => handleApplyIssueFix('grossLucTotalTco2e', 'planting', val)}
                        />
                      </label>
                    </div>
                    <input
                      type="number"
                      value={estate.grossLucTotalTco2e}
                      onChange={(e) => updateEstate('grossLucTotalTco2e', Number(e.target.value))}
                      className={getInputClass(validationSummary.byField.grossLucTotalTco2e, 'w-full px-2.5 py-1')}
                    />
                    <ValidationInlineNotice
                      issue={validationSummary.byField.grossLucTotalTco2e}
                      onApplySuggested={(val) => handleApplyIssueFix('grossLucTotalTco2e', 'planting', val)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center">
                        <span>Amortisation (Years)</span>
                        <ValidationTooltip
                          issue={validationSummary.byField.grossLucAmortisationYears}
                          benchmarkRange="25 years"
                          citation="RSPO PalmGHG v5 Subbab 2.2"
                          onApplySuggested={(val) => updateEstate('grossLucAmortisationYears', val)}
                        />
                      </label>
                    </div>
                    <input
                      type="number"
                      value={estate.grossLucAmortisationYears}
                      onChange={(e) => updateEstate('grossLucAmortisationYears', Number(e.target.value))}
                      className={getInputClass(validationSummary.byField.grossLucAmortisationYears)}
                    />
                    <ValidationInlineNotice
                      issue={validationSummary.byField.grossLucAmortisationYears}
                      onApplySuggested={(val) => updateEstate('grossLucAmortisationYears', val)}
                    />
                  </div>
                </div>
                <div className="text-[11px] text-amber-800 dark:text-amber-300 font-mono flex justify-between">
                  <span>Annual Scope 1 LUC Amortised:</span>
                  <span className="font-bold">
                    {(estate.grossLucTotalTco2e / (estate.grossLucAmortisationYears || 25)).toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e/yr
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-amber-200/50 dark:border-amber-800/40">
                  <span className="text-[10px] text-amber-700 dark:text-amber-400">
                    Hitung otomatis berdasarkan tutupan lahan awal, jenis tanah & tahun konversi:
                  </span>
                  <button
                    type="button"
                    onClick={() => setTab('luc')}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline"
                  >
                    <span>Buka Kalkulator LUC Khusus →</span>
                  </button>
                </div>
              </div>

              {/* Land Management: Cropland to Oil Palm */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                      <span>Cropland Conversion (ha)</span>
                      <ValidationTooltip
                        issue={validationSummary.byField.croplandConversionHa}
                        benchmarkRange="≤ Planted Area"
                        citation="RSPO PalmGHG v5 Subbab 2.2.3"
                        onApplySuggested={(val) => handleApplyIssueFix('croplandConversionHa', 'planting', val)}
                      />
                    </label>
                  </div>
                  <input
                    type="number"
                    value={estate.croplandConversionHa}
                    onChange={(e) => updateEstate('croplandConversionHa', Number(e.target.value))}
                    className={getInputClass(validationSummary.byField.croplandConversionHa)}
                  />
                  <ValidationInlineNotice
                    issue={validationSummary.byField.croplandConversionHa}
                    onApplySuggested={(val) => handleApplyIssueFix('croplandConversionHa', 'planting', val)}
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    SOC Factor (tCO₂e/ha/yr)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={estate.croplandManagementFactor}
                    onChange={(e) => updateEstate('croplandManagementFactor', Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                  />
                </div>
              </div>

              {/* Standing Retired Palm (>25 Years) [NEW] */}
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Standing Retired Oil Palm {'>'}25y (NEW in V5)</span>
                  </span>
                  <span>Carbon Removal</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center">
                        <span>Retired Area (ha)</span>
                        <ValidationTooltip
                          issue={validationSummary.byField.standingRetiredPalmAreaHa}
                          benchmarkRange="≤ Planted Area"
                          citation="RSPO PalmGHG v5 Subbab 2.2.4"
                          onApplySuggested={(val) => handleApplyIssueFix('standingRetiredPalmAreaHa', 'planting', val)}
                        />
                      </label>
                    </div>
                    <input
                      type="number"
                      value={estate.standingRetiredPalmAreaHa}
                      onChange={(e) => updateEstate('standingRetiredPalmAreaHa', Number(e.target.value))}
                      className={getInputClass(validationSummary.byField.standingRetiredPalmAreaHa, 'w-full px-2.5 py-1 font-mono')}
                    />
                    <ValidationInlineNotice
                      issue={validationSummary.byField.standingRetiredPalmAreaHa}
                      onApplySuggested={(val) => handleApplyIssueFix('standingRetiredPalmAreaHa', 'planting', val)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center">
                        <span>Removal Rate (tCO₂e/ha/yr)</span>
                        <ValidationTooltip
                          issue={validationSummary.byField.standingRetiredPalmSequestrationRate}
                          benchmarkRange="1.0 – 3.0 tCO₂e/ha/yr"
                          citation="RSPO PalmGHG v5 Subbab 2.2.4"
                          onApplySuggested={(val) => handleApplyIssueFix('standingRetiredPalmSequestrationRate', 'planting', val)}
                        />
                      </label>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={estate.standingRetiredPalmSequestrationRate}
                      onChange={(e) => updateEstate('standingRetiredPalmSequestrationRate', Number(e.target.value))}
                      className={getInputClass(validationSummary.byField.standingRetiredPalmSequestrationRate, 'w-full px-2.5 py-1 font-mono')}
                    />
                    <ValidationInlineNotice
                      issue={validationSummary.byField.standingRetiredPalmSequestrationRate}
                      onApplySuggested={(val) => handleApplyIssueFix('standingRetiredPalmSequestrationRate', 'planting', val)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Carbon Removals (Expanded Conservation Accounting) */}
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <TreePine className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Expanded Conservation Accounting (Carbon Removals)
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-semibold">
                Optional Information
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                In PalmGHG V5, conservation areas are captured under <strong className="text-neutral-800 dark:text-neutral-200">Carbon Removals</strong> (separate from Planting Data) and broken down into Forest, Non-Forest, and Peatland conservation.
              </div>

              {/* Forest Conservation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                      <span>HCV Forest Conservation (ha)</span>
                      <ValidationTooltip
                        issue={validationSummary.byField.forestConservationAreaHa}
                        benchmarkRange="≥ 0 ha"
                        citation="RSPO PalmGHG v5 Subbab 2.4.1"
                        onApplySuggested={(val) => handleApplyIssueFix('forestConservationAreaHa', 'planting', val)}
                      />
                    </label>
                  </div>
                  <input
                    type="number"
                    value={estate.forestConservationAreaHa}
                    onChange={(e) => updateEstate('forestConservationAreaHa', Number(e.target.value))}
                    className={getInputClass(validationSummary.byField.forestConservationAreaHa)}
                  />
                  <ValidationInlineNotice
                    issue={validationSummary.byField.forestConservationAreaHa}
                    onApplySuggested={(val) => handleApplyIssueFix('forestConservationAreaHa', 'planting', val)}
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Removal Rate (tCO₂e/ha/yr)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={estate.forestConservationRate}
                    onChange={(e) => updateEstate('forestConservationRate', Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                  />
                </div>
              </div>

              {/* Non-Forest Conservation (NEW in V5) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                      <span>Non-Forest Conservation (ha)</span>
                      <ValidationTooltip
                        issue={validationSummary.byField.nonForestConservationAreaHa}
                        benchmarkRange="≥ 0 ha"
                        citation="RSPO PalmGHG v5 Subbab 2.4.2"
                        onApplySuggested={(val) => handleApplyIssueFix('nonForestConservationAreaHa', 'planting', val)}
                      />
                    </label>
                  </div>
                  <input
                    type="number"
                    value={estate.nonForestConservationAreaHa}
                    onChange={(e) => updateEstate('nonForestConservationAreaHa', Number(e.target.value))}
                    className={getInputClass(validationSummary.byField.nonForestConservationAreaHa)}
                  />
                  <span className="text-[10px] text-neutral-500">Riparian, grassland, scrub</span>
                  <ValidationInlineNotice
                    issue={validationSummary.byField.nonForestConservationAreaHa}
                    onApplySuggested={(val) => handleApplyIssueFix('nonForestConservationAreaHa', 'planting', val)}
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Removal Rate (tCO₂e/ha/yr)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={estate.nonForestConservationRate}
                    onChange={(e) => updateEstate('nonForestConservationRate', Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                  />
                </div>
              </div>

              {/* Peatland Conservation (NEW in V5) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                    <span>Peatland Conservation Area (ha)</span>
                    <ValidationTooltip
                      issue={validationSummary.byField.peatlandConservationAreaHa}
                      benchmarkRange="≥ 0 ha"
                      citation="RSPO PalmGHG v5 Subbab 2.4.3"
                      onApplySuggested={(val) => handleApplyIssueFix('peatlandConservationAreaHa', 'planting', val)}
                    />
                  </label>
                </div>
                <input
                  type="number"
                  value={estate.peatlandConservationAreaHa}
                  onChange={(e) => updateEstate('peatlandConservationAreaHa', Number(e.target.value))}
                  className={getInputClass(validationSummary.byField.peatlandConservationAreaHa)}
                />
                <span className="text-[10px] text-neutral-500">Conserved/rewetted peatland avoiding oxidation (-5.5 tCO₂e/ha/yr)</span>
                <ValidationInlineNotice
                  issue={validationSummary.byField.peatlandConservationAreaHa}
                  onApplySuggested={(val) => handleApplyIssueFix('peatlandConservationAreaHa', 'planting', val)}
                />
              </div>

              {/* Other Eligible Carbon Removals */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                    <span>Other Verified Carbon Removals (tCO₂e/yr)</span>
                    <ValidationTooltip
                      issue={validationSummary.byField.otherEligibleCarbonRemovalsTco2e}
                      benchmarkRange="≥ 0 tCO₂e/yr"
                      citation="RSPO PalmGHG v5 Subbab 2.4"
                      onApplySuggested={(val) => handleApplyIssueFix('otherEligibleCarbonRemovalsTco2e', 'planting', val)}
                    />
                  </label>
                </div>
                <input
                  type="number"
                  value={estate.otherEligibleCarbonRemovalsTco2e}
                  onChange={(e) => updateEstate('otherEligibleCarbonRemovalsTco2e', Number(e.target.value))}
                  className={getInputClass(validationSummary.byField.otherEligibleCarbonRemovalsTco2e)}
                />
                <ValidationInlineNotice
                  issue={validationSummary.byField.otherEligibleCarbonRemovalsTco2e}
                  onApplySuggested={(val) => handleApplyIssueFix('otherEligibleCarbonRemovalsTco2e', 'planting', val)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FERTILISERS, FIELD FUEL & ELECTRICITY */}
      {tab === 'fert-fuel' && (
        <div className="space-y-4">
          {/* Fertilizer Nitrogen vs Yield Optimization Module */}
          {isFertOptimizerOpen && (
            <FertilizerOptimizationModule
              estate={estate}
              onUpdateEstate={onUpdateEstate}
              isDark={isDark}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card 1: Fertilisers (Synthetic, NI/UI, & Recycled Organics) */}
            <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-sky-700" />
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Fertiliser Application (Synthetic & Organics)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFertOptimizerOpen(!isFertOptimizerOpen)}
                    aria-pressed={isFertOptimizerOpen}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all border ${
                      isFertOptimizerOpen
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60 dark:hover:bg-emerald-900/60'
                    }`}
                    title="Toggle fertilizer & yield trade-off optimization module"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Optimization</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isFertOptimizerOpen
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                    }`}>
                      {isFertOptimizerOpen ? 'ACTIVE' : 'OFF'}
                    </span>
                  </button>
                  <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded font-semibold hidden sm:inline-block">
                    NI / UI Inhibitors
                  </span>
                </div>
              </div>

            <div className="space-y-3 text-xs">
              {/* Nitrogen inputs: Standard vs NI/UI with RSPO Benchmark Validation */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 font-bold text-neutral-800 dark:text-neutral-200">
                    <span>Total Nitrogen Agronomic Benchmark</span>
                    <ValidationTooltip
                      issue={validationSummary.byField.syntheticNStandardKg}
                      benchmarkRange="80 – 180 kg N/ha/yr"
                      citation="RSPO PalmGHG v5 Section 2.3.2 & Corley & Tinker"
                      onApplySuggested={(val) => updateEstate('syntheticNStandardKg', Math.max(0, val - estate.syntheticNInhibitedKg))}
                    />
                  </div>
                  {estate.totalPlantedAreaHa > 0 && (
                    <span className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
                      Rate: <strong className="text-emerald-700 dark:text-emerald-400">{((estate.syntheticNStandardKg + estate.syntheticNInhibitedKg) / estate.totalPlantedAreaHa).toFixed(1)} kg N/ha</strong>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Standard Nitrogen (kg N/yr)
                    </label>
                    <input
                      type="number"
                      value={estate.syntheticNStandardKg}
                      onChange={(e) => updateEstate('syntheticNStandardKg', Number(e.target.value))}
                      className={getInputClass(validationSummary.byField.syntheticNStandardKg)}
                    />
                    <span className="text-[10px] text-neutral-500 block mt-0.5">Direct emission factor: 1.0% N</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                        <span>NI/UI Treated N (kg N/yr)</span> <span className="text-emerald-600 font-bold">[NEW]</span>
                      </label>
                      <ValidationTooltip
                        issue={validationSummary.byField.syntheticNInhibitedKg}
                        benchmarkRange="≥ 0 kg N/yr"
                        citation="RSPO PalmGHG v5 Section 2.3.2"
                        onApplySuggested={(val) => handleApplyIssueFix('syntheticNInhibitedKg', 'fert-fuel', val)}
                      />
                    </div>
                    <input
                      type="number"
                      value={estate.syntheticNInhibitedKg}
                      onChange={(e) => updateEstate('syntheticNInhibitedKg', Number(e.target.value))}
                      className={getInputClass(validationSummary.byField.syntheticNInhibitedKg, 'w-full px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 font-mono')}
                    />
                    <span className="text-[10px] text-emerald-600 block mt-0.5">35% reduced direct N₂O (0.65% N)</span>
                    <ValidationInlineNotice
                      issue={validationSummary.byField.syntheticNInhibitedKg}
                      onApplySuggested={(val) => handleApplyIssueFix('syntheticNInhibitedKg', 'fert-fuel', val)}
                    />
                  </div>
                </div>

                <ValidationInlineNotice
                  issue={validationSummary.byField.syntheticNStandardKg}
                  onApplySuggested={(val) => updateEstate('syntheticNStandardKg', Math.max(0, val - estate.syntheticNInhibitedKg))}
                />
              </div>

              {/* Other Nutrients */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                      <span>P₂O₅ (kg/yr)</span>
                      <ValidationTooltip
                        issue={validationSummary.byField.syntheticP2O5Kg}
                        benchmarkRange="30 – 120 kg P₂O₅/ha/yr"
                        citation="RSPO PalmGHG v5 Section 2.3.2"
                        onApplySuggested={(val) => updateEstate('syntheticP2O5Kg', val)}
                      />
                    </label>
                  </div>
                  <input
                    type="number"
                    value={estate.syntheticP2O5Kg}
                    onChange={(e) => updateEstate('syntheticP2O5Kg', Number(e.target.value))}
                    className={getInputClass(validationSummary.byField.syntheticP2O5Kg, 'w-full')}
                  />
                  <ValidationInlineNotice
                    issue={validationSummary.byField.syntheticP2O5Kg}
                    onApplySuggested={(val) => updateEstate('syntheticP2O5Kg', val)}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                      <span>K₂O (kg/yr)</span>
                      <ValidationTooltip
                        issue={validationSummary.byField.syntheticK2OKg}
                        benchmarkRange="120 – 300 kg K₂O/ha/yr"
                        citation="RSPO PalmGHG v5 Section 2.3.2"
                        onApplySuggested={(val) => updateEstate('syntheticK2OKg', val)}
                      />
                    </label>
                  </div>
                  <input
                    type="number"
                    value={estate.syntheticK2OKg}
                    onChange={(e) => updateEstate('syntheticK2OKg', Number(e.target.value))}
                    className={getInputClass(validationSummary.byField.syntheticK2OKg, 'w-full')}
                  />
                  <ValidationInlineNotice
                    issue={validationSummary.byField.syntheticK2OKg}
                    onApplySuggested={(val) => updateEstate('syntheticK2OKg', val)}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                      <span>Rock Phos (kg/yr)</span>
                      <ValidationTooltip
                        issue={validationSummary.byField.rockPhosphateKg}
                        benchmarkRange="≥ 0 kg/yr"
                        citation="RSPO PalmGHG v5 Section 2.3.2"
                        onApplySuggested={(val) => handleApplyIssueFix('rockPhosphateKg', 'fert-fuel', val)}
                      />
                    </label>
                  </div>
                  <input
                    type="number"
                    value={estate.rockPhosphateKg}
                    onChange={(e) => updateEstate('rockPhosphateKg', Number(e.target.value))}
                    className={getInputClass(validationSummary.byField.rockPhosphateKg, 'w-full px-2.5 py-1.5 rounded-lg font-mono')}
                  />
                  <ValidationInlineNotice
                    issue={validationSummary.byField.rockPhosphateKg}
                    onApplySuggested={(val) => handleApplyIssueFix('rockPhosphateKg', 'fert-fuel', val)}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                    <span>Fertiliser Transport Distance (km)</span>
                    <ValidationTooltip
                      issue={validationSummary.byField.fertiliserTransportDistanceKm}
                      benchmarkRange="0 – 2,000 km"
                      citation="RSPO PalmGHG v5 Section 2.3.2 & DEFRA"
                      onApplySuggested={(val) => handleApplyIssueFix('fertiliserTransportDistanceKm', 'fert-fuel', val)}
                    />
                  </label>
                </div>
                <input
                  type="number"
                  value={estate.fertiliserTransportDistanceKm}
                  onChange={(e) => updateEstate('fertiliserTransportDistanceKm', Number(e.target.value))}
                  className={getInputClass(validationSummary.byField.fertiliserTransportDistanceKm)}
                />
                <span className="text-[10px] text-neutral-500 block mt-0.5">Scope 3 Cat 4: Upstream Transportation</span>
                <ValidationInlineNotice
                  issue={validationSummary.byField.fertiliserTransportDistanceKm}
                  onApplySuggested={(val) => handleApplyIssueFix('fertiliserTransportDistanceKm', 'fert-fuel', val)}
                />
              </div>

              {/* Recycled Organics (Moved from Mill to Estate in V5) */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                  <span>Recycled Organics Application (Moved from Mill to Estate in V5)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10px] text-neutral-600 dark:text-neutral-400">
                        <span>POME to Land (m³)</span>
                        <ValidationTooltip
                          issue={validationSummary.byField.pomeLandApplicationM3}
                          benchmarkRange="≥ 0 m³"
                          citation="RSPO PalmGHG v5 Subbab 2.3.4"
                          onApplySuggested={(val) => handleApplyIssueFix('pomeLandApplicationM3', 'fert-fuel', val)}
                        />
                      </label>
                    </div>
                    <input
                      type="number"
                      value={estate.pomeLandApplicationM3}
                      onChange={(e) => updateEstate('pomeLandApplicationM3', Number(e.target.value))}
                      className={getInputClass(validationSummary.byField.pomeLandApplicationM3, 'w-full px-2 py-1 rounded font-mono')}
                    />
                    <ValidationInlineNotice
                      issue={validationSummary.byField.pomeLandApplicationM3}
                      onApplySuggested={(val) => handleApplyIssueFix('pomeLandApplicationM3', 'fert-fuel', val)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10px] text-neutral-600 dark:text-neutral-400">
                        <span>Compost ({getUnitSuffix(currentMassUnit)})</span>
                        <ValidationTooltip
                          issue={validationSummary.byField.compostLandApplicationTon}
                          benchmarkRange="≥ 0 MT"
                          citation="RSPO PalmGHG v5 Subbab 2.3.4"
                          onApplySuggested={(val) => handleApplyIssueFix('compostLandApplicationTon', 'fert-fuel', val)}
                        />
                      </label>
                    </div>
                    <input
                      type="number"
                      step="any"
                      value={toDisplayTons(estate.compostLandApplicationTon, currentMassUnit)}
                      onChange={(e) => updateEstate('compostLandApplicationTon', fromInputTons(Number(e.target.value), currentMassUnit))}
                      className={getInputClass(validationSummary.byField.compostLandApplicationTon, 'w-full px-2 py-1 rounded font-mono')}
                    />
                    <ValidationInlineNotice
                      issue={validationSummary.byField.compostLandApplicationTon}
                      onApplySuggested={(val) => handleApplyIssueFix('compostLandApplicationTon', 'fert-fuel', val)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10px] text-neutral-600 dark:text-neutral-400">
                        <span>EFB Mulch ({getUnitSuffix(currentMassUnit)})</span>
                        <ValidationTooltip
                          issue={validationSummary.byField.efbMulchingTon}
                          benchmarkRange="≥ 0 MT"
                          citation="RSPO PalmGHG v5 Subbab 2.3.4"
                          onApplySuggested={(val) => handleApplyIssueFix('efbMulchingTon', 'fert-fuel', val)}
                        />
                      </label>
                    </div>
                    <input
                      type="number"
                      step="any"
                      value={toDisplayTons(estate.efbMulchingTon, currentMassUnit)}
                      onChange={(e) => updateEstate('efbMulchingTon', fromInputTons(Number(e.target.value), currentMassUnit))}
                      className={getInputClass(validationSummary.byField.efbMulchingTon, 'w-full px-2 py-1 rounded font-mono')}
                    />
                    <ValidationInlineNotice
                      issue={validationSummary.byField.efbMulchingTon}
                      onApplySuggested={(val) => handleApplyIssueFix('efbMulchingTon', 'fert-fuel', val)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Estate Fuel & Electricity (WTT & Biogenic) */}
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-700" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Field Fuel & Energy (WTT & Biogenic)
                </h3>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded font-semibold">
                Scope 1, 2, 3 FERA
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                      <span>Stationary Fuel (L)</span> <span className="text-blue-600 text-[10px] ml-1">[NEW Split]</span>
                      <ValidationTooltip
                        issue={validationSummary.byField.stationaryFuelDieselLiters}
                        benchmarkRange="≥ 0 Liters"
                        citation="RSPO PalmGHG v5 Subbab 2.3.3"
                        onApplySuggested={(val) => handleApplyIssueFix('stationaryFuelDieselLiters', 'fert-fuel', val)}
                      />
                    </label>
                  </div>
                  <input
                    type="number"
                    value={estate.stationaryFuelDieselLiters}
                    onChange={(e) => updateEstate('stationaryFuelDieselLiters', Number(e.target.value))}
                    className={getInputClass(validationSummary.byField.stationaryFuelDieselLiters)}
                  />
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Gensets, stationary pumps</span>
                  <ValidationInlineNotice
                    issue={validationSummary.byField.stationaryFuelDieselLiters}
                    onApplySuggested={(val) => handleApplyIssueFix('stationaryFuelDieselLiters', 'fert-fuel', val)}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                      <span>Mobile Fuel (Liters)</span>
                      <ValidationTooltip
                        issue={validationSummary.byField.mobileFuelDieselLiters}
                        benchmarkRange="40 – 120 L diesel/ha/yr"
                        citation="RSPO PalmGHG v5 Subbab 2.3.3"
                        onApplySuggested={(val) => updateEstate('mobileFuelDieselLiters', Math.max(0, val - estate.stationaryFuelDieselLiters))}
                      />
                    </label>
                  </div>
                  <input
                    type="number"
                    value={estate.mobileFuelDieselLiters}
                    onChange={(e) => updateEstate('mobileFuelDieselLiters', Number(e.target.value))}
                    className={getInputClass(validationSummary.byField.mobileFuelDieselLiters)}
                  />
                  <span className="text-[10px] text-neutral-500">Tractors, harvesters, field trucks</span>
                </div>
              </div>

              <ValidationInlineNotice
                issue={validationSummary.byField.mobileFuelDieselLiters}
                onApplySuggested={(val) => updateEstate('mobileFuelDieselLiters', Math.max(0, val - estate.stationaryFuelDieselLiters))}
              />

              {/* Biodiesel Blend */}
              <div className="p-3 bg-violet-50/60 dark:bg-violet-950/20 rounded-lg border border-violet-200 dark:border-violet-800/40 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-violet-900 dark:text-violet-200">
                  <div className="flex items-center gap-1">
                    <span>Biodiesel Blend % (e.g. B35 / B40)</span>
                    <ValidationTooltip
                      issue={validationSummary.byField.biodieselBlendPercent}
                      benchmarkRange="0% – 100% (mandates B20–B40)"
                      citation="RSPO PalmGHG v5 Subbab 2.3.3.3"
                      onApplySuggested={(val) => updateEstate('biodieselBlendPercent', val)}
                    />
                  </div>
                  <span>Biogenic Carbon Reporting [NEW]</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={estate.biodieselBlendPercent}
                    onChange={(e) => updateEstate('biodieselBlendPercent', Number(e.target.value))}
                    className={getInputClass(validationSummary.byField.biodieselBlendPercent, 'w-24')}
                  />
                  <span className="text-[11px] text-neutral-500">
                    {estate.biodieselBlendPercent}% Biogenic biofuel is extracted and reported separately under Optional Information.
                  </span>
                </div>
                <ValidationInlineNotice
                  issue={validationSummary.byField.biodieselBlendPercent}
                  onApplySuggested={(val) => updateEstate('biodieselBlendPercent', val)}
                />
              </div>

              {/* Estate Grid Electricity */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                    <span>Estate Grid Electricity Consumption (kWh/yr)</span> <span className="text-blue-600 text-[10px] ml-1">[NEW Scope 2]</span>
                    <ValidationTooltip
                      issue={validationSummary.byField.estateGridElectricityKwh}
                      benchmarkRange="≥ 0 kWh/yr"
                      citation="RSPO PalmGHG v5 Subbab 2.3.3"
                      onApplySuggested={(val) => handleApplyIssueFix('estateGridElectricityKwh', 'fert-fuel', val)}
                    />
                  </label>
                </div>
                <input
                  type="number"
                  value={estate.estateGridElectricityKwh}
                  onChange={(e) => updateEstate('estateGridElectricityKwh', Number(e.target.value))}
                  className={getInputClass(validationSummary.byField.estateGridElectricityKwh)}
                />
                <span className="text-[10px] text-neutral-500 block mt-0.5">
                  Scope 2 direct consumption + Scope 3 Cat 3 Upstream electricity activities (T&D losses)
                </span>
                <ValidationInlineNotice
                  issue={validationSummary.byField.estateGridElectricityKwh}
                  onApplySuggested={(val) => handleApplyIssueFix('estateGridElectricityKwh', 'fert-fuel', val)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* TAB 3: MILL EXTRACTION & BIOMASS EXPORT */}
      {tab === 'mill-ops' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: Extraction Rates */}
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Factory className="w-4 h-4 text-amber-700" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Mill Production & Extraction Parameters
                </h3>
              </div>
              <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded font-semibold">
                Yield Factors
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                      <span>CPO Extraction Rate (OER %)</span>
                      <ValidationTooltip
                        issue={validationSummary.byField.cpoExtractionRatePercent}
                        benchmarkRange="19.0% – 24.5%"
                        citation="RSPO PalmGHG v5 Section 3.1 & Table 3.1"
                        onApplySuggested={(val) => updateMill('cpoExtractionRatePercent', val)}
                      />
                    </label>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={mill.cpoExtractionRatePercent}
                    onChange={(e) => updateMill('cpoExtractionRatePercent', Number(e.target.value))}
                    className={getInputClass(validationSummary.byField.cpoExtractionRatePercent)}
                  />
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Industry standard: 19.5% – 23.5%</span>
                  <ValidationInlineNotice
                    issue={validationSummary.byField.cpoExtractionRatePercent}
                    onApplySuggested={(val) => updateMill('cpoExtractionRatePercent', val)}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                      <span>PK Extraction Rate (KER %)</span>
                      <ValidationTooltip
                        issue={validationSummary.byField.pkExtractionRatePercent}
                        benchmarkRange="4.5% – 6.8%"
                        citation="RSPO PalmGHG v5 Section 3.1 & Table 3.1"
                        onApplySuggested={(val) => updateMill('pkExtractionRatePercent', val)}
                      />
                    </label>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={mill.pkExtractionRatePercent}
                    onChange={(e) => updateMill('pkExtractionRatePercent', Number(e.target.value))}
                    className={getInputClass(validationSummary.byField.pkExtractionRatePercent)}
                  />
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Industry standard: 4.5% – 6.5%</span>
                  <ValidationInlineNotice
                    issue={validationSummary.byField.pkExtractionRatePercent}
                    onApplySuggested={(val) => updateMill('pkExtractionRatePercent', val)}
                  />
                </div>
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-2">
                <div className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                  By-Product Generation (% of FFB)
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10px] text-neutral-600 dark:text-neutral-400">
                        <span>EFB % (~22%)</span>
                        <ValidationTooltip
                          issue={validationSummary.byField.efbGenerationRatePercent}
                          benchmarkRange="15% – 30%"
                          citation="RSPO PalmGHG v5 Section 3.1 & Table 3.1"
                          onApplySuggested={(val) => handleApplyIssueFix('efbGenerationRatePercent', 'mill-ops', val)}
                        />
                      </label>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={mill.efbGenerationRatePercent}
                      onChange={(e) => updateMill('efbGenerationRatePercent', Number(e.target.value))}
                      className={getInputClass(validationSummary.byField.efbGenerationRatePercent, 'w-full px-2 py-1 rounded font-mono')}
                    />
                    <ValidationInlineNotice
                      issue={validationSummary.byField.efbGenerationRatePercent}
                      onApplySuggested={(val) => handleApplyIssueFix('efbGenerationRatePercent', 'mill-ops', val)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10px] text-neutral-600 dark:text-neutral-400">
                        <span>PKS % (~6%)</span>
                        <ValidationTooltip
                          issue={validationSummary.byField.pksGenerationRatePercent}
                          benchmarkRange="3% – 10%"
                          citation="RSPO PalmGHG v5 Section 3.1 & Table 3.1"
                          onApplySuggested={(val) => handleApplyIssueFix('pksGenerationRatePercent', 'mill-ops', val)}
                        />
                      </label>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={mill.pksGenerationRatePercent}
                      onChange={(e) => updateMill('pksGenerationRatePercent', Number(e.target.value))}
                      className={getInputClass(validationSummary.byField.pksGenerationRatePercent, 'w-full px-2 py-1 rounded font-mono')}
                    />
                    <ValidationInlineNotice
                      issue={validationSummary.byField.pksGenerationRatePercent}
                      onApplySuggested={(val) => handleApplyIssueFix('pksGenerationRatePercent', 'mill-ops', val)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10px] text-neutral-600 dark:text-neutral-400">
                        <span>Fibre % (~13.5%)</span>
                        <ValidationTooltip
                          issue={validationSummary.byField.fibreGenerationRatePercent}
                          benchmarkRange="8% – 20%"
                          citation="RSPO PalmGHG v5 Section 3.1 & Table 3.1"
                          onApplySuggested={(val) => handleApplyIssueFix('fibreGenerationRatePercent', 'mill-ops', val)}
                        />
                      </label>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={mill.fibreGenerationRatePercent}
                      onChange={(e) => updateMill('fibreGenerationRatePercent', Number(e.target.value))}
                      className={getInputClass(validationSummary.byField.fibreGenerationRatePercent, 'w-full px-2 py-1 rounded font-mono')}
                    />
                    <ValidationInlineNotice
                      issue={validationSummary.byField.fibreGenerationRatePercent}
                      onApplySuggested={(val) => handleApplyIssueFix('fibreGenerationRatePercent', 'mill-ops', val)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Biomass Export for Electricity Generation (V5 Expanded to Fibre) */}
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Biomass Export for Electricity Generation
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-semibold">
                Emissions Avoided
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-900 dark:text-emerald-300 leading-relaxed">
                <strong>V5 Major Update:</strong> Biomass export accounting is now expanded to include <strong className="underline">Mesocarp Fibre</strong> alongside PKS and EFB for off-site power generation displacement credits.
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                    <span>Palm Kernel Shell (PKS) Exported ({getUnitLabel(currentMassUnit)}/yr)</span>
                    <ValidationTooltip
                      issue={validationSummary.byField.pksExportTon}
                      benchmarkRange="≥ 0 MT/yr"
                      citation="RSPO PalmGHG v5 Section 3.2"
                      onApplySuggested={(val) => handleApplyIssueFix('pksExportTon', 'mill-ops', val)}
                    />
                  </label>
                </div>
                <input
                  type="number"
                  step="any"
                  value={toDisplayTons(mill.pksExportTon, currentMassUnit)}
                  onChange={(e) => updateMill('pksExportTon', fromInputTons(Number(e.target.value), currentMassUnit))}
                  className={getInputClass(validationSummary.byField.pksExportTon)}
                />
                <span className="text-[10px] text-neutral-500 block mt-0.5">Displacement factor: 0.95 tCO₂e avoided / MT PKS</span>
                <ValidationInlineNotice
                  issue={validationSummary.byField.pksExportTon}
                  onApplySuggested={(val) => handleApplyIssueFix('pksExportTon', 'mill-ops', val)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                    <span>Empty Fruit Bunch (EFB) Exported ({getUnitLabel(currentMassUnit)}/yr)</span>
                    <ValidationTooltip
                      issue={validationSummary.byField.efbExportTon}
                      benchmarkRange="≥ 0 MT/yr"
                      citation="RSPO PalmGHG v5 Section 3.2"
                      onApplySuggested={(val) => handleApplyIssueFix('efbExportTon', 'mill-ops', val)}
                    />
                  </label>
                </div>
                <input
                  type="number"
                  step="any"
                  value={toDisplayTons(mill.efbExportTon, currentMassUnit)}
                  onChange={(e) => updateMill('efbExportTon', fromInputTons(Number(e.target.value), currentMassUnit))}
                  className={getInputClass(validationSummary.byField.efbExportTon)}
                />
                <span className="text-[10px] text-neutral-500 block mt-0.5">Displacement factor: 0.45 tCO₂e avoided / MT EFB</span>
                <ValidationInlineNotice
                  issue={validationSummary.byField.efbExportTon}
                  onApplySuggested={(val) => handleApplyIssueFix('efbExportTon', 'mill-ops', val)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                    <span>Mesocarp Fibre Exported ({getUnitLabel(currentMassUnit)}/yr)</span> <span className="text-emerald-700 font-bold ml-1">[NEW in V5]</span>
                    <ValidationTooltip
                      issue={validationSummary.byField.mesocarpFibreExportTon}
                      benchmarkRange="≥ 0 MT/yr"
                      citation="RSPO PalmGHG v5 Section 3.2"
                      onApplySuggested={(val) => handleApplyIssueFix('mesocarpFibreExportTon', 'mill-ops', val)}
                    />
                  </label>
                </div>
                <input
                  type="number"
                  step="any"
                  value={toDisplayTons(mill.mesocarpFibreExportTon, currentMassUnit)}
                  onChange={(e) => updateMill('mesocarpFibreExportTon', fromInputTons(Number(e.target.value), currentMassUnit))}
                  className={getInputClass(validationSummary.byField.mesocarpFibreExportTon, 'w-full px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 font-mono')}
                />
                <span className="text-[10px] text-emerald-600 block mt-0.5">Displacement factor: 0.52 tCO₂e avoided / MT fibre</span>
                <ValidationInlineNotice
                  issue={validationSummary.byField.mesocarpFibreExportTon}
                  onApplySuggested={(val) => handleApplyIssueFix('mesocarpFibreExportTon', 'mill-ops', val)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: POME, METHANE CAPTURE & MILL ENERGY */}
      {tab === 'mill-pome' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: POME Accounting & Allocations */}
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-700" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  POME Generation & Treatment Allocation
                </h3>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded font-semibold">
                Subbab 2.3.2.3: Skenario 1 & 2
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1">
                <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Opsi Ketersediaan Data POME (Subbab 2.3.2.3):
                </div>
                <div>
                  • <strong>Skenario 1 (Data Tidak Tersedia):</strong> Nilai baku otomatis: Rasio 0,60 tPOME/tTBS, COD 50.000 mg/L, biogas 28 m³/tPOME.<br />
                  • <strong>Skenario 2 (Data Tersedia):</strong> Masukkan data pengukuran operasional aktual pada form di bawah.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                      <span>POME Ratio (m³ / ton FFB)</span>
                      <ValidationTooltip
                        issue={validationSummary.byField.pomeGenerationRatioM3PerTonFfb}
                        benchmarkRange="0.50 – 0.85 m³/t FFB"
                        citation="RSPO PalmGHG v5 Section 3.3.1"
                        onApplySuggested={(val) => updateMill('pomeGenerationRatioM3PerTonFfb', val)}
                      />
                    </label>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={mill.pomeGenerationRatioM3PerTonFfb}
                    onChange={(e) => updateMill('pomeGenerationRatioM3PerTonFfb', Number(e.target.value))}
                    className={getInputClass(validationSummary.byField.pomeGenerationRatioM3PerTonFfb)}
                  />
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Standard: 0.60 – 0.70 m³/t FFB</span>
                  <ValidationInlineNotice
                    issue={validationSummary.byField.pomeGenerationRatioM3PerTonFfb}
                    onApplySuggested={(val) => updateMill('pomeGenerationRatioM3PerTonFfb', val)}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                      <span>COD Inlet to WWTP (mg/L)</span>
                      <ValidationTooltip
                        issue={validationSummary.byField.codInletMgPerL}
                        benchmarkRange="45,000 – 65,000 mg/L"
                        citation="RSPO PalmGHG v5 Section 3.3.1"
                        onApplySuggested={(val) => updateMill('codInletMgPerL', val)}
                      />
                    </label>
                  </div>
                  <input
                    type="number"
                    value={mill.codInletMgPerL}
                    onChange={(e) => updateMill('codInletMgPerL', Number(e.target.value))}
                    className={getInputClass(validationSummary.byField.codInletMgPerL)}
                  />
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Standard: 45,000 – 65,000 mg/L</span>
                  <ValidationInlineNotice
                    issue={validationSummary.byField.codInletMgPerL}
                    onApplySuggested={(val) => updateMill('codInletMgPerL', val)}
                  />
                </div>
              </div>

              {/* Treatment Allocation Splits with RSPO Mass Balance Check */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                  <div className="flex items-center gap-1">
                    <span>Treatment Allocation Split (Must sum to 100%)</span>
                    <ValidationTooltip
                      issue={validationSummary.byField.treatmentAllocationSplit}
                      benchmarkRange="Exactly 100%"
                      citation="RSPO PalmGHG v5 Section 3.3.2"
                      onApplySuggested={() => {
                        onUpdateMill({
                          ...mill,
                          treatmentAllocationOpenLagoonPercent: 20,
                          treatmentAllocationCompostPercent: 10,
                          treatmentAllocationMethaneCapturePercent: 70,
                        });
                      }}
                    />
                  </div>
                  <span className={`font-mono ${
                    mill.treatmentAllocationOpenLagoonPercent + mill.treatmentAllocationCompostPercent + mill.treatmentAllocationMethaneCapturePercent === 100
                      ? 'text-emerald-600'
                      : 'text-amber-600 font-bold'
                  }`}>
                    {mill.treatmentAllocationOpenLagoonPercent + mill.treatmentAllocationCompostPercent + mill.treatmentAllocationMethaneCapturePercent}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-amber-800 dark:text-amber-400 font-medium mb-0.5">
                      Open Lagoon (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={mill.treatmentAllocationOpenLagoonPercent}
                      onChange={(e) => updateMill('treatmentAllocationOpenLagoonPercent', Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-600 dark:text-neutral-400 font-medium mb-0.5">
                      Composting (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={mill.treatmentAllocationCompostPercent}
                      onChange={(e) => updateMill('treatmentAllocationCompostPercent', Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-emerald-800 dark:text-emerald-400 font-medium mb-0.5">
                      Methane Capture (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={mill.treatmentAllocationMethaneCapturePercent}
                      onChange={(e) => updateMill('treatmentAllocationMethaneCapturePercent', Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
                    />
                  </div>
                </div>

                <ValidationInlineNotice
                  issue={validationSummary.byField.treatmentAllocationSplit}
                  onApplySuggested={() => {
                    onUpdateMill({
                      ...mill,
                      treatmentAllocationOpenLagoonPercent: 20,
                      treatmentAllocationCompostPercent: 10,
                      treatmentAllocationMethaneCapturePercent: 70,
                    });
                  }}
                />
              </div>

              {/* Methane Capture Utilization & Digester Performance (NEW in V5) */}
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center gap-1">
                    <span>Biogas Capture Parameters & Routing Pathways</span>
                    <ValidationTooltip
                      issue={validationSummary.byField.methaneUtilizationSplit}
                      benchmarkRange="Sum ≤ 100%"
                      citation="RSPO PalmGHG v5 Subbab 3.3.3"
                      onApplySuggested={() => {
                        onUpdateMill({
                          ...mill,
                          methaneGasEngineUtilizationPercent: 70,
                          methaneBoilerUtilizationPercent: 20,
                          methaneEnclosedFlaringPercent: 10,
                          methaneOpenFlaringPercent: 0,
                        });
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400">RSPO Table 3.3</span>
                </div>

                {/* Biogas Quality & Capture Efficiency with RSPO validation */}
                <div className="grid grid-cols-2 gap-2 pb-2 border-b border-emerald-100 dark:border-emerald-900/40">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] text-neutral-700 dark:text-neutral-300 font-medium flex items-center">
                        <span>Biogas CH₄ Content (%)</span>
                        <ValidationTooltip
                          issue={validationSummary.byField.biogasMethaneContentPercent}
                          benchmarkRange="55% – 68% CH₄"
                          citation="RSPO PalmGHG v5 Subbab 3.3.3"
                          onApplySuggested={(val) => updateMill('biogasMethaneContentPercent', val)}
                        />
                      </label>
                    </div>
                    <input
                      type="number"
                      value={mill.biogasMethaneContentPercent}
                      onChange={(e) => updateMill('biogasMethaneContentPercent', Number(e.target.value))}
                      className={getInputClass(validationSummary.byField.biogasMethaneContentPercent)}
                    />
                    <ValidationInlineNotice
                      issue={validationSummary.byField.biogasMethaneContentPercent}
                      onApplySuggested={(val) => updateMill('biogasMethaneContentPercent', val)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] text-neutral-700 dark:text-neutral-300 font-medium flex items-center">
                        <span>Capture Efficiency (%)</span>
                        <ValidationTooltip
                          issue={validationSummary.byField.methaneCaptureEfficiencyPercent}
                          benchmarkRange="85% – 95%"
                          citation="RSPO PalmGHG v5 Subbab 3.3.3"
                          onApplySuggested={(val) => updateMill('methaneCaptureEfficiencyPercent', val)}
                        />
                      </label>
                    </div>
                    <input
                      type="number"
                      value={mill.methaneCaptureEfficiencyPercent}
                      onChange={(e) => updateMill('methaneCaptureEfficiencyPercent', Number(e.target.value))}
                      className={getInputClass(validationSummary.byField.methaneCaptureEfficiencyPercent)}
                    />
                    <ValidationInlineNotice
                      issue={validationSummary.byField.methaneCaptureEfficiencyPercent}
                      onApplySuggested={(val) => updateMill('methaneCaptureEfficiencyPercent', val)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-neutral-600 dark:text-neutral-400 mb-0.5">
                      Gas Engine Power Gen (%)
                    </label>
                    <input
                      type="number"
                      value={mill.methaneGasEngineUtilizationPercent}
                      onChange={(e) => updateMill('methaneGasEngineUtilizationPercent', Number(e.target.value))}
                      className={getInputClass(validationSummary.byField.methaneUtilizationSplit, 'w-full px-2 py-1 rounded font-mono')}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-600 dark:text-neutral-400 mb-0.5">
                      Biogas Boiler Steam (%)
                    </label>
                    <input
                      type="number"
                      value={mill.methaneBoilerUtilizationPercent}
                      onChange={(e) => updateMill('methaneBoilerUtilizationPercent', Number(e.target.value))}
                      className={getInputClass(validationSummary.byField.methaneUtilizationSplit, 'w-full px-2 py-1 rounded font-mono')}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-neutral-600 dark:text-neutral-400 mb-0.5">
                      Enclosed Flare 99.5% (%)
                    </label>
                    <input
                      type="number"
                      value={mill.methaneEnclosedFlaringPercent}
                      onChange={(e) => updateMill('methaneEnclosedFlaringPercent', Number(e.target.value))}
                      className={getInputClass(validationSummary.byField.methaneUtilizationSplit, 'w-full px-2 py-1 rounded font-mono')}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-600 dark:text-neutral-400 mb-0.5">
                      Open Flare 98% (%)
                    </label>
                    <input
                      type="number"
                      value={mill.methaneOpenFlaringPercent}
                      onChange={(e) => updateMill('methaneOpenFlaringPercent', Number(e.target.value))}
                      className={getInputClass(validationSummary.byField.methaneUtilizationSplit, 'w-full px-2 py-1 rounded font-mono')}
                    />
                  </div>
                </div>

                <ValidationInlineNotice
                  issue={validationSummary.byField.methaneUtilizationSplit}
                  onApplySuggested={() => {
                    onUpdateMill({
                      ...mill,
                      methaneGasEngineUtilizationPercent: 70,
                      methaneBoilerUtilizationPercent: 20,
                      methaneEnclosedFlaringPercent: 10,
                      methaneOpenFlaringPercent: 0,
                    });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Mill Fuel, Boiler Biogenic & Grid Electricity */}
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-700" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Mill Fuel & Grid Electricity (Scope 1, 2 & Biogenic)
                </h3>
              </div>
              <span className="text-[10px] bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 px-2 py-0.5 rounded font-semibold">
                Biogenic Line
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                      <span>Mill Stationary Diesel (L)</span>
                      <ValidationTooltip
                        issue={validationSummary.byField.millStationaryDieselLiters}
                        benchmarkRange="≥ 0 Liters"
                        citation="RSPO PalmGHG v5 Section 3.4"
                        onApplySuggested={(val) => handleApplyIssueFix('millStationaryDieselLiters', 'mill-pome', val)}
                      />
                    </label>
                  </div>
                  <input
                    type="number"
                    value={mill.millStationaryDieselLiters}
                    onChange={(e) => updateMill('millStationaryDieselLiters', Number(e.target.value))}
                    className={getInputClass(validationSummary.byField.millStationaryDieselLiters)}
                  />
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Standby genset</span>
                  <ValidationInlineNotice
                    issue={validationSummary.byField.millStationaryDieselLiters}
                    onApplySuggested={(val) => handleApplyIssueFix('millStationaryDieselLiters', 'mill-pome', val)}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                      <span>Mill Mobile Diesel (L)</span>
                      <ValidationTooltip
                        issue={validationSummary.byField.millMobileDieselLiters}
                        benchmarkRange="≥ 0 Liters"
                        citation="RSPO PalmGHG v5 Section 3.4"
                        onApplySuggested={(val) => handleApplyIssueFix('millMobileDieselLiters', 'mill-pome', val)}
                      />
                    </label>
                  </div>
                  <input
                    type="number"
                    value={mill.millMobileDieselLiters}
                    onChange={(e) => updateMill('millMobileDieselLiters', Number(e.target.value))}
                    className={getInputClass(validationSummary.byField.millMobileDieselLiters)}
                  />
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Wheel loaders & forklifts</span>
                  <ValidationInlineNotice
                    issue={validationSummary.byField.millMobileDieselLiters}
                    onApplySuggested={(val) => handleApplyIssueFix('millMobileDieselLiters', 'mill-pome', val)}
                  />
                </div>
              </div>

              {/* Biomass Burned in Boiler */}
              <div className="p-3 bg-violet-50/60 dark:bg-violet-950/20 rounded-lg border border-violet-200 dark:border-violet-800/40 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-violet-900 dark:text-violet-200">
                  <div className="flex items-center gap-1">
                    <span>Biomass Burned in Mill Boiler ({getUnitLabel(currentMassUnit)}/yr)</span>
                    <ValidationTooltip
                      issue={validationSummary.byField.biomassBurnedBoilerTon}
                      benchmarkRange="≥ 0 MT/yr"
                      citation="RSPO PalmGHG v5 Section 3.4"
                      onApplySuggested={(val) => handleApplyIssueFix('biomassBurnedBoilerTon', 'mill-pome', val)}
                    />
                  </div>
                  <span>Biogenic Carbon [NEW]</span>
                </div>
                <input
                  type="number"
                  step="any"
                  value={toDisplayTons(mill.biomassBurnedBoilerTon, currentMassUnit)}
                  onChange={(e) => updateMill('biomassBurnedBoilerTon', fromInputTons(Number(e.target.value), currentMassUnit))}
                  className={getInputClass(validationSummary.byField.biomassBurnedBoilerTon, 'w-full px-2.5 py-1.5 rounded font-mono')}
                />
                <span className="text-[10px] text-neutral-500 block">
                  Shell & Fibre steam combustion. Reported separately under Biogenic Carbon.
                </span>
                <ValidationInlineNotice
                  issue={validationSummary.byField.biomassBurnedBoilerTon}
                  onApplySuggested={(val) => handleApplyIssueFix('biomassBurnedBoilerTon', 'mill-pome', val)}
                />
              </div>

              {/* Grid Electricity Purchased & Exported */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                      <span>Grid Electricity Bought (kWh)</span>
                      <ValidationTooltip
                        issue={validationSummary.byField.millGridElectricityKwh}
                        benchmarkRange="≥ 0 kWh"
                        citation="RSPO PalmGHG v5 Section 3.4"
                        onApplySuggested={(val) => handleApplyIssueFix('millGridElectricityKwh', 'mill-pome', val)}
                      />
                    </label>
                  </div>
                  <input
                    type="number"
                    value={mill.millGridElectricityKwh}
                    onChange={(e) => updateMill('millGridElectricityKwh', Number(e.target.value))}
                    className={getInputClass(validationSummary.byField.millGridElectricityKwh)}
                  />
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Scope 2 emissions</span>
                  <ValidationInlineNotice
                    issue={validationSummary.byField.millGridElectricityKwh}
                    onApplySuggested={(val) => handleApplyIssueFix('millGridElectricityKwh', 'mill-pome', val)}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                      <span>Power Exported to Grid (kWh)</span>
                      <ValidationTooltip
                        issue={validationSummary.byField.excessElectricityExportGridKwh}
                        benchmarkRange="≥ 0 kWh"
                        citation="RSPO PalmGHG v5 Section 3.4"
                        onApplySuggested={(val) => handleApplyIssueFix('excessElectricityExportGridKwh', 'mill-pome', val)}
                      />
                    </label>
                  </div>
                  <input
                    type="number"
                    value={mill.excessElectricityExportGridKwh}
                    onChange={(e) => updateMill('excessElectricityExportGridKwh', Number(e.target.value))}
                    className={getInputClass(validationSummary.byField.excessElectricityExportGridKwh)}
                  />
                  <span className="text-[10px] text-emerald-600 block mt-0.5">Emissions Avoided credit</span>
                  <ValidationInlineNotice
                    issue={validationSummary.byField.excessElectricityExportGridKwh}
                    onApplySuggested={(val) => handleApplyIssueFix('excessElectricityExportGridKwh', 'mill-pome', val)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DEDICATED LAND USE CHANGE (LUC) CALCULATOR MODULE */}
      {tab === 'luc' && (
        <LucCalculatorModule
          estate={estate}
          onUpdateEstate={onUpdateEstate}
          assessmentYear={assessmentYear}
          isDark={isDark}
        />
      )}

      {/* CSV INVENTORY IMPORT MODAL */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        estate={estate}
        mill={mill}
        onApplyInventory={handleApplyInventory}
      />
    </div>
  );
};
