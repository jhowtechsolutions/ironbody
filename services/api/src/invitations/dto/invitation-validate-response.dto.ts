import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class InvitationPersonalPreviewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class InvitationValidateResponseDto {
  @ApiProperty()
  valid!: boolean;

  @ApiPropertyOptional({ type: InvitationPersonalPreviewDto })
  personal?: InvitationPersonalPreviewDto;
}
