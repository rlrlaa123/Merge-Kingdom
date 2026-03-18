import { create } from 'zustand';
import { getRandomEmptyCell, cloneGrid } from '../utils/gridHelpers';
import { createEmptyGrid, findEmptyCells, GRID_SIZE as DEFAULT_GRID_SIZE } from '../utils/gridHelpers';
import { getItem, getTreeItem, MAX_LEVEL, TREES } from '../data/mergeTree';
import { QUESTS } from '../data/quests';

const newItem = (level, tree = 'animal') => ({
  id: Date.now().toString(36) + Math.random().toString(36).substr(2),
  level,
  tree,
});

const FRESH_DURATION = 600;
const SAVE_KEY = 'merge-kingdom-save';
const calcSpawnCost = (totalSpawns) => Math.floor(10 * Math.pow(1.15, totalSpawns));

// --- 퀘스트 진행도 체크 ---
const checkQuestProgress = (stats, discovered) => {
  const progress = {};
  for (const q of QUESTS) {
    switch (q.type) {
      case 'merge':       progress[q.id] = Math.min(stats.totalMerges, q.target); break;
      case 'spawn':       progress[q.id] = Math.min(stats.totalSpawns, q.target); break;
      case 'reach_level': progress[q.id] = stats.maxLevel >= q.target ? q.target : 0; break;
      case 'earn_coins':  progress[q.id] = Math.min(Math.floor(stats.totalCoinsEarned), q.target); break;
      case 'collect':     progress[q.id] = Math.min(discovered.size, q.target); break;
    }
  }
  return progress;
};

