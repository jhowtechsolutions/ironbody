import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;

  @ApiProperty()
  @IsString()
  name: string;

  /** Se omitido, o cadastro é tratado como personal trainer. */
  @ApiPropertyOptional({ enum: ['PERSONAL_PROFESSOR', 'ALUNO'] })
  @IsOptional()
  @IsEnum(['PERSONAL_PROFESSOR', 'ALUNO'])
  role?: 'PERSONAL_PROFESSOR' | 'ALUNO';
}
