// 주문 난이도 티어 (6단계)
export const ORDER_TIERS = [
  { maxLevel: 2, minItems: 1, maxItems: 1, coinBase: 30,   fameBase: 5,   label: '초보 주문' },   // tier 0: 0~5회
  { maxLevel: 2, minItems: 1, maxItems: 2, coinBase: 60,   fameBase: 10,  label: '일반 주문' },   // tier 1: 6~15회
  { maxLevel: 3, minItems: 1, maxItems: 3, coinBase: 150,  fameBase: 20,  label: '마을 주문' },   // tier 2: 16~30회
  { maxLevel: 4, minItems: 2, maxItems: 3, coinBase: 350,  fameBase: 35,  label: '도시 주문' },   // tier 3: 31~50회
  { maxLevel: 5, minItems: 2, maxItems: 4, coinBase: 800,  fameBase: 60,  label: '왕국 주문' },   // tier 4: 51~80회
  { maxLevel: 6, minItems: 2, maxItems: 4, coinBase: 1800, fameBase: 100, label: '전설 주문' },   // tier 5: 81+
];

const uid = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const getTier = (totalDeliveries) => {
  if (totalDeliveries <= 5) return 0;
  if (totalDeliveries <= 15) return 1;
  if (totalDeliveries <= 30) return 2;
  if (totalDeliveries <= 50) return 3;
  if (totalDeliveries <= 80) return 4;
  return 5;
};

// 난이도 롤: easy 50%, normal 35%, hard 15%
export const rollDifficulty = () => {
  const r = Math.random();
  if (r < 0.50) return 'easy';
  if (r < 0.85) return 'normal';
  return 'hard';
};

export const generateOrder = (totalDeliveries, unlockedTrees, difficulty = 'normal') => {
  let tierIdx = getTier(totalDeliveries);
  if (difficulty === 'easy') tierIdx = Math.max(0, tierIdx - 1);
  if (difficulty === 'hard') tierIdx = Math.min(ORDER_TIERS.length - 1, tierIdx + 1);

  const tier = ORDER_TIERS[tierIdx];
  const trees = unlockedTrees.length > 0 ? unlockedTrees : ['animal'];
  const itemCount = randInt(tier.minItems, tier.maxItems);

  const requirements = [];
  for (let i = 0; i < itemCount; i++) {
    const tree = randomPick(trees);
    const level = randInt(1, tier.maxLevel);
    const existing = requirements.find(r => r.tree === tree && r.level === level);
    if (existing) {
      existing.count += 1;
    } else {
      requirements.push({ tree, level, count: 1 });
    }
  }

  const levelSum = requirements.reduce((sum, r) => sum + r.level * r.count, 0);
  const coinReward = Math.floor(tier.coinBase * (1 + levelSum * 0.3));
  const fameReward = Math.floor(tier.fameBase * (1 + levelSum * 0.15));
  const multiplier = difficulty === 'hard' ? 2 : 1;

  return {
    id: uid(),
    requirements,
    coinReward: coinReward * multiplier,
    fameReward: fameReward * multiplier,
    difficulty,
    label: tier.label,
    createdAt: Date.now(),
  };
};
