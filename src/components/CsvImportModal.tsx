import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  FileText,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  Sliders,
  Check,
  FileUp,
  Info,
} from 'lucide-react';
import { EstateParameters, MillParameters } from '../types/palmghg';
import {
  generateSampleCsvContent,
  triggerFileDownload,
  parseInventoryCsv,
  CsvParseResult,
  CsvParamDiff,
} from '../utils/csvInventoryHandler';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  estate: EstateParameters;
  mill: MillParameters;
  onApplyInventory: (newEstate: EstateParameters, newMill: MillParameters, summaryText: string) => void;
}

export const CsvImportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  estate,
  mill,
  onApplyInventory,
}) => {
  const [activeInputMode, setActiveInputMode] = useState<'upload' | 'paste'>('upload');
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'changed' | 'estate' | 'mill' | 'issues'>('changed');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse result state
  const parseResult = useMemo<CsvParseResult | null>(() => {
    if (!csvRawText.trim()) return null;
    try {
      return parseInventoryCsv(csvRawText, estate, mill);
    } catch {
      return null;
    }
  }, [csvRawText, estate, mill]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setFileName(file.name);
    setFileSize(file.size);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvRawText(content || '');
      setActiveFilter('changed');
    };
    reader.readAsText(file);
  };

  // Download Sample Template CSV
  const handleDownloadSample = () => {
    const templateContent = generateSampleCsvContent('template');
    triggerFileDownload(templateContent, 'rspo_palmghg_v5_inventory_template.csv');
  };

  // Export current session data as CSV
  const handleExportCurrent = () => {
    const currentContent = generateSampleCsvContent('current', estate, mill);
    triggerFileDownload(currentContent, `rspo_palmghg_v5_inventory_current_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Load a demo pre-filled test dataset (Sustainable Palm Oil Mill & Estate)
  const handleLoadDemoDataset = () => {
    const demoContent = generateSampleCsvContent('template');
    // Modify a few values for realistic demo
    const modified = demoContent
      .replace('950000', '420000') // lower synthetic N
      .replace('150000', '680000') // higher NI/UI N
      .replace('1200', '650') // lower peat area
      .replace('180', '520') // higher peat conservation
      .replace('10', '85') // higher methane capture
      .replace('70', '10') // lower open lagoon
      .replace('0.65', '0.62'); // efficient POME ratio
    setFileName('rspo_palmghg_v5_demo_sustainable.csv');
    setFileSize(modified.length);
    setCsvRawText(modified);
    setActiveFilter('changed');
  };

  // Handle Apply
  const handleApply = () => {
    if (!parseResult) return;
    const summary = `Successfully imported ${parseResult.changedCount} updated GHG inventory parameters (${parseResult.recognizedCount} parameters verified).`;
    onApplyInventory(parseResult.newEstate, parseResult.newMill, summary);
    onClose();
  };

  // Filtered diff list
  const filteredDiffs = useMemo(() => {
    if (!parseResult) return [];
    return parseResult.diffs.filter((diff) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesKey = diff.key.toLowerCase().includes(q);
        const matchesLabel = diff.label.toLowerCase().includes(q);
        const matchesCat = diff.category.toLowerCase().includes(q);
        if (!matchesKey && !matchesLabel && !matchesCat) return false;
      }

      // Tab filter
      if (activeFilter === 'changed') return diff.hasChanged;
      if (activeFilter === 'estate') return diff.domain === 'estate';
      if (activeFilter === 'mill') return diff.domain === 'mill';
      if (activeFilter === 'issues') return diff.status === 'warning' || diff.status === 'error';
      return true;
    });
  }, [parseResult, searchQuery, activeFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-4 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  RSPO PalmGHG v5 GHG Inventory CSV Import
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  LSR v1.1 Compatible
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Upload or paste pre-formatted estate planting, fertiliser, fuel, and mill operational records to instantly populate your assessment.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadSample}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              title="Download empty baseline template with RSPO v5 parameter keys"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span>Sample Template (.csv)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* UPLOAD & CONTROLS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* FILE DROPZONE (2 cols) */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                  <button
                    onClick={() => setActiveInputMode('upload')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all ${
                      activeInputMode === 'upload'
                        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Upload CSV File
                  </button>
                  <button
                    onClick={() => setActiveInputMode('paste')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all ${
                      activeInputMode === 'paste'
                        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Paste Raw CSV / TSV
                  </button>
                </div>

                <button
                  onClick={handleLoadDemoDataset}
                  className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Load Sample Dataset
                </button>
              </div>

              {activeInputMode === 'upload' ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 scale-[1.005]'
                      : 'border-neutral-300 dark:border-neutral-700 hover:border-emerald-500/80 bg-neutral-50/40 dark:bg-neutral-800/20'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept=".csv, .txt, text/csv, text/plain"
                    className="hidden"
                  />
                  <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      {fileName ? fileName : 'Choose CSV file or drag and drop here'}
                    </span>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {fileSize
                        ? `${(fileSize / 1024).toFixed(1)} KB uploaded - Delimiter auto-detected`
                        : 'Supports comma (,), semicolon (;), and tab delimited spreadsheet exports'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    Browse Files
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={csvRawText}
                    onChange={(e) => {
                      setCsvRawText(e.target.value);
                      setFileName('pasted_inventory.csv');
                      setFileSize(e.target.value.length);
                    }}
                    rows={6}
                    placeholder="Paste CSV rows here. Example:&#10;Estate,totalPlantedAreaHa,Total Planted Area,9300,ha&#10;Estate,peatSoilAreaHa,Peat Soil Area,800,ha&#10;Mill,cpoExtractionRatePercent,Oil Extraction Rate,22.1,%"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex items-center justify-between text-[11px] text-neutral-500">
                    <span>Direct spreadsheet copy-paste supported (Excel / Google Sheets).</span>
                    {csvRawText && (
                      <button
                        onClick={() => {
                          setCsvRawText('');
                          setFileName(null);
                        }}
                        className="text-rose-600 hover:underline"
                      >
                        Clear Text
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* TEMPLATE REFERENCE & ACTIONS CARD (1 col) */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 space-y-3.5 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Template Format Guidelines
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  The RSPO PalmGHG v5 template contains 54 standardized parameters covering estate land management, LSR carbon removals, synthetic fertilisers, and mill processing.
                </p>
                <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-mono text-neutral-700 dark:text-neutral-300 space-y-1">
                  <div className="text-neutral-400 text-[10px]"># Standard CSV Format</div>
                  <div>Category,Key,Label,Value,Unit</div>
                  <div className="text-emerald-700 dark:text-emerald-400">Estate,totalPlantedAreaHa,Area,9000,ha</div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={handleDownloadSample}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Download Template (.csv)</span>
                </button>
                <button
                  onClick={handleExportCurrent}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export Current Session (.csv)</span>
                </button>
              </div>
            </div>
          </div>

          {/* PARSING METRICS & PREVIEW STATUS */}
          {parseResult && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/80">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Parameters Matched
                  </span>
                  <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-0.5">
                    {parseResult.recognizedCount}{' '}
                    <span className="text-xs font-normal text-neutral-500">/ 54</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Delimiter: {parseResult.detectedDelimiter}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 tracking-wider">
                    Values to Update
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-800 dark:text-emerald-300 mt-0.5">
                    {parseResult.changedCount}
                  </div>
                  <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 block">
                    Differs from current session
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/80">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Unchanged Values
                  </span>
                  <div className="text-xl font-bold font-mono text-neutral-700 dark:text-neutral-300 mt-0.5">
                    {parseResult.recognizedCount - parseResult.changedCount}
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Identical to active data
                  </span>
                </div>

                <div className={`p-3 rounded-xl border ${
                  parseResult.validationIssues.length > 0
                    ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/80'
                }`}>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    RSPO Audit Alerts
                  </span>
                  <div className={`text-xl font-bold font-mono mt-0.5 ${
                    parseResult.validationIssues.length > 0
                      ? 'text-amber-800 dark:text-amber-300'
                      : 'text-neutral-700 dark:text-neutral-300'
                  }`}>
                    {parseResult.validationIssues.length}
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    {parseResult.validationIssues.length > 0
                      ? 'Benchmark warnings flagged'
                      : 'All RSPO bounds satisfied'}
                  </span>
                </div>
              </div>

              {/* UNRECOGNIZED ROWS WARNING IF ANY */}
              {parseResult.unrecognizedKeys.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">
                      {parseResult.unrecognizedKeys.length} unmapped row(s) skipped:
                    </span>{' '}
                    <span className="font-mono text-[11px] opacity-90">
                      {parseResult.unrecognizedKeys.slice(0, 5).join(', ')}
                      {parseResult.unrecognizedKeys.length > 5 ? '...' : ''}
                    </span>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                      These rows do not match standard PalmGHG v5 parameter keys and will be safely ignored.
                    </p>
                  </div>
                </div>
              )}

              {/* TABLE CONTROLS BAR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2">
                {/* FILTER BUTTONS */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
                  <button
                    onClick={() => setActiveFilter('changed')}
                    className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                      activeFilter === 'changed'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                    }`}
                  >
                    Changed Values ({parseResult.changedCount})
                  </button>
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                      activeFilter === 'all'
                        ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                    }`}
                  >
                    All Parameters ({parseResult.diffs.length})
                  </button>
                  <button
                    onClick={() => setActiveFilter('estate')}
                    className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                      activeFilter === 'estate'
                        ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                    }`}
                  >
                    Estate Only (30)
                  </button>
                  <button
                    onClick={() => setActiveFilter('mill')}
                    className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                      activeFilter === 'mill'
                        ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                    }`}
                  >
                    Mill Only (24)
                  </button>
                  {parseResult.validationIssues.length > 0 && (
                    <button
                      onClick={() => setActiveFilter('issues')}
                      className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                        activeFilter === 'issues'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      Alerts ({parseResult.validationIssues.length})
                    </button>
                  )}
                </div>

                {/* SEARCH INPUT */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search parameters or keys..."
                    className="w-full pl-8 pr-3 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-neutral-400 hover:text-neutral-600 absolute right-2.5 top-1/2 -translate-y-1/2 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* DIFF TABLE */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-100 dark:bg-neutral-800 sticky top-0 z-10 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-700">
                      <tr>
                        <th className="py-2.5 px-3">Scope & Category</th>
                        <th className="py-2.5 px-3">Parameter Name</th>
                        <th className="py-2.5 px-3 text-right">Current Value</th>
                        <th className="py-2.5 px-3 text-right">Imported Value</th>
                        <th className="py-2.5 px-3">Unit</th>
                        <th className="py-2.5 px-3">Status / Audit Guidance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {filteredDiffs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-neutral-500">
                            No parameters found matching the current filter.
                          </td>
                        </tr>
                      ) : (
                        filteredDiffs.map((diff) => {
                          const isWarning = diff.status === 'warning' || diff.status === 'error';
                          return (
                            <tr
                              key={diff.key}
                              className={`transition-colors ${
                                diff.hasChanged
                                  ? 'bg-emerald-50/20 dark:bg-emerald-950/10 hover:bg-emerald-50/40'
                                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                              }`}
                            >
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span className="font-semibold text-neutral-900 dark:text-neutral-200">
                                  {diff.domain === 'estate' ? 'Estate' : 'Mill'}
                                </span>
                                <span className="text-neutral-400 text-[10px] block">
                                  {diff.category}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {diff.label}
                                </div>
                                <div className="font-mono text-[10px] text-neutral-400">
                                  {diff.key}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                {diff.currentValue.toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-right whitespace-nowrap">
                                <span
                                  className={`font-mono font-bold ${
                                    diff.hasChanged
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : 'text-neutral-700 dark:text-neutral-300'
                                  }`}
                                >
                                  {diff.importedValue.toLocaleString()}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono text-[11px] text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                {diff.unit}
                              </td>
                              <td className="py-2 px-3">
                                {isWarning ? (
                                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-[11px]">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{diff.auditNote || 'Audit alert flagged'}</span>
                                  </div>
                                ) : diff.hasChanged ? (
                                  <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
                                    <ArrowRight className="w-3 h-3" />
                                    <span>Updated (+{((diff.importedValue - diff.currentValue) / (diff.currentValue || 1) * 100).toFixed(0)}%)</span>
                                  </div>
                                ) : (
                                  <span className="text-neutral-400 text-[11px]">Unchanged</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
            {parseResult ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Ready to apply <strong>{parseResult.changedCount}</strong> changes across{' '}
                  <strong>{parseResult.recognizedCount}</strong> validated parameters.
                </span>
              </>
            ) : (
              <span>Upload or select a CSV template to inspect parameters before applying.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!parseResult || parseResult.recognizedCount === 0}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>
                Apply {parseResult?.changedCount ? `${parseResult.changedCount} Parameters` : 'Inventory Data'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
