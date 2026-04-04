import { useSubscription } from '@/hooks/useSubscription';
import type { CheckoutPlan } from '@/types/billing';
import { InlineErrorMessage } from '@/components/ui/InlineErrorMessage';

const BENEFITS: Record<CheckoutPlan, string[]> = {
  PERSONAL: [
    'IA para montagem e variação de treinos',
    'Recursos avançados para o seu negócio como personal',
    'Suporte às rotas premium da API (ex.: geração de treino)',
  ],
  ALUNO: [
    'Nutrição e análise com IA (quando disponível na API)',
    'Benefícios exclusivos para alunos premium',
    'Experiência alinhada ao plano Premium Aluno',
  ],
};

type Props = {
  /** Plano oferecido neste contexto (Personal ou Aluno). */
  offeredPlan: CheckoutPlan;
  /** Prefixo de rota para URLs de retorno do Stripe, ex.: `/dashboard/personal` */
  returnBasePath: string;
  title?: string;
  description?: string;
};

export function UpgradeCard({
  offeredPlan,
  returnBasePath,
  title = 'Assine o Premium',
  description = 'Desbloqueie recursos avançados, IA e acompanhamento completo.',
}: Props) {
  const { startCheckout, checkoutLoading, checkoutError } = useSubscription();

  const planName = offeredPlan === 'PERSONAL' ? 'Personal' : 'Aluno';
  const bullets = BENEFITS[offeredPlan];

  return (
    <div className="upgrade-card card">
      <h3 className="upgrade-card__title">{title}</h3>
      <p className="upgrade-card__desc">{description}</p>
      <ul
        className="upgrade-card__benefits"
        style={{
          margin: '12px 0 16px',
          paddingLeft: '1.25rem',
          color: 'var(--text-muted)',
          fontSize: '0.9375rem',
          lineHeight: 1.5,
        }}
      >
        {bullets.map((b) => (
          <li key={b} style={{ marginBottom: 6 }}>
            {b}
          </li>
        ))}
      </ul>
      <p className="upgrade-card__plan">
        Plano: <strong>Premium {planName}</strong>
      </p>
      {checkoutError ? <InlineErrorMessage message={checkoutError} /> : null}
      <button
        type="button"
        className="btn btn-primary upgrade-card__cta"
        disabled={checkoutLoading}
        onClick={() => startCheckout({ plan: offeredPlan, returnBasePath })}
      >
        {checkoutLoading ? 'Redirecionando…' : 'Assinar Premium'}
      </button>
    </div>
  );
}
