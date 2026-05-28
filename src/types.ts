export interface SoalFormData {
  schoolName: string;
  subject: string;
  grade: string;
  semester: string;
  phase?: string;
  academicYear: string;
  teacherName: string;
  teacherNip: string;
  principalName: string;
  principalNip: string;
  regionName: string;
  position: string;
  timeAllocation: string;
  cp: string;
  material: string | string[];
  cognitiveLevel: string;
  questionConfigs?: Array<{
    type: string;
    count: number;
  }>;
}

export interface GeneratedSoal {
  header: {
    schoolName: string;
    subject: string;
    classSemester: string;
    material: string;
    timeLimit: string;
  };
  questions: Array<{
    number: number;
    type: string;
    stimulus?: string;
    text: string;
    options: string[];
    multiOptions?: string[];
    // PERBAIKAN: Diubah menjadi tidak opsional agar aman saat diparsing di Soal Online
    matchingPairs: Array<{ prompt: string; answer?: string }>; 
    imagePrompt?: string | null;
    cognitiveLevel: string;
    answerKey?: any;
    explanation?: string;
    score?: string;
  }>;
  kisiKisi: Array<{
    no: number;
    tp: string;
    materiPokok?: string;
    indikatorSoal: string;
    levelKognitif: string;
    bentukSoal: string;
  }>;
}

export type QuestionType = 'Pilihan Ganda' | 'Pilihan Ganda Kompleks' | 'Isian Singkat' | 'Uraian' | 'Benar Salah' | 'Menjodohkan';

export interface QuestionConfig {
  type: QuestionType;
  count: number;
  optionCount?: number;
  scorePerItem?: number;
}
