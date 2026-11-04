import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { EstateParameters, PalmGHGAssessmentResults } from '../types/palmghg';
import { CONSTANTS } from '../utils/palmghgCalculations';
import {
  Trees,
  Droplets,
  Layers,
  Sparkles,
  TrendingUp,
  Sliders,
  Calendar,
  Info,
  Download,
  RotateCcw,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  estate: EstateParameters;
  results: PalmGHGAssessmentResults;
  assessmentYear?: number;
  isDark?: boolean;
}

export interface YearProjectionData {
  year: number;
  yearIndex: number;
  label: string;
  forestHa: number;
  peatlandHa: number;
  nonForestHa: number;
  forestSeq: number; // tCO2e
  peatlandSeq: number; // tCO2e
  nonForestSeq: number; // tCO2e
  totalAnnualSeq: number; // tCO2e
  cumulativeSeq: number; // tCO2e
}

export const D3CarbonSequestrationChart: React.FC<Props> = ({
  estate,
  results,
  assessmentYear = 2026,
  isDark = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // User adjustable options
  const [chartMode, setChartMode] = useState<'stacked' | 'grouped' | 'cumulative'>('stacked');
  const [includeNonForest, setIncludeNonForest] = useState<boolean>(true);
  const [modelType, setModelType] = useState<'constant' | 'growth'>('constant');

  // Interactive Area Overrides (defaults from active estate parameters, with sensible fallback if 0)
  const defaultForestHa = estate.forestConservationAreaHa > 0 ? estate.forestConservationAreaHa : 350;
  const defaultPeatHa = estate.peatlandConservationAreaHa > 0 ? estate.peatlandConservationAreaHa : 150;
  const defaultNonForestHa = estate.nonForestConservationAreaHa > 0 ? estate.nonForestConservationAreaHa : 80;

  const [forestAreaHa, setForestAreaHa] = useState<number>(defaultForestHa);
  const [peatlandAreaHa, setPeatlandAreaHa] = useState<number>(defaultPeatHa);
  const [nonForestAreaHa, setNonForestAreaHa] = useState<number>(defaultNonForestHa);

  // Format helper
  const fmt = (val: number, decimals: number = 0) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  // Calculate 10-year projection dataset
  const projectionData = useMemo<YearProjectionData[]>(() => {
    const data: YearProjectionData[] = [];
    let runningCumulative = 0;

    const baseForestRate = Math.abs(estate.forestConservationRate || CONSTANTS.FOREST_CONSERVATION_RATE);
    const basePeatRate = Math.abs(CONSTANTS.PEAT_CONSERVATION_FACTOR);
    const baseNonForestRate = Math.abs(estate.nonForestConservationRate || CONSTANTS.NON_FOREST_CONSERVATION_RATE);

    for (let i = 0; i < 10; i++) {
      const year = assessmentYear + i;
      // In 'growth' model, restored forest canopy and rewetted peat gain ~2.5% carbon accumulation per year
      const growthFactor = modelType === 'growth' ? Math.pow(1.025, i) : 1.0;

      const forestSeq = forestAreaHa * baseForestRate * growthFactor;
      const peatlandSeq = peatlandAreaHa * basePeatRate * (modelType === 'growth' ? Math.min(1.25, 1 + i * 0.02) : 1.0);
      const nonForestSeq = includeNonForest ? nonForestAreaHa * baseNonForestRate * growthFactor : 0;

      const totalAnnualSeq = forestSeq + peatlandSeq + nonForestSeq;
      runningCumulative += totalAnnualSeq;

      data.push({
        year,
        yearIndex: i + 1,
        label: `Y${i + 1} (${year})`,
        forestHa: forestAreaHa,
        peatlandHa: peatlandAreaHa,
        nonForestHa: includeNonForest ? nonForestAreaHa : 0,
        forestSeq,
        peatlandSeq,
        nonForestSeq,
        totalAnnualSeq,
        cumulativeSeq: runningCumulative,
      });
    }

    return data;
  }, [
    assessmentYear,
    forestAreaHa,
    peatlandAreaHa,
    nonForestAreaHa,
    includeNonForest,
    modelType,
    estate.forestConservationRate,
    estate.nonForestConservationRate,
  ]);

  // Summary Metrics
  const total10YearSeq = projectionData[projectionData.length - 1]?.cumulativeSeq || 0;
  const avgAnnualSeq = total10YearSeq / 10;
  const totalForest10Yr = projectionData.reduce((acc, d) => acc + d.forestSeq, 0);
  const totalPeat10Yr = projectionData.reduce((acc, d) => acc + d.peatlandSeq, 0);
  const totalNonForest10Yr = projectionData.reduce((acc, d) => acc + d.nonForestSeq, 0);

  // Render D3 Chart
  useEffect(() => {
    if (!svgRef.current || projectionData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    // Dimensions
    const width = 860;
    const height = 380;
    const margin = { top: 30, right: 30, bottom: 50, left: 65 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Defs & Gradients
    const defs = svg.append('defs');

    // Forest gradient (Emerald)
    const forestGrad = defs
      .append('linearGradient')
      .attr('id', 'forestGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    forestGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981');
    forestGrad.append('stop').attr('offset', '100%').attr('stop-color', '#047857');

    // Peatland gradient (Cyan/Teal)
    const peatGrad = defs
      .append('linearGradient')
      .attr('id', 'peatGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    peatGrad.append('stop').attr('offset', '0%').attr('stop-color', '#06b6d4');
    peatGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0e7490');

    // Non-Forest gradient (Amber/Lime)
    const nonForestGrad = defs
      .append('linearGradient')
      .attr('id', 'nonForestGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    nonForestGrad.append('stop').attr('offset', '0%').attr('stop-color', '#84cc16');
    nonForestGrad.append('stop').attr('offset', '100%').attr('stop-color', '#4d7c0f');

    // Cumulative gradient (Purple/Indigo)
    const cumGrad = defs
      .append('linearGradient')
      .attr('id', 'cumulativeGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    cumGrad.append('stop').attr('offset', '0%').attr('stop-color', '#8b5cf6');
    cumGrad.append('stop').attr('offset', '100%').attr('stop-color', '#6366f1');

    // Main G container
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale
    const xScale = d3
      .scaleBand()
      .domain(projectionData.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.28);

    // Color definitions
    const keys = includeNonForest ? ['peatlandSeq', 'forestSeq', 'nonForestSeq'] : ['peatlandSeq', 'forestSeq'];
    const colorMap: Record<string, string> = {
      peatlandSeq: 'url(#peatGradient)',
      forestSeq: 'url(#forestGradient)',
      nonForestSeq: 'url(#nonForestGradient)',
    };
    const keyLabels: Record<string, string> = {
      peatlandSeq: 'Peatland Conservation',
      forestSeq: 'HCV Forest Conservation',
      nonForestSeq: 'Non-Forest/Riparian',
    };

    // Y Scale Domain depends on chartMode
    let yMax = 0;
    if (chartMode === 'cumulative') {
      yMax = (d3.max(projectionData, (d) => d.cumulativeSeq) || 1000) * 1.15;
    } else if (chartMode === 'stacked') {
      yMax = (d3.max(projectionData, (d) => d.totalAnnualSeq) || 1000) * 1.15;
    } else {
      // Grouped
      yMax = (d3.max(projectionData, (d) => Math.max(d.forestSeq, d.peatlandSeq, d.nonForestSeq)) || 1000) * 1.25;
    }

    const yScale = d3
      .scaleLinear()
      .domain([0, yMax])
      .nice()
      .range([innerHeight, 0]);

    // Horizontal Grid Lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .call((grid) => grid.select('.domain').remove())
      .call((grid) =>
        grid
          .selectAll('line')
          .attr('stroke', isDark ? '#262626' : '#e5e7eb')
          .attr('stroke-dasharray', '3,3')
      );

    // Tooltip handler
    const tooltip = d3.select(tooltipRef.current);

    // RENDER: CUMULATIVE MODE
    if (chartMode === 'cumulative') {
      // Render cumulative bars
      const bars = g
        .selectAll('.cum-bar')
        .data(projectionData)
        .enter()
        .append('rect')
        .attr('class', 'cum-bar')
        .attr('x', (d) => xScale(d.label) || 0)
        .attr('width', xScale.bandwidth())
        .attr('y', innerHeight)
        .attr('height', 0)
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('fill', 'url(#cumulativeGradient)')
        .attr('cursor', 'pointer');

      // Animation
      bars
        .transition()
        .duration(700)
        .delay((_, i) => i * 40)
        .attr('y', (d) => yScale(d.cumulativeSeq))
        .attr('height', (d) => innerHeight - yScale(d.cumulativeSeq));

      // Value text labels on top of bars
      g.selectAll('.cum-label')
        .data(projectionData)
        .enter()
        .append('text')
        .attr('class', 'cum-label')
        .attr('x', (d) => (xScale(d.label) || 0) + xScale.bandwidth() / 2)
        .attr('y', (d) => yScale(d.cumulativeSeq) - 8)
        .attr('text-anchor', 'middle')
        .attr('fill', isDark ? '#a78bfa' : '#6d28d9')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('font-family', 'monospace')
        .text((d) => fmt(d.cumulativeSeq, 0));

      // Line path overlay
      const lineGen = d3
        .line<YearProjectionData>()
        .x((d) => (xScale(d.label) || 0) + xScale.bandwidth() / 2)
        .y((d) => yScale(d.cumulativeSeq))
        .curve(d3.curveMonotoneX);

      const path = g
        .append('path')
        .datum(projectionData)
        .attr('fill', 'none')
        .attr('stroke', '#ec4899')
        .attr('stroke-width', 2.5)
        .attr('d', lineGen);

      const pathLength = path.node()?.getTotalLength() || 0;
      path
        .attr('stroke-dasharray', `${pathLength} ${pathLength}`)
        .attr('stroke-dashoffset', pathLength)
        .transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);

      // Interactive hover
      bars
        .on('pointerover', function (event, d) {
          d3.select(this).attr('opacity', 0.85).attr('stroke', '#fff').attr('stroke-width', 2);
          tooltip.style('opacity', '1').html(`
            <div class="space-y-1">
              <div class="font-bold text-neutral-100 border-b border-neutral-700 pb-1 flex justify-between">
                <span>Tahun ${d.year} (Year ${d.yearIndex})</span>
                <span class="text-indigo-400 font-mono">Akumulatif</span>
              </div>
              <div class="text-xs text-neutral-300">
                Total Sekuestrasi Akumulatif: <strong class="text-indigo-300 font-mono font-bold">${fmt(d.cumulativeSeq, 0)} tCO₂e</strong>
              </div>
              <div class="text-[11px] text-neutral-400">
                Pelepasan Emisi Terhindar/Diserap Tahun Ini: <span class="font-mono text-emerald-400 font-bold">${fmt(d.totalAnnualSeq, 0)} tCO₂e</span>
              </div>
            </div>
          `);
        })
        .on('pointermove', function (event) {
          const [x, y] = d3.pointer(event, svgRef.current);
          tooltip.style('left', `${x + 20}px`).style('top', `${y - 15}px`);
        })
        .on('pointerout', function () {
          d3.select(this).attr('opacity', 1).attr('stroke', null);
          tooltip.style('opacity', '0');
        });
    }

    // RENDER: STACKED BAR MODE
    else if (chartMode === 'stacked') {
      const stack = d3.stack<YearProjectionData>().keys(keys);
      const stackedData = stack(projectionData);

      const groups = g
        .selectAll('.stack-group')
        .data(stackedData)
        .enter()
        .append('g')
        .attr('class', 'stack-group')
        .attr('fill', (d) => colorMap[d.key]);

      groups
        .selectAll('rect')
        .data((d) => d)
        .enter()
        .append('rect')
        .attr('x', (d) => xScale(d.data.label) || 0)
        .attr('width', xScale.bandwidth())
        .attr('y', innerHeight)
        .attr('height', 0)
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('cursor', 'pointer')
        .transition()
        .duration(700)
        .delay((_, i) => i * 40)
        .attr('y', (d) => yScale(d[1]))
        .attr('height', (d) => yScale(d[0]) - yScale(d[1]));

      // Stack Total Text Labels on top
      g.selectAll('.stack-total-label')
        .data(projectionData)
        .enter()
        .append('text')
        .attr('class', 'stack-total-label')
        .attr('x', (d) => (xScale(d.label) || 0) + xScale.bandwidth() / 2)
        .attr('y', (d) => yScale(d.totalAnnualSeq) - 7)
        .attr('text-anchor', 'middle')
        .attr('fill', isDark ? '#d1d5db' : '#374151')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('font-family', 'monospace')
        .text((d) => fmt(d.totalAnnualSeq, 0));

      // Interactive hover for stacked rects
      groups
        .selectAll('rect')
        .on('pointerover', function (event, d: any) {
          d3.select(this).attr('opacity', 0.85).attr('stroke', '#fff').attr('stroke-width', 1.5);
          const yearData = d.data as YearProjectionData;
          tooltip.style('opacity', '1').html(`
            <div class="space-y-1.5 min-w-[220px]">
              <div class="font-bold text-neutral-100 border-b border-neutral-700 pb-1 flex justify-between">
                <span>Tahun ${yearData.year} (${yearData.label})</span>
                <span class="text-emerald-400 font-mono">1-Tahun</span>
              </div>
              <div class="text-[11px] space-y-1">
                <div class="flex justify-between items-center text-cyan-300">
                  <span>Konservasi Gambut:</span>
                  <span class="font-mono font-bold">${fmt(yearData.peatlandSeq, 0)} tCO₂e</span>
                </div>
                <div class="flex justify-between items-center text-emerald-300">
                  <span>Konservasi Hutan HCV:</span>
                  <span class="font-mono font-bold">${fmt(yearData.forestSeq, 0)} tCO₂e</span>
                </div>
                ${
                  includeNonForest
                    ? `<div class="flex justify-between items-center text-lime-300">
                        <span>Non-Hutan / Riparian:</span>
                        <span class="font-mono font-bold">${fmt(yearData.nonForestSeq, 0)} tCO₂e</span>
                      </div>`
                    : ''
                }
              </div>
              <div class="pt-1 border-t border-neutral-700 text-xs font-bold text-neutral-200 flex justify-between">
                <span>Total Tahunan:</span>
                <span class="font-mono text-emerald-400">${fmt(yearData.totalAnnualSeq, 0)} tCO₂e</span>
              </div>
              <div class="text-[10px] text-neutral-400 pt-0.5">
                Akumulatif s.d. tahun ini: <span class="font-mono text-neutral-200">${fmt(yearData.cumulativeSeq, 0)} tCO₂e</span>
              </div>
            </div>
          `);
        })
        .on('pointermove', function (event) {
          const [x, y] = d3.pointer(event, svgRef.current);
          tooltip.style('left', `${x + 20}px`).style('top', `${y - 15}px`);
        })
        .on('pointerout', function () {
          d3.select(this).attr('opacity', 1).attr('stroke', null);
          tooltip.style('opacity', '0');
        });
    }

    // RENDER: GROUPED BAR MODE
    else if (chartMode === 'grouped') {
      const subXScale = d3
        .scaleBand()
        .domain(keys)
        .range([0, xScale.bandwidth()])
        .padding(0.12);

      const yearGroups = g
        .selectAll('.year-group')
        .data(projectionData)
        .enter()
        .append('g')
        .attr('class', 'year-group')
        .attr('transform', (d) => `translate(${xScale(d.label)}, 0)`);

      keys.forEach((key) => {
        yearGroups
          .append('rect')
          .attr('x', subXScale(key) || 0)
          .attr('width', subXScale.bandwidth())
          .attr('y', innerHeight)
          .attr('height', 0)
          .attr('rx', 3)
          .attr('ry', 3)
          .attr('fill', colorMap[key])
          .attr('cursor', 'pointer')
          .transition()
          .duration(700)
          .attr('y', (d: any) => yScale(d[key]))
          .attr('height', (d: any) => innerHeight - yScale(d[key]));
      });

      // Interactive hover for grouped bars
      yearGroups
        .selectAll('rect')
        .on('pointerover', function (event, d: any) {
          d3.select(this).attr('opacity', 0.85).attr('stroke', '#fff').attr('stroke-width', 1.5);
          tooltip.style('opacity', '1').html(`
            <div class="space-y-1">
              <div class="font-bold text-neutral-100 border-b border-neutral-700 pb-1">
                Tahun ${d.year} (Year ${d.yearIndex})
              </div>
              <div class="text-xs space-y-0.5">
                <div class="text-cyan-300">Gambut: <strong class="font-mono">${fmt(d.peatlandSeq, 0)} tCO₂e</strong> (${fmt(d.peatlandHa)} ha)</div>
                <div class="text-emerald-300">Hutan HCV: <strong class="font-mono">${fmt(d.forestSeq, 0)} tCO₂e</strong> (${fmt(d.forestHa)} ha)</div>
                ${includeNonForest ? `<div class="text-lime-300">Non-Hutan: <strong class="font-mono">${fmt(d.nonForestSeq, 0)} tCO₂e</strong> (${fmt(d.nonForestHa)} ha)</div>` : ''}
              </div>
              <div class="pt-1 border-t border-neutral-700 text-xs font-bold text-neutral-200">
                Total: <span class="font-mono text-emerald-400">${fmt(d.totalAnnualSeq, 0)} tCO₂e/yr</span>
              </div>
            </div>
          `);
        })
        .on('pointermove', function (event) {
          const [x, y] = d3.pointer(event, svgRef.current);
          tooltip.style('left', `${x + 20}px`).style('top', `${y - 15}px`);
        })
        .on('pointerout', function () {
          d3.select(this).attr('opacity', 1).attr('stroke', null);
          tooltip.style('opacity', '0');
        });
    }

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .call((axis) => axis.select('.domain').attr('stroke', isDark ? '#404040' : '#d1d5db'))
      .call((axis) =>
        axis
          .selectAll('text')
          .attr('fill', isDark ? '#9ca3af' : '#4b5563')
          .attr('font-size', '10px')
          .attr('font-weight', '600')
          .attr('dy', '1em')
      );

    // Y Axis
    g.append('g')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(6)
          .tickFormat((d) => `${fmt(Number(d), 0)}`)
      )
      .call((axis) => axis.select('.domain').remove())
      .call((axis) =>
        axis
          .selectAll('text')
          .attr('fill', isDark ? '#9ca3af' : '#4b5563')
          .attr('font-size', '10px')
          .attr('font-family', 'monospace')
      );

    // Y Axis Label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -50)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', isDark ? '#9ca3af' : '#6b7280')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .text(chartMode === 'cumulative' ? 'Sekuestrasi Akumulatif (tCO₂e)' : 'Sekuestrasi Tahunan (tCO₂e / tahun)');
  }, [projectionData, chartMode, includeNonForest, isDark]);

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 mt-0.5 shrink-0">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  D3-Powered Carbon Sequestration Engine
                </span>
                <span className="text-xs text-neutral-300 dark:text-neutral-700">·</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  RSPO PalmGHG V5 / GHG Protocol LSR
                </span>
              </div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                10-Year Projected Carbon Sequestration (Peatland & Forest Conservation)
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5 max-w-3xl">
                Visualisasi D3.js memproyeksikan penyerapan karbon dari kawasan konservasi hutan bernilai konservasi tinggi (HCV) dan lahan gambut yang dikonservasi/dibasahi kembali (rewetted) selama periode 10 tahun ({assessmentYear} – {assessmentYear + 9}).
              </p>
            </div>
          </div>

          {/* Interactive Chart Mode Toggles */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Chart Mode */}
            <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setChartMode('stacked')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  chartMode === 'stacked'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
                }`}
              >
                Stacked Bar
              </button>
              <button
                type="button"
                onClick={() => setChartMode('grouped')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  chartMode === 'grouped'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
                }`}
              >
                Grouped Bar
              </button>
              <button
                type="button"
                onClick={() => setChartMode('cumulative')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  chartMode === 'cumulative'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
                }`}
              >
                Cumulative (10-Yr)
              </button>
            </div>

            {/* Projection Model Toggle */}
            <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setModelType('constant')}
                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                  modelType === 'constant'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500'
                }`}
                title="RSPO default constant annual factor"
              >
                Constant Rate
              </button>
              <button
                type="button"
                onClick={() => setModelType('growth')}
                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                  modelType === 'growth'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500'
                }`}
                title="Biomass canopy restoration maturation curve (+2.5%/yr)"
              >
                Growth Curve (+2.5%)
              </button>
            </div>
          </div>
        </div>

        {/* 4 TOP KPI SUMMARY TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80">
            <span className="text-[11px] font-medium text-neutral-500">Total 10-Yr Cumulative Removal</span>
            <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
              -{fmt(total10YearSeq, 0)} <span className="text-xs font-normal text-neutral-500">tCO₂e</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5 font-mono">
              Rata-rata: <strong>-{fmt(avgAnnualSeq, 0)}</strong> tCO₂e/tahun
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                <Trees className="w-3.5 h-3.5 text-emerald-600" />
                HCV Forest Conservation
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 rounded">
                {fmt((totalForest10Yr / (total10YearSeq || 1)) * 100, 1)}%
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-800 dark:text-emerald-300 mt-1">
              -{fmt(totalForest10Yr, 0)} <span className="text-xs font-normal text-neutral-500">tCO₂e</span>
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
              Area: <strong>{fmt(forestAreaHa)} ha</strong> (faktor -9.14 tCO₂e/ha/yr)
            </div>
          </div>

          <div className="p-3.5 bg-cyan-50/70 dark:bg-cyan-950/30 rounded-xl border border-cyan-200 dark:border-cyan-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-800 dark:text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                Peatland Conservation
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-cyan-200 dark:bg-cyan-900 text-cyan-900 dark:text-cyan-100 rounded">
                {fmt((totalPeat10Yr / (total10YearSeq || 1)) * 100, 1)}%
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-cyan-800 dark:text-cyan-300 mt-1">
              -{fmt(totalPeat10Yr, 0)} <span className="text-xs font-normal text-neutral-500">tCO₂e</span>
            </div>
            <div className="text-[11px] text-cyan-700 dark:text-cyan-400 mt-0.5">
              Area: <strong>{fmt(peatlandAreaHa)} ha</strong> (faktor -5.5 tCO₂e/ha/yr)
            </div>
          </div>

          <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Impact Equivalency
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100 rounded">
                LSR v1.1
              </span>
            </div>
            <div className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              ~{fmt(total10YearSeq / 4.6, 0)} Mobil
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Setara emisi tahunan kendaraan penumpang yang diimbangi selama 10 tahun
            </div>
          </div>
        </div>
      </div>

      {/* D3 BAR CHART SVG CONTAINER */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>D3 Interactive Projection Bar Chart ({chartMode.toUpperCase()})</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Arahkan kursor pada setiap balok grafik untuk melihat rincian serapan emisi kawasan konservasi tahunan.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
            {chartMode === 'cumulative' ? (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gradient-to-r from-purple-500 to-indigo-600 inline-block"></span>
                <span className="text-neutral-700 dark:text-neutral-300">Akumulatif 10-Tahun</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-cyan-500 inline-block"></span>
                  <span className="text-neutral-700 dark:text-neutral-300">Peatland (-5.5 t/ha)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-600 inline-block"></span>
                  <span className="text-neutral-700 dark:text-neutral-300">Forest HCV (-9.14 t/ha)</span>
                </div>
                {includeNonForest && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-lime-500 inline-block"></span>
                    <span className="text-neutral-700 dark:text-neutral-300">Non-Forest (-2.4 t/ha)</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* SVG Canvas and Tooltip container */}
        <div className="relative overflow-x-auto">
          <svg
            ref={svgRef}
            viewBox="0 0 860 380"
            className="w-full h-auto min-w-[700px] select-none"
          />

          {/* D3 Tooltip */}
          <div
            ref={tooltipRef}
            className="absolute pointer-events-none p-3 rounded-xl bg-neutral-900/95 text-white border border-neutral-700 text-xs shadow-xl transition-opacity duration-150 opacity-0 z-30"
            style={{ transform: 'translate(0, 0)' }}
          />
        </div>
      </div>

      {/* INTERACTIVE CONSERVATION AREA SIMULATOR & TUNING DRAWER */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Interactive Conservation Area Simulator (Hektar)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setForestAreaHa(defaultForestHa);
              setPeatlandAreaHa(defaultPeatHa);
              setNonForestAreaHa(defaultNonForestHa);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset ke Parameter Estate</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Forest HCV Area Slider */}
          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Trees className="w-3.5 h-3.5 text-emerald-600" />
                Kawasan Hutan HCV
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {fmt(forestAreaHa)} ha
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2000"
              step="10"
              value={forestAreaHa}
              onChange={(e) => setForestAreaHa(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>0 ha</span>
              <span>Tahunan: -{fmt(forestAreaHa * 9.14, 0)} tCO₂e</span>
              <span>2,000 ha</span>
            </div>
          </div>

          {/* Peatland Conservation Area Slider */}
          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                Gambut Dikonservasi / Rewetted
              </span>
              <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
                {fmt(peatlandAreaHa)} ha
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1500"
              step="10"
              value={peatlandAreaHa}
              onChange={(e) => setPeatlandAreaHa(Number(e.target.value))}
              className="w-full accent-cyan-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>0 ha</span>
              <span>Tahunan: -{fmt(peatlandAreaHa * 5.5, 0)} tCO₂e</span>
              <span>1,500 ha</span>
            </div>
          </div>

          {/* Non-Forest Conservation Area Slider */}
          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-lime-600" />
                Riparian & Semak Belukar
              </span>
              <span className="text-xs font-mono font-bold text-lime-700 dark:text-lime-400">
                {fmt(nonForestAreaHa)} ha
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="5"
              value={nonForestAreaHa}
              onChange={(e) => setNonForestAreaHa(Number(e.target.value))}
              className="w-full accent-lime-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>0 ha</span>
              <span>Tahunan: -{fmt(nonForestAreaHa * 2.4, 0)} tCO₂e</span>
              <span>500 ha</span>
            </div>
          </div>
        </div>
      </div>

      {/* 10-YEAR DATA TABLE BREAKDOWN */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Tabel Rincian Proyeksi 10-Tahun ({assessmentYear} – {assessmentYear + 9})
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Data terperinci tahunan dan kumulatif berdasarkan metodologi RSPO PalmGHG V5 & GHG Protocol Land Sector and Removals Standard.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border border-neutral-200 dark:border-neutral-700">
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold border-b border-neutral-200 dark:border-neutral-700">
                <th className="p-2.5 w-16 text-center">Periode</th>
                <th className="p-2.5 w-24">Tahun Kalender</th>
                <th className="p-2.5 text-right bg-cyan-50/50 dark:bg-cyan-950/20 text-cyan-900 dark:text-cyan-300">
                  Gambut Konservasi (tCO₂e)
                </th>
                <th className="p-2.5 text-right bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300">
                  Hutan HCV (tCO₂e)
                </th>
                {includeNonForest && (
                  <th className="p-2.5 text-right bg-lime-50/50 dark:bg-lime-950/20 text-lime-900 dark:text-lime-300">
                    Non-Hutan (tCO₂e)
                  </th>
                )}
                <th className="p-2.5 text-right font-bold text-neutral-900 dark:text-neutral-100">
                  Total Tahunan (tCO₂e)
                </th>
                <th className="p-2.5 text-right font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20">
                  Akumulatif s.d. Tahun (tCO₂e)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
              {projectionData.map((row) => (
                <tr key={row.year} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="p-2.5 text-center font-sans font-semibold text-neutral-500">
                    Year {row.yearIndex}
                  </td>
                  <td className="p-2.5 font-bold text-neutral-900 dark:text-neutral-100">
                    {row.year}
                  </td>
                  <td className="p-2.5 text-right text-cyan-700 dark:text-cyan-400">
                    -{fmt(row.peatlandSeq, 0)}
                  </td>
                  <td className="p-2.5 text-right text-emerald-700 dark:text-emerald-400">
                    -{fmt(row.forestSeq, 0)}
                  </td>
                  {includeNonForest && (
                    <td className="p-2.5 text-right text-lime-700 dark:text-lime-400">
                      -{fmt(row.nonForestSeq, 0)}
                    </td>
                  )}
                  <td className="p-2.5 text-right font-bold text-neutral-900 dark:text-neutral-100">
                    -{fmt(row.totalAnnualSeq, 0)}
                  </td>
                  <td className="p-2.5 text-right font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/10">
                    -{fmt(row.cumulativeSeq, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-neutral-100 dark:bg-neutral-800 font-bold border-t-2 border-neutral-300 dark:border-neutral-700 font-mono">
                <td colSpan={2} className="p-2.5 text-neutral-900 dark:text-neutral-100 uppercase tracking-wide font-sans">
                  Total 10-Tahun Proyeksi
                </td>
                <td className="p-2.5 text-right text-cyan-800 dark:text-cyan-300">
                  -{fmt(totalPeat10Yr, 0)}
                </td>
                <td className="p-2.5 text-right text-emerald-800 dark:text-emerald-300">
                  -{fmt(totalForest10Yr, 0)}
                </td>
                {includeNonForest && (
                  <td className="p-2.5 text-right text-lime-800 dark:text-lime-300">
                    -{fmt(totalNonForest10Yr, 0)}
                  </td>
                )}
                <td className="p-2.5 text-right text-neutral-900 dark:text-neutral-100">
                  -{fmt(total10YearSeq, 0)}
                </td>
                <td className="p-2.5 text-right text-indigo-800 dark:text-indigo-300 bg-indigo-100/50 dark:bg-indigo-950/40">
                  -{fmt(total10YearSeq, 0)} tCO₂e
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
