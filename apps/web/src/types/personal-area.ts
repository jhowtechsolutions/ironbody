import type { MediaFileRecord } from '@/types/media';

export type LinkedStudent = {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  planType: string | null;
  createdAt: string;
};

export type BodyMeasureRow = {
  id: string;
  assessmentId: string;
  medida: string;
  valor: number;
  unidade: string;
  createdAt: string;
};

export type AdipometryRow = {
  id: string;
  assessmentId: string;
  local: string;
  valor: number;
  createdAt: string;
};

/** Resposta de GET /assessments/student/:studentId */
export type StudentAssessmentDetail = {
  id: string;
  studentId: string;
  data: string;
  peso: number | null;
  imc: number | null;
  observacoes: string | null;
  createdAt: string;
  bodyMeasures: BodyMeasureRow[];
  adipometry: AdipometryRow[];
  mediaFiles: MediaFileRecord[];
};
