import { PlanBadge, planDisplayLabel } from './PlanBadge';
import { InlineErrorMessage } from '@/components/ui/InlineErrorMessage';
import { useSubscription } from '@/hooks/useSubscription';
import type { SubscriptionPayload, UserProfile } from '@/types/billing';

const STATUS_LABELS: Record<string, string> = {
  TRIALING: 'Em período de teste',
  ACTIVE: 'Ativa',
  PAST_DUE: 'Pagamento em atraso',
  CANCELED: 'Cancelada',
  INCOMPLETE: 'Incompleta',
  UNPAID: 'Não paga',
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

type Props = {
  profile: UserProfile | null;
  billing: SubscriptionPayload | null;
  /** Path completo após o domínio para `returnUrl` do Stripe (ex.: `/dashboard/personal/conta`). */
  manageReturnPath?: string;
  /** Se false, omite a linha com badge (útil no dashboard, onde o badge já aparece no cabeçalho). */
  showBadgeRow?: boolean;
};

export function SubscriptionStatusCard({
  profile,
  billing,
  manageReturnPath,
  showBadgeRow = true,
}: Props) {
  const {
    openCustomerPortal,
    portalLoading,
    portalError,
  } = useSubscription();

  const plan = profile?.plan ?? billing?.plan ?? 'FREE';
  const planType = profile?.planType ?? billing?.planType ?? null;
  const sub = billing?.subscription;
  const isPremium = plan === 'PREMIUM';

  const contextual =
    planType === 'PERSONAL'
      ? 'Você está no plano Premium Personal.'
      : planType === 'ALUNO'
        ? 'Você está no plano Premium Aluno.'
        : isPremium
          ? 'Você está no plano Premium.'
          : 'Você está no plano Free.';

  const statusLabel = sub?.status
    ? (STATUS_LABELS[String(sub.status)] ?? String(sub.status))
    : null;

  return (
    <div className="card subscription-status">
      {showBadgeRow ? (
        <>
          <div className="subscription-status__row">
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Plano
            </span>
            <PlanBadge plan={plan} planType={planType} />
          </div>
          <p className="subscription-status__label">
            {planDisplayLabel(plan, planType)}
          </p>
        </>
      ) : (
        <h3
          style={{
            fontSize: '1.0625rem',
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Status da assinatura
        </h3>
      )}
      <p className="subscription-status__context">{contextual}</p>

      {isPremium && sub ? (
        <ul className="subscription-status__meta">
          {statusLabel ? (
            <li>
              <strong>Status</strong>: {statusLabel}
            </li>
          ) : null}
          {sub.currentPeriodStart ? (
            <li>
              <strong>Início do período atual</strong>:{' '}
              {formatDate(sub.currentPeriodStart)}
            </li>
          ) : null}
          {sub.trialEnd ? (
            <li>
              <strong>Fim do trial</strong>: {formatDate(sub.trialEnd)}
            </li>
          ) : null}
          {sub.currentPeriodEnd ? (
            <li>
              <strong>Próxima renovação / fim do período</strong>:{' '}
              {formatDate(sub.currentPeriodEnd)}
            </li>
          ) : null}
          {sub.cancelAtPeriodEnd ? (
            <li className="subscription-status__warn">
              A assinatura não será renovada ao fim do período atual.
            </li>
          ) : null}
          {sub.stripeSubscriptionId ? (
            <li style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
              <strong>Assinatura Stripe</strong>: {sub.stripeSubscriptionId}
            </li>
          ) : null}
          {sub.stripeCustomerId ? (
            <li style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
              <strong>Cliente Stripe</strong>: {sub.stripeCustomerId}
            </li>
          ) : null}
        </ul>
      ) : null}

      {isPremium && !sub ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 12 }}>
          Detalhes da assinatura no Stripe ainda não sincronizados — recarregue após o
          pagamento ou use &quot;Atualizar&quot; na conta.
        </p>
      ) : null}

      {isPremium && manageReturnPath ? (
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={portalLoading}
            onClick={() => void openCustomerPortal({ returnPath: manageReturnPath })}
          >
            {portalLoading ? 'Abrindo portal…' : 'Gerenciar assinatura'}
          </button>
          {portalError ? <InlineErrorMessage message={portalError} /> : null}
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              marginTop: 8,
            }}
          >
            Altere cartão, cancele ou veja faturas no portal seguro da Stripe.
          </p>
        </div>
      ) : null}
    </div>
  );
}
