import { useSubscription } from '@/hooks/useSubscription';
import { PlanBadge } from './PlanBadge';
import { SubscriptionStatusCard } from './SubscriptionStatusCard';
import { UpgradeCard } from './UpgradeCard';
import type { CheckoutPlan } from '@/types/billing';

type Props = {
  role: 'PERSONAL_PROFESSOR' | 'ALUNO';
  returnBasePath: string;
};

export function DashboardPlanSection({ role, returnBasePath }: Props) {
  const { profile, billing, loading, error, refresh } = useSubscription();
  const plan = profile?.plan ?? billing?.plan ?? 'FREE';
  const planType = profile?.planType ?? billing?.planType ?? null;
  const isPremium = plan === 'PREMIUM';

  const offeredPlan: CheckoutPlan =
    role === 'PERSONAL_PROFESSOR' ? 'PERSONAL' : 'ALUNO';

  const manageReturnPath =
    role === 'PERSONAL_PROFESSOR'
      ? '/dashboard/personal/conta'
      : '/dashboard/aluno/conta';

  return (
    <div className="dashboard-plan-section card" style={{ marginBottom: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Sua assinatura</h2>
        {loading ? (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Atualizando…
          </span>
        ) : (
          <PlanBadge plan={plan} planType={planType} />
        )}
      </div>

      {error ? (
        <p className="auth-error" style={{ marginBottom: 12 }}>
          {error}{' '}
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
            onClick={() => void refresh()}
          >
            Atualizar
          </button>
        </p>
      ) : null}

      {!loading && !isPremium ? (
        <UpgradeCard
          offeredPlan={offeredPlan}
          returnBasePath={returnBasePath}
          title="Subir para Premium"
          description={
            role === 'PERSONAL_PROFESSOR'
              ? 'IA para montar treinos, recursos avançados para o seu negócio.'
              : 'Acompanhamento nutricional com IA e mais benefícios para o aluno.'
          }
        />
      ) : null}

      {!loading && isPremium ? (
        <div style={{ marginTop: 8 }}>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.9375rem',
              marginBottom: 16,
            }}
          >
            Obrigado por assinar! Recursos premium estão liberados para sua conta.
          </p>
          <SubscriptionStatusCard
            profile={profile}
            billing={billing}
            manageReturnPath={manageReturnPath}
            showBadgeRow={false}
          />
        </div>
      ) : null}
    </div>
  );
}
