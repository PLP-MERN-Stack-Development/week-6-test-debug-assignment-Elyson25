// server/tests/unit/validation.test.js - Unit tests for validation utilities

const {
  isValidEmail,
  validatePassword,
  validateUsername,
  isValidObjectId,
  sanitizeString,
  validatePagination,
  validateSearchQuery,
  validateDateRange,
  validateFileUpload
} = require('../../src/utils/validation');

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 6 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character (!@#$%^&*)');
    });

    it('should handle empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should handle null password', () => {
      const result = validatePassword(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });
  });

  describe('validateUsername', () => {
    it('should validate correct usernames', () => {
      const result = validateUsername('validuser123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject usernames that are too short', () => {
      const result = validateUsername('ab');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Username must be at least 3 characters long');
    });

    it('should reject usernames that are too long', () => {
      const result = validateUsername('a'.repeat(31));
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Username must be no more than 30 characters long');
    });

    it('should reject usernames with invalid characters', () => {
      const result = validateUsername('user-name');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Username can only contain letters, numbers, and underscores');
    });

    it('should handle empty username', () => {
      const result = validateUsername('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Username is required');
    });
  });

  describe('isValidObjectId', () => {
    it('should validate correct ObjectIds', () => {
      expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
      expect(isValidObjectId('507f1f77bcf86cd799439012')).toBe(true);
    });

    it('should reject invalid ObjectIds', () => {
      expect(isValidObjectId('invalid-id')).toBe(false);
      expect(isValidObjectId('507f1f77bcf86cd79943901')).toBe(false); // too short
      expect(isValidObjectId('507f1f77bcf86cd7994390111')).toBe(false); // too long
      expect(isValidObjectId('')).toBe(false);
      expect(isValidObjectId(null)).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize HTML tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('should escape special characters', () => {
      expect(sanitizeString('test & "quote" \'apos\' /slash/')).toBe('test &amp; &quot;quote&quot; &#x27;apos&#x27; &#x2F;slash&#x2F;');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  test  ')).toBe('test');
    });

    it('should handle non-string inputs', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString(123)).toBe('');
    });
  });

  describe('validatePagination', () => {
    it('should return default values for empty params', () => {
      const result = validatePagination({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.skip).toBe(0);
    });

    it('should validate and convert string values', () => {
      const result = validatePagination({ page: '2', limit: '20' });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.skip).toBe(20);
    });

    it('should enforce minimum values', () => {
      const result = validatePagination({ page: '0', limit: '-5' });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(1);
    });

    it('should enforce maximum limit', () => {
      const result = validatePagination({ limit: '200' });
      expect(result.limit).toBe(100);
    });
  });

  describe('validateSearchQuery', () => {
    it('should return empty string for invalid inputs', () => {
      expect(validateSearchQuery(null)).toBe('');
      expect(validateSearchQuery(undefined)).toBe('');
      expect(validateSearchQuery(123)).toBe('');
    });

    it('should sanitize search query', () => {
      expect(validateSearchQuery('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('should limit search length', () => {
      const longQuery = 'a'.repeat(150);
      expect(validateSearchQuery(longQuery).length).toBeLessThanOrEqual(100);
    });
  });

  describe('validateDateRange', () => {
    it('should validate correct date range', () => {
      const result = validateDateRange('2023-01-01', '2023-12-31');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid date formats', () => {
      const result = validateDateRange('invalid-date', '2023-12-31');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid start date format');
    });

    it('should reject reversed date range', () => {
      const result = validateDateRange('2023-12-31', '2023-01-01');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Start date must be before end date');
    });

    it('should handle empty dates', () => {
      const result = validateDateRange('', '');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateFileUpload', () => {
    const mockFile = {
      size: 1024 * 1024, // 1MB
      mimetype: 'image/jpeg'
    };

    it('should validate correct file', () => {
      const result = validateFileUpload(mockFile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject file that is too large', () => {
      const largeFile = { ...mockFile, size: 10 * 1024 * 1024 }; // 10MB
      const result = validateFileUpload(largeFile, { maxSize: 5 * 1024 * 1024 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File size must be less than 5MB');
    });

    it('should reject unsupported file type', () => {
      const invalidFile = { ...mockFile, mimetype: 'application/pdf' };
      const result = validateFileUpload(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File type must be one of: image/jpeg, image/png, image/gif');
    });

    it('should handle missing file', () => {
      const result = validateFileUpload(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File is required');
    });
  });
}); 