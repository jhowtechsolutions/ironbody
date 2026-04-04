import { useEffect, useRef, useState } from 'react';
import type { MediaEntityType, MediaKind } from '@/types/media';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { InlineErrorMessage } from '@/components/ui/InlineErrorMessage';

const ACCEPT_BY_KIND: Record<MediaKind, string> = {
  PHOTO_PROGRESS: 'image/jpeg,image/png,image/webp',
  PHOTO_ASSESSMENT: 'image/jpeg,image/png,image/webp',
  EXERCISE_GIF: 'image/gif',
  EXERCISE_VIDEO: 'video/mp4,video/webm',
  OTHER: 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm',
};

type Props = {
  accessToken: string;
  kind: MediaKind;
  entityType: MediaEntityType;
  entityId?: string;
  label?: string;
  onUploaded?: (id: string, url: string) => void;
};

export function FileUploadField({
  accessToken,
  kind,
  entityType,
  entityId,
  label = 'Selecionar arquivo',
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, loading, progress, error, setError } = useMediaUpload();
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 6000);
    return () => window.clearTimeout(t);
  }, [success]);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);
    const record = await upload(file, {
      accessToken,
      kind,
      entityType,
      entityId,
    });
    if (record) {
      setSuccess('Arquivo enviado e registrado com sucesso.');
      onUploaded?.(record.id, record.url);
    }
    e.target.value = '';
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_BY_KIND[kind]}
        style={{ display: 'none' }}
        onChange={onChange}
        disabled={loading}
      />
      <button
        type="button"
        className="btn btn-secondary"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? `Enviando… ${progress}%` : label}
      </button>
      {error ? <InlineErrorMessage message={error} /> : null}
      {success ? (
        <p style={{ color: 'var(--success, #22c55e)', fontSize: '0.875rem', marginTop: 8 }} role="status">
          {success}
        </p>
      ) : null}
    </div>
  );
}
