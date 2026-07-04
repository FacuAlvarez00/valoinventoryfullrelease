import React from 'react';
import AppHeader from './AppHeader';
import styles from '../../App.module.css';
import pageStyles from './PageWrapper.module.css';

export default function PageWrapper({ children }) {
  return (
    <div className={styles.shell}>
      <AppHeader />
      <main className={pageStyles.main}>
        {children}
      </main>
    </div>
  );
}
