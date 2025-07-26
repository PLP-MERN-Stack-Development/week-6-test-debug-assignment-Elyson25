// server/tests/unit/auth.test.js - Unit tests for authentication utilities

const jwt = require('jsonwebtoken');
const {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
  getCurrentUser,
  hasRole,
  isAdmin,
  isOwner
} = require('../../src/utils/auth');

// Mock User model
const User = require('../../src/models/User');
jest.mock('../../src/models/User');

// Mock logger
const logger = require('../../src/utils/logger');
jest.mock('../../src/utils/logger');

describe('Authentication Utilities', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    username: 'testuser',
    role: 'user'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify the token can be decoded
      const decoded = jwt.verify(token, 'test-secret-key');
      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('should log token generation', () => {
      generateToken(mockUser);
      expect(logger.info).toHaveBeenCalledWith(`Token generated for user: ${mockUser.email}`);
    });

    it('should throw error if JWT signing fails', () => {
      const invalidUser = { ...mockUser, _id: null };
      expect(() => generateToken(invalidUser)).toThrow('Failed to generate token');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = jwt.sign(
        { id: mockUser._id, email: mockUser.email },
        'test-secret-key',
        { expiresIn: '1h' }
      );
      
      const decoded = verifyToken(token);
      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow('Invalid token');
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(
        { id: mockUser._id },
        'test-secret-key',
        { expiresIn: '0s' }
      );
      
      expect(() => verifyToken(expiredToken)).toThrow('Invalid token');
    });

    it('should log token verification', () => {
      const token = jwt.sign(
        { id: mockUser._id, email: mockUser.email },
        'test-secret-key'
      );
      
      verifyToken(token);
      expect(logger.debug).toHaveBeenCalledWith(`Token verified for user: ${mockUser.email}`);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const token = 'valid-token';
      const header = `Bearer ${token}`;
      
      const result = extractTokenFromHeader(header);
      expect(result).toBe(token);
    });

    it('should return null for missing header', () => {
      expect(extractTokenFromHeader(null)).toBeNull();
      expect(extractTokenFromHeader(undefined)).toBeNull();
    });

    it('should return null for non-Bearer header', () => {
      expect(extractTokenFromHeader('Basic dXNlcjpwYXNz')).toBeNull();
    });

    it('should return null for malformed Bearer header', () => {
      expect(extractTokenFromHeader('Bearer')).toBeNull();
      expect(extractTokenFromHeader('Bearer ')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user for valid token', async () => {
      const token = jwt.sign(
        { id: mockUser._id, email: mockUser.email },
        'test-secret-key'
      );
      
      User.findById.mockResolvedValue(mockUser);
      
      const user = await getCurrentUser(token);
      expect(user).toEqual(mockUser);
      expect(User.findById).toHaveBeenCalledWith(mockUser._id);
    });

    it('should return null for invalid token', async () => {
      const user = await getCurrentUser('invalid-token');
      expect(user).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      const token = jwt.sign(
        { id: mockUser._id, email: mockUser.email },
        'test-secret-key'
      );
      
      User.findById.mockResolvedValue(null);
      
      const user = await getCurrentUser(token);
      expect(user).toBeNull();
    });

    it('should return null for inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      const token = jwt.sign(
        { id: mockUser._id, email: mockUser.email },
        'test-secret-key'
      );
      
      User.findById.mockResolvedValue(inactiveUser);
      
      const user = await getCurrentUser(token);
      expect(user).toBeNull();
    });

    it('should handle database errors', async () => {
      const token = jwt.sign(
        { id: mockUser._id, email: mockUser.email },
        'test-secret-key'
      );
      
      User.findById.mockRejectedValue(new Error('Database error'));
      
      const user = await getCurrentUser(token);
      expect(user).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('hasRole', () => {
    it('should return true for matching role', () => {
      expect(hasRole(mockUser, 'user')).toBe(true);
      expect(hasRole(mockUser, ['user', 'admin'])).toBe(true);
    });

    it('should return false for non-matching role', () => {
      expect(hasRole(mockUser, 'admin')).toBe(false);
      expect(hasRole(mockUser, ['admin'])).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasRole(null, 'user')).toBe(false);
    });

    it('should handle array of roles', () => {
      const adminUser = { ...mockUser, role: 'admin' };
      expect(hasRole(adminUser, ['user', 'admin'])).toBe(true);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      const adminUser = { ...mockUser, role: 'admin' };
      expect(isAdmin(adminUser)).toBe(true);
    });

    it('should return false for non-admin user', () => {
      expect(isAdmin(mockUser)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isAdmin(null)).toBe(false);
    });
  });

  describe('isOwner', () => {
    it('should return true when user is owner', () => {
      const resourceUserId = mockUser._id;
      expect(isOwner(mockUser, resourceUserId)).toBe(true);
    });

    it('should return false when user is not owner', () => {
      const resourceUserId = '507f1f77bcf86cd799439012';
      expect(isOwner(mockUser, resourceUserId)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isOwner(null, 'some-id')).toBe(false);
    });

    it('should return false for null resource user id', () => {
      expect(isOwner(mockUser, null)).toBe(false);
    });

    it('should handle string and ObjectId comparison', () => {
      const resourceUserId = mockUser._id.toString();
      expect(isOwner(mockUser, resourceUserId)).toBe(true);
    });
  });
}); 