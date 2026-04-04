import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaEntityType, MediaKind } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadUrlDto {
  @ApiProperty({ enum: MediaKind })
  @IsEnum(MediaKind)
  kind: MediaKind;

  @ApiProperty({ example: 'foto.jpg', description: 'Usado apenas para inferir extensão; o objectKey é gerado no servidor.' })
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @MaxLength(120)
  mimeType: string;

  @ApiProperty({ enum: MediaEntityType })
  @IsEnum(MediaEntityType)
  entityType: MediaEntityType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  entityId?: string;
}
