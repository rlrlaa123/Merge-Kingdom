export const GRID_SIZE = 5; // 기본값 (동적으로 store에서 관리)

export const createEmptyGrid = (size = GRID_SIZE) =>
  Array(size).fill(null).map(() => Array(size).fill(null));

export const findEmptyCells = (grid, size) => {
  const rows = size || grid.length;
  const cols = size || (grid[0]?.length || rows);
  const empty = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (!grid[r]?.[c]) empty.push({ r, c });
  return empty;
};

export const getRandomEmptyCell = (grid, size) => {
  const empty = findEmptyCells(grid, size);
  if (!empty.length) return null;
  return empty[Math.floor(Math.random() * empty.length)];
};

export const cellKey = (r, c) => `${r}-${c}`;
export const parseKey = (key) => key.split('-').map(Number);
export const cloneGrid = (grid) => grid.map(row => [...row]);
