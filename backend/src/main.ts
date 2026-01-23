import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

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

    // Add root health check endpoint BEFORE global prefix
    // This ensures Railway health checks at / return 200 OK
    app.use('/', (req: any, res: any, next: any) => {
      if (req.method === 'GET' && req.path === '/') {
        // Get database connection status
        let dbStatus = 'unknown';
        let dbConnected = false;
        try {
          const connection = app.get(Connection);
          if (connection && connection.readyState === 1) {
            dbStatus = 'connected';
            dbConnected = true;
          } else if (connection && connection.readyState === 2) {
            dbStatus = 'connecting';
          } else if (connection && connection.readyState === 0) {
            dbStatus = 'disconnected';
          } else {
            dbStatus = 'unknown';
          }
        } catch (error) {
          dbStatus = 'unavailable';
        }

        res.status(200).json({
          status: 'healthy',
          service: 'StockPilot Backend',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV || 'development',
          database: {
            status: dbStatus,
            connected: dbConnected,
          },
        });
      } else {
        next();
      }
    });

    // Set global prefix for API routes
    app.setGlobalPrefix('api');

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');

    // Enhanced startup logging
    console.log('='.repeat(50));
    console.log('✅ StockPilot Backend Started Successfully!');
    console.log('='.repeat(50));
    console.log(`🚀 Server listening on: http://0.0.0.0:${port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 Health check endpoint: http://0.0.0.0:${port}/`);
    console.log(`📍 API health endpoint: http://0.0.0.0:${port}/api/health`);
    console.log('-'.repeat(50));
    console.log('🔒 CORS Configuration:');
    console.log(`   Allowed Origins:`);
    allowedOrigins.forEach(origin => {
      console.log(`   - ${origin}`);
    });
    console.log('-'.repeat(50));

    // Check MongoDB connection status
    try {
      const connection = app.get(Connection);
      if (connection.readyState === 1) {
        console.log('✅ MongoDB: Connected');
      } else if (connection.readyState === 2) {
        console.log('🔄 MongoDB: Connecting...');
      } else if (connection.readyState === 0) {
        console.log('⚠️  MongoDB: Disconnected (will retry)');
      } else {
        console.log('❓ MongoDB: Unknown state');
      }
    } catch (error) {
      console.log('⚠️  MongoDB: Status unavailable');
    }
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}
bootstrap();
