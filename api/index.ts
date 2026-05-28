import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai"; 
import dotenv from "dotenv";

dotenv.config();

const currentDir = process.cwd();
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// ===================================================================
// KLIEN INISIALISASI (MULTI-LLM)
// ===================================================================
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("SISTA Server Error: GEMINI_API_KEY belum terpasang.");
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("SISTA Server Error: GROQ_API_KEY belum terpasang.");
  }
  return new OpenAI({
    apiKey: apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
};

// ===================================================================
// WRAPPER UTAMA MULTI-LLM
// ===================================================================
const generateAIContent = async (prompt: string, provider: string = "gemini", model?: string): Promise<string> => {
  if (provider === "groq") {
    const groq = getGroqClient();
    const response = await (groq as any).responses.create({
      model: model || "openai/gpt-oss-20b", 
      input: prompt,
    });
    return response.output_text || "";
  } else {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({ 
      model: model || "gemini-2.5-flash", 
      contents: prompt,
      config: { responseMimeType: "application/json", maxOutputTokens: 8192 }
    });
    return response.text || "";
  }
};

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================
const formatMaterialsHelper = (material: any) => {
  return Array.isArray(material) 
    ? material.filter((m: string) => m.trim() !== '').map((m: string, i: number) => `${i + 1}. ${m}`).join("\n      ")
    : material;
};

// PERBAIKAN 1: Mempertahankan karakter \n agar baris aturan prompt terbaca terstruktur oleh AI
const sanitizePromptString = (text: any): string => {
  if (!text) return "";
  return String(text)
    .replace(/\\/g, "\\\\")   
    .replace(/"/g, "'")       
    .replace(/\r/g, "")
    .trim();
};

const safeParseJSON = (responseText: string) => {
  let cleanText = responseText.trim();
  if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  }
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    return JSON.parse(cleanText.replace(/[\u0000-\u001F]+/g, ""));
  }
};

