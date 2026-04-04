import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';

export class CustomerPortalDto {
  @ApiPropertyOptional({
    description:
      'URL para onde o Stripe redireciona após o portal. Padrão: WEB_URL ou APP_URL_WEB.',
    example: 'https://ironbody.app/dashboard/personal/conta',
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  returnUrl?: string;
}
