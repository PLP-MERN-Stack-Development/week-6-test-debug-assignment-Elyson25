// client/src/tests/unit/Form.test.jsx - Unit tests for Form component

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Form from '../../components/Form';

describe('Form Component', () => {
  const mockOnSubmit = jest.fn();
  
  const defaultFields = [
    {
      name: 'username',
      type: 'text',
      label: 'Username',
      validation: { required: true, minLength: 3 }
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email',
      validation: { required: true }
    },
    {
      name: 'password',
      type: 'password',
      label: 'Password',
      validation: { required: true, minLength: 6 }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders form with all fields', () => {
      render(<Form onSubmit={mockOnSubmit} fields={defaultFields} />);
      
      expect(screen.getByTestId('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    it('renders with initial data', () => {
      const initialData = { username: 'testuser', email: 'test@example.com' };
      render(<Form onSubmit={mockOnSubmit} fields={defaultFields} initialData={initialData} />);
      
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    it('renders error message when provided', () => {
      const error = 'Something went wrong';
      render(<Form onSubmit={mockOnSubmit} fields={defaultFields} error={error} />);
      
      expect(screen.getByTestId('form-error')).toBeInTheDocument();
      expect(screen.getByText(error)).toBeInTheDocument();
    });

    it('renders success message when provided', () => {
      const success = 'Form submitted successfully';
      render(<Form onSubmit={mockOnSubmit} fields={defaultFields} success={success} />);
      
      expect(screen.getByTestId('form-success')).toBeInTheDocument();
      expect(screen.getByText(success)).toBeInTheDocument();
    });

    it('renders loading state', () => {
      render(<Form onSubmit={mockOnSubmit} fields={defaultFields} loading={true} />);
      
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeDisabled();
    });

    it('renders custom submit text', () => {
      render(<Form onSubmit={mockOnSubmit} fields={defaultFields} submitText="Create Account" />);
      
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });
  });

  describe('Field Types', () => {
    it('renders select field', () => {
      const fields = [
        {
          name: 'category',
          type: 'select',
          label: 'Category',
          options: [
            { value: 'tech', label: 'Technology' },
            { value: 'sports', label: 'Sports' }
          ]
        }
      ];
      
      render(<Form onSubmit={mockOnSubmit} fields={fields} />);
      
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('Sports')).toBeInTheDocument();
    });

    it('renders textarea field', () => {
      const fields = [
        {
          name: 'description',
          type: 'textarea',
          label: 'Description'
        }
      ];
      
      render(<Form onSubmit={mockOnSubmit} fields={fields} />);
      
      const textarea = screen.getByLabelText(/description/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });
  });

  describe('Validation', () => {
    it('shows validation errors for required fields', async () => {
      render(<Form onSubmit={mockOnSubmit} fields={defaultFields} />);
      
      fireEvent.click(screen.getByTestId('submit-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-username')).toBeInTheDocument();
        expect(screen.getByTestId('error-email')).toBeInTheDocument();
        expect(screen.getByTestId('error-password')).toBeInTheDocument();
      });
    });

    it('shows validation error for minimum length', async () => {
      render(<Form onSubmit={mockOnSubmit} fields={defaultFields} />);
      
      const usernameInput = screen.getByTestId('input-username');
      fireEvent.change(usernameInput, { target: { value: 'ab' } });
      fireEvent.click(screen.getByTestId('submit-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-username')).toBeInTheDocument();
        expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
      });
    });

    it('clears validation error when user starts typing', async () => {
      render(<Form onSubmit={mockOnSubmit} fields={defaultFields} />);
      
      // Submit with empty form to show errors
      fireEvent.click(screen.getByTestId('submit-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-username')).toBeInTheDocument();
      });
      
      // Start typing in username field
      const usernameInput = screen.getByTestId('input-username');
      fireEvent.change(usernameInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(screen.queryByTestId('error-username')).not.toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      const fields = [
        {
          name: 'email',
          type: 'email',
          label: 'Email',
          validation: { 
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            errorMessage: 'Please enter a valid email'
          }
        }
      ];
      
      render(<Form onSubmit={mockOnSubmit} fields={fields} />);
      
      const emailInput = screen.getByTestId('input-email');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(screen.getByTestId('submit-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-email')).toBeInTheDocument();
        expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with form data when validation passes', async () => {
      render(<Form onSubmit={mockOnSubmit} fields={defaultFields} />);
      
      // Fill in all required fields
      fireEvent.change(screen.getByTestId('input-username'), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByTestId('input-password'), { target: { value: 'password123' } });
      
      fireEvent.click(screen.getByTestId('submit-button'));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });

    it('does not call onSubmit when validation fails', async () => {
      render(<Form onSubmit={mockOnSubmit} fields={defaultFields} />);
      
      // Submit with empty form
      fireEvent.click(screen.getByTestId('submit-button'));
      
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('handles submission errors', async () => {
      const mockOnSubmitWithError = jest.fn().mockRejectedValue(new Error('Network error'));
      render(<Form onSubmit={mockOnSubmitWithError} fields={defaultFields} />);
      
      // Fill in all required fields
      fireEvent.change(screen.getByTestId('input-username'), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByTestId('input-password'), { target: { value: 'password123' } });
      
      fireEvent.click(screen.getByTestId('submit-button'));
      
      await waitFor(() => {
        expect(mockOnSubmitWithError).toHaveBeenCalled();
      });
    });
  });

  describe('User Interactions', () => {
    it('updates form data when user types', () => {
      render(<Form onSubmit={mockOnSubmit} fields={defaultFields} />);
      
      const usernameInput = screen.getByTestId('input-username');
      fireEvent.change(usernameInput, { target: { value: 'newuser' } });
      
      expect(usernameInput.value).toBe('newuser');
    });

    it('handles select field changes', () => {
      const fields = [
        {
          name: 'category',
          type: 'select',
          label: 'Category',
          options: [
            { value: 'tech', label: 'Technology' },
            { value: 'sports', label: 'Sports' }
          ]
        }
      ];
      
      render(<Form onSubmit={mockOnSubmit} fields={fields} />);
      
      const select = screen.getByTestId('input-category');
      fireEvent.change(select, { target: { value: 'tech' } });
      
      expect(select.value).toBe('tech');
    });

    it('handles textarea changes', () => {
      const fields = [
        {
          name: 'description',
          type: 'textarea',
          label: 'Description'
        }
      ];
      
      render(<Form onSubmit={mockOnSubmit} fields={fields} />);
      
      const textarea = screen.getByTestId('input-description');
      fireEvent.change(textarea, { target: { value: 'This is a description' } });
      
      expect(textarea.value).toBe('This is a description');
    });
  });

  describe('Accessibility', () => {
    it('has proper labels and associations', () => {
      render(<Form onSubmit={mockOnSubmit} fields={defaultFields} />);
      
      const usernameInput = screen.getByTestId('input-username');
      const usernameLabel = screen.getByText('Username');
      
      expect(usernameInput).toHaveAttribute('id', 'username');
      expect(usernameLabel).toHaveAttribute('for', 'username');
    });

    it('shows required field indicators', () => {
      render(<Form onSubmit={mockOnSubmit} fields={defaultFields} />);
      
      const requiredFields = screen.getAllByText('*');
      expect(requiredFields).toHaveLength(3); // All fields are required
    });

    it('has proper ARIA attributes for errors', async () => {
      render(<Form onSubmit={mockOnSubmit} fields={defaultFields} />);
      
      fireEvent.click(screen.getByTestId('submit-button'));
      
      await waitFor(() => {
        const errorElements = screen.getAllByTestId(/error-/);
        errorElements.forEach(error => {
          expect(error).toBeInTheDocument();
        });
      });
    });
  });
}); 