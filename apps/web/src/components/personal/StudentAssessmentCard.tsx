import type { MediaFileRecord } from '@/types/media';
import type { StudentAssessmentDetail } from '@/types/personal-area';
import { formatPtDate } from '@/lib/personal-media-filters';
import { StudentMediaThumbnail } from './StudentMediaThumbnail';
import styles from './personal-student-detail.module.css';

type Props = {
  assessment: StudentAssessmentDetail;
  onMediaPreview: (m: MediaFileRecord) => void;
};

export function StudentAssessmentCard({ assessment: a, onMediaPreview }: Props) {
  const hasMeasures = a.bodyMeasures && a.bodyMeasures.length > 0;
  const hasAdipo = a.adipometry && a.adipometry.length > 0;
  const hasMedia = a.mediaFiles && a.mediaFiles.length > 0;

  return (
    <article className={styles.assessmentCard}>
      <header className={styles.assessmentHeader}>
        <span className={styles.assessmentDate}>{formatPtDate(a.data)}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {a.id}</span>
      </header>

      <div className={styles.assessmentMetrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Peso</span>
          <span className={styles.metricValue}>{a.peso != null ? `${a.peso} kg` : 'Não informado'}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>IMC</span>
          <span className={styles.metricValue}>{a.imc != null ? a.imc.toFixed(1) : 'Não informado'}</span>
        </div>
      </div>

      {a.observacoes ? (
        <p className={styles.obsText}>
          <strong style={{ color: 'var(--text)' }}>Observações:</strong> {a.observacoes}
        </p>
      ) : null}

      {hasMeasures ? (
        <div className={styles.subSection}>
          <h4 className={styles.subSectionTitle}>Medidas corporais</h4>
          <ul className={styles.measureList}>
            {a.bodyMeasures!.map((b) => (
              <li key={b.id}>
                {b.medida}: <span style={{ color: 'var(--text)' }}>{b.valor}</span> {b.unidade}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasAdipo ? (
        <div className={styles.subSection}>
          <h4 className={styles.subSectionTitle}>Adipometria</h4>
          <ul className={styles.measureList}>
            {a.adipometry!.map((ad) => (
              <li key={ad.id}>
                {ad.local}: <span style={{ color: 'var(--text)' }}>{ad.valor}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasMedia ? (
        <div className={styles.subSection}>
          <h4 className={styles.subSectionTitle}>Mídias desta avaliação</h4>
          <div className={styles.assessmentMediaGrid}>
            {a.mediaFiles!.map((m) => {
              const alt = `Foto da avaliação de ${formatPtDate(a.data)}`;
              const isImg = m.mimeType.startsWith('image/');
              return (
                <button
                  key={m.id}
                  type="button"
                  className={styles.thumbSmButton}
                  onClick={() => onMediaPreview(m)}
                  aria-label={`Ampliar mídia da avaliação: ${m.kind}`}
                >
                  {isImg ? (
                    <StudentMediaThumbnail url={m.url} alt={alt} mimeType={m.mimeType} />
                  ) : (
                    <div className={styles.thumbFallback} style={{ height: '100%', minHeight: 100 }}>
                      Vídeo
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
  );
}
