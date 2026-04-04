import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';

export class GenerateWorkoutDto {
  @ApiProperty({ description: 'Modalidade (ex: Musculação, Crossfit, Corrida)' })
  @IsString()
  modalidade: string;

  @ApiProperty({ description: 'Categoria do treino (ex: ABC, AMRAP, Longão)' })
  @IsString()
  categoria: string;

  @ApiProperty({ description: 'Objetivo (ex: Hipertrofia, Resistência)' })
  @IsString()
  objetivo: string;

  @ApiPropertyOptional({ description: 'Nível do aluno', default: 'intermediário' })
  @IsOptional()
  @IsString()
  nivel?: string;

  @ApiPropertyOptional({ description: 'Dias por semana', default: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(6)
  diasSemana?: number;

  @ApiPropertyOptional({ description: 'Equipamentos disponíveis' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipamentos?: string[];

  @ApiPropertyOptional({ description: 'Restrições ou observações' })
  @IsOptional()
  @IsString()
  restricoes?: string;
}
