import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumGate } from '@/components/billing/PremiumGate';

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'pt-BR', ['common'])) } };
}

export default function NutricaoAluno() {
  const { t } = useTranslation('common');
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="auth-page">
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Carregando...</div>
      </div>
    );
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
        <h1 className="dashboard-title">{t('app.name')} · Nutrição</h1>
        <nav className="dashboard-nav">
          <Link href="/dashboard/aluno">Dashboard</Link>
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
        <PremiumGate
          requiredPlanType="ALUNO"
          returnBasePath="/dashboard/aluno"
          title="Análise de refeições (Premium Aluno)"
          description="Envie fotos das refeições para sugestões nutricionais — em construção no backend."
        >
          <div className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 12 }}>
              Nutrição com IA
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              Área liberada para Premium Aluno. O endpoint{' '}
              <code style={{ fontSize: '0.8rem' }}>POST /v1/ai/nutrition/meal-photo</code>
              {' '}está disponível na API para integração.
            </p>
          </div>
        </PremiumGate>
      </main>
    </div>
  );
}
