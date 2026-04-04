import { useCallback, useEffect, useState } from 'react';
import { deleteMedia, listMedia, type ListMediaParams } from '@/services/mediaApi';
import type { MediaFileRecord } from '@/types/media';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageErrorState } from '@/components/ui/PageErrorState';
import { PageLoadingState } from '@/components/ui/PageLoadingState';

type Props = {
  accessToken: string;
  query: ListMediaParams;
  canDelete?: boolean;
  onRefreshKey?: number;
};

export function MediaGallery({ accessToken, query, canDelete = true, onRefreshKey = 0 }: Props) {
  const [items, setItems] = useState<MediaFileRecord[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await listMedia(accessToken, query);
      setItems(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro ao carregar');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, query.kind, query.entityType, query.entityId, query.ownerUserId]);

  useEffect(() => {
    void load();
  }, [load, onRefreshKey]);

  async function onDelete(id: string) {
    if (!canDelete || !confirm('Remover esta mídia?')) return;
    try {
      await deleteMedia(accessToken, id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro ao remover');
    }
  }

  if (loading) {
    return <PageLoadingState bare message="Carregando mídia…" />;
  }
  if (err) {
    return (
      <PageErrorState
        inline
        title="Não foi possível carregar a lista"
        message={err}
        onRetry={() => void load()}
      />
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState title="Nenhum arquivo" description="Envie um arquivo usando o botão acima. Ele aparecerá aqui." />
    );
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
      {items.map((m) => (
        <li
          key={m.id}
          className="card"
          style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
        >
          {m.mimeType.startsWith('image/') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.url} alt="" style={{ maxWidth: 120, maxHeight: 120, objectFit: 'cover', borderRadius: 8 }} />
          ) : (
            <video src={m.url} controls style={{ maxWidth: 200, maxHeight: 120, borderRadius: 8 }} />
          )}
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{m.kind}</div>
            <div style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{m.objectKey}</div>
          </div>
          {canDelete ? (
            <button type="button" className="btn btn-ghost" onClick={() => onDelete(m.id)}>
              Excluir
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
