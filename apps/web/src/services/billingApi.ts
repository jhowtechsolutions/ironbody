import { API_URL } from '@/lib/api-config';
import { readErrorMessageFromResponse } from '@/lib/read-api-error';
import type {
  CheckoutPlan,
  SubscriptionPayload,
  UserProfile,
} from '@/types/billing';

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  } as const;
}

export async function fetchMe(accessToken: string): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessageFromResponse(res, 'Erro ao carregar perfil'));
  }
  return res.json();
}

export async function fetchSubscription(
  accessToken: string,
): Promise<SubscriptionPayload> {
  const res = await fetch(`${API_URL}/billing/subscription/me`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessageFromResponse(res, 'Erro ao carregar assinatura'));
  }
  return res.json();
}

export type CreateCheckoutBody = {
  plan: CheckoutPlan;
  successUrl: string;
  cancelUrl: string;
};

export async function createCheckoutSession(
  accessToken: string,
  body: CreateCheckoutBody,
): Promise<{ id: string; url: string | null }> {
  const res = await fetch(`${API_URL}/billing/checkout-session`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessageFromResponse(res, 'Erro ao iniciar checkout'));
  }
  return res.json();
}

export type CustomerPortalResponse = {
  ok: boolean;
  url: string;
  message?: string;
  stripeMode?: string;
};

export async function createCustomerPortalSession(
  accessToken: string,
  returnUrl?: string,
): Promise<CustomerPortalResponse> {
  const res = await fetch(`${API_URL}/billing/customer-portal`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(returnUrl ? { returnUrl } : {}),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessageFromResponse(res, 'Erro ao abrir portal de cobrança'));
  }
  return res.json();
}
