import { useState } from 'react';
import styles from './personal-student-detail.module.css';

type Props = {
  url: string;
  alt: string;
  mimeType: string;
  className?: string;
};

/** Thumbnail de imagem com fallback elegante se o carregamento falhar. */
export function StudentMediaThumbnail({ url, alt, mimeType, className }: Props) {
  const [broken, setBroken] = useState(false);
  const isImage = mimeType.startsWith('image/');

  if (!isImage) {
    return null;
  }

  if (broken) {
    return (
      <div className={`${styles.thumbFallback} ${className ?? ''}`} role="img" aria-label={alt}>
        <span>Preview indisponível</span>
        <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>Não foi possível carregar a imagem.</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={`${styles.thumbImage} ${className ?? ''}`}
      onError={() => setBroken(true)}
      loading="lazy"
    />
  );
}
