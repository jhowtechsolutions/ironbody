import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useSubscription } from '@/hooks/useSubscription';
import { PersonalPageShell } from '@/components/personal/PersonalPageShell';

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'pt-BR', ['common'])) } };
}

export default function PersonalUpgradeSuccess() {
  const { t } = useTranslation('common');
  const { refresh } = useSubscription();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <PersonalPageShell>
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Pagamento recebido</h1>
        <p className="auth-subtitle">
          Obrigado! Estamos sincronizando sua assinatura. Se o plano não atualizar na hora, aguarde
          alguns segundos e atualize a página.
        </p>
        <Link href="/dashboard/personal/conta" className="btn btn-primary" style={{ width: '100%' }}>
          Ir para conta
        </Link>
        <p className="auth-link">
          <Link href="/dashboard/personal">{t('nav.home')}</Link>
        </p>
      </div>
    </div>
    </PersonalPageShell>
  );
}
