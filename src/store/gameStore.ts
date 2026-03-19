import { create } from 'zustand';
import { CHAINS, getChainItem, MAX_CHAIN_LEVEL } from '../data/chains';
import { getKingdomLevel, getNextLevelDef } from '../data/levels';
import { getCharacter } from '../data/characters';
import { generateOrder, generateInitialOrders, generateOrderBatch, generateTutorialOrders, gateDifficulty, SLOT_DIFFICULTIES, type Order } from '../engine/OrderManager';
import {
  getGeneratorCooldown, getGeneratorEnergyCost, getEnergyCap,
  ENERGY_REGEN_INTERVAL, FREE_GIFT_COOLDOWN, FREE_GIFT_MIN, FREE_GIFT_MAX,
  AD_ENERGY, MAX_ADS_PER_DAY, COIN_ENERGY_COST, COIN_ENERGY_AMOUNT,
  OVERCHARGE_MULT, ENERGY_BOX_VALUES,
} from '../data/generators';

// === Types ===
export interface BoardItem {
  id: string;
  chain: string;
  level: number;
  special?: 'energyBox'; // 에너지 박스
}

export interface SourceState {
  chainId: string;
  level: number;
  cooldownEnd: number;
}

export interface EnergyState {
  current: number;
  max: number;
  lastRegenTime: number;
  freeGiftClaimedAt: number | null;
  adWatchCountToday: number;
  lastAdResetDate: string;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
}

// === Helpers ===
const uid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
const BOARD_SIZE = 5;
const SAVE_KEY = 'mk-rebirth-save';
const today = () => new Date().toISOString().slice(0, 10);

const createEmptyBoard = (size: number): (BoardItem | null)[][] =>
  Array(size).fill(null).map(() => Array(size).fill(null));
const cloneBoard = (b: (BoardItem | null)[][]) => b.map(r => [...r]);
const findEmptyCells = (b: (BoardItem | null)[][], s: number, maxRow?: number) => {
  const cells: { r: number; c: number }[] = [];
  const rowLimit = maxRow !== undefined ? Math.min(maxRow, s) : s;
  for (let r = 0; r < rowLimit; r++) for (let c = 0; c < s; c++) if (!b[r][c]) cells.push({ r, c });
  return cells;
};
const getRandomEmptyCell = (b: (BoardItem | null)[][], s: number, maxRow?: number) => {
  const cells = findEmptyCells(b, s, maxRow);
  return cells.length ? cells[Math.floor(Math.random() * cells.length)] : null;
};

// 같은 체인 아이템 근처의 빈 셀 찾기
const getNearbyEmptyCell = (
  b: (BoardItem | null)[][], s: number, chainId: string, maxRow?: number
): { r: number; c: number } | null => {
  // 같은 체인 아이템 위치 수집
  const rowLimit = maxRow !== undefined ? Math.min(maxRow, s) : s;
  const sameChainCells: { r: number; c: number }[] = [];
  for (let r = 0; r < rowLimit; r++)
    for (let c = 0; c < s; c++)
      if (b[r][c] && b[r][c]!.chain === chainId) sameChainCells.push({ r, c });

  if (sameChainCells.length === 0) return getRandomEmptyCell(b, s, maxRow);

  // 인접 빈 셀 수집 (거리 1 우선, 거리 2까지)
  const emptyCells = findEmptyCells(b, s, maxRow);
  if (emptyCells.length === 0) return null;

  // 각 빈 셀의 가장 가까운 같은 체인까지 거리 계산
  const scored = emptyCells.map(cell => {
    const minDist = Math.min(...sameChainCells.map(sc =>
      Math.abs(cell.r - sc.r) + Math.abs(cell.c - sc.c)
    ));
    return { ...cell, dist: minDist };
  });

  // 거리 1~2인 셀 우선, 없으면 전체에서 랜덤
  const nearby = scored.filter(c => c.dist <= 2);
  const pool = nearby.length > 0 ? nearby : scored;
  return pool[Math.floor(Math.random() * pool.length)];
};

