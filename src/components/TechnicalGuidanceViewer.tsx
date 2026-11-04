import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  FileText,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Layers,
  Sparkles,
  ShieldCheck,
  Scale,
  Compass,
  ArrowRight,
  HelpCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Building,
  TreePine,
  Factory,
  Database,
} from 'lucide-react';

export const TechnicalGuidanceViewer: React.FC<{ isDark?: boolean }> = ({ isDark = false }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'methodology' | 'prisma' | 'standards' | 'defaults' | 'faq'
  >('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Official Document Reference
  const docMetadata = {
    title: 'Petunjuk dan Panduan Teknis PalmGHG Versi 5.0',
    code: 'RSPO-GUI-T04-001 V5 IND',
    scope: 'PalmGHG V5 / P&C RSPO 2024 Indikator 7.6.1 (K) & 7.6.2 (K)',
    approval: 'Komite Tetap Standar (SSC), 2 Oktober 2026',
    effectiveDate: '1 November 2026',
    contact: 'ghg@rspo.org / prismahelpdesk@rspo.org',
    filePath: '/assets/aistudio/PalmGHG-V5-Technical-Guidance-and-Manual-IN-20261101_b990c979.pdf',
    fileName: 'PalmGHG-V5-Technical-Guidance-and-Manual-IN-20261101.pdf',
  };

  // Official FAQs from Lampiran 5 (25 Official Questions)
  const officialFaqs = [
    {
      qNum: 1,
      cat: 'Tentang PalmGHG',
      q: 'Apa yang dimaksud dengan PalmGHG?',
      a: 'PalmGHG adalah Kalkulator Gas Rumah Kaca terkait Sawit yang dikembangkan oleh RSPO untuk membantu perusahaan perkebunan dan operator pabrik kelapa sawit mengukur dan mengelola emisi gas rumah kaca (GRK) mereka, guna memenuhi persyaratan keberlanjutan P&C RSPO.',
    },
    {
      qNum: 2,
      cat: 'Tentang PalmGHG',
      q: 'Mengapa PalmGHG dikembangkan?',
      a: 'Sebagai bagian dari Indikator 7.6.1 (K) dan 7.6.2 (K) P&C RSPO 2024, PalmGHG menyediakan metode terstandardisasi, transparan, dan berbasis ilmiah untuk menilai emisi GRK di semua kegiatan operasional sawit, mengidentifikasi peluang reduksi emisi, dan membuktikan kepatuhan.',
    },
    {
      qNum: 3,
      cat: 'Tentang PalmGHG',
      q: 'Kapan alat PalmGHG pertama kali dikembangkan dan bagaimana perkembangannya?',
      a: 'RSPO membentuk GHGWG Mei 2009. Versi 1.0 (Excel) diluncurkan 2012, Versi 2.0 & 3.0 (Desktop) pada 2014 & 2016, Versi 4 (Web) pada 2019. Pada Agustus 2022, GHGTF merevisi kalkulator agar selaras dengan Standar GHG Protocol menghasilkan PalmGHG Versi 5.0 pada 2026.',
    },
    {
      qNum: 4,
      cat: 'Tentang PalmGHG',
      q: 'Siapa yang menggunakan alat PalmGHG?',
      a: 'Perusahaan perkebunan dan pabrik kelapa sawit Anggota RSPO bersertifikat secara wajib, serta Lembaga Sertifikasi (auditor independen) untuk memverifikasi laporan selama audit sertifikasi RSPO.',
    },
    {
      qNum: 5,
      cat: 'PalmGHG V5 dalam prisma',
      q: 'Bagaimana PalmGHG V5 diintegrasikan ke dalam prisma?',
      a: 'PalmGHG V5 terintegrasi langsung dalam prisma (Palm Resource Information and Sustainability MAnagement), menyatukan pengelolaan entitas, pelaporan data aktivitas kebun dan pabrik, serta modul audit sertifikasi RSPO.',
    },
    {
      qNum: 6,
      cat: 'Pembaruan V4 ke V5',
      q: 'Apa saja penyempurnaan utama dari PalmGHG V4 ke V5?',
      a: 'Penyelarasan penuh dengan Standar GHG Protocol & LSR v1.1, pemilahan Scope 1, 2, dan 3 terpisah, pelaporan terpisah emisi karbon biogenik, konservasi hutan/non-hutan/gambut, dan sekuestrasi tanaman, pembaruan faktor emisi Tier 1/2 dari IPCC AR6/Wetlands/DEFRA, serta penambahan komponen tegakan sawit pensiun >25 tahun.',
    },
    {
      qNum: 7,
      cat: 'Standar Internasional',
      q: 'Bagaimana PalmGHG V5 selaras dengan Standar GHG Protocol?',
      a: 'Mengadopsi pendekatan cradle-to-gate (dari hulu hingga gerbang pabrik), batas operasional kendali operasional, klasifikasi Scope 1, Scope 2, dan Scope 3 (Kategori 1, 3 FERA, 4), serta pemenuhan Standar Sektor Lahan dan Penyerapan Karbon (LSR).',
    },
    {
      qNum: 8,
      cat: 'Peran & Akses',
      q: 'Siapa yang dapat mengakses PalmGHG V5?',
      a: 'Pengguna yang berwenang dari Unit Pengelolaan RSPO (MU) (akses Normal untuk membuat/mengajukan atau View Only) dan Lembaga Sertifikasi (LS/Auditor) yang ditugaskan untuk memverifikasi penilaian.',
    },
    {
      qNum: 9,
      cat: 'Fitur Sistem',
      q: 'Fitur apa saja yang disertakan dalam modul PalmGHG V5 dalam prisma?',
      a: 'Alur kerja terpadu (5 langkah), validasi data real-time dengan kode warna (merah/hijau/abu-abu), profil Nilai Baku (DV) yang fleksibel, lembar ringkasan yang dapat diunduh, dan integrasi otomatis ke Laporan Audit Universal (UAR).',
    },
    {
      qNum: 10,
      cat: 'Akses Sistem',
      q: 'Bagaimana cara mengakses modul PalmGHG V5 yang baru?',
      a: 'Melalui portal prisma resmi di platform.prismabyrspo.org/auth/login, lalu membuka modul PalmGHG pada dasbor utama.',
    },
    {
      qNum: 11,
      cat: 'Data & Perhitungan',
      q: 'Apa yang dimaksud dengan Profil Nilai Baku (DV)?',
      a: 'Profil Default Value yang menentukan faktor emisi baku. Secara bawaan, Profil Sistem PalmGHG RSPO tersedia. Pengguna dapat membuat profil kustom dengan justifikasi sumber/referensi yang akan diverifikasi auditor.',
    },
    {
      qNum: 12,
      cat: 'Data & Perhitungan',
      q: 'Data apa yang perlu saya siapkan untuk penilaian PalmGHG?',
      a: 'Data periode 12 bulan (Jan-Des atau Jul-Jun). Pabrik: pasokan TBS per asosiasi, produksi CPO/PK/PKS/EFB, volume & COD POME, konsumsi BBM & listrik, ekspor listrik/biomassa. Kebun: data penanaman & LUC, peta gambut & tata air, konservasi, pupuk sintetis/organik/NI-UI, BBM & listrik.',
    },
    {
      qNum: 13,
      cat: 'Data & Perhitungan',
      q: 'Bagaimana cara melakukan penghitungan?',
      a: 'Setelah semua input wajib lengkap dan kesalahan validasi terselesaikan, tombol "Lihat Ringkasan" diaktifkan untuk menjalankan penghitungan emisi V5 secara otomatis.',
    },
    {
      qNum: 14,
      cat: 'Data & Perhitungan',
      q: 'Apakah saya dapat melakukan penghitungan ulang setelah melakukan perubahan?',
      a: 'Ya. Setiap kali data input atau profil DV diubah, ringkasan hasil harus dihasilkan kembali dan ditinjau sebelum diajukan kepada auditor.',
    },
    {
      qNum: 15,
      cat: 'Audit & Sertifikasi',
      q: 'Apakah hasil emisi PalmGHG diverifikasi?',
      a: 'Ya, semua penilaian yang diajukan wajib ditinjau dan diverifikasi oleh auditor pihak ketiga independen dari Lembaga Sertifikasi (LS) dalam prisma.',
    },
    {
      qNum: 16,
      cat: 'Audit & Sertifikasi',
      q: 'Bagaimana cara mengajukan penilaian PalmGHG untuk diverifikasi?',
      a: 'Masukkan Nomor Permohonan Audit dari Modul Audit, verifikasi penunjukan LS, lalu klik tombol "Ajukan Penilaian" (Submit Assessment). Status akan beralih ke "Menunggu Peninjauan LS".',
    },
    {
      qNum: 17,
      cat: 'Audit & Sertifikasi',
      q: 'Apa yang akan ditinjau oleh LS/auditor?',
      a: 'Validitas seluruh Nilai Khusus (Custom Values) pada profil DV, kesesuaian data aktivitas operasional pada seluruh tab pabrik dan kebun, serta konsistensi catatan bukti pendukung.',
    },
    {
      qNum: 18,
      cat: 'Audit & Sertifikasi',
      q: 'Apakah saya dapat mengubah detail penilaian pada audit yang telah disetujui?',
      a: 'Tidak. Setelah penilaian disetujui oleh auditor LS dalam prisma, proses verifikasi selesai dan data terkunci permanen untuk masuk ke Universal Audit Report (UAR).',
    },
    {
      qNum: 19,
      cat: 'Hasil & Pelaporan',
      q: 'Bagaimana hasil PalmGHG dapat dimanfaatkan dalam laporan perusahaan?',
      a: 'Perusahaan dapat mengagregasikan hasil seluruh PKS dan kebun di bawah grup induk untuk pelaporan keberlanjutan korporasi dan Komunikasi Kemajuan Tahunan (ACOP) RSPO.',
    },
    {
      qNum: 20,
      cat: 'Hasil & Pelaporan',
      q: 'Bagaimana PalmGHG mengintegrasikan pelacakan TBS untuk kemamputelusuran?',
      a: 'Melacak pasokan TBS dari Perkebunan Sendiri, Grup Perusahaan, dan Pihak Ketiga, serta mengalokasikan emisi kebun ke pabrik secara proporsional berbasis alokasi fisik.',
    },
    {
      qNum: 21,
      cat: 'Hasil & Pelaporan',
      q: 'Apa perbedaan model rantai pasok RSPO dalam hal emisi GRK?',
      a: 'Model Mass Balance (MB), Segregation (SG), atau Identity Preserved (IP) menentukan penelusuran emisi fisik di sepanjang rantai nilai downstream, dilaporkan dalam tCO2e/tProduk.',
    },
    {
      qNum: 22,
      cat: 'Hasil & Pelaporan',
      q: 'Seberapa besar pengurangan emisi yang diharapkan dari Minyak Sawit Bersertifikat RSPO?',
      a: 'Kajian LCA 2026 menunjukkan sawit bersertifikat RSPO menghasilkan emisi GRK 36% lebih rendah dibandingkan sawit non-sertifikat, menjadi tolok ukur awal estimasi Scope 3 bagi pembeli hilir.',
    },
    {
      qNum: 23,
      cat: 'Kebijakan Data',
      q: 'Apakah RSPO membagikan data PalmGHG kepada pihak ketiga?',
      a: 'RSPO dapat membagikan data teragregasi untuk tujuan riset dengan menjaga kerahasiaan penuh tanpa mengungkapkan identitas perusahaan individual.',
    },
    {
      qNum: 24,
      cat: 'Platform',
      q: 'Apakah PalmGHG V5 tersedia dalam berbagai bahasa?',
      a: 'Ya, modul PalmGHG V5 dalam prisma mendukung 6 bahasa: Inggris, Indonesia, Thai, Spanyol, Prancis, dan Mandarin.',
    },
    {
      qNum: 25,
      cat: 'Bantuan & Dukungan',
      q: 'Apa yang harus saya lakukan jika menemukan persoalan di PalmGHG?',
      a: 'Hubungi layanan bantuan prisma di prismahelpdesk@rspo.org untuk kendala sistem dan platform, atau tim GHG RSPO di ghg@rspo.org untuk pertanyaan metodologi teknis.',
    },
  ];

  // Filter FAQs
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return officialFaqs;
    const q = searchQuery.toLowerCase();
    return officialFaqs.filter(
      (f) =>
        f.q.toLowerCase().includes(q) ||
        f.a.toLowerCase().includes(q) ||
        f.cat.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {/* OFFICIAL DOCUMENT BANNER */}
      <div className="p-5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl text-white shadow-md border border-emerald-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                Dokumen Resmi RSPO
              </span>
              <span className="text-xs text-emerald-200 font-mono">
                Kode: {docMetadata.code}
              </span>
              <span className="text-xs text-emerald-300">·</span>
              <span className="text-xs text-emerald-200">
                Berlaku: {docMetadata.effectiveDate}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {docMetadata.title}
            </h1>

            <p className="text-xs text-emerald-100 max-w-3xl leading-relaxed">
              Panduan teknis dan operasional resmi bagi Unit Pengelolaan RSPO (MU) dan Lembaga Sertifikasi (LS/Auditor) untuk penghitungan dan pelaporan emisi gas rumah kaca berbasis platform <strong>prisma</strong>, selaras dengan Standar P&C RSPO 2024 (Indikator 7.6.1 & 7.6.2) dan GHG Protocol LSR v1.1.
            </p>
          </div>

          {/* Document Reference Badge */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800/80 text-emerald-100 text-xs font-semibold border border-emerald-700/60">
              <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
              <span>RSPO-GUI-T04-001 V5 IND</span>
            </span>
          </div>
        </div>
      </div>

      {/* TOP NAVIGATION FOR TECHNICAL GUIDANCE CHAPTERS */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Bab 1 & 2: Ringkasan & Metodologi</span>
          </button>

          <button
            onClick={() => setActiveTab('methodology')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'methodology'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Subbab 2.3: Parameter Kebun & Pabrik</span>
          </button>

          <button
            onClick={() => setActiveTab('prisma')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'prisma'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Bab 3: Alur prisma & Audit LS</span>
          </button>

          <button
            onClick={() => setActiveTab('standards')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'standards'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Lampiran 1-3: Keselarasan GHGP & LSR</span>
          </button>

          <button
            onClick={() => setActiveTab('defaults')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'defaults'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Lampiran 4: Nilai Baku (DV) & Faktor Emisi</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'faq'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Lampiran 5: Tanya Jawab Resmi (FAQ)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & EVOLUTION */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Metadata & Evolution */}
            <div className="lg:col-span-1 space-y-4">
              <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Identitas Dokumen
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-neutral-500">Judul Dokumen:</span>
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">{docMetadata.title}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Kode & Versi:</span>
                    <p className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{docMetadata.code}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Persetujuan:</span>
                    <p className="text-neutral-800 dark:text-neutral-200">{docMetadata.approval}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Mandat Standar:</span>
                    <p className="text-neutral-800 dark:text-neutral-200">Indikator 7.6.1 (K) & 7.6.2 (K) P&C RSPO 2024</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Kontak Resmi:</span>
                    <p className="font-mono text-neutral-700 dark:text-neutral-300">{docMetadata.contact}</p>
                  </div>
                </div>
              </div>

              {/* Timeline Diagram 1 */}
              <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Diagram 1: Perjalanan PalmGHG</span>
                </h3>
                <div className="relative border-l-2 border-emerald-500/40 ml-3 pl-4 space-y-3 text-xs">
                  <div>
                    <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">2009 - 2011</span>
                    <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">Pembentukan GHGWG untuk mengidentifikasi area mitigasi di kebun dan pabrik.</p>
                  </div>
                  <div>
                    <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">2012</span>
                    <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">Peluncuran PalmGHG Versi 1.0 berbasis 15 lembar templat Excel.</p>
                  </div>
                  <div>
                    <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">2014 & 2016</span>
                    <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">Pembaruan desktop software Versi 2.0 dan 3.0 (emisi LUC wajib dilaporkan).</p>
                  </div>
                  <div>
                    <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">2019</span>
                    <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">PalmGHG Versi 4.0 berbasis web mandiri (daring/luring).</p>
                  </div>
                  <div>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">2026</span>
                    <p className="text-neutral-800 dark:text-neutral-200 text-[11px] font-medium">PalmGHG Versi 5.0 terintegrasi penuh dalam <strong>prisma</strong>, selaras GHG Protocol & LSR Standard v1.1.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Key Changes Table 1.2 & Boundaries */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Tabel 1.2: Perubahan Utama PalmGHG V4 ke V5
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                    Matriks Komparasi Resmi
                  </span>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700 text-[11px] uppercase text-neutral-500">
                        <th className="p-2 w-1/4">Dimensi</th>
                        <th className="p-2 w-3/8 text-neutral-600 dark:text-neutral-400">PalmGHG V4</th>
                        <th className="p-2 w-3/8 text-emerald-700 dark:text-emerald-400 font-bold">PalmGHG V5 (Baru)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      <tr>
                        <td className="p-2 font-semibold">Akses Sistem</td>
                        <td className="p-2 text-neutral-600 dark:text-neutral-400">Platform web mandiri tersendiri</td>
                        <td className="p-2 text-emerald-700 dark:text-emerald-300 font-medium">Terintegrasi langsung dalam prisma (sertifikasi & kemamputelusuran terpusat)</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold">Pemetaan Standar</td>
                        <td className="p-2 text-neutral-600 dark:text-neutral-400">Tidak dipetakan ke GHG Protocol</td>
                        <td className="p-2 text-emerald-700 dark:text-emerald-300 font-medium">Selaras GHG Protocol Corporate Standard, Product Standard, & Land Sector and Removals (LSR) v1.1</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold">Struktur Cakupan</td>
                        <td className="p-2 text-neutral-600 dark:text-neutral-400">Emisi total teragregasi tanpa Scope</td>
                        <td className="p-2 text-emerald-700 dark:text-emerald-300 font-medium">Kategori Scope 1, Scope 2, Scope 3 (Cat 1, Cat 3 FERA, Cat 4) dan Informasi Opsional terpisah</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold">Batasan Operasional</td>
                        <td className="p-2 text-neutral-600 dark:text-neutral-400">Kebun, Pabrik, dan KCP</td>
                        <td className="p-2 text-emerald-700 dark:text-emerald-300 font-medium">Cradle-to-gate: Kebun dan Pabrik Kelapa Sawit (KCP dipisah)</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold">Penyerap Karbon</td>
                        <td className="p-2 text-neutral-600 dark:text-neutral-400">Hanya konservasi hutan dan tanaman sawit</td>
                        <td className="p-2 text-emerald-700 dark:text-emerald-300 font-medium">Diperluas: Konservasi Lahan Gambut, Non-Hutan (semak/padang rumput), dan Tegakan Sawit Pensiun {'>'}25 tahun</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold">Penyelarasan Pupuk & Bahan Bakar</td>
                        <td className="p-2 text-neutral-600 dark:text-neutral-400">Faktor emisi standar V4</td>
                        <td className="p-2 text-emerald-700 dark:text-emerald-300 font-medium">Pupuk berinhibitor (NI/UI), pelaporan terpisah Upstream WTT & Biogenik, aplikasi EFB/POME dicatat di Kebun</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Subbab 2.1 & 2.2: Pengecualian Resmi */}
              <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Subbab 2.1 & 2.2: Batasan Cradle-to-Gate & Pengecualian Emisi</span>
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Berdasarkan pendekatan <em>cradle-to-gate</em>, sumber emisi hulu tertentu dikecualikan dari PalmGHG V5 agar kalkulator tetap praktis dan konsisten:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                    <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Dikecualikan di Scope 1:</span>
                    <ul className="list-disc list-inside text-neutral-600 dark:text-neutral-400 space-y-0.5">
                      <li>Kebocoran refrigeran sistem AC di kantor/fasilitas kebun & pabrik</li>
                    </ul>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                    <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Dikecualikan di Scope 2:</span>
                    <ul className="list-disc list-inside text-neutral-600 dark:text-neutral-400 space-y-0.5">
                      <li>Pembelian uap untuk digunakan sendiri</li>
                      <li>Pembelian energi pemanasan/pendinginan eksternal</li>
                    </ul>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                    <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Dikecualikan di Scope 3:</span>
                    <ul className="list-disc list-inside text-neutral-600 dark:text-neutral-400 space-y-0.5">
                      <li>Hulu: Kategori 2, 5, 6, 7, 8</li>
                      <li>Hilir: Kategori 9 hingga 15</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: METHODOLOGY BREAKDOWN */}
      {activeTab === 'methodology' && (
        <div className="space-y-6">
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>Subbab 2.3: Metodologi Penghitungan Teknis Kebun & Pabrik</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Box 1: Sumber TBS & Alokasi Kendali Operasional */}
              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 space-y-2">
                <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                  <span>2.3.1.1 Sumber TBS & Batasan Asosiasi</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950">Subbab 2.3.1.1</span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                  Produksi TBS dari kebun adalah total TBS yang dipasok ke PKS dinilai ditambah TBS yang dipasok ke tempat lain (pabrik lain/pusat pengumpulan). Emisi kebun dialokasikan ke pabrik secara proporsional berdasarkan rasio volume TBS yang dipasok.
                </p>
                <div className="p-2 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-[10px]">
                  Faktor Alokasi = TBS dipasok ke PKS dinilai / Total TBS dihasilkan kebun
                </div>
              </div>

              {/* Box 2: Data Penanaman, Amortisasi 25 Thn & Pengelolaan Lahan */}
              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 space-y-2">
                <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                  <span>2.3.1.2 Data Penanaman & LUC Amortised</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950">Subbab 2.3.1.2</span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                  Perubahan pemanfaatan lahan langsung (dLUC) dihitung menggunakan pendekatan tahunan tertimbang dengan <strong>amortisasi linier 25 tahun</strong>. Petak dengan umur {'>'}25 tahun memiliki emisi LUC nol. Konversi dari lahan pertanian (tanaman pangan/pohon) dicatat sebagai <em>Pengelolaan Lahan</em> dengan emisi N2O mineralisasi bahan organik tanah.
                </p>
                <div className="p-2 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[10px] text-neutral-600 dark:text-neutral-400">
                  Jika tutupan lahan lain (infrastruktur) tidak diungkapkan, nilai baku sebesar <strong>5,5%</strong> otomatis diterapkan.
                </div>
              </div>

              {/* Box 3: Gambut & Tata Kelola Air (60/75/100 cm) */}
              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 space-y-2">
                <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                  <span>2.3.1.3 Emisi Gambut & Tinggi Muka Air</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950">Subbab 2.3.1.3</span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                  Emisi CO2 oksidasi gambut = Luas tertanam gambut (ha) × Kedalaman drainase (cm) × Faktor emisi (Hooijer et al. 2010). Emisi N2O = Luas × Faktor emisi N2O langsung (IPCC Wetlands).
                </p>
                <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px]">
                  <div className="p-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <span className="block text-emerald-600 font-bold">60 cm</span>
                    <span className="text-[9px] text-neutral-500">Air Terkelola Baik</span>
                  </div>
                  <div className="p-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <span className="block text-amber-600 font-bold">75 cm</span>
                    <span className="text-[9px] text-neutral-500">Air Sebagian</span>
                  </div>
                  <div className="p-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <span className="block text-red-600 font-bold">100 cm</span>
                    <span className="text-[9px] text-neutral-500">Tanpa Pengelolaan</span>
                  </div>
                </div>
              </div>

              {/* Box 4: Tegakan Sawit > 25 Tahun [BARU] */}
              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 space-y-2">
                <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                  <span>2.3.1.5 Tegakan Sawit Pensiun {'>'}25 Tahun [BARU]</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950">Subbab 2.3.1.5</span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                  Estimasi sekuestrasi karbon tanaman untuk sawit berumur {'>'}25 tahun yang semua kegiatan produksinya telah dihentikan (tidak dipupuk dan tidak dipanen). Dihitung dari faktor aktual dikalikan luas, wajib mencantumkan referensi format APA (jurnal, buku, prosiding) yang diverifikasi auditor.
                </p>
                <div className="p-2 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-[10px] text-neutral-700 dark:text-neutral-300">
                  Sekuestrasi = Luas sawit pensiun (ha) × Faktor sekuestrasi aktual (tCO₂e/ha.tahun)
                </div>
              </div>

              {/* Box 5: POME Skenario 1 vs Skenario 2 */}
              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 space-y-2">
                <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                  <span>2.3.2.3 POME: Skenario 1 vs Skenario 2</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950">Subbab 2.3.2.3</span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                  <strong>Skenario 1 (Data tidak tersedia)</strong>: Dihitung dari TBS diolah × rasio baku (0,60 tPOME/tTBS), COD rata-rata (50.000 mg/L), efisiensi kolam (85%), MCF (0,8), nilai baku biogas (28 m³/tPOME).<br />
                  <strong>Skenario 2 (Data tersedia)</strong>: Menggunakan data pengukuran volume POME dan konsentrasi COD aktual yang dicatat MU.
                </p>
              </div>

              {/* Box 6: Ekspor Biomassa & Mesocarp Fibre */}
              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 space-y-2">
                <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                  <span>2.3.2.6 Ekspor Biomassa (PKS, EFB, Serat Mesokarp)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950">Subbab 2.3.2.6</span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                  Emisi terhindarkan dari penjualan biomassa berlebih untuk energi eksternal, dihitung berdasarkan faktor substitusi batubara. Pada V5, cakupan diperluas mencakup <strong>serat mesokarp (MF)</strong> di samping cangkang (PKS) dan tandan kosong (EFB).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRISMA WORKFLOW & AUDIT */}
      {activeTab === 'prisma' && (
        <div className="space-y-6">
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Bab 3: Alur Kerja PalmGHG V5 dalam Platform prisma & Prosedur Audit</span>
            </h2>

            {/* 5-Step Workflow Cards (Diagram 4) */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
              <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 space-y-1">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Langkah 1</span>
                <div className="font-bold text-neutral-900 dark:text-neutral-100">Buka PalmGHG</div>
                <p className="text-neutral-500 text-[11px]">Masuk ke prisma, pilih modul PalmGHG pada dasbor.</p>
              </div>

              <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Langkah 2</span>
                <div className="font-bold text-neutral-900 dark:text-neutral-100">Buat Penilaian</div>
                <p className="text-neutral-500 text-[11px]">Pilih MU, periode pelaporan (Jan-Des/Jul-Jun), dan tahun.</p>
              </div>

              <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 space-y-1">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Langkah 3</span>
                <div className="font-bold text-neutral-900 dark:text-neutral-100">Selesaikan Penilaian</div>
                <p className="text-neutral-500 text-[11px]">Pilih Profil DV, isi data pabrik & kebun, atasi sel merah.</p>
              </div>

              <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 space-y-1">
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Langkah 4</span>
                <div className="font-bold text-neutral-900 dark:text-neutral-100">Ajukan Penilaian</div>
                <p className="text-neutral-500 text-[11px]">Masukkan No Permohonan Audit, tetapkan LS, klik Submit.</p>
              </div>

              <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 space-y-1">
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">Langkah 5</span>
                <div className="font-bold text-neutral-900 dark:text-neutral-100">Verifikasi LS</div>
                <p className="text-neutral-500 text-[11px]">Auditor meninjau profil DV & input data, beri persetujuan.</p>
              </div>
            </div>

            {/* Status Flow Indicators (Diagram 5) */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Diagram 5: Siklus 6 Indikator Status PalmGHG V5
              </h4>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  Menunggu Pengajuan
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                <span className="px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                  Menunggu Peninjauan LS
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                <span className="px-3 py-1 rounded-full font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">
                  Peninjauan Sedang Berlangsung
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                <span className="px-3 py-1 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  Menunggu Revisi Anggota
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                <span className="px-3 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Disetujui LS (Telah Diaudit)
                </span>
                <span className="px-3 py-1 rounded-full font-semibold bg-red-100 text-red-800 border border-red-300 ml-2">
                  Ditolak
                </span>
              </div>
            </div>

            {/* Subbab 3.6.3: Aturan Validasi Sel Input (Warna) */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Subbab 3.6.3: Aturan Validasi Visual Sel & Tab
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500 shrink-0 mt-0.5"></div>
                  <div>
                    <span className="font-bold text-red-900 dark:text-red-300">Warna Merah</span>
                    <p className="text-[11px] text-red-700 dark:text-red-400 mt-0.5">Input belum lengkap atau tidak valid. Menghalangi tombol kalkulasi dan pengajuan.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0 mt-0.5"></div>
                  <div>
                    <span className="font-bold text-emerald-900 dark:text-emerald-300">Warna Hijau</span>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">Data valid sedang dimasukkan atau tab telah selesai lengkap.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-neutral-200 bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-700">
                  <div className="w-3.5 h-3.5 rounded-full bg-neutral-400 shrink-0 mt-0.5"></div>
                  <div>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">Warna Abu-Abu</span>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">Data tersimpan lengkap disertai konfirmasi "[Nama Data] berhasil diperbarui".</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STANDARDS ALIGNMENT (LAMPIRAN 1 & 2) */}
      {activeTab === 'standards' && (
        <div className="space-y-6">
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-700" />
              <span>Lampiran 1 & 2: Keselarasan dengan Standar GRK & LSR Internasional</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 space-y-2">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 text-xs block">
                  Standar Internasional yang Selaras
                </span>
                <ul className="space-y-1.5 text-neutral-600 dark:text-neutral-400 text-[11px]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>GHG Protocol Corporate Standard</strong>: Kendali operasional & pemisahan Scope 1, 2, 3.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>GHG Protocol Product Standard</strong>: Alokasi fisik berbasis berat untuk CPO & PK.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>ISO 14064-1 & ISO 14067</strong>: Prinsip transparansi, akuntabilitas, dan verifikasi tahunan pihak ketiga.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>ISO 14040/44</strong>: Pendekatan siklus hidup cradle-to-gate.</span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 space-y-2">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 text-xs block">
                  Keselarasan Standar LSR GHGP (Land Sector & Removals)
                </span>
                <ul className="space-y-1.5 text-neutral-600 dark:text-neutral-400 text-[11px]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>Bab 7</strong>: Persyaratan 10 & 11 penghitungan emisi dLUC amortisasi 25 tahun.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>Bab 9</strong>: Persyaratan 14 & 15 emisi CO2 biogenik neto pengelolaan lahan pertanian.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>Bab 10</strong>: Persyaratan 16 emisi produksi pengelolaan lahan (pupuk, bahan bakar, energi).</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>Bab 12</strong>: Persyaratan 19-23 pelaporan penyerapan karbon konservasi & permanensi.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DEFAULT VALUES & EMISSION FACTORS (LAMPIRAN 4) */}
      {activeTab === 'defaults' && (
        <div className="space-y-6">
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-700" />
                <span>Lampiran 4: Nilai Baku (Default Values) dan Faktor Emisi Resmi</span>
              </h2>
              <span className="text-xs text-neutral-500 font-mono">
                Sumber: IPCC 2019 Refinement, Hooijer 2010, UK DEFRA 2023, MPOB 2015
              </span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 text-[11px] uppercase text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50">
                    <th className="p-2.5">Komponen</th>
                    <th className="p-2.5">Parameter / Nilai Baku</th>
                    <th className="p-2.5">Satuan</th>
                    <th className="p-2.5">Referensi Resmi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-[11px]">
                  <tr>
                    <td className="p-2.5 font-bold text-neutral-800 dark:text-neutral-200">Gambut (Peat)</td>
                    <td className="p-2.5 font-mono">Faktor Emisi CO2 Gambut</td>
                    <td className="p-2.5 font-mono">tCO₂e/ha.tahun.cm</td>
                    <td className="p-2.5 text-neutral-600 dark:text-neutral-400">Hooijer et al. (2010)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-neutral-800 dark:text-neutral-200">Gambut (Peat)</td>
                    <td className="p-2.5 font-mono">Faktor Emisi N2O Langsung</td>
                    <td className="p-2.5 font-mono">kgN₂O-N/ha.tahun</td>
                    <td className="p-2.5 text-neutral-600 dark:text-neutral-400">IPCC 2013 Wetland Supplement</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-neutral-800 dark:text-neutral-200">Kedalaman Drainase</td>
                    <td className="p-2.5 font-mono">Baik: 60 cm | Sebagian: 75 cm | Tanpa: 100 cm</td>
                    <td className="p-2.5 font-mono">cm</td>
                    <td className="p-2.5 text-neutral-600 dark:text-neutral-400">Indikator 7.4.1 P&C RSPO 2024</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-neutral-800 dark:text-neutral-200">Pupuk (Transportasi)</td>
                    <td className="p-2.5 font-mono">Pengangkutan Laut: 6.000 km | Darat: 200 km (×2 pp)</td>
                    <td className="p-2.5 font-mono">km & kgCO₂e/km.t</td>
                    <td className="p-2.5 text-neutral-600 dark:text-neutral-400">UK DEFRA 2023 / GHGTF 2017</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-neutral-800 dark:text-neutral-200">POME (Rasio Baku)</td>
                    <td className="p-2.5 font-mono">0,60 tPOME per ton TBS diolah</td>
                    <td className="p-2.5 font-mono">tPOME/tTBS</td>
                    <td className="p-2.5 text-neutral-600 dark:text-neutral-400">MPOB (2015)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-neutral-800 dark:text-neutral-200">POME (Rata-rata COD)</td>
                    <td className="p-2.5 font-mono">50.000 mg/L (Default Skenario 1)</td>
                    <td className="p-2.5 font-mono">mg/L</td>
                    <td className="p-2.5 text-neutral-600 dark:text-neutral-400">Rata-rata 9 PKS PalmGHG</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-neutral-800 dark:text-neutral-200">POME (Biogas Terbentuk)</td>
                    <td className="p-2.5 font-mono">28 m³ biogas per ton POME</td>
                    <td className="p-2.5 font-mono">m³ biogas/tPOME</td>
                    <td className="p-2.5 text-neutral-600 dark:text-neutral-400">Sodri & Septriana (2022)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-neutral-800 dark:text-neutral-200">POME (Kandungan CH4)</td>
                    <td className="p-2.5 font-mono">60% Metana dalam biogas</td>
                    <td className="p-2.5 font-mono">%</td>
                    <td className="p-2.5 text-neutral-600 dark:text-neutral-400">A Aziz et al. (2019)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-neutral-800 dark:text-neutral-200">POME (Efisiensi Flaring)</td>
                    <td className="p-2.5 font-mono">Flaring Terbuka: 98% | Flaring Tertutup: 99,5%</td>
                    <td className="p-2.5 font-mono">% destruksi</td>
                    <td className="p-2.5 text-neutral-600 dark:text-neutral-400">UNFCCC CDM AMS-III.H</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-neutral-800 dark:text-neutral-200">Ekspor Biomassa</td>
                    <td className="p-2.5 font-mono">PKS (Cangkang), EFB (Janjang Kosong), MF (Serat Mesokarp)</td>
                    <td className="p-2.5 font-mono">kgCO₂e/kg biomass</td>
                    <td className="p-2.5 text-neutral-600 dark:text-neutral-400">IPCC 2006 Vol 2 (Substitusi Batubara)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: OFFICIAL FAQ (LAMPIRAN 5) */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-700" />
                  <span>Lampiran 5: Tanya Jawab Umum Resmi PalmGHG V5 (25 Pertanyaan)</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Teks resmi tanya jawab dari Dokumen Petunjuk dan Panduan Teknis RSPO-GUI-T04-001 V5 IND.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Cari FAQ (misal: gambut, POME, audit)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                />
              </div>
            </div>

            {/* Accordion List */}
            <div className="space-y-2">
              {filteredFaqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={faq.qNum}
                    className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden transition-all bg-white dark:bg-neutral-900"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 pr-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                          {faq.qNum}
                        </span>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">
                            {faq.cat}
                          </span>
                          <span className="text-neutral-900 dark:text-neutral-100">
                            {faq.q}
                          </span>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180 text-emerald-600' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed bg-neutral-50/50 dark:bg-neutral-800/30 border-t border-neutral-100 dark:border-neutral-800">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
