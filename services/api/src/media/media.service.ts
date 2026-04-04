import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MediaEntityType, MediaKind, Prisma, Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/types/auth-user';
import { S3Service } from './s3.service';
import { UploadUrlDto } from './dto/upload-url.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { ListMediaQueryDto } from './dto/list-media-query.dto';
import { ListStudentMediaQueryDto } from './dto/list-student-media-query.dto';

const KIND_RULES: Record<
  MediaKind,
  { mimes: Set<string>; maxBytes: number }
> = {
  [MediaKind.PHOTO_PROGRESS]: {
    mimes: new Set(['image/jpeg', 'image/png', 'image/webp']),
    maxBytes: 10 * 1024 * 1024,
  },
  [MediaKind.PHOTO_ASSESSMENT]: {
    mimes: new Set(['image/jpeg', 'image/png', 'image/webp']),
    maxBytes: 10 * 1024 * 1024,
  },
  [MediaKind.EXERCISE_GIF]: {
    mimes: new Set(['image/gif']),
    maxBytes: 20 * 1024 * 1024,
  },
  [MediaKind.EXERCISE_VIDEO]: {
    mimes: new Set(['video/mp4', 'video/webm']),
    maxBytes: 120 * 1024 * 1024,
  },
  [MediaKind.OTHER]: {
    mimes: new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']),
    maxBytes: 20 * 1024 * 1024,
  },
};

