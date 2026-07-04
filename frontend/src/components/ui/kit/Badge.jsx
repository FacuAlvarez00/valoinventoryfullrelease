import React from 'react';
import styles from './Badge.module.css';

const TONE_CLASS = {
  owned: styles.owned,
  featured: styles.featured,
  locked: styles.locked,
  neutral: styles.neutral,
};

export default function Badge({ tone = 'neutral', corner = false, className = '', children, ...rest }) {
  const cls = [
    styles.badge,
    TONE_CLASS[tone] || styles.neutral,
    corner ? styles.corner : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={cls} {...rest}>
      {children}
    </span>
  );
}
