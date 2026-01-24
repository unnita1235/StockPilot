import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    // Global Error Handling
    const httpAdapter = app.get(HttpAdapterHost);
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

    // Security headers with Helmet
    app.use(helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));

    // Enable CORS for frontend communication - PRODUCTION READY
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://stock-pilot-wheat.vercel.app',
      'https://stockpilot.vercel.app',
      // Only allow localhost in development
      ...(process.env.NODE_ENV !== 'production' ? [
        'http://localhost:3000',
        'http://localhost:9002',
      ] : []),
    ].filter(Boolean) as string[];

    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, server-to-server, health checks)
        if (!origin) {
          callback(null, true);
          return;
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          // Log blocked origins only in dev/debug to avoid log flooding in prod
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`CORS blocked origin: ${origin}`);
          }
          callback(new Error('Not allowed by CORS'), false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
    });

    // Enable global validation with security options
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }));

    // Set global prefix for API routes
    app.setGlobalPrefix('api');

    const port = process.env.PORT || 5000;
    await app.listen(port, '0.0.0.0');

    console.log('='.repeat(50));
    console.log(`🚀 Backend running on port ${port}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    // Sanitize logs - do NOT log full secrets or connection strings
    console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'SET' : '❌ NOT SET'}`);
    console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'SET' : '❌ NOT SET'}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}
bootstrap();
