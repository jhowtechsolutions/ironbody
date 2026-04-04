import { ApiProperty } from '@nestjs/swagger';
import { BillingPlanType, Plan, Role } from '@prisma/client';

export class LinkedStudentResponseDto {
  @ApiProperty({ example: 'clxyz123' })
  id: string;

  @ApiProperty({ example: 'Aluno Teste' })
  name: string;

  @ApiProperty({ example: 'aluno@ironbody.app' })
  email: string;

  @ApiProperty({ enum: Role, example: Role.ALUNO })
  role: Role;

  @ApiProperty({ enum: Plan, example: Plan.FREE })
  plan: Plan;

  @ApiProperty({ enum: BillingPlanType, nullable: true, example: null })
  planType: BillingPlanType | null;

  @ApiProperty({ example: '2026-01-01T12:00:00.000Z' })
  createdAt: Date;
}
