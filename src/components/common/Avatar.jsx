import React from 'react';

const Avatar = ({ src, name, size = 'md', status, className = '' }) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const sizeClass = sizes[size] || sizes.md;
  
  // Generate initials from name
  const getInitials = () => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };
  
  // Generate a consistent color based on the name
  const getColorClass = () => {
    if (!name) return 'bg-gray-400';
    
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  return (
    <div className={`relative ${className}`}>
      {src ? (
        <img 
          src={src} 
          alt={name || 'Avatar'} 
          className={`${sizeClass} rounded-full object-cover`}
        />
      ) : (
        <div className={`${sizeClass} ${getColorClass()} rounded-full flex items-center justify-center text-white font-medium`}>
          {getInitials()}
        </div>
      )}
      
      {status && (
        <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${
          status === 'online' ? 'bg-green-500' :
          status === 'busy' ? 'bg-red-500' :
          status === 'away' ? 'bg-yellow-500' :
          'bg-gray-500'
        }`}></span>
      )}
    </div>
  );
};

export default Avatar;