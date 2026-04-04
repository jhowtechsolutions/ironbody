import { ApiPropertyOptional } from '@nestjs/swagger';
import { MediaEntityType, MediaKind } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListMediaQueryDto {
  @ApiPropertyOptional({ enum: MediaKind })
  @IsOptional()
  @IsEnum(MediaKind)
  kind?: MediaKind;

  @ApiPropertyOptional({ enum: MediaEntityType })
  @IsOptional()
  @IsEnum(MediaEntityType)
  entityType?: MediaEntityType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  entityId?: string;

  @ApiPropertyOptional({ description: 'Somente PERSONAL/ADMIN; alunos ignoram e veem só próprios arquivos.' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  ownerUserId?: string;
}