// ===================================================================
// 1. ENDPOINT: GENERATE LEMBAR SOAL UTAMA (VERSI SIAP CETAK)
// ===================================================================
app.post("/api/generate/soal", async (req, res) => {
  try {
    const { customInstruction, provider, model, ...data } = req.body;
    
    const configs = data.questionConfigs ? data.questionConfigs.map((c: any) => 
      `${c.count} soal ${c.type}`
    ).join(", ") : "beberapa soal";

    const sSchoolName = sanitizePromptString(data.schoolName);
    const sSubject = sanitizePromptString(data.subject);
    const sGrade = sanitizePromptString(data.grade);
    const sSemester = sanitizePromptString(data.semester);
    const sCp = sanitizePromptString(data.cp);
    const sMaterial = sanitizePromptString(data.material); 
    const sInstruction = customInstruction; // Jangan disanitasi kompresi agar baris barunya tetap utuh
    const sCognitiveLevel = sanitizePromptString(data.cognitiveLevel || data.levelKognitif || "MOTS");

    // PERBAIKAN 2 & 3: Memperluas panduan cetak biru skema JSON untuk mengakomodasi seluruh rumpun tipe tipe soal
    const prompt = `
      Bertindaklah sebagai Pakar Asesmen Kurikulum Merdeka tingkat Sekolah Dasar. 
      Tugas: Buat instrumen butir soal untuk mata pelajaran: ${sSubject || "Umum"}, Kelas ${sGrade || ""}.
      
      MATERI POKOK (WAJIB FOKUS 100% KE SINI): ${sMaterial || "Umum"}
      Capaian Pembelajaran (CP): ${sCp || ""}
      LEVEL KOGNITIF TERPILIH (MUTLAK): ${sCognitiveLevel}
      
      Konfigurasi Paket Soal: ${configs}
      
      ATURAN TAMBAHAN (WAJIB DIPATUHI):
      ${sInstruction || ""}
      
      PENTING & WAJIB: 
      1. Jawab HANYA dengan JSON valid sesuai struktur di bawah. 
      2. Jika terdapat kata yang membutuhkan tanda kutip dua, Anda WAJIB mengubahnya menjadi kutip tunggal (') agar JSON tidak rusak.
      3. ATURAN LEVEL KOGNITIF MUTLAK: Seluruh butir soal wajib berada pada level berpikir tingkat ${sCognitiveLevel}.
      4. KETENTUAN OPSI PILIHAN GANDA: Jangan pernah menyertakan prefix abjad seperti 'A. ', 'B. ' di dalam teks pilihan objek. Langsung tuliskan substansi kalimat jawabannya saja.
      5. KETENTUAN STRUKTUR BERDASARKAN TIPE SOAL:
         - Jika tipe 'Pilihan Ganda': Isi 'options' dengan 4 opsi jawaban, 'multiOptions' dan 'matchingPairs' kosongkan ([]).
         - Jika tipe 'Pilihan Ganda Kompleks': Isi 'multiOptions' dengan 3-4 kalimat pernyataan mandiri, 'options' kosongkan ([]).
         - Jika tipe 'Menjodohkan': Isi 'matchingPairs' dengan array pasangan objek [{"prompt": "Soal Kiri", "answer": "Kunci Kanan"}], 'options' kosongkan ([]).
         - Jika tipe 'Benar Salah', 'Isian Singkat', atau 'Uraian': Properti 'options', 'multiOptions', dan 'matchingPairs' dikosongkan ([]).

      STRUKTUR JSON WAJIB:
      {
        "header": {
          "schoolName": "${sSchoolName}", 
          "subject": "${sSubject}", 
          "classSemester": "${sGrade} / ${sSemester}", 
          "material": "${sMaterial}", 
          "timeLimit": "60 Menit"
        },
        "questions": [
          {
            "number": 1,
            "type": "Pilihan Ganda / Pilihan Ganda Kompleks / Benar Salah / Menjodohkan / Isian Singkat / Uraian",
            "stimulus": "Isi teks stimulus bacaan jika dibutuhkan, jika tidak kosongkan saja",
            "text": "Teks kalimat pertanyaan soal...",
            "options": [],
            "multiOptions": [],
            "matchingPairs": [],
            "imagePrompt": null,
            "cognitiveLevel": "${sCognitiveLevel}" 
          }
        ]
      }
    `;

    const responseText = await generateAIContent(prompt, provider, model);
    const rawData = safeParseJSON(responseText || "");

    const parsedData = {
      header: rawData.header || {},
      questions: (rawData.questions || []).map((q: any, idx: number) => {
        const isPGK = q.type?.toLowerCase().includes("kompleks");
        const finalMultiOptions = isPGK && (!q.multiOptions || q.multiOptions.length === 0) 
          ? (q.options || []) 
          : (q.multiOptions || []);

        return {
          number: q.number || (idx + 1),
          type: q.type || "Pilihan Ganda",
          stimulus: q.stimulus || "",
          text: q.text || "",
          imagePrompt: q.imagePrompt || null,
          options: isPGK ? [] : (q.options || []),
          multiOptions: finalMultiOptions,
          matchingPairs: q.matchingPairs || [],
          answerKey: q.answerKey || "",
          explanation: q.explanation || "",
          cognitiveLevel: q.cognitiveLevel || sCognitiveLevel 
        };
      }),
      kisiKisi: []
    };

    res.json(parsedData);
  } catch (error: any) {
    console.error("[SOAL ERROR]:", error);
    if (error.message?.includes("quota") || error.message?.includes("429") || error.status === "RESOURCE_EXHAUSTED" || error.status === 429) {
      return res.status(429).json({ error: "Kuota harian API (Gemini/Groq) telah habis atau terkena rate-limit." });
    }
    res.status(500).json({ error: "Gagal memproses soal: " + error.message });
  }
});

