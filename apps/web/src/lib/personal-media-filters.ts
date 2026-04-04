import type { MediaFileRecord } from '@/types/media';
import type { StudentAssessmentDetail } from '@/types/personal-area';

/** Evolução: progresso do aluno. */
export function filterProgressPhotos(media: MediaFileRecord[]): MediaFileRecord[] {
  return media.filter(
    (m) => m.kind === 'PHOTO_PROGRESS' || m.entityType === 'USER_PROGRESS',
  );
}

/** Fotos ligadas a avaliações (lista geral + dedupe). */
export function filterAssessmentPhotos(
  media: MediaFileRecord[],
  assessments: StudentAssessmentDetail[],
): MediaFileRecord[] {
  const fromList = media.filter(
    (m) => m.kind === 'PHOTO_ASSESSMENT' || m.entityType === 'ASSESSMENT',
  );
  const fromNested = assessments.flatMap((a) => a.mediaFiles ?? []);
  const byId = new Map<string, MediaFileRecord>();
  for (const m of [...fromList, ...fromNested]) {
    byId.set(m.id, m);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function formatPtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}
