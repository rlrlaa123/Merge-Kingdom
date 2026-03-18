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

// Phase 5: 구간별 소환 비용 (초반 완만, 후반 가파름)
const calcSpawnCost = (n) => {
  if (n < 20) return Math.floor(10 * Math.pow(1.08, n));
  if (n < 50) return Math.floor(10 * Math.pow(1.08, 20) * Math.pow(1.12, n - 20));
  return Math.floor(10 * Math.pow(1.08, 20) * Math.pow(1.12, 30) * Math.pow(1.18, n - 50));
};

// Phase 5: 콤보 배율
const getComboMultiplier = (combo) => {
  if (combo >= 4) return 2.5;
  if (combo >= 3) return 2.0;
  if (combo >= 2) return 1.5;
  return 1;
};

const getComboLabel = (combo) => {
  if (combo >= 4) return 'FEVER!';
  if (combo >= 2) return `콤보 ×${combo}!`;
  return '';
};

// --- 퀘스트 진행도 체크 ---
const checkQuestProgress = (stats, discovered) => {
  const progress = {};
  for (const q of QUESTS) {
    switch (q.type) {
      case 'merge':       progress[q.id] = Math.min(stats.totalMerges, q.target); break;
      case 'spawn':       progress[q.id] = Math.min(stats.totalSpawns, q.target); break;
      case 'reach_level': progress[q.id] = stats.maxLevel >= q.target ? q.target : 0; break;
      case 'earn_coins':  progress[q.id] = Math.min(Math.floor(stats.totalCoinsEarned), q.target); break;
      case 'collect': {
        const uniqueLevels = new Set([...discovered].map(k => {
          const parts = k.toString().split('-');
          return parts.length === 2 ? parseInt(parts[1]) : parseInt(k);
        }));
        progress[q.id] = Math.min(uniqueLevels.size, q.target);
        break;
      }
    }
  }
  return progress;
};

// 수확 쿨다운 (레벨별 차등: Lv1=10초, Lv7=5초)
const getHarvestCooldown = (level) => Math.max(5, 11 - level) * 1000;
const HARVEST_EXPIRE = 30_000; // 30초 미수확 시 소멸

