import type { BillingPlanType, Plan } from '@/types/billing';

type Props = {
  plan: Plan;
  planType: BillingPlanType | null;
  compact?: boolean;
};

export function planDisplayLabel(plan: Plan, planType: BillingPlanType | null): string {
  if (plan !== 'PREMIUM') return 'FREE';
  if (planType === 'PERSONAL') return 'PREMIUM PERSONAL';
  if (planType === 'ALUNO') return 'PREMIUM ALUNO';
  return 'PREMIUM';
}

export function PlanBadge({ plan, planType, compact }: Props) {
  const isPremium = plan === 'PREMIUM';
  const label = planDisplayLabel(plan, planType);

  return (
    <span
      className={`plan-badge ${isPremium ? 'plan-badge--premium' : 'plan-badge--free'}`}
      title={label}
    >
      {compact ? (isPremium ? '★' : 'FREE') : label}
    </span>
  );
}
