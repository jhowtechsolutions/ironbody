import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum CheckoutPlan {
  PERSONAL = 'PERSONAL',
  ALUNO = 'ALUNO',
}

export class CreateCheckoutSessionDto {
  @ApiProperty({ enum: CheckoutPlan, description: 'Plano de assinatura' })
  @IsEnum(CheckoutPlan)
  plan!: CheckoutPlan;

  @ApiPropertyOptional({ description: 'URL de redirecionamento após sucesso' })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiPropertyOptional({ description: 'URL de redirecionamento ao cancelar' })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}
