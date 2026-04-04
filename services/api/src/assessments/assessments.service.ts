import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { MediaEntityType, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/types/auth-user';
import { CreateAssessmentDto } from './dto/create-assessment.dto';

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertPersonalLinked(personalId: string, studentId: string) {
    const row = await this.prisma.studentPersonalLink.findUnique({
      where: { personalId_studentId: { personalId, studentId } },
    });
    if (!row) throw new ForbiddenException('Sem vínculo com este aluno');
  }

  async create(user: AuthUser, dto: CreateAssessmentDto) {
    let studentId: string;
    if (user.role === Role.ALUNO) {
      studentId = user.id;
    } else if (user.role === Role.PERSONAL_PROFESSOR) {
      if (!dto.studentId) throw new BadRequestException('studentId obrigatório para personal');
      await this.assertPersonalLinked(user.id, dto.studentId);
      studentId = dto.studentId;
    } else if (user.role === Role.ADMIN) {
      if (!dto.studentId) throw new BadRequestException('studentId obrigatório para admin');
      studentId = dto.studentId;
    } else {
      throw new ForbiddenException();
    }

    return this.prisma.assessment.create({
      data: {
        studentId,
        peso: dto.peso ?? null,
        imc: dto.imc ?? null,
        observacoes: dto.observacoes ?? null,
      },
    });
  }

  async listVisibleToUser(user: AuthUser, studentIdFilter?: string) {
    if (user.role === Role.ALUNO) {
      return this.prisma.assessment.findMany({
        where: { studentId: user.id },
        orderBy: { data: 'desc' },
        take: 50,
      });
    }
    if (user.role === Role.PERSONAL_PROFESSOR) {
      if (studentIdFilter) {
        await this.assertPersonalLinked(user.id, studentIdFilter);
        return this.prisma.assessment.findMany({
          where: { studentId: studentIdFilter },
          orderBy: { data: 'desc' },
          take: 50,
        });
      }
      const links = await this.prisma.studentPersonalLink.findMany({
        where: { personalId: user.id },
        select: { studentId: true },
      });
      const ids = links.map((l) => l.studentId);
      return this.prisma.assessment.findMany({
        where: { studentId: { in: ids } },
        orderBy: { data: 'desc' },
        take: 100,
      });
    }
    if (user.role === Role.ADMIN) {
      const where = studentIdFilter ? { studentId: studentIdFilter } : {};
      return this.prisma.assessment.findMany({
        where,
        orderBy: { data: 'desc' },
        take: 100,
      });
    }
    return [];
  }

  /**
   * Avaliações de um aluno + mídias com entityType ASSESSMENT e entityId = assessment.id.
   * Apenas personal com vínculo; validação de papel no controller (RolesGuard).
   */
  async listForLinkedStudent(personalId: string, studentId: string) {
    await this.assertPersonalLinked(personalId, studentId);
    const assessments = await this.prisma.assessment.findMany({
      where: { studentId },
      orderBy: { data: 'desc' },
      take: 50,
      include: {
        bodyMeasures: true,
        adipometry: true,
      },
    });
    const ids = assessments.map((a) => a.id);
    const mediaFiles =
      ids.length === 0
        ? []
        : await this.prisma.mediaFile.findMany({
            where: {
              ownerUserId: studentId,
              entityType: MediaEntityType.ASSESSMENT,
              entityId: { in: ids },
            },
            orderBy: { createdAt: 'desc' },
          });
    const byAssessment = new Map<string, typeof mediaFiles>();
    for (const m of mediaFiles) {
      if (!m.entityId) continue;
      const list = byAssessment.get(m.entityId) ?? [];
      list.push(m);
      byAssessment.set(m.entityId, list);
    }
    return assessments.map((a) => ({
      ...a,
      mediaFiles: byAssessment.get(a.id) ?? [],
    }));
  }
}
