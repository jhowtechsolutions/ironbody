import { SetMetadata } from '@nestjs/common';
import { BillingPlanType } from '@prisma/client';

export const REQUIRE_PLAN_TYPE_KEY = 'ironbody_require_plan_type';

/**
 * Exige `plan === PREMIUM` e `planType` igual ao informado.
 * Use após `JwtAuthGuard`.
 */
export const RequirePlanType = (planType: BillingPlanType) =>
  SetMetadata(REQUIRE_PLAN_TYPE_KEY, planType);
