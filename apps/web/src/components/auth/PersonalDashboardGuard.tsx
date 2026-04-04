import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoadingState } from '@/components/ui/PageLoadingState';

/**
 * Protege rotas `/dashboard/personal/*`: exige JWT e role PERSONAL_PROFESSOR.
 * Redireciona para `/login?next=...` quando não autenticado.
 */
export function PersonalDashboardGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, accessToken, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!accessToken) {
      const next = encodeURIComponent(router.asPath || '/dashboard/personal');
      void router.replace(`/login?next=${next}`);
      return;
    }
    if (user?.role !== 'PERSONAL_PROFESSOR') {
      void router.replace('/login');
    }
  }, [loading, accessToken, user, router]);

  if (loading) {
    return <PageLoadingState message="Carregando sessão…" />;
  }
  if (!accessToken || user?.role !== 'PERSONAL_PROFESSOR') {
    return <PageLoadingState message="Redirecionando…" />;
  }

  return <>{children}</>;
}
