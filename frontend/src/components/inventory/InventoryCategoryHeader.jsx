import React from 'react';
import styles from './InventoryList.module.css';

export default function InventoryCategoryHeader({
  title,
  description,
  count = 0,
  countLabel = 'items',
  visibleCount,
  metric,
  actions,
}) {
  const hasFilteredCount = Number.isFinite(visibleCount) && visibleCount !== count;

  return (
    <header className={styles.categoryHeader}>
      <div className={styles.categoryHeaderMain}>
        <div className={styles.categoryHeading}>
          <span className={styles.categoryEyebrow}>Inventory</span>
          <h1 className={styles.categoryTitle}>{title}</h1>
          {description && <p className={styles.categoryDescription}>{description}</p>}
        </div>

        <div className={styles.categoryHeaderAside}>
          {metric}
          <div className={styles.categoryCount} aria-label={`${count.toLocaleString()} ${countLabel}`}>
            <span className={styles.categoryCountLabel}>Owned</span>
            <strong className={styles.categoryCountValue}>{count.toLocaleString()}</strong>
            <span className={styles.categoryCountUnit}>{countLabel}</span>
            {hasFilteredCount && (
              <span className={styles.categoryCountFiltered}>{visibleCount.toLocaleString()} shown</span>
            )}
          </div>
        </div>
      </div>

      {actions && <div className={styles.categoryActions}>{actions}</div>}
    </header>
  );
}
