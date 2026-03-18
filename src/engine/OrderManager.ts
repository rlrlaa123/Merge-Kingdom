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
  minTaps: number;    // 소스 탭 환산 하한
  maxTaps: number;
  coinBase: number;
  fameBase: number;
  rewardMult: number;
}

const getDiffSpec = (difficulty: Difficulty, kingdomLevel: number): DiffSpec => {
  // kingdomLevel에 따라 maxLevel 상한 조정
  const levelCap = Math.min(5, 1 + Math.floor(kingdomLevel * 0.6));

  switch (difficulty) {
    case 'easy':
      return {
        maxLevel: Math.min(2, levelCap),
        minItems: 1, maxItems: 2,
        minTaps: 2, maxTaps: 6,
        coinBase: 10, fameBase: 5,
        rewardMult: 1,
      };
    case 'medium':
      return {
        maxLevel: Math.min(3, levelCap),
        minItems: 1, maxItems: 3,
        minTaps: 8, maxTaps: 16,
        coinBase: 25, fameBase: 12,
        rewardMult: 2,
      };
    case 'hard':
      return {
        maxLevel: Math.min(4, levelCap),
        minItems: 2, maxItems: 3,
        minTaps: 20, maxTaps: 40,
        coinBase: 60, fameBase: 30,
        rewardMult: 4,
      };
  }
};

export const generateOrder = (
  difficulty: Difficulty,
  kingdomLevel: number,
  unlockedChains: string[],
  lastCharId?: string,
): Order => {
  const spec = getDiffSpec(difficulty, kingdomLevel);
  const availableChars = getAvailableCharacters(kingdomLevel)
    .filter(c => c.id !== lastCharId);

  // 캐릭터 선택 — preferredChains가 해금된 체인과 겹치는 캐릭터 우선
  let char: Character;
  const matchingChars = availableChars.filter(c =>
    c.preferredChains.some(ch => unlockedChains.includes(ch))
  );
  char = pick(matchingChars.length > 0 ? matchingChars : availableChars);

  // 아이템 생성 — 캐릭터의 선호 체인에서 선택
  const usableChains = char.preferredChains.filter(ch => unlockedChains.includes(ch));
  const chains = usableChains.length > 0 ? usableChains : unlockedChains;

  const itemCount = randInt(spec.minItems, spec.maxItems);
  const items: OrderItem[] = [];

  // hard 주문은 반드시 2개 이상 다른 체인
  const mustMultiChain = difficulty === 'hard' && chains.length >= 2;

  for (let i = 0; i < itemCount; i++) {
    let chain: string;
    if (mustMultiChain && i < 2) {
      // 처음 2개는 다른 체인 강제
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
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({
        chain,
        level,
        emoji: chainItem.emoji,
        name: chainItem.name,
        quantity: 1,
      });
    }
  }

  // 보상 계산
  const tapCost = items.reduce((sum, it) => sum + Math.pow(2, it.level - 1) * it.quantity, 0);
  const coinReward = Math.floor(spec.coinBase * (1 + tapCost * 0.2) * spec.rewardMult);
  const fameReward = Math.floor(spec.fameBase * (1 + tapCost * 0.1));

  return {
    id: uid(),
    characterId: char.id,
    characterEmoji: char.emoji,
    characterName: char.name,
    dialogue: pick(char.dialogues),
    items,
    coinReward,
    fameReward,
    difficulty,
  };
};

// 초기 4개 주문 생성
export const generateInitialOrders = (kingdomLevel: number, unlockedChains: string[]): Order[] => {
  const orders: Order[] = [];
  let lastCharId: string | undefined;

  for (const diff of SLOT_DIFFICULTIES) {
    const order = generateOrder(diff, kingdomLevel, unlockedChains, lastCharId);
    orders.push(order);
    lastCharId = order.characterId;
  }
  return orders;
};
