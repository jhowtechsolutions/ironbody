import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class CancelSubscriptionDto {
  @ApiPropertyOptional({
    description:
      'Se true, cancela imediatamente na Stripe. Padrão: false (cancela ao fim do período atual).',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  immediately?: boolean;
}
