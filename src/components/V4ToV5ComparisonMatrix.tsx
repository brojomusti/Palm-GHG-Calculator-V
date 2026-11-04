import React, { useState } from 'react';
import {
  GitCompare,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Search,
  Filter,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface ComparisonRow {
  component: string;
  category: 'estate' | 'mill';
  v4Methodology: string;
  v5Methodology: string;
  impactTag: 'Dampak Signifikan' | 'Pergeseran Metodologi' | 'Persyaratan Baru' | 'Tetap / Tidak Berubah';
  tagColor: string;
  rationale: string;
}

export const V4ToV5ComparisonMatrix: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'estate' | 'mill'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const rows: ComparisonRow[] = [
    // Baris Komponen Kebun (Estate)
    {
      component: 'Sumber Pasokan TBS (Source of FFB)',
      category: 'estate',
      v4Methodology: '1. TBS dipasok ke PKS sendiri\n2. TBS dipasok ke tempat lain',
      v5Methodology: 'Struktur data inti tetap dipertahankan, melacak volume fisik tonase TBS yang diterima pabrik.',
      impactTag: 'Tetap / Tidak Berubah',
      tagColor: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
      rationale: 'Pelacakan tonase fisik TBS dalam rantai pasok menjaga kesinambungan historis dengan siklus audit sertifikasi sebelumnya.',
    },
    {
      component: 'Data Tanam & Perubahan Penggunaan Lahan (LUC)',
      category: 'estate',
      v4Methodology: 'Seluruh rincian data tanam, termasuk area konservasi yang digabungkan di dalam catatan blok kebun.',
      v5Methodology: 'Hanya mencakup data tanam murni; area konservasi kini dicatat terpisah di bawah Serapan Karbon (Carbon Removals). Diberlakukan amortisasi linier Gross LUC berbobot 25 tahun. Penambahan akuntansi konversi lahan garapan (cropland). Gross LUC dan sekuestrasi tanaman wajib dilaporkan terpisah tanpa saling meniadakan (netting).',
      impactTag: 'Pergeseran Metodologi',
      tagColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      rationale: 'Penyelarasan ketat dengan GHG Protocol Land Sector and Removals (LSR) Standard v1.1. Emisi kotor (gross) tidak boleh lagi disamarkan melalui pengurangan langsung serapan biologis tanaman.',
    },
    {
      component: 'Drainase Lahan Gambut (Peat Soil)',
      category: 'estate',
      v4Methodology: 'Berdasarkan data luas penanaman di tanah gambut dan pengukuran kedalaman saluran drainase.',
      v5Methodology: 'Faktor emisi mendasar tetap dipertahankan (~54,6 tCO₂e/ha/tahun untuk lahan gambut tropis terdrainase). Pelaporan dipisahkan secara tegas di bawah Scope 1.',
      impactTag: 'Tetap / Tidak Berubah',
      tagColor: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
      rationale: 'RSPO terus mengacu pada konsensus ilmiah IPCC mengenai laju dekomposisi dan emisi oksidasi lahan gambut tropis.',
    },
    {
      component: 'Serapan Karbon Konservasi (Carbon Removals)',
      category: 'estate',
      v4Methodology: 'Berdasarkan data tanam, dilaporkan per kebun (area hutan dan non-hutan digabung menjadi satu kategori).',
      v5Methodology: 'Akuntansi konservasi diperluas: Total area konservasi dipilah secara rinci menjadi Konservasi Hutan (Forest Conservation), Konservasi Non-Hutan (riparian/sempadan sungai, padang rumput, semak belukar), Konservasi Lahan Gambut (Peatland Conservation), serta opsi serapan karbon terverifikasi lainnya.',
      impactTag: 'Persyaratan Baru',
      tagColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      rationale: 'Memberikan resolusi ekologis yang lebih tinggi terhadap keanekaragaman cadangan karbon (carbon pools) sesuai ketentuan GHG Protocol LSR Standard v1.1.',
    },
    {
      component: 'Kelapa Sawit Pensiun Tegakan (Standing Oil Palm)',
      category: 'estate',
      v4Methodology: 'Tidak dicakup / tidak memperoleh kredit serapan emisi pada V4.',
      v5Methodology: 'FITUR BARU: Opsi akuntansi sekuestrasi karbon untuk tanaman kelapa sawit tegakan yang berusia lebih dari 25 tahun setelah seluruh kegiatan pemanenan komersial dihentikan.',
      impactTag: 'Persyaratan Baru',
      tagColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      rationale: 'Memberikan pengakuan atas pemeliharaan cadangan biomassa karbon pada pohon sawit tua yang tidak ditebang tanpa mengganggu reservoir karbon tanah.',
    },
    {
      component: 'Akuntansi Pupuk Kimia & Organik (Fertiliser)',
      category: 'estate',
      v4Methodology: 'Penggunaan pupuk anorganik sintetis, rincian transportasi, dan sumber pasokan pupuk.',
      v5Methodology: 'Aplikasi limbah POME, Kompos, & Janjang Kosong (EFB) ke lahan dipindahkan dari modul Pabrik (Mill) ke modul Kebun (Estate). Penambahan jenis pupuk yang diberi Nitrification Inhibitor (NI) dan Urease Inhibitor (UI) dengan faktor penurunan emisi N₂O.',
      impactTag: 'Dampak Signifikan',
      tagColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
      rationale: 'Teknologi inhibitor secara ilmiah menekan nitrifikasi dan volatilisasi nitrogen, menurunkan emisi langsung N₂O tanah sebesar ~35%. Penempatan aplikasi bahan organik di modul Kebun mencerminkan lokasi pelepasan emisi aktual di lapangan.',
    },
    {
      component: 'Bahan Bakar & Konsumsi Energi Kebun',
      category: 'estate',
      v4Methodology: 'Hanya mencatat jenis dan total volume bahan bakar yang digunakan.',
      v5Methodology: 'Pemisahan BARU: Pembakaran stasioner (genset/pompa) vs pembakaran bergerak (traktor/truk). Penambahan emisi hulu bahan bakar (Well-To-Tank/WTT) pada Scope 3 Kategori 3. Pemisahan pelaporan karbon biogenik (biodiesel B35/B40). Penambahan Scope 2 untuk konsumsi listrik grid PLN di perumahan dan bengkel kebun.',
      impactTag: 'Dampak Signifikan',
      tagColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
      rationale: 'Menjamin batas operasional yang komprehensif bagi fasilitas pendukung kebun serta transparansi rantai pasok energi hulu (FERA).',
    },

    // Baris Komponen Pabrik (Mill)
    {
      component: 'Informasi Pemasok TBS & Batas Kendali Operasional',
      category: 'mill',
      v4Methodology: 'Daftar pemasok yang memasok TBS ke pabrik kelapa sawit.',
      v5Methodology: 'Struktur pengumpulan data tetap, namun terdapat penegasan definisi pemasok dan klasifikasi Scope berdasarkan Kendali Operasional (Directly Managed = Scope 1 & 2; Independent / Unmanaged = Scope 3 Kategori 1 Pembelian TBS & Kategori 4 Angkutan).',
      impactTag: 'Pergeseran Metodologi',
      tagColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      rationale: 'Mencegah kesalahan klasifikasi pasokan pihak ketiga independen sebagai emisi operasional langsung perusahaan sesuai batas GHG Protocol.',
    },
    {
      component: 'Produksi & Ekstraksi Produk Sawit',
      category: 'mill',
      v4Methodology: '1. Produksi CPO (ton)\n2. Produksi Inti Sawit / PK (ton)',
      v5Methodology: 'Integrasi dari V4: Produksi CPO, PK, Cangkang (PKS), dan timbulan Janjang Kosong (EFB) dicatat secara sistematis dan terpadu.',
      impactTag: 'Tetap / Tidak Berubah',
      tagColor: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
      rationale: 'Menyelaraskan neraca massa material antara hasil ekstraksi minyak dan produk sampingan biomassa.',
    },
    {
      component: 'Pengolahan Limbah POME & Akuntansi Metana',
      category: 'mill',
      v4Methodology: 'POME diukur dalam satuan ton; persentase dialirkan ke kompos/kolam; COD sebelum & sesudah anaerobik (mg/L); % penangkapan metana.',
      v5Methodology: 'POME diukur dalam satuan m³ (beralih dari ton!). COD inlet ditentukan berdasarkan sistem WWTP (mg/L). Biogas dihasilkan (m³), kandungan metana (%), efisiensi penangkapan (%). Rincian pemanfaatan: Gas Engine, Boiler, Open Flare (efisiensi 98%), dan Enclosed Flare (efisiensi 99,5%).',
      impactTag: 'Dampak Signifikan',
      tagColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
      rationale: 'Pengukuran volumetrik dalam m³ menghilangkan ketidakakuratan konversi densitas; efisiensi pembakaran metana yang ketat memperhitungkan slip metana yang tidak terbakar.',
    },
    {
      component: 'Konsumsi Bahan Bakar Pabrik (Mill Fuel)',
      category: 'mill',
      v4Methodology: '1. Pengolahan TBS (Milling)\n2. Pemecahan Inti Sawit (Palm Kernel Crushing / PKC)',
      v5Methodology: 'Hanya pengolahan TBS yang termasuk dalam batas sertifikasi UoC PKS (pabrik pemecah kernel/PKC dipindahkan ke luar batas UoC). Mencakup emisi hulu bahan bakar (Scope 3 WTT) dan pelaporan terpisah karbon biogenik boiler.',
      impactTag: 'Pergeseran Metodologi',
      tagColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      rationale: 'Menyelaraskan batas fisik sertifikasi UoC murni pada ekstraksi minyak mentah; pengolahan lanjutan kernel expeller merupakan aktivitas rantai nilai hilir terpisah.',
    },
    {
      component: 'Ekspor Biomassa untuk Pembangkit Listrik',
      category: 'mill',
      v4Methodology: '1. Ekspor Cangkang Sawit (PKS)\n2. Ekspor Janjang Kosong (EFB) untuk pembangkitan listrik.',
      v5Methodology: 'Digabungkan dari V4, dan DIPERLUAS mencakup Serat Mesokarp (Mesocarp Fibre) untuk pembangkitan listrik eksternal. Pemanfaatan biomassa lainnya dicatat pada modul Bahan Bakar & Pupuk Kebun.',
      impactTag: 'Persyaratan Baru',
      tagColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      rationale: 'Memungkinkan PKS yang mengekspor surplus serat mesokarp kering ke pembangkit listrik industri untuk mengklaim kredit penghindaran emisi pengganti batubara yang sah.',
    },
  ];

  const filteredRows = rows.filter((r) => {
    const matchesCategory = filterCategory === 'all' || r.category === filterCategory;
    const matchesSearch =
      r.component.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.v5Methodology.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rationale.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Kartu Pengantar & Ikhtisar */}
      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Modul 5
              </span>
              <span className="text-xs text-neutral-400">·</span>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Matriks Perbandingan Perubahan Metodologi PalmGHG V4 ke V5
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-1 max-w-3xl">
              Panduan komparatif resmi yang memetakan pembaruan metodologi pada komponen Kebun (Estate) dan Pabrik (Mill), diselaraskan dengan standar GHG Protocol Land Sector and Removals (LSR) Standard v1.1.
            </p>
          </div>

          {/* Filter dan Pencarian */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari parameter atau metodologi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 w-52"
              />
            </div>

            <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filterCategory === 'all'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Semua Komponen
              </button>
              <button
                onClick={() => setFilterCategory('estate')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filterCategory === 'estate'
                    ? 'bg-white dark:bg-neutral-700 text-emerald-800 dark:text-emerald-400 shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Kebun / Estate ({rows.filter((r) => r.category === 'estate').length})
              </button>
              <button
                onClick={() => setFilterCategory('mill')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filterCategory === 'mill'
                    ? 'bg-white dark:bg-neutral-700 text-amber-800 dark:text-amber-400 shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                PKS / Mill ({rows.filter((r) => r.category === 'mill').length})
              </button>
            </div>
          </div>
        </div>

        {/* Bilah 5 Pilar Utama Pembaruan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mt-4 pt-2">
          <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40">
            <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase">1. Data Tanam & LUC</div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
              Amortisasi linier Gross LUC berbobot 25 tahun; pelaporan terpisah untuk serapan karbon.
            </p>
          </div>
          <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40">
            <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase">2. Serapan Karbon (Removals)</div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
              Diperluas mencakup konservasi Hutan, Non-Hutan (sempadan sungai/semak), dan Lahan Gambut.
            </p>
          </div>
          <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40">
            <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase">3. Sawit Pensiun Tegakan</div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
              Opsi sekuestrasi untuk kelapa sawit usia {'>'}25 tahun setelah aktivitas panen komersial dihentikan.
            </p>
          </div>
          <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40">
            <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase">4. Pupuk Inhibitor (NI/UI)</div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
              Inhibitor nitrifikasi dan urease menurunkan emisi langsung N₂O tanah sebesar ~35%.
            </p>
          </div>
          <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40">
            <div className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase">5. POME dalam m³ & COD</div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
              Pengukuran beralih ke volumetrik m³, COD inlet WWTP, efisiensi flaring, & ekspor serat mesokarp.
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Matriks Perbandingan */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse min-w-[880px]">
          <thead>
            <tr className="border-b border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
              <th className="w-[18%] p-3 font-bold">Komponen & Area Operasional</th>
              <th className="w-[28%] p-3 font-bold text-neutral-600 dark:text-neutral-400">Metodologi PalmGHG V4 (Lama)</th>
              <th className="w-[32%] p-3 font-bold text-emerald-800 dark:text-emerald-400">Metodologi PalmGHG V5 (Pembaruan)</th>
              <th className="w-[22%] p-3 font-bold">Rasional Teknis & Keselarasan RSPO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {filteredRows.map((r, i) => (
              <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 align-top">
                <td className="p-3">
                  <div className="font-bold text-neutral-900 dark:text-neutral-100">{r.component}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] uppercase font-semibold text-neutral-500">
                      {r.category === 'estate' ? 'Kebun / Basis Pasokan' : 'Operasional Pabrik (PKS)'}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${r.tagColor}`}>
                      {r.impactTag}
                    </span>
                  </div>
                </td>
                <td className="p-3 font-sans text-neutral-600 dark:text-neutral-400 whitespace-pre-line leading-relaxed">
                  {r.v4Methodology}
                </td>
                <td className="p-3 font-sans text-neutral-900 dark:text-neutral-100 font-medium whitespace-pre-line leading-relaxed bg-emerald-50/20 dark:bg-emerald-950/10">
                  {r.v5Methodology}
                </td>
                <td className="p-3 text-neutral-600 dark:text-neutral-400 leading-relaxed text-[11px]">
                  {r.rationale}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
