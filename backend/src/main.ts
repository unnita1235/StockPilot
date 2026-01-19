import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  try {
    console.log('Starting StockPilot Backend...');
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`PORT: ${process.env.PORT || 5000}`);
    console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'SET' : 'NOT SET'}`);
    
    const app = await NestFactory.create(AppModule);

    // Enable CORS for frontend communication
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://stock-pilot-wheat.vercel.app',
      'http://localhost:3000',
      'http://localhost:9002',
    ].filter(Boolean);

    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Allow all for now
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
    });

    // Enable global validation
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    // Set global prefix for API routes
    app.setGlobalPrefix('api');

    const port = process.env.PORT || 5000;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Backend running on port ${port}`);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}
bootstrap();
