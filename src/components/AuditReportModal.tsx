import React, { useState } from 'react';
import {
  EstateParameters,
  MillParameters,
  FFBSourceAllocation,
  PalmGHGAssessmentResults,
} from '../types/palmghg';
import {
  X,
  Printer,
  Download,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building,
  Award,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { generateAuditReportPdf } from '../utils/generateAuditReportPdf';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  estate: EstateParameters;
  mill: MillParameters;
  ffbSources: FFBSourceAllocation[];
  results: PalmGHGAssessmentResults;
  assessmentYear: number;
  uocName: string;
}

export const AuditReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  estate,
  mill,
  ffbSources,
  results,
  assessmentYear,
  uocName,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const fmt = (val: number, decimals: number = 2) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    try {
      setIsExportingPdf(true);
      setPdfSuccessMessage(null);
      setTimeout(() => {
        try {
          generateAuditReportPdf({
            estate,
            mill,
            ffbSources,
            results,
            assessmentYear,
            uocName,
          });
          setIsExportingPdf(false);
          setPdfSuccessMessage(
            `Dokumen PDF RSPO PalmGHG V5 (${assessmentYear}) siap regulasi berhasil diunduh.`
          );
          setTimeout(() => setPdfSuccessMessage(null), 6000);
        } catch (innerErr) {
          console.error('Gagal membuat file PDF:', innerErr);
          setIsExportingPdf(false);
        }
      }, 100);
    } catch (err) {
      console.error('Gagal memproses ekspor PDF:', err);
      setIsExportingPdf(false);
    }
  };

  const handleDownloadCsv = () => {
    const csvRows = [
      ['RSPO PalmGHG Version 5 Verification Assessment Report'],
      ['Unit of Certification (UoC)', uocName],
      ['Assessment Period / Reporting Year', assessmentYear.toString()],
      ['Standard Alignment', 'RSPO PalmGHG V5 / GHG Protocol LSR Standard v1.1'],
      [''],
      ['SUMMARY PERFORMANCE METRICS'],
      ['Metric', 'Value', 'Unit'],
      ['Net GHG Emissions per Ton CPO', fmt(results.netGhgPerTonCpo, 3), 'tCO2e / t CPO'],
      ['Gross GHG Emissions per Ton CPO', fmt(results.grossGhgPerTonCpo, 3), 'tCO2e / t CPO'],
      ['Net GHG Emissions per Ton FFB', fmt(results.netGhgPerTonFfb, 4), 'tCO2e / t FFB'],
      ['Total FFB Processed', results.totalFfbProcessedTon.toString(), 'Ton'],
      ['Total CPO Produced', results.totalCpoProducedTon.toString(), 'Ton'],
      ['Total Gross GHG Emissions', fmt(results.totalGrossEmissions, 1), 'tCO2e'],
      ['Total Carbon Removals (LSR)', fmt(results.totalCarbonRemovals, 1), 'tCO2e'],
      ['Total Emissions Avoided', fmt(results.totalEmissionsAvoided, 1), 'tCO2e'],
      ['Total Net GHG Emissions', fmt(results.totalNetEmissions, 1), 'tCO2e'],
      ['Total Biogenic Carbon (Optional)', fmt(results.totalBiogenicCarbon, 1), 'tCO2e'],
      [''],
      ['INVENTORY BREAKDOWN BY SCOPE & CATEGORY'],
      ['Category', 'Scope Classification', 'Activity', 'Emissions (tCO2e/yr)'],
      ['Estate', 'Scope 1', 'Estate Fuel (Stationary)', fmt(results.estateScope1FuelStationary, 1)],
      ['Estate', 'Scope 1', 'Estate Fuel (Mobile)', fmt(results.estateScope1FuelMobile, 1)],
      ['Estate', 'Scope 1', 'Fertiliser Application (Field N2O)', fmt(results.estateScope1FertiliserApp, 1)],
      ['Estate', 'Scope 1', 'Peat Soil Drainage & Oxidation', fmt(results.estateScope1Peat, 1)],
      ['Estate', 'Scope 1', 'Land Use Change (Linear 25-yr Amortisation)', fmt(results.estateScope1LucAmortised, 1)],
      ['Estate', 'Scope 1', 'Land Management (Cropland to Oil Palm)', fmt(results.estateScope1LandManagement, 1)],
      ['Estate', 'Scope 2', 'Estate Grid Electricity Consumption', fmt(results.estateScope2GridElectricity, 1)],
      ['Estate', 'Scope 3 Cat 1', 'Fertiliser Manufacturing', fmt(results.estateScope3Cat1FertiliserMfg, 1)],
      ['Estate', 'Scope 3 Cat 3', 'Estate Fuel Upstream (WTT)', fmt(results.estateScope3Cat3FuelWtt, 1)],
      ['Estate', 'Scope 3 Cat 3', 'Upstream Purchased Electricity', fmt(results.estateScope3Cat3ElectricityUpstream, 1)],
      ['Estate', 'Scope 3 Cat 4', 'Fertiliser Upstream Transport', fmt(results.estateScope3Cat4FertiliserTransport, 1)],
      ['Estate', 'Optional Removal', 'Existing Crop Sequestration', `-${fmt(results.estateRemovalExistingCropSeq, 1)}`],
      ['Estate', 'Optional Removal', 'Standing Retired Oil Palm (>25y)', `-${fmt(results.estateRemovalStandingPalmSeq, 1)}`],
      ['Estate', 'Optional Removal', 'HCV Forest Conservation', `-${fmt(results.estateRemovalForestConservation, 1)}`],
      ['Estate', 'Optional Removal', 'Non-Forest Conservation', `-${fmt(results.estateRemovalNonForestConservation, 1)}`],
      ['Estate', 'Optional Removal', 'Peatland Conservation', `-${fmt(results.estateRemovalPeatlandConservation, 1)}`],
      ['Estate', 'Optional Biogenic', 'Estate Fuel Biogenic Carbon (B35/B40)', fmt(results.estateBiogenicFuelCarbon, 1)],
      ['Mill', 'Scope 1', 'POME Open Lagoon Methane', fmt(results.millScope1PomeLagoon, 1)],
      ['Mill', 'Scope 1', 'POME Uncombusted Methane Slip', fmt(results.millScope1PomeMethaneUncombusted, 1)],
      ['Mill', 'Scope 1', 'Mill Fuel (Stationary Combustion)', fmt(results.millScope1FuelStationary, 1)],
      ['Mill', 'Scope 1', 'Mill Fuel (Mobile Combustion)', fmt(results.millScope1FuelMobile, 1)],
      ['Mill', 'Scope 2', 'Mill Grid Electricity Use', fmt(results.millScope2GridElectricity, 1)],
      ['Mill', 'Scope 3 Cat 1', 'Purchase of 3rd Party FFB', fmt(results.millScope3Cat1PurchasedFfb, 1)],
      ['Mill', 'Scope 3 Cat 3', 'Mill Fuel Upstream (WTT)', fmt(results.millScope3Cat3FuelWtt, 1)],
      ['Mill', 'Scope 3 Cat 3', 'Upstream Mill Grid Electricity', fmt(results.millScope3Cat3ElectricityUpstream, 1)],
      ['Mill', 'Scope 3 Cat 4', 'Transport of 3rd Party FFB', fmt(results.millScope3Cat4FfbTransport, 1)],
      ['Mill', 'Optional Avoided', 'Mill Excess Electricity Export', `-${fmt(results.millAvoidedGridElectricityExport, 1)}`],
      ['Mill', 'Optional Avoided', 'Biomass Export (PKS, EFB, Mesocarp Fibre)', `-${fmt(results.millAvoidedBiomassExport, 1)}`],
      ['Mill', 'Optional Biogenic', 'Mill Boiler Biomass Combustion', fmt(results.millBiogenicBoilerCarbon, 1)],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RSPO_PalmGHG_V5_Report_${uocName.replace(/\s+/g, '_')}_${assessmentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="printable-audit-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="printable-audit-card"
        className="bg-white dark:bg-neutral-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 my-8 overflow-hidden"
      >
        
        {/* Top Control Bar (Non-printed) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/80 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                RSPO GHG Verifier Assessment Summary Report (PalmGHG V5)
              </h3>
              <p className="text-[11px] text-neutral-500">
                Laporan inventarisasi emisi dan serapan siap cetak & ekspor PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Download CSV */}
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              title="Unduh data tabular dalam format CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            {/* Direct Vector PDF Download */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-75 rounded-lg shadow-xs transition-all whitespace-nowrap"
              title="Ekspor dokumen laporan audit verifikasi PalmGHG V5 (A4 3-halaman untuk submission regulasi)"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Membuat PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ekspor PDF Regulasi</span>
                  <span className="hidden md:inline-block text-[10px] bg-emerald-800/80 px-1.5 py-0.2 rounded font-mono">
                    LSR v1.1
                  </span>
                </>
              )}
            </button>

            {/* Print / Save to PDF */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-lg transition-colors whitespace-nowrap"
              title="Buka dialog browser untuk Cetak atau Simpan sebagai PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors ml-1"
              aria-label="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Export Success / Status Notification Banner */}
        {pdfSuccessMessage && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between no-print animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{pdfSuccessMessage}</span>
            </div>
            <button
              onClick={() => setPdfSuccessMessage(null)}
              className="p-1 rounded text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200"
              aria-label="Tutup notifikasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Printable Report Document Body */}
        <div className="p-8 space-y-6 text-neutral-900 dark:text-neutral-100 printable-report max-h-[80vh] overflow-y-auto">
          
          {/* Official Letterhead */}
          <div className="flex items-start justify-between pb-6 border-b-2 border-neutral-800 dark:border-neutral-200">
            <div>
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest">
                <Award className="w-4 h-4" />
                <span>Roundtable on Sustainable Palm Oil (RSPO)</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight mt-1 text-neutral-900 dark:text-neutral-100">
                PalmGHG Version 5 Verification Assessment Report
              </h1>
              <p className="text-xs text-neutral-500 mt-1">
                Conducted in full compliance with GHG Protocol Land Sector and Removals (LSR) Standard v1.1.
              </p>
            </div>

            <div className="text-right text-xs space-y-1">
              <div className="font-semibold text-neutral-800 dark:text-neutral-200">{uocName}</div>
              <div className="text-neutral-500">Reporting Year: {assessmentYear}</div>
              <div className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center justify-end gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified PalmGHG V5 Engine</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Banner */}
          <div className="grid grid-cols-4 gap-4 p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
            <div>
              <div className="text-[11px] font-medium text-neutral-500">Net Carbon Intensity</div>
              <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {fmt(results.netGhgPerTonCpo, 3)}
              </div>
              <div className="text-[10px] text-neutral-500">tCO₂e / Ton CPO</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-neutral-500">Total FFB Processed</div>
              <div className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {results.totalFfbProcessedTon.toLocaleString()}
              </div>
              <div className="text-[10px] text-neutral-500">Ton FFB / Year</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-neutral-500">Total Net Emissions</div>
              <div className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {fmt(results.totalNetEmissions, 0)}
              </div>
              <div className="text-[10px] text-neutral-500">tCO₂e / Year</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-neutral-500">Total Carbon Removals</div>
              <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">
                -{fmt(results.totalCarbonRemovals, 0)}
              </div>
              <div className="text-[10px] text-neutral-500">tCO₂e / Year (LSR)</div>
            </div>
          </div>

          {/* Operational Boundaries Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
              1. FFB Supply Base & Operational Control Breakdown
            </h3>
            <table className="w-full text-xs text-left border border-neutral-200 dark:border-neutral-700">
              <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="p-2">Supply Component</th>
                  <th className="p-2 text-right">FFB Volume (t)</th>
                  <th className="p-2 text-right">Share (%)</th>
                  <th className="p-2">PalmGHG V5 Scope Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                <tr>
                  <td className="p-2 font-medium">Own Plantation (Directly Managed within UoC)</td>
                  <td className="p-2 text-right font-mono">{results.ownFfbTon.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono">
                    {results.totalFfbProcessedTon > 0 ? ((results.ownFfbTon / results.totalFfbProcessedTon) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="p-2 text-emerald-700 font-semibold">Scope 1 (Direct) & Scope 2</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Group Plantation (Within UoC - Managed)</td>
                  <td className="p-2 text-right font-mono">{results.groupWithinUocFfbTon.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono">
                    {results.totalFfbProcessedTon > 0 ? ((results.groupWithinUocFfbTon / results.totalFfbProcessedTon) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="p-2 text-emerald-700 font-semibold">Scope 1 & Scope 2</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Third Party Independent Smallholders & Dealers</td>
                  <td className="p-2 text-right font-mono">{results.thirdPartyFfbTon.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono">
                    {results.totalFfbProcessedTon > 0 ? ((results.thirdPartyFfbTon / results.totalFfbProcessedTon) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="p-2 text-sky-700 font-semibold">Scope 3 (Cat 1: Purchase + Cat 4: Transport)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Full Scope 1, 2, 3 Inventory Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
              2. Formal RSPO PalmGHG V5 Assessment Results
            </h3>
            <table className="w-full text-xs text-left border border-neutral-200 dark:border-neutral-700">
              <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="p-2">Inventory Item</th>
                  <th className="p-2">Scope</th>
                  <th className="p-2">GHG Protocol LSR Alignment</th>
                  <th className="p-2 text-right">Emissions (tCO₂e)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {/* Scope 1 */}
                <tr className="bg-amber-50/30 dark:bg-amber-950/20 font-semibold">
                  <td colSpan={3} className="p-2 text-amber-900 dark:text-amber-300">
                    Scope 1: Direct GHG Emissions (Own & Directly Managed Operations)
                  </td>
                  <td className="p-2 text-right font-mono text-amber-900 dark:text-amber-300">
                    {fmt(results.totalScope1, 1)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 pl-4">• Estate Fuel Combustion (Stationary & Mobile)</td>
                  <td className="p-2 text-neutral-500">Scope 1</td>
                  <td className="p-2 text-neutral-500">Fossil fraction (biogenic reported separately)</td>
                  <td className="p-2 text-right font-mono">{fmt(results.estateScope1FuelStationary + results.estateScope1FuelMobile, 1)}</td>
                </tr>
                <tr>
                  <td className="p-2 pl-4">• Fertiliser Soil Application (Direct & Indirect N₂O)</td>
                  <td className="p-2 text-neutral-500">Scope 1</td>
                  <td className="p-2 text-neutral-500">Includes NI/UI inhibitor reductions & recycled organics</td>
                  <td className="p-2 text-right font-mono">{fmt(results.estateScope1FertiliserApp, 1)}</td>
                </tr>
                <tr>
                  <td className="p-2 pl-4">• Peat Soil Drainage & Oxidation</td>
                  <td className="p-2 text-neutral-500">Scope 1</td>
                  <td className="p-2 text-neutral-500">Peat drainage emissions factor (54.6 tCO₂e/ha/yr)</td>
                  <td className="p-2 text-right font-mono">{fmt(results.estateScope1Peat, 1)}</td>
                </tr>
                <tr>
                  <td className="p-2 pl-4">• Land Use Change (Linear 25-Year Amortisation)</td>
                  <td className="p-2 text-neutral-500">Scope 1</td>
                  <td className="p-2 text-neutral-500">LSR v1.1 linear amortisation (Gross, un-netted)</td>
                  <td className="p-2 text-right font-mono">{fmt(results.estateScope1LucAmortised, 1)}</td>
                </tr>
                <tr>
                  <td className="p-2 pl-4">• Land Management (Cropland to Oil Palm)</td>
                  <td className="p-2 text-neutral-500">Scope 1</td>
                  <td className="p-2 text-neutral-500">Soil organic carbon transitions</td>
                  <td className="p-2 text-right font-mono">{fmt(results.estateScope1LandManagement, 1)}</td>
                </tr>
                <tr>
                  <td className="p-2 pl-4">• POME Wastewater Treatment (Lagoon & Methane Slip)</td>
                  <td className="p-2 text-neutral-500">Scope 1</td>
                  <td className="p-2 text-neutral-500">Volumetric m³ & COD inlet WWTP accounting</td>
                  <td className="p-2 text-right font-mono">{fmt(results.millScope1PomeLagoon + results.millScope1PomeMethaneUncombusted, 1)}</td>
                </tr>
                <tr>
                  <td className="p-2 pl-4">• Mill Auxiliary Fuel Combustion (Stationary & Mobile)</td>
                  <td className="p-2 text-neutral-500">Scope 1</td>
                  <td className="p-2 text-neutral-500">FFB milling only (PK crushing excluded)</td>
                  <td className="p-2 text-right font-mono">{fmt(results.millScope1FuelStationary + results.millScope1FuelMobile, 1)}</td>
                </tr>

                {/* Scope 2 */}
                <tr className="bg-emerald-50/30 dark:bg-emerald-950/20 font-semibold">
                  <td colSpan={3} className="p-2 text-emerald-900 dark:text-emerald-300">
                    Scope 2: Indirect Emissions from Purchased Electricity
                  </td>
                  <td className="p-2 text-right font-mono text-emerald-900 dark:text-emerald-300">
                    {fmt(results.totalScope2, 1)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 pl-4">• Estate Grid Electricity Use</td>
                  <td className="p-2 text-neutral-500">Scope 2</td>
                  <td className="p-2 text-neutral-500">Residential compounds, workshops, offices [NEW]</td>
                  <td className="p-2 text-right font-mono">{fmt(results.estateScope2GridElectricity, 1)}</td>
                </tr>
                <tr>
                  <td className="p-2 pl-4">• Mill Grid Electricity Use</td>
                  <td className="p-2 text-neutral-500">Scope 2</td>
                  <td className="p-2 text-neutral-500">Purchased grid electricity consumed at mill</td>
                  <td className="p-2 text-right font-mono">{fmt(results.millScope2GridElectricity, 1)}</td>
                </tr>

                {/* Scope 3 */}
                <tr className="bg-sky-50/30 dark:bg-sky-950/20 font-semibold">
                  <td colSpan={3} className="p-2 text-sky-900 dark:text-sky-300">
                    Scope 3: Value Chain Indirect Emissions (Cat 1, Cat 3, Cat 4)
                  </td>
                  <td className="p-2 text-right font-mono text-sky-900 dark:text-sky-300">
                    {fmt(results.totalScope3, 1)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 pl-4">• CAT 1: Fertiliser Manufacturing</td>
                  <td className="p-2 text-neutral-500">Scope 3</td>
                  <td className="p-2 text-neutral-500">Embedded chemical synthesis emissions</td>
                  <td className="p-2 text-right font-mono">{fmt(results.estateScope3Cat1FertiliserMfg, 1)}</td>
                </tr>
                <tr>
                  <td className="p-2 pl-4">• CAT 1: Purchase of 3rd Party FFB</td>
                  <td className="p-2 text-neutral-500">Scope 3</td>
                  <td className="p-2 text-neutral-500">External independent smallholder supply</td>
                  <td className="p-2 text-right font-mono">{fmt(results.millScope3Cat1PurchasedFfb, 1)}</td>
                </tr>
                <tr>
                  <td className="p-2 pl-4">• CAT 3: FERA - Upstream Fuel (WTT) & Electricity Losses</td>
                  <td className="p-2 text-neutral-500">Scope 3</td>
                  <td className="p-2 text-neutral-500">Well-to-Tank diesel & grid transmission losses</td>
                  <td className="p-2 text-right font-mono">
                    {fmt(results.estateScope3Cat3FuelWtt + results.estateScope3Cat3ElectricityUpstream + results.millScope3Cat3FuelWtt + results.millScope3Cat3ElectricityUpstream, 1)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 pl-4">• CAT 4: Transportation of Fertilisers & 3rd Party FFB</td>
                  <td className="p-2 text-neutral-500">Scope 3</td>
                  <td className="p-2 text-neutral-500">Upstream freight & trucking</td>
                  <td className="p-2 text-right font-mono">{fmt(results.estateScope3Cat4FertiliserTransport + results.millScope3Cat4FfbTransport, 1)}</td>
                </tr>

                {/* Optional Information */}
                <tr className="bg-teal-50/30 dark:bg-teal-950/20 font-semibold">
                  <td colSpan={3} className="p-2 text-teal-900 dark:text-teal-300">
                    Optional Information: Carbon Removals (LSR) & Emissions Avoided
                  </td>
                  <td className="p-2 text-right font-mono text-teal-900 dark:text-teal-300">
                    -{fmt(results.totalCarbonRemovals + results.totalEmissionsAvoided, 1)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 pl-4">• Crop Sequestration (Existing & Standing Retired Palm {'>'}25y)</td>
                  <td className="p-2 text-emerald-700">Removal</td>
                  <td className="p-2 text-neutral-500">Reported separately under Removals per LSR v1.1</td>
                  <td className="p-2 text-right font-mono text-emerald-700">-{fmt(results.estateRemovalExistingCropSeq + results.estateRemovalStandingPalmSeq, 1)}</td>
                </tr>
                <tr>
                  <td className="p-2 pl-4">• Conservation Areas (Forest, Non-Forest, Peatland)</td>
                  <td className="p-2 text-emerald-700">Removal</td>
                  <td className="p-2 text-neutral-500">Expanded multi-pool conservation accounting</td>
                  <td className="p-2 text-right font-mono text-emerald-700">
                    -{fmt(results.estateRemovalForestConservation + results.estateRemovalNonForestConservation + results.estateRemovalPeatlandConservation, 1)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 pl-4">• Emissions Avoided (Grid Export & Biomass Displacement)</td>
                  <td className="p-2 text-teal-700">Avoided</td>
                  <td className="p-2 text-neutral-500">PKS, EFB, and Mesocarp Fibre power substitution</td>
                  <td className="p-2 text-right font-mono text-teal-700">-{fmt(results.totalMillEmissionsAvoided, 1)}</td>
                </tr>
                <tr>
                  <td className="p-2 pl-4">• Biogenic Carbon (Biofuel & Mill Boiler Combustion)</td>
                  <td className="p-2 text-violet-700">Biogenic</td>
                  <td className="p-2 text-neutral-500">Disclosed separately outside net fossil inventory</td>
                  <td className="p-2 text-right font-mono text-violet-700">{fmt(results.totalBiogenicCarbon, 1)}</td>
                </tr>

                {/* Final Net Line */}
                <tr className="bg-neutral-900 text-white font-bold text-sm">
                  <td colSpan={3} className="p-3">
                    TOTAL NET GHG EMISSIONS (GROSS MINUS REMOVALS & AVOIDED)
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-400">
                    {fmt(results.totalNetEmissions, 1)} tCO₂e
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Verification Sign-off Block */}
          <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700 grid grid-cols-2 gap-8 text-xs print-break-inside-avoid">
            <div>
              <div className="text-neutral-500 mb-6">Prepared by (Sustainability Officer / GHG Lead):</div>
              <div className="border-b border-neutral-400 w-48 mb-1" />
              <div className="font-semibold text-neutral-800 dark:text-neutral-200">Lead Sustainability Verifier</div>
              <div className="text-[10px] text-neutral-500">RSPO PalmGHG Lead Auditor Certification</div>
            </div>

            <div>
              <div className="text-neutral-500 mb-6">Approved & Verified by (Certification Body Auditor):</div>
              <div className="border-b border-neutral-400 w-48 mb-1" />
              <div className="font-semibold text-neutral-800 dark:text-neutral-200">Accredited CB Lead GHG Assessor</div>
              <div className="text-[10px] text-neutral-500">ISO 14064-3 / RSPO GHG Protocol Verifier</div>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer (Non-printed) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/80 no-print">
          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Dokumen resmi diverifikasi sesuai metodologi RSPO PalmGHG V5 & GHG Protocol LSR v1.1.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-75 rounded-lg shadow-xs transition-colors"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Membuat PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ekspor PDF Regulasi (.pdf)</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
