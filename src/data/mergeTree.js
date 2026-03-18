// === 진화 트리 정의 (Phase 5 밸런스 적용) ===

export const TREES = [
  {
    id: 'animal',
    name: '동물',
    icon: '🐾',
    unlockCost: 0,
    items: [
      { level: 1, emoji: '🥚', name: '알',      coinsPerSec: 0.5,  mergeBonus: 10   },
      { level: 2, emoji: '🐣', name: '병아리',  coinsPerSec: 1.2,  mergeBonus: 30   },
      { level: 3, emoji: '🐥', name: '아기새',  coinsPerSec: 2.5,  mergeBonus: 80   },
      { level: 4, emoji: '🐔', name: '닭',      coinsPerSec: 5.0,  mergeBonus: 200  },
      { level: 5, emoji: '🦅', name: '독수리',  coinsPerSec: 10.0, mergeBonus: 500  },
      { level: 6, emoji: '🐉', name: '드래곤',  coinsPerSec: 25.0, mergeBonus: 1500 },
      { level: 7, emoji: '👑', name: '킹',      coinsPerSec: 70.0, mergeBonus: 5000 },
    ],
  },
  {
    id: 'plant',
    name: '식물',
    icon: '🌿',
    unlockCost: 2000,
    items: [
      { level: 1, emoji: '🌱', name: '새싹',    coinsPerSec: 0.6,  mergeBonus: 12   },
      { level: 2, emoji: '☘️', name: '클로버',  coinsPerSec: 1.4,  mergeBonus: 35   },
      { level: 3, emoji: '🌿', name: '허브',    coinsPerSec: 2.8,  mergeBonus: 90   },
      { level: 4, emoji: '🌻', name: '해바라기', coinsPerSec: 5.5,  mergeBonus: 220  },
      { level: 5, emoji: '🌴', name: '야자수',  coinsPerSec: 11.0, mergeBonus: 550  },
      { level: 6, emoji: '🎄', name: '세계수',  coinsPerSec: 27.0, mergeBonus: 1650 },
      { level: 7, emoji: '🌸', name: '만개',    coinsPerSec: 77.0, mergeBonus: 5500 },
    ],
  },
  {
    id: 'building',
    name: '건물',
    icon: '🏗️',
    unlockCost: 8000,
    items: [
      { level: 1, emoji: '🧱', name: '벽돌',    coinsPerSec: 0.75, mergeBonus: 15   },
      { level: 2, emoji: '⛺', name: '텐트',    coinsPerSec: 1.6,  mergeBonus: 40   },
      { level: 3, emoji: '🏠', name: '집',      coinsPerSec: 3.2,  mergeBonus: 100  },
      { level: 4, emoji: '🏢', name: '빌딩',    coinsPerSec: 6.5,  mergeBonus: 250  },
      { level: 5, emoji: '🏰', name: '성',      coinsPerSec: 13.0, mergeBonus: 600  },
      { level: 6, emoji: '🗼', name: '탑',      coinsPerSec: 30.0, mergeBonus: 1800 },
      { level: 7, emoji: '🌆', name: '도시',    coinsPerSec: 85.0, mergeBonus: 6000 },
    ],
  },
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
