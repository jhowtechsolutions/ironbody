import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness — processo vivo (sem dependências pesadas)' })
  health() {
    return {
      ok: true,
      service: 'ironbody-api',
      env: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness — PostgreSQL alcançável (orquestração / LB)' })
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        ok: true,
        ready: true,
        service: 'ironbody-api',
        database: 'up',
        env: process.env.NODE_ENV ?? 'development',
        timestamp: new Date().toISOString(),
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'database_unreachable';
      throw new ServiceUnavailableException({
        ok: false,
        ready: false,
        service: 'ironbody-api',
        database: 'down',
        env: process.env.NODE_ENV ?? 'development',
        timestamp: new Date().toISOString(),
        detail: process.env.NODE_ENV === 'production' ? undefined : msg,
      });
    }
  }
}
