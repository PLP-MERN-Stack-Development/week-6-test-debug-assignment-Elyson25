import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';

const Form = ({
  onSubmit,
  initialData = {},
  fields = [],
  submitText = 'Submit',
  loading = false,
  error = null,
  success = null
}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateField = (name, value, validation) => {
    if (!validation) return null;
    
    if (validation.required && !value) {
      return `${name} is required`;
    }
    
    if (validation.minLength && value.length < validation.minLength) {
      return `${name} must be at least ${validation.minLength} characters`;
    }
    
    if (validation.maxLength && value.length > validation.maxLength) {
      return `${name} must be no more than ${validation.maxLength} characters`;
    }
    
    if (validation.pattern && !validation.pattern.test(value)) {
      return validation.errorMessage || `${name} format is invalid`;
    }
    
    if (validation.custom) {
      return validation.custom(value);
    }
    
    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    
    fields.forEach(field => {
      const value = formData[field.name];
      const error = validateField(field.name, value, field.validation);
      if (error) {
        newErrors[field.name] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const renderField = (field) => {
    const { name, type = 'text', label, placeholder, options = [], validation } = field;
    const value = formData[name] || '';
    const error = errors[name];
    
    const inputProps = {
      id: name,
      name,
      type,
      value,
      onChange: (e) => handleInputChange(name, e.target.value),
      placeholder,
      className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        error ? 'border-red-500' : 'border-gray-300'
      }`,
      'data-testid': `input-${name}`
    };

    return (
      <div key={name} className="mb-4">
        {label && (
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {validation?.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {type === 'select' ? (
          <select {...inputProps}>
            <option value="">Select {label}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            {...inputProps}
            rows={4}
            className={`${inputProps.className} resize-vertical`}
          />
        ) : (
          <input {...inputProps} />
        )}
        
        {error && (
          <p className="mt-1 text-sm text-red-600" data-testid={`error-${name}`}>
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="form">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md" data-testid="form-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md" data-testid="form-success">
          {success}
        </div>
      )}
      
      {fields.map(renderField)}
      
      <Button
        type="submit"
        disabled={loading}
        data-testid="submit-button"
      >
        {loading ? 'Submitting...' : submitText}
      </Button>
    </form>
  );
};

Form.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  fields: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['text', 'email', 'password', 'number', 'select', 'textarea']),
    label: PropTypes.string,
    placeholder: PropTypes.string,
    validation: PropTypes.shape({
      required: PropTypes.bool,
      minLength: PropTypes.number,
      maxLength: PropTypes.number,
      pattern: PropTypes.instanceOf(RegExp),
      errorMessage: PropTypes.string,
      custom: PropTypes.func
    }),
    options: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    }))
  })).isRequired,
  submitText: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.string,
  success: PropTypes.string
};

export default Form; 