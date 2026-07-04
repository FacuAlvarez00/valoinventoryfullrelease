import React from 'react';
import styles from './TacticalButton.module.css';

const VARIANT_CLASS = {
  primary: styles.btnPrimary,
  ghost: styles.btnGhost,
  danger: styles.btnDanger,
};

const SIZE_CLASS = {
  sm: styles.btnSm,
  lg: styles.btnLg,
};

export default function TacticalButton({
  as: Comp = 'button',
  variant = 'primary',
  size,
  fullWidth = false,
  className = '',
  children,
  type,
  ...rest
}) {
  const cls = [
    styles.btn,
    VARIANT_CLASS[variant] || VARIANT_CLASS.primary,
    SIZE_CLASS[size] || '',
    fullWidth ? styles.btnFull : '',
    className,
  ].filter(Boolean).join(' ');

  const typeProp = Comp === 'button' ? { type: type || 'button' } : {};

  return (
    <Comp className={cls} {...typeProp} {...rest}>
      <span className={styles.btnTickL} aria-hidden="true" />
      <span className={styles.btnTickR} aria-hidden="true" />
      <span className={styles.btnLabel}>{children}</span>
    </Comp>
  );
}
