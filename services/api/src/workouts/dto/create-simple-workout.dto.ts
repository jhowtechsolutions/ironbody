import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class SimpleWorkoutExerciseItemDto {
  @ApiProperty({ example: 'Supino reto' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  sets!: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  reps!: number;

  @ApiProperty({ required: false, example: '60s' })
  @IsOptional()
  @IsString()
  rest?: string;
}

export class CreateSimpleWorkoutDto {
  @ApiProperty({ example: 'Treino A — Peito' })
  @IsString()
  name!: string;

  @ApiProperty({ type: [SimpleWorkoutExerciseItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SimpleWorkoutExerciseItemDto)
  exercises!: SimpleWorkoutExerciseItemDto[];
}
