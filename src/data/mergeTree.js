// === 진화 트리 정의 (Phase 5 v2 — 주문 중심 밸런스) ===

export const TREES = [
  {
    id: 'animal',
    name: '동물',
    icon: '🐾',
    items: [
      { level: 1, emoji: '🥚', name: '알',      coinsPerSec: 0.2,  mergeBonus: 10   },
      { level: 2, emoji: '🐣', name: '병아리',  coinsPerSec: 0.5,  mergeBonus: 25   },
      { level: 3, emoji: '🐥', name: '아기새',  coinsPerSec: 1.0,  mergeBonus: 60   },
      { level: 4, emoji: '🐔', name: '닭',      coinsPerSec: 2.0,  mergeBonus: 150  },
      { level: 5, emoji: '🦅', name: '독수리',  coinsPerSec: 4.0,  mergeBonus: 400  },
      { level: 6, emoji: '🐉', name: '드래곤',  coinsPerSec: 10.0, mergeBonus: 1000 },
      { level: 7, emoji: '👑', name: '킹',      coinsPerSec: 30.0, mergeBonus: 3000 },
    ],
  },
  {
    id: 'plant',
    name: '식물',
    icon: '🌿',
    items: [
      { level: 1, emoji: '🌱', name: '새싹',    coinsPerSec: 0.25, mergeBonus: 12   },
      { level: 2, emoji: '☘️', name: '클로버',  coinsPerSec: 0.6,  mergeBonus: 28   },
      { level: 3, emoji: '🌿', name: '허브',    coinsPerSec: 1.2,  mergeBonus: 70   },
      { level: 4, emoji: '🌻', name: '해바라기', coinsPerSec: 2.2,  mergeBonus: 170  },
      { level: 5, emoji: '🌴', name: '야자수',  coinsPerSec: 4.5,  mergeBonus: 450  },
      { level: 6, emoji: '🎄', name: '세계수',  coinsPerSec: 11.0, mergeBonus: 1100 },
      { level: 7, emoji: '🌸', name: '만개',    coinsPerSec: 33.0, mergeBonus: 3300 },
    ],
  },
  {
    id: 'building',
    name: '건물',
    icon: '🏗️',
    items: [
      { level: 1, emoji: '🧱', name: '벽돌',    coinsPerSec: 0.3,  mergeBonus: 15   },
      { level: 2, emoji: '⛺', name: '텐트',    coinsPerSec: 0.7,  mergeBonus: 30   },
      { level: 3, emoji: '🏠', name: '집',      coinsPerSec: 1.4,  mergeBonus: 80   },
      { level: 4, emoji: '🏢', name: '빌딩',    coinsPerSec: 2.5,  mergeBonus: 200  },
      { level: 5, emoji: '🏰', name: '성',      coinsPerSec: 5.0,  mergeBonus: 500  },
      { level: 6, emoji: '🗼', name: '탑',      coinsPerSec: 12.0, mergeBonus: 1200 },
      { level: 7, emoji: '🌆', name: '도시',    coinsPerSec: 35.0, mergeBonus: 3500 },
    ],
  },
];

// 왕국 레벨 해금 테이블
export const KINGDOM_LEVELS = [
  { level: 1,  fame: 0,     unlock: null },
  { level: 2,  fame: 100,   unlock: { type: 'orderSlots', value: 4, desc: '주문 슬롯 4개' } },
  { level: 3,  fame: 300,   unlock: { type: 'tree', value: 'plant', desc: '🌿 식물 트리 해금' } },
  { level: 4,  fame: 600,   unlock: { type: 'special', value: 'golden', desc: '🥚✨ 골드 알 등장' } },
  { level: 5,  fame: 1000,  unlock: { type: 'grid', value: 6, desc: '🔲 그리드 6×6' } },
  { level: 6,  fame: 1800,  unlock: { type: 'tree', value: 'building', desc: '🏗️ 건물 트리 해금' } },
  { level: 7,  fame: 3000,  unlock: { type: 'special', value: 'wildcard', desc: '🃏 와일드카드 등장' } },
  { level: 8,  fame: 5000,  unlock: { type: 'grid', value: 7, desc: '🔲 그리드 7×7' } },
  { level: 9,  fame: 8000,  unlock: { type: 'vipOrders', value: true, desc: '👑 VIP 주문 해금' } },
  { level: 10, fame: 15000, unlock: { type: 'prestige', value: true, desc: '♻️ 프레스티지 해금' } },
];

export const MERGE_TREE = TREES[0].items;
export const MAX_LEVEL = 7;
export const getItem = (level) => MERGE_TREE[level - 1];
export const getTreeItem = (treeId, level) => {
  const tree = TREES.find(t => t.id === treeId);
  if (!tree) return MERGE_TREE[level - 1];
  return tree.items[level - 1];
};
export const getTreeById = (treeId) => TREES.find(t => t.id === treeId);
export const getKingdomLevel = (fame) => {
  let kl = KINGDOM_LEVELS[0];
  for (const kd of KINGDOM_LEVELS) {
    if (fame >= kd.fame) kl = kd;
    else break;
  }
  return kl;
};
export const getNextKingdomLevel = (currentLevel) => KINGDOM_LEVELS.find(k => k.level === currentLevel + 1) || null;
