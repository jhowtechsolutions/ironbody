import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { WorkoutsService } from '../workouts/workouts.service';

@ApiTags('students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private workouts: WorkoutsService) {}

  @Get('me/workout')
  @UseGuards(RolesGuard)
  @Roles(Role.ALUNO)
  @ApiOperation({
    summary: 'Treino atual do aluno',
    description: 'Retorna o último treino simples atribuído (maior assignedAt), com exercícios.',
  })
  myWorkout(@CurrentUser() user: AuthUser) {
    return this.workouts.getCurrentWorkoutForStudent(user.id);
  }
}
