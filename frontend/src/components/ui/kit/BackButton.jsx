import React from 'react';
import styles from './BackButton.module.css';

export default function BackButton({ children = 'Back', className = '', ...rest }) {
  return (
    <button type="button" className={`${styles.back} ${className}`} {...rest}>
      <span aria-hidden="true">←</span>
      {children}
    </button>
  );
}
