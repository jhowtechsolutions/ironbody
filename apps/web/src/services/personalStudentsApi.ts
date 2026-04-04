import { API_URL } from '@/lib/api-config';
import { readErrorMessageFromResponse } from '@/lib/read-api-error';
import type { LinkedStudent, StudentAssessmentDetail } from '@/types/personal-area';
import type { MediaEntityType, MediaFileRecord, MediaKind } from '@/types/media';

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  } as const;
}

export async function listMyStudents(accessToken: string): Promise<LinkedStudent[]> {
  const res = await fetch(`${API_URL}/users/my-students`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessageFromResponse(res, 'Erro ao listar alunos'));
  }
  return res.json();
}

export type ListStudentMediaParams = {
  kind?: MediaKind;
  entityType?: MediaEntityType;
  entityId?: string;
};

export async function listStudentMedia(
  accessToken: string,
  studentId: string,
  params: ListStudentMediaParams = {},
): Promise<MediaFileRecord[]> {
  const q = new URLSearchParams();
  if (params.kind) q.set('kind', params.kind);
  if (params.entityType) q.set('entityType', params.entityType);
  if (params.entityId) q.set('entityId', params.entityId);
  const qs = q.toString();
  const res = await fetch(
    `${API_URL}/media/student/${encodeURIComponent(studentId)}${qs ? `?${qs}` : ''}`,
    { headers: authHeaders(accessToken) },
  );
  if (!res.ok) {
    throw new Error(await readErrorMessageFromResponse(res, 'Erro ao carregar mídias do aluno'));
  }
  return res.json();
}

export async function listStudentAssessments(
  accessToken: string,
  studentId: string,
): Promise<StudentAssessmentDetail[]> {
  const res = await fetch(`${API_URL}/assessments/student/${encodeURIComponent(studentId)}`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessageFromResponse(res, 'Erro ao carregar avaliações'));
  }
  return res.json();
}
