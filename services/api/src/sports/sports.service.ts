import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SportsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.sport.findMany({
      where: { ativo: true },
      include: {
        categories: true,
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findCategories(sportId: string) {
    return this.prisma.sportCategory.findMany({
      where: { sportId },
      orderBy: { nome: 'asc' },
    });
  }

  async findExercises(sportId: string) {
    return this.prisma.exercise.findMany({
      where: { sportId, ativo: true },
      orderBy: { nome: 'asc' },
    });
  }
}
