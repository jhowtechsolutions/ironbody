import { useMemo, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoadingState } from '@/components/ui/PageLoadingState';
import { FileUploadField } from '@/components/media/FileUploadField';
import { MediaGallery } from '@/components/media/MediaGallery';

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'pt-BR', ['common'])) } };
}

export default function EvolucaoAlunoPage() {
  const { t } = useTranslation('common');
  const { user, loading, logout, accessToken } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const galleryQuery = useMemo(
    () => ({ kind: 'PHOTO_PROGRESS' as const, entityType: 'USER_PROGRESS' as const }),
    [],
  );

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
        <h1 className="dashboard-title">
          {t('app.name')} · Foto de evolução
        </h1>
        <nav className="dashboard-nav">
          <Link href="/dashboard/aluno">Dashboard</Link>
          <Link href="/dashboard/aluno/avaliacao">Avaliação</Link>
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
          Envie fotos de evolução (JPEG, PNG ou WebP). O arquivo vai direto para o S3 com URL assinada;
          depois o registro é confirmado na API.
        </p>
        <div className="card" style={{ marginBottom: 24, padding: 16 }}>
          <h2 style={{ marginBottom: 12, fontSize: '1.125rem', fontWeight: 600 }}>Nova foto</h2>
          <FileUploadField
            accessToken={accessToken}
            kind="PHOTO_PROGRESS"
            entityType="USER_PROGRESS"
            label="Enviar foto de evolução"
            onUploaded={() => setRefreshKey((k) => k + 1)}
          />
        </div>
        <div className="card" style={{ padding: 16 }}>
          <h2 style={{ marginBottom: 12, fontSize: '1.125rem', fontWeight: 600 }}>Suas fotos</h2>
          <MediaGallery accessToken={accessToken} query={galleryQuery} onRefreshKey={refreshKey} />
        </div>
      </main>
    </div>
  );
}
