import React, { useState } from 'react';
import Button from './components/Button';
import Form from './components/Form';
import useApi from './hooks/useApi';

// Simple API service for testing
const apiService = {
  login: async (credentials) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        if (credentials.email === 'test@example.com' && credentials.password === 'password') {
          resolve({ success: true, user: { username: 'testuser', email: credentials.email } });
        } else {
          resolve({ success: false, error: 'Invalid credentials' });
        }
      }, 1000);
    });
  },
  register: async (userData) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, user: { username: userData.username, email: userData.email } });
      }, 1000);
    });
  }
};

const App = () => {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const loginApi = useApi(apiService.login);
  const registerApi = useApi(apiService.register);

  const handleLogin = async (formData) => {
    const result = await loginApi.execute(formData);
    if (result.success) {
      setUser(result.user);
      setShowLogin(false);
    }
  };

  const handleRegister = async (formData) => {
    const result = await registerApi.execute(formData);
    if (result.success) {
      setUser(result.user);
      setShowRegister(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="container">
      <h1>MERN Test App</h1>
      <p>A simple testing and debugging application</p>

      {!user ? (
        <div>
          <Button onClick={() => setShowLogin(true)} variant="primary">
            Login
          </Button>
          <Button onClick={() => setShowRegister(true)} variant="secondary">
            Register
          </Button>

          {showLogin && (
            <div>
              <h2>Login</h2>
              <Form
                fields={[
                  { name: 'email', label: 'Email', type: 'email', required: true },
                  { name: 'password', label: 'Password', type: 'password', required: true }
                ]}
                onSubmit={handleLogin}
                loading={loginApi.loading}
                error={loginApi.error}
              />
              <Button onClick={() => setShowLogin(false)} variant="secondary">
                Cancel
              </Button>
            </div>
          )}

          {showRegister && (
            <div>
              <h2>Register</h2>
              <Form
                fields={[
                  { name: 'username', label: 'Username', type: 'text', required: true },
                  { name: 'email', label: 'Email', type: 'email', required: true },
                  { name: 'password', label: 'Password', type: 'password', required: true },
                  { name: 'confirmPassword', label: 'Confirm Password', type: 'password', required: true }
                ]}
                validation={{
                  confirmPassword: (value, formData) => 
                    value === formData.password ? null : 'Passwords must match'
                }}
                onSubmit={handleRegister}
                loading={registerApi.loading}
                error={registerApi.error}
              />
              <Button onClick={() => setShowRegister(false)} variant="secondary">
                Cancel
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2>Welcome, {user.username}!</h2>
          <p>You are successfully logged in.</p>
          <Button onClick={handleLogout} variant="danger">
            Logout
          </Button>
        </div>
      )}

      <div>
        <h3>Testing Features</h3>
        <ul>
          <li><strong>Unit Tests:</strong> Button, Form, and useApi hook components</li>
          <li><strong>Integration Tests:</strong> API endpoints and database operations</li>
          <li><strong>E2E Tests:</strong> Complete user workflows with Cypress</li>
          <li><strong>Debugging:</strong> Error boundaries, logging, and monitoring</li>
        </ul>
      </div>
    </div>
  );
};

export default App; 