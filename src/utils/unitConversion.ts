/**
 * RSPO PalmGHG Unit Conversion Utilities
 * Handles seamless switching between Metric (Tonnes / MT) and Imperial (US Short Tons)
 * 1 Metric Tonne (MT) = 1,000 kg = 1.10231131 US Short Tons (2,000 lbs)
 * 1 US Short Ton = 0.90718474 Metric Tonnes
 */

export type MassUnit = 'metric' | 'imperial';

export const TONNE_TO_SHORT_TON = 1.10231131;
export const SHORT_TON_TO_TONNE = 0.90718474;

/**
 * Converts metric tonnes (internal calculation standard) to the active display unit
 */
export function toDisplayTons(metricTonnes: number, unit: MassUnit, decimals: number = 2): number {
  if (isNaN(metricTonnes)) return 0;
  if (unit === 'imperial') {
    return Number((metricTonnes * TONNE_TO_SHORT_TON).toFixed(decimals));
  }
  return metricTonnes;
}

/**
 * Converts user input from active display unit back to metric tonnes
 */
export function fromInputTons(inputVal: number, unit: MassUnit): number {
  if (isNaN(inputVal)) return 0;
  if (unit === 'imperial') {
    return Number((inputVal * SHORT_TON_TO_TONNE).toFixed(4));
  }
  return inputVal;
}

export function getUnitLabel(unit: MassUnit): string {
  return unit === 'imperial' ? 'Short Tons' : 'Tonnes';
}

export function getUnitSuffix(unit: MassUnit): string {
  return unit === 'imperial' ? 'tn' : 't';
}
