import React from 'react';
import { X, Award, Eye, ShieldCheck } from 'lucide-react';

interface FilosofiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FilosofiModal({ isOpen, onClose }: FilosofiModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      {/* Container Box Modal */}
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Arti & Filosofi Logo SISTA</h2>
            <p className="text-xs text-blue-600 font-bold tracking-wider uppercase mt-0.5">Sistem Asesmen Pintar</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Lembaran Filosofi */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar text-slate-600 text-sm leading-relaxed">
          
          {/* Banner Visual Mini */}
          <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50 p-6 rounded-2xl border border-blue-100/30 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 p-0.5 shadow-md mb-3 flex items-center justify-center text-white font-black text-xl">
              S
            </div>
            <p className="text-xs font-bold text-slate-500 italic max-w-md">
              "Aplikasi ini hadir bukan sekadar untuk menguji, melainkan sebagai kompas pintar yang menuntun penggunanya menuju pertumbuhan dan pencapaian standar tertinggi."
            </p>
          </div>

          {/* Bagian 1: Simbol */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-500" /> 1. Filosofi Bentuk dan Simbol
            </h3>
            <ul className="space-y-3 pl-3 border-l-2 border-slate-100">
              <li>
                <strong className="text-slate-800 font-bold">Huruf "S" yang Terintegrasi:</strong> Lengkungan dinamis pembentuk huruf "S" merepresentasikan identitas kuat SISTA. Menunjukkan fleksibilitas, adaptabilitas, dan kesinambungan sistem dalam mengikuti perkembangan dunia pendidikan.
              </li>
              <li>
                <strong className="text-slate-800 font-bold">Ikon Otak (Brain & Jaringan Teknologi):</strong> Melambangkan kecerdasan (Pintar), inovasi, dan pemrosesan data digital/AI yang bekerja secara logis, akurat, dan objektif.
              </li>
              <li>
                <strong className="text-slate-800 font-bold">Tanda Centang (Checkmark) & Panah ke Atas:</strong> Centang hijau emerald melambangkan esensi utama asesmen—yaitu validasi, ketepatan, dan sukses. Ujung centang yang mentransformasi jadi panah ke atas melambangkan pertumbuhan (<span className="italic">growth</span>) serta peningkatan mutu berkelanjutan.
              </li>
              <li>
                <strong className="text-slate-800 font-bold">Dua Bintang di Dalam Centang:</strong> Melambangkan pencapaian tinggi, kualitas prima (<span className="italic">excellence</span>), dan standar mutu target utama asesmen.
              </li>
              <li>
                <strong className="text-slate-800 font-bold">Lingkaran Bingkai (Enclosing Circle):</strong> Lingkaran luar solid melambangkan kesatuan, keamanan data yang terproteksi, serta ekosistem yang utuh terintegrasi dalam wadah SISTA.
              </li>
            </ul>
          </div>

          {/* Bagian 2: Warna */}
          <div className="space-y-4 pt-2">
            <h3 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" /> 2. Filosofi Warna
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-100/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-blue-600 block shrink-0" />
                  <h4 className="font-bold text-xs text-blue-900 uppercase tracking-tight">Biru (Blue)</h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">Mewakili profesionalisme, stabilitas, teknologi tinggi, dan kepercayaan tata kelola data sensitif.</p>
              </div>

              <div className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-100/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 block shrink-0" />
                  <h4 className="font-bold text-xs text-emerald-900 uppercase tracking-tight">Hijau Zamrud</h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">Melambangkan pertumbuhan, kreativitas, dan efisiensi agar asesmen terasa modern dan tidak kaku.</p>
              </div>

              <div className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-100/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-amber-400 block shrink-0" />
                  <h4 className="font-bold text-xs text-amber-900 uppercase tracking-tight">Kuning Emas</h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">Melambangkan kesuksesan, kejayaan, dan visi kuat mencetak output generasi berkualitas emas.</p>
              </div>
            </div>
          </div>

          {/* Kesimpulan */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs italic text-slate-500 text-center flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
            "Secara keseluruhan, logo SISTA memancarkan citra platform digital cerdas, andal, dan dinamis."
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-700 transition-all shadow-sm cursor-pointer"
          >
            Selesai Membaca
          </button>
        </div>

      </div>
    </div>
  );
}
