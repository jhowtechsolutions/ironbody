import { useCallback, useEffect, useRef } from 'react';
import type { MediaFileRecord } from '@/types/media';
import { formatPtDate } from '@/lib/personal-media-filters';
import styles from './personal-student-detail.module.css';

type Props = {
  media: MediaFileRecord | null;
  onClose: () => void;
};

export function MediaPreviewModal({ media, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!media) return;
    document.addEventListener('keydown', handleKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [media, handleKeyDown]);

  if (!media) return null;

  const isImage = media.mimeType.startsWith('image/');

  return (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.modalPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-preview-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          className={styles.modalClose}
          onClick={onClose}
          aria-label="Fechar visualização"
        >
          ×
        </button>
        <h2 id="media-preview-title" className={styles.srOnly}>
          Pré-visualização de mídia
        </h2>
        <div className={styles.modalMediaWrap}>
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={styles.modalImage}
              src={media.url}
              alt={`${media.kind} · ${formatPtDate(media.createdAt)}`}
            />
          ) : (
            <video className={styles.modalVideo} src={media.url} controls playsInline />
          )}
        </div>
        <div className={styles.modalMeta}>
          <p style={{ margin: '0 0 4px', color: 'var(--text)' }}>
            <strong>Tipo:</strong> {media.kind}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Data:</strong> {formatPtDate(media.createdAt)}
          </p>
          {media.entityId ? (
            <p style={{ margin: '6px 0 0' }}>
              <strong>Avaliação:</strong> {media.entityId}
            </p>
          ) : null}
        </div>
        <div className={styles.modalActions}>
          <a
            href={media.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            aria-label="Abrir arquivo original em nova aba"
          >
            Abrir URL original
          </a>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Fechar modal">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
