import React from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.copy}>
        © {new Date().getFullYear()} VALO<span className={styles.accent}>INVENTORY</span>
      </span>
    </footer>
  );
}
