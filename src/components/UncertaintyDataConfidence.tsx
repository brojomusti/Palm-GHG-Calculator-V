import React, { useState, useMemo } from 'react';
import {
  Scale,
  Sparkles,
  BarChart2,
  Layers,
  Sliders,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { PalmGHGAssessmentResults } from '../types/palmghg';

export type ConfidenceTier = 'high' | 'medium' | 'low';

export interface CategoryUncertaintyConfig {
  id: string;
  name: string;
  subCategory: string;
  scopeLabel: string;
  iconType: 'peat' | 'fertiliser' | 'pome' | 'fuel' | 'grid' | 'fert_upstream' | 'ffb_scope3' | 'removals';
  confidenceTier: ConfidenceTier;
  uncertaintyPercent: number; // e.g., 5, 15, 30
  activityDataSource: string;
  emissionFactorTier: 'Tier 1 (IPCC Default)' | 'Tier 2 (Regional/National)' | 'Tier 3 (Direct Continuous/Empirical)';
  auditMitigationRecommendation: string;
}

interface Props {
  results: PalmGHGAssessmentResults;
  scenarioLabel?: string;
  isDark?: boolean;
}

// Default standard uncertainty bounds aligned with IPCC 2006/2019 Refinement & RSPO V5
const TIER_PERCENTAGES: Record<ConfidenceTier, number> = {
  high: 5.0,     // ±5% (calibrated scales, lab COD tests, SCADA flowmeters, utility invoices)
  medium: 15.0,  // ±15% (regional emission factors, commercial fertilizer formulation specs)
  low: 30.0,     // ±30% (IPCC default constants, proxy transport distances, smallholder yield assumptions)
};

export const UncertaintyDataConfidence: React.FC<Props> = ({
  results,
  scenarioLabel = 'Likely Baseline',
  isDark = false,
}) => {
  // Preset profiles for rapid auditor testing
  const [selectedPreset, setSelectedPreset] = useState<'custom' | 'high_assurance' | 'standard_rspo' | 'tier1_screening'>('standard_rspo');
  const [copiedAuditSummary, setCopiedAuditSummary] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  // Derive emission values from active PalmGHG results
  const emissionValues = useMemo(() => {
    return {
      peat_luc: results.estateScope1Peat + results.estateScope1LucAmortised + results.estateScope1LandManagement,
      fertiliser_n2o: results.estateScope1FertiliserApp,
      pome_biogas: results.millScope1PomeLagoon + results.millScope1PomeMethaneUncombusted,
      fuels_machinery: results.estateScope1FuelStationary + results.estateScope1FuelMobile + results.millScope1FuelStationary + results.millScope1FuelMobile,
      grid_scope2_3: results.estateScope2GridElectricity + results.millScope2GridElectricity + results.estateScope3Cat3ElectricityUpstream + results.millScope3Cat3ElectricityUpstream,
      upstream_fertiliser: results.estateScope3Cat1FertiliserMfg + results.estateScope3Cat4FertiliserTransport,
      third_party_ffb: results.millScope3Cat1PurchasedFfb + results.millScope3Cat4FfbTransport,
      carbon_removals: results.totalCarbonRemovals,
    };
  }, [results]);

  // Initial category configuration
  const [categories, setCategories] = useState<CategoryUncertaintyConfig[]>([
    {
      id: 'pome_biogas',
      name: 'POME Wastewater & Biogas Methane',
      subCategory: 'Mill Scope 1 Wastewater',
      scopeLabel: 'Scope 1 (Process)',
      iconType: 'pome',
      confidenceTier: 'high',
      uncertaintyPercent: 5.0,
      activityDataSource: 'Continuous COD testing laboratory records & ultrasonic biogas flowmeter logs',
      emissionFactorTier: 'Tier 3 (Direct Continuous/Empirical)',
      auditMitigationRecommendation: 'Verify weekly COD meter calibration certificate and flare efficiency runtime logs.'
    },
    {
      id: 'peat_luc',
      name: 'Peat Soils & LUC Amortisation',
      subCategory: 'Estate Scope 1 Land Management',
      scopeLabel: 'Scope 1 (Biogenic Soil)',
      iconType: 'peat',
      confidenceTier: 'medium',
      uncertaintyPercent: 15.0,
      activityDataSource: 'Piezometer water-table monitoring records (monthly) & historic GIS satellite LUC map (25-yr amortisation)',
      emissionFactorTier: 'Tier 2 (Regional/National)',
      auditMitigationRecommendation: 'Install automated digital data logger piezometers to reduce drainage variance from ±15% to ±5%.'
    },
    {
      id: 'fertiliser_n2o',
      name: 'Estate Field Fertiliser N₂O',
      subCategory: 'Direct & Indirect Soil N₂O',
      scopeLabel: 'Scope 1 (Agronomy)',
      iconType: 'fertiliser',
      confidenceTier: 'medium',
      uncertaintyPercent: 15.0,
      activityDataSource: 'Estate annual nutrient balance ledger & verified agronomic application schedules',
      emissionFactorTier: 'Tier 2 (Regional/National)',
      auditMitigationRecommendation: 'Deploy soil-specific N2O chamber field measurements or precise GPS spreader telemetry.'
    },
    {
      id: 'fuels_machinery',
      name: 'Operational Fuels & Machinery',
      subCategory: 'Estate & Mill Mobile/Stationary Diesel',
      scopeLabel: 'Scope 1 (Combustion)',
      iconType: 'fuel',
      confidenceTier: 'high',
      uncertaintyPercent: 5.0,
      activityDataSource: 'Calibrated diesel fuel dispenser meters, telematics, and fiscal delivery invoices',
      emissionFactorTier: 'Tier 3 (Direct Continuous/Empirical)',
      auditMitigationRecommendation: 'Maintain metrological calibration seals on all bulk fuel storage bowsers.'
    },
    {
      id: 'grid_scope2_3',
      name: 'Purchased Grid Electricity & Losses',
      subCategory: 'Scope 2 Grid & Scope 3 Upstream T&D',
      scopeLabel: 'Scope 2 & Scope 3 Cat 3',
      iconType: 'grid',
      confidenceTier: 'high',
      uncertaintyPercent: 5.0,
      activityDataSource: 'Monthly PLN/utility fiscal revenue billing meters and published national grid emission factors',
      emissionFactorTier: 'Tier 2 (Regional/National)',
      auditMitigationRecommendation: 'Reconcile digital utility smart-meter logs with monthly supplier invoices.'
    },
    {
      id: 'upstream_fertiliser',
      name: 'Upstream Fertiliser Supply Chain',
      subCategory: 'Embodied Fertilizer Mfg & Freight',
      scopeLabel: 'Scope 3 Cat 1 & Cat 4',
      iconType: 'fert_upstream',
      confidenceTier: 'medium',
      uncertaintyPercent: 15.0,
      activityDataSource: 'Fertilizer supplier certificates of analysis and Ecoinvent v3.10 LCI manufacturing emission factors',
      emissionFactorTier: 'Tier 2 (Regional/National)',
      auditMitigationRecommendation: 'Request Environmental Product Declarations (EPD) from certified chemical manufacturers.'
    },
    {
      id: 'third_party_ffb',
      name: 'Third-Party & Smallholder FFB Supply',
      subCategory: 'Scheme & Independent Smallholder Plots',
      scopeLabel: 'Scope 3 Cat 1 & Cat 4',
      iconType: 'ffb_scope3',
      confidenceTier: 'low',
      uncertaintyPercent: 30.0,
      activityDataSource: 'Mill weighbridge receipts combined with regional smallholder proxy yield and logistics averages',
      emissionFactorTier: 'Tier 1 (IPCC Default)',
      auditMitigationRecommendation: 'Accelerate smallholder polygon mapping and RSPO ISH group certification to lower default uncertainty.'
    },
    {
      id: 'carbon_removals',
      name: 'Carbon Removals (Conservation & Peat)',
      subCategory: 'HCV Forest & Peatland Rewetting',
      scopeLabel: 'Optional Removals (LSR)',
      iconType: 'removals',
      confidenceTier: 'medium',
      uncertaintyPercent: 15.0,
      activityDataSource: 'Permanent sample plot allometric biomass inventory & high-resolution LiDAR canopy survey',
      emissionFactorTier: 'Tier 2 (Regional/National)',
      auditMitigationRecommendation: 'Conduct biannual ground-truthed plot measurements to confirm ongoing carbon sink stability.'
    },
  ]);

  // Apply quick presets
  const handleApplyPreset = (preset: 'high_assurance' | 'standard_rspo' | 'tier1_screening') => {
    setSelectedPreset(preset);
    setCategories((prev) =>
      prev.map((cat) => {
        if (preset === 'high_assurance') {
          return {
            ...cat,
            confidenceTier: 'high',
            uncertaintyPercent: 5.0,
          };
        } else if (preset === 'standard_rspo') {
          // Standard RSPO: High for Mill/Fuels/Grid, Medium for Estate/Peat/Removals, Low for Scope 3 FFB
          let tier: ConfidenceTier = 'medium';
          let pct = 15.0;
          if (['pome_biogas', 'fuels_machinery', 'grid_scope2_3'].includes(cat.id)) {
            tier = 'high';
            pct = 5.0;
          } else if (cat.id === 'third_party_ffb') {
            tier = 'low';
            pct = 30.0;
          }
          return {
            ...cat,
            confidenceTier: tier,
            uncertaintyPercent: pct,
          };
        } else {
          // Tier 1 screening
          return {
            ...cat,
            confidenceTier: 'low',
            uncertaintyPercent: 30.0,
          };
        }
      })
    );
  };

  // Update a single category's confidence tier
  const handleTierChange = (id: string, tier: ConfidenceTier) => {
    setSelectedPreset('custom');
    setCategories((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              confidenceTier: tier,
              uncertaintyPercent: TIER_PERCENTAGES[tier],
            }
          : c
      )
    );
  };

  // Update a category's exact uncertainty percentage via slider
  const handlePercentChange = (id: string, percent: number) => {
    setSelectedPreset('custom');
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        let tier: ConfidenceTier = 'medium';
        if (percent <= 8.0) tier = 'high';
        else if (percent >= 22.0) tier = 'low';
        return {
          ...c,
          uncertaintyPercent: percent,
          confidenceTier: tier,
        };
      })
    );
  };

  // Calculate IPCC Tier 1 Approach 1 Error Propagation:
  // σ_i = (U_i / 100) * E_i
  // σ_total^2 = Σ (σ_i)^2
  // σ_total = sqrt(σ_total^2)
  // U_total(%) = (σ_total / |E_net|) * 100
  const uncertaintyCalculations = useMemo(() => {
    let sumVariance = 0;
    const categoryDetails = categories.map((cat) => {
      const emissionValue = emissionValues[cat.id as keyof typeof emissionValues] || 0;
      const uFraction = cat.uncertaintyPercent / 100;
      // Absolute uncertainty standard deviation equivalent (tCO2e)
      const absUncertainty = Math.abs(emissionValue) * uFraction;
      const variance = absUncertainty * absUncertainty;
      sumVariance += variance;

      return {
        ...cat,
        emissionValue,
        absUncertainty,
        variance,
        lowerBound: emissionValue - absUncertainty,
        upperBound: emissionValue + absUncertainty,
      };
    });

    const totalSigma = Math.sqrt(sumVariance);
    const netEmissions = results.totalNetEmissions;
    const grossEmissions = results.totalGrossEmissions;

    // Weighted percentage uncertainty on final Net CO2e
    const netUncertaintyPercent = netEmissions !== 0 ? (totalSigma / Math.abs(netEmissions)) * 100 : 0;
    const grossUncertaintyPercent = grossEmissions !== 0 ? (totalSigma / Math.abs(grossEmissions)) * 100 : 0;

    // Net emissions absolute range [min, max]
    const netLower = Math.max(0, netEmissions - totalSigma);
    const netUpper = netEmissions + totalSigma;

    // Net CPO Intensity range
    const cpoTon = results.totalCpoProducedTon || 1;
    const intensityBaseline = results.netGhgPerTonCpo;
    const intensityLower = netLower / cpoTon;
    const intensityUpper = netUpper / cpoTon;
    const intensityDelta = intensityBaseline * (netUncertaintyPercent / 100);

    // Calculate Variance Contribution (% of total variance contributed by each category)
    const categorizedWithContribution = categoryDetails.map((c) => ({
      ...c,
      varianceContributionPercent: sumVariance > 0 ? (c.variance / sumVariance) * 100 : 0,
    }));

    // Sort by largest variance contributor (Pareto analysis)
    const sortedContributors = [...categorizedWithContribution].sort(
      (a, b) => b.varianceContributionPercent - a.varianceContributionPercent
    );

    // Overall Data Quality Grade
    let gradeLabel = 'Grade A (High Confidence)';
    let gradeBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700';
    let auditReadiness = 'Ready for RSPO & GHG Protocol Third-Party Verification with Minimal Findings';

    if (netUncertaintyPercent < 8.0) {
      gradeLabel = 'Grade A+ (Superior Confidence)';
      gradeBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300';
      auditReadiness = 'Fully automated SCADA & Tier 3 empirical records. Top quartile audit assurance.';
    } else if (netUncertaintyPercent <= 15.0) {
      gradeLabel = 'Grade A (High Assurance)';
      gradeBadgeColor = 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300';
      auditReadiness = 'Complies with RSPO PalmGHG V5 mandatory guidelines. Low audit verification risk.';
    } else if (netUncertaintyPercent <= 25.0) {
      gradeLabel = 'Grade B (Acceptable)';
      gradeBadgeColor = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300';
      auditReadiness = 'Acceptable for annual monitoring, but CB auditors may issue minor remarks on Scope 3 proxies.';
    } else {
      gradeLabel = 'Grade C (Screening Uncertainty)';
      gradeBadgeColor = 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300';
      auditReadiness = 'High uncertainty band (±' + netUncertaintyPercent.toFixed(1) + '%). Requires primary field sampling.';
    }

    return {
      categoryDetails: categorizedWithContribution,
      sortedContributors,
      totalSigma,
      netUncertaintyPercent,
      grossUncertaintyPercent,
      netLower,
      netUpper,
      intensityBaseline,
      intensityLower,
      intensityUpper,
      intensityDelta,
      gradeLabel,
      gradeBadgeColor,
      auditReadiness,
    };
  }, [categories, emissionValues, results]);

  // Copy formal audit uncertainty propagation note
  const handleCopyAuditSummary = () => {
    const text = `RSPO PALMGHG V5 UNCERTAINTY & DATA CONFIDENCE REPORT
Scenario: ${scenarioLabel}
Standard: IPCC 2006 Vol 1 Ch 3 / RSPO-GUI-T04-001 V5 IND
----------------------------------------------------------------------
Baseline Net GHG: ${results.totalNetEmissions.toFixed(1)} tCO2e
Overall Inventory Uncertainty: ±${uncertaintyCalculations.netUncertaintyPercent.toFixed(1)}% (95% Confidence Interval)
Absolute Net GHG Range: [${uncertaintyCalculations.netLower.toFixed(0)} - ${uncertaintyCalculations.netUpper.toFixed(0)}] tCO2e
CPO Net Intensity Range: [${uncertaintyCalculations.intensityLower.toFixed(2)} - ${uncertaintyCalculations.intensityUpper.toFixed(2)}] tCO2e/t CPO (Base: ${results.netGhgPerTonCpo.toFixed(2)})
Assurance Grade: ${uncertaintyCalculations.gradeLabel}

TOP VARIANCE CONTRIBUTORS (UNCERTAINTY DRIVERS):
${uncertaintyCalculations.sortedContributors
  .slice(0, 4)
  .map(
    (c, i) =>
      `${i + 1}. ${c.name}: ${c.varianceContributionPercent.toFixed(1)}% variance contribution (±${c.uncertaintyPercent}% confidence, base: ${c.emissionValue.toFixed(0)} tCO2e)`
  )
  .join('\n')}

Audit Verification Statement:
${uncertaintyCalculations.auditReadiness}`;

    navigator.clipboard.writeText(text);
    setCopiedAuditSummary(true);
    setTimeout(() => setCopiedAuditSummary(false), 2500);
  };

  const fmt = (num: number, decimals: number = 1) =>
    num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-400 mt-0.5 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400">
                  Data Quality & Uncertainty Engine
                </span>
                <span className="text-xs text-neutral-300 dark:text-neutral-700">·</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  IPCC Approach 1 Error Propagation / RSPO V5
                </span>
              </div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                Uncertainty & Data Confidence Analysis (± Range)
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Assign data confidence levels (High, Medium, Low) to each major GHG input category to calculate the mathematically propagated 95% confidence interval for final CO₂e emissions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAuditSummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors shadow-xs"
              title="Copy audit-ready summary to clipboard"
            >
              {copiedAuditSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Audit Note</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AUDIT PRESET SELECTOR STRIP */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Audit Data Confidence Presets:
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleApplyPreset('high_assurance')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedPreset === 'high_assurance'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 border border-neutral-200 dark:border-neutral-600'
              }`}
            >
              Full Digital SCADA (High ±5%)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('standard_rspo')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedPreset === 'standard_rspo'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 border border-neutral-200 dark:border-neutral-600'
              }`}
            >
              Standard RSPO Audit (Mixed Tiers)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('tier1_screening')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedPreset === 'tier1_screening'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 border border-neutral-200 dark:border-neutral-600'
              }`}
            >
              Conservative Screening (Tier 1 Defaults)
            </button>
            {selectedPreset === 'custom' && (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                Custom User Tuned
              </span>
            )}
          </div>
        </div>
      </div>

      {/* PROPAGATION SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: OVERALL WEIGHTED UNCERTAINTY PERCENTAGE */}
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
              <span>Overall Inventory Uncertainty</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${uncertaintyCalculations.gradeBadgeColor}`}>
                {uncertaintyCalculations.gradeLabel}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                ±{uncertaintyCalculations.netUncertaintyPercent.toFixed(1)}%
              </span>
              <span className="text-xs text-neutral-500 font-medium">at 95% CI</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Absolute uncertainty: <strong>±{fmt(uncertaintyCalculations.totalSigma, 0)} tCO₂e</strong>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-500">
            IPCC Approach 1 Quadrature Summation
          </div>
        </div>

        {/* KPI 2: NET GHG EMISSIONS RANGE */}
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
              <span>Net GHG 95% CI Range</span>
              <span className="text-[10px] text-emerald-600 font-bold">Total Inventory</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {fmt(uncertaintyCalculations.netLower, 0)} – {fmt(uncertaintyCalculations.netUpper, 0)}
              </span>
              <span className="text-xs text-neutral-500 font-medium">tCO₂e</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 flex items-center justify-between">
              <span>Reported Baseline:</span>
              <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                {fmt(results.totalNetEmissions, 0)} tCO₂e
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-500">
            Min: {fmt(uncertaintyCalculations.netLower, 0)} | Max: {fmt(uncertaintyCalculations.netUpper, 0)} t
          </div>
        </div>

        {/* KPI 3: CPO EMISSION INTENSITY RANGE */}
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
              <span>CPO Intensity Range</span>
              <span className="text-[10px] text-blue-600 font-bold">Per Ton CPO</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {uncertaintyCalculations.intensityLower.toFixed(2)} – {uncertaintyCalculations.intensityUpper.toFixed(2)}
              </span>
              <span className="text-xs text-neutral-500 font-medium">tCO₂e/t</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 flex items-center justify-between">
              <span>Verified Base:</span>
              <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                {results.netGhgPerTonCpo.toFixed(2)} tCO₂e/t CPO
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-500">
            Variance: ±{uncertaintyCalculations.intensityDelta.toFixed(2)} tCO₂e/t CPO
          </div>
        </div>

        {/* KPI 4: AUDIT READINESS & TOP VARIANCE DRIVER */}
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
              <span>Primary Uncertainty Driver</span>
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="mt-2">
              <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate" title={uncertaintyCalculations.sortedContributors[0]?.name}>
                {uncertaintyCalculations.sortedContributors[0]?.name}
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                  {uncertaintyCalculations.sortedContributors[0]?.varianceContributionPercent.toFixed(1)}%
                </span>
                <span className="text-[11px] text-neutral-500">of total inventory variance</span>
              </div>
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 line-clamp-1">
              Tier: {uncertaintyCalculations.sortedContributors[0]?.confidenceTier.toUpperCase()} (±{uncertaintyCalculations.sortedContributors[0]?.uncertaintyPercent}%)
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-500 truncate" title={uncertaintyCalculations.auditReadiness}>
            {uncertaintyCalculations.auditReadiness}
          </div>
        </div>
      </div>

      {/* CONFIDENCE INTERVAL VISUALIZER (ERROR BAR GRAPH) */}
      <div className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <span>95% Confidence Interval Error Bars & Inventory Range Visualizer</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Visualizing the central point estimate alongside the mathematically propagated lower and upper bounds.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
            Gaussian 95% Confidence (k = 1.96)
          </span>
        </div>

        {/* Visual Bar 1: Total Net Inventory Range */}
        <div className="space-y-2 p-3.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-800 dark:text-neutral-200">
              Total Net GHG Inventory Range (tCO₂e)
            </span>
            <span className="font-mono text-neutral-600 dark:text-neutral-400">
              ±{uncertaintyCalculations.netUncertaintyPercent.toFixed(1)}% ({fmt(uncertaintyCalculations.netLower, 0)} to {fmt(uncertaintyCalculations.netUpper, 0)} t)
            </span>
          </div>

          {/* Graphical Error Range Bar */}
          <div className="relative h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden flex items-center px-4">
            {/* Background 95% CI Range Span */}
            <div
              className="absolute h-6 rounded bg-blue-200 dark:bg-blue-900/60 border border-blue-400 dark:border-blue-600 flex items-center justify-between px-2"
              style={{
                left: '10%',
                right: '10%',
              }}
            >
              <span className="text-[10px] font-mono font-bold text-blue-800 dark:text-blue-300">
                Lower: {fmt(uncertaintyCalculations.netLower, 0)}
              </span>
              <span className="text-[10px] font-mono font-bold text-blue-800 dark:text-blue-300">
                Upper: {fmt(uncertaintyCalculations.netUpper, 0)}
              </span>
            </div>

            {/* Baseline Center Marker */}
            <div
              className="absolute top-1 bottom-1 w-1 bg-blue-700 dark:bg-blue-400 rounded-full shadow z-10"
              style={{ left: '50%' }}
            />
            {/* Center Label Pill */}
            <div
              className="absolute z-20 px-2 py-0.5 bg-neutral-900 text-white rounded text-[10px] font-mono font-bold shadow transform -translate-x-1/2"
              style={{ left: '50%' }}
            >
              Base: {fmt(results.totalNetEmissions, 0)} tCO₂e
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-neutral-500 font-mono pt-1">
            <span>-95% CI Limit: {fmt(uncertaintyCalculations.netLower, 0)} tCO₂e</span>
            <span className="text-neutral-700 dark:text-neutral-300 font-bold">Propagated Uncertainty: ±{uncertaintyCalculations.netUncertaintyPercent.toFixed(1)}%</span>
            <span>+95% CI Limit: {fmt(uncertaintyCalculations.netUpper, 0)} tCO₂e</span>
          </div>
        </div>

        {/* Visual Bar 2: CPO Intensity Range */}
        <div className="space-y-2 p-3.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-800 dark:text-neutral-200">
              CPO Intensity Range (tCO₂e / Ton CPO)
            </span>
            <span className="font-mono text-neutral-600 dark:text-neutral-400">
              [{uncertaintyCalculations.intensityLower.toFixed(2)} – {uncertaintyCalculations.intensityUpper.toFixed(2)} tCO₂e/t CPO]
            </span>
          </div>

          <div className="relative h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden flex items-center px-4">
            <div
              className="absolute h-6 rounded bg-emerald-200 dark:bg-emerald-900/60 border border-emerald-400 dark:border-emerald-600 flex items-center justify-between px-2"
              style={{
                left: '12%',
                right: '12%',
              }}
            >
              <span className="text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-300">
                {uncertaintyCalculations.intensityLower.toFixed(2)}
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-300">
                {uncertaintyCalculations.intensityUpper.toFixed(2)}
              </span>
            </div>

            <div
              className="absolute top-1 bottom-1 w-1 bg-emerald-700 dark:bg-emerald-400 rounded-full shadow z-10"
              style={{ left: '50%' }}
            />
            <div
              className="absolute z-20 px-2 py-0.5 bg-emerald-900 text-white rounded text-[10px] font-mono font-bold shadow transform -translate-x-1/2"
              style={{ left: '50%' }}
            >
              Baseline: {results.netGhgPerTonCpo.toFixed(2)} tCO₂e/t
            </div>
          </div>
        </div>
      </div>

      {/* PARETO VARIANCE CONTRIBUTION RANKING */}
      <div className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Variance Decomposition: Which Categories Drive Total Uncertainty?</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Identifies which GHG categories contribute most to the variance σ² (calculated as (U_i × E_i)² / Σ(U_j × E_j)²).
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-neutral-500">
            Ranked by % Variance
          </span>
        </div>

        <div className="space-y-3">
          {uncertaintyCalculations.sortedContributors.map((c, index) => {
            const isTopDriver = index === 0;
            return (
              <div
                key={c.id}
                className={`p-3 rounded-xl border transition-all ${
                  isTopDriver
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                    : 'bg-neutral-50/50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      isTopDriver ? 'bg-amber-500 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">
                      {c.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {c.subCategory}
                    </span>
                    {isTopDriver && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-white">
                        Largest Uncertainty Driver
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Base: <strong>{fmt(c.emissionValue, 0)} t</strong>
                    </span>
                    <span className="text-neutral-600 dark:text-neutral-400">
                      ±{c.uncertaintyPercent}% (±{fmt(c.absUncertainty, 0)} t)
                    </span>
                    <span className="font-bold text-purple-700 dark:text-purple-400">
                      {c.varianceContributionPercent.toFixed(1)}% variance
                    </span>
                  </div>
                </div>

                {/* Progress bar representing variance contribution */}
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTopDriver
                        ? 'bg-amber-500'
                        : c.varianceContributionPercent > 20
                        ? 'bg-purple-600'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(1, c.varianceContributionPercent))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-1">
                  <span>Emission Factor Tier: {c.emissionFactorTier}</span>
                  <span className="italic">{c.auditMitigationRecommendation}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DETAILED CATEGORY CONFIDENCE LEVEL ASSIGNMENT TABLE */}
      <div className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Input Category Confidence Level Assignment</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Select High (±5%), Medium (±15%), or Low (±30%) confidence, or adjust slider to reflect empirical RSPO audit evidence.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" /> High: ±5%
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 ml-2" /> Medium: ±15%
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 ml-2" /> Low: ±30%
          </div>
        </div>

        <div className="space-y-3">
          {categories.map((cat) => {
            const emissionValue = emissionValues[cat.id as keyof typeof emissionValues] || 0;
            const uFraction = cat.uncertaintyPercent / 100;
            const absUncertainty = Math.abs(emissionValue) * uFraction;
            const isExpanded = expandedCategoryId === cat.id;

            return (
              <div
                key={cat.id}
                className="p-3.5 bg-neutral-50/70 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700/80 space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Category Details */}
                  <div className="space-y-0.5 min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {cat.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                        {cat.scopeLabel}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      Baseline: <strong className="text-neutral-800 dark:text-neutral-200">{fmt(emissionValue, 0)} tCO₂e</strong> · Uncertainty: <strong className="text-blue-600 dark:text-blue-400">±{fmt(absUncertainty, 0)} t</strong>
                    </div>
                  </div>

                  {/* Confidence Tier Selector Buttons */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white dark:bg-neutral-700 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-600 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleTierChange(cat.id, 'high')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                          cat.confidenceTier === 'high'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600'
                        }`}
                      >
                        High (±5%)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTierChange(cat.id, 'medium')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                          cat.confidenceTier === 'medium'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600'
                        }`}
                      >
                        Medium (±15%)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTierChange(cat.id, 'low')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                          cat.confidenceTier === 'low'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600'
                        }`}
                      >
                        Low (±30%)
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedCategoryId(isExpanded ? null : cat.id)}
                      className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      title="Toggle detailed data sources & mitigation advice"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Range Slider for Fine-Tuning */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[11px] text-neutral-500 shrink-0 font-medium">
                    Adjust ±%:
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={cat.uncertaintyPercent}
                    onChange={(e) => handlePercentChange(cat.id, Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer accent-blue-600"
                  />
                  <span className="text-xs font-mono font-bold w-12 text-right text-blue-600 dark:text-blue-400">
                    ±{cat.uncertaintyPercent}%
                  </span>
                </div>

                {/* Collapsible Audit Evidence Details */}
                {isExpanded && (
                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                    <div className="flex items-start gap-2">
                      <strong className="text-neutral-900 dark:text-neutral-100 shrink-0">Activity Data:</strong>
                      <span>{cat.activityDataSource}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <strong className="text-neutral-900 dark:text-neutral-100 shrink-0">EF Quality:</strong>
                      <span className="font-mono">{cat.emissionFactorTier}</span>
                    </div>
                    <div className="flex items-start gap-2 text-emerald-700 dark:text-emerald-400">
                      <strong className="shrink-0">Audit Action to Tighten Range:</strong>
                      <span>{cat.auditMitigationRecommendation}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* METHODOLOGY & AUDIT GUIDANCE FOOTER */}
      <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/60 text-xs text-neutral-700 dark:text-neutral-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300">
          <Info className="w-4 h-4 text-blue-600" />
          <span>IPCC Tier 1 Error Propagation Methodology & RSPO Audit Guidance</span>
        </div>
        <p className="leading-relaxed">
          In accordance with <strong>IPCC Guidelines for National Greenhouse Gas Inventories (Volume 1, Chapter 3)</strong> and <strong>RSPO PalmGHG Version 5</strong>, combined uncertainty is computed through standard error propagation under the assumption of uncorrelated category errors. Where activities are dominated by Scope 3 third-party smallholders or unmetered open lagoons, total inventory uncertainty typically widens to ±15–30%. Upgrading to continuous biogas metering and digital piezometers enables operations to reach <strong>Grade A+ Assurance (±&lt;8%)</strong>.
        </p>
      </div>
    </div>
  );
};
