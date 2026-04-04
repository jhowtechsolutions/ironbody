import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BillingPlanType, Plan } from '@prisma/client';
import { AuthUser } from '../../auth/types/auth-user';
import { REQUIRE_PLAN_TYPE_KEY } from '../decorators/require-plan-type.decorator';

const PLAN_TYPE_MESSAGES: Record<BillingPlanType, string> = {
  PERSONAL: 'Plano PERSONAL premium necessário',
  ALUNO: 'Plano ALUNO premium necessário',
};

@Injectable()
export class PlanTypeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPlanType = this.reflector.getAllAndOverride<
      BillingPlanType | undefined
    >(REQUIRE_PLAN_TYPE_KEY, [context.getHandler(), context.getClass()]);
    if (requiredPlanType === undefined) return true;

    const req = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = req.user;
    if (!user?.id) {
      throw new ForbiddenException('Usuário não autenticado');
    }
    if (user.plan !== Plan.PREMIUM) {
      throw new ForbiddenException('Plano premium necessário');
    }
    if (user.planType !== requiredPlanType) {
      throw new ForbiddenException(PLAN_TYPE_MESSAGES[requiredPlanType]);
    }
    return true;
  }
}
