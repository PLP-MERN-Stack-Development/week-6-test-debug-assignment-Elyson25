import React from 'react';
import PropTypes from 'prop-types';

const Button = ({
  children,
  variant = 'primary',
  disabled = false,
  onClick,
  ...props
}) => {
  const getButtonClass = () => {
    const baseClass = 'button';
    const variantClass = `button-${variant}`;
    const disabledClass = disabled ? 'disabled' : '';
    return `${baseClass} ${variantClass} ${disabledClass}`.trim();
  };
  
  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };
  
  return (
    <button
      className={getButtonClass()}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'warning']),
  disabled: PropTypes.bool,
  onClick: PropTypes.func
};

export default Button; 