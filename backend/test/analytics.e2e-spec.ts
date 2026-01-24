import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Analytics Module E2E Tests
 *
 * Tests dashboard statistics, trends, alerts, and reporting endpoints.
 */
describe('Analytics (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Register and get auth token
    const authResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Analytics Test User',
        email: `analytics-e2e-${Date.now()}@example.com`,
        password: 'TestPass123!',
      });
    authToken = authResponse.body.data.token;
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================
  // Dashboard Tests
  // =========================================================

  describe('GET /api/analytics/dashboard', () => {
    it('should return dashboard statistics', () => {
      return request(app.getHttpServer())
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toBeDefined();
          expect(typeof response.body.data.totalItems).toBe('number');
          expect(typeof response.body.data.totalValue).toBe('number');
          expect(typeof response.body.data.lowStockCount).toBe('number');
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/analytics/dashboard')
        .expect(401);
    });
  });

  // =========================================================
  // Trends Tests
  // =========================================================

  describe('GET /api/analytics/trends', () => {
    it('should return 7-day trends', () => {
      return request(app.getHttpServer())
        .get('/api/analytics/trends?period=7d')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toBeDefined();
        });
    });

    it('should return 30-day trends', () => {
      return request(app.getHttpServer())
        .get('/api/analytics/trends?period=30d')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should return 90-day trends', () => {
      return request(app.getHttpServer())
        .get('/api/analytics/trends?period=90d')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should default to 7d when no period specified', () => {
      return request(app.getHttpServer())
        .get('/api/analytics/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  // =========================================================
  // Alerts Tests
  // =========================================================

  describe('GET /api/analytics/alerts', () => {
    it('should return low stock alerts', () => {
      return request(app.getHttpServer())
        .get('/api/analytics/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    it('should include severity levels in alerts', () => {
      return request(app.getHttpServer())
        .get('/api/analytics/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          if (response.body.data.length > 0) {
            const alert = response.body.data[0];
            expect(alert.severity).toBeDefined();
            expect(['info', 'warning', 'critical']).toContain(alert.severity);
          }
        });
    });
  });

  // =========================================================
  // Report Generation Tests
  // =========================================================

  describe('GET /api/analytics/report', () => {
    it('should generate summary report', () => {
      return request(app.getHttpServer())
        .get('/api/analytics/report?type=summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  // =========================================================
  // Reports Module Tests
  // =========================================================

  describe('Reports Module', () => {
    it('GET /api/reports/inventory should return inventory report', () => {
      return request(app.getHttpServer())
        .get('/api/reports/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toBeDefined();
        });
    });
  });

  // =========================================================
  // AI Prediction Tests
  // =========================================================

  describe('AI Predictions', () => {
    it('GET /api/ai/predict-all should return batch predictions', () => {
      return request(app.getHttpServer())
        .get('/api/ai/predict-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
        });
    });

    it('GET /api/ai/optimize should return optimization recommendations', () => {
      return request(app.getHttpServer())
        .get('/api/ai/optimize')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
        });
    });
  });

  // =========================================================
  // Health Check Tests
  // =========================================================

  describe('GET /health', () => {
    it('should return health status without auth', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .then((response) => {
          expect(response.body.status).toBe('ok');
          expect(response.body.uptime).toBeDefined();
          expect(response.body.timestamp).toBeDefined();
        });
    });
  });

  // =========================================================
  // Suppliers Tests
  // =========================================================

  describe('Suppliers Module', () => {
    let supplierId: string;

    it('POST /api/suppliers should create a supplier', () => {
      return request(app.getHttpServer())
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E Test Supplier',
          code: `E2E-${Date.now()}`,
          email: 'supplier@test.com',
          phone: '+1-555-0100',
          contactPerson: 'Jane Test',
          leadTimeDays: 5,
          categories: ['electronics'],
        })
        .expect(201)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.name).toBe('E2E Test Supplier');
          supplierId = response.body.data._id;
        });
    });

    it('GET /api/suppliers should return suppliers list', () => {
      return request(app.getHttpServer())
        .get('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    it('GET /api/suppliers/:id should return specific supplier', () => {
      if (!supplierId) return;
      return request(app.getHttpServer())
        .get(`/api/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.data._id).toBe(supplierId);
        });
    });

    it('PUT /api/suppliers/:id should update supplier', () => {
      if (!supplierId) return;
      return request(app.getHttpServer())
        .put(`/api/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 4.5 })
        .expect(200);
    });
  });
});
