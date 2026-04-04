import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Plan } from '@prisma/client';
import { AuthUser } from '../../auth/types/auth-user';
import { REQUIRE_PREMIUM_KEY } from '../decorators/require-premium.decorator';

@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requirePremium = this.reflector.getAllAndOverride<boolean | undefined>(
      REQUIRE_PREMIUM_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requirePremium) return true;

    const req = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = req.user;
    if (!user?.id) {
      throw new ForbiddenException('Usuário não autenticado');
    }
    if (user.plan !== Plan.PREMIUM) {
      throw new ForbiddenException('Plano premium necessário');
    }
    return true;
  }
}
