// client/cypress/e2e/auth.cy.js - E2E tests for authentication

describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.logout();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', () => {
      cy.visit('/register');
      
      // Fill registration form
      cy.fillForm({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'NewPass123!',
        confirmPassword: 'NewPass123!'
      });
      
      cy.submitForm();
      
      // Should redirect to login or dashboard
      cy.url().should('include', '/login').or('include', '/dashboard');
      cy.shouldShowSuccess('User registered successfully');
    });

    it('should show validation errors for invalid data', () => {
      cy.visit('/register');
      
      // Submit empty form
      cy.submitForm();
      
      // Should show validation errors
      cy.get('[data-testid="error-username"]').should('be.visible');
      cy.get('[data-testid="error-email"]').should('be.visible');
      cy.get('[data-testid="error-password"]').should('be.visible');
    });

    it('should show error for duplicate email', () => {
      // First, register a user
      cy.register({
        username: 'testuser1',
        email: 'duplicate@example.com',
        password: 'TestPass123!'
      });
      
      cy.visit('/register');
      
      // Try to register with same email
      cy.fillForm({
        username: 'testuser2',
        email: 'duplicate@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!'
      });
      
      cy.submitForm();
      
      cy.shouldShowError('User already exists');
    });

    it('should show error for weak password', () => {
      cy.visit('/register');
      
      cy.fillForm({
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
        confirmPassword: 'weak'
      });
      
      cy.submitForm();
      
      cy.get('[data-testid="error-password"]').should('be.visible');
      cy.get('[data-testid="error-password"]').should('contain', 'at least 6 characters');
    });
  });

  describe('User Login', () => {
    beforeEach(() => {
      // Create a test user
      cy.register({
        username: 'logintest',
        email: 'login@example.com',
        password: 'LoginPass123!'
      });
    });

    it('should login user successfully', () => {
      cy.visit('/login');
      
      cy.fillForm({
        email: 'login@example.com',
        password: 'LoginPass123!'
      });
      
      cy.submitForm();
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.shouldBeLoggedIn();
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/login');
      
      cy.fillForm({
        email: 'login@example.com',
        password: 'wrongpassword'
      });
      
      cy.submitForm();
      
      cy.shouldShowError('Invalid credentials');
    });

    it('should show error for non-existent user', () => {
      cy.visit('/login');
      
      cy.fillForm({
        email: 'nonexistent@example.com',
        password: 'TestPass123!'
      });
      
      cy.submitForm();
      
      cy.shouldShowError('Invalid credentials');
    });

    it('should remember user session', () => {
      cy.visit('/login');
      
      cy.fillForm({
        email: 'login@example.com',
        password: 'LoginPass123!'
      });
      
      cy.submitForm();
      
      // Refresh page
      cy.reload();
      
      // Should still be logged in
      cy.shouldBeLoggedIn();
      cy.url().should('include', '/dashboard');
    });
  });

  describe('User Logout', () => {
    beforeEach(() => {
      cy.register({
        username: 'logouttest',
        email: 'logout@example.com',
        password: 'LogoutPass123!'
      });
      
      cy.login('logout@example.com', 'LogoutPass123!');
    });

    it('should logout user successfully', () => {
      cy.visit('/dashboard');
      
      // Click logout button
      cy.get('[data-testid="logout-button"]').click();
      
      // Should redirect to home page
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      cy.shouldBeLoggedOut();
    });

    it('should clear user session on logout', () => {
      cy.visit('/dashboard');
      
      cy.get('[data-testid="logout-button"]').click();
      
      // Try to access protected route
      cy.visit('/dashboard');
      
      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });

  describe('Password Reset', () => {
    beforeEach(() => {
      cy.register({
        username: 'resetuser',
        email: 'reset@example.com',
        password: 'ResetPass123!'
      });
    });

    it('should send password reset email', () => {
      cy.visit('/forgot-password');
      
      cy.fillForm({
        email: 'reset@example.com'
      });
      
      cy.submitForm();
      
      cy.shouldShowSuccess('Password reset email sent');
    });

    it('should show error for non-existent email', () => {
      cy.visit('/forgot-password');
      
      cy.fillForm({
        email: 'nonexistent@example.com'
      });
      
      cy.submitForm();
      
      cy.shouldShowError('Email not found');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route without auth', () => {
      cy.visit('/dashboard');
      
      cy.url().should('include', '/login');
    });

    it('should allow access to protected route when authenticated', () => {
      cy.register({
        username: 'protecteduser',
        email: 'protected@example.com',
        password: 'ProtectedPass123!'
      });
      
      cy.login('protected@example.com', 'ProtectedPass123!');
      
      cy.visit('/dashboard');
      
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="dashboard"]').should('be.visible');
    });
  });

  describe('Form Validation', () => {
    it('should validate email format', () => {
      cy.visit('/register');
      
      cy.fillForm({
        username: 'testuser',
        email: 'invalid-email',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!'
      });
      
      cy.submitForm();
      
      cy.get('[data-testid="error-email"]').should('be.visible');
      cy.get('[data-testid="error-email"]').should('contain', 'valid email');
    });

    it('should validate password confirmation', () => {
      cy.visit('/register');
      
      cy.fillForm({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
        confirmPassword: 'DifferentPass123!'
      });
      
      cy.submitForm();
      
      cy.get('[data-testid="error-confirmPassword"]').should('be.visible');
      cy.get('[data-testid="error-confirmPassword"]').should('contain', 'passwords do not match');
    });

    it('should validate username length', () => {
      cy.visit('/register');
      
      cy.fillForm({
        username: 'ab', // Too short
        email: 'test@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!'
      });
      
      cy.submitForm();
      
      cy.get('[data-testid="error-username"]').should('be.visible');
      cy.get('[data-testid="error-username"]').should('contain', 'at least 3 characters');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Intercept API calls and force network error
      cy.intercept('POST', '/api/auth/login', { forceNetworkError: true }).as('loginRequest');
      
      cy.visit('/login');
      
      cy.fillForm({
        email: 'test@example.com',
        password: 'TestPass123!'
      });
      
      cy.submitForm();
      
      cy.shouldShowError('Network error');
    });

    it('should handle server errors gracefully', () => {
      // Intercept API calls and return server error
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('loginRequest');
      
      cy.visit('/login');
      
      cy.fillForm({
        email: 'test@example.com',
        password: 'TestPass123!'
      });
      
      cy.submitForm();
      
      cy.shouldShowError('Internal server error');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="input-email"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="input-password"]').should('have.attr', 'aria-label');
    });

    it('should be navigable with keyboard', () => {
      cy.visit('/login');
      
      // Tab through form elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'input-email');
      
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'input-password');
      
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'submit-button');
    });

    it('should have proper focus management', () => {
      cy.visit('/login');
      
      // Submit form with errors
      cy.submitForm();
      
      // Focus should be on first error
      cy.get('[data-testid="error-email"]').should('be.visible');
    });
  });
}); 