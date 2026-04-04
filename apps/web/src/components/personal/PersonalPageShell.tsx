import type { ReactNode } from 'react';
import { PersonalDashboardGuard } from '@/components/auth/PersonalDashboardGuard';

/** Protege conteúdo do dashboard do personal (JWT + role); usar em cada página sob /dashboard/personal. */
export function PersonalPageShell({ children }: { children: ReactNode }) {
  return <PersonalDashboardGuard>{children}</PersonalDashboardGuard>;
}
