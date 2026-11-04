import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { PalmGHGAssessmentResults } from '../types/palmghg';
import { BarChart3, Layers, Filter } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  BarController
);

interface Props {
  results: PalmGHGAssessmentResults;
  scenarioLabel?: string;
  isDark?: boolean;
}

export const ChartJsWaterfall: React.FC<Props> = ({
  results,
  scenarioLabel,
  isDark = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);
  const [breakdownMode, setBreakdownMode] = useState<'scopes' | 'detailed'>('scopes');

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy prior chart if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const fmt = (n: number) =>
      Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 });

    let labels: string[] = [];
    let barRanges: [number, number][] = [];
    let rawDeltas: number[] = [];
    let backgroundColors: string[] = [];
    let borderColors: string[] = [];
    let stepCategories: string[] = [];

    if (breakdownMode === 'scopes') {
      // 1. SCOPES HIGH-LEVEL WATERFALL
      // Scope 1 (Estate + Mill)
      // Scope 2 (Estate + Mill)
      // Scope 3 (Estate + Mill)
      // Gross PalmGHG Total (Milestone)
      // Carbon Removals (LSR)
      // Emissions Avoided (Export)
      // Net PalmGHG Footprint (Final Total)

      let running = 0;

      // Step 1: Scope 1
      const s1 = results.totalScope1;
      labels.push('Scope 1 (Direct)');
      barRanges.push([running, running + s1]);
      rawDeltas.push(s1);
      backgroundColors.push('rgba(217, 119, 6, 0.85)'); // amber-600
      borderColors.push('#d97706');
      stepCategories.push('Direct Emissions (Estate & Mill)');
      running += s1;

      // Step 2: Scope 2
      const s2 = results.totalScope2;
      labels.push('Scope 2 (Electricity)');
      barRanges.push([running, running + s2]);
      rawDeltas.push(s2);
      backgroundColors.push('rgba(16, 185, 129, 0.85)'); // emerald-500
      borderColors.push('#10b981');
      stepCategories.push('Purchased Electricity (Estate & Mill)');
      running += s2;

      // Step 3: Scope 3
      const s3 = results.totalScope3;
      labels.push('Scope 3 (Value Chain)');
      barRanges.push([running, running + s3]);
      rawDeltas.push(s3);
      backgroundColors.push('rgba(2, 132, 199, 0.85)'); // sky-600
      borderColors.push('#0284c7');
      stepCategories.push('FERA, 3rd Party FFB, Fertiliser Mfg & Transport');
      running += s3;

      // Step 4: Gross Total Milestone
      const gross = running;
      labels.push('Gross PalmGHG Total');
      barRanges.push([0, gross]);
      rawDeltas.push(gross);
      backgroundColors.push('rgba(71, 85, 105, 0.85)'); // slate-600
      borderColors.push('#475569');
      stepCategories.push('Total Gross Emissions (Scope 1 + 2 + 3)');

      // Step 5: Carbon Removals (Deduction)
      const removals = results.totalCarbonRemovals;
      const afterRemovals = running - removals;
      labels.push('Carbon Removals (LSR)');
      barRanges.push([Math.min(running, afterRemovals), Math.max(running, afterRemovals)]);
      rawDeltas.push(-removals);
      backgroundColors.push('rgba(22, 163, 74, 0.85)'); // green-600
      borderColors.push('#16a34a');
      stepCategories.push('Crop Sequestration, HCV Forest & Peat Conservation');
      running = afterRemovals;

      // Step 6: Emissions Avoided (Deduction)
      const avoided = results.totalEmissionsAvoided;
      const afterAvoided = running - avoided;
      labels.push('Emissions Avoided');
      barRanges.push([Math.min(running, afterAvoided), Math.max(running, afterAvoided)]);
      rawDeltas.push(-avoided);
      backgroundColors.push('rgba(20, 184, 166, 0.85)'); // teal-500
      borderColors.push('#14b8a6');
      stepCategories.push('Biomass Export (PKS/EFB/Fibre) & Power Export');
      running = afterAvoided;

      // Step 7: Net Total
      labels.push('Net GHG Footprint');
      barRanges.push([0, results.totalNetEmissions]);
      rawDeltas.push(results.totalNetEmissions);
      backgroundColors.push('rgba(5, 150, 105, 0.95)'); // emerald-600
      borderColors.push('#059669');
      stepCategories.push('Final Verified Net Footprint');
    } else {
      // 2. DETAILED OPERATIONAL ACTIVITIES WATERFALL
      let running = 0;

      const items = [
        // Scope 1 Estate
        { name: 'Peat Oxidation', val: results.estateScope1Peat, cat: 'Estate Scope 1', color: 'rgba(217, 119, 6, 0.85)', border: '#d97706' },
        { name: 'Fertiliser Field N₂O', val: results.estateScope1FertiliserApp, cat: 'Estate Scope 1', color: 'rgba(217, 119, 6, 0.85)', border: '#d97706' },
        { name: 'Gross LUC Amortised', val: results.estateScope1LucAmortised, cat: 'Estate Scope 1', color: 'rgba(217, 119, 6, 0.85)', border: '#d97706' },
        { name: 'Estate Fuel Comb.', val: results.estateScope1FuelStationary + results.estateScope1FuelMobile, cat: 'Estate Scope 1', color: 'rgba(217, 119, 6, 0.85)', border: '#d97706' },
        { name: 'Cropland Conversion', val: results.estateScope1LandManagement, cat: 'Estate Scope 1', color: 'rgba(217, 119, 6, 0.85)', border: '#d97706' },
        // Scope 1 Mill
        { name: 'POME Wastewater', val: results.millScope1PomeLagoon + results.millScope1PomeMethaneUncombusted, cat: 'Mill Scope 1', color: 'rgba(234, 88, 12, 0.85)', border: '#ea580c' },
        { name: 'Mill Aux Fuel', val: results.millScope1FuelStationary + results.millScope1FuelMobile, cat: 'Mill Scope 1', color: 'rgba(234, 88, 12, 0.85)', border: '#ea580c' },
        // Scope 2
        { name: 'Grid Electricity', val: results.estateScope2GridElectricity + results.millScope2GridElectricity, cat: 'Scope 2', color: 'rgba(16, 185, 129, 0.85)', border: '#10b981' },
        // Scope 3
        { name: '3rd Party FFB Purchase', val: results.millScope3Cat1PurchasedFfb, cat: 'Scope 3 Cat 1', color: 'rgba(2, 132, 199, 0.85)', border: '#0284c7' },
        { name: 'Fertiliser Mfg', val: results.estateScope3Cat1FertiliserMfg, cat: 'Scope 3 Cat 1', color: 'rgba(2, 132, 199, 0.85)', border: '#0284c7' },
        { name: 'Fuel & Grid WTT (FERA)', val: results.estateScope3Cat3FuelWtt + results.estateScope3Cat3ElectricityUpstream + results.millScope3Cat3FuelWtt + results.millScope3Cat3ElectricityUpstream, cat: 'Scope 3 Cat 3', color: 'rgba(2, 132, 199, 0.85)', border: '#0284c7' },
        { name: 'Transport (FFB & Fert)', val: results.estateScope3Cat4FertiliserTransport + results.millScope3Cat4FfbTransport, cat: 'Scope 3 Cat 4', color: 'rgba(2, 132, 199, 0.85)', border: '#0284c7' },
      ];

      items.forEach((item) => {
        if (item.val > 0.1) {
          labels.push(item.name);
          barRanges.push([running, running + item.val]);
          rawDeltas.push(item.val);
          backgroundColors.push(item.color);
          borderColors.push(item.border);
          stepCategories.push(item.cat);
          running += item.val;
        }
      });

      // Gross Total Milestone
      const gross = running;
      labels.push('Gross Total');
      barRanges.push([0, gross]);
      rawDeltas.push(gross);
      backgroundColors.push('rgba(71, 85, 105, 0.85)');
      borderColors.push('#475569');
      stepCategories.push('Gross PalmGHG Emissions');

      // Deductions
      const removals = results.totalCarbonRemovals;
      const afterRemovals = running - removals;
      labels.push('Carbon Removals');
      barRanges.push([Math.min(running, afterRemovals), Math.max(running, afterRemovals)]);
      rawDeltas.push(-removals);
      backgroundColors.push('rgba(22, 163, 74, 0.85)');
      borderColors.push('#16a34a');
      stepCategories.push('Crop Sequestration & Conservation');
      running = afterRemovals;

      const avoided = results.totalEmissionsAvoided;
      const afterAvoided = running - avoided;
      labels.push('Emissions Avoided');
      barRanges.push([Math.min(running, afterAvoided), Math.max(running, afterAvoided)]);
      rawDeltas.push(-avoided);
      backgroundColors.push('rgba(20, 184, 166, 0.85)');
      borderColors.push('#14b8a6');
      stepCategories.push('Biomass & Grid Export Credit');
      running = afterAvoided;

      // Net Total
      labels.push('Net Footprint');
      barRanges.push([0, results.totalNetEmissions]);
      rawDeltas.push(results.totalNetEmissions);
      backgroundColors.push('rgba(5, 150, 105, 0.95)');
      borderColors.push('#059669');
      stepCategories.push('Net GHG Emissions');
    }

    const textColor = isDark ? '#e5e5e5' : '#404040';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

    const data: ChartData<'bar', [number, number][]> = {
      labels,
      datasets: [
        {
          label: 'Emissions / Removals (tCO₂e)',
          data: barRanges,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1.5,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };

    const options: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: isDark ? '#171717' : '#ffffff',
          titleColor: isDark ? '#ffffff' : '#171717',
          bodyColor: isDark ? '#d4d4d4' : '#525252',
          borderColor: isDark ? '#404040' : '#e5e5e5',
          borderWidth: 1,
          padding: 10,
          boxPadding: 4,
          usePointStyle: true,
          callbacks: {
            title: (items) => {
              const idx = items[0].dataIndex;
              return `${labels[idx]} (${stepCategories[idx]})`;
            },
            label: (context) => {
              const idx = context.dataIndex;
              const delta = rawDeltas[idx];
              const range = barRanges[idx];
              const isMilestone = labels[idx].includes('Total') || labels[idx].includes('Footprint');

              if (isMilestone) {
                return `Total: ${fmt(range[1])} tCO₂e`;
              }

              const sign = delta > 0 ? '+' : '';
              return [
                `Impact: ${sign}${fmt(delta)} tCO₂e`,
                `Cumulative Level: ${fmt(range[1])} tCO₂e`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: textColor,
            font: {
              size: 11,
              weight: 'bold',
            },
            maxRotation: 45,
            minRotation: 25,
          },
        },
        y: {
          grid: {
            color: gridColor,
          },
          ticks: {
            color: textColor,
            font: {
              family: 'JetBrains Mono',
              size: 10,
            },
            callback: (val) => `${fmt(Number(val))} t`,
          },
          title: {
            display: true,
            text: 'Carbon Footprint (tCO₂e / Year)',
            color: textColor,
            font: {
              size: 11,
              weight: 'bold',
            },
          },
        },
      },
    };

    chartInstanceRef.current = new ChartJS(canvasRef.current, {
      type: 'bar',
      data,
      options,
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [results, breakdownMode, isDark]);

  return (
    <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Interactive Chart.js Emissions Waterfall
            </h3>
            {scenarioLabel && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-semibold">
                {scenarioLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Visualize the exact step-by-step contribution of operational areas across Scope 1, 2, 3, and deductions.
          </p>
        </div>

        {/* View Switcher: Scope Aggregation vs Detailed Operations */}
        <div className="flex items-center gap-1 p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium">
          <button
            onClick={() => setBreakdownMode('scopes')}
            className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
              breakdownMode === 'scopes'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            By Scope (1, 2, 3)
          </button>
          <button
            onClick={() => setBreakdownMode('detailed')}
            className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
              breakdownMode === 'detailed'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Operational Areas
          </button>
        </div>
      </div>

      {/* Chart Canvas Viewport */}
      <div className="relative w-full h-[380px]">
        <canvas ref={canvasRef} />
      </div>

      {/* Waterfall Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-600"></span>
            <span>Scope 1 (Direct)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
            <span>Scope 2 (Electricity)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-sky-600"></span>
            <span>Scope 3 (Value Chain)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-green-600"></span>
            <span>Carbon Removals (Deduction)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-teal-500"></span>
            <span>Emissions Avoided (Deduction)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-700"></span>
            <span>Net Footprint</span>
          </div>
        </div>

        <div className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
          Net Result: <strong className="text-emerald-600">{results.totalNetEmissions.toLocaleString(undefined, { maximumFractionDigits: 0 })} tCO₂e</strong>
        </div>
      </div>
    </div>
  );
};
