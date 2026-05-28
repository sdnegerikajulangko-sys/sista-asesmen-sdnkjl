import { SoalFormData, GeneratedSoal } from "../types";

// Fungsi pembantu untuk memberikan jeda waktu (dalam milidetik)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ===================================================================
// SEKURITI FETCH DENGAN STRATEGI AUTOMATIC FALLBACK (GEMINI -> GROQ)
// ===================================================================
async function fetchSecureWithRetry(url: string, options: any, retries = 3, backoff = 2000, currentProvider = "gemini"): Promise<any> {
  try {
    // Memasukkan parameter provider & model secara dinamis ke dalam body request
    const originalBody = JSON.parse(options.body || "{}");
    
    // Tentukan model otomatis jika menggunakan Groq
    const assignedModel = currentProvider === "groq" ? "openai/gpt-oss-20b" : "gemini-2.5-flash";

    const updatedOptions = {
      ...options,
      body: JSON.stringify({
        ...originalBody,
        provider: currentProvider,
        model: assignedModel
      })
    };

    console.log(`[AI REQUEST] Mengakses ${url} menggunakan Provider: ${currentProvider.toUpperCase()}`);
    const response = await fetch(url, updatedOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || "";
      
      // Deteksi jika server utama bermasalah atau kuota habis
      const isServerIssue = response.status === 429 || response.status === 503 || response.status === 500;

      if (isServerIssue && retries > 0) {
        // SWAP PROVIDER: Jika Gemini gagal, langsung ganti target ke Groq untuk retry selanjutnya
        const nextProvider = currentProvider === "gemini" ? "groq" : "gemini";
        
        console.warn(
          `[FIDHAL TOUNA AI] Kendala pada ${currentProvider.toUpperCase()} (Status: ${response.status}). ` +
          `Mengalihkan sistem ke ${nextProvider.toUpperCase()} dalam ${backoff}ms... (Sisa percobaan: ${retries})`
        );
        
        await delay(backoff);
        return fetchSecureWithRetry(url, options, retries - 1, backoff * 1.5, nextProvider);
      }
      
      throw new Error(errorMessage || `Gagal memproses data pada rute ${url} (Status: ${response.status})`);
    }
    
    return await response.json();
  } catch (error: any) {
    const errorMsg = error.message?.toLowerCase() || "";
    const isDemandIssue = errorMsg.includes("demand") || errorMsg.includes("quota") || errorMsg.includes("limit");
    
    if (retries > 0 && isDemandIssue) {
      const nextProvider = currentProvider === "gemini" ? "groq" : "gemini";
      await delay(backoff);
      return fetchSecureWithRetry(url, options, retries - 1, backoff * 1.5, nextProvider);
    }
    throw error;
  }
}

