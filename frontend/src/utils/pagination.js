export function getTotalPages(totalItems, pageSize) {
  if (!Number.isFinite(totalItems) || totalItems <= 0) return 1;
  if (!Number.isFinite(pageSize) || pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function clampPage(page, totalPages) {
  const normalizedPage = Number.isFinite(page) ? Math.floor(page) : 1;
  const normalizedTotal = Math.max(1, Number.isFinite(totalPages) ? Math.floor(totalPages) : 1);
  return Math.min(Math.max(normalizedPage, 1), normalizedTotal);
}

export function paginateItems(items, page, pageSize) {
  const safeItems = Array.isArray(items) ? items : [];
  const totalPages = getTotalPages(safeItems.length, pageSize);
  const currentPage = clampPage(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, safeItems.length);

  return {
    items: safeItems.slice(startIndex, endIndex),
    page: currentPage,
    totalPages,
    totalItems: safeItems.length,
    from: safeItems.length ? startIndex + 1 : 0,
    to: endIndex,
  };
}

export function getPaginationRange(currentPage, totalPages) {
  const current = clampPage(currentPage, totalPages);
  const total = Math.max(1, totalPages);

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis-end', total];
  if (current >= total - 3) return [1, 'ellipsis-start', total - 4, total - 3, total - 2, total - 1, total];

  return [1, 'ellipsis-start', current - 1, current, current + 1, 'ellipsis-end', total];
}
