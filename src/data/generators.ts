// 제너레이터 Tier 데이터

export interface GeneratorTier {
  tier: number;
  energyCost: number;     // 탭당 에너지
  baseCooldown: number;   // 기본 쿨다운 (ms)
}

export const GENERATOR_TIERS: Record<string, GeneratorTier> = {
  wood:  { tier: 1, energyCost: 1, baseCooldown: 5_000 },
  stone: { tier: 1, energyCost: 1, baseCooldown: 5_000 },
  wheat: { tier: 2, energyCost: 1, baseCooldown: 8_000 },
  iron:  { tier: 3, energyCost: 2, baseCooldown: 10_000 },
  magic: { tier: 4, energyCost: 2, baseCooldown: 12_000 },
  gem:   { tier: 5, energyCost: 3, baseCooldown: 15_000 },
};

// 업그레이드별 쿨다운 배율 (에너지 비용은 변경 안 됨)
export const UPGRADE_COOLDOWN_MULT = [1.0, 0.8, 0.6]; // Lv1, Lv2, Lv3

export const getGeneratorCooldown = (chainId: string, upgradeLevel: number): number => {
  const gen = GENERATOR_TIERS[chainId];
  if (!gen) return 5_000;
  const mult = UPGRADE_COOLDOWN_MULT[Math.min(upgradeLevel - 1, 2)];
  return Math.floor(gen.baseCooldown * mult);
};

export const getGeneratorEnergyCost = (chainId: string): number => {
  return GENERATOR_TIERS[chainId]?.energyCost ?? 1;
};

// 에너지 캡 테이블 (Kingdom Level 기반)
export const ENERGY_CAP_TABLE: Record<number, number> = {
  1: 85, 3: 90, 5: 95, 7: 100, 9: 105, 10: 110, 15: 125, 20: 150,
};

export const getEnergyCap = (kingdomLevel: number): number => {
  let cap = 85;
  for (const [lvStr, c] of Object.entries(ENERGY_CAP_TABLE)) {
    if (kingdomLevel >= Number(lvStr)) cap = c;
  }
  return cap;
};

// 에너지 박스 체인
export const ENERGY_BOX_VALUES = [10, 25, 60]; // Lv1, Lv2, Lv3

// 에너지 상수
export const ENERGY_REGEN_INTERVAL = 120_000; // 2분 = 120초
export const FREE_GIFT_COOLDOWN = 4 * 60 * 60 * 1000; // 4시간
export const FREE_GIFT_MIN = 15;
export const FREE_GIFT_MAX = 30;
export const AD_ENERGY = 15;
export const MAX_ADS_PER_DAY = 2;
export const COIN_ENERGY_COST = 350;
export const COIN_ENERGY_AMOUNT = 75;
export const OVERCHARGE_MULT = 1.5;
