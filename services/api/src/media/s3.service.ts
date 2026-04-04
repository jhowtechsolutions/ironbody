import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { MediaKind } from '@prisma/client';

const UPLOAD_URL_TTL_SECONDS = 900;

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client | null;
  private readonly region: string;

  constructor(private readonly config: ConfigService) {
    this.region = this.config.get<string>('AWS_REGION') || 'us-east-1';
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn('AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY ausentes — uploads S3 desabilitados.');
      this.client = null;
    } else {
      this.client = new S3Client({
        region: this.region,
        credentials: { accessKeyId, secretAccessKey },
      });
    }
  }

  assertConfigured() {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'S3 não configurado. Defina AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION e buckets.',
      );
    }
  }

  bucketForKind(kind: MediaKind): string {
    const media = this.config.get<string>('AWS_S3_BUCKET_MEDIA');
    const photos = this.config.get<string>('AWS_S3_BUCKET_PHOTOS') || media;
    const videos = this.config.get<string>('AWS_S3_BUCKET_VIDEOS') || media || photos;
    if (!photos && !videos) {
      this.logger.error('Nenhum bucket S3 definido (AWS_S3_BUCKET_*).');
      throw new ServiceUnavailableException('Buckets S3 não configurados.');
    }
    switch (kind) {
      case MediaKind.PHOTO_PROGRESS:
      case MediaKind.PHOTO_ASSESSMENT:
      case MediaKind.EXERCISE_GIF:
        return photos!;
      case MediaKind.EXERCISE_VIDEO:
        return videos!;
      default:
        return media || photos!;
    }
  }

  publicObjectUrl(bucket: string, objectKey: string): string {
    const encodedKey = objectKey
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `https://${bucket}.s3.${this.region}.amazonaws.com/${encodedKey}`;
  }

  async signPutObject(
    bucket: string,
    objectKey: string,
    mimeType: string,
  ): Promise<{ uploadUrl: string; expiresIn: number }> {
    this.assertConfigured();
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: mimeType,
    });
    const uploadUrl = await getSignedUrl(this.client!, cmd, { expiresIn: UPLOAD_URL_TTL_SECONDS });
    return { uploadUrl, expiresIn: UPLOAD_URL_TTL_SECONDS };
  }

  async headObject(bucket: string, objectKey: string): Promise<{ contentLength?: number; contentType?: string }> {
    this.assertConfigured();
    const out = await this.client!.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
    return {
      contentLength: out.ContentLength,
      contentType: out.ContentType,
    };
  }

  async deleteObject(bucket: string, objectKey: string): Promise<void> {
    this.assertConfigured();
    await this.client!.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
  }
}
