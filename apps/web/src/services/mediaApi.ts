import { API_URL } from '@/lib/api-config';
import { readErrorMessageFromResponse } from '@/lib/read-api-error';
import type {
  MediaEntityType,
  MediaFileRecord,
  MediaKind,
  UploadUrlResponse,
} from '@/types/media';

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  } as const;
}

export type RequestUploadUrlBody = {
  kind: MediaKind;
  fileName: string;
  mimeType: string;
  entityType: MediaEntityType;
  entityId?: string;
};

export async function requestUploadUrl(
  accessToken: string,
  body: RequestUploadUrlBody,
): Promise<UploadUrlResponse> {
  const res = await fetch(`${API_URL}/media/upload-url`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessageFromResponse(res, 'Erro ao gerar URL de upload'));
  }
  return res.json();
}

/** Upload direto ao S3 (PUT na signed URL). */
export async function putFileToSignedUrl(
  uploadUrl: string,
  file: Blob,
  mimeType: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', mimeType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((100 * e.loaded) / e.total));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else
        reject(
          new Error(
            xhr.status === 403 || xhr.status === 401
              ? 'Upload negado (URL expirada ou sem permissão). Gere uma nova URL e tente de novo.'
              : `Armazenamento retornou erro ${xhr.status}. Verifique o arquivo e tente novamente.`,
          ),
        );
    };
    xhr.onerror = () => reject(new Error('Falha de rede no upload para S3'));
    xhr.send(file);
  });
}

export type ConfirmUploadBody = {
  bucket: string;
  objectKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  kind: MediaKind;
  entityType: MediaEntityType;
  entityId?: string;
};

export async function confirmMediaUpload(
  accessToken: string,
  body: ConfirmUploadBody,
): Promise<MediaFileRecord> {
  const res = await fetch(`${API_URL}/media/confirm`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessageFromResponse(res, 'Erro ao confirmar upload'));
  }
  return res.json();
}

export type ListMediaParams = {
  kind?: MediaKind;
  entityType?: MediaEntityType;
  entityId?: string;
  ownerUserId?: string;
};

export async function listMedia(
  accessToken: string,
  params: ListMediaParams = {},
): Promise<MediaFileRecord[]> {
  const q = new URLSearchParams();
  if (params.kind) q.set('kind', params.kind);
  if (params.entityType) q.set('entityType', params.entityType);
  if (params.entityId) q.set('entityId', params.entityId);
  if (params.ownerUserId) q.set('ownerUserId', params.ownerUserId);
  const qs = q.toString();
  const res = await fetch(`${API_URL}/media${qs ? `?${qs}` : ''}`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessageFromResponse(res, 'Erro ao listar mídia'));
  }
  return res.json();
}

export async function deleteMedia(accessToken: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/media/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessageFromResponse(res, 'Erro ao remover mídia'));
  }
}

export type AssessmentRow = {
  id: string;
  studentId: string;
  data: string;
  peso: number | null;
  imc: number | null;
  observacoes: string | null;
};

export async function listMyAssessments(
  accessToken: string,
  studentId?: string,
): Promise<AssessmentRow[]> {
  const qs = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
  const res = await fetch(`${API_URL}/assessments/my${qs}`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessageFromResponse(res, 'Erro ao listar avaliações'));
  }
  return res.json();
}

export async function createAssessment(
  accessToken: string,
  body: { studentId?: string; peso?: number; observacoes?: string },
): Promise<AssessmentRow> {
  const res = await fetch(`${API_URL}/assessments`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessageFromResponse(res, 'Erro ao criar avaliação'));
  }
  return res.json();
}
