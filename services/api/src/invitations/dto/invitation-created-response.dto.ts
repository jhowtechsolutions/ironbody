import { ApiProperty } from '@nestjs/swagger';

export class InvitationCreatedResponseDto {
  @ApiProperty()
  token!: string;

  @ApiProperty({ description: 'URL absoluta para o aluno abrir no front' })
  url!: string;
}
