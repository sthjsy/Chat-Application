import React, { useEffect, useRef } from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
  const modalRef = useRef(null);
  
  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Handle escape key press
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const sizeStyles = {
    small: { width: '400px' },
    medium: { width: '600px' },
    large: { width: '800px' }
  };
  
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modal: {
      backgroundColor: '#fff',
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
      maxWidth: '90%',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      ...sizeStyles[size]
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 20px',
      borderBottom: '1px solid #e6e6e6'
    },
    title: {
      margin: 0,
      fontSize: '18px',
      fontWeight: '600',
      color: '#252424'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '24px',
      color: '#666',
      padding: '0 8px'
    },
    content: {
      padding: '20px',
      overflowY: 'auto'
    }
  };
  
  return (
    <div style={styles.overlay}>
      <div 
        style={styles.modal} 
        ref={modalRef}
      >
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          <button 
            style={styles.closeButton} 
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;