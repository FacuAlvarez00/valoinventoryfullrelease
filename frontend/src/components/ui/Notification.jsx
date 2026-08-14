import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Notification.module.css';

const Notification = ({
  isVisible,
  message,
  type = 'success',
  duration = 3000,
  onClose
}) => {
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
        return { accent: 'var(--vi-green)', icon: '✓' };
      case 'error':
        return { accent: 'var(--vi-red)', icon: '✕' };
      case 'warning':
        return { accent: '#ffb347', icon: '⚠' };
      case 'info':
        return { accent: '#4fc3f7', icon: 'ℹ' };
      default:
        return { accent: 'var(--vi-red)', icon: '✓' };
    }
  };

  const tone = getTypeStyles();

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
        className={styles.toast}
        style={{ borderLeftColor: tone.accent }}
        onClick={onClose}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Animated icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 20,
            delay: 0.1
          }}
          className={styles.icon}
          style={{ color: tone.accent }}
        >
          {tone.icon}
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className={styles.message}
        >
          {message}
        </motion.div>

        {/* Close button */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={styles.closeBtn}
          aria-label="Close notification"
        >
          ×
        </motion.button>

        {/* Progress bar */}
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{
            duration: duration / 1000,
            ease: "linear"
          }}
          className={styles.progress}
          style={{ background: tone.accent }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default Notification;
