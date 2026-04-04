import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateSimpleWorkoutDto } from './dto/create-simple-workout.dto';

@Injectable()
export class WorkoutsService {
  constructor(private prisma: PrismaService) {}

  async createSimple(personalId: string, dto: CreateSimpleWorkoutDto) {
    return this.prisma.simpleWorkout.create({
      data: {
        name: dto.name,
        personalId,
        exercises: {
          create: dto.exercises.map((e, i) => ({
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            rest: e.rest?.trim() ? e.rest.trim() : '60s',
            order: i,
          })),
        },
      },
      include: {
        exercises: { orderBy: { order: 'asc' } },
      },
    });
  }

  async listSimpleForPersonal(personalId: string) {
    return this.prisma.simpleWorkout.findMany({
      where: { personalId },
      orderBy: { createdAt: 'desc' },
      include: {
        exercises: { orderBy: { order: 'asc' } },
        _count: { select: { assignments: true } },
      },
    });
  }

  async getSimpleByIdForPersonal(id: string, personalId: string) {
    const w = await this.prisma.simpleWorkout.findUnique({
      where: { id },
      include: {
        exercises: { orderBy: { order: 'asc' } },
        _count: { select: { assignments: true } },
      },
    });
    if (!w) return null;
    if (w.personalId !== personalId) throw new ForbiddenException('Treino não encontrado.');
    return w;
  }

  async assignToStudent(workoutId: string, personalId: string, studentId: string) {
    const workout = await this.prisma.simpleWorkout.findUnique({
      where: { id: workoutId },
    });
    if (!workout || workout.personalId !== personalId) {
      throw new NotFoundException('Treino não encontrado.');
    }
    const link = await this.prisma.studentPersonalLink.findUnique({
      where: {
        personalId_studentId: { personalId, studentId },
      },
    });
    if (!link) {
      throw new ForbiddenException('Este aluno não está vinculado a você.');
    }
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true },
    });
    if (!student || student.role !== Role.ALUNO) {
      throw new ForbiddenException('ID inválido: usuário não é aluno.');
    }
    return this.prisma.studentWorkout.upsert({
      where: {
        studentId_workoutId: { studentId, workoutId },
      },
      create: {
        studentId,
        workoutId,
      },
      update: {
        assignedAt: new Date(),
      },
    });
  }

  async getCurrentWorkoutForStudent(studentId: string) {
    const assignment = await this.prisma.studentWorkout.findFirst({
      where: { studentId },
      orderBy: { assignedAt: 'desc' },
      include: {
        workout: {
          include: {
            exercises: { orderBy: { order: 'asc' } },
          },
        },
      },
    });
    if (!assignment) {
      return { workout: null as null, assignedAt: null as null };
    }
    return {
      workout: {
        id: assignment.workout.id,
        name: assignment.workout.name,
        exercises: assignment.workout.exercises.map((e) => ({
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          rest: e.rest,
          order: e.order,
        })),
      },
      assignedAt: assignment.assignedAt.toISOString(),
    };
  }
}