const KIND_TO_ENTITY: Partial<Record<MediaKind, MediaEntityType>> = {
  [MediaKind.PHOTO_PROGRESS]: MediaEntityType.USER_PROGRESS,
  [MediaKind.PHOTO_ASSESSMENT]: MediaEntityType.ASSESSMENT,
  [MediaKind.EXERCISE_VIDEO]: MediaEntityType.EXERCISE,
  [MediaKind.EXERCISE_GIF]: MediaEntityType.EXERCISE,
};

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  private assertMimeAndSize(kind: MediaKind, mimeType: string, sizeBytes?: number) {
    const rule = KIND_RULES[kind];
    if (!rule.mimes.has(mimeType)) {
      throw new BadRequestException(`MIME não permitido para ${kind}: ${mimeType}`);
    }
    if (sizeBytes != null && sizeBytes > rule.maxBytes) {
      throw new BadRequestException(`Arquivo excede o tamanho máximo para ${kind}`);
    }
  }

  private assertKindEntityPair(kind: MediaKind, entityType: MediaEntityType) {
    if (kind === MediaKind.OTHER) return;
    const expected = KIND_TO_ENTITY[kind];
    if (expected && entityType !== expected) {
      throw new BadRequestException(`entityType ${entityType} incompatível com kind ${kind}`);
    }
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
    };
    return map[mime] || 'bin';
  }

  private safeExtFromFileName(fileName: string, mime: string): string {
    const parts = fileName.split('.');
    const last = parts.length > 1 ? parts[parts.length - 1] : '';
    const cleaned = (last || '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase()
      .slice(0, 6);
    if (cleaned.length >= 2) return cleaned;
    return this.extFromMime(mime);
  }

  /** Prefixo `users/{id}/…`: sempre o aluno (evolução / avaliação). Dono do registro MediaFile idem, exceto exercício (quem enviou). */
  private async resolveOwners(
    user: AuthUser,
    kind: MediaKind,
    entityId?: string | null,
  ): Promise<{ pathUserId: string; mediaOwnerId: string }> {
    if (kind === MediaKind.PHOTO_PROGRESS) {
      return { pathUserId: user.id, mediaOwnerId: user.id };
    }
    if (kind === MediaKind.PHOTO_ASSESSMENT) {
      if (!entityId) throw new BadRequestException('entityId (assessmentId) obrigatório');
      const a = await this.prisma.assessment.findUnique({ where: { id: entityId } });
      if (!a) throw new NotFoundException('Avaliação não encontrada');
      return { pathUserId: a.studentId, mediaOwnerId: a.studentId };
    }
    if (kind === MediaKind.EXERCISE_VIDEO || kind === MediaKind.EXERCISE_GIF) {
      return { pathUserId: user.id, mediaOwnerId: user.id };
    }
    return { pathUserId: user.id, mediaOwnerId: user.id };
  }

  private buildObjectKey(params: {
    kind: MediaKind;
    pathUserId: string;
    entityId?: string | null;
    ext: string;
  }): string {
    const ext = params.ext.replace(/[^a-z0-9]/gi, '').slice(0, 6) || 'bin';
    const id = randomUUID();
    switch (params.kind) {
      case MediaKind.PHOTO_PROGRESS:
        return `users/${params.pathUserId}/progress/${id}.${ext}`;
      case MediaKind.PHOTO_ASSESSMENT:
        return `users/${params.pathUserId}/assessments/${id}.${ext}`;
      case MediaKind.EXERCISE_VIDEO: {
        if (!params.entityId) {
          throw new BadRequestException('entityId (exerciseId) obrigatório para vídeo de exercício');
        }
        return `exercises/${params.entityId}/videos/${id}.${ext}`;
      }
      case MediaKind.EXERCISE_GIF: {
        if (!params.entityId) {
          throw new BadRequestException('entityId (exerciseId) obrigatório para GIF de exercício');
        }
        return `exercises/${params.entityId}/gifs/${id}.${ext}`;
      }
      default:
        return `users/${params.pathUserId}/misc/${id}.${ext}`;
    }
  }

  private async isPersonalLinkedToStudent(personalId: string, studentId: string) {
    const row = await this.prisma.studentPersonalLink.findUnique({
      where: {
        personalId_studentId: { personalId, studentId },
      },
    });
    return !!row;
  }

  private async assertUploadAllowed(user: AuthUser, dto: UploadUrlDto) {
    this.assertKindEntityPair(dto.kind, dto.entityType);
    this.assertMimeAndSize(dto.kind, dto.mimeType);

    if (dto.kind === MediaKind.PHOTO_PROGRESS) {
      if (user.role !== Role.ALUNO) {
        throw new ForbiddenException('Apenas alunos enviam foto de evolução.');
      }
      return;
    }

    if (dto.kind === MediaKind.PHOTO_ASSESSMENT) {
      if (!dto.entityId) throw new BadRequestException('entityId (assessmentId) obrigatório');
  const a = await this.prisma.assessment.findUnique({ where: { id: dto.entityId } });
      if (!a) throw new NotFoundException('Avaliação não encontrada');
      if (user.role === Role.ALUNO) {
        if (a.studentId !== user.id) throw new ForbiddenException();
        return;
      }
      if (user.role === Role.PERSONAL_PROFESSOR) {
        const ok = await this.isPersonalLinkedToStudent(user.id, a.studentId);
        if (!ok) throw new ForbiddenException('Sem vínculo com este aluno');
        return;
      }
      if (user.role === Role.ADMIN) return;
      throw new ForbiddenException();
    }

    if (dto.kind === MediaKind.EXERCISE_VIDEO || dto.kind === MediaKind.EXERCISE_GIF) {
      if (user.role !== Role.PERSONAL_PROFESSOR && user.role !== Role.ADMIN) {
        throw new ForbiddenException('Apenas personal ou admin envia mídia de exercício.');
      }
      if (!dto.entityId) throw new BadRequestException('entityId (exerciseId) obrigatório');
      const ex = await this.prisma.exercise.findUnique({ where: { id: dto.entityId } });
      if (!ex) throw new NotFoundException('Exercício não encontrado');
      return;
    }
  }

  private assertObjectKeyMatchesContext(params: {
    objectKey: string;
    kind: MediaKind;
    pathUserId: string;
    entityId?: string | null;
  }) {
    const { objectKey, kind, pathUserId, entityId } = params;
    if (kind === MediaKind.PHOTO_PROGRESS) {
      if (!objectKey.startsWith(`users/${pathUserId}/progress/`)) {
        throw new BadRequestException('objectKey inválido para evolução');
      }
      return;
    }
    if (kind === MediaKind.PHOTO_ASSESSMENT) {
      if (!objectKey.startsWith(`users/${pathUserId}/assessments/`)) {
        throw new BadRequestException('objectKey inválido para avaliação');
      }
      return;
    }
    if (kind === MediaKind.EXERCISE_VIDEO || kind === MediaKind.EXERCISE_GIF) {
      const segment = kind === MediaKind.EXERCISE_VIDEO ? 'videos' : 'gifs';
      if (!entityId || !objectKey.startsWith(`exercises/${entityId}/${segment}/`)) {
        throw new BadRequestException('objectKey inválido para exercício');
      }
      return;
    }
  }

  async createUploadUrl(user: AuthUser, dto: UploadUrlDto) {
    await this.assertUploadAllowed(user, dto);
    this.s3.assertConfigured();
    const { pathUserId } = await this.resolveOwners(user, dto.kind, dto.entityId);
    const bucket = this.s3.bucketForKind(dto.kind);
    const ext = this.safeExtFromFileName(dto.fileName, dto.mimeType);
    const objectKey = this.buildObjectKey({
      kind: dto.kind,
      pathUserId,
      entityId: dto.entityId,
      ext,
    });
    const { uploadUrl, expiresIn } = await this.s3.signPutObject(bucket, objectKey, dto.mimeType);
    const publicUrl = this.s3.publicObjectUrl(bucket, objectKey);
    return { uploadUrl, publicUrl, bucket, objectKey, expiresIn };
  }

  async confirmUpload(user: AuthUser, dto: ConfirmUploadDto) {
    this.assertKindEntityPair(dto.kind, dto.entityType);
    this.assertMimeAndSize(dto.kind, dto.mimeType, dto.sizeBytes);

    await this.assertUploadAllowed(user, {
      kind: dto.kind,
      fileName: 'x',
      mimeType: dto.mimeType,
      entityType: dto.entityType,
      entityId: dto.entityId,
    });

    const { pathUserId, mediaOwnerId } = await this.resolveOwners(user, dto.kind, dto.entityId);

    const expectedBucket = this.s3.bucketForKind(dto.kind);
    if (dto.bucket !== expectedBucket) {
      throw new BadRequestException('bucket não corresponde ao tipo de mídia');
    }

    this.assertObjectKeyMatchesContext({
      objectKey: dto.objectKey,
      kind: dto.kind,
      pathUserId,
      entityId: dto.entityId,
    });

    try {
      const head = await this.s3.headObject(dto.bucket, dto.objectKey);
      if (head.contentLength != null && Math.abs(head.contentLength - dto.sizeBytes) > 8) {
        throw new BadRequestException('Tamanho do objeto S3 não confere com sizeBytes');
      }
      if (head.contentType && head.contentType.split(';')[0].trim() !== dto.mimeType) {
        throw new BadRequestException('Content-Type no S3 não confere');
      }
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      this.logger.warn(
        `[Media] confirm HeadObject falhou bucket=${dto.bucket} key_prefix=${dto.objectKey.slice(0, 48)}…`,
      );
      throw new BadRequestException('Objeto não encontrado no S3. Conclua o PUT antes de confirmar.');
    }

    const url = this.s3.publicObjectUrl(dto.bucket, dto.objectKey);

    return this.prisma.$transaction(async (tx) => {
      const media = await tx.mediaFile.create({
        data: {
          ownerUserId: mediaOwnerId,
          entityType: dto.entityType,
          entityId: dto.entityId ?? null,
          kind: dto.kind,
          bucket: dto.bucket,
          objectKey: dto.objectKey,
          url,
          mimeType: dto.mimeType,
          sizeBytes: dto.sizeBytes,
        },
      });

      if (dto.kind === MediaKind.PHOTO_PROGRESS) {
        await tx.progressPhoto.create({
          data: {
            studentId: mediaOwnerId,
            fotoUrl: url,
          },
        });
      }
      if (dto.kind === MediaKind.EXERCISE_VIDEO && dto.entityId) {
        await tx.exercise.update({
          where: { id: dto.entityId },
          data: { videoUrl: url },
        });
      }
      if (dto.kind === MediaKind.EXERCISE_GIF && dto.entityId) {
        await tx.exercise.update({
          where: { id: dto.entityId },
          data: { gifUrl: url },
        });
      }

      return media;
    });
  }

  /** Mídias de um aluno específico; apenas personal com StudentPersonalLink ativo. */
  async listForLinkedStudent(
    user: AuthUser,
    studentId: string,
    query: ListStudentMediaQueryDto,
  ) {
    if (user.role !== Role.PERSONAL_PROFESSOR) {
      throw new ForbiddenException();
    }
    const ok = await this.isPersonalLinkedToStudent(user.id, studentId);
    if (!ok) throw new ForbiddenException('Sem vínculo com este aluno');

    const where: Prisma.MediaFileWhereInput = { ownerUserId: studentId };
    if (query.kind) where.kind = query.kind;
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;

    return this.prisma.mediaFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async list(user: AuthUser, query: ListMediaQueryDto) {
    const where: any = {};

    if (user.role === Role.ALUNO) {
      where.ownerUserId = user.id;
    } else if (user.role === Role.PERSONAL_PROFESSOR) {
      const links = await this.prisma.studentPersonalLink.findMany({
        where: { personalId: user.id },
        select: { studentId: true },
      });
      const studentIds = links.map((l) => l.studentId);
      const ownerFilter = query.ownerUserId
        ? [query.ownerUserId]
        : [user.id, ...studentIds];
      where.ownerUserId = { in: ownerFilter };
    } else if (user.role === Role.ADMIN) {
      if (query.ownerUserId) where.ownerUserId = query.ownerUserId;
    }

    if (query.kind) where.kind = query.kind;
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;

    return this.prisma.mediaFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async remove(user: AuthUser, id: string) {
    const row = await this.prisma.mediaFile.findUnique({ where: { id } });
    if (!row) throw new NotFoundException();

    if (row.ownerUserId === user.id) {
      // ok
    } else if (user.role === Role.PERSONAL_PROFESSOR) {
      const ok = await this.isPersonalLinkedToStudent(user.id, row.ownerUserId);
      if (!ok) throw new ForbiddenException();
    } else if (user.role !== Role.ADMIN) {
      throw new ForbiddenException();
    }

    try {
      await this.s3.deleteObject(row.bucket, row.objectKey);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`[Media] delete S3 falhou id=${id} — prosseguindo com remoção do registro: ${msg}`);
    }
    await this.prisma.mediaFile.delete({ where: { id } });
    return { ok: true };
  }
}
