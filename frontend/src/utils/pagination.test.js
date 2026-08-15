const { clampPage, getPaginationRange, getTotalPages, paginateItems } = require('./pagination');

test('calculates and clamps pages safely', () => {
  expect(getTotalPages(0, 24)).toBe(1);
  expect(getTotalPages(49, 24)).toBe(3);
  expect(clampPage(-4, 3)).toBe(1);
  expect(clampPage(9, 3)).toBe(3);
});

test('returns a stable item window and range metadata', () => {
  const result = paginateItems(Array.from({ length: 55 }, (_, index) => index + 1), 2, 24);

  expect(result.items).toHaveLength(24);
  expect(result.items[0]).toBe(25);
  expect(result.items[23]).toBe(48);
  expect(result.from).toBe(25);
  expect(result.to).toBe(48);
  expect(result.totalPages).toBe(3);
});

test('keeps page navigation compact for long collections', () => {
  expect(getPaginationRange(1, 12)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 12]);
  expect(getPaginationRange(6, 12)).toEqual([1, 'ellipsis-start', 5, 6, 7, 'ellipsis-end', 12]);
  expect(getPaginationRange(12, 12)).toEqual([1, 'ellipsis-start', 8, 9, 10, 11, 12]);
});
