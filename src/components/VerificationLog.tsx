import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  FileCheck,
  Download,
  Plus,
  Trash2,
  Filter,
  Search,
  PenTool,
  RotateCcw,
  ExternalLink,
  Lock,
  Building,
  UserCheck,
  Hash,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface VerificationStage {
  id: string;
  code: string;
  name: string;
  category: 'Estate' | 'Mill' | 'Cross-Cutting' | 'Certification';
  standardRef: string;
  description: string;
}

export const RSPO_VERIFICATION_STAGES: VerificationStage[] = [
  {
    id: 'stage_1',
    code: 'STG-01',
    name: 'FFB Supply Base & Smallholder Traceability',
    category: 'Estate',
    standardRef: 'RSPO V5 Sec 2.1 / GHG Protocol Scope 1 & 3',
    description: 'Verifikasi kontrol operasional pasokan TBS, proporsi kebun sendiri vs petani swadaya, dan ketertelusuran koordinat geofencing.',
  },
  {
    id: 'stage_2',
    code: 'STG-02',
    name: 'Mill Mass Balance & Extraction Yields (OER/KER)',
    category: 'Mill',
    standardRef: 'RSPO V5 Sec 2.2 / Mass Balance Module',
    description: 'Rekonsiliasi data timbangan TBS pabrik, rendemen CPO (OER) dan Palm Kernel (KER) terhadap logbook produksi bulanan.',
  },
  {
    id: 'stage_3',
    code: 'STG-03',
    name: 'POME Wastewater & Biogas Methane Capture Verification',
    category: 'Mill',
    standardRef: 'RSPO V5 Sec 2.3 / MCF Lagoon & Flare 98-99.5%',
    description: 'Pemeriksaan beban COD air limbah POME, jam operasional methane capture, efisiensi pembakaran cerobong flare, dan kebocoran slip.',
  },
  {
    id: 'stage_4',
    code: 'STG-04',
    name: 'Estate Peatland Water Table Management (40-50 cm)',
    category: 'Estate',
    standardRef: 'RSPO V5 Sec 2.4 / Peatland Drainage Factor 54.6 t/ha',
    description: 'Audit buku catatan piezometer muka air gambut, keandalan sekat kanal (weirs), dan verifikasi luas gambut yang dibasahi kembali.',
  },
  {
    id: 'stage_5',
    code: 'STG-05',
    name: 'Land Use Change (LUC) & 25-Year Amortisation Debt',
    category: 'Estate',
    standardRef: 'RSPO V5 Sec 2.5 / Linear 25-Year Amortisation',
    description: 'Verifikasi kepatuhan NPP (New Planting Procedure), peta tutupan vegetasi historis sebelum pembukaan, dan kalkulasi utang karbon LUC.',
  },
  {
    id: 'stage_6',
    code: 'STG-06',
    name: 'Fertiliser Direct & Indirect Soil N2O Application',
    category: 'Estate',
    standardRef: 'RSPO V5 Sec 2.6 / IPCC 2019 Refinement Tier 1',
    description: 'Verifikasi faktur pembelian pupuk urea/NPK, dosis aplikasi hara, dan bukti aditif inhibitor nitrifikasi/urease (NI/UI).',
  },
  {
    id: 'stage_7',
    code: 'STG-07',
    name: 'Carbon Removals (HCV Forest & Conserved Peatland)',
    category: 'Cross-Cutting',
    standardRef: 'GHG Protocol LSR v1.1 / RSPO Removals Accounting',
    description: 'Audit batas delineasi kawasan Hutan Bernilai Konservasi Tinggi (HCV -9.14 t/ha) dan tutupan lahan sawit tua pensiun (>25 thn).',
  },
  {
    id: 'stage_8',
    code: 'STG-08',
    name: 'Final GHG Inventory Sign-off & Lead Auditor Declaration',
    category: 'Certification',
    standardRef: 'RSPO Management System / PRISMA UAR Sign-off',
    description: 'Pengesahan akhir seluruh inventarisasi gas rumah kaca oleh Lead Auditor untuk penerbitan Universal Audit Report (UAR).',
  },
];

