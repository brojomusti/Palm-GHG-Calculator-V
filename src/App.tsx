import React, { useState, useMemo, useEffect } from 'react';
import {
  EstateParameters,
  MillParameters,
  FFBSourceAllocation,
  PalmGHGAssessmentResults,
} from './types/palmghg';
import {
  calculatePalmGHGV5,
  DEFAULT_PRESET_BASELINE,
  DEFAULT_PRESET_SUSTAINABLE,
} from './utils/palmghgCalculations';
import { InteractiveProcessDiagram } from './components/InteractiveProcessDiagram';
import { OperationalControlFlow } from './components/OperationalControlFlow';
import { CalculatorForm } from './components/CalculatorForm';
import { AssessmentResultsTable } from './components/AssessmentResultsTable';
import { V4ToV5ComparisonMatrix } from './components/V4ToV5ComparisonMatrix';
import { AuditReportModal } from './components/AuditReportModal';
import { SavedScenario } from './components/ScenarioManager';
import { TechnicalGuidanceViewer } from './components/TechnicalGuidanceViewer';
import { PrismaWorkflowAuditSimulator } from './components/PrismaWorkflowAuditSimulator';
import { GhgPerformanceSummaryWidget } from './components/GhgPerformanceSummaryWidget';
import { GhgReductionTargets } from './components/GhgReductionTargets';
import {
  GitFork,
  Network,
  Calculator,
  TableProperties,
  GitCompare,
  FileCheck2,
  Sun,
  Moon,
  Leaf,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  BookOpen,
  ShieldCheck,
  Target,
} from 'lucide-react';

