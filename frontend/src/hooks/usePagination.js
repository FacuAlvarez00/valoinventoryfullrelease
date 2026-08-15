import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_PAGE_SIZE } from '../config/pagination';
import { clampPage, paginateItems } from '../utils/pagination';

export default function usePagination(items, options = {}) {
  const { pageSize = DEFAULT_PAGE_SIZE, resetKey = '' } = options;
  const [requestedPage, setRequestedPage] = useState(1);
  const pagination = useMemo(
    () => paginateItems(items, requestedPage, pageSize),
    [items, requestedPage, pageSize]
  );

  useEffect(() => {
    setRequestedPage(1);
  }, [resetKey]);

  useEffect(() => {
    setRequestedPage(current => clampPage(current, pagination.totalPages));
  }, [pagination.totalPages]);

  const setPage = useCallback((nextPage) => {
    setRequestedPage(current => {
      const resolved = typeof nextPage === 'function' ? nextPage(current) : nextPage;
      return clampPage(resolved, pagination.totalPages);
    });
  }, [pagination.totalPages]);

  return {
    ...pagination,
    setPage,
    hasPagination: pagination.totalPages > 1,
  };
}
