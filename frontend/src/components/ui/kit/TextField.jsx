import React from 'react';
import styles from './TextField.module.css';

export default function TextField({ label, id, name, className = '', inputClassName = '', ...rest }) {
  const inputId = id || name;
  return (
    <div className={`${styles.field} ${className}`}>
      {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
      <input id={inputId} name={name} className={`${styles.input} ${inputClassName}`} {...rest} />
    </div>
  );
}
