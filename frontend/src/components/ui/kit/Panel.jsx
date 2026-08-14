import React from 'react';
import styles from './Panel.module.css';

const STATE_CLASS = {
  owned: styles.owned,
  featured: styles.featured,
  locked: styles.locked,
};

export default function Panel({
  as: Comp = 'div',
  glass = false,
  padded = true,
  interactive = false,
  state,
  className = '',
  children,
  ...rest
}) {
  const cls = [
    styles.panel,
    glass ? styles.glass : '',
    padded ? styles.padded : '',
    interactive ? styles.interactive : '',
    STATE_CLASS[state] || '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Comp className={cls} {...rest}>
      {children}
    </Comp>
  );
}
