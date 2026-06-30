import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

const Notification = ({ 
  isVisible, 
  message, 
  type = 'success', 
  duration = 3000, 
  onClose 
}) => {
  const { t } = useLanguage();

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderColor: '#10b981',
          icon: '✓'
        };
      case 'error':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderColor: '#ef4444',
          icon: '✕'
        };
      case 'warning':
        return {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderColor: '#f59e0b',
          icon: '⚠'
        };
      case 'info':
        return {
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          borderColor: '#3b82f6',
          icon: 'ℹ'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #ff4655 0%, #c53030 100%)',
          borderColor: '#ff4655',
          icon: '✓'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.8 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          duration: 0.5
        }}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 10000,
          minWidth: 300,
          maxWidth: 400,
          background: styles.background,
          border: `2px solid ${styles.borderColor}`,
          borderRadius: 16,
          padding: '16px 20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer'
        }}
        onClick={onClose}
        whileHover={{ 
          scale: 1.02,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
        }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Icono animado */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 20,
            delay: 0.1
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 'bold',
            color: '#fff',
            flexShrink: 0
          }}
        >
          {styles.icon}
        </motion.div>

        {/* Mensaje */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          style={{
            flex: 1,
            color: '#fff',
            fontSize: 16,
            fontWeight: '600',
            lineHeight: 1.4
          }}
        >
          {message}
        </motion.div>

        {/* Botón de cerrar */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 14,
            fontWeight: 'bold',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          ×
        </motion.button>

        {/* Barra de progreso */}
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ 
            duration: duration / 1000, 
            ease: "linear" 
          }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '0 0 16px 16px',
            transformOrigin: 'left'
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default Notification;

