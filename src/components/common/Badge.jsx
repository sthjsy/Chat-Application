import React from 'react';

const Badge = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  rounded = false 
}) => {
  const variants = {
    primary: 'bg-primary-color text-white',
    secondary: 'bg-gray-200 text-gray-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  };

  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.md;
  const roundedClass = rounded ? 'rounded-full' : 'rounded';

  return (
    <span className={`inline-block font-medium ${variantClass} ${sizeClass} ${roundedClass}`}>
      {children}
    </span>
  );
};

export default Badge;