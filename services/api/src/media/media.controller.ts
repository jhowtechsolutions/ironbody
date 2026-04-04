import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { MediaService } from './media.service';
import { UploadUrlDto } from './dto/upload-url.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { ListMediaQueryDto } from './dto/list-media-query.dto';
import { ListStudentMediaQueryDto } from './dto/list-student-media-query.dto';

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('upload-url')
  uploadUrl(@CurrentUser() user: AuthUser, @Body() dto: UploadUrlDto) {
    return this.media.createUploadUrl(user, dto);
  }

  @Post('confirm')
  confirm(@CurrentUser() user: AuthUser, @Body() dto: ConfirmUploadDto) {
    return this.media.confirmUpload(user, dto);
  }

  @Get('student/:studentId')
  @UseGuards(RolesGuard)
  @Roles(Role.PERSONAL_PROFESSOR)
  @ApiOperation({
    summary: 'Listar mídias de um aluno vinculado',
    description:
      'Apenas PERSONAL_PROFESSOR. Exige StudentPersonalLink com o aluno. Filtros opcionais: kind, entityType, entityId. Cada item inclui `url` (pública S3) e `objectKey`.',
  })
  @ApiParam({ name: 'studentId', description: 'ID do usuário (aluno)' })
  @ApiOkResponse({
    description: 'Lista de registros MediaFile',
    schema: {
      example: [
        {
          id: 'clmedia1',
          ownerUserId: 'clstudent1',
          entityType: 'USER_PROGRESS',
          entityId: null,
          kind: 'PHOTO_PROGRESS',
          bucket: 'ironbody-media-dev',
          objectKey: 'users/clstudent1/progress/uuid.jpg',
          url: 'https://bucket.s3.sa-east-1.amazonaws.com/users/.../uuid.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 120000,
          createdAt: '2026-03-29T12:00:00.000Z',
          updatedAt: '2026-03-29T12:00:00.000Z',
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
    @Query() query: ListStudentMediaQueryDto,
  ) {
    return this.media.listForLinkedStudent(user, studentId, query);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListMediaQueryDto) {
    return this.media.list(user, query);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.media.remove(user, id);
  }
}
