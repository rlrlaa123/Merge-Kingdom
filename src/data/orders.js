// 주문 난이도 티어 (납품 횟수 기반)
export const ORDER_TIERS = [
  // tier 0: 튜토리얼 (0~5회)
  { maxDeliveries: 5,  maxLevel: 2, minItems: 1, maxItems: 2, coinBase: 50,  fameBase: 10 },
  // tier 1: 초급 (6~15회)
  { maxDeliveries: 15, maxLevel: 3, minItems: 1, maxItems: 3, coinBase: 120, fameBase: 20 },
  // tier 2: 중급 (16~30회)
  { maxDeliveries: 30, maxLevel: 4, minItems: 2, maxItems: 3, coinBase: 300, fameBase: 35 },
  // tier 3: 고급 (31~50회)
  { maxDeliveries: 50, maxLevel: 5, minItems: 2, maxItems: 4, coinBase: 700, fameBase: 60 },
  // tier 4: 마스터 (51+)
  { maxDeliveries: Infinity, maxLevel: 6, minItems: 2, maxItems: 4, coinBase: 1500, fameBase: 100 },
];

const uid = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 4);

export const getTier = (totalDeliveries) => {
  for (const tier of ORDER_TIERS) {
    if (totalDeliveries <= tier.maxDeliveries) return tier;
  }
  return ORDER_TIERS[ORDER_TIERS.length - 1];
};

export const generateOrder = (totalDeliveries, unlockedTrees) => {
  const tier = getTier(totalDeliveries);
  const trees = unlockedTrees.length > 0 ? unlockedTrees : ['animal'];

  // 요구 아이템 수 결정
  const itemCount = tier.minItems + Math.floor(Math.random() * (tier.maxItems - tier.minItems + 1));

  const requirements = [];
  let difficultyScore = 0;

  for (let i = 0; i < itemCount; i++) {
    const tree = trees[Math.floor(Math.random() * trees.length)];
    const level = 1 + Math.floor(Math.random() * tier.maxLevel);
    const count = level >= 4 ? 1 : (Math.random() < 0.4 ? 2 : 1);

    // 같은 트리+레벨 이미 있으면 수량 합산
    const existing = requirements.find(r => r.tree === tree && r.level === level);
    if (existing) {
      existing.count += count;
    } else {
      requirements.push({ tree, level, count });
    }
    difficultyScore += level * count;
  }

  const coinReward = Math.floor(tier.coinBase * (1 + difficultyScore * 0.3));
  const fameReward = Math.floor(tier.fameBase * (1 + difficultyScore * 0.15));

  return {
    id: uid(),
    requirements,
    coinReward,
    fameReward,
    createdAt: Date.now(),
  };
};
