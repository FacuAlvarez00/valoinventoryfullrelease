import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import styles from './Modal.module.css';

export function Modal({ open, onClose, maxWidth = 460, children }) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.panel}
            style={{ maxWidth }}
            initial={{ opacity: 0, y: reduced ? 0 : 16, scale: reduced ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduced ? 0 : 16, scale: reduced ? 1 : 0.98 }}
            transition={{ duration: reduced ? 0.01 : 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ModalHeader({ title, subtitle, danger = false }) {
  return (
    <div className={`${styles.header} ${danger ? styles.headerDanger : ''}`}>
      <h3 className={styles.title}>{title}</h3>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </div>
  );
}

export function ModalBody({ children }) {
  return <div className={styles.body}>{children}</div>;
}
