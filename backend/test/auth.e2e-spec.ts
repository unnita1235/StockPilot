import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Auth Module E2E Tests
 *
 * Tests the complete authentication flow including registration,
 * login, profile access, password management, and admin user operations.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================
  // Registration Tests
  // =========================================================

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test-e2e@example.com',
          password: 'SecurePass123!',
        })
        .expect(201)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.user).toBeDefined();
          expect(response.body.data.token).toBeDefined();
          expect(response.body.data.user.email).toBe('test-e2e@example.com');
          expect(response.body.data.user.role).toBe('staff');
          authToken = response.body.data.token;
          userId = response.body.data.user._id;
        });
    });

    it('should reject duplicate email registration', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'test-e2e@example.com',
          password: 'SecurePass123!',
        })
        .expect(409);
    });

    it('should reject registration with missing fields', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'incomplete@example.com',
        })
        .expect(400);
    });

    it('should reject registration with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Bad Email User',
          email: 'not-an-email',
          password: 'SecurePass123!',
        })
        .expect(400);
    });
  });

  // =========================================================
  // Login Tests
  // =========================================================

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test-e2e@example.com',
          password: 'SecurePass123!',
        })
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.token).toBeDefined();
          expect(response.body.data.user.email).toBe('test-e2e@example.com');
          authToken = response.body.data.token;
        });
    });

    it('should reject login with wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test-e2e@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should reject login with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePass123!',
        })
        .expect(401);
    });

    it('should reject login with missing credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });
  });

  // =========================================================
  // Profile Tests
  // =========================================================

  describe('GET /api/auth/me', () => {
    it('should return current user profile', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.email).toBe('test-e2e@example.com');
          expect(response.body.data.name).toBe('Test User');
          expect(response.body.data.password).toBeUndefined();
        });
    });

    it('should reject unauthenticated request', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('should reject invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);
    });
  });

  // =========================================================
  // Profile Update Tests
  // =========================================================

  describe('PUT /api/auth/profile', () => {
    it('should update user profile', () => {
      return request(app.getHttpServer())
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
        })
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.name).toBe('Updated Name');
        });
    });

    it('should reject profile update without auth', () => {
      return request(app.getHttpServer())
        .put('/api/auth/profile')
        .send({ name: 'Hacker' })
        .expect(401);
    });
  });

  // =========================================================
  // Password Change Tests
  // =========================================================

  describe('POST /api/auth/change-password', () => {
    it('should change password with valid current password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'SecurePass123!',
          newPassword: 'NewSecurePass456!',
        })
        .expect(200);
    });

    it('should reject with wrong current password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongOldPassword!',
          newPassword: 'NewPass789!',
        })
        .expect(401);
    });
  });

  // =========================================================
  // Password Reset Flow Tests
  // =========================================================

  describe('Password Reset Flow', () => {
    it('POST /api/auth/forgot-password should accept valid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'test-e2e@example.com' })
        .expect(200);
    });

    it('POST /api/auth/forgot-password should not reveal non-existent emails', () => {
      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200); // Should not reveal if email exists
    });

    it('POST /api/auth/reset-password should reject invalid token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-reset-token',
          password: 'NewPass123!',
        })
        .expect(400);
    });
  });

  // =========================================================
  // Logout Tests
  // =========================================================

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
        });
    });
  });

  // =========================================================
  // Admin User Management Tests
  // =========================================================

  describe('Admin User Management', () => {
    beforeAll(async () => {
      // Register a second user for admin tests
      // Note: In a real scenario, you'd update the role in the DB directly
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Admin E2E',
          email: 'admin-e2e@example.com',
          password: 'AdminPass123!',
        });
    });

    it('GET /api/auth/users should require admin role', () => {
      return request(app.getHttpServer())
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('PUT /api/auth/users/:id/role should require admin role', () => {
      return request(app.getHttpServer())
        .put(`/api/auth/users/${userId}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'manager' })
        .expect(403);
    });

    it('PUT /api/auth/users/:id/status should require admin role', () => {
      return request(app.getHttpServer())
        .put(`/api/auth/users/${userId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isActive: false })
        .expect(403);
    });

    it('DELETE /api/auth/users/:id should require admin role', () => {
      return request(app.getHttpServer())
        .delete(`/api/auth/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });
});
