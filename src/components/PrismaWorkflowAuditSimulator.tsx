import React, { useState } from 'react';
import {
  EstateParameters,
  MillParameters,
  FFBSourceAllocation,
  PalmGHGAssessmentResults,
} from '../types/palmghg';
import {
  ShieldCheck,
  Building,
  UserCheck,
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  FileCheck,
  ChevronRight,
  ExternalLink,
  Edit3,
  MessageSquare,
  FileText,
  Lock,
  PenTool,
} from 'lucide-react';
import { VerificationLog } from './VerificationLog';

export type AssessmentStatus =
  | 'pending_submission' // Menunggu Pengajuan
  | 'pending_cb_review' // Menunggu Peninjauan LS
  | 'review_in_progress' // Peninjauan Sedang Berlangsung
  | 'pending_member_revision' // Menunggu Revisi Anggota
  | 'approved' // Disetujui LS (Telah Diaudit)
  | 'rejected'; // Ditolak

interface Props {
  estate: EstateParameters;
  mill: MillParameters;
  ffbSources: FFBSourceAllocation[];
  results: PalmGHGAssessmentResults;
  isDark?: boolean;
}

export const PrismaWorkflowAuditSimulator: React.FC<Props> = ({
  estate,
  mill,
  ffbSources,
  results,
  isDark = false,
}) => {
  // Simulator State
  const [subTab, setSubTab] = useState<'workflow' | 'verification_log'>('workflow');
  const [activeRole, setActiveRole] = useState<'member' | 'auditor'>('member');
  const [assessmentStatus, setAssessmentStatus] = useState<AssessmentStatus>('pending_submission');
  const [auditAppNumber, setAuditAppNumber] = useState('AUD-2026-RSPO-0842');
  const [reportingPeriod, setReportingPeriod] = useState<'jan_dec' | 'jul_jun'>('jan_dec');
  const [dvProfile, setDvProfile] = useState<'system_default' | 'parent_entity' | 'custom'>('system_default');
  const [cbName, setCbName] = useState('PT TUV Rheinland Indonesia');
  
  // Auditor Review Decisions per Tab
  const [tabDecisions, setTabDecisions] = useState<Record<string, { approved: boolean; comments: string }>>({
    mill_tbs: { approved: true, comments: 'Volume TBS dan alokasi pasokan sesuai timbangan pabrik.' },
    mill_extraction: { approved: true, comments: 'Rendemen OER dan KER konsisten dengan data produksi bulanan.' },
    mill_pome: { approved: true, comments: 'Fasilitas biogas methane capture terverifikasi beroperasi.' },
    mill_energy: { approved: true, comments: 'Ekspor listrik surplus ke PLN tercatat dengan kWh meter resmi.' },
    estate_planting: { approved: true, comments: 'Luas tanam sawit dan amortisasi LUC 25 tahun sesuai prosedur NPP.' },
    estate_peat: { approved: true, comments: 'Rata-rata kedalaman muka air 60 cm terkelola baik dan terdata.' },
    estate_removals: { approved: true, comments: 'Kawasan konservasi hutan dan gambut terlindungi di lapangan.' },
    estate_fert_fuel: { approved: true, comments: 'Dosis pupuk NI/UI dan solar WTT sesuai faktur pembelian.' },
  });

  const [auditorGeneralNotes, setAuditorGeneralNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Status Badge Configuration (Diagram 5)
  const getStatusBadge = (status: AssessmentStatus) => {
    switch (status) {
      case 'pending_submission':
        return {
          label: 'Menunggu Pengajuan (Pending Submission)',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
          desc: 'Anggota sedang melengkapi input data operasional di kebun dan pabrik.',
        };
      case 'pending_cb_review':
        return {
          label: 'Menunggu Peninjauan LS (Pending CB Review)',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
          desc: 'Penilaian telah diajukan oleh Anggota ke Lembaga Sertifikasi. Pengeditan data dikunci.',
        };
      case 'review_in_progress':
        return {
          label: 'Peninjauan Sedang Berlangsung (Review in Progress)',
          badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
          desc: 'Auditor LS sedang meninjau profil Nilai Baku (DV) dan input data di setiap tab.',
        };
      case 'pending_member_revision':
        return {
          label: 'Menunggu Revisi Anggota (Pending Member Revision)',
          badgeClass: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
          desc: 'Terdapat catatan atau tab berstatus Tidak Disetujui. Anggota wajib memperbaiki dan mengajukan ulang.',
        };
      case 'approved':
        return {
          label: 'Disetujui LS / Telah Diaudit (Approved)',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
          desc: 'Penilaian disetujui penuh oleh Auditor LS dan otomatis dialirkan ke Universal Audit Report (UAR).',
        };
      case 'rejected':
        return {
          label: 'Ditolak (Rejected)',
          badgeClass: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
          desc: 'Penilaian ditolak oleh auditor atas permintaan anggota atau ketidaksesuaian fatal.',
        };
    }
  };

  const statusInfo = getStatusBadge(assessmentStatus);

  // Workflow Action Handlers
  const handleSubmitAssessment = () => {
    if (!auditAppNumber.trim()) {
      showFeedback('Harap masukkan Nomor Permohonan Audit yang valid.');
      return;
    }
    setAssessmentStatus('pending_cb_review');
    showFeedback('Penilaian berhasil diajukan ke Lembaga Sertifikasi (LS). Status: Menunggu Peninjauan LS.');
  };

  const handleStartReview = () => {
    setAssessmentStatus('review_in_progress');
    showFeedback('Peninjauan dimulai oleh Auditor LS. Status: Peninjauan Sedang Berlangsung.');
  };

  const handleApproveAssessment = () => {
    // Check if any tab is rejected
    const hasUnapproved = Object.values(tabDecisions).some((t) => !t.approved);
    if (hasUnapproved) {
      showFeedback('Gagal menyetujui: Masih ada tab yang berstatus "Tidak Disetujui". Pilih "Minta Revisi" atau setujui semua tab.');
      return;
    }
    setAssessmentStatus('approved');
    showFeedback('Penilaian PalmGHG V5 disetujui penuh! Data terkunci dan dialirkan ke Laporan Audit Universal (UAR).');
  };

  const handleRequestRevision = () => {
    setAssessmentStatus('pending_member_revision');
    showFeedback('Permintaan revisi dikirimkan ke Anggota beserta catatan peninjauan auditor.');
  };

  const handleRejectAssessment = () => {
    if (!rejectionReason.trim()) {
      showFeedback('Wajib memasukkan alasan penolakan penilaian.');
      return;
    }
    setAssessmentStatus('rejected');
    showFeedback('Penilaian resmi ditolak.');
  };

  const handleResetWorkflow = () => {
    setAssessmentStatus('pending_submission');
    showFeedback('Alur kerja disetel ulang ke draf awal (Menunggu Pengajuan).');
  };

  return (
    <div className="space-y-6">
      {/* SIMULATOR TOP HEADER & ROLE SWITCHER */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                prisma Interactive Platform
              </span>
              <span className="text-xs text-neutral-400">·</span>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Simulator Alur Kerja Penilaian & Audit PalmGHG V5
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Simulasi alur lengkap pengajuan data anggota MU hingga verifikasi auditor LS sesuai Bab 3 Petunjuk Teknis RSPO-GUI-T04-001.
            </p>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl shrink-0">
            <button
              onClick={() => setActiveRole('member')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'member'
                  ? 'bg-white dark:bg-neutral-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Unit Pengelolaan (MU)</span>
            </button>

            <button
              onClick={() => setActiveRole('auditor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'auditor'
                  ? 'bg-white dark:bg-neutral-700 text-blue-800 dark:text-blue-300 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Auditor / Lembaga Sertifikasi (LS)</span>
            </button>
          </div>
        </div>

        {/* ACTIVE STATUS BANNER (Diagram 5) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border bg-neutral-50/80 dark:bg-neutral-800/50">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-neutral-400">Status Penilaian prisma:</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md border mt-0.5 ${statusInfo.badgeClass}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-xl">
              {statusInfo.desc}
            </p>
          </div>

          <button
            onClick={handleResetWorkflow}
            className="flex items-center gap-1 text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 shrink-0 self-end sm:self-center"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Siklus Status</span>
          </button>
        </div>

        {/* FEEDBACK TOAST NOTIFICATION */}
        {actionFeedback && (
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* SUB-TAB NAVIGATOR: WORKFLOW SIMULATOR VS VERIFICATION LOG */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => setSubTab('workflow')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                subTab === 'workflow'
                  ? 'bg-white dark:bg-neutral-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Alur Status Penilaian (PRISMA Workflow)</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('verification_log')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                subTab === 'verification_log'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Log Verifikasi & TTD Digital (Verification Log)</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  subTab === 'verification_log'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                8 Tahapan RSPO
              </span>
            </button>
          </div>

          <div className="text-xs text-neutral-500 font-mono">
            Audit Ledger ID: <strong className="text-neutral-900 dark:text-neutral-100">{auditAppNumber}</strong>
          </div>
        </div>
      </div>

      {subTab === 'verification_log' ? (
        <VerificationLog
          auditAppNumber={auditAppNumber}
          cbName={cbName}
          isDark={isDark}
        />
      ) : (
        <>
          {/* MEMBER VIEW: SUBMISSION WORKFLOW */}
          {activeRole === 'member' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1: Inisiasi Penilaian Baru (Subbab 3.5.1) */}
            <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Langkah 1: Penilaian Baru
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Subbab 3.5
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-neutral-500 mb-0.5">Nama Unit Pengelolaan (MU):</label>
                  <input
                    type="text"
                    disabled={assessmentStatus !== 'pending_submission' && assessmentStatus !== 'pending_member_revision'}
                    defaultValue="Kembayan Palm Oil Mill & Supply Base"
                    className="w-full px-2.5 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 mb-0.5">Periode Pelaporan 12 Bulan:</label>
                  <select
                    disabled={assessmentStatus !== 'pending_submission' && assessmentStatus !== 'pending_member_revision'}
                    value={reportingPeriod}
                    onChange={(e) => setReportingPeriod(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                  >
                    <option value="jan_dec">Januari hingga Desember (Tahun Kalender Penuh)</option>
                    <option value="jul_jun">Juli hingga Juni (Tahun Fiskal Operasional)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-500 mb-0.5">Tahun Penilaian:</label>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">2026</span>
                </div>
              </div>
            </div>

            {/* Step 2: Profil Nilai Baku (DV) (Subbab 3.6.1) */}
            <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Langkah 2: Profil Nilai Baku (DV)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Subbab 3.6.1
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-neutral-500 mb-0.5">Pilih Profil Default Value:</label>
                  <select
                    disabled={assessmentStatus !== 'pending_submission' && assessmentStatus !== 'pending_member_revision'}
                    value={dvProfile}
                    onChange={(e) => setDvProfile(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                  >
                    <option value="system_default">Nilai Baku Sistem PalmGHG RSPO (Bawaan)</option>
                    <option value="parent_entity">Profil Entitas Induk (Parent Entity - PE)</option>
                    <option value="custom">Profil Khusus Buatan Pengguna (Custom Verified)</option>
                  </select>
                </div>

                <div className="p-2 rounded bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-500">
                  {dvProfile === 'system_default' && 'Menerapkan faktor emisi baku resmi RSPO V5 dari IPCC 2019 Refinement, Hooijer 2010, dan UK DEFRA 2023.'}
                  {dvProfile === 'parent_entity' && 'Menggunakan profil parameter standar yang ditetapkan oleh kantor pusat grup perusahaan.'}
                  {dvProfile === 'custom' && 'Nilai khusus pada biomassa atau pupuk wajib diverifikasi auditor LS dengan bukti ilmiah.'}
                </div>
              </div>
            </div>

            {/* Step 3: Nomor Permohonan Audit & Pengajuan (Subbab 3.7) */}
            <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Langkah 3: Pengajuan Penilaian
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Subbab 3.7
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-neutral-500 mb-0.5">Nomor Permohonan Audit (Modul Audit):</label>
                  <input
                    type="text"
                    disabled={assessmentStatus !== 'pending_submission' && assessmentStatus !== 'pending_member_revision'}
                    value={auditAppNumber}
                    onChange={(e) => setAuditAppNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 mb-0.5">Lembaga Sertifikasi (LS) Terakreditasi:</label>
                  <input
                    type="text"
                    disabled
                    value={cbName}
                    className="w-full px-2.5 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                  />
                </div>

                <div className="pt-2">
                  <button
                    disabled={assessmentStatus !== 'pending_submission' && assessmentStatus !== 'pending_member_revision'}
                    onClick={handleSubmitAssessment}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold transition-all shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ajukan Penilaian (Submit Assessment)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Status Summary for Data Tabs (Subbab 3.6.3) */}
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Pemeriksaan Status Kelengkapan Tab Data (Subbab 3.6.3.1 Input Wajib)
              </h3>
              <span className="text-[10px] text-neutral-400">
                Warna Hijau = Data Lengkap & Valid
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-800/50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 block">Pabrik: TBS & Ekstraksi</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400">OER 21.5% · KER 5.2%</span>
                </div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>

              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-800/50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 block">Pabrik: POME & Methane</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Capture 90% · Biogas M3</span>
                </div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>

              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-800/50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 block">Kebun: Data Tanam & Gambut</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Drainase 60 cm (Baik)</span>
                </div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>

              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-800/50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 block">Kebun: Pupuk & WTT BBM</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400">NI/UI Treated · Scope 3 Cat 3</span>
                </div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUDITOR VIEW: REVIEW & DECISION WORKFLOW (Subbab 3.8 & Diagram 10) */}
      {activeRole === 'auditor' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400">
                    Panel Verifikasi Auditor Lembaga Sertifikasi (LS)
                  </span>
                  <span className="text-xs text-neutral-400">·</span>
                  <span className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">
                    Permohonan: {auditAppNumber}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Lakukan peninjauan data operasional, periksa bukti verifikasi lapangan, dan tentukan keputusan audit.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSubTab('verification_log')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  title="Buka Log Verifikasi & Tanda Tangan Digital untuk 8 Tahapan"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Log TTD & Bukti Audit</span>
                </button>
                {assessmentStatus === 'pending_cb_review' && (
                  <button
                    onClick={handleStartReview}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Mulai Peninjauan (Start Review)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tab-by-Tab Auditor Review Decision Table */}
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 text-[11px] uppercase text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50">
                    <th className="p-2.5">Tab Komponen Penilaian</th>
                    <th className="p-2.5">Keputusan Auditor</th>
                    <th className="p-2.5">Catatan Verifikasi & Komentar Auditor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-[11px]">
                  {Object.entries(tabDecisions).map(([tabKey, dec]) => {
                    const tabLabels: Record<string, string> = {
                      mill_tbs: 'Pabrik: Sumber TBS & Alokasi',
                      mill_extraction: 'Pabrik: Ekstraksi CPO & PK',
                      mill_pome: 'Pabrik: POME & Methane Capture',
                      mill_energy: 'Pabrik: Energi & Ekspor Listrik',
                      estate_planting: 'Kebun: Data Tanam & LUC 25y',
                      estate_peat: 'Kebun: Gambut & Tata Kelola Air',
                      estate_removals: 'Kebun: Serapan Konservasi & Tegakan',
                      estate_fert_fuel: 'Kebun: Pupuk NI/UI & Bahan Bakar',
                    };

                    return (
                      <tr key={tabKey}>
                        <td className="p-2.5 font-semibold text-neutral-900 dark:text-neutral-100">
                          {tabLabels[tabKey] || tabKey}
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setTabDecisions({
                                  ...tabDecisions,
                                  [tabKey]: { ...dec, approved: true },
                                });
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                dec.approved
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                              }`}
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => {
                                setTabDecisions({
                                  ...tabDecisions,
                                  [tabKey]: { ...dec, approved: false },
                                });
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                !dec.approved
                                  ? 'bg-red-600 text-white'
                                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                              }`}
                            >
                              Tidak Disetujui
                            </button>
                          </div>
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={dec.comments}
                            onChange={(e) => {
                              setTabDecisions({
                                ...tabDecisions,
                                [tabKey]: { ...dec, comments: e.target.value },
                              });
                            }}
                            className="w-full px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Final Decision Action Buttons (Subbab 3.8.2 & Diagram 10) */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Tombol Keputusan Akhir Auditor (Final Decision)
              </h4>

              <div className="flex flex-wrap items-center gap-2">
                {/* Save Draft */}
                <button
                  onClick={() => showFeedback('Draf peninjauan disimpan. Keputusan sementara tersimpan tanpa penyelesaian.')}
                  className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold"
                >
                  Simpan sebagai Draf (Save as Draft)
                </button>

                {/* Request Revision */}
                <button
                  onClick={handleRequestRevision}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition-all shadow-xs"
                >
                  Minta Revisi (Request Revision)
                </button>

                {/* Reject Assessment */}
                <button
                  onClick={() => {
                    const reason = prompt('Masukkan alasan penolakan penilaian:');
                    if (reason) {
                      setRejectionReason(reason);
                      setAssessmentStatus('rejected');
                      showFeedback(`Penilaian ditolak: "${reason}"`);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all shadow-xs"
                >
                  Tolak Penilaian (Reject Assessment)
                </button>

                {/* Approve Assessment */}
                <button
                  onClick={handleApproveAssessment}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  Setujui Penilaian (Approve Assessment)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
