import React from 'react';
import styles from './FilterTabs.module.css';

export default function FilterTabs({ options, active, onChange, className = '' }) {
  return (
    <div className={`${styles.tabs} ${className}`}>
      {options.map((opt) => {
        const value = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
