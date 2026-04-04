import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException('Este e-mail já está cadastrado. Faça login ou use outro e-mail.');
    }
    const role = (dto.role ?? 'PERSONAL_PROFESSOR') as Role;
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        name: dto.name,
        role,
        plan: 'FREE',
      },
      select: { id: true, email: true, name: true, role: true, plan: true, planType: true },
    });
    if (user.role === 'PERSONAL_PROFESSOR') {
      await this.prisma.profilePersonal.create({ data: { userId: user.id } });
    }
    if (user.role === 'ALUNO') {
      await this.prisma.profileStudent.create({ data: { userId: user.id } });
    }
    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }
    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        planType: user.planType,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await this.prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => {});
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.issueTokens(stored.user.id, stored.user.email, stored.user.role);
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    return { message: 'Logout realizado' };
  }

  private async issueTokens(userId: string, email: string, role: Role) {
    const accessSecret = this.config.get('JWT_SECRET');
    const refreshExpires = this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d';
    const accessExpires = this.config.get('JWT_EXPIRES_IN') || '15m';

    const accessToken = this.jwt.sign(
      { sub: userId, email, role },
      { secret: accessSecret, expiresIn: accessExpires },
    );
    const refreshToken = this.jwt.sign(
      { sub: userId, type: 'refresh' },
      { secret: accessSecret, expiresIn: refreshExpires },
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });
    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpires,
    };
  }
}