export interface VerificationLogEntry {
  id: string;
  stageId: string;
  stageCode: string;
  stageName: string;
  signerName: string;
  signerRole: 'lead_auditor' | 'ghg_specialist' | 'estate_manager' | 'mill_manager';
  signerAffiliation: string;
  accreditationId: string;
  decision: 'verified_compliant' | 'minor_car' | 'major_ncr' | 'conditional';
  comments: string;
  evidenceReference: string;
  timestamp: string; // ISO String
  digitalHash: string; // SHA-256 format string
  signatureDataUrl?: string; // Drawn signature canvas
}

interface Props {
  auditAppNumber: string;
  cbName: string;
  isDark?: boolean;
}

export const VerificationLog: React.FC<Props> = ({
  auditAppNumber,
  cbName,
  isDark = false,
}) => {
  // Pre-populated initial realistic audit records
  const [logs, setLogs] = useState<VerificationLogEntry[]>([
    {
      id: 'VERIF-2026-STG01-89A1',
      stageId: 'stage_1',
      stageCode: 'STG-01',
      stageName: 'FFB Supply Base & Smallholder Traceability',
      signerName: 'Dr. Ir. Hendra Setiawan',
      signerRole: 'lead_auditor',
      signerAffiliation: 'PT TUV Rheinland Indonesia',
      accreditationId: 'RSPO-LA-2026-0428',
      decision: 'verified_compliant',
      comments: 'Alokasi pasokan TBS 100% tertelusur ke 3 kebun inti (UoC) dan 1 koperasi swadaya mitra. Koordinat polygon kebun tervalidasi.',
      evidenceReference: 'Weighbridge-Log-Q1-Q4-2026.xlsx & Shapefile-UoC-2026.zip',
      timestamp: '2026-11-01T09:30:15+07:00',
      digitalHash: 'SHA256:7f9b8c2e14d3f56a09e81b34c71a9203f5698e4d21b7c8e90a12f3456789abcd',
    },
    {
      id: 'VERIF-2026-STG03-91C2',
      stageId: 'stage_3',
      stageCode: 'STG-03',
      stageName: 'POME Wastewater & Biogas Methane Capture Verification',
      signerName: 'Ahmad Faisal, S.T., M.Sc.',
      signerRole: 'ghg_specialist',
      signerAffiliation: 'PT TUV Rheinland Indonesia (GHG Technical Expert)',
      accreditationId: 'IRCA-GHG-8991',
      decision: 'verified_compliant',
      comments: 'Fasilitas biogas methane capture beroperasi dengan uptime 92.4%. Enclosed flare terkalibrasi dengan efisiensi destruksi metana 99.5%.',
      evidenceReference: 'SCADA-Biogas-Log-2026.csv & Kalibrasi-Flare-Certificate.pdf',
      timestamp: '2026-11-01T14:15:40+07:00',
      digitalHash: 'SHA256:3d1a4e5f67b8c9a012345e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b',
    },
    {
      id: 'VERIF-2026-STG04-94D8',
      stageId: 'stage_4',
      stageCode: 'STG-04',
      stageName: 'Estate Peatland Water Table Management (40-50 cm)',
      signerName: 'Budi Santoso, S.P.',
      signerRole: 'estate_manager',
      signerAffiliation: 'Kembayan Estate Management Unit',
      accreditationId: 'MU-SUSTAINABILITY-HEAD',
      decision: 'verified_compliant',
      comments: 'Pencatatan muka air tanah pada 24 titik piezometer menunjukkan rata-rata 48.5 cm, sesuai standar RSPO V5 pengelolaan gambut berkelanjutan.',
      evidenceReference: 'Piezometer-Logbook-Harian-2026.pdf & Peta-Sekat-Kanal.pdf',
      timestamp: '2026-11-02T11:05:22+07:00',
      digitalHash: 'SHA256:c98a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a',
    },
  ]);

  // Filtering & Search State
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterDecision, setFilterDecision] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sign Modal State
  const [isSignModalOpen, setIsSignModalOpen] = useState<boolean>(false);
  const [selectedStageId, setSelectedStageId] = useState<string>('stage_1');
  const [signerName, setSignerName] = useState<string>('Dr. Ir. Hendra Setiawan');
  const [signerRole, setSignerRole] = useState<VerificationLogEntry['signerRole']>('lead_auditor');
  const [signerAffiliation, setSignerAffiliation] = useState<string>(cbName || 'PT TUV Rheinland Indonesia');
  const [accreditationId, setAccreditationId] = useState<string>('RSPO-LA-2026-0428');
  const [decision, setDecision] = useState<VerificationLogEntry['decision']>('verified_compliant');
  const [comments, setComments] = useState<string>('');
  const [evidenceReference, setEvidenceReference] = useState<string>('');

  // Signature Canvas Drawing State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState<boolean>(false);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawnSignature(true);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isDark ? '#10b981' : '#047857';

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  // Generate SHA-256 style hash string
  const generateSimulatedHash = (content: string) => {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `SHA256:${hex}${Date.now().toString(16)}${Math.random().toString(16).substring(2, 10)}`;
  };

  // Open modal for a specific stage
  const handleOpenSignModal = (stageId: string) => {
    setSelectedStageId(stageId);
    setComments('');
    setEvidenceReference('');
    clearCanvas();
    setIsSignModalOpen(true);
  };

  // Submit new verification entry
  const handleSubmitSignature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) {
      alert('Harap isi catatan komentar verifikasi / audit findings.');
      return;
    }

    const stageObj = RSPO_VERIFICATION_STAGES.find((s) => s.id === selectedStageId);
    if (!stageObj) return;

    let signatureUrl: string | undefined = undefined;
    if (canvasRef.current && hasDrawnSignature) {
      signatureUrl = canvasRef.current.toDataURL('image/png');
    }

    const nowIso = new Date().toISOString();
    const hashContent = `${selectedStageId}-${signerName}-${signerRole}-${nowIso}-${comments}`;
    const digitalHash = generateSimulatedHash(hashContent);

    const newEntry: VerificationLogEntry = {
      id: `VERIF-2026-${stageObj.code}-${Math.random().toString(16).substring(2, 6).toUpperCase()}`,
      stageId: stageObj.id,
      stageCode: stageObj.code,
      stageName: stageObj.name,
      signerName,
      signerRole,
      signerAffiliation,
      accreditationId,
      decision,
      comments,
      evidenceReference: evidenceReference || 'Verified On-site Sampling Records',
      timestamp: nowIso,
      digitalHash,
      signatureDataUrl: signatureUrl,
    };

    setLogs([newEntry, ...logs]);
    setIsSignModalOpen(false);
  };

  // Delete entry
  const handleDeleteEntry = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan verifikasi ini?')) {
      setLogs(logs.filter((l) => l.id !== id));
    }
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesStage = filterStage === 'all' || log.stageId === filterStage;
      const matchesDecision = filterDecision === 'all' || log.decision === filterDecision;
      const matchesSearch =
        searchQuery === '' ||
        log.signerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.comments.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.stageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.evidenceReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.digitalHash.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStage && matchesDecision && matchesSearch;
    });
  }, [logs, filterStage, filterDecision, searchQuery]);

  // Export to JSON / CSV
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `RSPO_Verification_Audit_Log_${auditAppNumber}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    const headers = [
      'Verification_ID',
      'Stage_Code',
      'Stage_Name',
      'Signer_Name',
      'Signer_Role',
      'Affiliation',
      'Accreditation_ID',
      'Decision',
      'Timestamp_ISO',
      'Evidence_Reference',
      'Digital_Hash',
      'Comments',
    ];

    const rows = logs.map((l) => [
      l.id,
      l.stageCode,
      `"${l.stageName}"`,
      `"${l.signerName}"`,
      l.signerRole,
      `"${l.signerAffiliation}"`,
      l.accreditationId,
      l.decision,
      l.timestamp,
      `"${l.evidenceReference}"`,
      l.digitalHash,
      `"${l.comments.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RSPO_Verification_Audit_Log_${auditAppNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Helper for Decision Badges
  const getDecisionBadge = (d: VerificationLogEntry['decision']) => {
    switch (d) {
      case 'verified_compliant':
        return {
          label: 'Memenuhi Syarat (Compliant)',
          className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'minor_car':
        return {
          label: 'Minor CAR (Catatan Perbaikan)',
          className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
        };
      case 'major_ncr':
        return {
          label: 'Major NCR (Ketidaksesuaian Berat)',
          className: 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800',
          icon: <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />,
        };
      case 'conditional':
        return {
          label: 'Persetujuan Bersyarat (Conditional)',
          className: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-800',
          icon: <FileCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />,
        };
    }
  };

  // Format date helper
  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & METADATA CARD */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 mt-0.5 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  RSPO Audit Traceability & Evidence Ledger
                </span>
                <span className="text-xs text-neutral-300 dark:text-neutral-700">·</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  Audit App: {auditAppNumber}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  LS: {cbName}
                </span>
              </div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                GHG Inventory Verification Log & Digital Signatures
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5 max-w-3xl">
                Log bukti ketertelusuran verifikasi inventarisasi GRK PalmGHG V5. Menampung tanda tangan digital, stempel kriptografi SHA-256, dan catatan komentar berstempel waktu (*timestamped audit notes*) untuk setiap tahapan verifikasi lapangan.
              </p>
            </div>
          </div>

          {/* Action Buttons: New Sign-Off & Export */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => handleOpenSignModal('stage_1')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Bubuhkan Tanda Tangan (Sign Stage)</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
              title="Download Verification Log as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
              title="Download Verification Log as JSON Audit Trail"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON Trail</span>
            </button>
          </div>
        </div>

        {/* 4 SUMMARY KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80">
            <span className="text-[11px] font-medium text-neutral-500">Tahapan Terverifikasi</span>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
              {new Set(logs.map((l) => l.stageId)).size} / {RSPO_VERIFICATION_STAGES.length}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5 font-sans">
              Tahapan inventaris GRK memiliki tanda tangan
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                Status Memenuhi Syarat
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
              {logs.filter((l) => l.decision === 'verified_compliant').length}
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
              Verified & Compliant sign-offs
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                Catatan Perbaikan (CAR)
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">
              {logs.filter((l) => l.decision === 'minor_car' || l.decision === 'major_ncr').length}
            </div>
            <div className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
              Temuan Minor CAR / Major NCR aktif
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">
                Total Riwayat Log
              </span>
              <FileCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-bold font-mono text-blue-800 dark:text-blue-300 mt-1">
              {logs.length}
            </div>
            <div className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
              Entri terenkripsi SHA-256 tersimpan
            </div>
          </div>
        </div>
      </div>

      {/* VERIFICATION STAGES PROGRESS STRIP */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
            Daftar 8 Tahapan Verifikasi Inventarisasi GRK PalmGHG V5
          </h3>
          <span className="text-[11px] text-neutral-500">
            Klik tombol tanda tangan pada tahapan mana pun untuk membubuhkan verifikasi langsung
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {RSPO_VERIFICATION_STAGES.map((stage) => {
            const stageLogs = logs.filter((l) => l.stageId === stage.id);
            const isSigned = stageLogs.length > 0;
            const latestLog = stageLogs[0];
            const badge = latestLog ? getDecisionBadge(latestLog.decision) : null;

            return (
              <div
                key={stage.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isSigned
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                    : 'bg-neutral-50/70 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                      {stage.code}
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-400">
                      {stage.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 mt-1.5 leading-snug">
                    {stage.name}
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2 leading-tight">
                    {stage.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between">
                  {isSigned ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{stageLogs.length} Tanda Tangan</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-neutral-400 italic">Belum ditandatangani</span>
                  )}

                  <button
                    onClick={() => handleOpenSignModal(stage.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors"
                  >
                    <PenTool className="w-3 h-3" />
                    <span>{isSigned ? 'Tambah TTD' : 'Tandatangani'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <span className="font-semibold text-neutral-600 dark:text-neutral-400">Filter Tahapan:</span>
          </div>

          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs"
          >
            <option value="all">Semua Tahapan (All Stages)</option>
            {RSPO_VERIFICATION_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code}: {s.name}
              </option>
            ))}
          </select>

          <select
            value={filterDecision}
            onChange={(e) => setFilterDecision(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs"
          >
            <option value="all">Semua Keputusan (All Decisions)</option>
            <option value="verified_compliant">Memenuhi Syarat (Compliant)</option>
            <option value="minor_car">Minor CAR</option>
            <option value="major_ncr">Major NCR</option>
            <option value="conditional">Persetujuan Bersyarat</option>
          </select>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama auditor, catatan, atau dokumen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs w-full sm:w-64"
          />
        </div>
      </div>

      {/* VERIFICATION LOGS TIMELINE / FEED */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 space-y-2">
            <Clock className="w-8 h-8 mx-auto text-neutral-400" />
            <div className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
              Tidak ada catatan verifikasi yang cocok dengan filter
            </div>
            <p className="text-xs">
              Ubah kriteria filter atau klik "Bubuhkan Tanda Tangan" untuk menambahkan catatan baru.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const decisionInfo = getDecisionBadge(log.decision);

            return (
              <div
                key={log.id}
                className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3 transition-all hover:border-emerald-400/60"
              >
                {/* Header row: Stage name, decision badge, unique ID */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {log.stageCode}
                    </span>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {log.stageName}
                    </h3>
                    <span
                      className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${decisionInfo.className}`}
                    >
                      {decisionInfo.icon}
                      <span>{decisionInfo.label}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-neutral-400">
                      {log.id}
                    </span>
                    <button
                      onClick={() => handleDeleteEntry(log.id)}
                      className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                      title="Hapus Catatan Ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Middle row: Signer Info & Timestamp */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-700/70">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                      Penandatangan & Jabatan:
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 block mt-0.5">
                      {log.signerName}
                    </span>
                    <span className="text-[11px] text-neutral-500 block">
                      {log.signerAffiliation} ({log.signerRole.replace('_', ' ').toUpperCase()})
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                      Nomor Akreditasi / Lisensi Auditor:
                    </span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
                      {log.accreditationId}
                    </span>
                    <span className="text-[11px] text-neutral-500 block">
                      Telah tervalidasi di RSPO Registry
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                      Stempel Waktu Verifikasi (Timestamp):
                    </span>
                    <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 block mt-0.5">
                      {formatDateTime(log.timestamp)}
                    </span>
                    <span className="text-[11px] text-neutral-500 block">
                      Waktu Resmi Tercatat (ISO-8601)
                    </span>
                  </div>
                </div>

                {/* Comments & Audit Findings */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                    Catatan Verifikasi & Temuan Lapangan:
                  </span>
                  <div className="p-3 bg-neutral-50/50 dark:bg-neutral-800/30 rounded-lg border border-neutral-200/50 dark:border-neutral-700/50 text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans">
                    {log.comments}
                  </div>
                </div>

                {/* Evidence Document & Digital Signature Stamp */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                    <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-semibold">Dokumen Bukti Pendukung:</span>
                    <span className="font-mono text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                      {log.evidenceReference}
                    </span>
                  </div>

                  {/* Digital Signature Image or Hash Seal */}
                  <div className="flex items-center gap-3">
                    {log.signatureDataUrl && (
                      <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-200 dark:border-neutral-700">
                        <span className="text-[10px] text-neutral-400">TTD Digital:</span>
                        <img
                          src={log.signatureDataUrl}
                          alt="Tanda Tangan Digital"
                          className="h-7 max-w-[90px] object-contain bg-white dark:bg-neutral-800 rounded px-1 border border-neutral-300 dark:border-neutral-700"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span className="truncate max-w-[170px]" title={log.digitalHash}>
                        {log.digitalHash.substring(0, 22)}...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SIGN STAGE MODAL DRAWER */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    Bubuhkan Tanda Tangan & Verifikasi Tahapan
                  </h3>
                  <p className="text-xs text-neutral-500">
                    RSPO PalmGHG V5 Audit Traceability & Evidence Ledger
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSignModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSignature} className="space-y-4 text-xs">
              {/* Select Stage */}
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Pilih Tahapan Verifikasi Inventarisasi GRK:
                </label>
                <select
                  value={selectedStageId}
                  onChange={(e) => setSelectedStageId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold"
                >
                  {RSPO_VERIFICATION_STAGES.map((stg) => (
                    <option key={stg.id} value={stg.id}>
                      {stg.code}: {stg.name} ({stg.standardRef})
                    </option>
                  ))}
                </select>
              </div>

              {/* Signer Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                    Nama Penandatangan / Auditor:
                  </label>
                  <input
                    type="text"
                    required
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                    Peran / Jabatan:
                  </label>
                  <select
                    value={signerRole}
                    onChange={(e) => setSignerRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold"
                  >
                    <option value="lead_auditor">Lead Auditor (Lembaga Sertifikasi)</option>
                    <option value="ghg_specialist">Pakar Teknis GRK (GHG Technical Expert)</option>
                    <option value="estate_manager">Manajer Keberlanjutan Kebun (Estate Lead)</option>
                    <option value="mill_manager">Manajer Operasional Pabrik (Mill Lead)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                    Instansi / Lembaga Sertifikasi (LS):
                  </label>
                  <input
                    type="text"
                    required
                    value={signerAffiliation}
                    onChange={(e) => setSignerAffiliation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                    Nomor Sertifikat Akreditasi / KTA:
                  </label>
                  <input
                    type="text"
                    required
                    value={accreditationId}
                    onChange={(e) => setAccreditationId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Decision / Verdict */}
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Keputusan Verifikasi Tahapan (Audit Finding):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'verified_compliant', label: 'Memenuhi Syarat', color: 'emerald' },
                    { id: 'minor_car', label: 'Minor CAR', color: 'amber' },
                    { id: 'major_ncr', label: 'Major NCR', color: 'red' },
                    { id: 'conditional', label: 'Persetujuan Bersyarat', color: 'sky' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDecision(item.id as any)}
                      className={`py-2 px-2.5 rounded-lg border font-bold text-center transition-all ${
                        decision === item.id
                          ? item.id === 'verified_compliant'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : item.id === 'minor_car'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : item.id === 'major_ncr'
                            ? 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timestamped Comments */}
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Catatan Verifikasi & Justifikasi Temuan Lapangan:
                </label>
                <textarea
                  required
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Contoh: Seluruh sampel data timbangan TBS tervalidasi 100% konsisten. Koordinat batas kebun tidak tumpang tindih dengan kawasan lindung gambut primer..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                ></textarea>
              </div>

              {/* Evidence Reference */}
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                  Referensi Dokumen Bukti Verifikasi:
                </label>
                <input
                  type="text"
                  value={evidenceReference}
                  onChange={(e) => setEvidenceReference(e.target.value)}
                  placeholder="Contoh: Logbook-TBS-2026.xlsx, Kalibrasi-Flare.pdf, Piezometer-Log.pdf"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              {/* Interactive Digital Signature Drawing Canvas */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    Bubuhkan Tanda Tangan Digital (Gambar pada kanvas di bawah):
                  </label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-red-600"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Hapus Goresan (Clear)</span>
                  </button>
                </div>

                <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-1 bg-neutral-50 dark:bg-neutral-800/80">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={120}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-28 bg-white dark:bg-neutral-900 rounded-lg cursor-crosshair touch-none shadow-inner"
                  />
                </div>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">
                  *Tanda tangan akan disimpan secara terenkripsi dan diberi stempel hash SHA-256 otomatis bersama stempel waktu ISO.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-all shadow-xs"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Simpan & Bubuhkan Tanda Tangan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