import { MassUnit } from './utils/unitConversion';

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<
    'diagram' | 'operational-control' | 'calculator' | 'results' | 'targets' | 'prisma-workflow' | 'guidance' | 'comparison'
  >('diagram');
  const [calculatorSubTab, setCalculatorSubTab] = useState<string>('planting');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [massUnit, setMassUnit] = useState<MassUnit>('metric');

  // UoC Metadata
  const [uocName, setUocName] = useState('Kembayan Palm Oil Mill & Supply Base');
  const [assessmentYear, setAssessmentYear] = useState(2026);
  const [activePreset, setActivePreset] = useState<'baseline' | 'sustainable' | 'custom'>('sustainable');

  // Core Data State
  const [estate, setEstate] = useState<EstateParameters>(DEFAULT_PRESET_SUSTAINABLE.estate);
  const [mill, setMill] = useState<MillParameters>(DEFAULT_PRESET_SUSTAINABLE.mill);
  const [ffbSources, setFfbSources] = useState<FFBSourceAllocation[]>(DEFAULT_PRESET_SUSTAINABLE.ffbSources);

  // Initial 3 What-If Project Scenarios
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() => {
    // Scenario 1: Business as Usual (BAU)
    const bauEstate: EstateParameters = JSON.parse(JSON.stringify(DEFAULT_PRESET_BASELINE.estate));
    const bauMill: MillParameters = JSON.parse(JSON.stringify(DEFAULT_PRESET_BASELINE.mill));
    const bauSources: FFBSourceAllocation[] = JSON.parse(JSON.stringify(DEFAULT_PRESET_BASELINE.ffbSources));
    const bauResults = calculatePalmGHGV5(bauEstate, bauMill, bauSources);

    // Scenario 2: Improved Biogas Capture
    const biogasEstate: EstateParameters = JSON.parse(JSON.stringify(DEFAULT_PRESET_SUSTAINABLE.estate));
    const biogasMill: MillParameters = {
      ...JSON.parse(JSON.stringify(DEFAULT_PRESET_SUSTAINABLE.mill)),
      pomeTreatmentPathway: 'methane_capture',
      biogasProducedM3: 5500000,
      methaneContentPercent: 62,
      methaneCapturePercent: 92,
      methaneUtilization: 'gas_engine',
      gasEngineKwhGenerated: 7200000,
      electricityExportKwh: 3200000,
      millGridElectricityKwh: 0,
      upstreamPurchasedElectricityKwh: 0,
    };
    const biogasSources: FFBSourceAllocation[] = JSON.parse(JSON.stringify(DEFAULT_PRESET_SUSTAINABLE.ffbSources));
    const biogasResults = calculatePalmGHGV5(biogasEstate, biogasMill, biogasSources);

    // Scenario 3: High Conservation & LSR Removals
    const consEstate: EstateParameters = {
      ...JSON.parse(JSON.stringify(DEFAULT_PRESET_SUSTAINABLE.estate)),
      peatConservationHa: 1800,
      nonForestConservationHa: 800,
      standingOilPalmRetiredHa: 500,
      forestConservationHa: 1400,
      fertiliserNIUIEnabled: true,
      fertiliserType: 'ni_ui_treated',
      niuiReductionPercent: 40,
    };
    const consMill: MillParameters = JSON.parse(JSON.stringify(DEFAULT_PRESET_SUSTAINABLE.mill));
    const consSources: FFBSourceAllocation[] = JSON.parse(JSON.stringify(DEFAULT_PRESET_SUSTAINABLE.ffbSources));
    const consResults = calculatePalmGHGV5(consEstate, consMill, consSources);

    return [
      {
        id: 'scenario-bau',
        name: 'Business as Usual (BAU)',
        description: 'Conventional open anaerobic pond, standard synthetic fertiliser, and no active methane recovery.',
        createdAt: 'Preset BAU',
        estate: bauEstate,
        mill: bauMill,
        ffbSources: bauSources,
        results: bauResults,
      },
      {
        id: 'scenario-biogas',
        name: 'Improved Biogas Capture',
        description: '92% methane capture with gas engine generation and 3,200 MWh green electricity export to grid.',
        createdAt: 'Optimized Energy',
        estate: biogasEstate,
        mill: biogasMill,
        ffbSources: biogasSources,
        results: biogasResults,
      },
      {
        id: 'scenario-conservation',
        name: 'High Conservation Effort',
        description: '1,800 ha peatland conservation, 800 ha non-forest HCV, 500 ha retired palms, and NI/UI fertiliser.',
        createdAt: 'LSR Removals',
        estate: consEstate,
        mill: consMill,
        ffbSources: consSources,
        results: consResults,
      },
    ];
  });

  // Theme Toggling
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Reactive GHG Calculation
  const results: PalmGHGAssessmentResults = useMemo(() => {
    return calculatePalmGHGV5(estate, mill, ffbSources);
  }, [estate, mill, ffbSources]);

  // Switch Benchmark Preset
  const handleSelectPreset = (presetKey: 'baseline' | 'sustainable') => {
    if (presetKey === 'baseline') {
      setEstate(DEFAULT_PRESET_BASELINE.estate);
      setMill(DEFAULT_PRESET_BASELINE.mill);
      setFfbSources(DEFAULT_PRESET_BASELINE.ffbSources);
      setActivePreset('baseline');
    } else {
      setEstate(DEFAULT_PRESET_SUSTAINABLE.estate);
      setMill(DEFAULT_PRESET_SUSTAINABLE.mill);
      setFfbSources(DEFAULT_PRESET_SUSTAINABLE.ffbSources);
      setActivePreset('sustainable');
    }
  };

  // Navigate to calculator with subtab
  const handleNavigateToCalculatorTab = (subTab: string) => {
    setCalculatorSubTab(subTab);
    setActiveTab('calculator');
  };

  // Load a saved What-If scenario into active parameters
  const handleLoadScenario = (
    loadedEstate: EstateParameters,
    loadedMill: MillParameters,
    loadedSources: FFBSourceAllocation[]
  ) => {
    setEstate(JSON.parse(JSON.stringify(loadedEstate)));
    setMill(JSON.parse(JSON.stringify(loadedMill)));
    setFfbSources(JSON.parse(JSON.stringify(loadedSources)));
    setActivePreset('custom');
  };

  // CSV Export
  const handleExportCsv = () => {
    setIsAuditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-150">
      
      {/* TOP BAR CONTRACT: ZONE 1 (Brand) - ZONE 2 (Nav Links) - ZONE 3 (Action) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          
          {/* Zone 1: Single Text Element Wordmark */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-xs">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                RSPO PalmGHG V5 Engine
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded">
                LSR v1.1 Aligned
              </span>
            </div>
          </div>

          {/* Zone 2: Concise Single-Line Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('diagram')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'diagram'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-emerald-700 dark:text-emerald-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Process Flow Map</span>
            </button>

            <button
              onClick={() => setActiveTab('operational-control')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'operational-control'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-emerald-700 dark:text-emerald-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Operational Control</span>
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'calculator'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-emerald-700 dark:text-emerald-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>GHG Calculator</span>
            </button>

            <button
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'results'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-emerald-700 dark:text-emerald-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>Assessment Results</span>
            </button>

            <button
              onClick={() => setActiveTab('targets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'targets'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-emerald-700 dark:text-emerald-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-emerald-600" />
              <span>Targets</span>
              <span className="text-[10px] px-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold">
                Goal
              </span>
            </button>

            <button
              onClick={() => setActiveTab('prisma-workflow')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'prisma-workflow'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-emerald-700 dark:text-emerald-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>prisma & Audit LS</span>
              <span className="text-[10px] px-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                Bab 3
              </span>
            </button>

            <button
              onClick={() => setActiveTab('guidance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'guidance'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-emerald-700 dark:text-emerald-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Panduan Teknis V5</span>
              <span className="text-[10px] px-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold">
                V5
              </span>
            </button>

            <button
              onClick={() => setActiveTab('comparison')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'comparison'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-emerald-700 dark:text-emerald-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>V4 vs V5</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action & Controls */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            {/* Real-time Persistent GHG Performance Summary Widget */}
            <GhgPerformanceSummaryWidget
              results={results}
              massUnit={massUnit}
              activePreset={activePreset}
              assessmentYear={assessmentYear}
              uocName={uocName}
              onNavigate={(tab) => setActiveTab(tab as any)}
            />

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              aria-label="Toggle Theme"
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Audit Report Button */}
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Audit Report</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row (Horizontal Scroll) */}
        <div className="flex lg:hidden items-center gap-1 pt-2 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('diagram')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
              activeTab === 'diagram' ? 'bg-emerald-700 text-white font-semibold' : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Process Flow
          </button>
          <button
            onClick={() => setActiveTab('operational-control')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
              activeTab === 'operational-control' ? 'bg-emerald-700 text-white font-semibold' : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Operational Control
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
              activeTab === 'calculator' ? 'bg-emerald-700 text-white font-semibold' : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Calculator
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
              activeTab === 'results' ? 'bg-emerald-700 text-white font-semibold' : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Results
          </button>
          <button
            onClick={() => setActiveTab('targets')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
              activeTab === 'targets' ? 'bg-emerald-700 text-white font-semibold' : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Targets
          </button>
          <button
            onClick={() => setActiveTab('prisma-workflow')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
              activeTab === 'prisma-workflow' ? 'bg-emerald-700 text-white font-semibold' : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            prisma & Audit
          </button>
          <button
            onClick={() => setActiveTab('guidance')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
              activeTab === 'guidance' ? 'bg-emerald-700 text-white font-semibold' : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Panduan Teknis V5
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
              activeTab === 'comparison' ? 'bg-emerald-700 text-white font-semibold' : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            V4 vs V5
          </button>
        </div>
      </header>

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Workspace Context Strip: UoC Metadata & Preset Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-neutral-500">Unit of Certification:</span>
            <input
              type="text"
              value={uocName}
              onChange={(e) => setUocName(e.target.value)}
              className="px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium text-xs focus:ring-1 focus:ring-emerald-600 outline-none"
            />
            <span className="text-neutral-400 hidden sm:inline">·</span>
            <span className="font-semibold text-neutral-500">Year:</span>
            <input
              type="number"
              value={assessmentYear}
              onChange={(e) => setAssessmentYear(Number(e.target.value))}
              className="w-20 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:ring-1 focus:ring-emerald-600 outline-none"
            />
          </div>

          {/* Benchmark Preset Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium">Benchmark Preset:</span>
            <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium">
              <button
                onClick={() => handleSelectPreset('sustainable')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activePreset === 'sustainable'
                    ? 'bg-white dark:bg-neutral-700 text-emerald-800 dark:text-emerald-300 shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                V5 Sustainable Leader
              </button>
              <button
                onClick={() => handleSelectPreset('baseline')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activePreset === 'baseline'
                    ? 'bg-white dark:bg-neutral-700 text-amber-800 dark:text-amber-300 shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                Conventional Baseline
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: MODUL 1 - INTERACTIVE PROCESS FLOW DIAGRAM */}
        {activeTab === 'diagram' && (
          <InteractiveProcessDiagram
            estate={estate}
            mill={mill}
            results={results}
            onNavigateToTab={handleNavigateToCalculatorTab}
          />
        )}

        {/* TAB 2: MODUL 2 - OPERATIONAL CONTROL & SCOPE ENGINE */}
        {activeTab === 'operational-control' && (
          <OperationalControlFlow
            ffbSources={ffbSources}
            massUnit={massUnit}
            results={results}
            assessmentYear={assessmentYear}
            estate={estate}
            mill={mill}
            onUpdateSources={(newSources) => {
              setFfbSources(newSources);
              setActivePreset('custom');
            }}
          />
        )}

        {/* TAB 3: MODUL 3 - COMPREHENSIVE ESTATE & MILL CALCULATOR */}
        {activeTab === 'calculator' && (
          <CalculatorForm
            estate={estate}
            mill={mill}
            activeSubTab={calculatorSubTab}
            massUnit={massUnit}
            onToggleMassUnit={setMassUnit}
            isDark={isDark}
            assessmentYear={assessmentYear}
            onUpdateEstate={(newEstate) => {
              setEstate(newEstate);
              setActivePreset('custom');
            }}
            onUpdateMill={(newMill) => {
              setMill(newMill);
              setActivePreset('custom');
            }}
          />
        )}

        {/* TAB 4: MODUL 4 - ASSESSMENT RESULTS TABLE MATRIX & SENSITIVITY ANALYSIS */}
        {activeTab === 'results' && (
          <AssessmentResultsTable
            estate={estate}
            mill={mill}
            ffbSources={ffbSources}
            results={results}
            savedScenarios={savedScenarios}
            onUpdateSavedScenarios={setSavedScenarios}
            onLoadScenario={handleLoadScenario}
            isDark={isDark}
            onOpenAuditReport={() => setIsAuditModalOpen(true)}
            onExportCsv={handleExportCsv}
            assessmentYear={assessmentYear}
          />
        )}

        {/* TAB: GHG REDUCTION TARGETS & GAP ANALYSIS (SBTI FLAG & RSPO NET ZERO ROADMAP) */}
        {activeTab === 'targets' && (
          <GhgReductionTargets
            estate={estate}
            mill={mill}
            ffbSources={ffbSources}
            results={results}
            assessmentYear={assessmentYear}
            onUpdateEstate={(newEstate: EstateParameters) => {
              setEstate(newEstate);
              setActivePreset('custom');
            }}
            onUpdateMill={(newMill: MillParameters) => {
              setMill(newMill);
              setActivePreset('custom');
            }}
            onLoadScenario={handleLoadScenario}
            isDark={isDark}
          />
        )}

        {/* TAB 5: PRISMA PLATFORM & AUDIT LS WORKFLOW SIMULATOR (BAB 3) */}
        {activeTab === 'prisma-workflow' && (
          <PrismaWorkflowAuditSimulator
            estate={estate}
            mill={mill}
            ffbSources={ffbSources}
            results={results}
            isDark={isDark}
          />
        )}

        {/* TAB 6: OFFICIAL TECHNICAL GUIDANCE & MANUAL VIEWER (RSPO-GUI-T04-001) */}
        {activeTab === 'guidance' && (
          <TechnicalGuidanceViewer isDark={isDark} />
        )}

        {/* TAB 7: MODUL 5 - WHAT'S CHANGED FROM V4 TO V5 MATRIX */}
        {activeTab === 'comparison' && <V4ToV5ComparisonMatrix />}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6 px-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Roundtable on Sustainable Palm Oil (RSPO) PalmGHG Version 5 Methodology
          </div>
          <div>
            Aligned with GHG Protocol Land Sector and Removals (LSR) Standard v1.1
          </div>
        </div>
      </footer>

      {/* Audit Report Modal */}
      <AuditReportModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        estate={estate}
        mill={mill}
        ffbSources={ffbSources}
        results={results}
        assessmentYear={assessmentYear}
        uocName={uocName}
      />
    </div>
  );
}
