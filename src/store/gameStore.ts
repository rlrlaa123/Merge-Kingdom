import { create } from 'zustand';
import { CHAINS, getChainItem, MAX_CHAIN_LEVEL } from '../data/chains';
import { getKingdomLevel, getNextLevelDef } from '../data/levels';
import { getCharacter } from '../data/characters';
import { generateOrder, generateInitialOrders, gateDifficulty, SLOT_DIFFICULTIES, type Order, type Difficulty } from '../engine/OrderManager';

// === Types ===
export interface BoardItem {
  id: string;
  chain: string;
  level: number;
}

export interface SourceState {
  chainId: string;
  level: number;        // 소스 업그레이드 레벨 (1~3)
  cooldownEnd: number;  // 쿨다운 종료 시각
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
// 소스 업그레이드 스펙
const SOURCE_SPECS = [
  { cooldown: 15_000, lv2Chance: 0,    doubleProdChance: 0,    upgradeCost: 0 },    // Lv1
  { cooldown: 10_000, lv2Chance: 0.20, doubleProdChance: 0,    upgradeCost: 100 },  // Lv2
  { cooldown: 7_000,  lv2Chance: 0.35, doubleProdChance: 0.10, upgradeCost: 500 },  // Lv3
];
const getSourceSpec = (level: number) => SOURCE_SPECS[Math.min(level - 1, 2)];

// 보드 확장 비용
const BOARD_EXPAND_COST: Record<number, number> = { 6: 500, 7: 2000 };

const createEmptyBoard = (size: number): (BoardItem | null)[][] =>
  Array(size).fill(null).map(() => Array(size).fill(null));

const cloneBoard = (board: (BoardItem | null)[][]): (BoardItem | null)[][] =>
  board.map(row => [...row]);

const findEmptyCells = (board: (BoardItem | null)[][], size: number): { r: number; c: number }[] => {
  const cells: { r: number; c: number }[] = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!board[r][c]) cells.push({ r, c });
  return cells;
};

const getRandomEmptyCell = (board: (BoardItem | null)[][], size: number) => {
  const cells = findEmptyCells(board, size);
  return cells.length > 0 ? cells[Math.floor(Math.random() * cells.length)] : null;
};

// === Store ===
interface GameStore {
  // Board
  board: (BoardItem | null)[][];
  boardSize: number;

  // Sources
  sources: SourceState[];

  // Orders
  orders: Order[];
  completedOrderCount: number;

  // Economy
  gold: number;
  fame: number;
  kingdomLevel: number;

  // Progression
  unlockedChains: string[];

  // UI
  floatingTexts: FloatingText[];
  levelUpMessage: string | null;
  deliveryAnimation: { characterEmoji: string; dialogue: string } | null;

  // Meta
  lastPlayedAt: number;

  // Actions
  tapSource: (chainId: string) => boolean;
  mergeItems: (fromR: number, fromC: number, toR: number, toC: number) => boolean;
  swapItems: (fromR: number, fromC: number, toR: number, toC: number) => void;
  moveItem: (fromR: number, fromC: number, toR: number, toC: number) => void;
  deliverOrder: (orderId: string) => boolean;
  canDeliver: (orderId: string) => boolean;
  skipOrder: (orderId: string) => void;
  trashItem: (r: number, c: number) => void;
  upgradeSource: (chainId: string) => boolean;
  getSourceUpgradeCost: (chainId: string) => number;
  expandBoard: () => boolean;
  getExpandCost: () => number | null;
  tickSources: () => void;
  addFloatingText: (text: string, x: number, y: number) => void;
  clearLevelUp: () => void;
  clearDelivery: () => void;
  save: () => void;
  load: () => void;
  resetGame: () => void;
  isSourceReady: (chainId: string) => boolean;
  getSourceCooldownRemaining: (chainId: string) => number;
  getAvailableSources: () => SourceState[];
  getIncomePerOrder: () => { easy: number; medium: number; hard: number };

