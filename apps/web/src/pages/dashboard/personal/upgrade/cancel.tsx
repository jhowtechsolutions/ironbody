import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { PersonalPageShell } from '@/components/personal/PersonalPageShell';

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'pt-BR', ['common'])) } };
}

export default function PersonalUpgradeCancel() {
  const { t } = useTranslation('common');

  return (
    <PersonalPageShell>
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Checkout cancelado</h1>
        <p className="auth-subtitle">
          Nenhuma cobrança foi feita. Você pode assinar quando quiser a partir do dashboard.
        </p>
        <Link href="/dashboard/personal" className="btn btn-primary" style={{ width: '100%' }}>
          Voltar ao dashboard
        </Link>
        <p className="auth-link">
          <Link href="/dashboard/personal/conta">{t('nav.profile')}</Link>
        </p>
      </div>
    </div>
    </PersonalPageShell>
  );
}
