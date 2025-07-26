[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=19962347&assignment_repo_type=AssignmentRepo)
# Testing and Debugging MERN Applications

This assignment focuses on implementing comprehensive testing strategies for a MERN stack application, including unit testing, integration testing, and end-to-end testing, along with debugging techniques.

## Assignment Overview

You will:
1. Set up testing environments for both client and server
2. Write unit tests for React components and server functions
3. Implement integration tests for API endpoints
4. Create end-to-end tests for critical user flows
5. Apply debugging techniques for common MERN stack issues

## Project Structure

```
week-6-test-debug-assignment-Elyson25/
├── client/                 # React front-end
│   ├── src/                # React source code
│   │   ├── components/     # React components (Button, Form)
│   │   ├── hooks/          # Custom hooks (useApi)
│   │   ├── tests/          # Client-side tests
│   │   │   ├── unit/       # Unit tests
│   │   │   └── setup.js    # Test setup
│   │   └── App.jsx         # Main application component
│   └── cypress/            # End-to-end tests
├── server/                 # Express.js back-end
│   ├── src/                # Server source code
│   │   ├── routes/         # API routes (auth, posts)
│   │   └── app.js          # Main server file
│   └── tests/              # Server-side tests
│       ├── unit/           # Unit tests
│       └── integration/    # Integration tests
├── jest.config.js          # Jest configuration
└── package.json            # Project dependencies
```

## Getting Started

### Development Setup

1. Accept the GitHub Classroom assignment invitation
2. Clone your personal repository that was created by GitHub Classroom
3. Install dependencies for both client and server:
   ```bash
   npm run install-all
   ```
4. Set up the test database:
   ```bash
   cd server
   npm run setup-test-db
   ```
5. Run the tests:
   ```bash
   # Run all tests
   npm test
   
   # Run only unit tests
   npm run test:unit
   
   # Run only integration tests
   npm run test:integration
   
   # Run only end-to-end tests
   npm run test:e2e
   ```
6. Start development environment:
   ```bash
   npm run dev
   ```
7. Explore the starter code and existing tests
8. Complete the tasks outlined in the assignment



## Files Included

- `Week6-Assignment.md`: Detailed assignment instructions
- Starter code for a MERN application with basic test setup:
  - Sample React components with test files
  - Express routes with test files
  - Jest and testing library configurations
  - Example tests for reference

## Requirements

- Node.js (v18 or higher)
- MongoDB (local installation or Atlas account)
- npm or yarn
- Basic understanding of testing concepts

## Testing Tools

- Jest: JavaScript testing framework
- React Testing Library: Testing utilities for React
- Supertest: HTTP assertions for API testing
- Cypress: End-to-end testing framework
- MongoDB Memory Server: In-memory MongoDB for testing

## Testing Strategy

This project implements a comprehensive testing strategy following the testing pyramid:

### Unit Tests
- **Server**: Utility functions, middleware, and business logic
- **Client**: React components, custom hooks, and utility functions
- **Coverage**: >70% code coverage target

### Integration Tests
- **Server**: API endpoints, database operations, authentication flows
- **Client**: Component interactions with APIs, form submissions
- **Tools**: Supertest, MongoDB Memory Server

### End-to-End Tests
- **Coverage**: Complete user workflows and critical paths
- **Tools**: Cypress with custom commands
- **Features**: Real browser testing, accessibility testing

### Test Scripts
```bash
npm test              # Run all tests
npm run test:unit     # Run unit tests only
npm run test:integration  # Run integration tests only
npm run test:e2e      # Run end-to-end tests only
npm run test:coverage # Run tests with coverage report
```

For detailed testing documentation, see [TESTING_STRATEGY.md](TESTING_STRATEGY.md).

## Submission

Your work will be automatically submitted when you push to your GitHub Classroom repository. Make sure to:

1. Complete all required tests (unit, integration, and end-to-end)
2. Achieve at least 70% code coverage for unit tests
3. Document your testing strategy in the README.md
4. Include screenshots of your test coverage reports
5. Demonstrate debugging techniques in your code

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Cypress Documentation](https://docs.cypress.io/)
- [MongoDB Testing Best Practices](https://www.mongodb.com/blog/post/mongodb-testing-best-practices) 