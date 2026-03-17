export const GRID_SIZE = 5;

export const createEmptyGrid = () =>
  Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));

export const findEmptyCells = (grid) => {
  const empty = [];
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (!grid[r][c]) empty.push({ r, c });
  return empty;
};

export const getRandomEmptyCell = (grid) => {
  const empty = findEmptyCells(grid);
  if (!empty.length) return null;
  return empty[Math.floor(Math.random() * empty.length)];
};

export const cellKey = (r, c) => `${r}-${c}`;
export const parseKey = (key) => key.split('-').map(Number);

export const cloneGrid = (grid) => grid.map(row => [...row]);