// BASE CUSTOM INSTRUCTION
const CUSTOM_INSTRUCTION = `PENTING: Gunakan selalu kata 'murid' untuk merujuk pada anak didik. Jangan pernah menggunakan istilah 'peserta didik'.

STRICT RULE - BATASAN MATERI MUTLAK (MATERI POKOK VS CP):
1. Teks "Capaian Pembelajaran" (cp) HANYA berfungsi sebagai payung konteks kurikulum. DILARANG KERAS mengambil atau merancang soal dari topik yang ada di dalam teks CP JIKA topik tersebut tidak ditulis secara eksplisit di dalam "Materi Pokok" (material).
2. DISTRIBUSI MATERI POKOK: Perhatikan dengan saksama kolom input "Materi Pokok". Jika terdapat lebih dari 1 materi pokok, Anda WAJIB membagi jumlah soal secara proporsional untuk mencakup SELURUH materi tersebut. Jangan hanya fokus pada materi pertama!
3. HEADER MATERI POKOK: Dilarang keras memodifikasi, merangkum, atau menambahkan materi pokok lain ke dalam output data 'header'. Output 'material' pada header harus PERSIS sama dengan input pengguna.

STRICT RULE - ATURAN PEMBUATAN SOAL PILIHAN GANDA KOMPLEKS (PGK):
Khusus untuk soal tipe "Pilihan Ganda Kompleks", Anda WAJIB mengisi properti 'multiOptions' dengan minimal 3 atau 4 kalimat pernyataan mandiri (Contoh: ["Pernyataan A benar", "Pernyataan B salah", "Pernyataan C", "Pernyataan D"]). 
DILARANG KERAS membiarkan 'multiOptions' kosong ([]) jika tipe soal Pilihan Ganda Kompleks!

STRICT RULE - PEMILIHAN STIMULUS VISUAL OTOMATIS SECARA ACAK:
1. Berikan peluang 20%-30% bagi sebuah soal untuk memiliki stimulus visual (butuh gambar).
2. JIKA ADA GAMBAR: Tambahkan properti 'imagePrompt' berisi deskripsi visual yang sangat spesifik dalam BAHASA INGGRIS (contoh: "A clear mathematical diagram of a cube").
3. JIKA TANPA GAMBAR: Jangan tambahkan 'imagePrompt' atau isi dengan null/string kosong.

STRICT RULE - PEMBAHASAN DAN LOGIKA SKOR/RUBRIK WAJIB TERPISAH:
Setiap soal WAJIB memiliki properti 'score' dengan format berikut:

"PEMBAHASAN MATERI:\n[Penjelasan logis agar murid paham konteksnya]\n\nANALISIS SKOR:\nSkor Maksimal: [Angka_Skor]\n\nRubrik Penilaian:\n[Detail_Aturan_Penilaian]"

1. PG: Max 1. (Benar 1, Salah 0)
2. PGK: Max [Jumlah Opsi Benar]. (Proporsional 1 poin per jawaban benar)
3. BS: Max 1. (Tepat 1, Salah 0)
4. Menjodohkan: Max [Jumlah Pasangan]. (1 poin per pasangan benar)
5. Isian Singkat: Max 2. (Tepat 2, Mendekati 1, Salah 0)
6. Uraian: Max 4 atau 5. (Bobot dari 0 hingga Max berdasarkan kelengkapan argumen)`;


// ==========================================
// 1. HANYA GENERATE SOAL UTAMA (VERSI SIAP CETAK)
// ==========================================
export async function generateSoalOnly(data: SoalFormData): Promise<GeneratedSoal> {
  try {
    console.log("Memulai pembuatan soal utama versi siap cetak...");
    
    const materialArray = Array.isArray(data.material) ? data.material : [data.material];
    const validMaterials = materialArray.filter((m: string) => m && m.trim() !== '');
    
    const materialForAI = validMaterials.join(' DAN ');
    const materialForHeader = validMaterials.join(', ');

    let selectedLevel = "MOTS";
    if (Array.isArray(data.cognitiveLevel) && data.cognitiveLevel.length > 0) {
      selectedLevel = data.cognitiveLevel.join(', ');
    } else if (typeof data.cognitiveLevel === 'string') {
      selectedLevel = data.cognitiveLevel;
    }

    const strictCetakRule = `
\n\nSTRICT RULE - KESESUAIAN JENJANG KELAS:
Soal ini dirancang khusus untuk murid **Kelas ${data.grade}**. Anda WAJIB menyesuaikan penggunaan bahasa, pilihan kosakata, panjang pendeknya teks stimulus, serta kompleksitas logika berpikir agar 100% adaptif dan sesuai dengan tingkat perkembangan kognitif anak usia Kelas ${data.grade}.

STRICT RULE - LEVEL KOGNITIF MUTLAK:
Pengguna meminta level kognitif: ${selectedLevel}. SELURUH (100%) soal yang dibuat WAJIB didistribusikan secara baik pada level kognitif tersebut.

STRICT RULE - FORMAT SIAP CETAK DI KERTAS:
Soal ini akan langsung dicetak ke kertas fisik. Susun teks pertanyaan, pilihan, dan stimulus agar bersih, rapi, terstruktur secara konvensional, serta tidak melibatkan instruksi/fitur interaktif digital (seperti tombol click, drag-drop text, atau link online).`;

    const payload = {
      ...data,
      cognitiveLevel: selectedLevel, 
      subject: `KONSENTRASI KHUSUS: ${materialForAI}`,
      cp: "KOSONG. DILARANG MEMBUAT SOAL BERDASARKAN PENGETAHUAN UMUM.",
      material: `[WARNING MATERI MUTLAK: 100% SOAL WAJIB HANYA MEMBAHAS TENTANG [${materialForAI}]. DILARANG KERAS MEMBUAT SOAL TENTANG RUKUN ISLAM, SYAHADAT, ATAU TOPIK LAINNYA!]`,
      customInstruction: CUSTOM_INSTRUCTION + strictCetakRule 
    };

    // Fungsi fetch ini sekarang otomatis mengontrol penentuan LLM
    const dataSoal = await fetchSecureWithRetry('/api/generate/soal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return {
      header: {
        ...dataSoal.header,
        subject: data.subject, 
        material: materialForHeader 
      },
      questions: dataSoal.questions.map((q: any) => ({
        ...q,
        imagePrompt: q.imagePrompt || null,
        options: q.options || [],
        multiOptions: q.multiOptions || [],
        cognitiveLevel: q.cognitiveLevel || selectedLevel 
      })),
      kisiKisi: []
    };
  } catch (error: any) {
    console.error("Error Frontend Soal Utama (Cetak):", error);
    throw error;
  }
}


