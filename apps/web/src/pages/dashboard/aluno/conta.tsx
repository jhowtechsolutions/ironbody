import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionStatusCard } from '@/components/billing/SubscriptionStatusCard';
import { UpgradeCard } from '@/components/billing/UpgradeCard';
import { useSubscription } from '@/hooks/useSubscription';
import { PageErrorState } from '@/components/ui/PageErrorState';
import { PageLoadingState } from '@/components/ui/PageLoadingState';

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'pt-BR', ['common'])) } };
}

export default function ContaAluno() {
  const { t } = useTranslation('common');
  const { user, loading, logout } = useAuth();
  const { profile, billing, loading: subLoading, error: subError, refresh } = useSubscription();

  if (loading) {
    return <PageLoadingState />;
  }
  if (!user || user.role !== 'ALUNO') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p style={{ marginBottom: 16 }}>Acesso negado.</p>
          <Link href="/login" className="btn btn-primary">Ir para login</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="dashboard-header">
        <h1 className="dashboard-title">{t('app.name')} · Conta</h1>
        <nav className="dashboard-nav">
          <Link href="/dashboard/aluno">Dashboard</Link>
          <Link href="/dashboard/aluno/nutricao">Nutrição (Premium)</Link>
        </nav>
        <div className="dashboard-user">
          <span>{user.name}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            {t('nav.logout')}
          </button>
        </div>
      </header>
      <main className="container" style={{ padding: 24 }}>
        <p style={{ marginBottom: 24, color: 'var(--text-muted)' }}>
          Dados da conta e assinatura.
        </p>
        {subError ? (
          <div className="card" style={{ marginBottom: 24, padding: 16 }}>
            <PageErrorState
              inline
              title="Assinatura / perfil"
              message={subError}
              onRetry={() => void refresh()}
            />
          </div>
        ) : null}
        {subLoading && !subError && !profile ? (
          <p style={{ marginBottom: 24, color: 'var(--text-muted)' }} role="status">
            Carregando dados da assinatura…
          </p>
        ) : null}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 12 }}>Perfil</h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text)' }}>Nome:</strong> {user.name}
          </p>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', marginTop: 8 }}>
            <strong style={{ color: 'var(--text)' }}>E-mail:</strong> {user.email}
          </p>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ marginTop: 16 }}
            disabled={subLoading}
            onClick={() => void refresh()}
          >
            Atualizar dados do servidor
          </button>
        </div>
        <SubscriptionStatusCard
          profile={profile}
          billing={billing}
          manageReturnPath="/dashboard/aluno/conta"
        />
        {profile?.plan !== 'PREMIUM' && (
          <div style={{ marginTop: 24 }}>
            <UpgradeCard
              offeredPlan="ALUNO"
              returnBasePath="/dashboard/aluno"
              title="Assinar Premium Aluno"
              description="Nutrição com IA e benefícios exclusivos para alunos."
            />
          </div>
        )}
      </main>
    </div>
  );
}
