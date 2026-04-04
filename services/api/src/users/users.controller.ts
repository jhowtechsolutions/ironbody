import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { LinkedStudentResponseDto } from './dto/linked-student-response.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Perfil do usuário autenticado' })
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou inválido' })
  async me(@CurrentUser() user: { id: string }) {
    return this.users.findById(user.id);
  }

  @Get('my-students')
  @UseGuards(RolesGuard)
  @Roles(Role.PERSONAL_PROFESSOR)
  @ApiOperation({
    summary: 'Listar alunos vinculados ao personal',
    description:
      'Retorna usuários com papel ALUNO ligados via StudentPersonalLink. Apenas PERSONAL_PROFESSOR. Lista vazia se não houver vínculos.',
  })
  @ApiOkResponse({ type: LinkedStudentResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou inválido (401)' })
  @ApiForbiddenResponse({
    description: 'Papel diferente de PERSONAL_PROFESSOR (403)',
  })
  async myStudents(@CurrentUser() _user: AuthUser) {
    return this.users.listLinkedStudents(_user.id);
  }
}
