import { BillingPlanType, Plan, Role } from '@prisma/client';

/** Usuário anexado em `req.user` após `JwtAuthGuard` (JwtStrategy.validate). */
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  plan: Plan;
  planType: BillingPlanType | null;
};
