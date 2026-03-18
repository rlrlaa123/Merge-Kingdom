import { create } from 'zustand';
import { getRandomEmptyCell, cloneGrid } from '../utils/gridHelpers';
import { createEmptyGrid, findEmptyCells, GRID_SIZE as DEFAULT_GRID_SIZE } from '../utils/gridHelpers';
import { getTreeItem, MAX_LEVEL, KINGDOM_LEVELS, getKingdomLevel, getNextKingdomLevel } from '../data/mergeTree';
import { QUESTS } from '../data/quests';
import { generateOrder, rollDifficulty } from '../data/orders';

const newItem = (level, tree = 'animal', special = null) => ({
  id: Date.now().toString(36) + Math.random().toString(36).substr(2),
  level, tree, special,
});

const FRESH_DURATION = 600;
const SAVE_KEY = 'merge-kingdom-save';
const calcSpawnCost = (n) => Math.floor(10 * Math.pow(1.08, n));

// 콤보
const getComboMultiplier = (c) => c >= 4 ? 2.5 : c >= 3 ? 2.0 : c >= 2 ? 1.5 : 1;
const getComboLabel = (c) => c >= 4 ? 'FEVER!' : c >= 2 ? `콤보 ×${c}!` : '';

// 수확 쿨다운
const getHarvestCooldown = (level) => Math.max(5, 11 - level) * 1000;
const HARVEST_EXPIRE = 30_000;

// 퀘스트
const checkQuestProgress = (stats, discovered) => {
  const progress = {};
  for (const q of QUESTS) {
    switch (q.type) {
      case 'merge': progress[q.id] = Math.min(stats.totalMerges, q.target); break;
      case 'spawn': progress[q.id] = Math.min(stats.totalSpawns, q.target); break;
      case 'reach_level': progress[q.id] = stats.maxLevel >= q.target ? q.target : 0; break;
      case 'earn_coins': progress[q.id] = Math.min(Math.floor(stats.totalCoinsEarned), q.target); break;
      case 'collect': {
        const uq = new Set([...discovered].map(k => { const p = k.toString().split('-'); return p.length === 2 ? parseInt(p[1]) : parseInt(k); }));
        progress[q.id] = Math.min(uq.size, q.target); break;
      }
    }
  }
  return progress;
};

// 프레스티지 버프 정의
const PRESTIGE_BUFFS = {
  startCoins:    { cost: 1, desc: '시작 코인 ×5',       apply: (s) => ({ startCoins: 500 }) },
  spawnDiscount: { cost: 2, desc: '소환 비용 -15%',     apply: () => ({}) },
  autoIncome:    { cost: 2, desc: '자동수익 ×1.3',      apply: () => ({}) },
  orderReward:   { cost: 3, desc: '주문 보상 ×1.5',     apply: () => ({}) },
  goldenChance:  { cost: 3, desc: '골드 알 확률 10%',   apply: () => ({}) },
};

