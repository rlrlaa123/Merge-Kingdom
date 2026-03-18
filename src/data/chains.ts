// 머지 체인 정의 — Phase 1: Wood + Stone

export interface ChainItem {
  id: string;       // e.g. 'wood-1'
  chain: string;    // 'wood' | 'stone' | ...
  level: number;
  emoji: string;
  name: string;
}

export interface Chain {
  id: string;
  name: string;
  sourceEmoji: string;
  sourceName: string;
  items: ChainItem[];
  unlockLevel: number; // Kingdom Level
}

export const CHAINS: Chain[] = [
  {
    id: 'wood',
    name: '나무',
    sourceEmoji: '🌳',
    sourceName: '나무',
    unlockLevel: 1,
    items: [
      { id: 'wood-1', chain: 'wood', level: 1, emoji: '🪵', name: '나뭇가지' },
      { id: 'wood-2', chain: 'wood', level: 2, emoji: '🪓', name: '통나무' },
      { id: 'wood-3', chain: 'wood', level: 3, emoji: '🪑', name: '목재' },
      { id: 'wood-4', chain: 'wood', level: 4, emoji: '🛡️', name: '나무방패' },
      { id: 'wood-5', chain: 'wood', level: 5, emoji: '🏗️', name: '건축자재' },
    ],
  },
  {
    id: 'stone',
    name: '돌',
    sourceEmoji: '⛰️',
    sourceName: '돌산',
    unlockLevel: 1,
    items: [
      { id: 'stone-1', chain: 'stone', level: 1, emoji: '🪨', name: '돌조각' },
      { id: 'stone-2', chain: 'stone', level: 2, emoji: '🧱', name: '벽돌' },
      { id: 'stone-3', chain: 'stone', level: 3, emoji: '⚒️', name: '석재' },
      { id: 'stone-4', chain: 'stone', level: 4, emoji: '🏰', name: '성벽블록' },
      { id: 'stone-5', chain: 'stone', level: 5, emoji: '🗿', name: '조각상' },
    ],
  },
  {
    id: 'wheat',
    name: '밀',
    sourceEmoji: '🌾',
    sourceName: '밀밭',
    unlockLevel: 2,
    items: [
      { id: 'wheat-1', chain: 'wheat', level: 1, emoji: '🌿', name: '밀줄기' },
      { id: 'wheat-2', chain: 'wheat', level: 2, emoji: '🌾', name: '밀다발' },
      { id: 'wheat-3', chain: 'wheat', level: 3, emoji: '🫘', name: '밀가루' },
      { id: 'wheat-4', chain: 'wheat', level: 4, emoji: '🍞', name: '빵' },
      { id: 'wheat-5', chain: 'wheat', level: 5, emoji: '🎂', name: '케이크' },
    ],
  },
  {
    id: 'iron',
    name: '철',
    sourceEmoji: '⛏️',
    sourceName: '광산',
    unlockLevel: 4,
    items: [
      { id: 'iron-1', chain: 'iron', level: 1, emoji: '🔩', name: '철조각' },
      { id: 'iron-2', chain: 'iron', level: 2, emoji: '⚙️', name: '철봉' },
      { id: 'iron-3', chain: 'iron', level: 3, emoji: '🔧', name: '도구' },
      { id: 'iron-4', chain: 'iron', level: 4, emoji: '⚔️', name: '검' },
      { id: 'iron-5', chain: 'iron', level: 5, emoji: '👑', name: '왕관' },
    ],
  },
  {
    id: 'magic',
    name: '마법',
    sourceEmoji: '🔮',
    sourceName: '마법샘',
    unlockLevel: 7,
    items: [
      { id: 'magic-1', chain: 'magic', level: 1, emoji: '✨', name: '마법가루' },
      { id: 'magic-2', chain: 'magic', level: 2, emoji: '🧪', name: '물약재료' },
      { id: 'magic-3', chain: 'magic', level: 3, emoji: '🧫', name: '물약' },
      { id: 'magic-4', chain: 'magic', level: 4, emoji: '📜', name: '마법스크롤' },
      { id: 'magic-5', chain: 'magic', level: 5, emoji: '🪄', name: '마법지팡이' },
    ],
  },
  {
    id: 'gem',
    name: '보석',
    sourceEmoji: '💎',
    sourceName: '보석동굴',
    unlockLevel: 10,
    items: [
      { id: 'gem-1', chain: 'gem', level: 1, emoji: '💠', name: '원석조각' },
      { id: 'gem-2', chain: 'gem', level: 2, emoji: '💎', name: '원석' },
      { id: 'gem-3', chain: 'gem', level: 3, emoji: '🔵', name: '가공보석' },
      { id: 'gem-4', chain: 'gem', level: 4, emoji: '💍', name: '반지' },
      { id: 'gem-5', chain: 'gem', level: 5, emoji: '🏆', name: '왕실보물' },
    ],
  },
];

export const MAX_CHAIN_LEVEL = 5;

export const getChain = (chainId: string) => CHAINS.find(c => c.id === chainId);

export const getChainItem = (chainId: string, level: number): ChainItem | undefined => {
  const chain = getChain(chainId);
  return chain?.items[level - 1];
};

export const getMergeResult = (chainId: string, level: number): ChainItem | undefined => {
  if (level >= MAX_CHAIN_LEVEL) return undefined;
  return getChainItem(chainId, level + 1);
};
