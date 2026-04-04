import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useSubscription } from '@/hooks/useSubscription';

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'pt-BR', ['common'])) } };
}

export default function AlunoUpgradeSuccess() {
  const { t } = useTranslation('common');
  const { refresh } = useSubscription();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Pagamento recebido</h1>
        <p className="auth-subtitle">
          Obrigado! Estamos sincronizando sua assinatura. Atualize a conta se o plano não mudar de
          imediato.
        </p>
        <Link href="/dashboard/aluno/conta" className="btn btn-primary" style={{ width: '100%' }}>
          Ir para conta
        </Link>
        <p className="auth-link">
          <Link href="/dashboard/aluno">{t('nav.home')}</Link>
        </p>
      </div>
    </div>
  );
}
