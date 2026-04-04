export type Plan = 'FREE' | 'PREMIUM';
export type BillingPlanType = 'PERSONAL' | 'ALUNO';
export type SubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'INCOMPLETE'
  | 'UNPAID';

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: Plan;
  planType: BillingPlanType | null;
  createdAt?: string;
};

/** Espelha `GET /v1/billing/subscription/me` (subscription pode ser null). */
export type SubscriptionDetails = {
  status: SubscriptionStatus | string;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export type SubscriptionPayload = {
  plan: Plan;
  planType: BillingPlanType | null;
  subscription: SubscriptionDetails | null;
};

export type CheckoutPlan = 'PERSONAL' | 'ALUNO';