// ==========================================
// 2. GENERATE SOAL ONLINE
// ==========================================
export async function generateSoalOnlineOnly(header: any, questions: any[]): Promise<any[]> {
  try {
    console.log("Mengonversi soal cetak menjadi format interaktif online...");

    const strictOnlineRule = `
\n\nSTRICT RULE - FORMAT INTERAKTIF ONLINE / LMS:
Tugas Anda adalah mengambil bank soal yang sudah ada dan menstrukturkannya kembali agar optimal dijalankan pada sistem ujian online komputer/gawai (CBT/LMS).
Pastikan properti pendukung multimedia, metadata validasi jawaban instan, sistem pembobotan digital, dan struktur array objek pilihan ganda kompleks (multiOptions) dibuat sangat rapi agar sistem frontend aplikasi dapat melakukan render komponen interaktif dan fungsi auto-grading dengan sempurna.`;

    const dataOnline = await fetchSecureWithRetry('/api/generate/soal-online', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        header, 
        questions,
        customInstruction: CUSTOM_INSTRUCTION + strictOnlineRule
      }),
    });
    
    return dataOnline.questions;
  } catch (error: any) {
    console.error("Error Frontend Konversi Soal Online:", error);
    throw error;
  }
}


// ==========================================
// 3. GENERATE KUNCI JAWABAN & RUBRIK
// ==========================================
export async function generateKunciOnly(header: any, questions: any[]): Promise<any[]> {
  try {
    const dataKunci = await fetchSecureWithRetry('/api/generate/kunci', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        header, 
        questions,
        customInstruction: CUSTOM_INSTRUCTION 
      }),
    });
    
    return dataKunci.questions.map((q: any) => ({
      ...q,
      score: q.score || q.explanation || q.rubrik || "Belum ada pembahasan."
    }));
  } catch (error: any) {
    console.error("Error Frontend Kunci:", error);
    throw error;
  }
}


// ==========================================
// 4. GENERATE KISI-KISI
// ==========================================
export async function generateKisiOnly(formInput: SoalFormData, questions: any[]): Promise<any[]> {
  try {
    const selectedLevel = formInput.cognitiveLevel || (formInput as any).levelKognitif || "MOTS";
    const strictCognitiveRule = `\n\nSTRICT RULE - LEVEL KOGNITIF:\nKisi-kisi WAJIB selaras dengan soal. Semua indikator soal harus mencerminkan level kognitif ${selectedLevel}.`;

    const dataKisi = await fetchSecureWithRetry('/api/generate/kisi-kisi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        formInput, 
        questions,
        customInstruction: CUSTOM_INSTRUCTION + strictCognitiveRule 
      }),
    });
    return dataKisi.kisiKisi;
  } catch (error: any) {
    console.error("Error Frontend Kisi-kisi:", error);
    throw error;
  }
}