// 소스 업그레이드 스펙
const SOURCE_SPECS = [
  { lv2Chance: 0, doubleProdChance: 0, upgradeCost: 0 },
  { lv2Chance: 0.08, doubleProdChance: 0, upgradeCost: 100 },
  { lv2Chance: 0.15, doubleProdChance: 0.03, upgradeCost: 500 },
];
const getSourceSpec = (lv: number) => SOURCE_SPECS[Math.min(lv - 1, 2)];

const BOARD_EXPAND_COST: Record<number, number> = { 6: 500, 7: 2000 };

// === Store Interface ===
interface GameStore {
  board: (BoardItem | null)[][];
  boardSize: number;
  sources: SourceState[];
  orders: Order[];
  completedOrderCount: number;
  gold: number;
  fame: number;
  kingdomLevel: number;
  unlockedChains: string[];
  energy: EnergyState;
  floatingTexts: FloatingText[];
  levelUpMessage: string | null;
  deliveryAnimation: { characterEmoji: string; dialogue: string } | null;
  lastPlayedAt: number;
  ftueStep: number;

  // Actions
  tapSource: (chainId: string) => boolean;
  mergeItems: (fromR: number, fromC: number, toR: number, toC: number) => boolean;
  swapItems: (fromR: number, fromC: number, toR: number, toC: number) => void;
  moveItem: (fromR: number, fromC: number, toR: number, toC: number) => void;
  deliverOrder: (orderId: string) => boolean;
  canDeliver: (orderId: string) => boolean;
  skipOrder: (orderId: string) => void;
  trashItem: (r: number, c: number) => void;
  tapEnergyBox: (r: number, c: number) => boolean;
  upgradeSource: (chainId: string) => boolean;
  getSourceUpgradeCost: (chainId: string) => number;
  expandBoard: () => boolean;
  getExpandCost: () => number | null;
  // Energy
  tickEnergy: () => void;
  claimFreeGift: () => boolean;
  canClaimFreeGift: () => boolean;
  getFreeGiftCooldown: () => number;
  watchAd: () => boolean;
  buyEnergy: () => boolean;
  // UI
  addFloatingText: (text: string, x: number, y: number) => void;
  clearLevelUp: () => void;
  clearDelivery: () => void;
  advanceFtue: () => void;
  // Save
  save: () => void;
  load: () => void;
  resetGame: () => void;
  isSourceReady: (chainId: string) => boolean;
  getSourceCooldownRemaining: (chainId: string) => number;
}

const initialEnergy = (): EnergyState => ({
  current: 85,
  max: 85,
  lastRegenTime: Date.now(),
  freeGiftClaimedAt: null,
  adWatchCountToday: 0,
  lastAdResetDate: today(),
});

