import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumGate } from '@/components/billing/PremiumGate';
import { PersonalSubnav } from '@/components/personal/PersonalSubnav';
import { PersonalPageShell } from '@/components/personal/PersonalPageShell';

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'pt-BR', ['common'])) } };
}

export default function IaTreinoPersonal() {
  const { t } = useTranslation('common');
  const { user, logout } = useAuth();

  return (
    <PersonalPageShell>
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="dashboard-header">
        <h1 className="dashboard-title">{t('app.name')} · IA · Treino</h1>
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
        <PremiumGate
          requiredPlanType="PERSONAL"
          returnBasePath="/dashboard/personal"
          title="Geração de treinos com IA"
          description="Monte treinos personalizados com inteligência artificial. Disponível no Premium Personal."
        >
          <IaTreinoUnlocked />
        </PremiumGate>
      </main>
    </div>
    </PersonalPageShell>
  );
}

function IaTreinoUnlocked() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  return (
    <div className="card">
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 12 }}>
        IA para treinos
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.9375rem' }}>
        Seu plano permite usar a API{' '}
        <code style={{ fontSize: '0.8rem' }}>POST {API_URL}/ai/workout/generate</code>
        {' '}com Bearer token (ex.: via app mobile ou integração direta).
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
        No web, em breve: formulário integrado ao backend NestJS.
      </p>
    </div>
  );
}
