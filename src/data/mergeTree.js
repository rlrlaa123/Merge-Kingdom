export const MERGE_TREE = [
  { level: 1, emoji: '🥚', name: '알',      coinsPerSec: 0.1,  mergeBonus: 5    },
  { level: 2, emoji: '🐣', name: '병아리',  coinsPerSec: 0.3,  mergeBonus: 15   },
  { level: 3, emoji: '🐥', name: '아기새',  coinsPerSec: 0.8,  mergeBonus: 40   },
  { level: 4, emoji: '🐔', name: '닭',      coinsPerSec: 2.0,  mergeBonus: 100  },
  { level: 5, emoji: '🦅', name: '독수리',  coinsPerSec: 5.0,  mergeBonus: 250  },
  { level: 6, emoji: '🐉', name: '드래곤',  coinsPerSec: 15.0, mergeBonus: 700  },
  { level: 7, emoji: '👑', name: '킹',      coinsPerSec: 50.0, mergeBonus: 2000 },
];

export const MAX_LEVEL = MERGE_TREE.length;
export const getItem = (level) => MERGE_TREE[level - 1];
