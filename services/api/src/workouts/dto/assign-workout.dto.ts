import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AssignWorkoutDto {
  @ApiProperty({ description: 'ID do usuário aluno (User.id com role ALUNO)' })
  @IsString()
  studentId!: string;
}
