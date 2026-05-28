import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  School, 
  User, 
  ClipboardCheck, 
  GraduationCap, 
  FileText, 
  ChevronDown, 
  ListChecks, 
  LogOut, 
  ChevronLeft,
  Camera 
} from 'lucide-react';
import { cn } from '../lib/utils';
// --- 1. TAMBAHKAN IMPORT MODAL DI SINI ---
import FilosofiModal from './FilosofiModal'; 

export type NavItem = 'dashboard' | 'diagnostik' | 'formatif' | 'sumatif' | 'sts' | 'sas';

interface SidebarProps {
  active: NavItem;
  onChange: (item: NavItem) => void;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  schoolName?: string;
}

export default function Sidebar({ 
  active, 
  onChange, 
  onLogout, 
  isCollapsed, 
  onToggleCollapse,
  schoolName 
}: SidebarProps) { 
  const [phOpen, setPhOpen] = useState(() => {
    return ['diagnostik', 'formatif', 'sumatif'].includes(active);
  });

  // --- 2. TAMBAHKAN STATE KONTROL UNTUK MODAL ---
  const [isFilosofiOpen, setIsFilosofiOpen] = useState(false);

  // --- OTOMATISASI PENUTUPAN MENU DROPDOWN ---
  useEffect(() => {
    if (['diagnostik', 'formatif', 'sumatif'].includes(active)) {
      setPhOpen(true);
    } else {
      setPhOpen(false);
    }
  }, [active]);

  const MenuItem = ({ id, icon: Icon, label, sub = false, className }: { id: NavItem, icon: any, label: string, sub?: boolean, className?: string }) => (
    <button
      onClick={() => onChange(id)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all group whitespace-nowrap text-left",
        active === id 
          ? "bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-lg shadow-blue-500/20" 
          : "text-slate-500 hover:bg-blue-50 hover:text-blue-700",
        sub && "pl-12 py-2 text-sm",
        className
      )}
    >
      <Icon className={cn(
        "w-5 h-5 transition-transform group-hover:scale-110 shrink-0", 
        active === id ? "text-white" : "text-blue-400 group-hover:text-blue-600"
      )} />
      <span>{label}</span>
    </button>
  );

  const [schoolLogo, setSchoolLogo] = useState<string | null>(() => {
    return localStorage.getItem('sista_school_logo');
  });
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
        alert("Ukuran logo terlalu besar. Maksimal 2 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSchoolLogo(base64String);
        localStorage.setItem('sista_school_logo', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <aside className={cn(
      "h-screen bg-white border-r border-slate-200 flex flex-col flex-shrink-0 sticky top-0 no-print z-40 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-0 -translate-x-full overflow-hidden opacity-0 border-r-0 pointer-events-none" : "w-84 translate-x-0"
    )}>
      <div className="p-8 pb-4 flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-8">
          <div className="flex items-center gap-3 min-w-0">
            
            <label 
              htmlFor="school-logo-input"
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 p-0.5 shadow-lg overflow-hidden group shrink-0 cursor-pointer relative block"
              title="Klik untuk ganti logo sekolah"
            >
              <div className="w-full h-full bg-white rounded-[10px] overflow-hidden flex items-center justify-center relative">
                <img 
                  src={schoolLogo || "/logo.png"} 
                  alt="SISTA" 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.fallback-icon');
                      if (fallback) {
                        fallback.classList.remove('hidden');
                      }
                    }
                  }} 
                />
                <GraduationCap className="text-blue-600 w-6 h-6 fallback-icon hidden" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>
            </label>

            <input 
              type="file" 
              id="school-logo-input" 
              className="hidden" 
              accept="image/*" 
              onChange={handleLogoUpload} 
            />
            <div className="min-w-0">
              <h1 className="text-xs font-black text-slate-900 tracking-tight uppercase leading-tight line-clamp-2 whitespace-normal">
                {schoolName || "SD Negeri Kajulangko"}
              </h1>
              <div className="flex items-center gap-1.5 mt-1 overflow-hidden">
                 <div className="h-1.5 w-1.5 bg-amber-400 rounded-full shrink-0" />
                 <p className="text-[10px] font-bold text-blue-700 tracking-widest uppercase truncate">SISTA-App</p>
              </div>
            </div>
          </div>

          <button 
            onClick={onToggleCollapse}
            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all cursor-pointer shrink-0"
            title="Sembunyikan Menu"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1 overflow-y-auto custom-scrollbar pr-2 flex-1">
          <MenuItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          
          <div className="pt-5 pb-2 px-4 flex items-center gap-2">
            <div className="h-px w-3 bg-slate-200" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Instrumen Penilaian</p>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          
          <div>
            <button 
              onClick={() => setPhOpen(!phOpen)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap group text-left",
                phOpen ? "bg-blue-50/50 text-blue-700" : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
              )}
            >
              <div className="flex items-center gap-3">
                <ClipboardCheck className={cn(
                  "w-5 h-5 shrink-0 transition-colors", 
                  phOpen ? "text-blue-600" : "text-blue-400 group-hover:text-blue-600"
                )} />
                <span className="text-sm">Penilaian Harian</span>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform duration-200", 
                phOpen ? "rotate-180 text-blue-600" : "text-slate-400 group-hover:text-blue-500"
              )} />
            </button>
            
            {phOpen && (
              <div className="mt-1 space-y-1 border-l-2 border-blue-100 ml-6 pl-2">
                <MenuItem id="diagnostik" icon={ListChecks} label="Asesmen Awal" sub className="pl-4" />
                <MenuItem id="formatif" icon={FileText} label="Asesmen Formatif" sub className="pl-4" />
                <MenuItem id="sumatif" icon={ClipboardCheck} label="Asesmen Sumatif" sub className="pl-4" />
              </div>
            )}
          </div>

          <MenuItem id="sts" icon={FileText} label="Sumatif Tengah Semester" className="text-sm" />
          <MenuItem id="sas" icon={FileText} label="Sumatif Akhir Semester" className="text-sm" />

          {/* Area Banner Logo Baru */}
          <div 
            onClick={() => setIsFilosofiOpen(true)}
            className="mt-8 px-2 pb-4 cursor-pointer"
            title="Lihat Filosofi & Arti Logo SISTA"
          >
            <div className="w-full h-28 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative group bg-slate-50 flex items-center justify-center">
              <img 
                src="/banner-sidebar.png" 
                alt="Banner Informasi" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const fallback = parent.querySelector('.fallback-banner');
                    if (fallback) {
                      fallback.classList.remove('hidden');
                      fallback.classList.add('flex');
                    }
                  }
                }} 
              />
              <div className="fallback-banner hidden flex-col items-center justify-center text-slate-400 w-full h-full absolute inset-0">
                <School className="w-6 h-6 mb-1 opacity-50" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-center px-2">Banner<br/>Logo Space</span>
              </div>
            </div>
          </div>

        </nav>
      </div>

      <div className="mt-auto py-4 px-8 border-t border-slate-100 bg-slate-50/50">
        <div className="text-center flex flex-col items-center justify-center gap-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">Versi Aplikasi 2026.1</p>
        </div>
      </div>

      {/* --- 4. RENDER MODAL DI BAGIAN PALING BAWAH --- */}
      <FilosofiModal isOpen={isFilosofiOpen} onClose={() => setIsFilosofiOpen(false)} />
    </aside>
  );
}
