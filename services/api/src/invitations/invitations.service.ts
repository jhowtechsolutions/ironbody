import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/types/auth-user';
import { CreateInvitationDto } from './dto/create-invitation.dto';

function generateInviteToken(): string {
  return randomBytes(24).toString('base64url');
}

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private frontBase(): string {
    return (
      this.config.get<string>('APP_URL_WEB') ||
      this.config.get<string>('WEB_URL') ||
      'http://localhost:3000'
    ).replace(/\/$/, '');
  }

  async create(personalId: string, dto?: CreateInvitationDto) {
    const token = generateInviteToken();
    let expiresAt: Date | null = null;
    if (dto?.expiresInDays != null) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + dto.expiresInDays);
    }

    await this.prisma.invitation.create({
      data: {
        token,
        personalId,
        expiresAt,
      },
    });

    const url = `${this.frontBase()}/convite/${token}`;
    return { token, url };
  }

  async validateByToken(token: string) {
    const row = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        personal: { select: { id: true, name: true } },
      },
    });

    if (!row) {
      return { valid: false as const };
    }
    if (row.used) {
      return { valid: false as const };
    }
    if (row.expiresAt && row.expiresAt < new Date()) {
      return { valid: false as const };
    }

    return {
      valid: true as const,
      personal: { id: row.personal.id, name: row.personal.name },
    };
  }

  async accept(token: string, user: AuthUser) {
    if (user.role !== Role.ALUNO) {
      throw new ForbiddenException('Apenas alunos podem aceitar convites.');
    }

    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });
    if (!invitation) {
      throw new NotFoundException('Convite não encontrado.');
    }
    if (invitation.used) {
      throw new BadRequestException('Este convite já foi utilizado.');
    }
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new BadRequestException('Este convite expirou.');
    }
    if (invitation.personalId === user.id) {
      throw new BadRequestException('Convite inválido para este usuário.');
    }

    await this.prisma.$transaction([
      this.prisma.studentPersonalLink.upsert({
        where: {
          personalId_studentId: {
            personalId: invitation.personalId,
            studentId: user.id,
          },
        },
        create: {
          personalId: invitation.personalId,
          studentId: user.id,
        },
        update: {},
      }),
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { used: true },
      }),
    ]);

    return { ok: true as const, message: 'Vínculo criado com sucesso.' };
  }
}
