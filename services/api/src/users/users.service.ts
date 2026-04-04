import { Injectable } from '@nestjs/common';
import { BillingPlanType, Plan, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type LinkedStudentRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  plan: Plan;
  planType: BillingPlanType | null;
  createdAt: Date;
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        planType: true,
        password: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        planType: true,
        createdAt: true,
      },
    });
  }

  /** Alunos com vínculo ativo em StudentPersonalLink; ordenação estável por nome. */
  async listLinkedStudents(personalId: string): Promise<LinkedStudentRow[]> {
    const links = await this.prisma.studentPersonalLink.findMany({
      where: { personalId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            plan: true,
            planType: true,
            createdAt: true,
          },
        },
      },
      orderBy: { student: { name: 'asc' } },
    });
    return links.map((l) => ({
      id: l.student.id,
      name: l.student.name,
      email: l.student.email,
      role: l.student.role,
      plan: l.student.plan,
      planType: l.student.planType,
      createdAt: l.student.createdAt,
    }));
  }
}
