import React, { useState } from 'react';
import {
  EstateParameters,
  MillParameters,
  FFBSourceAllocation,
  PalmGHGAssessmentResults,
} from '../types/palmghg';
import { calculatePalmGHGV5 } from '../utils/palmghgCalculations';
import {
  Copy,
  Plus,
  Trash2,
  Upload,
  Edit2,
  Check,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Layers,
  ArrowRight,
  Flame,
  TreePine,
  RotateCcw,
} from 'lucide-react';

export interface SavedScenario {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  estate: EstateParameters;
  mill: MillParameters;
  ffbSources: FFBSourceAllocation[];
  results: PalmGHGAssessmentResults;
}

interface Props {
  currentEstate: EstateParameters;
  currentMill: MillParameters;
  currentFfbSources: FFBSourceAllocation[];
  currentResults: PalmGHGAssessmentResults;
  savedScenarios: SavedScenario[];
  onUpdateSavedScenarios: (scenarios: SavedScenario[]) => void;
  onLoadScenario: (estate: EstateParameters, mill: MillParameters, ffbSources: FFBSourceAllocation[]) => void;
  isDark?: boolean;
}

export const ScenarioManager: React.FC<Props> = ({
  currentEstate,
  currentMill,
  currentFfbSources,
  currentResults,
  savedScenarios,
  onUpdateSavedScenarios,
  onLoadScenario,
  isDark = false,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [tempDesc, setTempDesc] = useState('');

  const fmt = (val: number, decimals: number = 2) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  // Save/Clone current state as a new scenario (up to 3 slots)
  const handleCloneCurrent = (slotIndex?: number) => {
    if (savedScenarios.length >= 3 && slotIndex === undefined) return;

    const clonedEstate = JSON.parse(JSON.stringify(currentEstate));
    const clonedMill = JSON.parse(JSON.stringify(currentMill));
    const clonedSources = JSON.parse(JSON.stringify(currentFfbSources));
    const computedResults = calculatePalmGHGV5(clonedEstate, clonedMill, clonedSources);

    const newScenario: SavedScenario = {
      id: `scenario-${Date.now()}`,
      name: slotIndex !== undefined && savedScenarios[slotIndex]
        ? `${savedScenarios[slotIndex].name} (Cloned)`
        : `What-If Scenario ${savedScenarios.length + 1}`,
      description: 'Cloned from active workspace estate & mill parameters.',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estate: clonedEstate,
      mill: clonedMill,
      ffbSources: clonedSources,
      results: computedResults,
    };

    if (slotIndex !== undefined && slotIndex < savedScenarios.length) {
      const updated = [...savedScenarios];
      updated[slotIndex] = newScenario;
      onUpdateSavedScenarios(updated);
    } else {
      onUpdateSavedScenarios([...savedScenarios, newScenario]);
    }
  };

  // Overwrite specific slot with current active state
  const handleOverwriteSlot = (index: number) => {
    const existing = savedScenarios[index];
    const clonedEstate = JSON.parse(JSON.stringify(currentEstate));
    const clonedMill = JSON.parse(JSON.stringify(currentMill));
    const clonedSources = JSON.parse(JSON.stringify(currentFfbSources));
    const computedResults = calculatePalmGHGV5(clonedEstate, clonedMill, clonedSources);

    const updated = [...savedScenarios];
    updated[index] = {
      ...existing,
      estate: clonedEstate,
      mill: clonedMill,
      ffbSources: clonedSources,
      results: computedResults,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    onUpdateSavedScenarios(updated);
  };

  // Delete slot
  const handleDeleteSlot = (index: number) => {
    onUpdateSavedScenarios(savedScenarios.filter((_, i) => i !== index));
  };

  // Edit Name
  const startEditing = (scenario: SavedScenario) => {
    setEditingId(scenario.id);
    setTempName(scenario.name);
    setTempDesc(scenario.description);
  };

  const saveEditing = (id: string) => {
    onUpdateSavedScenarios(
      savedScenarios.map((s) =>
        s.id === id ? { ...s, name: tempName.trim() || s.name, description: tempDesc.trim() || s.description } : s
      )
    );
    setEditingId(null);
  };

  // Baseline for comparison (usually Scenario 0 or Current)
  const baselineCpo = savedScenarios.length > 0 ? savedScenarios[0].results.netGhgPerTonCpo : currentResults.netGhgPerTonCpo;

  return (
    <div className="space-y-6">
      {/* Top Banner & Scenario Slot Cards */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                What-If Project Scenario Manager
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {savedScenarios.length} / 3 Scenarios Saved
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Clone and preserve snapshots of estate & mill parameters to compare decarbonisation trajectories and quantify emissions reductions.
            </p>
          </div>

          {/* Action: Clone Current Button */}
          {savedScenarios.length < 3 && (
            <button
              onClick={() => handleCloneCurrent()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Clone Current Parameters ({savedScenarios.length + 1}/3)</span>
            </button>
          )}
        </div>

        {/* 3 Scenario Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[0, 1, 2].map((slotIdx) => {
            const scenario = savedScenarios[slotIdx];

            if (!scenario) {
              return (
                <div
                  key={slotIdx}
                  className="p-4 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex flex-col items-center justify-center text-center space-y-2 py-8"
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                      Empty Slot {slotIdx + 1}
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Save another What-If project pathway
                    </p>
                  </div>
                  <button
                    onClick={() => handleCloneCurrent(slotIdx)}
                    className="mt-1 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg border border-emerald-300 dark:border-emerald-800 transition-colors"
                  >
                    Clone Active State Here
                  </button>
                </div>
              );
            }

            const deltaVsBaseline = scenario.results.netGhgPerTonCpo - baselineCpo;
            const deltaPct = baselineCpo !== 0 ? (deltaVsBaseline / baselineCpo) * 100 : 0;
            const isEditing = editingId === scenario.id;

            return (
              <div
                key={scenario.id}
                className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/60 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-1 mb-2">
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="w-full text-xs font-bold px-2 py-1 rounded border border-emerald-500 bg-white dark:bg-neutral-800"
                            placeholder="Scenario Name"
                          />
                          <input
                            type="text"
                            value={tempDesc}
                            onChange={(e) => setTempDesc(e.target.value)}
                            className="w-full text-[10px] px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                            placeholder="Description"
                          />
                          <button
                            onClick={() => saveEditing(scenario.id)}
                            className="px-2 py-0.5 text-[10px] bg-emerald-700 text-white rounded font-medium"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                              Slot {slotIdx + 1}
                            </span>
                            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                              {scenario.name}
                            </h4>
                            <button
                              onClick={() => startEditing(scenario)}
                              className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">
                            {scenario.description}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteSlot(slotIdx)}
                      className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                      title="Clear Scenario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Intensity KPI */}
                  <div className="mt-3 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/60">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-medium text-neutral-500">Net GHG / t CPO</span>
                      <span className="text-sm font-bold font-mono text-neutral-900 dark:text-neutral-100">
                        {fmt(scenario.results.netGhgPerTonCpo, 2)} tCO₂e
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] mt-1 text-neutral-500">
                      <span>Total Net:</span>
                      <span className="font-mono font-medium">
                        {fmt(scenario.results.totalNetEmissions, 0)} tCO₂e
                      </span>
                    </div>

                    {slotIdx > 0 && (
                      <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-neutral-200 dark:border-neutral-700">
                        <span>Vs Slot 1:</span>
                        <span className={`font-mono font-bold ${deltaVsBaseline <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {deltaVsBaseline <= 0 ? '' : '+'}{fmt(deltaVsBaseline, 2)} ({fmt(deltaPct, 1)}%)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Highlights Summary */}
                  <div className="mt-2 space-y-1 text-[10px] text-neutral-600 dark:text-neutral-400">
                    <div className="flex justify-between">
                      <span>Methane Capture:</span>
                      <span className="font-mono font-medium">{scenario.mill.treatmentAllocationMethaneCapturePercent}% Biogas</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Peat Soil Area:</span>
                      <span className="font-mono font-medium">{scenario.estate.peatSoilAreaHa.toLocaleString()} ha</span>
                    </div>
                    <div className="flex justify-between">
                      <span>NI/UI Inhibitors:</span>
                      <span className="font-mono font-medium">
                        {((scenario.estate.syntheticNInhibitedKg / (scenario.estate.syntheticNStandardKg + scenario.estate.syntheticNInhibitedKg || 1)) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={() => onLoadScenario(scenario.estate, scenario.mill, scenario.ffbSources)}
                    className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-950 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Load Active</span>
                  </button>

                  <button
                    onClick={() => handleOverwriteSlot(slotIdx)}
                    className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    title="Overwrite with current working parameters"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Sync State</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SIDE-BY-SIDE WHAT-IF COMPARISON TABLE */}
      {savedScenarios.length > 0 && (
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                Detailed Side-by-Side What-If Comparison Matrix
              </h4>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Quantifies emission reductions across Scope 1, Scope 2, Scope 3, and removals between your saved project pathways.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-neutral-200 dark:border-neutral-700">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold border-b border-neutral-200 dark:border-neutral-700">
                  <th className="p-3 w-[28%]">Parameter / Performance Metric</th>
                  {savedScenarios.map((s, idx) => (
                    <th key={s.id} className="p-3 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-700 font-bold">
                          Slot {idx + 1}
                        </span>
                        <span className="truncate">{s.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {/* Primary Intensities */}
                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 font-bold">
                  <td className="p-2.5">Net GHG Emissions per Ton CPO</td>
                  {savedScenarios.map((s, idx) => {
                    const delta = s.results.netGhgPerTonCpo - baselineCpo;
                    const deltaPct = baselineCpo !== 0 ? (delta / baselineCpo) * 100 : 0;
                    return (
                      <td key={s.id} className="p-2.5 font-mono text-sm">
                        <div className="text-neutral-900 dark:text-neutral-100">
                          {fmt(s.results.netGhgPerTonCpo, 2)} tCO₂e/t
                        </div>
                        {idx > 0 && (
                          <div className={`text-[10px] font-normal ${delta <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {delta <= 0 ? '' : '+'}{fmt(delta, 2)} ({fmt(deltaPct, 1)}%)
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="p-2.5 font-semibold">Net GHG Emissions per Ton FFB</td>
                  {savedScenarios.map((s) => (
                    <td key={s.id} className="p-2.5 font-mono font-medium">
                      {fmt(s.results.netGhgPerTonFfb, 3)} tCO₂e/t
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-2.5 font-semibold">Total Net GHG Emissions (tCO₂e/yr)</td>
                  {savedScenarios.map((s) => (
                    <td key={s.id} className="p-2.5 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {fmt(s.results.totalNetEmissions, 0)}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-2.5 font-semibold">Total Gross GHG Emissions (tCO₂e/yr)</td>
                  {savedScenarios.map((s) => (
                    <td key={s.id} className="p-2.5 font-mono">
                      {fmt(s.results.totalGrossEmissions, 0)}
                    </td>
                  ))}
                </tr>

                {/* Scope Breakdown */}
                <tr className="bg-amber-50/20 dark:bg-amber-950/10">
                  <td className="p-2.5 pl-4">• Total Scope 1 (Direct Emissions)</td>
                  {savedScenarios.map((s) => (
                    <td key={s.id} className="p-2.5 font-mono text-amber-800 dark:text-amber-300">
                      {fmt(s.results.totalScope1, 0)}
                    </td>
                  ))}
                </tr>

                <tr className="bg-amber-50/10 dark:bg-amber-950/5">
                  <td className="p-2.5 pl-6 text-[11px] text-neutral-500">- Peat Soil Drainage Oxidation</td>
                  {savedScenarios.map((s) => (
                    <td key={s.id} className="p-2.5 font-mono text-[11px]">
                      {fmt(s.results.estateScope1Peat, 0)}
                    </td>
                  ))}
                </tr>

                <tr className="bg-amber-50/10 dark:bg-amber-950/5">
                  <td className="p-2.5 pl-6 text-[11px] text-neutral-500">- POME Wastewater Treatment</td>
                  {savedScenarios.map((s) => (
                    <td key={s.id} className="p-2.5 font-mono text-[11px]">
                      {fmt(s.results.millScope1PomeLagoon + s.results.millScope1PomeMethaneUncombusted, 0)}
                    </td>
                  ))}
                </tr>

                <tr className="bg-amber-50/10 dark:bg-amber-950/5">
                  <td className="p-2.5 pl-6 text-[11px] text-neutral-500">- Fertiliser Application (Field N₂O)</td>
                  {savedScenarios.map((s) => (
                    <td key={s.id} className="p-2.5 font-mono text-[11px]">
                      {fmt(s.results.estateScope1FertiliserApp, 0)}
                    </td>
                  ))}
                </tr>

                <tr className="bg-amber-50/10 dark:bg-amber-950/5">
                  <td className="p-2.5 pl-6 text-[11px] text-neutral-500">- Land Use Change (25y Gross)</td>
                  {savedScenarios.map((s) => (
                    <td key={s.id} className="p-2.5 font-mono text-[11px]">
                      {fmt(s.results.estateScope1LucAmortised, 0)}
                    </td>
                  ))}
                </tr>

                <tr className="bg-emerald-50/20 dark:bg-emerald-950/10">
                  <td className="p-2.5 pl-4">• Total Scope 2 (Purchased Electricity)</td>
                  {savedScenarios.map((s) => (
                    <td key={s.id} className="p-2.5 font-mono text-emerald-800 dark:text-emerald-300">
                      {fmt(s.results.totalScope2, 0)}
                    </td>
                  ))}
                </tr>

                <tr className="bg-sky-50/20 dark:bg-sky-950/10">
                  <td className="p-2.5 pl-4">• Total Scope 3 (Value Chain - Cat 1, 3, 4)</td>
                  {savedScenarios.map((s) => (
                    <td key={s.id} className="p-2.5 font-mono text-sky-800 dark:text-sky-300">
                      {fmt(s.results.totalScope3, 0)}
                    </td>
                  ))}
                </tr>

                {/* Deductions */}
                <tr className="bg-teal-50/20 dark:bg-teal-950/10">
                  <td className="p-2.5 pl-4">• Total Carbon Removals (LSR)</td>
                  {savedScenarios.map((s) => (
                    <td key={s.id} className="p-2.5 font-mono text-emerald-600 font-semibold">
                      -{fmt(s.results.totalCarbonRemovals, 0)}
                    </td>
                  ))}
                </tr>

                <tr className="bg-teal-50/20 dark:bg-teal-950/10">
                  <td className="p-2.5 pl-4">• Total Emissions Avoided (Biomass & Power)</td>
                  {savedScenarios.map((s) => (
                    <td key={s.id} className="p-2.5 font-mono text-teal-600 font-semibold">
                      -{fmt(s.results.totalEmissionsAvoided, 0)}
                    </td>
                  ))}
                </tr>

                {/* Key Parameter Assumptions */}
                <tr className="bg-neutral-100 dark:bg-neutral-800 font-bold border-t-2 border-neutral-300 dark:border-neutral-700">
                  <td colSpan={savedScenarios.length + 1} className="p-2 text-neutral-800 dark:text-neutral-200 uppercase tracking-wider text-[10px]">
                    Underlying Operational Parameters
                  </td>
                </tr>

                <tr>
                  <td className="p-2.5 text-neutral-600 dark:text-neutral-400">POME Methane Capture Allocation (%)</td>
                  {savedScenarios.map((s) => (
                    <td key={s.id} className="p-2.5 font-mono font-medium">
                      {s.mill.treatmentAllocationMethaneCapturePercent}%
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-2.5 text-neutral-600 dark:text-neutral-400">POME Open Lagoon Allocation (%)</td>
                  {savedScenarios.map((s) => (
                    <td key={s.id} className="p-2.5 font-mono">
                      {s.mill.treatmentAllocationOpenLagoonPercent}%
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-2.5 text-neutral-600 dark:text-neutral-400">Peat Soil Concession Area (ha)</td>
                  {savedScenarios.map((s) => (
                    <td key={s.id} className="p-2.5 font-mono">
                      {s.estate.peatSoilAreaHa.toLocaleString()} ha
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-2.5 text-neutral-600 dark:text-neutral-400">HCV Forest Conservation Area (ha)</td>
                  {savedScenarios.map((s) => (
                    <td key={s.id} className="p-2.5 font-mono">
                      {s.estate.forestConservationAreaHa.toLocaleString()} ha
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-2.5 text-neutral-600 dark:text-neutral-400">NI/UI Treated Nitrogen Fertiliser</td>
                  {savedScenarios.map((s) => {
                    const totalN = s.estate.syntheticNStandardKg + s.estate.syntheticNInhibitedKg;
                    const pct = totalN > 0 ? (s.estate.syntheticNInhibitedKg / totalN) * 100 : 0;
                    return (
                      <td key={s.id} className="p-2.5 font-mono">
                        {pct.toFixed(0)}% ({s.estate.syntheticNInhibitedKg.toLocaleString()} kg)
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="p-2.5 text-neutral-600 dark:text-neutral-400">Biomass Export Total (Ton/yr)</td>
                  {savedScenarios.map((s) => (
                    <td key={s.id} className="p-2.5 font-mono">
                      {(s.mill.pksExportTon + s.mill.efbExportTon + s.mill.mesocarpFibreExportTon).toLocaleString()} t
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
