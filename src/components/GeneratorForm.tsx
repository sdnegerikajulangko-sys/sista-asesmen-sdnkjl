import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, School, User as UserIcon, Briefcase, GraduationCap, Calendar, BookOpen, Layers, Target, ClipboardList, Trash2, AlertTriangle, Clock, HelpCircle } from 'lucide-react';
import { QuestionType } from '../types';
import { NavItem } from './Sidebar';
import { cn, getAutomaticFase } from '../lib/utils';

interface GeneratorFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  mode: NavItem;
  setSoalResult: (data: any) => void;
  setIsLoading: (loading: boolean) => void;
}

const COGNITIVE_LEVELS = ['LOTS', 'MOTS', 'HOTS'];
const QUESTION_TYPES: QuestionType[] = ['Pilihan Ganda', 'Pilihan Ganda Kompleks', 'Isian Singkat', 'Uraian', 'Benar Salah', 'Menjodohkan'];

// Hanya menggunakan sekolah sebagai kode keamanan
const ALLOWED_SCHOOLS = ["SD Negeri Kajulangko", "SD NEGERI KAJULANGKO", "SDN KAJULANGKO"];

export default function GeneratorForm({ onSubmit, isLoading, mode, setSoalResult, setIsLoading }: GeneratorFormProps) {
  const isMultiMaterialAllowed = mode === 'sts' || mode === 'sas';
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  const [formData, setFormData] = useState<any>(() => {
    const savedData = localStorage.getItem(`sista_form_${mode}`);
    if (savedData) {
      try { return JSON.parse(savedData); } catch (e) { console.error(e); }
    }
    return {
      schoolName: '', teacherName: '', teacherNip: '', position: 'Guru Kelas',
      principalName: '', principalNip: '', regionName: '', academicYear: '',
      level: 'SD', grade: 'I', phase: 'Fase A', semester: 'I / Ganjil', subject: '', timeAllocation: '',
      material: [''], cp: '', withImages: false,
      questionConfigs: [{ type: 'Pilihan Ganda', count: 5, optionCount: 4, scorePerItem: 1 }],
      cognitiveLevel: ['MOTS']
    };
  });

  // Logika diubah: Validasi keamanan HANYA berdasarkan nama sekolah
  const isSecurityValid = ALLOWED_SCHOOLS.some(s => s.toLowerCase() === formData.schoolName.trim().toLowerCase());

  const isMaterialFilled = formData.material.every((mat: string) => mat && mat.trim() !== '');

  const isFormValid = formData.cognitiveLevel.length !== 0 && isSecurityValid && isMaterialFilled;

  useEffect(() => { 
    localStorage.setItem(`sista_form_${mode}`, JSON.stringify(formData)); 
  }, [formData, mode]);

  useEffect(() => {
    setIsQuotaExceeded(false);
    const savedData = localStorage.getItem(`sista_form_${mode}`);
    const checkMultiAllowed = mode === 'sts' || mode === 'sas';
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (typeof parsed.material === 'string') {
          parsed.material = parsed.material ? [parsed.material] : [''];
        }
        if (!checkMultiAllowed && parsed.material.length > 1) {
          parsed.material = [parsed.material[0] || ''];
        }
        setFormData(parsed);
      } catch (e) {
        console.error(e);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        grade: 'I', phase: 'Fase A', subject: '', timeAllocation: '', material: [''], cp: ''
      }));
    }
  }, [mode]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => {
      const val = type === 'checkbox' ? checked : value;
      const updated = { ...prev, [name]: val };

      if (name === 'level') {
        if (val === 'SD') {
          updated.grade = 'I';
          updated.phase = 'Fase A';
        } else if (val === 'SMP') {
          updated.grade = 'VII';
          updated.phase = 'Fase D';
        } else if (val === 'SMA') {
          updated.grade = 'X';
          updated.phase = 'Fase E';
        }
      }

      if (name === 'grade') {
        updated.phase = getAutomaticFase(updated.level || 'SD', val);
      }

      return updated;
    });
  };

  const handleMaterialChange = (index: number, value: string) => {
    const newMaterials = [...formData.material];
    newMaterials[index] = value;
    setFormData((prev: any) => ({ ...prev, material: newMaterials }));
  };

  const handleAddMaterial = () => setFormData((prev: any) => ({ ...prev, material: [...prev.material, ''] }));
  const handleRemoveMaterial = (index: number) => setFormData((prev: any) => ({ ...prev, material: prev.material.filter((_: any, i: number) => i !== index) }));
  
  const handleLevelToggle = (level: string) => {
    const levels = formData.cognitiveLevel;
    const newLevels = levels.includes(level) ? levels.filter((l: string) => l !== level) : [...levels, level];
    setFormData((prev: any) => ({ ...prev, cognitiveLevel: newLevels }));
  };

  const addConfig = () => setFormData((prev: any) => ({ ...prev, questionConfigs: [...prev.questionConfigs, { type: 'Pilihan Ganda', count: 5, optionCount: 4, scorePerItem: 1 }] }));
  const removeConfig = (index: number) => setFormData((prev: any) => ({ ...prev, questionConfigs: prev.questionConfigs.filter((_: any, i: number) => i !== index) }));
  const updateConfig = (index: number, updates: any) => setFormData((prev: any) => ({ ...prev, questionConfigs: prev.questionConfigs.map((c: any, i: number) => i === index ? { ...c, ...updates } : c) }));

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !isFormValid) return;

    if (setSoalResult) setSoalResult(null);
    if (setIsLoading) setIsLoading(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Gagal memproses submisi form:", error);
      if (setIsLoading) setIsLoading(false);
    }
  };

  const autofillDemo = () => {
    setFormData((prev: any) => ({
      ...prev,
      schoolName: "SD Negeri 1 Merdeka",
      teacherName: "Rista Kasaraeng, S.Pd",
      teacherNip: "19890520 201503 2 004",
      principalName: "Drs. H. Ahmad Yani, M.Pd",
      principalNip: "19750812 200012 1 002",
      academicYear: "2025/2026",
      regionName: "Ampana Kota, Sulawesi Tengah",
      position: "Guru Kelas",
      level: "SD",
      grade: "IV",
      phase: "Fase B",
      semester: "I / Ganjil",
      subject: "Ilmu Pengetahuan Alam dan Sosial (IPAS)",
      timeAllocation: "90 Menit",
      material: [
        "Bagian-bagian Tubuh Tumbuhan",
        "Proses Fotosintesis pada Tumbuhan"
      ],
      cp: "Murid mendeskripsikan struktur dan fungsi bagian tubuh tumbuhan serta menganalisis proses fotosintesis kaitannya dengan metabolisme makhluk hidup.",
      cognitiveLevel: ['HOTS', 'MOTS']
    }));
  };

  const sectionClass = "bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-200 shadow-sm space-y-6";
  const labelClass = "text-sm font-bold text-slate-800 flex items-center gap-2";
  const inputClass = "w-full bg-slate-50 border border-slate-200/80 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800";

  return (
    <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto space-y-8 pb-20">
      
      <AnimatePresence>
        {isQuotaExceeded && (
          <motion.div 
            key="quota-alert"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-3 p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 shadow-sm"
          >
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <p className="font-black text-sm uppercase tracking-wide">KUOTA HARIAN ANDA TELAH HABIS</p>
              <p className="text-xs font-medium text-rose-700/90 mt-0.5">Batas permintaan harian API gratis dari Google Cloud telah terpenuhi. Silakan hubungi admin Fidhal Touna AI atau ganti token API Anda.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isSecurityValid && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-3 items-start">
            <HelpCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-700">
              <h4 className="font-bold text-sm">Validasi Administrasi Penting</h4>
              <p className="text-xs leading-relaxed text-slate-600/95">
                Agar dapat melakukan perancangan asesmen, Anda wajib mengisi data instansi dengan nama sekolah yang terdaftar. Gunakan detail sekolah di bawah atau klik tombol isi demo.
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] font-mono mt-1 pt-1 border-t border-amber-100">
                <span className="bg-amber-100 hover:bg-amber-200/60 px-2 py-0.5 rounded cursor-pointer" onClick={() => setFormData((p: any) => ({ ...p, schoolName: "SD Negeri 1 Merdeka" }))}>Sekolah: "SD Negeri 1 Merdeka"</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={autofillDemo}
            className="bg-slate-900 text-white font-bold hover:bg-slate-800 px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
          >
            Isi Otomatis Data Demo
          </button>
        </div>
      )}

      {/* 1. Identity Section */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <School className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Identitas Satuan Pendidikan</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className={labelClass}><School className="w-4 h-4 text-blue-500"/> Nama Satuan Pendidikan</label>
            <input name="schoolName" value={formData.schoolName} onChange={handleChange} required className={inputClass} placeholder="Contoh: SD Negeri 1 Merdeka" />
          </div>
          <div className="space-y-2">
            <label className={labelClass}><UserIcon className="w-4 h-4 text-blue-500"/> Nama Guru</label>
            <input name="teacherName" value={formData.teacherName} onChange={handleChange} required className={inputClass} placeholder="Nama Lengkap" />
          </div>
          <div className="space-y-2">
            <label className={labelClass} >NIP Guru</label>
            <input name="teacherNip" value={formData.teacherNip} onChange={handleChange} required className={inputClass} placeholder="NIP" />
          </div>
          <div className="space-y-2">
            <label className={labelClass}><Briefcase className="w-4 h-4 text-blue-500"/> Jabatan</label>
            <select name="position" value={formData.position} onChange={handleChange} required className={inputClass}>
              <option value="Guru Kelas">Guru Kelas</option>
              <option value="Guru Mata Pelajaran">Guru Mata Pelajaran</option>
              <option value="Wali Kelas">Wali Kelas</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className={labelClass}><UserIcon className="w-4 h-4 text-blue-500"/> Nama Kepala Sekolah</label>
            <input name="principalName" value={formData.principalName} onChange={handleChange} required className={inputClass} placeholder="Nama Kepala Sekolah" />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>NIP Kepala Sekolah</label>
            <input name="principalNip" value={formData.principalNip} onChange={handleChange} required className={inputClass} placeholder="NIP Kepala Sekolah" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className={labelClass}><Calendar className="w-4 h-4 text-blue-500"/> Tahun Ajaran</label>
            <input name="academicYear" value={formData.academicYear} onChange={handleChange} required className={inputClass} placeholder="Contoh: 2025/2026" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className={labelClass}><Target className="w-4 h-4 text-blue-500"/> Wilayah (Kabupaten/Kecamatan/Kelurahan/Desa) Sekolah Anda</label>
            <input name="regionName" value={formData.regionName} onChange={handleChange} required className={inputClass} placeholder="Contoh: Tojo Una-Una/Ratolindo/Ampana" />
          </div>
        </div>
      </div>

      {/* 2. Curriculum Details */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Kurikulum & Materi</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className={labelClass}>Jenjang</label>
            <select name="level" value={formData.level} onChange={handleChange} className={inputClass} required>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Kelas</label>
            <select name="grade" value={formData.grade} onChange={handleChange} className={inputClass} required>
              {(formData.level === 'SD' 
                ? ['I', 'II', 'III', 'IV', 'V', 'VI'] 
                : formData.level === 'SMP' 
                ? ['VII', 'VIII', 'IX'] 
                : ['X', 'XI', 'XII']
              ).map((g) => (
                <option key={g} value={g}>Kelas {g}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Fase</label>
            <select name="phase" value={formData.phase || getAutomaticFase(formData.level || 'SD', formData.grade || 'I')} onChange={handleChange} className={inputClass} required>
              <option value="Fase A">Fase A (Kelas 1-2)</option>
              <option value="Fase B">Fase B (Kelas 3-4)</option>
              <option value="Fase C">Fase C (Kelas 5-6)</option>
              <option value="Fase D">Fase D (Kelas 7-9)</option>
              <option value="Fase E">Fase E (Kelas 10)</option>
              <option value="Fase F">Fase F (Kelas 11-12)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className={labelClass}><Calendar className="w-4 h-4 text-emerald-500"/> Semester</label>
            <select name="semester" value={formData.semester} onChange={handleChange} className={inputClass} required>
              <option value="I / Ganjil">I / Ganjil</option>
              <option value="II / Genap">II / Genap</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className={labelClass}><BookOpen className="w-4 h-4 text-emerald-500"/> Mata Pelajaran</label>
            <input name="subject" value={formData.subject} onChange={handleChange} className={inputClass} placeholder="Mata Pelajaran" required />
          </div>
          
          <div className="space-y-2">
            <label className={labelClass}><Clock className="w-4 h-4 text-emerald-500"/> Alokasi Waktu</label>
            <input name="timeAllocation" value={formData.timeAllocation || ''} onChange={handleChange} className={inputClass} placeholder="Contoh: 90 Menit" required />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass}><Target className="w-4 h-4 text-emerald-500"/> Capaian Pembelajaran (CP)</label>
          <textarea name="cp" value={formData.cp} onChange={handleChange} className={cn(inputClass, "h-24 resize-none")} required placeholder="Tempelkan Capaian Pembelajaran" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className={labelClass}><ClipboardList className="w-4 h-4 text-emerald-500"/> Materi Utama (Materi Pokok)</label>
            {isMultiMaterialAllowed && (
              <button 
                type="button" 
                onClick={handleAddMaterial}
                className="text-[10px] font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                + Tambah Materi Pokok
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            {formData.material.map((mat: string, index: number) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <input 
                    value={mat} 
                    onChange={(e) => handleMaterialChange(index, e.target.value)} 
                    className={cn(inputClass, "h-12")} 
                    placeholder={isMultiMaterialAllowed ? `Materi Pokok Pembahasan ${index + 1}` : "Masukkan Materi Pokok"} 
                    required 
                  />
                </div>
                {isMultiMaterialAllowed && formData.material.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMaterial(index)}
                    className="p-3 text-red-500 hover:text-red-700 hover:bg-red-55 rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Konfigurasi Tipe Soal */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-650"><Layers className="w-5 h-5" /></div>
            <h2 className="text-xl font-bold text-slate-900 font-display">Konfigurasi Tipe Soal</h2>
          </div>
          <button type="button" onClick={addConfig} className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer">
            <Plus className="w-4 h-4" /> Tambah Tipe
          </button>
        </div>
        
        <div className="space-y-4">
          {formData.questionConfigs.map((config: any, idx: number) => (
            <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Bentuk Soal</label>
                  <select 
                    value={config.type} 
                    onChange={(e) => updateConfig(idx, { type: e.target.value as QuestionType })}
                    className={cn(inputClass, "py-2 text-sm bg-white")}
                  >
                    {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Jumlah Soal</label>
                    <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1">
                      <button type="button" onClick={() => updateConfig(idx, { count: Math.max(1, config.count - 1) })} className="p-1 px-2.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer font-bold text-slate-700">-</button>
                      <span className="font-bold w-full text-center text-sm">{config.count}</span>
                      <button type="button" onClick={() => updateConfig(idx, { count: config.count + 1 })} className="p-1 px-2.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer font-bold text-slate-700">+</button>
                    </div>
                  </div>
                  {config.type === 'Pilihan Ganda' && (
                    <div className="w-24 space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Option</label>
                      <select
                        value={config.optionCount || 4}
                        onChange={(e) => updateConfig(idx, { optionCount: parseInt(e.target.value) })}
                        className={cn(inputClass, "py-2 px-2 text-sm bg-white")}
                      >
                        <option value={3}>3 (A-C)</option>
                        <option value={4}>4 (A-D)</option>
                        <option value={5}>5 (A-E)</option>
                      </select>
                    </div>
                  )}

                  {formData.questionConfigs.length > 1 && (
                    <div className="pt-5 shrink-0">
                      <button type="button" onClick={() => removeConfig(idx)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-55 rounded-xl transition-all cursor-pointer">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 border-t border-slate-200 pt-6">
          <label className={labelClass}>Level Kognitif</label>
          <div className="flex flex-wrap gap-3">
            {COGNITIVE_LEVELS.map(item => (
              <button 
                key={item} 
                type="button" 
                onClick={() => handleLevelToggle(item)}
                className={cn(
                  "px-6 py-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer", 
                  formData.cognitiveLevel.includes(item) 
                    ? "bg-slate-900 text-white shadow-md border-slate-900" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                {item}
              </button>
            ))}
          </div>
          {formData.cognitiveLevel.length === 0 && (
            <p className="text-xs text-red-500 italic">Pilih minimal satu level kognitif.</p>
          )}
        </div>
      </div>
      
      {/* 4. TOMBOL SUBMIT */}
      <motion.button
        whileHover={(!isLoading && isFormValid) ? { scale: 1.01 } : {}}
        whileTap={(!isLoading && isFormValid) ? { scale: 0.99 } : {}}
        type="submit"
        disabled={isLoading || !isFormValid}
        className={cn(
          "w-full font-bold py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all",
          (isLoading || !isFormValid)
            ? "bg-slate-300 text-slate-500 shadow-none cursor-not-allowed opacity-70"
            : "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-slate-900/10"
        )}
      >
        {isLoading ? (
          <>
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating Data...
          </>
        ) : !isSecurityValid ? (
          <>
            <AlertTriangle className="w-6 h-6" />
            Aplikasi Terkunci: Kode Validasi Anda Tidak Valid.
          </>
        ) : (
          <>
            <Target className="w-6 h-6" />
            Generate Lembar Asesmen
          </>
        )}
      </motion.button>
    </form>
  );
}
