// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to login user
Cypress.Commands.add('login', (email = 'test@example.com', password = 'TestPass123!') => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:5000/api/auth/login',
    body: {
      email,
      password
    }
  }).then((response) => {
    if (response.body.token) {
      window.localStorage.setItem('token', response.body.token);
      window.localStorage.setItem('user', JSON.stringify(response.body.user));
    }
  });
});

// Custom command to register user
Cypress.Commands.add('register', (userData = {}) => {
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'TestPass123!'
  };
  
  const user = { ...defaultUser, ...userData };
  
  return cy.request({
    method: 'POST',
    url: 'http://localhost:5000/api/auth/register',
    body: user
  });
});

// Custom command to logout user
Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('user');
});

// Custom command to create a post
Cypress.Commands.add('createPost', (postData = {}) => {
  const defaultPost = {
    title: 'Test Post',
    content: 'This is a test post content for E2E testing.',
    category: '507f1f77bcf86cd799439011', // Default category ID
    status: 'published'
  };
  
  const post = { ...defaultPost, ...postData };
  
  return cy.request({
    method: 'POST',
    url: 'http://localhost:5000/api/posts',
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('token')}`
    },
    body: post
  });
});

// Custom command to wait for API response
Cypress.Commands.add('waitForApi', (method, url, alias) => {
  cy.intercept(method, url).as(alias);
  cy.wait(`@${alias}`);
});

// Custom command to check if element is visible and not disabled
Cypress.Commands.add('shouldBeEnabled', () => {
  return cy.get('@element').should('be.visible').and('not.be.disabled');
});

// Custom command to fill form fields
Cypress.Commands.add('fillForm', (fields) => {
  Object.entries(fields).forEach(([name, value]) => {
    cy.get(`[data-testid="input-${name}"]`).clear().type(value);
  });
});

// Custom command to submit form
Cypress.Commands.add('submitForm', () => {
  cy.get('[data-testid="submit-button"]').click();
});

// Custom command to check for error messages
Cypress.Commands.add('shouldShowError', (message) => {
  cy.get('[data-testid="form-error"]').should('be.visible').and('contain', message);
});

// Custom command to check for success messages
Cypress.Commands.add('shouldShowSuccess', (message) => {
  cy.get('[data-testid="form-success"]').should('be.visible').and('contain', message);
});

// Custom command to navigate to page
Cypress.Commands.add('navigateTo', (path) => {
  cy.visit(path);
});

// Custom command to check if user is logged in
Cypress.Commands.add('shouldBeLoggedIn', () => {
  cy.window().its('localStorage').invoke('getItem', 'token').should('exist');
});

// Custom command to check if user is logged out
Cypress.Commands.add('shouldBeLoggedOut', () => {
  cy.window().its('localStorage').invoke('getItem', 'token').should('not.exist');
});

// Custom command to wait for loading to complete
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-testid="loading"]', { timeout: 10000 }).should('not.exist');
});

// Custom command to check if element has specific class
Cypress.Commands.add('shouldHaveClass', (className) => {
  return cy.get('@element').should('have.class', className);
});

// Custom command to check if element has specific attribute
Cypress.Commands.add('shouldHaveAttribute', (attribute, value) => {
  return cy.get('@element').should('have.attr', attribute, value);
});

// Override visit command to handle authentication
Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
  const token = window.localStorage.getItem('token');
  if (token) {
    options = options || {};
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  return originalFn(url, options);
}); 