// ===================================================================
// 2. ENDPOINT: KONVERSI KE FORMAT SOAL ONLINE / INTERAKTIF
// ===================================================================
app.post("/api/generate/soal-online", async (req, res) => {
  try {
    const { header, questions, customInstruction, provider, model } = req.body;

    const prompt = `
      Bertindaklah sebagai Pakar Instruksional Desain Teknis & Digital Assessment (LMS/CBT).
      Tugas Anda adalah memproses ulang susunan paket soal cetak yang sudah ada agar terstruktur secara optimal untuk sistem ujian online komputer interaktif.

      PANDUAN ATURAN BAHASA & SISTEM:
      ${customInstruction || "Sesuaikan format agar kompatibel dengan mesin auto-grading gawai."}

      SOAL KERTAS ASLI YANG HARUS DIKONVERSI:
      ${JSON.stringify(questions)}

      STRUKTUR OUTPUT JSON WAJIB:
      {
        "questions": [
          {
            "number": 1,
            "type": "Tipe Soal",
            "stimulus": "Teks stimulus",
            "text": "Teks pertanyaan",
            "options": ["Opsi jika ada"],
            "multiOptions": ["Opsi khusus PGK jika ada"],
            "matchingPairs": [],
            "imagePrompt": "Prompt gambar jika ada",
            "cognitiveLevel": "Level kognitif"
          }
        ]
      }
    `;

    const responseText = await generateAIContent(prompt, provider, model);
    const rawData = safeParseJSON(responseText || "");

    res.json({ header, questions: rawData.questions || [] });
  } catch (error: any) {
    console.error("[SOAL ONLINE ERROR]:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// ===================================================================
// 3. ENDPOINT: GENERATE KUNCI JAWABAN & BAHASAN
// ===================================================================
app.post("/api/generate/kunci", async (req, res) => {
  try {
    const { questions, customInstruction, provider, model } = req.body; 

    const prompt = `
      Bertindaklah sebagai Pakar Evaluasi Pendidikan. Tugas Anda adalah menganalisis daftar instrumen soal di bawah ini dan merumuskan KUNCI JAWABAN yang valid beserta PEMBAHASAN/RUBRIK PENILAIAN yang mendalam untuk setiap butir soal.

      PANDUAN ATURAN UTAMA:
      ${customInstruction || "Gunakan istilah bahasa Indonesia yang baku."}

      SOAL YANG HARUS DIBUATKAN KUNCI & BAHASAN:
      ${JSON.stringify(questions)}

      PETUNJUK PENGISIAN JAWABAN:
      - Pilihan Ganda: Berikan abjad jawaban yang benar saja (Contoh: "A" atau "B").
      - Pilihan Ganda Kompleks: Berikan list teks opsi mana saja yang bernilai benar.
      - Benar Salah: Tulis kunci jawaban berupa teks "BENAR" atau "SALAH".
      - Isian Singkat: Berikan kunci jawaban yang pendek, tepat, dan baku.
      - Uraian: Berikan poin jawaban ideal beserta kriteria rubrik skor nilai di dalam kolom deskripsi penjelasan.

      STRUKTUR OUTPUT JSON:
      {
        "questions": [
          {
            "number": 1,
            "answerKey": "Jawaban Benar",
            "explanation": "Alasan mendalam mengapa jawaban tersebut benar."
          }
        ]
      }
    `;

    const responseText = await generateAIContent(prompt, provider, model);
    const rawData = safeParseJSON(responseText || "");

    const updatedQuestions = questions.map((origQ: any) => {
      const aiKeyData = (rawData.questions || []).find((item: any) => item.number === origQ.number);
      return {
        ...origQ,
        answerKey: aiKeyData?.answerKey || "A",
        explanation: aiKeyData?.explanation || "Belum ada pembahasan."
      };
    });

    res.json({ questions: updatedQuestions });
  } catch (error: any) {
    console.error("[KUNCI ERROR]:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// ===================================================================
// 4. ENDPOINT: GENERATE KISI-KISI MATRIKS ASESMEN
// ===================================================================
app.post("/api/generate/kisi-kisi", async (req, res) => {
  try {
    const { formInput, questions, customInstruction, provider, model } = req.body; 

    const formattedMaterials = formatMaterialsHelper(formInput?.material);
    const sCp = sanitizePromptString(formInput?.cp);

    const prompt = `
      Bertindaklah sebagai Penyusun Kurikulum Merdeka. Tugas Anda adalah memetakan dan membuat matriks KISI-KISI SOAL yang selaras sempurna dengan materi pokok, Capaian Pembelajaran (CP), dan butir soal yang sudah ada.

      PANDUAN ATURAN UTAMA:
      ${customInstruction || "Gunakan istilah bahasa Indonesia yang baku."}

      DATA RUJUKAN:
      - CP Utama: ${sCp || ""}
      - Daftar Materi Pokok: \n${formattedMaterials}
      - Daftar Butir Soal Terbentuk: ${JSON.stringify(questions ? questions.map((q: any) => ({ number: q.number, type: q.type, text: q.text, level: q.cognitiveLevel })) : [])}

      STRUKTUR OUTPUT JSON WAJIB:
      {
        "kisiKisi": [
          {
            "no": 1,
            "tp": "Rumusan Tujuan Pembelajaran buatan Anda",
            "indikatorSoal": "Kalimat indikator ketercapaian operasional butir soal",
            "levelKognitif": "LOTS/MOTS/HOTS sesuai level soal terkait",
            "bentukSoal": "Bentuk tipe soal terkait"
          }
        ]
      }
    `;

    const responseText = await generateAIContent(prompt, provider, model);
    const rawData = safeParseJSON(responseText || "");

    res.json({ kisiKisi: rawData.kisiKisi || [] });
  } catch (error: any) {
    console.error("[KISI-KISI ERROR]:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// ===================================================================

const distPath = path.join(currentDir, "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));

export default app;

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
