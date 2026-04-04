import type { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import type { BillingPlanType } from '@/types/billing';
import { PageErrorState } from '@/components/ui/PageErrorState';
import { PageLoadingState } from '@/components/ui/PageLoadingState';
import { UpgradeCard } from './UpgradeCard';

type Props = {
  children: ReactNode;
  /** Tipo de premium exigido para ver o conteúdo. */
  requiredPlanType: BillingPlanType;
  /** Base path para checkout (mesmo do UpgradeCard). */
  returnBasePath: string;
  title?: string;
  description?: string;
  /** Alias opcional (spec Fase 2): título quando o usuário não tem acesso. */
  fallbackTitle?: string;
  /** Alias opcional: descrição quando o usuário não tem acesso. */
  fallbackDescription?: string;
};

export function PremiumGate({
  children,
  requiredPlanType,
  returnBasePath,
  title,
  description,
  fallbackTitle,
  fallbackDescription,
}: Props) {
  const { profile, billing, loading, error, refresh } = useSubscription();

  if (loading && !profile) {
    return (
      <div className="premium-gate premium-gate--loading card" role="status" aria-busy="true">
        <PageLoadingState bare message="Carregando permissões…" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="premium-gate card">
        <PageErrorState
          inline
          title="Não foi possível verificar o plano"
          message={error}
          onRetry={() => void refresh()}
        />
      </div>
    );
  }

  const plan = profile?.plan ?? billing?.plan ?? 'FREE';
  const planType = profile?.planType ?? billing?.planType ?? null;

  const isPremium = plan === 'PREMIUM';
  const hasRightType = isPremium && planType === requiredPlanType;

  if (hasRightType) {
    return <>{children}</>;
  }

  const wrongPremium =
    isPremium && planType && planType !== requiredPlanType;

  const premiumName =
    requiredPlanType === 'PERSONAL' ? 'Personal' : 'Aluno';

  const heading = wrongPremium
    ? 'Plano diferente'
    : (fallbackTitle ?? title ?? 'Recurso Premium');
  const lead = wrongPremium
    ? `Este recurso exige Premium ${premiumName}. Faça upgrade do plano correto.`
    : (fallbackDescription ??
      description ??
      `Disponível no Premium ${premiumName}.`);

  return (
    <div className="premium-gate card">
      <div className="premium-gate__lock">🔒</div>
      <h2 className="premium-gate__title">{heading}</h2>
      <p className="premium-gate__text">{lead}</p>
      <UpgradeCard
        offeredPlan={requiredPlanType}
        returnBasePath={returnBasePath}
        title={`Premium ${premiumName}`}
        description="Assine para desbloquear este recurso."
      />
    </div>
  );
}
