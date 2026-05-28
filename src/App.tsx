import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Sparkles, AlertCircle, Settings, ClipboardCheck, 
  ChevronRight, ArrowRight, Save, RotateCcw, ListPlus, Trash2, 
  ShieldCheck, CornerDownRight, LayoutDashboard, GraduationCap, 
  FileText, Users, CheckCircle, BarChart3, HelpCircle, LogOut, Camera,
  Menu, PenLine, Check
} from 'lucide-react';
import { SoalFormData, GeneratedSoal } from './types';
import ModulTable from './components/ModulTable';
import Login from './components/Login';
import Sidebar, { NavItem } from './components/Sidebar';
import GeneratorForm from './components/GeneratorForm';
import { generateSoalOnly } from './lib/gemini';
import { cn } from './lib/utils';

// Inspiring & reassuring Indonesian loading messages
const LOADING_MESSAGES = [
  "Sista AI sedang menganalisis Capaian Pembelajaran...",
  "Merancang instrumen soal dengan Level Kognitif yang dipilih...",
  "Menyusun stimulus soal...",
  "Mengolah desain Soal yang bermakna...",
  "Sedang memastikan keselarasan butir soal dengan materi pokok...",
  "Mempersiapkan lembar matriks kisi-kisi dan rubrik penilaian...",
  "Selesai! Menyajikan dokumen Soal premium dalam hitungan detik..."
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('sista_logged_in') === 'true';
  });

  const [currentMenu, setCurrentMenu] = useState<NavItem>(() => {
    return (localStorage.getItem('sista_current_menu') as NavItem) || 'dashboard';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sista_sidebar_collapsed') === 'true';
  });

  const [profileName, setProfileName] = useState<string>(() => {
    return localStorage.getItem('sista_profile_name') || 'Fidhal Touna';
  });

  const [profileRole, setProfileRole] = useState<string>(() => {
    return localStorage.getItem('sista_profile_role') || 'Guru Kelas';
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfileName, setTempProfileName] = useState(profileName);
  const [tempProfileRole, setTempProfileRole] = useState(profileRole);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('Sista_sidebar_collapsed', String(next));
      return next;
    });
  };

  const [profilePic, setProfilePic] = useState<string | null>(() => {
    return localStorage.getItem('Sista_profile_pic');
  });

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran gambar terlalu besar. Maksimal 2 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfilePic(base64String);
        localStorage.setItem('Sista_profile_pic', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const [activeSeconds, setActiveSeconds] = useState<number>(0);
  const [currentDateString, setCurrentDateString] = useState<string>("");

  useEffect(() => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const date = new Date();
    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
    let cityName = "Jakarta";
    if (timeZone.indexOf('/') !== -1) {
      const rawCity = timeZone.split('/').pop() || "Jakarta";
      cityName = rawCity.replace(/_/g, ' ');
    }
    if (cityName === "Ulaanbaatar") cityName = "Kuala Lumpur";
    
    setCurrentDateString(`${dayName}, ${dayNum} ${monthName} ${year}`);

    let startTimeStr = sessionStorage.getItem('Sista_session_start');
    if (!startTimeStr) {
      startTimeStr = Date.now().toString();
      sessionStorage.setItem('Sista_session_start', startTimeStr);
    }
    const startTime = parseInt(startTimeStr, 10);

    const updateTimer = () => {
      const diff = Math.floor((Date.now() - startTime) / 1000);
      setActiveSeconds(diff > 0 ? diff : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatSesiTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    let timeStr = "";
    if (hrs > 0) {
      timeStr += `${hrs} jam `;
    }
    if (mins > 0 || hrs > 0) {
      timeStr += `${mins} menit `;
    }
    timeStr += `${secs} detik`;
    return timeStr;
  };

  const [activeView, setActiveView] = useState<'form' | 'viewer' | 'dashboard'>(() => {
    return currentMenu === 'dashboard' ? 'dashboard' : 'form';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadMessageIdx, setLoadMessageIdx] = useState(0);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Consolidated result storage
  const [generatedResult, setGeneratedResult] = useState<GeneratedSoal | null>(() => {
    const saved = localStorage.getItem('sista_generated_result');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  const [lastFormInput, setLastFormInput] = useState<any>(() => {
    const saved = localStorage.getItem('sista_last_form_input');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem('sista_logged_in', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('sista_current_menu', currentMenu);
    if (currentMenu === 'dashboard') {
      setActiveView('dashboard');
    } else {
      setActiveView('form');
    }
  }, [currentMenu]);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadMessageIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 3500);
    } else {
      setLoadMessageIdx(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // 1. TAMBAHKAN FUNGSI INI DI SINI
  const playWelcomeSpeech = (name: string) => {
    if ('speechSynthesis' in window) {
      // Hentikan suara yang mungkin sedang berjalan sebelumnya
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(`Selamat Datang ${name}, Apa Kabar Lea...`);
      utterance.lang = 'id-ID'; // Mengatur bahasa ke Indonesia
      utterance.rate = 0.9;     // Mengatur kecepatan bicara agar terdengar natural (1 adalah normal)
      utterance.pitch = 1.0;    // Nada suara normal
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Browser Anda tidak mendukung fitur Web Speech API (Suara AI).");
    }
  };
  
  const handleLogin = () => {
    setIsLoggedIn(true);
    // 2. PANGGIL FUNGSI SUARA SAAT TOMBOL LOGIN DITEKAN
    playWelcomeSpeech(profileName);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('sista_logged_in');
    localStorage.removeItem('sista_generated_result');
    localStorage.removeItem('sista_last_form_input');
    setGeneratedResult(null);
    setLastFormInput(null);
    setCurrentMenu('dashboard');
  };

  const menuChangeHandler = (item: NavItem) => {
    setCurrentMenu(item);
    setErrorText(null);
    if (item !== 'dashboard' && isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
      localStorage.setItem('Sista_sidebar_collapsed', 'false');
    }
  };

  const handleFormSubmit = async (formData: any) => {
    setIsLoading(true);
    setErrorText(null);

    const materialArr = Array.isArray(formData.material) 
      ? formData.material.filter((m: string) => m.trim() !== '') 
      : [String(formData.material)];

    const cognitiveLevelStr = Array.isArray(formData.cognitiveLevel)
      ? formData.cognitiveLevel.join(", ")
      : (formData.cognitiveLevel || "MOTS");

    try {
      let combinedResult: any = {};
      let currentInputData: any = {};

      // ===================================================================
      // JIKA DI MODE EVALUASI (SUMATIF/PH/STS/SAS): GENERATE INSTRUMEN SOAL
      // ===================================================================
      const mappedSoalForm: SoalFormData = {
        schoolName: formData.schoolName,
        subject: formData.subject,
        grade: formData.grade,
        semester: formData.semester,
        phase: formData.phase || "",
        academicYear: formData.academicYear,
        teacherName: formData.teacherName,
        teacherNip: formData.teacherNip,
        principalName: formData.principalName,
        principalNip: formData.principalNip,
        regionName: formData.regionName,
        position: formData.position,
        timeAllocation: formData.timeAllocation,
        cp: formData.cp,
        material: materialArr,
        cognitiveLevel: cognitiveLevelStr,
        questionConfigs: formData.questionConfigs || []
      };

      console.log("Memicu perancangan evaluasi: Membuat lembar soal...");
      const soalResult = await generateSoalOnly(mappedSoalForm);
      
      combinedResult = {
        ...soalResult
      };
      
      currentInputData = mappedSoalForm;

      setGeneratedResult(combinedResult);
      setLastFormInput(currentInputData);
      
      localStorage.setItem('sista_generated_result', JSON.stringify(combinedResult));
      localStorage.setItem('sista_last_form_input', JSON.stringify(currentInputData));
      
      setActiveView('viewer');
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Terjadi kesalahan internal pada server AI.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const getMenuTitle = (menu: NavItem) => {
    switch (menu) {
      case 'dashboard': return 'Dashboard Utama';
      case 'diagnostik': return 'Asesmen Awal';
      case 'formatif': return 'Asesmen Formatif';
      case 'sumatif': return 'Asesmen Sumatif';
      case 'sts': return 'Sumatif Tengah Semester';
      case 'sas': return 'Sumatif Akhir Semester';
      default: return 'Sista';
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white transition-all">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-black z-0 pointer-events-none" />
        
        <div className="z-10 max-w-md w-full text-center space-y-8 animate-fadeIn">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-40 animate-pulse" />
            <div className="w-24 h-24 rounded-full border border-blue-400/40 bg-slate-950/80 flex items-center justify-center shadow-2xl relative">
              <Sparkles className="w-10 h-10 text-blue-400 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold font-display tracking-tight">Merumuskan Asesmen Pembelajaran</h2>
            <p className="text-slate-400 text-xs">Sista AI sedang menyusun Asesmen...</p>
          </div>

          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-teal-400 h-1.5 rounded-full animate-[shimmer_2s_infinite]" style={{ width: '80%', backgroundSize: '200% auto' }} />
          </div>

          <div className="h-10 flex items-center justify-center">
            <p className="text-sm font-medium text-blue-300 animate-pulse text-center leading-relaxed">
              {LOADING_MESSAGES[loadMessageIdx]}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-x-hidden">
      
      <Sidebar 
        active={currentMenu} 
        onChange={menuChangeHandler} 
        onLogout={handleLogout} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        schoolName={lastFormInput?.schoolName} // 3. TAMBAHKAN BARIS INI
      />

      <div className="flex-1 flex flex-col min-w-0 pb-16">
        
        <header className="bg-white border-b border-slate-200 py-4 px-8 flex justify-between items-center sticky top-0 z-35 no-print gap-4">
          <div className="flex-1 min-w-0 flex items-center gap-3">
            {isSidebarCollapsed && (
              <button 
                onClick={handleToggleSidebar}
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-blue-600 hover:text-blue-800 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                title="Tampilkan Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-800 font-display flex items-center gap-1.5">
                {getMenuTitle(currentMenu)}
                {currentMenu !== 'dashboard' && (
                  <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold">
                    DRAFT PANEL
                  </span>
                )}
              </h2>
              <p className="text-xs text-blue-900 font-bold tracking-tight">📍 {currentDateString}</p>
            </div>
          </div>

          <div className="flex justify-center flex-shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-lg border border-emerald-200 font-bold shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Sesi Aktif: {formatSesiTime(activeSeconds)}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-end gap-3 flex-shrink-0">
            {generatedResult && (
              <button 
                onClick={() => setActiveView('viewer')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <FileText className="w-4 h-4 text-slate-500" /> Buka Hasil
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 p-0.5 shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer relative group shrink-0"
                title="Menu Profil & Bantuan"
                id="profile-dropdown-trigger"
              >
                <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center relative">
                  {profilePic ? (
                    <img 
                      src={profilePic} 
                      alt="Profil" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-650 flex items-center justify-center text-white text-sm font-black uppercase">
                      {profileName ? profileName.slice(0, 2).toUpperCase() : "FT"}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow" />
              </button>

              {isProfileDropdownOpen && (
                <div 
                  className="fixed inset-0 z-45 bg-slate-900/5 cursor-default" 
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsEditingProfile(false);
                  }} 
                />
              )}

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.18)] rounded-2xl p-5 z-50 animate-fadeIn text-left text-slate-800">
                  
                  <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                    <div className="relative w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-blue-600 to-emerald-500 shrink-0 shadow-sm">
                      <div className="w-full h-full rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                        {profilePic ? (
                          <img 
                            src={profilePic} 
                            alt="Profil" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-650 flex items-center justify-center text-white font-extrabold uppercase text-base">
                            {profileName ? profileName.charAt(0).toUpperCase() : "F"}
                          </div>
                        )}
                      </div>
                      
                      <label 
                        htmlFor="profile-upload-inp-dropdown-header" 
                        className="absolute -bottom-1 -right-1 w-5.5 h-5.5 bg-blue-600 hover:bg-blue-750 text-white rounded-full flex items-center justify-center cursor-pointer shadow border border-white transition-all scale-100 hover:scale-110"
                        title="Ubah Foto"
                      >
                        <Camera className="w-3 h-3" />
                      </label>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black text-slate-900 leading-tight truncate">{profileName}</h4>
                      <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[8px] font-black tracking-widest uppercase rounded mt-1.5 border border-blue-100">
                        {profileRole}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-1.5">
                    
                    <input 
                      type="file" 
                      id="profile-upload-inp-dropdown-header" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleProfilePicUpload} 
                    />

                    {!isEditingProfile ? (
                      <>
                        <button 
                          onClick={() => {
                            setTempProfileName(profileName);
                            setTempProfileRole(profileRole);
                            setIsEditingProfile(true);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left font-bold text-xs text-slate-650 hover:bg-slate-50 border border-transparent hover:border-slate-200/60 transition-all cursor-pointer group"
                        >
                          <PenLine className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                          <div>
                            <span className="text-slate-800">Edit Profil</span>
                            <p className="text-[9px] text-slate-400 font-normal mt-0.5">Ubah nama, peran/tugas dan foto</p>
                          </div>
                        </button>

                        <a 
                          href="https://wa.me/6285796566825?text=Halo%20Admin%20Sista%20,%20saya%20butuh%20bantuan."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold text-xs text-slate-650 hover:bg-emerald-50/75 border border-transparent hover:border-emerald-100/60 transition-all group"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4 fill-emerald-600 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          <div>
                            <span className="text-emerald-800">Hubungi Bantuan</span>
                            <p className="text-[9px] text-emerald-600 font-normal mt-0.5">Admin WhatsApp</p>
                          </div>
                        </a>

                        <div className="h-px bg-slate-100 my-1" />

                        <button 
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left font-bold text-xs text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer group"
                        >
                          <LogOut className="w-4 h-4 text-rose-500 group-hover:-translate-x-0.5 transition-transform" />
                          <div className="text-left">
                            <span className="text-rose-600 block">Logout Sesi</span>
                            <p className="text-[9px] text-rose-500 font-normal mt-0.5">Keluar &amp; bersihkan data lokal</p>
                          </div>
                        </button>
                      </>
                    ) : (
                      <div className="space-y-4 pt-1 animate-fadeIn">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Nama Profil</label>
                          <input 
                            type="text" 
                            value={tempProfileName}
                            onChange={(e) => setTempProfileName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nama lengkap..."
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Tugas / Jabatan</label>
                          <input 
                            type="text" 
                            value={tempProfileRole}
                            onChange={(e) => setTempProfileRole(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contoh: Guru Kelas, Guru Mapel, Wali Kelas..."
                          />
                          <div className="flex flex-wrap gap-1 mt-2">
                            {["Guru Kelas", "Guru Mapel", "Wali Kelas"].map((role) => (
                              <button
                                key={role}
                                type="button"
                                onClick={() => setTempProfileRole(role)}
                                className="px-2 py-1 bg-slate-150 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-[10px] font-bold rounded-lg transition-all border border-slate-200/40 hover:border-blue-100 cursor-pointer"
                              >
                                {role}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Foto Profil</label>
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                              {profilePic ? (
                                <img src={profilePic} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold bg-slate-300 text-slate-650 uppercase">
                                  {tempProfileName ? tempProfileName.charAt(0).toUpperCase() : "F"}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <label 
                                htmlFor="profile-upload-inp-dropdown-header" 
                                className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-all shadow-sm"
                              >
                                <Camera className="w-3 h-3 text-blue-600" />
                                <span>Ganti Foto</span>
                              </label>
                              <p className="text-[8px] text-slate-400 mt-0.5">Maks 2MB</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => {
                              if (tempProfileName.trim() && tempProfileRole.trim()) {
                                setProfileName(tempProfileName.trim());
                                setProfileRole(tempProfileRole.trim());
                                localStorage.setItem('Sista_profile_name', tempProfileName.trim());
                                localStorage.setItem('Sista_profile_role', tempProfileRole.trim());
                                setIsEditingProfile(false);
                              } else {
                                alert("Nama dan Tugas tidak boleh kosong.");
                              }
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Simpan</span>
                          </button>
                          <button
                            onClick={() => {
                              setTempProfileName(profileName);
                              setTempProfileRole(profileRole);
                              setIsEditingProfile(false);
                            }}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-3 rounded-xl text-xs transition-all cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-8">
          
          {/* A. VIEW: VIEWER RESULT DISPLAY */}
          {activeView === 'viewer' && generatedResult && (
            <div className="animate-fadeIn">
              <ModulTable 
                data={generatedResult} 
                formInput={lastFormInput || {
                  schoolName: "SD Negeri 1 Merdeka",
                  subject: "Umum",
                  grade: "IV",
                  semester: "1",
                  academicYear: "2025/2026",
                  teacherName: "Rista Kasaraeng, S.Pd",
                  teacherNip: "-",
                  principalName: "-",
                  principalNip: "-",
                  regionName: "-",
                  position: "Guru Kelas",
                  timeAllocation: "90 Menit",
                  cp: "-",
                  material: [],
                  cognitiveLevel: "MOTS",
                  meetings: "1",
                  duration: "90 Menit",
                  pedagogicalPractice: "Discovery Learning",
                  graduateDimension: "Bernalar Kritis"
                }}
                onBack={() => setActiveView(currentMenu === 'dashboard' ? 'dashboard' : 'form')}
                mode={currentMenu}
              />
            </div>
          )}

          {/* B. VIEW: DASHBOARD IN WELCOMING HUD */}
          {activeView === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
              
              {/* HERO CARD */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-xl border border-slate-800">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] rounded-full bg-blue-500/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[120%] rounded-full bg-emerald-500/5 blur-[100px]" />

                <div className="relative z-10 max-w-4xl space-y-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span className="text-[10px] font-bold Propercase tracking-widest text-amber-200">Mudahnya Merancang Asesmen Berkualitas</span>
                  </div>
                  
                  <div className="space-y-3">
                    <h2 className="text-3xl md:text-4xl font-black font-display tracking-tight leading-tight">
                      Selamat Datang, {profileName}
                    </h2>
                    <p className="text-slate-300 text-sm leading-relaxed max-w-3xl text-justify">
                      Sista-App adalah Aplikasi Pintar dikembangkan oleh FIDHAL TOUNA AI sebagai Alat Bantu Bapak/Ibu Guru untuk perancangan Asesmen secara instan untuk semua jenjang pendidikan (SD, SMP, SMA, SMK). Cukup masukkan Capaian Pembelajaran dan Materi Pokok, pilih level kognitif berpikir murid, dan biarkan kecerdasan AI menyusun skenario serta instrumen lengkapnya.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <button 
                      onClick={() => menuChangeHandler('sumatif')}
                      className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-6 py-3 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-white/5"
                    >
                      Rancang Asesmen Baru <ArrowRight className="w-4 h-4 text-indigo-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* QUICK STATISTICS BAR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-850">
                <div className="bg-white p-6 rounded-2xl border border-slate-250/70 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pembongkar Instrumen</h5>
                    <p className="text-xl font-extrabold text-slate-800">5 Pilihan Mode Asesmen</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-250/70 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Keamanan & Validasi</h5>
                    <p className="text-xl font-extrabold text-slate-800">Tergembok Aman</p>
                  </div>
                </div>
              </div>

              {/* CONTEXT SHORTCUT LAUNCHERS */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-slate-700 uppercase tracking-widest font-mono">Pilih Target Rancangan</h3>
                <div className="grid grid-cols-1 gap-4">
                  
                  <div 
                    onClick={() => menuChangeHandler('sumatif')}
                    className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-400/50 hover:shadow-md transition-all cursor-pointer flex justify-between items-center group"
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors font-sans">Instrumen Asesmen Kegiatan</h4>
                      <p className="text-xs text-slate-500">Kumpulan pertanyaan berupa PG, PGK, Isian, Benar-Salah, Menjodohkan, atau Uraian bersandarkan level kognitif.</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* C. VIEW: ACTIVE FORM MODE */}
          {activeView === 'form' && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">
                    Penyusunan: {getMenuTitle(currentMenu)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Isilah form penilaian di bawah untuk merancang asesmen secara otomatis berbasis kurikulum nasional.
                  </p>
                </div>
                {generatedResult && (
                  <button 
                    onClick={() => setActiveView('viewer')}
                    className="bg-slate-900 text-white font-bold hover:bg-slate-800 px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow"
                  >
                    Lihat Dokumen Aktif <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {errorText && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex gap-3 text-red-900">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1 leading-relaxed">
                    <p className="font-bold">Gagal Merumuskan Dokumen</p>
                    <p>{errorText}</p>
                    <p className="text-[10px] text-red-500 mt-1">Saran: Hubungi administrator atau periksa kembali isian form Anda.</p>
                  </div>
                </div>
              )}

              <GeneratorForm 
                onSubmit={handleFormSubmit}
                isLoading={isLoading}
                mode={currentMenu}
                setSoalResult={(data) => setGeneratedResult(prev => ({ ...prev, ...data }))}
                setIsLoading={setIsLoading}
              />

            </div>
          )}

        </div>

        <footer className="mt-auto border-t border-slate-200 text-slate-400 py-6 text-center text-xs no-print bg-white px-8">
          <p className="font-medium text-slate-500">Sista-App.</p>
          <p className="mt-1 font-mono text-[10px] text-slate-400">Bukan merupakan aplikasi afiliasi resmi Kemendikdasmen | Powered by Fidhal Touna AI</p>
        </footer>

      </div>

    </div>
  );
}
