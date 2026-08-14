import React from 'react';
import styles from './SectionHeader.module.css';

export default function SectionHeader({ eyebrow, muted = false, children, className = '', as: Comp = 'h2', ...rest }) {
  return (
    <div className={className}>
      {eyebrow && (
        <div className={`${styles.eyebrow} ${muted ? styles.eyebrowMuted : ''}`}>{eyebrow}</div>
      )}
      <Comp className={styles.heading} {...rest}>{children}</Comp>
    </div>
  );
}
