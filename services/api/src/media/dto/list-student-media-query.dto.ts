import { OmitType } from '@nestjs/swagger';
import { ListMediaQueryDto } from './list-media-query.dto';

/** Query para GET /media/student/:studentId — sem ownerUserId (fixo no aluno da rota). */
export class ListStudentMediaQueryDto extends OmitType(ListMediaQueryDto, ['ownerUserId'] as const) {}
