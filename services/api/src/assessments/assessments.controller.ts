import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';

@ApiTags('assessments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar avaliação (aluno ou personal vinculado)' })
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou inválido' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAssessmentDto) {
    return this.assessments.create(user, dto);
  }

  @Get('my')
  @ApiOperation({
    summary: 'Listar avaliações visíveis ao usuário',
    description:
      'Aluno: só as suas. Personal: todas dos alunos vinculados, ou filtrar com ?studentId= (exige vínculo).',
  })
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou inválido' })
  listMy(@CurrentUser() user: AuthUser, @Query('studentId') studentId?: string) {
    return this.assessments.listVisibleToUser(user, studentId);
  }

  @Get('student/:studentId')
  @UseGuards(RolesGuard)
  @Roles(Role.PERSONAL_PROFESSOR)
  @ApiOperation({
    summary: 'Avaliações de um aluno vinculado + mídias de avaliação',
    description:
      'Apenas PERSONAL_PROFESSOR. Exige StudentPersonalLink. Cada item inclui bodyMeasures, adipometry e mediaFiles (PHOTO_ASSESSMENT ligadas por entityId).',
  })
  @ApiParam({ name: 'studentId', description: 'ID do usuário aluno' })
  @ApiOkResponse({
    schema: {
      example: [
        {
          id: 'clasm1',
          studentId: 'clstudent1',
          data: '2026-03-29T10:00:00.000Z',
          peso: 75.5,
          imc: 23.2,
          observacoes: 'Evolutivo positivo',
          createdAt: '2026-03-29T10:00:00.000Z',
          bodyMeasures: [],
          adipometry: [],
          mediaFiles: [
            {
              id: 'clmedia1',
              kind: 'PHOTO_ASSESSMENT',
              entityType: 'ASSESSMENT',
              entityId: 'clasm1',
              url: 'https://bucket.s3.sa-east-1.amazonaws.com/users/.../foto.jpg',
              objectKey: 'users/clstudent1/assessments/uuid.jpg',
              bucket: 'ironbody-media-dev',
              mimeType: 'image/jpeg',
              sizeBytes: 90000,
            },
          ],
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou inválido (401)' })
  @ApiForbiddenResponse({
    description: 'Não é personal ou sem vínculo com o aluno (403)',
  })
  listForStudent(
    @CurrentUser() user: AuthUser,
    @Param('studentId') studentId: string,
  ) {
    return this.assessments.listForLinkedStudent(user.id, studentId);
  }
}
