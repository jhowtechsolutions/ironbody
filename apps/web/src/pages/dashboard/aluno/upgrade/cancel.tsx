import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'pt-BR', ['common'])) } };
}

export default function AlunoUpgradeCancel() {
  const { t } = useTranslation('common');

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Checkout cancelado</h1>
        <p className="auth-subtitle">
          Nenhuma cobrança foi feita. Você pode assinar quando quiser a partir do dashboard.
        </p>
        <Link href="/dashboard/aluno" className="btn btn-primary" style={{ width: '100%' }}>
          Voltar ao dashboard
        </Link>
        <p className="auth-link">
          <Link href="/dashboard/aluno/conta">{t('nav.profile')}</Link>
        </p>
      </div>
    </div>
  );
}
