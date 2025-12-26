const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const Item = require('../models/Item');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

describe('Items API', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  beforeEach(async () => {
    // Create test user and get token
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    authToken = generateToken(testUser._id);

    // Clear items
    await Item.deleteMany({});
  });

  afterAll(async () => {
    await Item.deleteMany({});
    await User.deleteMany({});
  });

  describe('GET /api/items', () => {
    it('should get all items', async () => {
      await Item.create({
        name: 'Test Item',
        description: 'Test Description',
        stock: 10,
        category: 'Raw Material',
        lowStockThreshold: 5,
      });

      const res = await request(app).get('/api/items');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toHaveProperty('name', 'Test Item');
    });

    it('should filter by category', async () => {
      await Item.create([
        { name: 'Item 1', category: 'Raw Material', stock: 10, lowStockThreshold: 5 },
        { name: 'Item 2', category: 'Product for Sale', stock: 10, lowStockThreshold: 5 },
      ]);

      const res = await request(app).get('/api/items?category=Raw Material');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].category).toBe('Raw Material');
    });

    it('should search items by name', async () => {
      await Item.create([
        { name: 'Coffee Beans', category: 'Raw Material', stock: 10, lowStockThreshold: 5 },
        { name: 'Milk', category: 'Raw Material', stock: 10, lowStockThreshold: 5 },
      ]);

      const res = await request(app).get('/api/items?search=Coffee');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toContain('Coffee');
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Item',
          description: 'New Description',
          stock: 20,
          category: 'Raw Material',
          lowStockThreshold: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'New Item');
    });

    it('should require name and category', async () => {
      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Missing name and category',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/items/:id', () => {
    it('should get a single item', async () => {
      const item = await Item.create({
        name: 'Test Item',
        category: 'Raw Material',
        stock: 10,
        lowStockThreshold: 5,
      });

      const res = await request(app).get(`/api/items/${item._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'Test Item');
    });

    it('should return 404 for non-existent item', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/items/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/items/:id', () => {
    it('should update an item', async () => {
      const item = await Item.create({
        name: 'Original Name',
        category: 'Raw Material',
        stock: 10,
        lowStockThreshold: 5,
      });

      const res = await request(app)
        .put(`/api/items/${item._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('name', 'Updated Name');
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete an item', async () => {
      const item = await Item.create({
        name: 'Item to Delete',
        category: 'Raw Material',
        stock: 10,
        lowStockThreshold: 5,
      });

      const res = await request(app)
        .delete(`/api/items/${item._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify item is deleted
      const deletedItem = await Item.findById(item._id);
      expect(deletedItem).toBeNull();
    });
  });
});

