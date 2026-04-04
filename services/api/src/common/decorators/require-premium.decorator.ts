import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PREMIUM_KEY = 'ironbody_require_premium';

/**
 * Exige `plan === PREMIUM` (qualquer `planType`).
 * Use após `JwtAuthGuard`.
 */
export const RequirePremium = () => SetMetadata(REQUIRE_PREMIUM_KEY, true);
