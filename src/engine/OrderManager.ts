import { getAvailableCharacters, type Character } from '../data/characters';
import { CHAINS, getChainItem, type ChainItem } from '../data/chains';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface OrderItem {
  chain: string;
  level: number;
  emoji: string;
  name: string;
  quantity: number;
}

export interface Order {
  id: string;
  characterId: string;
  characterEmoji: string;
  characterName: string;
  dialogue: string;
  items: OrderItem[];
  coinReward: number;
  fameReward: number;
  difficulty: Difficulty;
  delivered: boolean; // 납품 완료 여부
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// 주문 슬롯 난이도 배치 (GDD: 1 easy, 2 medium, 1 hard)
export const SLOT_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'medium', 'hard'];

// 난이도별 주문 파라미터
interface DiffSpec {
  maxLevel: number;
  minItems: number;
  maxItems: number;
  coinBase: number;
  fameBase: number;
  rewardMult: number;
}

const getDiffSpec = (difficulty: Difficulty, kingdomLevel: number): DiffSpec => {
  const levelCap = Math.min(5, 1 + Math.floor(kingdomLevel * 0.6));
  switch (difficulty) {
    case 'easy':
      return { maxLevel: Math.min(2, levelCap), minItems: 1, maxItems: 2, coinBase: 10, fameBase: 5, rewardMult: 1 };
    case 'medium':
      return { maxLevel: Math.min(3, levelCap), minItems: 1, maxItems: 3, coinBase: 25, fameBase: 12, rewardMult: 2 };
    case 'hard':
      return { maxLevel: Math.min(4, levelCap), minItems: 2, maxItems: 3, coinBase: 60, fameBase: 30, rewardMult: 4 };
  }
};

export const generateOrder = (
  difficulty: Difficulty,
  kingdomLevel: number,
  unlockedChains: string[],
  lastCharId?: string,
): Order => {
  const spec = getDiffSpec(difficulty, kingdomLevel);
  const availableChars = getAvailableCharacters(kingdomLevel).filter(c => c.id !== lastCharId);

  let char: Character;
  const matchingChars = availableChars.filter(c => c.preferredChains.some(ch => unlockedChains.includes(ch)));
  char = pick(matchingChars.length > 0 ? matchingChars : availableChars);

  const usableChains = char.preferredChains.filter(ch => unlockedChains.includes(ch));
  const chains = usableChains.length > 0 ? usableChains : unlockedChains;
  const itemCount = randInt(spec.minItems, spec.maxItems);
  const items: OrderItem[] = [];
  const mustMultiChain = difficulty === 'hard' && chains.length >= 2;

  for (let i = 0; i < itemCount; i++) {
    let chain: string;
    if (mustMultiChain && i < 2) {
      const usedChains = items.map(it => it.chain);
      const remaining = chains.filter(c => !usedChains.includes(c));
      chain = remaining.length > 0 ? pick(remaining) : pick(chains);
    } else {
      chain = pick(chains);
    }
    const level = randInt(1, spec.maxLevel);
    const chainItem = getChainItem(chain, level);
    if (!chainItem) continue;
    const existing = items.find(it => it.chain === chain && it.level === level);
    if (existing) { existing.quantity += 1; }
    else { items.push({ chain, level, emoji: chainItem.emoji, name: chainItem.name, quantity: 1 }); }
  }

  const tapCost = items.reduce((sum, it) => sum + Math.pow(2, it.level - 1) * it.quantity, 0);
  const coinReward = Math.floor(spec.coinBase * (1 + tapCost * 0.2) * spec.rewardMult);
  const fameReward = Math.floor(spec.fameBase * (1 + tapCost * 0.1));

  return {
    id: uid(), characterId: char.id, characterEmoji: char.emoji,
    characterName: char.name, dialogue: pick(char.dialogues),
    items, coinReward, fameReward, difficulty, delivered: false,
  };
};

// Hard 주문은 Kingdom Lv.3부터
export const gateDifficulty = (diff: Difficulty, kingdomLevel: number): Difficulty => {
  if (diff === 'hard' && kingdomLevel < 3) return 'medium';
  return diff;
};

// 일반 배치 생성 (4개 주문 한 세트)
export const generateOrderBatch = (kingdomLevel: number, unlockedChains: string[]): Order[] => {
  const orders: Order[] = [];
  let lastCharId: string | undefined;
  for (const diff of SLOT_DIFFICULTIES) {
    const gated = gateDifficulty(diff, kingdomLevel);
    const order = generateOrder(gated, kingdomLevel, unlockedChains, lastCharId);
    orders.push(order);
    lastCharId = order.characterId;
  }
  return orders;
};

// 튜토리얼 첫 주문 세트 (FTUE 연동)
// 첫 번째 주문: 🪵 나뭇가지 ×1 (소스 탭 → 바로 납품 가능)
// 두 번째 주문: 🪓 통나무 ×1 (머지 필요 — FTUE step 2)
// 세 번째 주문: 🪨 돌조각 ×2 (두 번째 소스 사용 유도)
// 네 번째 주문: 🧱 벽돌 ×1 (돌 머지 유도)
export const generateTutorialOrders = (): Order[] => {
  const woodLv1 = getChainItem('wood', 1)!;
  const woodLv2 = getChainItem('wood', 2)!;
  const stoneLv1 = getChainItem('stone', 1)!;
  const stoneLv2 = getChainItem('stone', 2)!;

  return [
    {
      id: uid(), characterId: 'tom', characterEmoji: '🧑‍🌾', characterName: '톰',
      dialogue: '나뭇가지 하나만 가져다줘!',
      items: [{ chain: 'wood', level: 1, emoji: woodLv1.emoji, name: woodLv1.name, quantity: 1 }],
      coinReward: 5, fameReward: 3, difficulty: 'easy', delivered: false,
    },
    {
      id: uid(), characterId: 'tom', characterEmoji: '🧑‍🌾', characterName: '톰',
      dialogue: '통나무가 필요해. 나뭇가지 두 개를 합쳐봐!',
      items: [{ chain: 'wood', level: 2, emoji: woodLv2.emoji, name: woodLv2.name, quantity: 1 }],
      coinReward: 10, fameReward: 5, difficulty: 'easy', delivered: false,
    },
    {
      id: uid(), characterId: 'karl', characterEmoji: '🏗️', characterName: '카를',
      dialogue: '돌이 좀 필요하네.',
      items: [{ chain: 'stone', level: 1, emoji: stoneLv1.emoji, name: stoneLv1.name, quantity: 2 }],
      coinReward: 8, fameReward: 4, difficulty: 'easy', delivered: false,
    },
    {
      id: uid(), characterId: 'karl', characterEmoji: '🏗️', characterName: '카를',
      dialogue: '벽돌을 만들어 줄 수 있겠나?',
      items: [{ chain: 'stone', level: 2, emoji: stoneLv2.emoji, name: stoneLv2.name, quantity: 1 }],
      coinReward: 10, fameReward: 5, difficulty: 'easy', delivered: false,
    },
  ];
};

// 하위 호환 — 이전 코드에서 사용하던 이름 유지
export const generateInitialOrders = generateTutorialOrders;