const useGameStore = create((set, get) => ({
  // --- 그리드 ---
  grid: createEmptyGrid(),
  gridSize: DEFAULT_GRID_SIZE,

  // --- 경제 ---
  coins: 100,
  totalSpawns: 0,

  // --- 도감 & 트리 ---
  discovered: new Set(['animal-1']),
  activeTree: 'animal',
  unlockedTrees: ['animal'],

  // --- 통계 ---
  stats: { totalMerges: 0, totalSpawns: 0, maxLevel: 1, totalCoinsEarned: 0 },

  // --- 퀘스트 ---
  questProgress: {},
  claimedQuests: [],

  // --- Phase 5: 무료 소환 ---
  freeSpawnCharges: 3,
  maxFreeSpawnCharges: 3,
  freeSpawnCooldown: 30, // 초
  lastFreeSpawnTick: Date.now(),

  // --- Phase 5: 콤보 ---
  comboCount: 0,
  lastMergeTime: 0,

  // --- Phase 5: 수확 ---
  harvestTimers: {}, // { itemId: { readyAt, expiresAt } }

  // --- Phase 5: 부스트 ---
  boostActive: false,
  boostEndTime: null,
  boostCooldownEnd: null,

  // --- 타이머 ---
  lastTick: Date.now(),
  lastSaved: Date.now(),

  // --- UI ---
  floatingTexts: [],
  freshItemIds: new Set(),

  // === 내부 헬퍼 ===
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

  getBoostMultiplier: () => get().boostActive ? 2 : 1,

  // === 소환 (코인) ===
  spawnItem: () => {
    const { grid, coins, totalSpawns, activeTree, gridSize } = get();
    const cost = calcSpawnCost(totalSpawns);
    if (coins < cost) return false;
    const cell = getRandomEmptyCell(grid, gridSize);
    if (!cell) return false;
    const item = newItem(1, activeTree);
    const newGrid = cloneGrid(grid);
    newGrid[cell.r][cell.c] = item;
    const newDiscovered = new Set(get().discovered);
    newDiscovered.add(`${activeTree}-1`);
    set(state => ({
      grid: newGrid,
      coins: coins - cost,
      totalSpawns: totalSpawns + 1,
      discovered: newDiscovered,
      stats: { ...state.stats, totalSpawns: state.stats.totalSpawns + 1 },
    }));
    get()._startHarvestTimer(item.id, 1);
    get()._markFresh(item.id);
    get()._updateQuestProgress();
    return true;
  },

  // === Phase 5: 무료 소환 ===
  freeSpawn: () => {
    const { grid, freeSpawnCharges, activeTree, gridSize } = get();
    if (freeSpawnCharges <= 0) return false;
    const cell = getRandomEmptyCell(grid, gridSize);
    if (!cell) return false;
    const item = newItem(1, activeTree);
    const newGrid = cloneGrid(grid);
    newGrid[cell.r][cell.c] = item;
    const newDiscovered = new Set(get().discovered);
    newDiscovered.add(`${activeTree}-1`);
    set(state => ({
      grid: newGrid,
      freeSpawnCharges: state.freeSpawnCharges - 1,
      discovered: newDiscovered,
      stats: { ...state.stats, totalSpawns: state.stats.totalSpawns + 1 },
    }));
    get()._startHarvestTimer(item.id, 1);
    get()._markFresh(item.id);
    get()._updateQuestProgress();
    return true;
  },

  tickFreeSpawn: () => {
    const { freeSpawnCharges, maxFreeSpawnCharges, freeSpawnCooldown, lastFreeSpawnTick } = get();
    if (freeSpawnCharges >= maxFreeSpawnCharges) {
      set({ lastFreeSpawnTick: Date.now() });
      return;
    }
    const now = Date.now();
    const elapsed = (now - lastFreeSpawnTick) / 1000;
    const newCharges = Math.floor(elapsed / freeSpawnCooldown);
    if (newCharges > 0) {
      const finalCharges = Math.min(freeSpawnCharges + newCharges, maxFreeSpawnCharges);
      set({
        freeSpawnCharges: finalCharges,
        lastFreeSpawnTick: finalCharges >= maxFreeSpawnCharges ? now : lastFreeSpawnTick + newCharges * freeSpawnCooldown * 1000,
      });
    }
  },

  getFreeSpawnCooldownRemaining: () => {
    const { freeSpawnCharges, maxFreeSpawnCharges, freeSpawnCooldown, lastFreeSpawnTick } = get();
    if (freeSpawnCharges >= maxFreeSpawnCharges) return 0;
    const elapsed = (Date.now() - lastFreeSpawnTick) / 1000;
    const remaining = freeSpawnCooldown - (elapsed % freeSpawnCooldown);
    return Math.ceil(remaining);
  },

  // === 머지 (Phase 5: 콤보 + 부스트) ===
  mergeItems: (fromR, fromC, toR, toC) => {
    const { grid, discovered, lastMergeTime, comboCount } = get();
    const fromItem = grid[fromR][fromC];
    const toItem = grid[toR][toC];
    if (!fromItem || !toItem) return false;
    if (fromItem.level !== toItem.level) return false;
    if ((fromItem.tree || 'animal') !== (toItem.tree || 'animal')) return false;
    if (fromItem.level >= MAX_LEVEL) return false;
    const tree = fromItem.tree || 'animal';
    const newLevel = fromItem.level + 1;
    const treeItem = getTreeItem(tree, newLevel);

    // 콤보 계산
    const now = Date.now();
    const newCombo = (now - lastMergeTime < 5000) ? comboCount + 1 : 1;
    const comboMult = getComboMultiplier(newCombo);
    const boostMult = get().getBoostMultiplier();
    const baseBonus = treeItem.mergeBonus;
    const finalBonus = Math.floor(baseBonus * comboMult * boostMult);

    const mergedItem = newItem(newLevel, tree);
    const newGrid = cloneGrid(grid);
    newGrid[fromR][fromC] = null;
    newGrid[toR][toC] = mergedItem;
    const newDiscovered = new Set(discovered);
    newDiscovered.add(`${tree}-${newLevel}`);

    // 수확 타이머 정리 (머지된 아이템 제거, 새 아이템 시작)
    const newTimers = { ...get().harvestTimers };
    delete newTimers[fromItem.id];
    delete newTimers[toItem.id];

    set(state => ({
      grid: newGrid,
      coins: state.coins + finalBonus,
      discovered: newDiscovered,
      comboCount: newCombo,
      lastMergeTime: now,
      harvestTimers: newTimers,
      stats: {
        ...state.stats,
        totalMerges: state.stats.totalMerges + 1,
        maxLevel: Math.max(state.stats.maxLevel, newLevel),
        totalCoinsEarned: state.stats.totalCoinsEarned + finalBonus,
      },
    }));

    // 플로팅 텍스트 (콤보 표시)
    const comboLabel = getComboLabel(newCombo);
    const text = comboLabel ? `+${finalBonus} 🪙 ${comboLabel}` : `+${finalBonus} 🪙`;
    get().addFloatingText(text, toR, toC);
    get()._startHarvestTimer(mergedItem.id, newLevel);
    get()._markFresh(mergedItem.id);
    get()._updateQuestProgress();
    return newCombo; // 콤보 수 반환 (Grid에서 이펙트용)
  },

  // === 스왑/이동 ===
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

  // === Phase 5: 탭 수확 ===
  _startHarvestTimer: (itemId, level) => {
    const cooldown = getHarvestCooldown(level);
    const readyAt = Date.now() + cooldown;
    const expiresAt = readyAt + HARVEST_EXPIRE;
    set(state => ({
      harvestTimers: { ...state.harvestTimers, [itemId]: { readyAt, expiresAt } },
    }));
  },

  harvestItem: (r, c) => {
    const { grid, harvestTimers } = get();
    const item = grid[r]?.[c];
    if (!item) return false;
    const timer = harvestTimers[item.id];
    if (!timer || Date.now() < timer.readyAt) return false;

    const treeItem = getTreeItem(item.tree || 'animal', item.level);
    const harvestAmount = Math.floor(treeItem.coinsPerSec * 5 * get().getBoostMultiplier());
    if (harvestAmount <= 0) return false;

    // 타이머 리셋
    const cooldown = getHarvestCooldown(item.level);
    const newReadyAt = Date.now() + cooldown;
    const newExpiresAt = newReadyAt + HARVEST_EXPIRE;

    set(state => ({
      coins: state.coins + harvestAmount,
      harvestTimers: {
        ...state.harvestTimers,
        [item.id]: { readyAt: newReadyAt, expiresAt: newExpiresAt },
      },
      stats: { ...state.stats, totalCoinsEarned: state.stats.totalCoinsEarned + harvestAmount },
    }));
    get().addFloatingText(`+${harvestAmount} 🪙`, r, c);
    return true;
  },

  tickHarvest: () => {
    const { harvestTimers, grid, gridSize } = get();
    const now = Date.now();
    let changed = false;
    const newTimers = { ...harvestTimers };

    // 만료된 타이머 제거 & 재시작
    for (const [itemId, timer] of Object.entries(newTimers)) {
      if (now > timer.expiresAt) {
        // 아이템이 아직 그리드에 있는지 확인
        let found = false;
        for (let r = 0; r < gridSize; r++)
          for (let c = 0; c < gridSize; c++)
            if (grid[r]?.[c]?.id === itemId) { found = true; break; }
        if (found) {
          // 재시작
          const item = Object.values(grid.flat().filter(Boolean)).find(i => i.id === itemId);
          if (item) {
            const cooldown = getHarvestCooldown(item.level);
            newTimers[itemId] = { readyAt: now + cooldown, expiresAt: now + cooldown + HARVEST_EXPIRE };
            changed = true;
          }
        } else {
          delete newTimers[itemId];
          changed = true;
        }
      }
    }

    // 타이머 없는 그리드 아이템에 타이머 추가
    for (let r = 0; r < gridSize; r++)
      for (let c = 0; c < gridSize; c++) {
        const item = grid[r]?.[c];
        if (item && !newTimers[item.id]) {
          const cooldown = getHarvestCooldown(item.level);
          newTimers[item.id] = { readyAt: now + cooldown, expiresAt: now + cooldown + HARVEST_EXPIRE };
          changed = true;
        }
      }

    if (changed) set({ harvestTimers: newTimers });
  },

  isHarvestReady: (itemId) => {
    const timer = get().harvestTimers[itemId];
    if (!timer) return false;
    const now = Date.now();
    return now >= timer.readyAt && now <= timer.expiresAt;
  },

  // === Phase 5: 부스트 ===
  activateBoost: () => {
    const { boostCooldownEnd } = get();
    if (boostCooldownEnd && Date.now() < boostCooldownEnd) return false;
    const now = Date.now();
    set({
      boostActive: true,
      boostEndTime: now + 180_000,
      boostCooldownEnd: now + 600_000,
    });
    return true;
  },

  tickBoost: () => {
    const { boostActive, boostEndTime } = get();
    if (boostActive && Date.now() >= boostEndTime) {
      set({ boostActive: false, boostEndTime: null });
    }
  },

  getBoostTimeRemaining: () => {
    const { boostActive, boostEndTime, boostCooldownEnd } = get();
    const now = Date.now();
    if (boostActive && boostEndTime) return { type: 'active', remaining: Math.max(0, Math.ceil((boostEndTime - now) / 1000)) };
    if (boostCooldownEnd && now < boostCooldownEnd) return { type: 'cooldown', remaining: Math.max(0, Math.ceil((boostCooldownEnd - now) / 1000)) };
    return { type: 'ready', remaining: 0 };
  },

  // === 퀘스트 보상 ===
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

  // === 트리 ===
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

  // === 그리드 확장 ===
  expandGrid: () => {
    const { grid, gridSize, coins } = get();
    const newSize = gridSize + 1;
    if (newSize > 7) return false;
    const cost = newSize === 6 ? 5000 : 15000;
    if (coins < cost) return false;
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

  // === 자동 수익 (부스트 적용) ===
  tick: () => {
    const { grid, lastTick, gridSize } = get();
    const now = Date.now();
    const delta = (now - lastTick) / 1000;
    const boostMult = get().getBoostMultiplier();
    let income = 0;
    for (let r = 0; r < gridSize; r++)
      for (let c = 0; c < gridSize; c++)
        if (grid[r]?.[c]) {
          const item = grid[r][c];
          income += getTreeItem(item.tree || 'animal', item.level).coinsPerSec * delta * boostMult;
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

  // === 저장/로드 ===
  save: () => {
    const s = get();
    const data = {
      grid: s.grid, coins: s.coins, totalSpawns: s.totalSpawns,
      discovered: [...s.discovered],
      stats: s.stats, claimedQuests: s.claimedQuests,
      gridSize: s.gridSize, activeTree: s.activeTree, unlockedTrees: s.unlockedTrees,
      freeSpawnCharges: s.freeSpawnCharges, lastFreeSpawnTick: s.lastFreeSpawnTick,
      boostCooldownEnd: s.boostCooldownEnd,
      harvestTimers: s.harvestTimers,
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
        discovered: new Set(data.discovered.map(d => typeof d === 'number' ? `animal-${d}` : d)),
        lastTick: Date.now(),
      };
      if (data.stats) state.stats = data.stats;
      if (data.claimedQuests) state.claimedQuests = data.claimedQuests;
      if (data.gridSize) state.gridSize = data.gridSize;
      if (data.activeTree) state.activeTree = data.activeTree;
      if (data.unlockedTrees) state.unlockedTrees = data.unlockedTrees;
      // Phase 5 필드
      if (data.freeSpawnCharges != null) state.freeSpawnCharges = data.freeSpawnCharges;
      if (data.lastFreeSpawnTick) state.lastFreeSpawnTick = data.lastFreeSpawnTick;
      if (data.boostCooldownEnd) state.boostCooldownEnd = data.boostCooldownEnd;
      if (data.harvestTimers) state.harvestTimers = data.harvestTimers;
      set(state);
      // 무료 소환 오프라인 충전 복원
      setTimeout(() => { get().tickFreeSpawn(); get()._updateQuestProgress(); }, 0);
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
      grid: createEmptyGrid(), gridSize: DEFAULT_GRID_SIZE,
      coins: 100, totalSpawns: 0,
      discovered: new Set(['animal-1']), activeTree: 'animal', unlockedTrees: ['animal'],
      stats: { totalMerges: 0, totalSpawns: 0, maxLevel: 1, totalCoinsEarned: 0 },
      questProgress: {}, claimedQuests: [],
      freeSpawnCharges: 3, lastFreeSpawnTick: Date.now(),
      comboCount: 0, lastMergeTime: 0,
      harvestTimers: {},
      boostActive: false, boostEndTime: null, boostCooldownEnd: null,
      lastTick: Date.now(), lastSaved: Date.now(),
      floatingTexts: [], freshItemIds: new Set(),
    });
  },

  getSpawnCost: () => calcSpawnCost(get().totalSpawns),

  getIncomePerSec: () => {
    const { grid, gridSize } = get();
    const boostMult = get().getBoostMultiplier();
    let total = 0;
    for (let r = 0; r < (gridSize || 5); r++)
      for (let c = 0; c < (gridSize || 5); c++)
        if (grid[r]?.[c]) {
          const item = grid[r][c];
          total += getTreeItem(item.tree || 'animal', item.level).coinsPerSec * boostMult;
        }
    return total;
  },
}));

export default useGameStore;
