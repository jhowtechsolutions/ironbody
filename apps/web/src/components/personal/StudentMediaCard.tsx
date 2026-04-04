import { useState } from 'react';
import type { MediaFileRecord } from '@/types/media';
import { formatPtDate } from '@/lib/personal-media-filters';
import { StudentMediaThumbnail } from './StudentMediaThumbnail';
import styles from './personal-student-detail.module.css';

type Props = {
  item: MediaFileRecord;
  onPreview: (m: MediaFileRecord) => void;
  assessmentHint?: string | null;
};

export function StudentMediaCard({ item, onPreview, assessmentHint }: Props) {
  const alt = `Mídia ${item.kind} enviada em ${formatPtDate(item.createdAt)}`;
  const isImage = item.mimeType.startsWith('image/');
  const [videoBroken, setVideoBroken] = useState(false);

  return (
    <article className={styles.mediaCard}>
      <div className={styles.mediaCardThumbWrap}>
        {isImage ? (
          <button
            type="button"
            className={styles.thumbButton}
            onClick={() => onPreview(item)}
            aria-label={`Ampliar imagem: ${item.kind}`}
          >
            <StudentMediaThumbnail url={item.url} alt={alt} mimeType={item.mimeType} />
          </button>
        ) : (
          <button
            type="button"
            className={styles.thumbButton}
            onClick={() => onPreview(item)}
            aria-label={`Abrir vídeo em tela cheia: ${item.kind}`}
          >
            {videoBroken ? (
              <div className={styles.thumbFallback}>
                <span>Vídeo</span>
                <span style={{ fontSize: '0.75rem' }}>Toque para abrir no leitor</span>
              </div>
            ) : (
              <video
                className={styles.thumbImage}
                src={item.url}
                muted
                playsInline
                preload="metadata"
                onError={() => setVideoBroken(true)}
              />
            )}
          </button>
        )}
      </div>
      <div className={styles.mediaCardBody}>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{formatPtDate(item.createdAt)}</p>
        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{item.kind}</p>
        {assessmentHint ? (
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{assessmentHint}</p>
        ) : null}
        <div className={styles.mediaCardActions}>
          <button type="button" className="btn btn-primary" onClick={() => onPreview(item)} aria-label="Ampliar mídia">
            Ampliar
          </button>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
            aria-label="Abrir mídia em nova aba"
          >
            Nova aba
          </a>
        </div>
      </div>
    </article>
  );
}
