import React from 'react';
import { getPaginationRange } from '../../../utils/pagination';
import styles from './Pagination.module.css';

export default function Pagination({
  page,
  totalPages,
  totalItems,
  from,
  to,
  onPageChange,
  itemLabel = 'items',
  scrollTargetId,
  className = '',
}) {
  if (totalPages <= 1) return null;

  const pages = getPaginationRange(page, totalPages);
  const changePage = (nextPage) => {
    if (nextPage === page || nextPage < 1 || nextPage > totalPages) return;
    onPageChange(nextPage);
    if (scrollTargetId) {
      window.requestAnimationFrame(() => {
        const target = document.getElementById(scrollTargetId);
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        target?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    }
  };

  return (
    <nav className={`${styles.pagination} ${className}`} aria-label={`${itemLabel} pagination`}>
      <p className={styles.summary} aria-live="polite">
        Showing <strong>{from.toLocaleString()}–{to.toLocaleString()}</strong> of{' '}
        <strong>{totalItems.toLocaleString()}</strong> {itemLabel}
      </p>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.directionButton}
          onClick={() => changePage(page - 1)}
          disabled={page === 1}
          aria-label="Go to previous page"
        >
          <span aria-hidden="true">←</span>
          <span className={styles.directionLabel}>Previous</span>
        </button>

        <div className={styles.pages}>
          {pages.map((pageItem) => (
            typeof pageItem === 'number' ? (
              <button
                key={pageItem}
                type="button"
                className={`${styles.pageButton} ${pageItem === page ? styles.pageButtonActive : ''}`}
                onClick={() => changePage(pageItem)}
                aria-label={`Go to page ${pageItem}`}
                aria-current={pageItem === page ? 'page' : undefined}
              >
                {pageItem}
              </button>
            ) : (
              <span key={pageItem} className={styles.ellipsis} aria-hidden="true">…</span>
            )
          ))}
        </div>

        <button
          type="button"
          className={styles.directionButton}
          onClick={() => changePage(page + 1)}
          disabled={page === totalPages}
          aria-label="Go to next page"
        >
          <span className={styles.directionLabel}>Next</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </nav>
  );
}
