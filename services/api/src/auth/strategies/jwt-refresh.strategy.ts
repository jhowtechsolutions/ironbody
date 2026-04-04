import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: (req: Request) =>
        req?.body?.refreshToken ?? ExtractJwt.fromAuthHeaderAsBearerToken()(req),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET') || 'ironbody-secret-change-in-production',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string; type: string }) {
    const refreshToken = req.body?.refreshToken;
    return { userId: payload.sub, refreshToken };
  }
}
