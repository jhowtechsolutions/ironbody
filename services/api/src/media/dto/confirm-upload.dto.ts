import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaEntityType, MediaKind } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ConfirmUploadDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  bucket: string;

  @ApiProperty({ description: 'Deve coincidir com o valor retornado em upload-url.' })
  @IsString()
  @MaxLength(1024)
  objectKey: string;

  @ApiProperty()
  @IsString()
  @MaxLength(2048)
  url: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @MaxLength(120)
  mimeType: string;

  @ApiProperty({ minimum: 1, maximum: 524288000 })
  @IsInt()
  @Min(1)
  @Max(524288000)
  sizeBytes: number;

  @ApiProperty({ enum: MediaKind })
  @IsEnum(MediaKind)
  kind: MediaKind;

  @ApiProperty({ enum: MediaEntityType })
  @IsEnum(MediaEntityType)
  entityType: MediaEntityType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  entityId?: string;
}
