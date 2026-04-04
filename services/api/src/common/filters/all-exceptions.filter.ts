import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Resposta JSON consistente: statusCode, message, error, path, timestamp.
 * Erros não-HTTP em produção não expõem detalhe interno.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Erro interno do servidor';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      error = this.statusToErrorName(status);
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        if (b.message !== undefined) {
          message = b.message as string | string[];
        } else if (typeof (b as { statusCode?: number }).statusCode === 'number') {
          message = error;
        }
        if (typeof b.error === 'string') error = b.error;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`${req.method} ${req.url} — ${exception.message}`, exception.stack);
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message;
        error = exception.name || 'Error';
      }
    } else {
      this.logger.error(`${req.method} ${req.url} — ${String(exception)}`);
    }

    res.status(status).json({
      statusCode: status,
      error,
      message,
      path: req.originalUrl ?? req.url,
      timestamp: new Date().toISOString(),
    });
  }

  private statusToErrorName(status: number): string {
    const name = HttpStatus[status];
    if (typeof name === 'string') return name.replace(/_/g, ' ');
    return 'Error';
  }
}
