
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

    catch(exception: unknown, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();

        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const responseBody = {
            statusCode: httpStatus,
            timestamp: new Date().toISOString(),
            path: httpAdapter.getRequestUrl(ctx.getRequest()),
            message:
                exception instanceof HttpException
                    ? exception.message || exception.getResponse()
                    : 'Internal server error',
            error:
                exception instanceof HttpException
                    ? exception.name
                    : 'InternalServerError',
        };

        // Log the error for debugging (restricted logs in production could filter this further if needed)
        this.logger.error(
            `Http Status: ${httpStatus} Error Message: ${JSON.stringify(responseBody)}`,
        );

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
}
