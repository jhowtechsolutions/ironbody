import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationCreatedResponseDto } from './dto/invitation-created-response.dto';
import { InvitationValidateResponseDto } from './dto/invitation-validate-response.dto';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private invitations: InvitationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PERSONAL_PROFESSOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gerar link de convite (personal logado)' })
  @ApiBody({ required: false, type: CreateInvitationDto })
  @ApiResponse({ status: 201, type: InvitationCreatedResponseDto })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() body?: CreateInvitationDto,
  ): Promise<InvitationCreatedResponseDto> {
    return this.invitations.create(user.id, body);
  }

  @Get(':token')
  @ApiOperation({
    summary: 'Validar convite (público)',
    description: 'Não requer autenticação. Retorna valid=false se token inválido, expirado ou já usado.',
  })
  @ApiParam({ name: 'token', description: 'Token do link de convite' })
  @ApiResponse({ status: 200, type: InvitationValidateResponseDto })
  async validate(@Param('token') token: string): Promise<InvitationValidateResponseDto> {
    return this.invitations.validateByToken(token);
  }

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ALUNO)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aceitar convite e vincular ao personal (aluno logado)' })
  @ApiParam({ name: 'token', description: 'Token do link de convite' })
  @ApiResponse({
    status: 201,
    schema: {
      type: 'object',
      properties: { ok: { type: 'boolean' }, message: { type: 'string' } },
    },
  })
  async accept(@Param('token') token: string, @CurrentUser() user: AuthUser) {
    return this.invitations.accept(token, user);
  }
}
