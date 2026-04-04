import { Body, Controller, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { WorkoutsService } from './workouts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CreateSimpleWorkoutDto } from './dto/create-simple-workout.dto';
import { AssignWorkoutDto } from './dto/assign-workout.dto';

@ApiTags('workouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workouts')
export class WorkoutsController {
  constructor(private workouts: WorkoutsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.PERSONAL_PROFESSOR)
  @ApiOperation({
    summary: 'Criar treino simples com exercícios',
    description: 'Cria um modelo de treino (sem aluno). Atribua depois com POST /workouts/:id/assign.',
  })
  create(@Body() dto: CreateSimpleWorkoutDto, @CurrentUser() user: AuthUser) {
    return this.workouts.createSimple(user.id, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.PERSONAL_PROFESSOR)
  @ApiOperation({ summary: 'Listar treinos simples do personal' })
  list(@CurrentUser() user: AuthUser) {
    return this.workouts.listSimpleForPersonal(user.id);
  }

  @Post(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(Role.PERSONAL_PROFESSOR)
  @ApiOperation({ summary: 'Atribuir treino a aluno vinculado' })
  assign(
    @Param('id') id: string,
    @Body() dto: AssignWorkoutDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workouts.assignToStudent(id, user.id, dto.studentId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.PERSONAL_PROFESSOR)
  @ApiOperation({ summary: 'Detalhe do treino (personal dono)' })
  async getById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const w = await this.workouts.getSimpleByIdForPersonal(id, user.id);
    if (!w) throw new NotFoundException('Treino não encontrado.');
    return w;
  }
}
