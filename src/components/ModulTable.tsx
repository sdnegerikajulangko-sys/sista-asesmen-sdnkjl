import html2canvas from 'html2canvas';
import React, { useRef, useState, useEffect } from 'react';
import { Download, ChevronLeft, FileText, ClipboardCheck, Key, Printer, RefreshCw, Trash2, ExternalLink, Upload, BookOpen, Award, CheckCircle2, XCircle, ArrowLeft, Check, Info, HelpCircle, Send, ListOrdered, Calendar, User, School, Sparkles, BookOpenCheck } from 'lucide-react';
import { GeneratedSoal, SoalFormData, GeneratedModul, ModulFormData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
// Menambahkan import generator soal cetak dan online sesuai kebutuhan
// SESUDAH (Silakan diganti dengan ini)
import { generateKunciOnly, generateKisiOnly, generateSoalOnly, generateSoalOnlineOnly } from '../lib/gemini';

interface ModulTableProps {
  data: GeneratedSoal & GeneratedModul;
  formInput: SoalFormData & ModulFormData;
  onBack: () => void;
  mode: string;
  setCurrentMenu?: (menu: any) => void;
  onSubmitForm?: (data: any) => void;
}

export default function ModulTable({ data, formInput, onBack, mode, setCurrentMenu, onSubmitForm }: ModulTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  // Tab untuk Asesmen
  const [activeTab, setActiveTab] = useState<'soal' | 'kunci' | 'kisi'>('soal');
  
  const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});
  
  // MEMISAHKAN STATE: Soal Cetak dan Soal Online
  const [localQuestionsCetak, setLocalQuestionsCetak] = useState(data?.questions || []);
  const [localQuestionsOnline, setLocalQuestionsOnline] = useState<any[]>([]);
  const [localKisiKisi, setLocalKisiKisi] = useState(data?.kisiKisi || []);
  
  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => console.log(err));
    } else if ((elem as any).webkitRequestFullscreen) { /* Safari */
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) { /* IE11 */
      (elem as any).msRequestFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log(err));
      }
    } else if ((document as any).webkitExitFullscreen) {
      if ((document as any).webkitFullscreenElement) {
        (document as any).webkitExitFullscreen();
      }
    } else if ((document as any).msExitFullscreen) {
      if ((document as any).msFullscreenElement) {
        (document as any).msExitFullscreen();
      }
    }
  };
  
  useEffect(() => {
    if (data?.questions) setLocalQuestionsCetak(data.questions);
    if (data?.kisiKisi) setLocalKisiKisi(data.kisiKisi);
  }, [data]);
  
  const [isTabLoading, setIsTabLoading] = useState(false);

  // States for Online Interactive Quiz
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentAbsen, setStudentAbsen] = useState("");
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, any>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState({
    score: 0,
    correctCount: 0,
    incorrectCount: 0,
    totalAutograded: 0,
    totalQuestions: 0
  });
  const [timeLeft, setTimeLeft] = useState(3600);

  const getCorrectOptionIndex = (q: any) => {
    if (!q.answerKey) return -1;
    const key = String(q.answerKey).trim().toUpperCase();
    if (key.startsWith('A')) return 0;
    if (key.startsWith('B')) return 1;
    if (key.startsWith('C')) return 2;
    if (key.startsWith('D')) return 3;
    if (key.startsWith('E')) return 4;
    return -1;
  };
  const getCorrectMultiOptionIndices = (q: any) => {
    if (!q.answerKey) return [];
    // Ubah kunci jawaban menjadi string agar mudah dibaca (misal: "A, C" atau "A dan C")
    const keyStr = String(q.answerKey).toUpperCase();
    const indices: number[] = [];
    
    if (keyStr.includes('A')) indices.push(0);
    if (keyStr.includes('B')) indices.push(1);
    if (keyStr.includes('C')) indices.push(2);
    if (keyStr.includes('D')) indices.push(3);
    if (keyStr.includes('E')) indices.push(4);
    
    return indices;
  };

  const calculateScore = () => {
  let correct = 0;
  let totalAutograded = 0;
  
  localQuestionsOnline.forEach((q: any) => {
    const studentAns = quizAnswers[q.number];
    
    // 1. Pengecekan Pilihan Ganda Biasa
    if (q.type === 'Pilihan Ganda') {
      totalAutograded++;
      const correctIdx = getCorrectOptionIndex(q);
      if (correctIdx !== -1 && studentAns === correctIdx) {
        correct++;
      }
    } 
    // 2. Pengecekan Benar Salah
    else if (q.type === 'Benar Salah') {
      totalAutograded++;
      const key = String(q.answerKey).toUpperCase().trim();
      const studentStr = String(studentAns || "").toUpperCase().trim();
      const isKeyBenar = key.includes("BENAR") || key === "B" || key === "TRUE";
      const isAnsBenar = studentStr === "BENAR";
      if (isKeyBenar === isAnsBenar) {
        correct++;
      }
    }
    // 3. PENGECEKAN PILIHAN GANDA KOMPLEKS (BARU)
    else if (q.type === 'Pilihan Ganda Kompleks') {
      totalAutograded++;
      const correctIndices = getCorrectMultiOptionIndices(q);
      const studentAnsArray = Array.isArray(studentAns) ? studentAns : [];
      
      // Syarat benar: Jumlah jawaban yang dipilih sama DAN isinya persis sama dengan kunci
      if (correctIndices.length > 0 && correctIndices.length === studentAnsArray.length) {
        const isAllCorrect = correctIndices.every(idx => studentAnsArray.includes(idx));
        if (isAllCorrect) {
          correct++;
        }
      }
    }
  });

  const score = totalAutograded > 0 ? Math.round((correct / totalAutograded) * 100) : 100;

  setQuizResult({
    score,
    correctCount: correct,
    incorrectCount: totalAutograded - correct,
    totalAutograded,
    totalQuestions: localQuestionsOnline.length
  });
  setQuizSubmitted(true);
};
  
  const getMinutesFromAllocation = () => {
    const text = formInput.timeAllocation || data?.header?.timeLimit || "60";
    const num = parseInt(text.replace(/[^0-9]/g, ""));
    return isNaN(num) ? 60 : num;
  };

  useEffect(() => {
    if (isOnlineMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOnlineMode]);

  useEffect(() => {
    if (isOnlineMode && isQuizStarted && !quizSubmitted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            calculateScore();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOnlineMode, isQuizStarted, quizSubmitted, timeLeft]);

  const handlePrint = () => {
    setShowExportOptions(false);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // FUNGSI TOGGLE MODE ONLINE DENGAN LAZY GENERATION SOAL ONLINE
  const handleToggleOnlineMode = async () => {
    const nextOnlineMode = !isOnlineMode;

    if (nextOnlineMode) {
      enterFullscreen();

      setIsQuizStarted(false);
      setQuizSubmitted(false);
      setQuizAnswers({});
      setStudentName("");
      setStudentAbsen("");

      if (localQuestionsOnline.length === 0) {
        setIsTabLoading(true);
        try {
          const generatedOnline = await generateSoalOnlineOnly(formInput, localQuestionsCetak);
          setLocalQuestionsOnline(generatedOnline);
          setIsOnlineMode(true);
        } catch (error: any) {
          alert(error.message || "Gagal memuat soal online.");
        } finally {
          setIsTabLoading(false);
        }
      } else {
        setIsOnlineMode(true);
      }
    } else {
      exitFullscreen();
      setIsOnlineMode(false);
    }
  };

  const handleTabChange = async (tab: 'soal' | 'kunci' | 'kisi') => {
    setActiveTab(tab);

    if (tab === 'soal' && !isOnlineMode) {
      if (localQuestionsCetak.length === 0) {
        setIsTabLoading(true);
        try {
          // Menggunakan fungsi standar generateSoalOnly yang sudah pasti ada di gemini.ts
          const generatedCetak = await generateSoalOnly(formInput); 
          setLocalQuestionsCetak(generatedCetak);
        } catch (error: any) {
          alert(error.message || "Gagal memuat soal cetak.");
        } finally {
          setIsTabLoading(false);
        }
      }
    }

    if (tab === 'kunci') {
      const belumAdaKunci = localQuestionsCetak.every(q => !q.answerKey || q.answerKey === "" || q.answerKey === "-");
      if (belumAdaKunci) {
        setIsTabLoading(true);
        try {
          const updatedQuestions = await generateKunciOnly(data.header, localQuestionsCetak);
          setLocalQuestionsCetak(updatedQuestions);
        } catch (error: any) {
          alert(error.message || "Gagal memuat kunci jawaban.");
        } finally {
          setIsTabLoading(false);
        }
      }
    }

    if (tab === 'kisi') {
      if (localKisiKisi.length === 0) {
        setIsTabLoading(true);
        try {
          const generatedKisi = await generateKisiOnly(formInput, localQuestionsCetak);
          setLocalKisiKisi(generatedKisi);
        } catch (error: any) {
          alert(error.message || "Gagal memuat matriks kisi-kisi.");
        } finally {
          setIsTabLoading(false);
        }
      }
    }
  };

  const cleanOptionText = (text: string, index: number) => {
    if (!text) return "";
    const prefixTarget = `${String.fromCharCode(65 + index)}.`;
    const trimmed = text.trim();
    
    if (trimmed.toUpperCase().startsWith(prefixTarget)) {
      return trimmed.substring(prefixTarget.length).trim();
    }
    if (trimmed.toUpperCase().startsWith(String.fromCharCode(65 + index) + " ")) {
      return trimmed.substring(2).trim();
    }
    return trimmed;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, questionNumber: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Format file harus berupa gambar (PNG, JPG, JPEG, dll)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setGeneratedImages(prev => ({ 
          ...prev, 
          [questionNumber]: reader.result as string 
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChatGPTRedirect = async (questionObject: any) => {
    let basePrompt = questionObject.text || "";
    
    basePrompt = basePrompt
      .replace(/Murid melihat/gi, '')
      .replace(/Bapak\/Ibu Guru menunjukkan/gi, '')
      .replace(/Perhatikan gambar/gi, '')
      .replace(/di bawah ini/gi, '')
      .replace(/dengan teliti/gi, '');

    const fullPrompt = `Buatkan gambar ilustrasi pendukung untuk pertanyaan ujian sekolah dasar berikut ini. Spesifikasi gambar:\n- Gaya visual: 2D vector clip art buku pelajaran anak\n- Warna: Cerah, bersih, dan menarik\n- Background: Putih polos (solid white background)\n- PENTING: JANGAN ada teks, tulisan, huruf, kata, atau angka sama sekali di dalam gambar.\n\nEsensi konteks dari pertanyaan soal yang harus digambar: ${basePrompt.trim()}`;
    
    try {
      await navigator.clipboard.writeText(fullPrompt);
      alert("✅ PROMPT PERTANYAAN BERHASIL DISALIN!\n\nSistaApp akan membuka ChatGPT. Silakan gunakan kombinasi tombol Ctrl+V (Paste) di kolom chat untuk memicu pembuatan gambar, lalu unduh gambar tersebut ke komputer Anda.");
      window.open('https://chatgpt.com/', '_blank');
    } catch (err) {
      alert("Gagal menyalin otomatis. Silakan salin teks prompt ini secara manual:\n\n" + fullPrompt);
      window.open('https://chatgpt.com/', '_blank');
    }
  };
  
  const handleRemoveImage = (questionNumber: number) => {
    setGeneratedImages(prev => {
      const updated = { ...prev };
      delete updated[questionNumber];
      return updated;
    });
  };

  const getHeaderText = () => {
    switch(activeTab) {
      case 'soal': return 'LEMBAR ASESMEN KURIKULUM MERDEKA';
      case 'kunci': return 'LEMBAR KUNCI JAWABAN DAN RUBRIK PENILAIAN';
      case 'kisi': return 'LEMBAR KISI-KISI SOAL';
      default: return 'LEMBAR ASESMEN KURIKULUM MERDEKA';        
    }
  };

  const getAssessmentTypeName = () => {
    switch (mode) {
      case 'diagnostik': return 'Asesmen Awal';
      case 'formatif': return 'Asesmen Formatif';
      case 'sumatif': return 'Asesmen Sumatif';
      case 'sts': return 'Sumatif Tengah Semester';
      case 'sas': return 'Sumatif Akhir Semester';
      default: return 'Asesmen Kurikulum Merdeka';
    }
  };

  const getMaterialString = () => {
    if (data?.header?.material && typeof data.header.material === 'string') {
      return data.header.material;
    }
    if (data?.identifikasi?.materi || data?.identifikasi?.material) {
      return data.identifikasi.materi || data.identifikasi.material;
    }
    if (Array.isArray(formInput.material)) {
      return formInput.material.filter(m => m.trim() !== '').join(', ') || "Materi Pokok";
    }
    return formInput.material || "Materi Pokok";
  };
  
  const currentMaterial = getMaterialString();

  const formatAnswerKey = (answerKey: any) => {
    if (!answerKey) return '-';
    if (Array.isArray(answerKey)) return answerKey.join(', ');
    if (typeof answerKey === 'object' && answerKey !== null) {
      return Object.entries(answerKey).map(([key, val]) => `${key}: ${val}`).join(', ');
    }
    return String(answerKey);
  };

  const downloadWord = async () => {
    if (!containerRef.current) return;
    
    const schoolName = data?.identitas?.schoolName || formInput.schoolName || "DOKUMEN ASLI"; 
    const teacherName = formInput.teacherName || "Guru Kelas";

    // 1. SOLUSI UTAMA: Paksa elemen identitas muncul sesaat di layar agar bisa difoto oleh html2canvas
    let identityImgSrc = "";
    const identityElement = containerRef.current.querySelector('.print-identity-table') as HTMLElement;
    
    if (identityElement) {
      // Simpan style asli bawaan elemen terlebih dahulu
      const originalStyle = identityElement.getAttribute('style') || '';
      
      try {
        // Tembak properti inline dengan !important agar menabrak class 'hidden' milik Tailwind
        identityElement.style.setProperty('display', 'table', 'important');
        identityElement.style.setProperty('visibility', 'visible', 'important');
        identityElement.style.setProperty('opacity', '1', 'important');
        
        const canvas = await html2canvas(identityElement, { 
          scale: 2, // Resolusi tinggi agar teks di dalam gambar tidak pecah saat dicetak
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        identityImgSrc = canvas.toDataURL('image/png');
      } catch (error) {
        console.error("Gagal melakukan snapshot identitas sekolah:", error);
      } finally {
        // KEMBALIKAN STYLE ASLI INSTAN: Elemen kembali tersembunyi di layar aplikasi Anda
        identityElement.setAttribute('style', originalStyle);
      }
    }

    // 2. Kloning elemen kertas utama setelah proses foto selesai
    const clone = containerRef.current.cloneNode(true) as HTMLElement;
    
    // 3. Bersihkan elemen UI layar jepretan secara aman
    const screenElements = clone.querySelectorAll('.screen-only-header, .screen-identity-grid, .no-print, button, svg, input, .print-watermark');
    screenElements.forEach(el => el.parentNode?.removeChild(el));

    // Hapus teks nama sekolah melayang liar di pojok kiri paling atas luar dokumen
    const allParagraphs = clone.querySelectorAll('p, div');
    allParagraphs.forEach(el => {
      if (el.textContent?.trim() === schoolName && !el.closest('.print-only-header') && el.parentNode === clone) {
        el.parentNode?.removeChild(el);
      }
    });

    // 4. Atur Judul Utama agar Rata Tengah & Rapat
    const printHeaders = clone.querySelectorAll('.print-only-header');
    printHeaders.forEach(el => { 
      (el as HTMLElement).style.display = 'block'; 
      (el as HTMLElement).style.fontSize = '14pt';
      (el as HTMLElement).style.fontWeight = 'bold';
      (el as HTMLElement).style.textAlign = 'center';
      (el as HTMLElement).style.marginBottom = '2pt';
    });

    const allHeadings = clone.querySelectorAll('h1, h2, h3');
    allHeadings.forEach(h => {
      (h as HTMLElement).style.textAlign = 'center';
      (h as HTMLElement).style.fontWeight = 'bold';
      (h as HTMLElement).style.color = '#000000';
      (h as HTMLElement).style.marginTop = '0px';
      (h as HTMLElement).style.marginBottom = '2pt';
    });

    const paragraphs = clone.querySelectorAll('p');
    paragraphs.forEach(p => {
      (p as HTMLElement).style.marginTop = '0px';
      (p as HTMLElement).style.marginBottom = '2pt';
      
      if (p.textContent?.includes('TAHUN AJARAN')) {
        p.style.textAlign = 'center';
        p.style.fontWeight = 'bold';
        p.style.fontSize = '11pt';
        p.style.marginBottom = '12pt';
      }
    });
    
    // 5. EKSEKUSI PENGGANTIAN: Ganti total tabel teks dengan tag Gambar Base64 hasil potret aplikasi
    const printTables = clone.querySelectorAll('.print-identity-table');
    printTables.forEach(table => {
      if (identityImgSrc) {
        const imgWrapper = document.createElement('div');
        imgWrapper.style.textAlign = 'center';
        imgWrapper.style.marginBottom = '15pt';
        imgWrapper.style.marginTop = '5pt';
        
        const img = document.createElement('img');
        img.src = identityImgSrc;
        // Mengunci ukuran lebar cetak standar kertas Word (A4 Portrait)
        img.setAttribute('width', '650'); 
        img.style.width = '100%';
        img.style.height = 'auto';
        
        imgWrapper.appendChild(img);
        table.parentNode?.replaceChild(imgWrapper, table);
      }
    });

    // 6. Konversi Kotak Elemen Kosong Menjadi Karakter Cetak Kurung ( ) dan Kotak [ ]
    const selectionBoxes = clone.querySelectorAll('div.w-5.h-5.border-2');
    selectionBoxes.forEach(box => {
      const htmlBox = box as HTMLElement;
      const isCircle = htmlBox.classList.contains('rounded-full');
      
      const textNode = document.createElement('span');
      textNode.style.fontFamily = 'Times New Roman, serif';
      textNode.style.fontSize = '11pt';
      textNode.style.fontWeight = 'bold';
      textNode.innerHTML = isCircle ? '(&nbsp; &nbsp;)' : '[&nbsp; &nbsp;]';
      
      htmlBox.parentNode?.replaceChild(textNode, htmlBox);
    });

    // 7. Konversi Baris Pertanyaan Soal ke Elemen Tabel Tak Kasat Mata
    const questionRows = clone.querySelectorAll('.question-row');
    questionRows.forEach(row => {
      const numEl = row.querySelector('.question-num');
      const textEl = row.querySelector('.question-text');
      
      if (numEl && textEl) {
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.border = 'none';
        table.style.marginBottom = '5pt';
        
        const tr = document.createElement('tr');
        
        const tdNum = document.createElement('td');
        tdNum.style.width = '22pt';
        tdNum.style.verticalAlign = 'top';
        tdNum.style.fontWeight = 'bold';
        tdNum.style.padding = '2px 0px';
        tdNum.style.border = 'none';
        tdNum.innerHTML = numEl.innerHTML;
        
        const tdText = document.createElement('td');
        tdText.style.verticalAlign = 'top';
        tdText.style.textAlign = 'justify';
        tdText.style.padding = '2px 0px';
        tdText.style.border = 'none';
        tdText.innerHTML = textEl.innerHTML;
        
        tr.appendChild(tdNum);
        tr.appendChild(tdText);
        table.appendChild(tr);
        
        row.parentNode?.replaceChild(table, row);
      }
    });

    // 8. Konversi Opsi Jawaban Menggunakan Kolom Spacer (Menghilangkan Bug Pergeseran Nomor)
    const optionRows = clone.querySelectorAll('.option-row, .ml-9 .flex, .ml-2 .flex');
    optionRows.forEach(row => {
      if (row.tagName === 'DIV' && row.children.length >= 2) {
        const firstChild = row.children[0] as HTMLElement;
        const secondChild = row.children[1] as HTMLElement;
        
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.border = 'none';
        table.style.marginBottom = '3pt';
        
        const tr = document.createElement('tr');
        
        const tdSpacer = document.createElement('td');
        tdSpacer.style.width = '22pt';
        tdSpacer.style.border = 'none';
        tdSpacer.innerHTML = '&nbsp;';

        const tdIndicator = document.createElement('td');
        tdIndicator.style.width = '20pt';
        tdIndicator.style.verticalAlign = 'top';
        tdIndicator.style.fontWeight = 'bold';
        tdIndicator.style.border = 'none';
        tdIndicator.innerHTML = firstChild.outerHTML || firstChild.innerHTML;
        
        const tdText = document.createElement('td');
        tdText.style.verticalAlign = 'top';
        tdText.style.border = 'none';
        tdText.innerHTML = secondChild.outerHTML || secondChild.innerHTML;
        
        tr.appendChild(tdSpacer);
        tr.appendChild(tdIndicator);
        tr.appendChild(tdText);
        table.appendChild(tr);
        
        row.parentNode?.replaceChild(table, row);
      }
    });

    // Menyesuaikan proporsi gambar penunjang halaman lainnya
    const images = clone.querySelectorAll('img:not([src^="data:image"])');
    images.forEach(img => {
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.removeAttribute('class'); 
    });

    const contentHtml = clone.innerHTML;
    
    // 9. Template HTML MSO dengan Aturan Running Footer Otomatis Yang Stabil
    const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Asesmen</title>
      <style>
        @page WordSection1 { 
          size: 8.27in 11.69in; 
          margin: 1.0in 1.0in 1.0in 1.0in; 
          mso-header-margin: 0.5in; 
          mso-footer-margin: 0.5in; 
          mso-footer: f1; 
          mso-paper-source: 0; 
        }
        div.WordSection1 { page: WordSection1; }
        
        body { font-family: 'Times New Roman', Arial, serif; font-size: 11pt; color: #000000; line-height: 1.2; }
        table { width: 100%; border-collapse: collapse; }
        .spreadsheet-table, .spreadsheet-table td, .spreadsheet-table th { border: 1px solid #000000 !important; padding: 6px 8px; }
        .spreadsheet-table th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
        .bg-slate-50 { background-color: #f8f9fa; border: 1px solid #000000; padding: 8pt; margin-bottom: 10pt; }
        .whitespace-pre-wrap { white-space: pre-wrap; }
        
        p.MsoFooter { margin: 0in; font-size: 9.5pt; color: #000000; font-family: 'Times New Roman', serif; }
      </style>
    </head>
    <body>
      <div class="WordSection1">
        ${contentHtml}
        
        <div style='mso-element:footer' id='f1'>
          <p class="MsoFooter" style="border-top: 1px solid #000000; padding-top: 4pt; font-weight: bold;">
            ${schoolName} &nbsp;|&nbsp; ${teacherName}
            <span style='mso-tab-count:2'></span>
            Halaman <span style='mso-field-code: PAGE '></span>
          </p>
        </div>
      </div>
    </body>
    </html>`;

    const cleanedSource = preHtml.replace(/className=/g, 'class=');
    const blob = new Blob(['\ufeff', cleanedSource], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `${formInput.subject || 'Asesmen'}_${activeTab}.doc`.replace(/\s+/g, '_');
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  const NavButton = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: React.ComponentType<{className?: string}>, label: string }) => (
    <button
      onClick={() => handleTabChange(id)}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all border text-xs cursor-pointer",
        activeTab === id 
          ? "bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-lg shadow-blue-500/30 border-transparent" 
          : "bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 border-slate-200"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  // =========================================================================
  // INTERFACES / EARLY RETURN: ANTARMUKA UJIAN ONLINE (CBT) SECARA MANDIRI
  // Menjamin 1 layar penuh, memblokir & menyembunyikan semua konten belakang.
  // =========================================================================
  if (activeTab === 'soal' && isOnlineMode) {
    return (
      <div className="fixed inset-0 bg-slate-100 z-[99999] flex flex-col h-screen w-screen overflow-hidden font-sans select-none animate-fadeIn text-slate-900 leading-relaxed no-print">
        
        {/* TOP BAR STATUS & NAVIGATION CONTROL */}
        <div className="bg-white border-b border-slate-200 px-6 py-3.5 shrink-0 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const confirmExit = window.confirm("Apakah Anda yakin ingin keluar dari mode ujian online? Jawaban saat ini tidak akan tersimpan jika keluar.");
                if (confirmExit) {
                  exitFullscreen();
                  setIsOnlineMode(false);
                  setIsQuizStarted(false);
                  setQuizSubmitted(false);
                  setQuizAnswers({});
                  setStudentName("");
                  setStudentAbsen("");
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-250 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer bg-white"
            >
              <ArrowLeft className="w-4 h-4" /> Keluar &amp; Kembali ke Cetak
            </button>
            <span className="h-6 w-px bg-slate-200 hidden md:block" />
            <div className="hidden md:block text-left">
              <p className="text-xs font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" /> PORTAL UJIAN ONLINE INTERAKTIF
              </p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{data?.identitas?.subject || formInput.subject} — Kelas {formInput.grade}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isQuizStarted && !quizSubmitted && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 font-mono text-xs md:text-sm px-3.5 py-1.5 rounded-xl flex items-center gap-2 font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                <span>Sisa Waktu: {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
              </div>
            )}
            
            <div className="bg-blue-600 text-white font-extrabold text-[10px] md:text-xs px-3.5 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <BookOpenCheck className="w-3.5 h-3.5" /> {getAssessmentTypeName()}
            </div>
          </div>
        </div>

        {/* PORTAL BODY SPLITTED VIEWPORT CONTAINER */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
          
          {/* LEFT SIDE SCROLLING QUESTIONS SHEET */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 animate-fadeIn text-left" id="cbt-questions-scroll-area">
            
            {/* STEP 1: STUDENT ENROLLMENT CARD */}
            {!isQuizStarted ? (
              <div className="max-w-xl mx-auto space-y-6 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-md">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 text-blue-600 mb-2">
                    <BookOpenCheck className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Portal Ujian Online Interaktif</h3>
                  <p className="text-xs text-slate-500 font-medium">Selamat Datang di Sista-App Online Engine</p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-2 text-xs text-blue-800 leading-relaxed">
                  <p className="font-bold">📋 Detail Asesmen:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-900 font-medium ml-1">
                    <li>Mata Pelajaran: {data?.identitas?.subject || formInput.subject}</li>
                    <li>Kelas / Jenjang: Kelas {formInput.grade}</li>
                    <li>Jenis: {getAssessmentTypeName()}</li>
                    <li>Jumlah Soal: {localQuestionsOnline.length} Butir</li>
                    <li>Durasi Ujian: {formInput.timeAllocation || data?.header?.timeLimit || '60 Menit'}</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-450" /> Nama Lengkap Murid <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ketik Nama Lengkap Anda..."
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 text-sm outline-none transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5 text-slate-450" /> Nomor Absen <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 12"
                      value={studentAbsen}
                      onChange={(e) => setStudentAbsen(e.target.value)}
                      className="w-full border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 text-sm outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!studentName.trim()) {
                      alert("Bapak/Ibu, silakan masukkan nama lengkap murid terlebih dahulu untuk memulai simulasi ujian!");
                      return;
                    }
                    setIsQuizStarted(true);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/10 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  Mulai Ujian Sekarang <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
            ) : quizSubmitted ? (
              
              /* STEP 3: EXAM SCORE RATING DASHBOARD */
              <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-md text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600">
                    <Award className="w-10 h-10 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Hasil Evaluasi Ujian Online 🏆</h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Selamat, Anda telah menyelesaikan seluruh pengerjaan soal!</p>
                  </div>

                  {/* Rapor Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto text-left">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Identitas Murid</p>
                      <p className="text-sm font-bold text-slate-805">{studentName}</p>
                      {studentAbsen && <p className="text-[11px] text-slate-500 font-medium">No. Absen: {studentAbsen}</p>}
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Waktu Selesai</p>
                      <p className="text-sm font-bold text-slate-805 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-505" /> {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">{getAssessmentTypeName()}</p>
                    </div>
                  </div>

                  {/* Main Rapor Score Badge */}
                  <div className="py-4 max-w-xs mx-auto">
                    <div className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-widest">NILAI AKHIR SOAL PILIHAN</div>
                    <div className="relative inline-flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full border-8 border-slate-100 flex flex-col items-center justify-center shadow-inner">
                        <span className={cn(
                          "text-4xl font-black tracking-tighter",
                          quizResult.score >= 75 ? "text-emerald-600" : quizResult.score >= 60 ? "text-blue-600" : "text-rose-500"
                        )}>
                          {quizResult.score}
                        </span>
                        <span className="text-[10px] text-slate-405 font-bold">SKALA 100</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      {quizResult.score >= 75 ? (
                        <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1 border border-emerald-200">🎉 SANGAT BAIK (LULUS)</span>
                      ) : quizResult.score >= 60 ? (
                        <span className="bg-blue-50 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1 border border-blue-200">👍 CUKUP (LULUS)</span>
                      ) : (
                        <span className="bg-rose-50 text-rose-800 text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1 border border-rose-200">👉 PERLU REMEDIAL / BELAJAR LAGI</span>
                      )}
                    </div>
                  </div>

                  {/* Simple Stats block */}
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-2 border-t border-slate-100">
                    <div className="text-center">
                      <span className="block text-xl font-bold text-emerald-600">{quizResult.correctCount}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Benar</span>
                    </div>
                    <div className="text-center border-l border-slate-100">
                      <span className="block text-xl font-bold text-rose-500">{quizResult.incorrectCount}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Salah</span>
                    </div>
                  </div>

                  {/* CTA Buttons in Score Board */}
                  <div className="flex flex-wrap justify-center gap-3 pt-4 border-t border-slate-150">
                    <button
                      onClick={() => setQuizSubmitted(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 border border-slate-200 font-sans"
                    >
                      📝 Tinjau Jawaban Anda
                    </button>
                    <button
                      onClick={() => {
                        setQuizSubmitted(false);
                        setQuizAnswers({});
                        setIsQuizStarted(true);
                      }}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 border border-blue-200 font-sans"
                    >
                      🔄 Ulangi Ujian Baru
                    </button>
                    <button
                      onClick={() => {
                        exitFullscreen();
                        setIsOnlineMode(false);
                        setIsQuizStarted(false);
                        setQuizSubmitted(false);
                        setQuizAnswers({});
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-sm font-sans"
                    >
                      🖨️ Cetak / Ganti Tampilan Offline
                    </button>
                  </div>
                </div>

                {/* DISCUSSION REVIEW PER QUESTION */}
                <div className="space-y-6">
                  <h4 className="text-base font-bold text-slate-850 uppercase tracking-wide border-b border-slate-200 pb-2">Analisis Pembahasan Setiap Soal</h4>
                  {localQuestionsOnline.map((q) => {
                    const isPG = q.type === 'Pilihan Ganda';
                    const isBS = q.type === 'Benar Salah';
                    const isAutograded = isPG || isBS;
                    
                    let isCorrect = false;
                    if (isPG) {
                      const correctIdx = getCorrectOptionIndex(q);
                      isCorrect = quizAnswers[q.number] === correctIdx;
                    } else if (isBS) {
                      const key = String(q.answerKey).toUpperCase().trim();
                      const studentStr = String(quizAnswers[q.number] || "").toUpperCase().trim();
                      const isKeyBenar = key.includes("BENAR") || key === "B" || key === "TRUE";
                      const isAnsBenar = studentStr === "BENAR";
                      isCorrect = isKeyBenar === isAnsBenar;
                    }

                    return (
                      <div key={q.number} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <span className="font-bold h-7 w-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 text-xs">{q.number}</span>
                          {isAutograded ? (
                            isCorrect ? (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Benar (+Scored)
                              </span>
                            ) : (
                              <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-500" /> Salah (0)
                              </span>
                            )
                          ) : (
                            <span className="bg-blue-50 text-blue-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 border border-blue-200">
                              <Info className="w-3 h-3 text-blue-505" /> Perlu Review Manual
                            </span>
                          )}
                        </div>

                        <p className="text-justify leading-relaxed font-semibold text-slate-800 text-sm whitespace-pre-wrap">{q.text}</p>

                        <div className="pl-4 border-l-2 border-slate-100 space-y-2 mt-2">
                          <p className="text-xs text-slate-500 font-semibold uppercase">Jawaban Anda / Murid:</p>
                          <div className="text-sm">
                            {isPG && (
                              <span className="font-bold text-slate-800 text-xs sm:text-sm">
                                {quizAnswers[q.number] !== undefined 
                                  ? `${String.fromCharCode(65 + quizAnswers[q.number])}. ${cleanOptionText(q.options[quizAnswers[q.number]], quizAnswers[q.number])}` 
                                  : "— Kosong / Belum dijawab —"}
                              </span>
                            )}
                            {isBS && (
                              <span className="font-bold text-slate-800 text-xs sm:text-sm">
                                {quizAnswers[q.number] || "— Kosong / Belum dijawab —"}
                              </span>
                            )}
                            {!isAutograded && (
                              <p className="text-slate-800 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 mt-1 whitespace-pre-wrap text-xs sm:text-sm">
                                "{quizAnswers[q.number] || "— Kosong / Belum dijawab —"}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/60 space-y-2 text-xs">
                          <div className="flex items-center gap-1 text-blue-900 font-bold">
                            <Key className="w-3.5 h-3.5 text-blue-600" /> Kunci Jawaban Resmi:
                          </div>
                          <p className="font-bold text-blue-955 font-mono text-sm leading-snug">
                            {formatAnswerKey(q.answerKey)}
                          </p>
                          {(q.explanation || q.score) && (
                            <p className="text-slate-600 leading-relaxed mt-1 italic text-justify">
                              <strong>Penjelasan:</strong> {q.explanation || q.score}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              
              /* STEP 2: ACTIVE DIGITAL INTERACTIVE EXAM ENGINE */
              <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Interactive metadata bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5 justify-center md:justify-start">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      Peserta Ujian: <span className="text-blue-900 text-sm font-extrabold">{studentName}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center md:text-left">
                      Asesmen: {getAssessmentTypeName()} | No Absen: {studentAbsen || '-'}
                    </p>
                  </div>

                  {/* Interactive Dynamic Progress indicator */}
                  <div className="w-full md:w-60 text-right space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-605">
                      <span>Kemajuan Soal</span>
                      <span>{Object.keys(quizAnswers).length} dari {localQuestionsOnline.length} Terjawab</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(Object.keys(quizAnswers).length / localQuestionsOnline.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Interactive Question Lists */}
                <div className="space-y-6">
                  {localQuestionsOnline.map((q) => {
                    const teksLengkap = `${q.text || ''} ${q.stimulus || ''}`.toLowerCase();
                    const butuhGambar = q.imagePrompt || 
                                       teksLengkap.includes('perhatikan gambar') || 
                                       teksLengkap.includes('amati gambar') ||
                                       teksLengkap.includes('pada gambar di') ||
                                       teksLengkap.includes('perhatikan grafik') ||
                                       teksLengkap.includes('amati grafik') ||
                                       teksLengkap.includes('disajikan gambar') ||
                                       teksLengkap.includes('disajikan grafik');
                    
                    return (
                      <div key={q.number} id={`q-card-${q.number}`} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        
                        {/* Stimulus block */}
                        {q.stimulus && (
                          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-justify italic text-xs">
                            <div className="whitespace-pre-wrap leading-relaxed text-slate-800 font-medium">{q.stimulus}</div>
                          </div>
                        )}

                        {/* Visual elements */}
                        {butuhGambar && generatedImages[q.number] && (
                          <div className="max-w-md mx-auto">
                            <img 
                              src={generatedImages[q.number]} 
                              className="w-full h-auto rounded-xl border border-slate-200 shadow-sm" 
                              alt={`Visual Soal ${q.number}`} 
                            />
                          </div>
                        )}

                        <div className="flex items-start gap-4">
                          <span className="font-extrabold min-w-[28px] h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs shadow-sm shadow-blue-500/25">
                            {q.number}
                          </span>
                          <div className="flex-1">
                            <h4 className="text-justify leading-relaxed whitespace-pre-wrap font-bold text-slate-900 text-sm sm:text-base">
                              {q.text}
                            </h4>
                          </div>
                        </div>

                        {/* Options / Inputs space */}
                        <div className="pl-0 sm:pl-11 mt-4 space-y-3">
                          
                          {/* PILIHAN GANDA */}
                          {/* Tambahkan class: option-row, option-letter, dan option-text */}
                          {q.type === 'Pilihan Ganda' && q.options && (
                            <div className="grid grid-cols-1 gap-2 ml-2 mt-2">
                              {q.options.map((opt, i) => {
                                // Cek apakah opsi ini adalah opsi yang sedang dipilih
                                const isSelected = quizAnswers[q.number] === i;
                                
                                return (
                                  <button
                                    key={i}
                                    // Tambahkan fungsi onClick untuk menyimpan jawaban ke dalam state
                                    onClick={() => setQuizAnswers(prev => ({ ...prev, [q.number]: i }))}
                                    className={cn(
                                      "w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer outline-none focus:ring-2 focus:ring-blue-100 option-row",
                                      // Ubah warna background & border jika opsi dipilih
                                      isSelected 
                                        ? "border-blue-600 bg-blue-50/80 shadow-sm text-blue-900" 
                                        : "border-slate-200 hover:border-blue-200 hover:bg-slate-50/50 text-slate-800"
                                    )}
                                  >
                                    <span className={cn(
                                      "font-bold w-5 shrink-0 option-letter",
                                      isSelected ? "text-blue-700" : "text-slate-700"
                                    )}>
                                      {String.fromCharCode(65 + i)}.
                                    </span>
                                    <span className={cn(
                                      "text-xs md:text-sm option-text leading-snug",
                                      isSelected ? "font-semibold" : ""
                                    )}>
                                      {cleanOptionText(opt, i)}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          {/* BENAR SALAH */}
                          {q.type === 'Benar Salah' && (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                onClick={() => setQuizAnswers(prev => ({ ...prev, [q.number]: "BENAR" }))}
                                className={cn(
                                  "flex-1 text-center py-3.5 px-6 rounded-xl border transition-all font-extrabold text-xs sm:text-sm cursor-pointer outline-none focus:ring-2 focus:ring-emerald-100",
                                  quizAnswers[q.number] === "BENAR" 
                                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm" 
                                    : "border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/10 text-slate-700"
                                )}
                              >
                                ✅ Kategori Benar
                              </button>
                              <button
                                onClick={() => setQuizAnswers(prev => ({ ...prev, [q.number]: "SALAH" }))}
                                className={cn(
                                  "flex-1 text-center py-3.5 px-6 rounded-xl border transition-all font-extrabold text-xs sm:text-sm cursor-pointer outline-none focus:ring-2 focus:ring-rose-100",
                                  quizAnswers[q.number] === "SALAH" 
                                    ? "border-rose-600 bg-rose-50 text-rose-800 shadow-sm" 
                                    : "border-slate-200 hover:border-rose-200 hover:bg-rose-50/10 text-slate-700"
                                )}
                              >
                                ❌ Kategori Salah
                              </button>
                            </div>
                          )}

                          {/* PILIHAN GANDA KOMPLEKS */}
                          {q.type === 'Pilihan Ganda Kompleks' && q.multiOptions && (
                            <div className="grid grid-cols-1 gap-2.5">
                              <p className="text-[10px] font-black text-indigo-700 uppercase tracking-wider mb-1">💡 Anda dapat memilih lebih dari satu jawaban:</p>
                              {q.multiOptions.map((opt, i) => {
                                const teksOpsi = typeof opt === 'object' && opt !== null ? (opt.text || '') : opt;
                                const currentSelected = quizAnswers[q.number] || [];
                                const isSelected = currentSelected.includes(i);
                                const toggleOption = () => {
                                  const next = isSelected 
                                    ? currentSelected.filter((x: number) => x !== i) 
                                    : [...currentSelected, i];
                                  setQuizAnswers(prev => ({ ...prev, [q.number]: next }));
                                };
                                return (
                                  <button
                                    key={i}
                                    onClick={toggleOption}
                                    className={cn(
                                      "w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3.5 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-100",
                                      isSelected 
                                        ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-bold" 
                                        : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50/50 text-slate-800"
                                    )}
                                  >
                                    <div className={cn(
                                      "w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all",
                                      isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-400 bg-white"
                                    )}>
                                      {isSelected && <Check className="w-3.5 h-3.5 font-black" />}
                                    </div>
                                    <span className="text-xs sm:text-sm py-0.5 leading-snug">{teksOpsi}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* MENJODOHKAN ONLINE (BISA GAMBAR) */}
                          {q.type === 'Menjodohkan' && q.matchingPairs && (
                            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                              <p className="text-[10px] font-black text-indigo-700 uppercase tracking-wider mb-2">🤝 Pilih jawaban pasangan yang tepat untuk setiap pernyataan:</p>
                              
                              {(() => {
                                // 1. Kumpulkan semua opsi jawaban B dari data
                                const availableOptions = [...q.matchingPairs]
                                  .map(p => p.target || p.answer || "")
                                  .filter(opt => opt !== "");
                          
                                // Fungsi helper untuk mengecek URL Gambar
                                const isImageUrl = (url: string) => {
                                  return typeof url === 'string' && 
                                         (url.startsWith('http') || url.startsWith('/')) && 
                                         url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
                                };
                          
                                return q.matchingPairs.map((pair, i) => {
                                  const valueA = pair.prompt;
                                  const currentAnswer = quizAnswers[q.number]?.[i] || "";
                          
                                  return (
                                    <div key={i} className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between border-b border-slate-200/60 pb-4 last:border-0 last:pb-0">
                                      
                                      {/* SISI KIRI: PERNYATAAN A (Bisa Teks / Gambar) */}
                                      <div className="w-full lg:w-1/2 text-slate-800 font-bold text-xs sm:text-sm">
                                        {isImageUrl(valueA) ? (
                                          <img src={valueA} alt="Pertanyaan" className="max-h-28 w-auto rounded-lg shadow-sm border border-slate-200" />
                                        ) : (
                                          <span>{valueA}</span>
                                        )}
                                      </div>
                          
                                      {/* SISI KANAN: PILIHAN JAWABAN (Desain Grid Kancing/Kartu jika ada gambar) */}
                                      <div className="w-full lg:w-1/2 flex flex-wrap gap-2">
                                        {availableOptions.map((opt, optIndex) => {
                                          const isSelected = currentAnswer === opt;
                                          
                                          return (
                                            <button
                                              key={optIndex}
                                              type="button"
                                              onClick={() => {
                                                const prev = quizAnswers[q.number] || {};
                                                setQuizAnswers(answers => ({
                                                  ...answers,
                                                  [q.number]: { ...prev, [i]: opt }
                                                }));
                                              }}
                                              className={`p-2 rounded-xl border text-xs transition-all flex items-center justify-center min-h-[40px] ${
                                                isSelected
                                                  ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-2 ring-indigo-100"
                                                  : "border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                                              }`}
                                            >
                                              {isImageUrl(opt) ? (
                                                // Jika opsi B berupa gambar, render gambar kecil di dalam tombol
                                                <img src={opt} alt="Opsi" className="max-h-12 w-auto rounded" />
                                              ) : (
                                                // Jika teks biasa
                                                <span>{opt}</span>
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                          
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          )}
                          {/* ISIAN SINGKAT */}
                          {q.type === 'Isian Singkat' && (
                            <div>
                              <input
                                type="text"
                                placeholder="Ketik jawaban singkat atau kata kunci penting di sini..."
                                value={quizAnswers[q.number] || ""}
                                onChange={(e) => setQuizAnswers(prev => ({ ...prev, [q.number]: e.target.value }))}
                                className="border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm w-full outline-none font-medium transition-all"
                              />
                            </div>
                          )}

                          {/* URAIAN */}
                          {q.type === 'Uraian' && (
                            <div>
                              <textarea
                                rows={4}
                                placeholder="Tuliskan analisis, langkah-langkah, atau uraian penjelasan lengkap Anda di sini..."
                                value={quizAnswers[q.number] || ""}
                                onChange={(e) => setQuizAnswers(prev => ({ ...prev, [q.number]: e.target.value }))}
                                className="border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl p-4 text-xs sm:text-sm w-full outline-none resize-none font-medium transition-all"
                              />
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer submit block of Active Exam */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-center sm:text-left">
                    <h5 className="font-bold text-slate-800 text-sm">Sudah menyelesaikan semua baris soal?</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">Jawaban Anda akan dikirim ke sistem untuk diproses nilainya secara instan.</p>
                  </div>
                  <button
                    onClick={() => {
                      const answeredCount = Object.keys(quizAnswers).length;
                      if (answeredCount < localQuestionsOnline.length) {
                        const confirmSelesai = window.confirm(`Bapak/Ibu/Murid baru menjawab ${answeredCount} dari ${localQuestionsOnline.length} pertanyaan. Apakah Anda yakin ingin mengirim lembar jawaban sekarang?`);
                        if (!confirmSelesai) return;
                      }
                      calculateScore();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm cursor-pointer shadow-md shadow-blue-500/10 flex items-center gap-2 transition-all w-full sm:w-auto justify-center font-sans"
                  >
                    <Send className="w-4 h-4" /> Kirim Jawaban Ujian 🚀
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* RIGHT SIDE INSTANT QUICK-GRID MAP CHECKLIST */}
          {isQuizStarted && (
            <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-slate-200 p-6 flex flex-col shrink-0 overflow-y-auto shadow-lg shadow-slate-100/50 no-print text-left">
              <div className="space-y-6 flex-1">
                
                {/* Profile Identity Card */}
                <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-150 rounded-2xl">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-blue-600 to-indigo-650 text-white font-bold flex items-center justify-center shadow-md shadow-blue-500/10">
                    {studentName ? studentName.substring(0, 2).toUpperCase() : "AA"}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-800 leading-tight truncate">{studentName || "Nama Murid"}</h4>
                    <p className="text-[10px] text-slate-505 font-bold uppercase mt-0.5">No. Absen: {studentAbsen || '—'}</p>
                  </div>
                </div>

                {/* Completion Meter */}
                <div className="space-y-2 pb-2 border-b border-slate-100">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-605">
                    <span>Progres Jawaban</span>
                    <span>{Object.keys(quizAnswers).length} / {localQuestionsOnline.length} Terjawab</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-emerald-500 h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${(Object.keys(quizAnswers).length / localQuestionsOnline.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Peta Kisi Map check list */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                    <BookOpenCheck className="w-3.5 h-3.5 text-blue-555" /> Navigasi Lembar Soal
                  </h5>
                  <p className="text-[10px] text-slate-400 italic">Klik tombol nomor di bawah untuk langsung melompat ke nomor soal tersebut:</p>
                  
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {localQuestionsOnline.map((q) => {
                      const ans = quizAnswers[q.number];
                      const hasAnswer = ans !== undefined && ans !== "";
                      
                      let statusBg = "bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50";
                      
                      if (quizSubmitted) {
                        const isPG = q.type === 'Pilihan Ganda';
                        const isBS = q.type === 'Benar Salah';
                        if (isPG) {
                          const correctIdx = getCorrectOptionIndex(q);
                          statusBg = ans === correctIdx ? "bg-emerald-500 border-transparent text-white font-bold animate-pulse" : "bg-rose-500 border-transparent text-white font-bold";
                        } else if (isBS) {
                          const key = String(q.answerKey).toUpperCase().trim();
                          const studentStr = String(ans || "").toUpperCase().trim();
                          const isKeyBenar = key.includes("BENAR") || key === "B" || key === "TRUE";
                          const isAnsBenar = studentStr === "BENAR";
                          statusBg = isKeyBenar === isAnsBenar ? "bg-emerald-500 border-transparent text-white font-bold animate-pulse" : "bg-rose-500 border-transparent text-white font-bold";
                        } else {
                          statusBg = "bg-blue-555 border-transparent text-white font-bold";
                        }
                      } else if (hasAnswer) {
                        statusBg = "bg-gradient-to-br from-indigo-650 to-blue-600 border-transparent text-white font-extrabold shadow-sm shadow-blue-500/10 animate-scaleIn";
                      }

                      return (
                        <button
                          key={q.number}
                          onClick={() => {
                            document.getElementById(`q-card-${q.number}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          className={cn(
                            "h-10 w-full rounded-xl border text-xs flex items-center justify-center font-bold transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95",
                            statusBg
                          )}
                        >
                          {q.number}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit Action block */}
              {!quizSubmitted && (
                <div className="pt-4 border-t border-slate-100 mt-6 md:sticky md:bottom-0 bg-white">
                  <button
                    onClick={() => {
                      const answeredCount = Object.keys(quizAnswers).length;
                      if (answeredCount < localQuestionsOnline.length) {
                        const confirmSelesai = window.confirm(`Bapak/Ibu/Murid baru menjawab ${answeredCount} dari ${localQuestionsOnline.length} pertanyaan. Apakah Anda yakin ingin mengirim lembar jawaban sekarang?`);
                        if (!confirmSelesai) return;
                      } else {
                        const confirmSelesai = window.confirm("Apakah Anda yakin ingin menyelesaikan lembar ujian dan kumpul jawaban sekarang?");
                        if (!confirmSelesai) return;
                      }
                      calculateScore();
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 rounded-xl font-extrabold text-xs cursor-pointer shadow-md shadow-blue-500/15 flex items-center justify-center gap-2 transition-all hover:shadow-lg"
                  >
                    <Send className="w-4 h-4" /> Kirim Jawaban Ujian 🚀
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    );
  }

  // =========================================================================
  // RENDER UTAMA: LAYOUT ANTARMUKA STANDAR CETAK / OFFLINE (KERTAS DESAIN)
  // Hanya dirender jika status 'isOnlineMode' bernilai false.
  // =========================================================================
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-32 px-4 font-sans text-slate-900 leading-relaxed card shadow-sm">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print { 
          .no-print, button, header, nav, aside, footer, .sticky, input[type="file"] { display: none !important; } 
          body, main, #root { background: white !important; padding: 0 !important; margin: 0 !important; width: 100% !important; -webkit-print-color-adjust: exact; } 
          .print-container { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; } 
          table, .spreadsheet-table { width: 100% !important; border-collapse: collapse !important; } 
          .spreadsheet-table th, .spreadsheet-table td { border: 1px solid #000000 !important; padding: 6px !important; font-size: 10pt !important; } 
          .print-only-header { display: block !important; } 
          .screen-only-header { display: none !important; } 
          .print-identity-table { display: table !important; width: 100% !important; border: 1px solid #000 !important; border-collapse: collapse !important; font-size: 10pt !important; } 
          .print-identity-table > tbody > tr > td { border: 1px solid #000 !important; padding: 6px !important; width: 50% !important; vertical-align: top !important; } 
          .inner-table { width: 100% !important; border: none !important; margin: 0 !important; }
          .inner-table tr td { border: none !important; padding: 2px 4px 2px 0 !important; vertical-align: top !important; }
          .screen-identity-grid { display: none !important; } 
          .print-watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 5.5rem;
            font-weight: 900;
            color: rgba(220, 220, 220, 0.1) !important;
            z-index: -1;
            pointer-events: none;
            white-space: nowrap;
            display: block !important;
            text-transform: uppercase;
          }
        } 
        .print-only-header, .print-identity-table, .print-watermark { display: none; }
        .spreadsheet-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        .spreadsheet-table td, .spreadsheet-table th { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
        @media screen {
          .print-container {
            margin: 0 auto;
            border-radius: 12px;
          }
        }
      `}} />

      {/* BAR NAVIGASI ATAS (NO-PRINT) */}
      <div className="flex flex-col gap-4 no-print bg-white/95 backdrop-blur-md p-4 rounded-[1.5rem] border border-slate-200 sticky top-4 z-40 shadow-xl shadow-blue-900/5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-3">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-600 font-bold hover:text-blue-700 transition-colors py-2 text-sm cursor-pointer">
            <ChevronLeft className="w-5 h-5" /> Kembali ke Form
          </button>

          <div className="relative self-end sm:self-auto">
            <button disabled={isTabLoading} onClick={() => setShowExportOptions(!showExportOptions)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md flex items-center gap-2 text-sm transition-all cursor-pointer">
              <Download className="w-4 h-4" /> Unduh / Cetak
            </button>
            
            <AnimatePresence>
              {showExportOptions && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <button onClick={downloadWord} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-slate-700 transition-colors border-b border-slate-100 font-medium text-left text-xs cursor-pointer">
                    <FileText className="w-4 h-4 text-blue-500" /> Format Word (.doc)
                  </button>
                  <button onClick={handlePrint} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-slate-700 transition-colors font-medium text-left text-xs cursor-pointer">
                    <Printer className="w-4 h-4 text-orange-500" /> Cetak Langsung Browser
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sub-Navigasi Halaman Asesmen */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center animate-fadeIn no-print">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <NavButton id="soal" icon={FileText} label="Soal Evaluasi" />
            <NavButton id="kunci" icon={Key} label="Kunci & Rubrik" />
            <NavButton id="kisi" icon={ClipboardCheck} label="Kisi-kisi" />
          </div>
          
          {activeTab === 'soal' && (
            <button
              onClick={handleToggleOnlineMode}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer shadow-sm",
                isOnlineMode 
                  ? "bg-rose-600 hover:bg-rose-750 text-white border-transparent shadow-rose-500/10" 
                  : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-150"
              )}
            >
              <span>{isOnlineMode ? '❌ Tutup Mode Ujian Online (Ke Cetak / Offline)' : '🌐 Aktifkan Mode Ujian Online (Interaktif)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* LEMBAR KERTAS DOKUMEN UTAMA */}
      <div ref={containerRef} className="print-container bg-white p-8 md:p-12 shadow-2xl border border-slate-200 min-h-[1000px] relative text-slate-900 rounded-2xl">
        
        {/* Efek Watermark saat Print */}
        <div className="print-watermark">
          {data?.identitas?.schoolName || formInput.schoolName || "DOKUMEN ASLI"}
        </div>

        {isTabLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="font-bold text-blue-900 animate-pulse text-sm">Sista AI sedang merumuskan halaman ini...</p>
          </div>
        )}
        
        {/* KONTEN UTAMA: ASESMEN & EVALUASI */}
        <div className="animate-fadeIn">
          {/* Kop / Header Identitas Asesmen */}
          <div className="text-center border-b-4 border-double border-black pb-4 mb-4">
            <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wide screen-only-header">{getHeaderText()}</h1>
            <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wide print-only-header">{getHeaderText()}</h1>
            <h2 className="text-sm md:text-lg font-bold uppercase tracking-wide mt-1.5 text-blue-900">{getAssessmentTypeName()}</h2>
            <p className="text-xs md:text-sm font-medium mt-1 text-slate-500">TAHUN AJARAN {formInput.academicYear}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1 mb-8 text-[10px] md:text-xs border border-black p-4 screen-identity-grid">
            <table className="w-full text-left border-none">
              <tbody>
                <tr><td className="font-bold uppercase whitespace-nowrap w-[140px] py-0.5 border-none">Satuan Pendidikan</td><td className="w-3 font-bold py-0.5 border-none">:</td><td className="py-0.5 border-none">{formInput.schoolName}</td></tr>
                <tr><td className="font-bold uppercase whitespace-nowrap w-[140px] py-0.5 border-none">Mata Pelajaran</td><td className="w-3 font-bold py-0.5 border-none">:</td><td className="py-0.5 border-none">{formInput.subject}</td></tr>
                <tr><td className="font-bold uppercase whitespace-nowrap w-[140px] py-0.5 border-none">Kelas / Fase</td><td className="w-3 font-bold py-0.5 border-none">:</td><td className="py-0.5 border-none">Kelas {formInput.grade} / {formInput.phase || '-'}</td></tr>
                <tr><td className="font-bold uppercase whitespace-nowrap w-[140px] py-0.5 border-none">Semester</td><td className="w-3 font-bold py-0.5 border-none">:</td><td className="py-0.5 border-none">{formInput.semester}</td></tr>
              </tbody>
            </table>
            <table className="w-full text-left border-none">
              <tbody>
                <tr><td className="font-bold uppercase whitespace-nowrap w-[100px] py-0.5 border-none">Nama Guru</td><td className="w-3 font-bold py-0.5 border-none">:</td><td className="py-0.5 border-none">{formInput.teacherName}</td></tr>
                <tr><td className="font-bold uppercase whitespace-nowrap w-[100px] py-0.5 border-none">NIP Guru</td><td className="w-3 font-bold py-0.5 border-none">:</td><td className="py-0.5 border-none">{formInput.teacherNip}</td></tr>
                <tr><td className="font-bold uppercase whitespace-nowrap w-[100px] py-0.5 border-none">Jabatan</td><td className="w-3 font-bold py-0.5 border-none">:</td><td className="py-0.5 border-none">{formInput.position}</td></tr>
                <tr><td className="font-bold uppercase whitespace-nowrap w-[100px] py-0.5 border-none">Alokasi Waktu</td><td className="w-3 font-bold py-0.5 border-none">:</td><td className="py-0.5 border-none">{formInput.timeAllocation || data?.header?.timeLimit || '60 Menit'}</td></tr>
              </tbody>
            </table>
          </div>

          <table className="print-identity-table mb-8">
            <tbody>
              <tr>
                <td className="p-2">
                  <table className="inner-table text-[10px] border-none">
                    <tbody>
                      <tr><td className="font-bold whitespace-nowrap w-[140px] border-none">SATUAN PENDIDIKAN</td><td className="font-bold w-3 border-none">:</td><td className="border-none">{formInput.schoolName}</td></tr>
                      <tr><td className="font-bold whitespace-nowrap w-[140px] border-none">MATA PELAJARAN</td><td className="font-bold w-3 border-none">:</td><td className="border-none">{formInput.subject}</td></tr>
                      <tr><td className="font-bold whitespace-nowrap w-[140px] border-none">KELAS / FASE</td><td className="font-bold w-3 border-none">:</td><td className="border-none">Kelas {formInput.grade} / {formInput.phase || '-'}</td></tr>
                      <tr><td className="font-bold whitespace-nowrap w-[140px] border-none">SEMESTER</td><td className="font-bold w-3 border-none">:</td><td className="border-none">{formInput.semester}</td></tr>
                    </tbody>
                  </table>
                </td>
                <td className="p-2">
                  <table className="inner-table text-[10px] border-none">
                    <tbody>
                      <tr><td className="font-bold whitespace-nowrap w-[100px] border-none">NAMA GURU</td><td className="font-bold w-3 border-none">:</td><td className="border-none">{formInput.teacherName}</td></tr>
                      <tr><td className="font-bold whitespace-nowrap w-[100px] border-none">NIP GURU</td><td className="font-bold w-3 border-none">:</td><td className="border-none">{formInput.teacherNip}</td></tr>
                      <tr><td className="font-bold whitespace-nowrap w-[100px] border-none">JABATAN</td><td className="font-bold w-3 border-none">:</td><td className="border-none">{formInput.position}</td></tr>
                      <tr><td className="font-bold whitespace-nowrap w-[100px] border-none">ALOKASI WAKTU</td><td className="font-bold w-3 border-none">:</td><td className="border-none">{formInput.timeAllocation || data?.header?.timeLimit || '60 Menit'}</td></tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* TAB EVALUASI SOAL (MODE CETAK STANDAR OFFLINE) */}
          {activeTab === 'soal' && (
            <div className="space-y-8">
              <p className="font-bold border-b border-gray-200 pb-2 italic text-slate-800 text-[11px] md:text-sm">Petunjuk: Kerjakanlah soal-soal di bawah ini dengan jujur dan teliti!</p>
              {localQuestionsCetak.map((q) => {
                const isAbove = q.text?.toLowerCase()?.includes('di atas') || false;    
                const teksLengkap = `${q.text || ''} ${q.stimulus || ''}`.toLowerCase();
                const butuhGambar = q.imagePrompt || 
                                   teksLengkap.includes('perhatikan gambar') || 
                                   teksLengkap.includes('amati gambar') ||
                                   teksLengkap.includes('pada gambar di') ||
                                   teksLengkap.includes('perhatikan grafik') ||
                                   teksLengkap.includes('amati grafik') ||
                                   teksLengkap.includes('disajikan gambar') ||
                                   teksLengkap.includes('disajikan grafik');
                                   
                return (
                  <div key={q.number} className="break-inside-avoid border-b border-slate-100 pb-6 space-y-4">
                    {q.stimulus && (
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-4 text-justify italic text-xs md:text-sm">
                        <div className="whitespace-pre-wrap leading-relaxed text-slate-800">{q.stimulus}</div>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-4">
                      {butuhGambar && (
                        generatedImages[q.number] ? (
                          <div className={cn("relative group", isAbove ? "w-full max-w-2xl mx-auto" : "max-w-sm")}>
                            <img src={generatedImages[q.number]} className="w-full h-auto rounded-xl border border-slate-200 shadow-sm" alt={`Stimulus visual soal ${q.number}`} />
                            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity no-print bg-slate-900/60 backdrop-blur-sm p-1.5 rounded-xl">
                              <label className="p-1.5 bg-white text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Ganti Gambar">
                                <RefreshCw className="w-4 h-4" />
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, q.number)} />
                              </label>
                              <button onClick={() => handleRemoveImage(q.number)} title="Hapus Gambar" className="p-1.5 bg-white text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="no-print flex gap-3 mt-2">
                            <button onClick={() => handleChatGPTRedirect(q)} className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer">
                              <ExternalLink className="w-4 h-4" /> Buat Gambar di ChatGPT
                            </button>
                            <label className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm">
                              <Upload className="w-4 h-4 text-blue-600" /> Unggah Gambar (Komputer)
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, q.number)} />
                            </label>
                          </div>
                        )
                      )}

                      <div className="flex items-start gap-4 question-row">
                        <span className="font-bold min-w-[25px] h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 text-sm question-num">
                          {q.number}.
                        </span>
                        <div className="flex-1 question-text">
                          <div className="text-justify leading-relaxed whitespace-pre-wrap font-medium text-slate-900 text-xs md:text-sm">{q.text}</div>
                        </div>
                      </div>
                    </div> {/* <-- Mengunci penutup bagian konten atas soal */}

                    {/* Render Bentuk Soal Secara Dinamis */}
                    <div className="ml-9 space-y-4">
                      {q.type === 'Pilihan Ganda' && q.options && (
                        <div className="grid grid-cols-1 gap-2 ml-2 mt-2">
                          {q.options.map((opt, i) => (
                            <div key={i} className="flex gap-3 items-start text-xs md:text-sm option-row">
                              <span className="font-bold text-slate-700 w-5 option-letter">
                                {String.fromCharCode(65 + i)}.
                              </span>
                              <span className="text-slate-800 option-text">
                                {cleanOptionText(opt, i)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {q.type === 'Benar Salah' && (
                        <div className="flex gap-4 ml-2">
                          <div className="flex items-center gap-2"><div className="w-5 h-5 border-2 rounded-full border-slate-400" /><span className="text-xs md:text-sm font-bold text-slate-700">BENAR</span></div>
                          <div className="flex items-center gap-2"><div className="w-5 h-5 border-2 rounded-full border-slate-400" /><span className="text-xs md:text-sm font-bold text-slate-700">SALAH</span></div>
                        </div>
                      )}
                      {q.type === 'Pilihan Ganda Kompleks' && q.multiOptions && (
                        <div className="grid grid-cols-1 gap-3 ml-2">
                          {q.multiOptions.map((opt, i) => {
                            const teksOpsi = typeof opt === 'object' && opt !== null ? (opt.text || '') : opt;
                            return (
                              <div key={i} className="flex gap-3 items-center text-xs md:text-sm">
                                <div className="w-5 h-5 border-2 rounded border-slate-400 shrink-0" />
                                <span className="text-slate-800 font-medium">{teksOpsi || `Pernyataan Pilihan ${i + 1}`}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {q.type === 'Menjodohkan' && q.matchingPairs && (
                        <div className="ml-2">
                          <table className="w-full border-2 border-slate-300 border-collapse">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="border-2 border-slate-300 p-2 text-[11px] md:text-xs font-bold w-1/2 text-slate-700">Pernyataan A</th>
                                <th className="border-2 border-slate-300 p-2 text-[11px] md:text-xs font-bold w-1/2 text-slate-700">Pernyataan B</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                // 1. Gandakan data dan acak urutannya khusus untuk kolom B
                                const shuffledB = [...q.matchingPairs].sort(() => Math.random() - 0.5);
                                
                                // 2. Tampilkan baris tabel (Kolom A tetap urut, Kolom B pakai yang diacak)
                                return q.matchingPairs.map((pair, i) => {
                                  // Ambil nilai untuk kolom A dan kolom B
                                  const valueA = pair.prompt;
                                  const valueB = shuffledB[i].target || shuffledB[i].answer || ""; // Pastikan string kosong jika tidak ada data
                                
                                  // Buat fungsi kecil untuk mengecek apakah sebuah string adalah URL gambar
                                  const isImageUrl = (url: string) => {
                                    return typeof url === 'string' && 
                                           (url.startsWith('http') || url.startsWith('/')) && 
                                           url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null; // Saya tambahkan webp dan "i" (case-insensitive) agar lebih kebal
                                  };
                                
                                  return (
                                    <tr key={i}>
                                      {/* Kolom A */}
                                      <td className="border-2 border-slate-300 p-3 text-xs md:text-sm text-slate-800">
                                        {valueA}
                                      </td>
                                      {/* Kolom B */}
                                      <td className="border-2 border-slate-300 p-3 text-sm text-slate-800">
                                        {/* Gunakan ternary operator untuk rendering kondisional */}
                                        {isImageUrl(valueB) ? (
                                          // JIKA GAMBAR, TAMPILKAN TAG <img>
                                          <img 
                                            src={valueB} 
                                            alt={`Jawaban untuk ${pair.prompt}`} 
                                            className="max-h-24 w-auto rounded" 
                                          />
                                        ) : (
                                          // JIKA BUKAN GAMBAR, TAMPILKAN TEKS
                                          <span>{valueB}</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                });
                              })()} {/* <--- PENUTUP FUNGSI IIFE */}
                            </tbody>
                          </table>
                        </div>
                      )} {/* <--- PENUTUP KONDISI SOAL MENJODOHKAN */}
                      {q.type === 'Isian Singkat' && <div className="ml-2 mt-4"><div className="w-full border-b-2 border-slate-400 border-dotted h-8" /></div>}
                      {q.type === 'Uraian' && <div className="ml-2 mt-4 space-y-2"><div className="w-full border-b-2 border-slate-400 border-dotted h-8" /><div className="w-full border-b-2 border-slate-400 border-dotted h-8" /></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB KUNCI JAWABAN & RUBRIK */}
          {activeTab === 'kunci' && (
            <div className="space-y-8">
              <h3 className="text-lg font-bold border-b-2 border-blue-200 pb-2 text-blue-800 uppercase tracking-tighter">Kunci Jawaban & Rubrik Penilaian</h3>
              <table className="spreadsheet-table w-full">
                <thead>
                  <tr>
                    <th className="w-16 text-center bg-slate-50">No</th>
                    <th className="bg-slate-50">Kunci Jawaban & Rubrik Penilaian</th>
                  </tr>
                </thead>
                <tbody>
                  {localQuestionsCetak.map((q) => {
                    const rawScore = q.score || q.explanation || "";
                    const hasSplitter = rawScore.includes("ANALISIS SKOR:");
                    const pembahasan = hasSplitter ? rawScore.split("ANALISIS SKOR:")[0].replace("PEMBAHASAN MATERI:", "").trim() : null;
                    const analisis = hasSplitter ? rawScore.split("ANALISIS SKOR:")[1].trim() : rawScore;

                    return (
                      <tr key={q.number}>
                        <td className="text-center font-bold font-mono pt-4 text-slate-700">{q.number}</td>
                        <td>
                          <div className="space-y-4 p-4">
                            <div className="flex items-start gap-2 border-b border-slate-100 pb-2">
                              <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded shrink-0 uppercase">Kunci</span>
                              <p className="font-bold text-slate-900">{formatAnswerKey(q.answerKey)}</p>
                            </div>
                            {pembahasan && (
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pembahasan Materi:</p>
                                <p className="text-sm text-slate-700 italic leading-relaxed whitespace-pre-wrap">{pembahasan}</p>
                              </div>
                            )}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-1">
                                {pembahasan ? "Analisis Skor & Rubrik:" : "Rubrik Penilaian:"}
                              </p>
                              <span className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-sans block">
                                {analisis || "Skor 1 jika murid menjawab dengan tepat. Skor 0 jika salah/kosong."}
                              </span>
                            </div>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase mt-2">Level Kognitif: {q.cognitiveLevel || 'MOTS'}</p>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB KISI-KISI ASESMEN */}
          {activeTab === 'kisi' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold border-b-2 border-blue-200 pb-2 text-blue-800 uppercase tracking-tighter">Matriks Kisi-kisi Asesmen</h3>
              <div className="overflow-x-auto">
                <table className="spreadsheet-table w-full">
                  <thead>
                    <tr>
                      <th className="text-center w-12 bg-slate-50">No</th>
                      <th className="text-center bg-slate-50">Capaian & Tujuan Pembelajaran</th>
                      <th className="text-center bg-slate-50">Materi Pokok</th>
                      <th className="text-center bg-slate-50">Indikator Soal</th>
                      <th className="text-center w-20 bg-slate-50">Level</th>
                      <th className="text-center w-32 bg-slate-50">Bentuk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localKisiKisi.map((item) => (
                      <tr key={item.no}>
                        <td className="text-center font-bold font-mono text-slate-700">{item.no}</td>
                        <td className="text-xs leading-relaxed">
                          <b>CP:</b> <p className="mb-2 italic text-slate-600">{formInput.cp}</p>
                          <b>TP:</b> <p className="text-slate-800 font-medium">{item.tp}</p>
                        </td>
                        <td className="text-xs font-semibold text-slate-800">
                          {item.materiPokok || currentMaterial}
                        </td>
                        <td className="text-xs italic text-slate-700">{item.indikatorSoal}</td>
                        <td className="text-center">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                            {item.levelKognitif}
                          </span>
                        </td>
                        <td className="text-center w-32 whitespace-nowrap">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200 inline-block">
                            {item.bentukSoal}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* TANDA TANGAN (SIGNATURE) OTOMATIS DI BAGIAN BAWAH */}
        {activeTab !== 'soal' && (
          <div className="mt-16 w-full">
            <table className="w-full border-none border-collapse text-sm">
              <tbody>
                <tr>
                  <td className="w-1/2 text-left align-top p-0 border-none">
                    <p className="mb-1">Mengetahui,</p>
                    <p className="mb-0">Kepala Sekolah</p>
                    <div className="mt-20"> 
                      <p className="font-bold underline mb-0">{formInput.principalName || "(Nama Kepala Sekolah)"}</p>
                      <p className="text-sm mt-0 text-slate-600">NIP. {formInput.principalNip || ".........................."}</p>
                    </div>
                  </td>
                  <td className="w-1/2 text-left align-top p-0 border-none">
                    <p className="mb-1">
                      {formInput.regionName || '.................'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="mb-0">{formInput.position || 'Guru Kelas'}</p>
                    <div className="mt-20">
                      <p className="font-bold underline mb-0">{formInput.teacherName || "(Nama Guru)"}</p>
                      <p className="text-sm mt-0 text-slate-600">NIP. {formInput.teacherNip || ".........................."}</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
