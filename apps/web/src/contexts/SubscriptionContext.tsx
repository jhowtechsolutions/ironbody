'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as billingApi from '@/services/billingApi';
import type { AuthUser } from '@/contexts/AuthContext';
import type {
  BillingPlanType,
  Plan,
  SubscriptionDetails,
  SubscriptionPayload,
  UserProfile,
} from '@/types/billing';

export type SubscriptionState = {
  profile: UserProfile | null;
  billing: SubscriptionPayload | null;
  /** Derivado de `profile` / `billing` (mesmo contrato do hook agregado). */
  plan: Plan;
  planType: BillingPlanType | null;
  subscription: SubscriptionDetails | null;
  loading: boolean;
  error: string | null;
  checkoutLoading: boolean;
  checkoutError: string | null;
  portalLoading: boolean;
  portalError: string | null;
};

type SubscriptionContextValue = SubscriptionState & {
  refresh: () => Promise<void>;
  startCheckout: (params: {
    plan: 'PERSONAL' | 'ALUNO';
    returnBasePath: string;
  }) => Promise<void>;
  /** Abre o Stripe Customer Portal; `returnPath` = path após o domínio, ex. `/dashboard/personal/conta`. */
  openCustomerPortal: (params: { returnPath: string }) => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function profileToAuthUser(p: UserProfile): AuthUser {
  return {
    id: p.id,
    email: p.email,
    name: p.name,
    role: p.role,
    plan: p.plan,
    planType: p.planType,
  };
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, syncUserFromServer } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [billing, setBilling] = useState<SubscriptionPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const plan = profile?.plan ?? billing?.plan ?? ('FREE' as Plan);
  const planType =
    profile?.planType ?? billing?.planType ?? null;
  const subscription = billing?.subscription ?? null;

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setProfile(null);
      setBilling(null);
      setError(null);
      setCheckoutError(null);
      setPortalError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setCheckoutError(null);
    setPortalError(null);
    try {
      const [me, sub] = await Promise.all([
        billingApi.fetchMe(accessToken),
        billingApi.fetchSubscription(accessToken),
      ]);
      setProfile(me);
      setBilling(sub);
      syncUserFromServer(profileToAuthUser(me));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Não foi possível carregar a assinatura.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken, syncUserFromServer]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const startCheckout = useCallback(
    async ({
      plan,
      returnBasePath,
    }: {
      plan: 'PERSONAL' | 'ALUNO';
      returnBasePath: string;
    }) => {
      if (!accessToken) return;
      const origin =
        typeof window !== 'undefined' ? window.location.origin : '';
      const base = `${origin}${returnBasePath.replace(/\/$/, '')}`;
      setCheckoutLoading(true);
      setCheckoutError(null);
      try {
        const { url } = await billingApi.createCheckoutSession(accessToken, {
          plan,
          successUrl: `${base}/upgrade/success`,
          cancelUrl: `${base}/upgrade/cancel`,
        });
        if (url) {
          window.location.href = url;
        } else {
          throw new Error('Stripe não retornou URL de checkout.');
        }
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : 'Falha ao iniciar checkout.';
        setCheckoutError(msg);
      } finally {
        setCheckoutLoading(false);
      }
    },
    [accessToken],
  );

  const openCustomerPortal = useCallback(
    async ({ returnPath }: { returnPath: string }) => {
      if (!accessToken) return;
      const origin =
        typeof window !== 'undefined' ? window.location.origin : '';
      const path = returnPath.startsWith('/') ? returnPath : `/${returnPath}`;
      const returnUrl = `${origin}${path}`;
      setPortalLoading(true);
      setPortalError(null);
      try {
        const { url } = await billingApi.createCustomerPortalSession(
          accessToken,
          returnUrl,
        );
        if (url) {
          window.location.href = url;
        } else {
          throw new Error('Stripe não retornou URL do portal.');
        }
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : 'Falha ao abrir o portal de cobrança.';
        setPortalError(msg);
      } finally {
        setPortalLoading(false);
      }
    },
    [accessToken],
  );

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      profile,
      billing,
      plan,
      planType,
      subscription,
      loading,
      error,
      checkoutLoading,
      checkoutError,
      portalLoading,
      portalError,
      refresh,
      startCheckout,
      openCustomerPortal,
    }),
    [
      profile,
      billing,
      plan,
      planType,
      subscription,
      loading,
      error,
      checkoutLoading,
      checkoutError,
      portalLoading,
      portalError,
      refresh,
      startCheckout,
      openCustomerPortal,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return ctx;
}
