import React from 'react';
import styles from './SearchInput.module.css';

export default function SearchInput({ className = '', wrapStyle, ...rest }) {
  return (
    <div className={styles.wrap} style={wrapStyle}>
      <span className={styles.icon} aria-hidden="true">⌕</span>
      <input type="text" className={`${styles.input} ${className}`} {...rest} />
    </div>
  );
}