const useGameStore = create((set, get) => ({
  // --- 그리드 ---
  grid: createEmptyGrid(),
  gridSize: DEFAULT_GRID_SIZE,

  // --- 경제 ---
  coins: 100,
  totalSpawns: 0,

  // --- 도감 & 트리 ---
  discovered: new Set([1]),
  activeTree: 'animal',
  unlockedTrees: ['animal'],

  // --- 통계 (퀘스트 추적용) ---
  stats: {
    totalMerges: 0,
    totalSpawns: 0,
    maxLevel: 1,
    totalCoinsEarned: 0,
  },

  // --- 퀘스트 ---
  questProgress: {},    // { questId: currentProgress }
  claimedQuests: [],    // 보상 수령 완료 ID 목록

  // --- 타이머 ---
  lastTick: Date.now(),
  lastSaved: Date.now(),

  // --- UI ---
  floatingTexts: [],
  freshItemIds: new Set(),

  _markFresh: (id) => {
    set(state => ({ freshItemIds: new Set([...state.freshItemIds, id]) }));
    setTimeout(() => {
      set(state => {
        const next = new Set(state.freshItemIds);
        next.delete(id);
        return { freshItemIds: next };
      });
    }, FRESH_DURATION);
  },

  _updateQuestProgress: () => {
    const { stats, discovered } = get();
    set({ questProgress: checkQuestProgress(stats, discovered) });
  },

  // --- 액션: 소환 ---
  spawnItem: () => {
    const { grid, coins, totalSpawns, activeTree, gridSize } = get();
    const cost = calcSpawnCost(totalSpawns);
    if (coins < cost) return false;
    const cell = getRandomEmptyCell(grid, gridSize);
    if (!cell) return false;
    const item = newItem(1, activeTree);
    const newGrid = cloneGrid(grid);
    newGrid[cell.r][cell.c] = item;
    set(state => ({
      grid: newGrid,
      coins: coins - cost,
      totalSpawns: totalSpawns + 1,
      stats: { ...state.stats, totalSpawns: state.stats.totalSpawns + 1 },
    }));
    get()._markFresh(item.id);
    get()._updateQuestProgress();
    return true;
  },

  // --- 액션: 머지 ---
  mergeItems: (fromR, fromC, toR, toC) => {
    const { grid, discovered } = get();
    const fromItem = grid[fromR][fromC];
    const toItem = grid[toR][toC];
    if (!fromItem || !toItem) return false;
    if (fromItem.level !== toItem.level) return false;
    if (fromItem.tree !== toItem.tree) return false; // 같은 트리만 머지
    if (fromItem.level >= MAX_LEVEL) return false;
    const tree = fromItem.tree || 'animal';
    const newLevel = fromItem.level + 1;
    const treeItem = getTreeItem(tree, newLevel);
    const bonus = treeItem.mergeBonus;
    const mergedItem = newItem(newLevel, tree);
    const newGrid = cloneGrid(grid);
    newGrid[fromR][fromC] = null;
    newGrid[toR][toC] = mergedItem;
    const newDiscovered = new Set(discovered);
    newDiscovered.add(newLevel);
    set(state => ({
      grid: newGrid,
      coins: state.coins + bonus,
      discovered: newDiscovered,
      stats: {
        ...state.stats,
        totalMerges: state.stats.totalMerges + 1,
        maxLevel: Math.max(state.stats.maxLevel, newLevel),
        totalCoinsEarned: state.stats.totalCoinsEarned + bonus,
      },
    }));
    get().addFloatingText(`+${bonus} 🪙`, toR, toC);
    get()._markFresh(mergedItem.id);
    get()._updateQuestProgress();
    return true;
  },

  // --- 액션: 스왑/이동 ---
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

  // --- 퀘스트 보상 수령 ---
  claimQuest: (questId) => {
    const { questProgress, claimedQuests } = get();
    const quest = QUESTS.find(q => q.id === questId);
    if (!quest) return false;
    if (claimedQuests.includes(questId)) return false;
    if ((questProgress[questId] || 0) < quest.target) return false;
    set(state => ({
      coins: state.coins + quest.reward,
      claimedQuests: [...state.claimedQuests, questId],
    }));
    get().addFloatingText(`+${quest.reward} 🪙`, 2, 2);
    return true;
  },

  // --- 트리 전환 ---
  setActiveTree: (tree) => set({ activeTree: tree }),

  unlockTree: (treeId) => {
    const { unlockedTrees, coins } = get();
    if (unlockedTrees.includes(treeId)) return false;
    const treeDef = TREES.find(t => t.id === treeId);
    if (!treeDef || coins < treeDef.unlockCost) return false;
    set(state => ({
      coins: state.coins - treeDef.unlockCost,
      unlockedTrees: [...state.unlockedTrees, treeId],
      activeTree: treeId,
    }));
    return true;
  },

  // --- 그리드 확장 ---
  expandGrid: () => {
    const { grid, gridSize, coins } = get();
    const newSize = gridSize + 1;
    if (newSize > 7) return false; // 최대 7x7
    const cost = newSize === 6 ? 5000 : 15000;
    if (coins < cost) return false;
    // 기존 그리드를 새 크기로 확장
    const newGrid = Array(newSize).fill(null).map((_, r) =>
      Array(newSize).fill(null).map((_, c) => (r < gridSize && c < gridSize ? grid[r][c] : null))
    );
    set({ grid: newGrid, gridSize: newSize, coins: coins - cost });
    return true;
  },

  getExpandCost: () => {
    const { gridSize } = get();
    if (gridSize >= 7) return null;
    return gridSize + 1 === 6 ? 5000 : 15000;
  },

  // --- 자동 수익 ---
  tick: () => {
    const { grid, lastTick, gridSize } = get();
    const now = Date.now();
    const delta = (now - lastTick) / 1000;
    let income = 0;
    for (let r = 0; r < gridSize; r++)
      for (let c = 0; c < gridSize; c++)
        if (grid[r][c]) {
          const item = grid[r][c];
          const treeItem = getTreeItem(item.tree || 'animal', item.level);
          income += treeItem.coinsPerSec * delta;
        }
    if (income > 0) {
      set(state => ({
        coins: state.coins + income,
        lastTick: now,
        stats: { ...state.stats, totalCoinsEarned: state.stats.totalCoinsEarned + income },
      }));
    } else {
      set({ lastTick: now });
    }
  },

  // --- 저장/로드 ---
  save: () => {
    const { grid, coins, totalSpawns, discovered, stats, claimedQuests, gridSize, activeTree, unlockedTrees } = get();
    const data = {
      grid, coins, totalSpawns,
      discovered: [...discovered],
      stats, claimedQuests, gridSize, activeTree, unlockedTrees,
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
      const state = {
        grid: data.grid,
        coins: data.coins,
        totalSpawns: data.totalSpawns,
        discovered: new Set(data.discovered),
        lastTick: Date.now(),
      };
      // v2 필드 호환
      if (data.stats) state.stats = data.stats;
      if (data.claimedQuests) state.claimedQuests = data.claimedQuests;
      if (data.gridSize) state.gridSize = data.gridSize;
      if (data.activeTree) state.activeTree = data.activeTree;
      if (data.unlockedTrees) state.unlockedTrees = data.unlockedTrees;
      set(state);
      // 퀘스트 진행도 복원
      setTimeout(() => get()._updateQuestProgress(), 0);
      return data;
    } catch { return null; }
  },

  calcOfflineReward: (savedAt) => {
    const { grid, gridSize } = get();
    const elapsed = Math.min((Date.now() - savedAt) / 1000, 8 * 3600);
    let income = 0;
    for (let r = 0; r < (gridSize || 5); r++)
      for (let c = 0; c < (gridSize || 5); c++)
        if (grid[r]?.[c]) {
          const item = grid[r][c];
          income += getTreeItem(item.tree || 'animal', item.level).coinsPerSec * elapsed;
        }
    return { income: Math.floor(income), elapsed };
  },

  addFloatingText: (text, r, c) => {
    const id = Date.now() + Math.random();
    set(state => ({ floatingTexts: [...state.floatingTexts, { id, text, r, c }] }));
    setTimeout(() => {
      set(state => ({ floatingTexts: state.floatingTexts.filter(t => t.id !== id) }));
    }, 1200);
  },

  resetGame: () => {
    localStorage.removeItem(SAVE_KEY);
    set({
      grid: createEmptyGrid(),
      gridSize: DEFAULT_GRID_SIZE,
      coins: 100,
      totalSpawns: 0,
      discovered: new Set([1]),
      activeTree: 'animal',
      unlockedTrees: ['animal'],
      stats: { totalMerges: 0, totalSpawns: 0, maxLevel: 1, totalCoinsEarned: 0 },
      questProgress: {},
      claimedQuests: [],
      lastTick: Date.now(),
      lastSaved: Date.now(),
      floatingTexts: [],
      freshItemIds: new Set(),
    });
  },

  getSpawnCost: () => calcSpawnCost(get().totalSpawns),

  getIncomePerSec: () => {
    const { grid, gridSize } = get();
    let total = 0;
    for (let r = 0; r < (gridSize || 5); r++)
      for (let c = 0; c < (gridSize || 5); c++)
        if (grid[r]?.[c]) {
          const item = grid[r][c];
          total += getTreeItem(item.tree || 'animal', item.level).coinsPerSec;
        }
    return total;
  },
}));

export default useGameStore;
