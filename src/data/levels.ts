// Kingdom Level 정의

export interface KingdomLevelDef {
  level: number;
  fameRequired: number;
  unlocks: string[];
}

export const KINGDOM_LEVELS: KingdomLevelDef[] = [
  { level: 1,  fameRequired: 0,    unlocks: ['Wood + Stone 체인'] },
  { level: 2,  fameRequired: 50,   unlocks: ['🌾 Wheat 체인', '🧑‍🍳 미아 등장'] },
  { level: 3,  fameRequired: 150,  unlocks: ['🔴 Hard 주문', '🏗️ 카를 Hard 주문'] },
  { level: 4,  fameRequired: 300,  unlocks: ['⛏️ Iron 체인', '⚔️ 레온 등장'] },
  { level: 5,  fameRequired: 500,  unlocks: ['🔲 6×6 보드 확장 가능'] },
  { level: 6,  fameRequired: 800,  unlocks: ['🌀 와일드카드 해금'] },
  { level: 7,  fameRequired: 1200, unlocks: ['🔮 Magic 체인', '🧙 엘라 / 🧝 피오나 등장'] },
  { level: 8,  fameRequired: 1800, unlocks: ['⏰ 시간 제한 주문'] },
  { level: 9,  fameRequired: 2500, unlocks: ['🔲 7×7 보드 확장 가능'] },
  { level: 10, fameRequired: 3500, unlocks: ['💎 Gem 체인', '👑 국왕 등장'] },
];

export const getKingdomLevel = (fame: number): number => {
  let level = 1;
  for (const kl of KINGDOM_LEVELS) {
    if (fame >= kl.fameRequired) level = kl.level;
    else break;
  }
  return level;
};

export const getNextLevelDef = (currentLevel: number): KingdomLevelDef | null =>
  KINGDOM_LEVELS.find(k => k.level === currentLevel + 1) || null;

export const getMaxChainLevel = (kingdomLevel: number): number => {
  // 각 체인이 해금된 Kingdom Level
  // Phase 1에서는 wood + stone만 사용
  return 5; // 모든 체인 최대 Lv5
};
