import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoadingState } from '@/components/ui/PageLoadingState';
import { FileUploadField } from '@/components/media/FileUploadField';
import { MediaGallery } from '@/components/media/MediaGallery';
import type { AssessmentRow } from '@/services/mediaApi';
import { createAssessment, listMyAssessments } from '@/services/mediaApi';

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'pt-BR', ['common'])) } };
}

export default function AvaliacaoAlunoPage() {
  const { t } = useTranslation('common');
  const { user, loading, logout, accessToken } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadAssessments = useCallback(async () => {
    if (!accessToken) return;
    try {
      const rows = await listMyAssessments(accessToken);
      setAssessments(rows);
      setSelectedId((prev) => prev || (rows[0]?.id ?? ''));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro ao listar avaliações');
    }
  }, [accessToken]);

  useEffect(() => {
    void loadAssessments();
  }, [loadAssessments]);

  async function handleCreate() {
    if (!accessToken) return;
    setCreating(true);
    setErr(null);
    try {
      const row = await createAssessment(accessToken, {});
      setAssessments((prev) => [row, ...prev]);
      setSelectedId(row.id);
      setRefreshKey((k) => k + 1);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro ao criar avaliação');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <PageLoadingState />;
  }
  if (!user || user.role !== 'ALUNO' || !accessToken) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p style={{ marginBottom: 16, color: 'var(--text)' }}>Acesso negado.</p>
          <Link href="/login" className="btn btn-primary">
            Ir para login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="dashboard-header">
        <h1 className="dashboard-title">{t('app.name')} · Fotos de avaliação</h1>
        <nav className="dashboard-nav">
          <Link href="/dashboard/aluno">Dashboard</Link>
          <Link href="/dashboard/aluno/evolucao">Evolução</Link>
          <Link href="/dashboard/aluno/conta">Conta</Link>
        </nav>
        <div className="dashboard-user">
          <span>{user.name}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            {t('nav.logout')}
          </button>
        </div>
      </header>
      <main className="container" style={{ padding: 24 }}>
        <p style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Crie uma avaliação (registro) e anexe fotos vinculadas a ela. Formatos: JPEG, PNG ou WebP.
        </p>
        {err ? <p style={{ color: 'salmon', marginBottom: 12 }}>{err}</p> : null}
        <div className="card" style={{ marginBottom: 24, padding: 16 }}>
          <h2 style={{ marginBottom: 12, fontSize: '1.125rem', fontWeight: 600 }}>Avaliações</h2>
          <button type="button" className="btn btn-secondary" disabled={creating} onClick={handleCreate}>
            {creating ? 'Criando…' : 'Nova avaliação'}
          </button>
          {assessments.length > 0 ? (
            <label style={{ display: 'block', marginTop: 16, fontSize: '0.9375rem' }}>
              Vincular foto à avaliação:
              <select
                className="input"
                style={{ marginTop: 8, width: '100%', maxWidth: 400, display: 'block' }}
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {assessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id.slice(0, 8)}… · {new Date(a.data).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              Crie uma avaliação para habilitar o envio de fotos.
            </p>
          )}
          {selectedId ? (
            <div style={{ marginTop: 16 }}>
              <FileUploadField
                accessToken={accessToken}
                kind="PHOTO_ASSESSMENT"
                entityType="ASSESSMENT"
                entityId={selectedId}
                label="Enviar foto da avaliação"
                onUploaded={() => setRefreshKey((k) => k + 1)}
              />
            </div>
          ) : null}
        </div>
        {selectedId ? (
          <div className="card" style={{ padding: 16 }}>
            <h2 style={{ marginBottom: 12, fontSize: '1.125rem', fontWeight: 600 }}>Mídias desta avaliação</h2>
            <MediaGallery
              accessToken={accessToken}
              query={{
                kind: 'PHOTO_ASSESSMENT',
                entityType: 'ASSESSMENT',
                entityId: selectedId,
              }}
              onRefreshKey={refreshKey}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}