const useGameStore = create((set, get) => ({
  grid: createEmptyGrid(), gridSize: DEFAULT_GRID_SIZE,
  coins: 100, totalSpawns: 0,
  discovered: new Set(['animal-1']),
  activeTree: 'animal', unlockedTrees: ['animal'],
  stats: { totalMerges: 0, totalSpawns: 0, maxLevel: 1, totalCoinsEarned: 0 },
  questProgress: {}, claimedQuests: [],

  // 무료 소환
  freeSpawnCharges: 3, maxFreeSpawnCharges: 3, freeSpawnCooldown: 30, lastFreeSpawnTick: Date.now(),

  // 콤보
  comboCount: 0, lastMergeTime: 0,

  // 수확
  harvestTimers: {},

  // 부스트
  boostActive: false, boostEndTime: null, boostCooldownEnd: null,

  // 주문
  orders: [], maxOrders: 3, orderSlotCooldowns: {}, totalDeliveries: 0,

  // 명성 & 왕국
  fame: 0, kingdomLevel: 1, levelUpUnlock: null, // 레벨업 알림용

  // 프레스티지
  crownPoints: 0, totalPrestiges: 0, permanentBuffs: [],

  // UI
  lastTick: Date.now(), lastSaved: Date.now(),
  floatingTexts: [], freshItemIds: new Set(),

  // === 헬퍼 ===
  _markFresh: (id) => {
    set(s => ({ freshItemIds: new Set([...s.freshItemIds, id]) }));
    setTimeout(() => set(s => { const n = new Set(s.freshItemIds); n.delete(id); return { freshItemIds: n }; }), FRESH_DURATION);
  },
  _updateQuestProgress: () => { const { stats, discovered } = get(); set({ questProgress: checkQuestProgress(stats, discovered) }); },
  _startHarvestTimer: (itemId, level) => {
    const cd = getHarvestCooldown(level);
    set(s => ({ harvestTimers: { ...s.harvestTimers, [itemId]: { readyAt: Date.now() + cd, expiresAt: Date.now() + cd + HARVEST_EXPIRE } } }));
  },
  getBoostMultiplier: () => get().boostActive ? 2 : 1,
  _hasBuffs: (buffId) => get().permanentBuffs.includes(buffId),
  _getGoldenChance: () => {
    const { kingdomLevel, permanentBuffs } = get();
    if (kingdomLevel < 4) return 0;
    return permanentBuffs.includes('goldenChance') ? 0.10 : 0.05;
  },

  // === 소환 ===
  spawnItem: () => {
    const { grid, coins, totalSpawns, activeTree, gridSize, permanentBuffs } = get();
    let cost = calcSpawnCost(totalSpawns);
    if (permanentBuffs.includes('spawnDiscount')) cost = Math.floor(cost * 0.85);
    if (coins < cost) return false;
    const cell = getRandomEmptyCell(grid, gridSize);
    if (!cell) return false;
    const special = Math.random() < get()._getGoldenChance() ? 'golden' : null;
    const item = newItem(1, activeTree, special);
    const newGrid = cloneGrid(grid);
    newGrid[cell.r][cell.c] = item;
    const disc = new Set(get().discovered); disc.add(`${activeTree}-1`);
    set(s => ({ grid: newGrid, coins: coins - cost, totalSpawns: totalSpawns + 1, discovered: disc, stats: { ...s.stats, totalSpawns: s.stats.totalSpawns + 1 } }));
    get()._startHarvestTimer(item.id, 1);
    get()._markFresh(item.id);
    get()._updateQuestProgress();
    return true;
  },

  freeSpawn: () => {
    const { grid, freeSpawnCharges, activeTree, gridSize } = get();
    if (freeSpawnCharges <= 0) return false;
    const cell = getRandomEmptyCell(grid, gridSize);
    if (!cell) return false;
    const special = Math.random() < get()._getGoldenChance() ? 'golden' : null;
    const item = newItem(1, activeTree, special);
    const newGrid = cloneGrid(grid);
    newGrid[cell.r][cell.c] = item;
    const disc = new Set(get().discovered); disc.add(`${activeTree}-1`);
    set(s => ({ grid: newGrid, freeSpawnCharges: s.freeSpawnCharges - 1, discovered: disc, stats: { ...s.stats, totalSpawns: s.stats.totalSpawns + 1 } }));
    get()._startHarvestTimer(item.id, 1);
    get()._markFresh(item.id);
    get()._updateQuestProgress();
    return true;
  },

  tickFreeSpawn: () => {
    const { freeSpawnCharges, maxFreeSpawnCharges, freeSpawnCooldown, lastFreeSpawnTick } = get();
    if (freeSpawnCharges >= maxFreeSpawnCharges) { set({ lastFreeSpawnTick: Date.now() }); return; }
    const elapsed = (Date.now() - lastFreeSpawnTick) / 1000;
    const nc = Math.floor(elapsed / freeSpawnCooldown);
    if (nc > 0) {
      const fc = Math.min(freeSpawnCharges + nc, maxFreeSpawnCharges);
      set({ freeSpawnCharges: fc, lastFreeSpawnTick: fc >= maxFreeSpawnCharges ? Date.now() : lastFreeSpawnTick + nc * freeSpawnCooldown * 1000 });
    }
  },
  getFreeSpawnCooldownRemaining: () => {
    const { freeSpawnCharges, maxFreeSpawnCharges, freeSpawnCooldown, lastFreeSpawnTick } = get();
    if (freeSpawnCharges >= maxFreeSpawnCharges) return 0;
    return Math.ceil(freeSpawnCooldown - ((Date.now() - lastFreeSpawnTick) / 1000) % freeSpawnCooldown);
  },

  // === 머지 (콤보 + 부스트 + 특수 아이템) ===
  mergeItems: (fromR, fromC, toR, toC) => {
    const { grid, discovered, lastMergeTime, comboCount } = get();
    const from = grid[fromR][fromC], to = grid[toR][toC];
    if (!from || !to) return false;

    // 와일드카드: 같은 트리면 레벨 무관 머지
    const isWild = from.special === 'wildcard' || to.special === 'wildcard';
    if (!isWild) {
      if (from.level !== to.level) return false;
    }
    if ((from.tree || 'animal') !== (to.tree || 'animal')) return false;
    const baseLevel = isWild ? Math.max(from.level, to.level) : from.level;
    if (baseLevel >= MAX_LEVEL) return false;

    const tree = from.tree || 'animal';
    const isGolden = from.special === 'golden' || to.special === 'golden';
    const newLevel = Math.min(baseLevel + (isGolden ? 2 : 1), MAX_LEVEL);
    const treeItem = getTreeItem(tree, newLevel);

    // 콤보
    const now = Date.now();
    const newCombo = (now - lastMergeTime < 5000) ? comboCount + 1 : 1;
    const cMult = getComboMultiplier(newCombo);
    const bMult = get().getBoostMultiplier();
    const oMult = get().permanentBuffs.includes('orderReward') ? 1 : 1; // orderReward만 주문에 적용
    const baseBonus = treeItem.mergeBonus;
    const finalBonus = Math.floor(baseBonus * cMult * bMult);

    const mergedItem = newItem(newLevel, tree);
    const newGrid = cloneGrid(grid);
    newGrid[fromR][fromC] = null;
    newGrid[toR][toC] = mergedItem;
    const disc = new Set(discovered); disc.add(`${tree}-${newLevel}`);
    const ht = { ...get().harvestTimers }; delete ht[from.id]; delete ht[to.id];

    set(s => ({
      grid: newGrid, coins: s.coins + finalBonus, discovered: disc,
      comboCount: newCombo, lastMergeTime: now, harvestTimers: ht,
      stats: { ...s.stats, totalMerges: s.stats.totalMerges + 1, maxLevel: Math.max(s.stats.maxLevel, newLevel), totalCoinsEarned: s.stats.totalCoinsEarned + finalBonus },
    }));

    const cl = getComboLabel(newCombo);
    get().addFloatingText(cl ? `+${finalBonus} 🪙 ${cl}` : `+${finalBonus} 🪙`, toR, toC);
    get()._startHarvestTimer(mergedItem.id, newLevel);
    get()._markFresh(mergedItem.id);
    get()._updateQuestProgress();
    return newCombo;
  },

  swapItems: (fromR, fromC, toR, toC) => { const g = cloneGrid(get().grid); [g[fromR][fromC], g[toR][toC]] = [g[toR][toC], g[fromR][fromC]]; set({ grid: g }); },
  moveItem: (fromR, fromC, toR, toC) => { const g = cloneGrid(get().grid); g[toR][toC] = g[fromR][fromC]; g[fromR][fromC] = null; set({ grid: g }); },

  // === 주문 ===
  initOrders: () => {
    const { orders, maxOrders, totalDeliveries, unlockedTrees } = get();
    const newOrders = [...orders];
    while (newOrders.length < maxOrders) {
      const diff = rollDifficulty();
      newOrders.push(generateOrder(totalDeliveries, unlockedTrees, diff));
    }
    set({ orders: newOrders, orderSlotCooldowns: {} });
  },

  tickOrders: () => {
    const { orders, maxOrders, orderSlotCooldowns, totalDeliveries, unlockedTrees } = get();
    const now = Date.now();
    let changed = false;
    const newCooldowns = { ...orderSlotCooldowns };

    // 쿨다운 만료 체크
    for (const [slot, endTime] of Object.entries(newCooldowns)) {
      if (now >= endTime) { delete newCooldowns[slot]; changed = true; }
    }

    // 빈 슬롯 채우기 (쿨다운 아닌 슬롯만)
    const newOrders = [...orders];
    while (newOrders.length < maxOrders) {
      const slotIdx = newOrders.length;
      if (newCooldowns[slotIdx]) break;
      const diff = rollDifficulty();
      newOrders.push(generateOrder(totalDeliveries, unlockedTrees, diff));
      changed = true;
    }

    if (changed) set({ orders: newOrders, orderSlotCooldowns: newCooldowns });
  },

  canDeliver: (orderId) => {
    const { orders, grid, gridSize } = get();
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;
    // 그리드에서 사용 가능한 아이템 수 세기
    const available = {};
    for (let r = 0; r < gridSize; r++)
      for (let c = 0; c < gridSize; c++) {
        const item = grid[r]?.[c];
        if (item && item.special !== 'rock') {
          const key = `${item.tree || 'animal'}-${item.level}`;
          available[key] = (available[key] || 0) + 1;
        }
      }
    for (const req of order.requirements) {
      const key = `${req.tree}-${req.level}`;
      if ((available[key] || 0) < req.count) return false;
    }
    return true;
  },

  deliverOrder: (orderId) => {
    const { orders, grid, gridSize, permanentBuffs, totalDeliveries, unlockedTrees } = get();
    const order = orders.find(o => o.id === orderId);
    if (!order || !get().canDeliver(orderId)) return false;

    const newGrid = cloneGrid(grid);
    const ht = { ...get().harvestTimers };
    for (const req of order.requirements) {
      let remaining = req.count;
      for (let r = 0; r < gridSize && remaining > 0; r++)
        for (let c = 0; c < gridSize && remaining > 0; c++) {
          const item = newGrid[r]?.[c];
          if (item && (item.tree || 'animal') === req.tree && item.level === req.level && item.special !== 'rock') {
            delete ht[item.id];
            newGrid[r][c] = null;
            remaining--;
          }
        }
    }

    const rewardMult = permanentBuffs.includes('orderReward') ? 1.5 : 1;
    const coinReward = Math.floor(order.coinReward * get().getBoostMultiplier() * rewardMult);
    const fameReward = order.fameReward;
    const newDeliveries = totalDeliveries + 1;

    // 즉시 새 주문으로 교체
    const diff = rollDifficulty();
    const newOrder = generateOrder(newDeliveries, unlockedTrees, diff);
    const newOrders = orders.map(o => o.id === orderId ? newOrder : o);

    set(s => ({
      grid: newGrid,
      coins: s.coins + coinReward,
      orders: newOrders,
      totalDeliveries: newDeliveries,
      harvestTimers: ht,
      stats: { ...s.stats, totalCoinsEarned: s.stats.totalCoinsEarned + coinReward },
    }));
    get().addFame(fameReward);
    get().addFloatingText(`+${coinReward} 🪙 +${fameReward} ⭐`, 1, 2);
    get()._updateQuestProgress();
    return true;
  },

  skipOrder: (orderId) => {
    const { orders } = get();
    const slotIndex = orders.findIndex(o => o.id === orderId);
    if (slotIndex === -1) return;
    const newOrders = [...orders];
    newOrders.splice(slotIndex, 1);
    set({
      orders: newOrders,
      orderSlotCooldowns: { ...get().orderSlotCooldowns, [slotIndex]: Date.now() + 10_000 },
    });
  },

  // === 명성 & 왕국 레벨 ===
  addFame: (amount) => {
    const { fame, kingdomLevel, unlockedTrees, gridSize } = get();
    const newFame = fame + amount;
    let newLevel = kingdomLevel;
    let unlock = null;

    for (const kd of KINGDOM_LEVELS) {
      if (newFame >= kd.fame && kd.level > newLevel) {
        newLevel = kd.level;
        unlock = kd.unlock;
      }
    }

    const updates = { fame: newFame };
    if (newLevel > kingdomLevel) {
      updates.kingdomLevel = newLevel;
      updates.levelUpUnlock = unlock;
      // 자동 해금 처리
      if (unlock) {
        if (unlock.type === 'tree' && !unlockedTrees.includes(unlock.value)) {
          updates.unlockedTrees = [...unlockedTrees, unlock.value];
        }
        if (unlock.type === 'grid' && unlock.value > gridSize) {
          const g = get().grid;
          const ns = unlock.value;
          updates.grid = Array(ns).fill(null).map((_, r) => Array(ns).fill(null).map((_, c) => (r < gridSize && c < gridSize ? g[r]?.[c] : null)));
          updates.gridSize = ns;
        }
        if (unlock.type === 'orderSlots') {
          updates.maxOrders = unlock.value;
        }
      }
    }
    set(updates);
  },

  clearLevelUpUnlock: () => set({ levelUpUnlock: null }),

  // === 수확 ===
  harvestItem: (r, c) => {
    const { grid, harvestTimers } = get();
    const item = grid[r]?.[c];
    if (!item || item.special === 'rock') return false;
    const timer = harvestTimers[item.id];
    if (!timer || Date.now() < timer.readyAt) return false;
    const ti = getTreeItem(item.tree || 'animal', item.level);
    const mult = get().getBoostMultiplier() * (get().permanentBuffs.includes('autoIncome') ? 1.3 : 1);
    const amount = Math.floor(ti.coinsPerSec * 5 * mult);
    if (amount <= 0) return false;
    const cd = getHarvestCooldown(item.level);
    set(s => ({
      coins: s.coins + amount,
      harvestTimers: { ...s.harvestTimers, [item.id]: { readyAt: Date.now() + cd, expiresAt: Date.now() + cd + HARVEST_EXPIRE } },
      stats: { ...s.stats, totalCoinsEarned: s.stats.totalCoinsEarned + amount },
    }));
    get().addFloatingText(`+${amount} 🪙`, r, c);
    return true;
  },

  tickHarvest: () => {
    const { harvestTimers, grid, gridSize } = get();
    const now = Date.now();
    const nt = { ...harvestTimers };
    let changed = false;
    for (const [id, t] of Object.entries(nt)) {
      if (now > t.expiresAt) {
        let found = null;
        for (let r = 0; r < gridSize; r++) for (let c = 0; c < gridSize; c++) if (grid[r]?.[c]?.id === id) found = grid[r][c];
        if (found) { const cd = getHarvestCooldown(found.level); nt[id] = { readyAt: now + cd, expiresAt: now + cd + HARVEST_EXPIRE }; }
        else delete nt[id];
        changed = true;
      }
    }
    for (let r = 0; r < gridSize; r++)
      for (let c = 0; c < gridSize; c++) {
        const item = grid[r]?.[c];
        if (item && !nt[item.id] && item.special !== 'rock') {
          nt[item.id] = { readyAt: now + getHarvestCooldown(item.level), expiresAt: now + getHarvestCooldown(item.level) + HARVEST_EXPIRE };
          changed = true;
        }
      }
    if (changed) set({ harvestTimers: nt });
  },

  isHarvestReady: (itemId) => { const t = get().harvestTimers[itemId]; return t && Date.now() >= t.readyAt && Date.now() <= t.expiresAt; },

  // === 바위 ===
  spawnRock: () => {
    const { grid, gridSize } = get();
    const cell = getRandomEmptyCell(grid, gridSize);
    if (!cell) return;
    const rock = { id: 'rock-' + Date.now().toString(36), level: 0, tree: 'none', special: 'rock' };
    const newGrid = cloneGrid(grid);
    newGrid[cell.r][cell.c] = rock;
    set({ grid: newGrid });
  },

  removeRock: (r, c) => {
    const { grid, coins } = get();
    const item = grid[r]?.[c];
    if (!item || item.special !== 'rock') return false;
    const cost = 50;
    if (coins < cost) return false;
    const newGrid = cloneGrid(grid);
    newGrid[r][c] = null;
    set({ grid: newGrid, coins: coins - cost });
    return true;
  },

  // === 부스트 ===
  activateBoost: () => {
    const { boostCooldownEnd } = get();
    if (boostCooldownEnd && Date.now() < boostCooldownEnd) return false;
    set({ boostActive: true, boostEndTime: Date.now() + 180_000, boostCooldownEnd: Date.now() + 600_000 });
    return true;
  },
  tickBoost: () => { if (get().boostActive && Date.now() >= get().boostEndTime) set({ boostActive: false, boostEndTime: null }); },
  getBoostTimeRemaining: () => {
    const { boostActive, boostEndTime, boostCooldownEnd } = get();
    const now = Date.now();
    if (boostActive && boostEndTime) return { type: 'active', remaining: Math.max(0, Math.ceil((boostEndTime - now) / 1000)) };
    if (boostCooldownEnd && now < boostCooldownEnd) return { type: 'cooldown', remaining: Math.max(0, Math.ceil((boostCooldownEnd - now) / 1000)) };
    return { type: 'ready', remaining: 0 };
  },

  // === 프레스티지 ===
  canPrestige: () => get().kingdomLevel >= 10,
  prestige: () => {
    if (!get().canPrestige()) return false;
    const { fame } = get();
    const bonusCrowns = Math.floor((fame - 15000) / 5000);
    const crowns = 3 + Math.max(0, bonusCrowns);
    const startCoins = get().permanentBuffs.includes('startCoins') ? 500 : 100;
    set(s => ({
      grid: createEmptyGrid(), gridSize: DEFAULT_GRID_SIZE,
      coins: startCoins, totalSpawns: 0,
      activeTree: 'animal', unlockedTrees: ['animal'],
      stats: { totalMerges: 0, totalSpawns: 0, maxLevel: 1, totalCoinsEarned: 0 },
      questProgress: {}, claimedQuests: [],
      freeSpawnCharges: 3, lastFreeSpawnTick: Date.now(),
      comboCount: 0, lastMergeTime: 0, harvestTimers: {},
      boostActive: false, boostEndTime: null, boostCooldownEnd: null,
      orders: [], maxOrders: 3, orderSlotCooldowns: {}, totalDeliveries: 0,
      fame: 0, kingdomLevel: 1, levelUpUnlock: null,
      crownPoints: s.crownPoints + crowns,
      totalPrestiges: s.totalPrestiges + 1,
      lastTick: Date.now(), lastSaved: Date.now(),
      floatingTexts: [], freshItemIds: new Set(),
      // discovered + permanentBuffs 유지
    }));
    return crowns;
  },

  purchaseBuff: (buffId) => {
    const { crownPoints, permanentBuffs } = get();
    const buff = PRESTIGE_BUFFS[buffId];
    if (!buff || permanentBuffs.includes(buffId) || crownPoints < buff.cost) return false;
    set({ crownPoints: crownPoints - buff.cost, permanentBuffs: [...permanentBuffs, buffId] });
    return true;
  },
  getPrestigeBuffs: () => PRESTIGE_BUFFS,

  // === 퀘스트 ===
  claimQuest: (questId) => {
    const { questProgress, claimedQuests } = get();
    const quest = QUESTS.find(q => q.id === questId);
    if (!quest || claimedQuests.includes(questId) || (questProgress[questId] || 0) < quest.target) return false;
    set(s => ({ coins: s.coins + quest.reward, claimedQuests: [...s.claimedQuests, questId] }));
    get().addFloatingText(`+${quest.reward} 🪙`, 2, 2);
    return true;
  },

  setActiveTree: (tree) => set({ activeTree: tree }),

  // === 자동 수익 ===
  tick: () => {
    const { grid, lastTick, gridSize, permanentBuffs } = get();
    const now = Date.now();
    const delta = (now - lastTick) / 1000;
    const bMult = get().getBoostMultiplier() * (permanentBuffs.includes('autoIncome') ? 1.3 : 1);
    let income = 0;
    for (let r = 0; r < gridSize; r++)
      for (let c = 0; c < gridSize; c++)
        if (grid[r]?.[c] && grid[r][c].special !== 'rock')
          income += getTreeItem(grid[r][c].tree || 'animal', grid[r][c].level).coinsPerSec * delta * bMult;
    if (income > 0) set(s => ({ coins: s.coins + income, lastTick: now, stats: { ...s.stats, totalCoinsEarned: s.stats.totalCoinsEarned + income } }));
    else set({ lastTick: now });
  },

  // === 저장/로드 ===
  save: () => {
    const s = get();
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      grid: s.grid, coins: s.coins, totalSpawns: s.totalSpawns,
      discovered: [...s.discovered], stats: s.stats, claimedQuests: s.claimedQuests,
      gridSize: s.gridSize, activeTree: s.activeTree, unlockedTrees: s.unlockedTrees,
      freeSpawnCharges: s.freeSpawnCharges, lastFreeSpawnTick: s.lastFreeSpawnTick,
      boostCooldownEnd: s.boostCooldownEnd, harvestTimers: s.harvestTimers,
      orders: s.orders, maxOrders: s.maxOrders, orderSlotCooldowns: s.orderSlotCooldowns, totalDeliveries: s.totalDeliveries,
      fame: s.fame, kingdomLevel: s.kingdomLevel,
      crownPoints: s.crownPoints, totalPrestiges: s.totalPrestiges, permanentBuffs: s.permanentBuffs,
      savedAt: Date.now(),
    }));
    set({ lastSaved: Date.now() });
  },

  load: () => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      const d = JSON.parse(raw);
      const st = {
        grid: d.grid, coins: d.coins, totalSpawns: d.totalSpawns,
        discovered: new Set((d.discovered || []).map(x => typeof x === 'number' ? `animal-${x}` : x)),
        lastTick: Date.now(),
      };
      // 호환
      ['stats','claimedQuests','gridSize','activeTree','unlockedTrees','freeSpawnCharges','lastFreeSpawnTick',
       'boostCooldownEnd','harvestTimers','orders','maxOrders','orderSlotCooldowns','totalDeliveries',
       'fame','kingdomLevel','crownPoints','totalPrestiges','permanentBuffs'].forEach(k => { if (d[k] != null) st[k] = d[k]; });
      set(st);
      setTimeout(() => { get().tickFreeSpawn(); get()._updateQuestProgress(); get().initOrders(); }, 0);
      return d;
    } catch { return null; }
  },

  calcOfflineReward: (savedAt) => {
    const { grid, gridSize } = get();
    const elapsed = Math.min((Date.now() - savedAt) / 1000, 8 * 3600);
    let income = 0;
    for (let r = 0; r < (gridSize || 5); r++)
      for (let c = 0; c < (gridSize || 5); c++)
        if (grid[r]?.[c] && grid[r][c].special !== 'rock')
          income += getTreeItem(grid[r][c].tree || 'animal', grid[r][c].level).coinsPerSec * elapsed;
    return { income: Math.floor(income), elapsed };
  },

  addFloatingText: (text, r, c) => {
    const id = Date.now() + Math.random();
    set(s => ({ floatingTexts: [...s.floatingTexts, { id, text, r, c }] }));
    setTimeout(() => set(s => ({ floatingTexts: s.floatingTexts.filter(t => t.id !== id) })), 1200);
  },

  resetGame: () => {
    localStorage.removeItem(SAVE_KEY);
    set({
      grid: createEmptyGrid(), gridSize: DEFAULT_GRID_SIZE, coins: 100, totalSpawns: 0,
      discovered: new Set(['animal-1']), activeTree: 'animal', unlockedTrees: ['animal'],
      stats: { totalMerges: 0, totalSpawns: 0, maxLevel: 1, totalCoinsEarned: 0 },
      questProgress: {}, claimedQuests: [],
      freeSpawnCharges: 3, lastFreeSpawnTick: Date.now(), comboCount: 0, lastMergeTime: 0,
      harvestTimers: {}, boostActive: false, boostEndTime: null, boostCooldownEnd: null,
      orders: [], maxOrders: 3, orderSlotCooldowns: {}, totalDeliveries: 0,
      fame: 0, kingdomLevel: 1, levelUpUnlock: null,
      crownPoints: 0, totalPrestiges: 0, permanentBuffs: [],
      lastTick: Date.now(), lastSaved: Date.now(), floatingTexts: [], freshItemIds: new Set(),
    });
  },

  getSpawnCost: () => {
    let cost = calcSpawnCost(get().totalSpawns);
    if (get().permanentBuffs.includes('spawnDiscount')) cost = Math.floor(cost * 0.85);
    return cost;
  },

  getIncomePerSec: () => {
    const { grid, gridSize, permanentBuffs } = get();
    const bMult = get().getBoostMultiplier() * (permanentBuffs.includes('autoIncome') ? 1.3 : 1);
    let total = 0;
    for (let r = 0; r < (gridSize || 5); r++)
      for (let c = 0; c < (gridSize || 5); c++)
        if (grid[r]?.[c] && grid[r][c].special !== 'rock')
          total += getTreeItem(grid[r][c].tree || 'animal', grid[r][c].level).coinsPerSec * bMult;
    return total;
  },
}));

export default useGameStore;