const useGameStore = create<GameStore>((set, get) => ({
  board: createEmptyBoard(BOARD_SIZE),
  boardSize: BOARD_SIZE,
  sources: [
    { chainId: 'wood', level: 1, cooldownEnd: 0 },
    { chainId: 'stone', level: 1, cooldownEnd: 0 },
  ],
  orders: [],
  completedOrderCount: 0,
  gold: 0,
  fame: 0,
  kingdomLevel: 1,
  unlockedChains: ['wood', 'stone'],
  energy: initialEnergy(),
  floatingTexts: [],
  levelUpMessage: null,
  deliveryAnimation: null,
  lastPlayedAt: Date.now(),
  ftueStep: -1,

  // === 소스 탭 (에너지 소모) ===
  tapSource: (chainId) => {
    const { board, boardSize, sources, energy, ftueStep } = get();
    const source = sources.find(s => s.chainId === chainId);
    if (!source) return false;

    const eCost = getGeneratorEnergyCost(chainId);
    if (energy.current < eCost) return false;

    const isTutorial = ftueStep > 0 && ftueStep <= 4;
    const maxRow = isTutorial ? 2 : undefined;
    const cell = getNearbyEmptyCell(board, boardSize, chainId, maxRow);
    if (!cell) return false;

    const spec = getSourceSpec(source.level);
    const itemLevel = Math.random() < spec.lv2Chance ? 2 : 1;
    const item: BoardItem = { id: uid(), chain: chainId, level: itemLevel };
    const newBoard = cloneBoard(board);
    newBoard[cell.r][cell.c] = item;

    let isDouble = false;
    // 더블 생산
    if (spec.doubleProdChance > 0 && Math.random() < spec.doubleProdChance) {
      const c2 = getNearbyEmptyCell(newBoard, boardSize, chainId, maxRow);
      if (c2) {
        newBoard[c2.r][c2.c] = { id: uid(), chain: chainId, level: 1 };
        isDouble = true;
      }
    }

    // 에너지 박스 드랍 (3% 확률)
    if (Math.random() < 0.03) {
      const c3 = getRandomEmptyCell(newBoard, boardSize);
      if (c3) newBoard[c3.r][c3.c] = { id: uid(), chain: 'energyBox', level: 1, special: 'energyBox' };
    }

    set({
      board: newBoard,
      energy: { ...energy, current: energy.current - eCost },
    });

    // 특수효과
    if (isDouble) {
      get().addFloatingText('✨ 더블!', cell.c, cell.r);
    } else if (itemLevel > 1) {
      const ci = getChainItem(chainId, itemLevel);
      get().addFloatingText(`⭐ ${ci?.emoji || ''} Lv${itemLevel}!`, cell.c, cell.r);
    } else {
      get().addFloatingText(`⚡-${eCost}`, cell.c, cell.r);
    }
    if (get().ftueStep === 1) get().advanceFtue();
    return true;
  },

  // === 머지 ===
  mergeItems: (fromR, fromC, toR, toC) => {
    const { board } = get();
    const from = board[fromR]?.[fromC];
    const to = board[toR]?.[toC];
    if (!from || !to) return false;

    // 에너지 박스 머지
    if (from.special === 'energyBox' && to.special === 'energyBox' && from.level === to.level) {
      if (from.level >= 3) return false;
      const merged: BoardItem = { id: uid(), chain: 'energyBox', level: from.level + 1, special: 'energyBox' };
      const nb = cloneBoard(board);
      nb[fromR][fromC] = null;
      nb[toR][toC] = merged;
      set({ board: nb });
      return true;
    }

    // 일반 머지
    if (from.chain !== to.chain || from.level !== to.level) return false;
    if (from.special || to.special) return false;
    if (from.level >= MAX_CHAIN_LEVEL) return false;

    const newLevel = from.level + 1;
    const merged: BoardItem = { id: uid(), chain: from.chain, level: newLevel };
    const nb = cloneBoard(board);
    nb[fromR][fromC] = null;
    nb[toR][toC] = merged;
    set({ board: nb });

    const ci = getChainItem(from.chain, newLevel);
    if (ci) get().addFloatingText(`${ci.emoji} ${ci.name}!`, toC, toR);
    if (get().ftueStep === 2) get().advanceFtue();
    return true;
  },

  swapItems: (fR, fC, tR, tC) => {
    const b = cloneBoard(get().board);
    [b[fR][fC], b[tR][tC]] = [b[tR][tC], b[fR][fC]];
    set({ board: b });
  },

  moveItem: (fR, fC, tR, tC) => {
    const b = cloneBoard(get().board);
    b[tR][tC] = b[fR][fC]; b[fR][fC] = null;
    set({ board: b });
  },

  // === 에너지 박스 탭 ===
  tapEnergyBox: (r, c) => {
    const { board, energy } = get();
    const item = board[r]?.[c];
    if (!item || item.special !== 'energyBox') return false;
    const amount = ENERGY_BOX_VALUES[item.level - 1] || 10;
    const maxOvercharge = Math.floor(energy.max * OVERCHARGE_MULT);
    const newEnergy = Math.min(energy.current + amount, maxOvercharge);
    const nb = cloneBoard(board);
    nb[r][c] = null;
    set({ board: nb, energy: { ...energy, current: newEnergy } });
    get().addFloatingText(`⚡+${amount}`, c, r);
    return true;
  },

  // === 주문 ===
  canDeliver: (orderId) => {
    const { orders, board, boardSize } = get();
    const order = orders.find(o => o.id === orderId);
    if (!order || order.delivered) return false;
    const avail: Record<string, number> = {};
    for (let r = 0; r < boardSize; r++)
      for (let c = 0; c < boardSize; c++) {
        const it = board[r]?.[c];
        if (it && !it.special) {
          const k = `${it.chain}-${it.level}`;
          avail[k] = (avail[k] || 0) + 1;
        }
      }
    for (const req of order.items) {
      const k = `${req.chain}-${req.level}`;
      if ((avail[k] || 0) < req.quantity) return false;
      avail[k] -= req.quantity;
    }
    return true;
  },

  deliverOrder: (orderId) => {
    const { orders, board, boardSize, completedOrderCount, unlockedChains, kingdomLevel, energy } = get();
    const order = orders.find(o => o.id === orderId);
    if (!order || order.delivered || !get().canDeliver(orderId)) return false;

    // 보드에서 아이템 제거
    const nb = cloneBoard(board);
    for (const req of order.items) {
      let rem = req.quantity;
      for (let r = 0; r < boardSize && rem > 0; r++)
        for (let c = 0; c < boardSize && rem > 0; c++) {
          const it = nb[r]?.[c];
          if (it && !it.special && it.chain === req.chain && it.level === req.level) {
            nb[r][c] = null; rem--;
          }
        }
    }

    const newCount = completedOrderCount + 1;
    const newFame = get().fame + order.fameReward;
    const newKL = getKingdomLevel(newFame);

    let newUnlocked = [...unlockedChains];
    let lvMsg: string | null = null;
    let newEnergyCap = energy.max;
    if (newKL > kingdomLevel) {
      const nd = getNextLevelDef(kingdomLevel);
      lvMsg = nd ? `⭐ Lv.${newKL}! ${nd.unlocks.join(', ')}` : `⭐ Lv.${newKL}!`;
      for (const ch of CHAINS) {
        if (ch.unlockLevel <= newKL && !newUnlocked.includes(ch.id)) newUnlocked.push(ch.id);
      }
      newEnergyCap = getEnergyCap(newKL);
    }

    let newSources = [...get().sources];
    for (const ch of CHAINS) {
      if (ch.unlockLevel <= newKL && !newSources.find(s => s.chainId === ch.id)) {
        newSources.push({ chainId: ch.id, level: 1, cooldownEnd: 0 });
      }
    }

    // 레벨업 시 풀 충전, 그 외 에너지 변동 없음
    const newEnergyCurrent = newKL > kingdomLevel
      ? Math.max(energy.current, newEnergyCap)
      : energy.current;

    // 해당 주문을 delivered로 마킹
    let newOrders = orders.map(o => o.id === orderId ? { ...o, delivered: true } : o);

    // 4개 모두 delivered면 새 배치 생성
    const allDone = newOrders.every(o => o.delivered);
    if (allDone) {
      newOrders = generateOrderBatch(newKL, newUnlocked);
    }

    const char = getCharacter(order.characterId);
    const thx = char?.thankDialogues[Math.floor(Math.random() * char.thankDialogues.length)] || '고마워!';

    set({
      board: nb,
      gold: get().gold + order.coinReward,
      fame: newFame,
      kingdomLevel: newKL,
      orders: newOrders,
      completedOrderCount: newCount,
      unlockedChains: newUnlocked,
      sources: newSources,
      energy: { ...energy, current: newEnergyCurrent, max: newEnergyCap },
      levelUpMessage: lvMsg,
      deliveryAnimation: { characterEmoji: order.characterEmoji, dialogue: thx },
    });

    get().addFloatingText(`+${order.coinReward}🪙 +${order.fameReward}⭐`, 2, 0);
    if (get().ftueStep === 3) get().advanceFtue();
    return true;
  },

  skipOrder: (_orderId) => {
    // 배치 방식에서는 개별 스킵 불가 — 무시
  },

  trashItem: (r, c) => { const b = cloneBoard(get().board); b[r][c] = null; set({ board: b }); },

  // === 소스 업그레이드 ===
  upgradeSource: (chainId) => {
    const { sources, gold } = get();
    const src = sources.find(s => s.chainId === chainId);
    if (!src || src.level >= 3) return false;
    const cost = getSourceSpec(src.level + 1).upgradeCost;
    if (gold < cost) return false;
    set({ sources: sources.map(s => s.chainId === chainId ? { ...s, level: s.level + 1 } : s), gold: gold - cost });
    return true;
  },
  getSourceUpgradeCost: (chainId) => {
    const src = get().sources.find(s => s.chainId === chainId);
    if (!src || src.level >= 3) return 0;
    return getSourceSpec(src.level + 1).upgradeCost;
  },

  // === 보드 확장 ===
  expandBoard: () => {
    const { board, boardSize, gold, kingdomLevel } = get();
    const ns = boardSize + 1;
    const cost = BOARD_EXPAND_COST[ns];
    if (!cost || gold < cost) return false;
    if (ns === 6 && kingdomLevel < 5) return false;
    if (ns === 7 && kingdomLevel < 9) return false;
    const nb = Array(ns).fill(null).map((_, r) => Array(ns).fill(null).map((_, c) => (r < boardSize && c < boardSize ? board[r]?.[c] : null)));
    set({ board: nb, boardSize: ns, gold: gold - cost });
    return true;
  },
  getExpandCost: () => {
    const { boardSize, kingdomLevel } = get();
    const ns = boardSize + 1;
    if (ns === 6 && kingdomLevel >= 5) return BOARD_EXPAND_COST[6];
    if (ns === 7 && kingdomLevel >= 9) return BOARD_EXPAND_COST[7];
    return null;
  },

  // === 에너지 시스템 ===
  tickEnergy: () => {
    const { energy } = get();
    const now = Date.now();
    if (energy.current >= energy.max) {
      set({ energy: { ...energy, lastRegenTime: now } });
      return;
    }
    const elapsed = now - energy.lastRegenTime;
    const regens = Math.floor(elapsed / ENERGY_REGEN_INTERVAL);
    if (regens > 0) {
      const newCurrent = Math.min(energy.current + regens, energy.max);
      set({ energy: { ...energy, current: newCurrent, lastRegenTime: energy.lastRegenTime + regens * ENERGY_REGEN_INTERVAL } });
    }
  },

  canClaimFreeGift: () => {
    const { energy } = get();
    if (!energy.freeGiftClaimedAt) return true;
    return Date.now() - energy.freeGiftClaimedAt >= FREE_GIFT_COOLDOWN;
  },

  getFreeGiftCooldown: () => {
    const { energy } = get();
    if (!energy.freeGiftClaimedAt) return 0;
    const remaining = FREE_GIFT_COOLDOWN - (Date.now() - energy.freeGiftClaimedAt);
    return Math.max(0, Math.ceil(remaining / 1000));
  },

  claimFreeGift: () => {
    if (!get().canClaimFreeGift()) return false;
    const { energy } = get();
    const amount = FREE_GIFT_MIN + Math.floor(Math.random() * (FREE_GIFT_MAX - FREE_GIFT_MIN + 1));
    const maxOC = Math.floor(energy.max * OVERCHARGE_MULT);
    set({ energy: { ...energy, current: Math.min(energy.current + amount, maxOC), freeGiftClaimedAt: Date.now() } });
    get().addFloatingText(`🎁 ⚡+${amount}`, 2, 2);
    return true;
  },

  watchAd: () => {
    const { energy } = get();
    let e = { ...energy };
    if (e.lastAdResetDate !== today()) { e.adWatchCountToday = 0; e.lastAdResetDate = today(); }
    if (e.adWatchCountToday >= MAX_ADS_PER_DAY) return false;
    const maxOC = Math.floor(e.max * OVERCHARGE_MULT);
    e.current = Math.min(e.current + AD_ENERGY, maxOC);
    e.adWatchCountToday += 1;
    set({ energy: e });
    get().addFloatingText(`🎬 ⚡+${AD_ENERGY}`, 2, 2);
    return true;
  },

  buyEnergy: () => {
    const { gold, energy } = get();
    if (gold < COIN_ENERGY_COST) return false;
    const maxOC = Math.floor(energy.max * OVERCHARGE_MULT);
    set({ gold: gold - COIN_ENERGY_COST, energy: { ...energy, current: Math.min(energy.current + COIN_ENERGY_AMOUNT, maxOC) } });
    get().addFloatingText(`⚡+${COIN_ENERGY_AMOUNT}`, 2, 2);
    return true;
  },

  // === FTUE ===
  advanceFtue: () => set(s => ({ ftueStep: s.ftueStep >= 4 ? 0 : s.ftueStep + 1 })),

  // === UI ===
  addFloatingText: (text, x, y) => {
    const id = Date.now() + Math.random();
    set(s => ({ floatingTexts: [...s.floatingTexts, { id, text, x, y }] }));
    setTimeout(() => set(s => ({ floatingTexts: s.floatingTexts.filter(t => t.id !== id) })), 1500);
  },
  clearLevelUp: () => set({ levelUpMessage: null }),
  clearDelivery: () => set({ deliveryAnimation: null }),

  isSourceReady: (chainId) => {
    const s = get().sources.find(s => s.chainId === chainId);
    return !!s && Date.now() >= s.cooldownEnd;
  },
  getSourceCooldownRemaining: (chainId) => {
    const s = get().sources.find(s => s.chainId === chainId);
    if (!s) return 0;
    return Math.max(0, Math.ceil((s.cooldownEnd - Date.now()) / 1000));
  },

  // === Save/Load ===
  save: () => {
    const s = get();
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      board: s.board, boardSize: s.boardSize, sources: s.sources,
      orders: s.orders, completedOrderCount: s.completedOrderCount,
      gold: s.gold, fame: s.fame, kingdomLevel: s.kingdomLevel,
      unlockedChains: s.unlockedChains, energy: s.energy,
      ftueStep: s.ftueStep, lastPlayedAt: Date.now(),
    }));
  },

  load: () => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      const { kingdomLevel, unlockedChains } = get();
      set({ orders: generateInitialOrders(kingdomLevel, unlockedChains), ftueStep: 1 });
      return;
    }
    try {
      const d = JSON.parse(raw);
      const e: EnergyState = d.energy || initialEnergy();

      // 오프라인 에너지 회복
      if (e.lastRegenTime) {
        const elapsed = Date.now() - e.lastRegenTime;
        const regens = Math.floor(elapsed / ENERGY_REGEN_INTERVAL);
        if (regens > 0 && e.current < e.max) {
          e.current = Math.min(e.current + regens, e.max);
          e.lastRegenTime += regens * ENERGY_REGEN_INTERVAL;
        }
      }
      // 광고 일일 리셋
      if (e.lastAdResetDate !== today()) { e.adWatchCountToday = 0; e.lastAdResetDate = today(); }

      set({
        board: d.board || createEmptyBoard(BOARD_SIZE),
        boardSize: d.boardSize || BOARD_SIZE,
        sources: d.sources || get().sources,
        orders: d.orders || [],
        completedOrderCount: d.completedOrderCount || 0,
        gold: d.gold || 0, fame: d.fame || 0,
        kingdomLevel: d.kingdomLevel || 1,
        unlockedChains: d.unlockedChains || ['wood', 'stone'],
        energy: e, ftueStep: d.ftueStep ?? 0,
        lastPlayedAt: d.lastPlayedAt || Date.now(),
      });

      // 빈 주문 채우기
      const { kingdomLevel: kl, unlockedChains: uc, orders } = get();
      if (orders.length < 4) {
        const no = [...orders];
        while (no.length < 4) { no.push(generateOrder(SLOT_DIFFICULTIES[no.length], kl, uc)); }
        set({ orders: no });
      }

      // 오프라인 코인 보상
      if (d.lastPlayedAt) {
        const el = Math.min((Date.now() - d.lastPlayedAt) / 1000, 8 * 3600);
        const offGold = Math.min(300, Math.floor(el / 60 * 0.5));
        if (offGold > 0) {
          set(s => ({ gold: s.gold + offGold }));
          setTimeout(() => get().addFloatingText(`오프라인: +${offGold}🪙`, 2, 2), 500);
        }
      }
    } catch { /* corrupt */ }
  },

  resetGame: () => {
    localStorage.removeItem(SAVE_KEY);
    set({
      board: createEmptyBoard(BOARD_SIZE), boardSize: BOARD_SIZE,
      sources: [{ chainId: 'wood', level: 1, cooldownEnd: 0 }, { chainId: 'stone', level: 1, cooldownEnd: 0 }],
      orders: generateInitialOrders(1, ['wood', 'stone']),
      completedOrderCount: 0, gold: 0, fame: 0, kingdomLevel: 1,
      unlockedChains: ['wood', 'stone'], energy: initialEnergy(),
      floatingTexts: [], levelUpMessage: null, deliveryAnimation: null,
      lastPlayedAt: Date.now(), ftueStep: 1,
    });
  },
}));

export default useGameStore;
