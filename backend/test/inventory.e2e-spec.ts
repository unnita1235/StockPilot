import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Inventory Module E2E Tests
 *
 * Tests CRUD operations on inventory items, stock movements,
 * and AI forecasting endpoints.
 */
describe('Inventory (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdItemId: string;

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
        name: 'Inventory Test User',
        email: `inventory-e2e-${Date.now()}@example.com`,
        password: 'TestPass123!',
      });
    authToken = authResponse.body.data.token;
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================
  // Create Item Tests
  // =========================================================

  describe('POST /api/items', () => {
    it('should create a new inventory item', () => {
      return request(app.getHttpServer())
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E Test Widget',
          description: 'A widget created during E2E testing',
          quantity: 100,
          category: 'Electronics',
          location: 'Warehouse A',
          lowStockThreshold: 10,
          unitPrice: 29.99,
          sku: `E2E-${Date.now()}`,
          supplier: 'Test Supplier',
          tags: ['e2e', 'test'],
        })
        .expect(201)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.name).toBe('E2E Test Widget');
          expect(response.body.data.quantity).toBe(100);
          expect(response.body.data.category).toBe('Electronics');
          createdItemId = response.body.data._id;
        });
    });

    it('should reject item creation without auth', () => {
      return request(app.getHttpServer())
        .post('/api/items')
        .send({
          name: 'Unauthorized Widget',
          quantity: 50,
        })
        .expect(401);
    });

    it('should reject item creation with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('should reject negative quantity', () => {
      return request(app.getHttpServer())
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Negative Widget',
          quantity: -5,
          category: 'Test',
        })
        .expect(400);
    });
  });

  // =========================================================
  // List Items Tests
  // =========================================================

  describe('GET /api/items', () => {
    it('should return list of inventory items', () => {
      return request(app.getHttpServer())
        .get('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(Array.isArray(response.body.data)).toBe(true);
          expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should filter items by category', () => {
      return request(app.getHttpServer())
        .get('/api/items?category=Electronics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          response.body.data.forEach((item: any) => {
            expect(item.category).toBe('Electronics');
          });
        });
    });

    it('should search items by name', () => {
      return request(app.getHttpServer())
        .get('/api/items?search=E2E Test Widget')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/items')
        .expect(401);
    });
  });

  // =========================================================
  // Get Single Item Tests
  // =========================================================

  describe('GET /api/items/:id', () => {
    it('should return a specific item', () => {
      return request(app.getHttpServer())
        .get(`/api/items/${createdItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data._id).toBe(createdItemId);
          expect(response.body.data.name).toBe('E2E Test Widget');
        });
    });

    it('should return 404 for non-existent item', () => {
      return request(app.getHttpServer())
        .get('/api/items/000000000000000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 400 for invalid ID format', () => {
      return request(app.getHttpServer())
        .get('/api/items/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  // =========================================================
  // Update Item Tests
  // =========================================================

  describe('PUT /api/items/:id', () => {
    it('should update an inventory item', () => {
      return request(app.getHttpServer())
        .put(`/api/items/${createdItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated E2E Widget',
          quantity: 200,
          unitPrice: 39.99,
        })
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.name).toBe('Updated E2E Widget');
          expect(response.body.data.quantity).toBe(200);
          expect(response.body.data.unitPrice).toBe(39.99);
        });
    });

    it('should reject update for non-existent item', () => {
      return request(app.getHttpServer())
        .put('/api/items/000000000000000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Ghost Item' })
        .expect(404);
    });
  });

  // =========================================================
  // Stock Movement Tests
  // =========================================================

  describe('POST /api/items/:id/movement', () => {
    it('should record an IN stock movement', () => {
      return request(app.getHttpServer())
        .post(`/api/items/${createdItemId}/movement`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'IN',
          quantity: 50,
          reason: 'E2E test restock',
          notes: 'Testing stock movement',
        })
        .expect(201)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.movement.type).toBe('IN');
          expect(response.body.data.movement.quantity).toBe(50);
        });
    });

    it('should record an OUT stock movement', () => {
      return request(app.getHttpServer())
        .post(`/api/items/${createdItemId}/movement`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'OUT',
          quantity: 10,
          reason: 'E2E test order',
        })
        .expect(201);
    });

    it('should record an ADJUST stock movement', () => {
      return request(app.getHttpServer())
        .post(`/api/items/${createdItemId}/movement`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'ADJUST',
          quantity: 5,
          reason: 'E2E inventory audit',
        })
        .expect(201);
    });

    it('should reject movement with zero quantity', () => {
      return request(app.getHttpServer())
        .post(`/api/items/${createdItemId}/movement`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'IN',
          quantity: 0,
          reason: 'Zero quantity test',
        })
        .expect(400);
    });

    it('should reject movement with invalid type', () => {
      return request(app.getHttpServer())
        .post(`/api/items/${createdItemId}/movement`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'INVALID',
          quantity: 10,
          reason: 'Invalid type test',
        })
        .expect(400);
    });
  });

  // =========================================================
  // Stock Operations Tests
  // =========================================================

  describe('Stock Operations', () => {
    it('POST /api/stock/add should add stock', () => {
      return request(app.getHttpServer())
        .post('/api/stock/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId: createdItemId,
          quantity: 25,
          reason: 'E2E stock add test',
        })
        .expect(201);
    });

    it('POST /api/stock/remove should remove stock', () => {
      return request(app.getHttpServer())
        .post('/api/stock/remove')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId: createdItemId,
          quantity: 5,
          reason: 'E2E stock remove test',
        })
        .expect(201);
    });

    it('GET /api/stock/movements should return movements', () => {
      return request(app.getHttpServer())
        .get(`/api/stock/movements?itemId=${createdItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(Array.isArray(response.body.data)).toBe(true);
          expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    it('PUT /api/stock/quick-update/:id should update quantity', () => {
      return request(app.getHttpServer())
        .put(`/api/stock/quick-update/${createdItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 150 })
        .expect(200);
    });
  });

  // =========================================================
  // AI Forecast Tests
  // =========================================================

  describe('GET /api/items/:id/forecast', () => {
    it('should return forecast data for item', () => {
      return request(app.getHttpServer())
        .get(`/api/items/${createdItemId}/forecast`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toBeDefined();
        });
    });
  });

  // =========================================================
  // Delete Item Tests
  // =========================================================

  describe('DELETE /api/items/:id', () => {
    it('should delete an inventory item', () => {
      return request(app.getHttpServer())
        .delete(`/api/items/${createdItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
        });
    });

    it('should return 404 after deletion', () => {
      return request(app.getHttpServer())
        .get(`/api/items/${createdItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
