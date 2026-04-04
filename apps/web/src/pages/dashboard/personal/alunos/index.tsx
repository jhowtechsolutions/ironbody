import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useAuth } from '@/contexts/AuthContext';
import { PersonalSubnav } from '@/components/personal/PersonalSubnav';
import { PersonalPageShell } from '@/components/personal/PersonalPageShell';
import { PageLoadingState } from '@/components/ui/PageLoadingState';
import { PageErrorState } from '@/components/ui/PageErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePersonalStudents } from '@/hooks/usePersonalStudents';
import { formatPtDate } from '@/lib/personal-media-filters';

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'pt-BR', ['common'])) } };
}

export default function PersonalAlunosPage() {
  const { t } = useTranslation('common');
  const { user, logout, accessToken } = useAuth();
  const { students, loading, error, reload } = usePersonalStudents(accessToken);

  return (
    <PersonalPageShell>
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="dashboard-header">
        <h1 className="dashboard-title">{t('app.name')} · Meus alunos</h1>
        <nav className="dashboard-nav">
          <PersonalSubnav />
        </nav>
        <div className="dashboard-user">
          <span>{user?.name}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            {t('nav.logout')}
          </button>
        </div>
      </header>
      <main className="container" style={{ padding: 24 }}>
        <p style={{ marginBottom: 20, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Alunos vinculados à sua conta. Use &quot;Ver detalhes&quot; para mídias e avaliações.
        </p>

        {loading ? (
          <PageLoadingState bare message="Carregando alunos…" />
        ) : error ? (
          <PageErrorState
            inline
            title="Não foi possível carregar a lista"
            message={error}
            onRetry={() => void reload()}
          />
        ) : students.length === 0 ? (
          <div className="card" style={{ padding: 24 }}>
            <EmptyState
              title="Nenhum aluno vinculado"
              description="Quando um aluno for associado ao seu perfil, ele aparecerá aqui. Execute o seed de desenvolvimento ou peça suporte para configurar vínculos."
            />
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            }}
          >
            {students.map((s) => (
              <article key={s.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--text)' }}>
                    {s.name}
                  </h2>
                  <p style={{ margin: '6px 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{s.email}</p>
                </div>
                <dl style={{ margin: 0, display: 'grid', gap: 6, fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <dt style={{ color: 'var(--text-muted)' }}>Plano</dt>
                    <dd style={{ margin: 0, color: 'var(--text)' }}>{s.plan}</dd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <dt style={{ color: 'var(--text-muted)' }}>Tipo billing</dt>
                    <dd style={{ margin: 0, color: 'var(--text)' }}>{s.planType ?? '—'}</dd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <dt style={{ color: 'var(--text-muted)' }}>Desde</dt>
                    <dd style={{ margin: 0, color: 'var(--text)' }}>{formatPtDate(s.createdAt)}</dd>
                  </div>
                </dl>
                <Link
                  href={`/dashboard/personal/alunos/${encodeURIComponent(s.id)}`}
                  className="btn btn-primary"
                  style={{ marginTop: 'auto', textAlign: 'center', textDecoration: 'none' }}
                >
                  Ver detalhes
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
    </PersonalPageShell>
  );
}
