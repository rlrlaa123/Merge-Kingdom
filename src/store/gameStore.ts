import { create } from 'zustand';
import { CHAINS, getChainItem, MAX_CHAIN_LEVEL } from '../data/chains';
import { getKingdomLevel, getNextLevelDef } from '../data/levels';
import { getCharacter } from '../data/characters';
import { generateOrder, generateInitialOrders, SLOT_DIFFICULTIES, type Order, type Difficulty } from '../engine/OrderManager';

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
const SOURCE_COOLDOWN = 15_000; // 15초

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

  // === 소스 탭 ===
  tapSource: (chainId) => {
    const { board, boardSize, sources } = get();
    const source = sources.find(s => s.chainId === chainId);
    if (!source || Date.now() < source.cooldownEnd) return false;

    const cell = getRandomEmptyCell(board, boardSize);
    if (!cell) return false;

    const item: BoardItem = { id: uid(), chain: chainId, level: 1 };
    const newBoard = cloneBoard(board);
    newBoard[cell.r][cell.c] = item;

    const newSources = sources.map(s =>
      s.chainId === chainId ? { ...s, cooldownEnd: Date.now() + SOURCE_COOLDOWN } : s
    );

    set({ board: newBoard, sources: newSources });
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

    // 즉시 같은 난이도 새 주문
    const newOrder = generateOrder(order.difficulty, newKingdomLevel, newUnlockedChains, order.characterId);
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
      lastPlayedAt: Date.now(),
    }));
  },

  load: () => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      // 첫 시작: 초기 주문 생성
      const { kingdomLevel, unlockedChains } = get();
      set({ orders: generateInitialOrders(kingdomLevel, unlockedChains) });
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
