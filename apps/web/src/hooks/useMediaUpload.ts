import { useCallback, useState } from 'react';
import {
  confirmMediaUpload,
  putFileToSignedUrl,
  requestUploadUrl,
} from '@/services/mediaApi';
import type { MediaEntityType, MediaFileRecord, MediaKind } from '@/types/media';

export type MediaUploadOptions = {
  accessToken: string;
  kind: MediaKind;
  entityType: MediaEntityType;
  entityId?: string;
};

export function useMediaUpload() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File, opts: MediaUploadOptions): Promise<MediaFileRecord | null> => {
      setError(null);
      setProgress(0);
      setLoading(true);
      try {
        const meta = await requestUploadUrl(opts.accessToken, {
          kind: opts.kind,
          fileName: file.name,
          mimeType: file.type,
          entityType: opts.entityType,
          entityId: opts.entityId,
        });
        await putFileToSignedUrl(meta.uploadUrl, file, file.type, (p) => setProgress(p));
        const record = await confirmMediaUpload(opts.accessToken, {
          bucket: meta.bucket,
          objectKey: meta.objectKey,
          url: meta.publicUrl,
          mimeType: file.type,
          sizeBytes: file.size,
          kind: opts.kind,
          entityType: opts.entityType,
          entityId: opts.entityId,
        });
        setProgress(100);
        return record;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Falha no upload';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { upload, loading, progress, error, setError };
}
