import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { S3Service } from './s3.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [PrismaModule],
  controllers: [MediaController],
  providers: [MediaService, S3Service, RolesGuard],
  exports: [MediaService, S3Service],
})
export class MediaModule {}
