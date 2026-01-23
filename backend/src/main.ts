import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  try {
    console.log('='.repeat(50));
    console.log('Starting StockPilot Backend...');
    console.log('='.repeat(50));
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`PORT: ${process.env.PORT || 3000}`);
    console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'SET (' + process.env.MONGODB_URI.substring(0, 30) + '...)' : '❌ NOT SET'}`);
    console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'SET' : '❌ NOT SET'}`);
    console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || 'not set'}`);

    const app = await NestFactory.create(AppModule);

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
                // Allow all vercel.app domains
                if (origin && origin.endsWith('.vercel.app')) {
                          callback(null, true);
                          return;
                        }
          callback(null, true);
        } else {
          console.warn(`CORS blocked origin: ${origin}`);
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

      // Setup Swagger/OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder().setTitle('StockPilot API').setDescription('Inventory Management System').setVersion('1.0').addBearerAuth().build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);
  console.log('📚 Swagger documentation available at: /api-docs');

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Backend running on port ${port}`);
    console.log(`📍 Allowed origins: ${allowedOrigins.join(', ')}`);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}
bootstrap();