  // FTUE
  ftueStep: number; // 0=done, 1~5=tutorial steps
  advanceFtue: () => void;
}

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
  floatingTexts: [],
  levelUpMessage: null,
  deliveryAnimation: null,
  lastPlayedAt: Date.now(),
  ftueStep: -1, // -1 = not initialized, will be set in load()

  // === 소스 탭 ===
  tapSource: (chainId) => {
    const { board, boardSize, sources } = get();
    const source = sources.find(s => s.chainId === chainId);
    if (!source || Date.now() < source.cooldownEnd) return false;

    const spec = getSourceSpec(source.level);
    const cell = getRandomEmptyCell(board, boardSize);
    if (!cell) return false;

    // Lv2 확률로 상위 아이템 생산
    const itemLevel = Math.random() < spec.lv2Chance ? 2 : 1;
    const item: BoardItem = { id: uid(), chain: chainId, level: itemLevel };
    const newBoard = cloneBoard(board);
    newBoard[cell.r][cell.c] = item;

    // 더블 생산 (Lv3 소스)
    if (spec.doubleProdChance > 0 && Math.random() < spec.doubleProdChance) {
      const cell2 = getRandomEmptyCell(newBoard, boardSize);
      if (cell2) {
        newBoard[cell2.r][cell2.c] = { id: uid(), chain: chainId, level: 1 };
      }
    }

    const newSources = sources.map(s =>
      s.chainId === chainId ? { ...s, cooldownEnd: Date.now() + spec.cooldown } : s
    );

    set({ board: newBoard, sources: newSources });

    // FTUE: 소스 탭 후 다음 단계
    if (get().ftueStep === 1) get().advanceFtue();
    return true;
  },

  // === 머지 ===
  mergeItems: (fromR, fromC, toR, toC) => {
    const { board } = get();
    const from = board[fromR]?.[fromC];
    const to = board[toR]?.[toC];
    if (!from || !to) return false;
    if (from.chain !== to.chain || from.level !== to.level) return false;
    if (from.level >= MAX_CHAIN_LEVEL) return false;

    const newLevel = from.level + 1;
    const merged: BoardItem = { id: uid(), chain: from.chain, level: newLevel };
    const newBoard = cloneBoard(board);
    newBoard[fromR][fromC] = null;
    newBoard[toR][toC] = merged;

    const chainItem = getChainItem(from.chain, newLevel);
    set({ board: newBoard });

    if (chainItem) {
      get().addFloatingText(`${chainItem.emoji} ${chainItem.name}!`, toC, toR);
    }
    if (get().ftueStep === 2) get().advanceFtue();
    return true;
  },

  swapItems: (fromR, fromC, toR, toC) => {
    const b = cloneBoard(get().board);
    [b[fromR][fromC], b[toR][toC]] = [b[toR][toC], b[fromR][fromC]];
    set({ board: b });
  },

  moveItem: (fromR, fromC, toR, toC) => {
    const b = cloneBoard(get().board);
    b[toR][toC] = b[fromR][fromC];
    b[fromR][fromC] = null;
    set({ board: b });
  },

  // === 주문 ===
  canDeliver: (orderId) => {
    const { orders, board, boardSize } = get();
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    const available: Record<string, number> = {};
    for (let r = 0; r < boardSize; r++)
      for (let c = 0; c < boardSize; c++) {
        const item = board[r]?.[c];
        if (item) {
          const key = `${item.chain}-${item.level}`;
          available[key] = (available[key] || 0) + 1;
        }
      }

    for (const req of order.items) {
      const key = `${req.chain}-${req.level}`;
      if ((available[key] || 0) < req.quantity) return false;
      available[key] -= req.quantity;
    }
    return true;
  },

  deliverOrder: (orderId) => {
    const { orders, board, boardSize, completedOrderCount, unlockedChains, kingdomLevel } = get();
    const order = orders.find(o => o.id === orderId);
    if (!order || !get().canDeliver(orderId)) return false;

    const newBoard = cloneBoard(board);
    for (const req of order.items) {
      let remaining = req.quantity;
      for (let r = 0; r < boardSize && remaining > 0; r++)
        for (let c = 0; c < boardSize && remaining > 0; c++) {
          const item = newBoard[r]?.[c];
          if (item && item.chain === req.chain && item.level === req.level) {
            newBoard[r][c] = null;
            remaining--;
          }
        }
    }

    const newCount = completedOrderCount + 1;
    const newFame = get().fame + order.fameReward;
    const newKingdomLevel = getKingdomLevel(newFame);

    // 해금 체크
    let newUnlockedChains = [...unlockedChains];
    let levelUpMsg: string | null = null;
    if (newKingdomLevel > kingdomLevel) {
      const nextDef = getNextLevelDef(kingdomLevel);
      levelUpMsg = nextDef ? `⭐ Lv.${newKingdomLevel}! ${nextDef.unlocks.join(', ')}` : `⭐ Lv.${newKingdomLevel}!`;

      // 체인 해금
      for (const chain of CHAINS) {
        if (chain.unlockLevel <= newKingdomLevel && !newUnlockedChains.includes(chain.id)) {
          newUnlockedChains.push(chain.id);
        }
      }
    }

    // 새 소스 해금
    let newSources = [...get().sources];
    for (const chain of CHAINS) {
      if (chain.unlockLevel <= newKingdomLevel && !newSources.find(s => s.chainId === chain.id)) {
        newSources.push({ chainId: chain.id, level: 1, cooldownEnd: 0 });
      }
    }

    // 즉시 같은 난이도 새 주문 (Hard 게이팅 적용)
    const gatedDiff = gateDifficulty(order.difficulty, newKingdomLevel);
    const newOrder = generateOrder(gatedDiff, newKingdomLevel, newUnlockedChains, order.characterId);
    const newOrders = orders.map(o => o.id === orderId ? newOrder : o);

    // 캐릭터 감사 대사
    const char = getCharacter(order.characterId);
    const thankDialogue = char?.thankDialogues[Math.floor(Math.random() * (char.thankDialogues.length || 1))] || '고마워!';

    set({
      board: newBoard,
      gold: get().gold + order.coinReward,
      fame: newFame,
      kingdomLevel: newKingdomLevel,
      orders: newOrders,
      completedOrderCount: newCount,
      unlockedChains: newUnlockedChains,
      sources: newSources,
      levelUpMessage: levelUpMsg,
      deliveryAnimation: { characterEmoji: order.characterEmoji, dialogue: thankDialogue },
    });

    get().addFloatingText(`+${order.coinReward} 🪙 +${order.fameReward} ⭐`, 2, 0);
    if (get().ftueStep === 3) get().advanceFtue();
    return true;
  },

  skipOrder: (orderId) => {
    const { orders, kingdomLevel, unlockedChains } = get();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const newOrder = generateOrder(order.difficulty, kingdomLevel, unlockedChains, order.characterId);
    set({ orders: orders.map(o => o.id === orderId ? newOrder : o) });
  },

  trashItem: (r, c) => {
    const b = cloneBoard(get().board);
    b[r][c] = null;
    set({ board: b });
  },

  // === 소스 업그레이드 ===
  upgradeSource: (chainId) => {
    const { sources, gold } = get();
    const source = sources.find(s => s.chainId === chainId);
    if (!source || source.level >= 3) return false;
    const nextSpec = getSourceSpec(source.level + 1);
    if (gold < nextSpec.upgradeCost) return false;
    const newSources = sources.map(s =>
      s.chainId === chainId ? { ...s, level: s.level + 1 } : s
    );
    set({ sources: newSources, gold: gold - nextSpec.upgradeCost });
    return true;
  },

  getSourceUpgradeCost: (chainId) => {
    const source = get().sources.find(s => s.chainId === chainId);
    if (!source || source.level >= 3) return 0;
    return getSourceSpec(source.level + 1).upgradeCost;
  },

  // === 보드 확장 ===
  expandBoard: () => {
    const { board, boardSize, gold, kingdomLevel } = get();
    const newSize = boardSize + 1;
    const cost = BOARD_EXPAND_COST[newSize];
    if (!cost || gold < cost) return false;
    // Kingdom Lv.5 → 6×6, Lv.9 → 7×7
    if (newSize === 6 && kingdomLevel < 5) return false;
    if (newSize === 7 && kingdomLevel < 9) return false;
    const newBoard = Array(newSize).fill(null).map((_, r) =>
      Array(newSize).fill(null).map((_, c) => (r < boardSize && c < boardSize ? board[r]?.[c] : null))
    );
    set({ board: newBoard, boardSize: newSize, gold: gold - cost });
    return true;
  },

  getExpandCost: () => {
    const { boardSize, kingdomLevel } = get();
    const nextSize = boardSize + 1;
    if (nextSize === 6 && kingdomLevel >= 5) return BOARD_EXPAND_COST[6];
    if (nextSize === 7 && kingdomLevel >= 9) return BOARD_EXPAND_COST[7];
    return null;
  },

  // === FTUE ===
  advanceFtue: () => {
    const { ftueStep } = get();
    const next = ftueStep >= 4 ? 0 : ftueStep + 1;
    set({ ftueStep: next });
  },

  // === Tick ===
  tickSources: () => {
    // 소스 쿨다운은 timestamp 기반이므로 별도 tick 불필요
    // UI 갱신을 위한 dummy set
    set({});
  },

  // === UI ===
  addFloatingText: (text, x, y) => {
    const id = Date.now() + Math.random();
    set(s => ({ floatingTexts: [...s.floatingTexts, { id, text, x, y }] }));
    setTimeout(() => set(s => ({ floatingTexts: s.floatingTexts.filter(t => t.id !== id) })), 1500);
  },

  clearLevelUp: () => set({ levelUpMessage: null }),
  clearDelivery: () => set({ deliveryAnimation: null }),

  isSourceReady: (chainId) => {
    const source = get().sources.find(s => s.chainId === chainId);
    return !!source && Date.now() >= source.cooldownEnd;
  },

  getSourceCooldownRemaining: (chainId) => {
    const source = get().sources.find(s => s.chainId === chainId);
    if (!source) return 0;
    return Math.max(0, Math.ceil((source.cooldownEnd - Date.now()) / 1000));
  },

  getAvailableSources: () => get().sources,

  getIncomePerOrder: () => ({ easy: 10, medium: 25, hard: 60 }),

  // === Save/Load ===
  save: () => {
    const s = get();
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      board: s.board,
      boardSize: s.boardSize,
      sources: s.sources,
      orders: s.orders,
      completedOrderCount: s.completedOrderCount,
      gold: s.gold,
      fame: s.fame,
      kingdomLevel: s.kingdomLevel,
      unlockedChains: s.unlockedChains,
      ftueStep: s.ftueStep,
      lastPlayedAt: Date.now(),
    }));
  },

  load: () => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      // 첫 시작: FTUE + 초기 주문
      const { kingdomLevel, unlockedChains } = get();
      set({ orders: generateInitialOrders(kingdomLevel, unlockedChains), ftueStep: 1 });
      return;
    }
    try {
      const d = JSON.parse(raw);
      set({
        board: d.board || createEmptyBoard(BOARD_SIZE),
        boardSize: d.boardSize || BOARD_SIZE,
        sources: d.sources || get().sources,
        orders: d.orders || [],
        completedOrderCount: d.completedOrderCount || 0,
        gold: d.gold || 0,
        fame: d.fame || 0,
        kingdomLevel: d.kingdomLevel || 1,
        unlockedChains: d.unlockedChains || ['wood', 'stone'],
        ftueStep: d.ftueStep ?? 0,
        lastPlayedAt: d.lastPlayedAt || Date.now(),
      });

      // 빈 주문 슬롯 채우기
      const { kingdomLevel: kl, unlockedChains: uc, orders } = get();
      if (orders.length < 4) {
        const newOrders = [...orders];
        while (newOrders.length < 4) {
          const diff = SLOT_DIFFICULTIES[newOrders.length];
          newOrders.push(generateOrder(diff, kl, uc));
        }
        set({ orders: newOrders });
      }

      // 오프라인 보상
      if (d.lastPlayedAt) {
        const elapsed = Math.min((Date.now() - d.lastPlayedAt) / 1000, 8 * 3600);
        const offlineGold = Math.min(300, Math.floor(elapsed / 60 * 0.5));
        if (offlineGold > 0) {
          set(s => ({ gold: s.gold + offlineGold }));
          setTimeout(() => get().addFloatingText(`오프라인 보상: +${offlineGold} 🪙`, 2, 2), 500);
        }
      }
    } catch { /* corrupt save */ }
  },

  resetGame: () => {
    localStorage.removeItem(SAVE_KEY);
    const orders = generateInitialOrders(1, ['wood', 'stone']);
    set({
      board: createEmptyBoard(BOARD_SIZE),
      boardSize: BOARD_SIZE,
      sources: [
        { chainId: 'wood', level: 1, cooldownEnd: 0 },
        { chainId: 'stone', level: 1, cooldownEnd: 0 },
      ],
      orders,
      completedOrderCount: 0,
      gold: 0,
      fame: 0,
      kingdomLevel: 1,
      unlockedChains: ['wood', 'stone'],
      floatingTexts: [],
      levelUpMessage: null,
      deliveryAnimation: null,
      lastPlayedAt: Date.now(),
    });
  },
}));

export default useGameStore;
