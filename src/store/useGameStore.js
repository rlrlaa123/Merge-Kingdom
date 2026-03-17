import { create } from 'zustand';
import { createEmptyGrid, getRandomEmptyCell, cloneGrid } from '../utils/gridHelpers';
import { getItem, MAX_LEVEL } from '../data/mergeTree';

let itemIdCounter = 1;
const newItem = (level) => ({ id: itemIdCounter++, level });

const SAVE_KEY = 'merge-kingdom-save';

const calcSpawnCost = (totalSpawns) => Math.floor(10 * Math.pow(1.15, totalSpawns));

const useGameStore = create((set, get) => ({
  grid: createEmptyGrid(),
  coins: 100,
  totalSpawns: 0,
  discovered: new Set([1]),
  lastTick: Date.now(),
  lastSaved: Date.now(),
  floatingTexts: [],

  spawnItem: () => {
    const { grid, coins, totalSpawns } = get();
    const cost = calcSpawnCost(totalSpawns);
    if (coins < cost) return false;
    const cell = getRandomEmptyCell(grid);
    if (!cell) return false;
    const item = newItem(1);
    const newGrid = cloneGrid(grid);
    newGrid[cell.r][cell.c] = item;
    set({ grid: newGrid, coins: coins - cost, totalSpawns: totalSpawns + 1 });
    return true;
  },

  mergeItems: (fromR, fromC, toR, toC) => {
    const { grid, discovered } = get();
    const fromItem = grid[fromR][fromC];
    const toItem = grid[toR][toC];
    if (!fromItem || !toItem || fromItem.level !== toItem.level) return false;
    if (fromItem.level >= MAX_LEVEL) return false;
    const newLevel = fromItem.level + 1;
    const bonus = getItem(newLevel).mergeBonus;
    const mergedItem = newItem(newLevel);
    const newGrid = cloneGrid(grid);
    newGrid[fromR][fromC] = null;
    newGrid[toR][toC] = mergedItem;
    const newDiscovered = new Set(discovered);
    newDiscovered.add(newLevel);
    set(state => ({
      grid: newGrid,
      coins: state.coins + bonus,
      discovered: newDiscovered,
    }));
    get().addFloatingText(`+${bonus} 🪙`, toR, toC);
    return true;
  },

  swapItems: (fromR, fromC, toR, toC) => {
    const { grid } = get();
    const newGrid = cloneGrid(grid);
    [newGrid[fromR][fromC], newGrid[toR][toC]] = [newGrid[toR][toC], newGrid[fromR][fromC]];
    set({ grid: newGrid });
  },

  moveItem: (fromR, fromC, toR, toC) => {
    const { grid } = get();
    const newGrid = cloneGrid(grid);
    newGrid[toR][toC] = newGrid[fromR][fromC];
    newGrid[fromR][fromC] = null;
    set({ grid: newGrid });
  },

  tick: () => {
    const { grid, lastTick } = get();
    const now = Date.now();
    const delta = (now - lastTick) / 1000;
    let income = 0;
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++)
        if (grid[r][c]) income += getItem(grid[r][c].level).coinsPerSec * delta;
    set(state => ({ coins: state.coins + income, lastTick: now }));
  },

  save: () => {
    const { grid, coins, totalSpawns, discovered } = get();
    const data = {
      grid,
      coins,
      totalSpawns,
      discovered: [...discovered],
      savedAt: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    set({ lastSaved: Date.now() });
  },

  load: () => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      set({
        grid: data.grid,
        coins: data.coins,
        totalSpawns: data.totalSpawns,
        discovered: new Set(data.discovered),
        lastTick: Date.now(),
      });
      return data;
    } catch { return null; }
  },

  calcOfflineReward: (savedAt) => {
    const { grid } = get();
    const elapsed = Math.min((Date.now() - savedAt) / 1000, 8 * 3600);
    let income = 0;
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++)
        if (grid[r][c]) income += getItem(grid[r][c].level).coinsPerSec * elapsed;
    return { income: Math.floor(income), elapsed };
  },

  addFloatingText: (text, r, c) => {
    const id = Date.now() + Math.random();
    set(state => ({ floatingTexts: [...state.floatingTexts, { id, text, r, c }] }));
    setTimeout(() => {
      set(state => ({ floatingTexts: state.floatingTexts.filter(t => t.id !== id) }));
    }, 1200);
  },

  getSpawnCost: () => calcSpawnCost(get().totalSpawns),

  getIncomePerSec: () => {
    const { grid } = get();
    let total = 0;
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++)
        if (grid[r][c]) total += getItem(grid[r][c].level).coinsPerSec;
    return total;
  },
}));

export default useGameStore;
