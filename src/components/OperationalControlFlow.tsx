import React, { useState, useMemo } from 'react';
import { FFBSourceAllocation, SupplySourceType, PalmGHGAssessmentResults } from '../types/palmghg';
import {
  MassUnit,
  toDisplayTons,
  fromInputTons,
  getUnitLabel,
} from '../utils/unitConversion';
import { ShieldCheck, Check, ArrowRight, Building2, Users, Network, Plus, Trash2 } from 'lucide-react';
import { GhgReductionTargetGapModule } from './GhgReductionTargetGapModule';
import { GwpConstantsSettingsPanel } from './GwpConstantsSettingsPanel';
import { calculatePalmGHGV5, DEFAULT_PRESET_SUSTAINABLE } from '../utils/palmghgCalculations';
import { EstateParameters, MillParameters } from '../types/palmghg';

interface Props {
  ffbSources: FFBSourceAllocation[];
  onUpdateSources: (sources: FFBSourceAllocation[]) => void;
  massUnit?: MassUnit;
  results?: PalmGHGAssessmentResults;
  assessmentYear?: number;
  estate?: EstateParameters;
  mill?: MillParameters;
}

export const OperationalControlFlow: React.FC<Props> = ({
  ffbSources,
  onUpdateSources,
  massUnit = 'metric',
  results,
  assessmentYear = 2026,
  estate,
  mill,
}) => {
  const effectiveResults = useMemo(() => {
    if (results) return results;
    return calculatePalmGHGV5(DEFAULT_PRESET_SUSTAINABLE.estate, DEFAULT_PRESET_SUSTAINABLE.mill, ffbSources);
  }, [results, ffbSources]);

  const [selectedSourceType, setSelectedSourceType] = useState<SupplySourceType>('own_within_uoc');

  const addSource = () => {
    const newSource: FFBSourceAllocation = {
      id: `src-${Date.now()}`,
      sourceType: selectedSourceType,
      name: `New ${getSourceTypeLabel(selectedSourceType)}`,
      ffbVolumeTon: 10000,
      transportDistanceKm: 20,
      plantedAreaHa: 500,
      isDirectlyManaged: selectedSourceType === 'own_within_uoc' || selectedSourceType === 'group_within_uoc',
      yieldTonPerHa: 20.0,
    };
    onUpdateSources([...ffbSources, newSource]);
  };

  const removeSource = (id: string) => {
    onUpdateSources(ffbSources.filter((s) => s.id !== id));
  };

  const updateSourceField = (id: string, field: keyof FFBSourceAllocation, value: any) => {
    onUpdateSources(
      ffbSources.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  function getSourceTypeLabel(type: SupplySourceType): string {
    switch (type) {
      case 'own_within_uoc':
        return 'Own Plantation (Within UoC)';
      case 'group_within_uoc':
        return 'Group Plantation (Within UoC - Managed)';
      case 'group_outside_uoc':
        return 'Group Plantation (Outside UoC - Not Managed)';
      case 'third_party_independent':
        return 'Third Party: Independent Smallholder';
      case 'third_party_collection':
        return 'Third Party: Collection Centre / Dealer';
    }
  }

  const totalVolume = ffbSources.reduce((acc, s) => acc + s.ffbVolumeTon, 0);

  const scope1Volume = ffbSources
    .filter((s) => s.sourceType === 'own_within_uoc' || (s.sourceType === 'group_within_uoc' && s.isDirectlyManaged))
    .reduce((acc, s) => acc + s.ffbVolumeTon, 0);

  const scope3Volume = totalVolume - scope1Volume;

  return (
    <div className="space-y-6">
      {/* Module Header & Concept Callout */}
      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Module 2
              </span>
              <span className="text-xs text-neutral-400">·</span>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                RSPO PalmGHG V5 Operational Control Decision Engine
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-3xl">
              PalmGHG V5 strictly implements the GHG Protocol Corporate Standard criteria for Operational Control.
              The deciding factor is whether a company has the authority to introduce and implement operating policies at a plantation facility or activity, regardless of legal asset ownership.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div>
              <div className="text-[11px] text-neutral-500 font-medium">Scope 1 & 2 Controlled</div>
              <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {toDisplayTons(scope1Volume, massUnit).toLocaleString()} {getUnitLabel(massUnit)} ({totalVolume > 0 ? ((scope1Volume / totalVolume) * 100).toFixed(1) : 0}%)
              </div>
            </div>
            <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-700" />
            <div>
              <div className="text-[11px] text-neutral-500 font-medium">Scope 3 Value Chain</div>
              <div className="text-sm font-bold font-mono text-sky-600 dark:text-sky-400">
                {toDisplayTons(scope3Volume, massUnit).toLocaleString()} {getUnitLabel(massUnit)} ({totalVolume > 0 ? ((scope3Volume / totalVolume) * 100).toFixed(1) : 0}%)
              </div>
            </div>
          </div>
        </div>

        {/* Visual Decision Logic Tree (Replicating Image 2) */}
        <div className="mt-4 pt-2">
          <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Official RSPO PalmGHG V5 Classification Matrix</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Box 1: Own Plantation */}
            <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-neutral-100">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span>Own Plantation</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Standard / main supply base of assessed mill, and scheme smallholders directly managed by the mill.
              </p>
              
              <div className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-700 text-[11px]">
                <div className="p-2 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200">Own (within UoC) Grower</div>
                  <div className="text-neutral-500 text-[10px]">Directly Managed</div>
                  <div className="mt-1 font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    <span>Scope 1 (Direct) & Scope 2</span>
                  </div>
                </div>

                <div className="p-2 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200">Scheme Smallholder / Outgrower</div>
                  <div className="text-neutral-500 text-[10px]">If Directly Managed by Mill</div>
                  <div className="mt-1 font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    <span>Scope 1 (Direct) & Scope 2</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Group Plantation */}
            <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-neutral-100">
                <Network className="w-4 h-4 text-blue-700" />
                <span>Group Plantation</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Sister estate belonging to the same parent company that supplies FFB to the assessed mill.
              </p>

              <div className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-700 text-[11px]">
                <div className="p-2 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200">Own (Within UoC) Grower</div>
                  <div className="text-neutral-500 text-[10px]">Directly Managed</div>
                  <div className="mt-1 font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    <span>Scope 1 & Scope 2</span>
                  </div>
                </div>

                <div className="p-2 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200">Own (Outside UoC) Grower</div>
                  <div className="text-neutral-500 text-[10px]">Not Managed by Mill UoC</div>
                  <div className="mt-1 font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    <span>Scope 3 (Cat 1: Purchase FFB)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 3: Third Party Plantation */}
            <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-neutral-100">
                <Users className="w-4 h-4 text-sky-700" />
                <span>Third Party Plantation</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                External suppliers not owned or managed by the company (dealers, agents, independent smallholders).
              </p>

              <div className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-700 text-[11px]">
                <div className="p-2 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200">Independent Smallholder / Outgrower</div>
                  <div className="text-neutral-500 text-[10px]">Not Managed / Independent</div>
                  <div className="mt-1 font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    <span>Scope 3 (Cat 1 Purchase + Cat 4 Transport)</span>
                  </div>
                </div>

                <div className="p-2 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200">Collection Centre / Dealer</div>
                  <div className="text-neutral-500 text-[10px]">External Intermediary</div>
                  <div className="mt-1 font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    <span>Scope 3 (Cat 1 Purchase + Cat 4 Transport)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Supply Base Table */}
      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Active FFB Supply Sources & Operational Control Allocation
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Configure suppliers to evaluate the precise split of FFB volume into Scope 1 vs Scope 3.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSourceType}
              onChange={(e) => setSelectedSourceType(e.target.value as SupplySourceType)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            >
              <option value="own_within_uoc">Own (Within UoC)</option>
              <option value="group_within_uoc">Group (Within UoC)</option>
              <option value="group_outside_uoc">Group (Outside UoC)</option>
              <option value="third_party_independent">3rd Party: Independent Smallholder</option>
              <option value="third_party_collection">3rd Party: Collection Centre</option>
            </select>
            <button
              onClick={addSource}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Supplier</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="py-2.5 px-3">Supplier Name</th>
                <th className="py-2.5 px-3">Supply Association</th>
                <th className="py-2.5 px-3 text-right">FFB Volume ({getUnitLabel(massUnit)}/yr)</th>
                <th className="py-2.5 px-3 text-right">Transport (km)</th>
                <th className="py-2.5 px-3 text-center">Directly Managed?</th>
                <th className="py-2.5 px-3 text-center">Assigned Scope</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {ffbSources.map((source) => {
                const isScope1 =
                  source.sourceType === 'own_within_uoc' ||
                  (source.sourceType === 'group_within_uoc' && source.isDirectlyManaged);

                return (
                  <tr key={source.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className="py-2 px-3 font-medium text-neutral-900 dark:text-neutral-100">
                      <input
                        type="text"
                        value={source.name}
                        onChange={(e) => updateSourceField(source.id, 'name', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={source.sourceType}
                        onChange={(e) => updateSourceField(source.id, 'sourceType', e.target.value)}
                        className="px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs"
                      >
                        <option value="own_within_uoc">Own (Within UoC)</option>
                        <option value="group_within_uoc">Group (Within UoC)</option>
                        <option value="group_outside_uoc">Group (Outside UoC)</option>
                        <option value="third_party_independent">3rd Party Independent</option>
                        <option value="third_party_collection">3rd Party Collection</option>
                      </select>
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      <input
                        type="number"
                        step="any"
                        value={toDisplayTons(source.ffbVolumeTon, massUnit)}
                        onChange={(e) => updateSourceField(source.id, 'ffbVolumeTon', fromInputTons(Number(e.target.value), massUnit))}
                        className="w-28 text-right px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      <input
                        type="number"
                        value={source.transportDistanceKm}
                        onChange={(e) => updateSourceField(source.id, 'transportDistanceKm', Number(e.target.value))}
                        className="w-20 text-right px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={source.isDirectlyManaged}
                        disabled={source.sourceType === 'third_party_independent' || source.sourceType === 'third_party_collection'}
                        onChange={(e) => updateSourceField(source.id, 'isDirectlyManaged', e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isScope1
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                        }`}
                      >
                        {isScope1 ? 'Scope 1 & 2' : 'Scope 3 (Cat 1 & 4)'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => removeSource(source.id)}
                        disabled={ffbSources.length <= 1}
                        className="p-1 text-neutral-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GWP Constants Settings Panel (IPCC AR4 / AR5 / AR6 Comparison) */}
      <GwpConstantsSettingsPanel
        ffbSources={ffbSources}
        results={effectiveResults}
        estate={estate}
        mill={mill}
      />

      {/* GHG Reduction Target & Gap Analysis Module */}
      <GhgReductionTargetGapModule
        results={effectiveResults}
        assessmentYear={assessmentYear}
        massUnit={massUnit}
      />
    </div>
  );
};
