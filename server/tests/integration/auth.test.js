// server/tests/integration/auth.test.js - Integration tests for auth routes

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { generateToken } = require('../../src/utils/auth');

let mongoServer;
let adminUser;
let regularUser;
let adminToken;
let userToken;

// Setup in-memory MongoDB server before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create test users
  adminUser = await User.create({
    username: 'admin',
    email: 'admin@example.com',
    password: 'AdminPass123!',
    role: 'admin'
  });

  regularUser = await User.create({
    username: 'user',
    email: 'user@example.com',
    password: 'UserPass123!',
    role: 'user'
  });

  adminToken = generateToken(adminUser);
  userToken = generateToken(regularUser);
});

// Clean up after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clean up database between tests
afterEach(async () => {
  // Keep the test users, but clean up any other created data
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    if (collection.collectionName !== 'users') {
      await collection.deleteMany({});
    }
  }
});

describe('POST /api/auth/register', () => {
  it('should register a new user successfully', async () => {
    const newUser = {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'NewPass123!'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(newUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.username).toBe(newUser.username);
    expect(res.body.user.email).toBe(newUser.email);
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('should return 400 for invalid email format', async () => {
    const invalidUser = {
      username: 'testuser',
      email: 'invalid-email',
      password: 'TestPass123!'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(invalidUser);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for weak password', async () => {
    const weakPasswordUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'weak'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(weakPasswordUser);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for duplicate username', async () => {
    const duplicateUser = {
      username: 'admin', // Already exists
      email: 'different@example.com',
      password: 'TestPass123!'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(duplicateUser);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('User already exists');
  });

  it('should return 400 for duplicate email', async () => {
    const duplicateUser = {
      username: 'differentuser',
      email: 'admin@example.com', // Already exists
      password: 'TestPass123!'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(duplicateUser);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('User already exists');
  });
});

describe('POST /api/auth/login', () => {
  it('should login user successfully', async () => {
    const loginData = {
      email: 'user@example.com',
      password: 'UserPass123!'
    };

    const res = await request(app)
      .post('/api/auth/login')
      .send(loginData);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(loginData.email);
  });

  it('should return 401 for invalid credentials', async () => {
    const invalidLogin = {
      email: 'user@example.com',
      password: 'wrongpassword'
    };

    const res = await request(app)
      .post('/api/auth/login')
      .send(invalidLogin);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('should return 401 for non-existent user', async () => {
    const nonExistentUser = {
      email: 'nonexistent@example.com',
      password: 'TestPass123!'
    };

    const res = await request(app)
      .post('/api/auth/login')
      .send(nonExistentUser);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('should return 401 for inactive user', async () => {
    // Create an inactive user
    const inactiveUser = await User.create({
      username: 'inactive',
      email: 'inactive@example.com',
      password: 'InactivePass123!',
      isActive: false
    });

    const loginData = {
      email: 'inactive@example.com',
      password: 'InactivePass123!'
    };

    const res = await request(app)
      .post('/api/auth/login')
      .send(loginData);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Account is deactivated');
  });
});

describe('GET /api/auth/me', () => {
  it('should return current user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('user@example.com');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('should return 401 without token', async () => {
    const res = await request(app)
      .get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Access token required');
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid or expired token');
  });
});

describe('PUT /api/auth/profile', () => {
  it('should update user profile successfully', async () => {
    const updates = {
      username: 'updateduser',
      email: 'updated@example.com'
    };

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send(updates);

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe(updates.username);
    expect(res.body.user.email).toBe(updates.email);
  });

  it('should return 401 without authentication', async () => {
    const updates = { username: 'test' };

    const res = await request(app)
      .put('/api/auth/profile')
      .send(updates);

    expect(res.status).toBe(401);
  });

  it('should return 400 for duplicate username', async () => {
    const updates = {
      username: 'admin' // Already exists
    };

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send(updates);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Username or email already exists');
  });

  it('should return 400 for invalid email format', async () => {
    const updates = {
      email: 'invalid-email'
    };

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send(updates);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PUT /api/auth/password', () => {
  it('should change password successfully', async () => {
    const passwordData = {
      currentPassword: 'UserPass123!',
      newPassword: 'NewPassword123!'
    };

    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${userToken}`)
      .send(passwordData);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Password changed successfully');
  });

  it('should return 400 for incorrect current password', async () => {
    const passwordData = {
      currentPassword: 'WrongPassword123!',
      newPassword: 'NewPassword123!'
    };

    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${userToken}`)
      .send(passwordData);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Current password is incorrect');
  });

  it('should return 400 for weak new password', async () => {
    const passwordData = {
      currentPassword: 'UserPass123!',
      newPassword: 'weak'
    };

    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${userToken}`)
      .send(passwordData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 without authentication', async () => {
    const passwordData = {
      currentPassword: 'TestPass123!',
      newPassword: 'NewPassword123!'
    };

    const res = await request(app)
      .put('/api/auth/password')
      .send(passwordData);

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/users', () => {
  it('should return all users for admin', async () => {
    const res = await request(app)
      .get('/api/auth/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThan(0);
  });

  it('should return 403 for non-admin user', async () => {
    const res = await request(app)
      .get('/api/auth/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Insufficient permissions');
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app)
      .get('/api/auth/users');

    expect(res.status).toBe(401);
  });

  it('should filter users by search query', async () => {
    const res = await request(app)
      .get('/api/auth/users?search=admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);
    expect(res.body.users[0].username).toContain('admin');
  });

  it('should paginate results', async () => {
    // Create additional users for pagination test
    const users = [];
    for (let i = 0; i < 15; i++) {
      users.push({
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: 'TestPass123!'
      });
    }
    await User.insertMany(users);

    const res = await request(app)
      .get('/api/auth/users?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBe(10);
    expect(res.body.totalPages).toBeGreaterThan(1);
  });
}); 