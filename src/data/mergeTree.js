// === 진화 트리 정의 ===

export const TREES = [
  {
    id: 'animal',
    name: '동물',
    icon: '🐾',
    unlockCost: 0, // 기본 해금
    items: [
      { level: 1, emoji: '🥚', name: '알',      coinsPerSec: 0.1,  mergeBonus: 5    },
      { level: 2, emoji: '🐣', name: '병아리',  coinsPerSec: 0.3,  mergeBonus: 15   },
      { level: 3, emoji: '🐥', name: '아기새',  coinsPerSec: 0.8,  mergeBonus: 40   },
      { level: 4, emoji: '🐔', name: '닭',      coinsPerSec: 2.0,  mergeBonus: 100  },
      { level: 5, emoji: '🦅', name: '독수리',  coinsPerSec: 5.0,  mergeBonus: 250  },
      { level: 6, emoji: '🐉', name: '드래곤',  coinsPerSec: 15.0, mergeBonus: 700  },
      { level: 7, emoji: '👑', name: '킹',      coinsPerSec: 50.0, mergeBonus: 2000 },
    ],
  },
  {
    id: 'plant',
    name: '식물',
    icon: '🌿',
    unlockCost: 2000,
    items: [
      { level: 1, emoji: '🌱', name: '새싹',    coinsPerSec: 0.12, mergeBonus: 6    },
      { level: 2, emoji: '☘️', name: '클로버',  coinsPerSec: 0.35, mergeBonus: 18   },
      { level: 3, emoji: '🌿', name: '허브',    coinsPerSec: 0.9,  mergeBonus: 45   },
      { level: 4, emoji: '🌻', name: '해바라기', coinsPerSec: 2.2,  mergeBonus: 110  },
      { level: 5, emoji: '🌴', name: '야자수',  coinsPerSec: 5.5,  mergeBonus: 280  },
      { level: 6, emoji: '🎄', name: '세계수',  coinsPerSec: 16.0, mergeBonus: 750  },
      { level: 7, emoji: '🌸', name: '만개',    coinsPerSec: 55.0, mergeBonus: 2200 },
    ],
  },
  {
    id: 'building',
    name: '건물',
    icon: '🏗️',
    unlockCost: 8000,
    items: [
      { level: 1, emoji: '🧱', name: '벽돌',    coinsPerSec: 0.15, mergeBonus: 8    },
      { level: 2, emoji: '⛺', name: '텐트',    coinsPerSec: 0.4,  mergeBonus: 20   },
      { level: 3, emoji: '🏠', name: '집',      coinsPerSec: 1.0,  mergeBonus: 50   },
      { level: 4, emoji: '🏢', name: '빌딩',    coinsPerSec: 2.5,  mergeBonus: 120  },
      { level: 5, emoji: '🏰', name: '성',      coinsPerSec: 6.0,  mergeBonus: 300  },
      { level: 6, emoji: '🗼', name: '탑',      coinsPerSec: 18.0, mergeBonus: 800  },
      { level: 7, emoji: '🌆', name: '도시',    coinsPerSec: 60.0, mergeBonus: 2500 },
    ],
  },
];

// === 하위 호환 API ===
export const MERGE_TREE = TREES[0].items;
export const MAX_LEVEL = 7;

export const getItem = (level) => MERGE_TREE[level - 1];

export const getTreeItem = (treeId, level) => {
  const tree = TREES.find(t => t.id === treeId);
  if (!tree) return MERGE_TREE[level - 1]; // fallback
  return tree.items[level - 1];
};

export const getTreeById = (treeId) => TREES.find(t => t.id === treeId);
