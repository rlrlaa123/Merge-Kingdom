// 캐릭터 정의

export interface Character {
  id: string;
  emoji: string;
  name: string;
  job: string;
  preferredChains: string[];
  unlockLevel: number;
  dialogues: string[];     // 주문 시 대사 (랜덤)
  thankDialogues: string[]; // 납품 완료 시 대사
}

export const CHARACTERS: Character[] = [
  {
    id: 'tom',
    emoji: '🧑‍🌾',
    name: '톰',
    job: '농부',
    preferredChains: ['wood', 'wheat'],
    unlockLevel: 1,
    dialogues: [
      '울타리를 고쳐야 해!',
      '헛간에 나무가 필요해.',
      '이걸 만들어줄 수 있어?',
      '밭일하려면 이게 필요해.',
    ],
    thankDialogues: [
      '고마워! 덕분에 살았어!',
      '완벽해! 바로 이거야!',
      '역시 최고의 장인이야!',
    ],
  },
  {
    id: 'karl',
    emoji: '🏗️',
    name: '카를',
    job: '건축가',
    preferredChains: ['stone', 'wood'],
    unlockLevel: 1,
    dialogues: [
      '성벽 공사에 자재가 필요해.',
      '새 건물을 짓고 있어!',
      '튼튼한 재료를 구해줘.',
      '이 설계도에 맞는 재료가 필요해.',
    ],
    thankDialogues: [
      '훌륭한 자재야! 감사해!',
      '이걸로 멋진 걸 지을 수 있어!',
      '왕국이 더 멋져질 거야!',
    ],
  },
  {
    id: 'mia',
    emoji: '🧑‍🍳',
    name: '미아',
    job: '요리사',
    preferredChains: ['wheat', 'wood'],
    unlockLevel: 2,
    dialogues: [
      '오늘 연회 준비를 해야 해!',
      '맛있는 빵을 만들 거야!',
      '재료가 떨어졌어, 도와줘!',
    ],
    thankDialogues: [
      '향긋한 냄새! 고마워!',
      '이걸로 최고의 요리를 만들게!',
    ],
  },
  {
    id: 'leon',
    emoji: '⚔️',
    name: '레온',
    job: '기사',
    preferredChains: ['iron', 'stone'],
    unlockLevel: 4,
    dialogues: [
      '전투 준비가 필요해!',
      '방어구를 강화해야 해.',
      '왕국을 지킬 장비를 만들어줘.',
    ],
    thankDialogues: [
      '이 검이면 무적이야!',
      '왕국을 지켜내겠어!',
    ],
  },
  {
    id: 'ella',
    emoji: '🧙',
    name: '엘라',
    job: '마법사',
    preferredChains: ['magic'],
    unlockLevel: 7,
    dialogues: [
      '마법 연구에 재료가 필요해.',
      '신비한 물약을 만들 거야!',
    ],
    thankDialogues: [
      '마법의 힘이 느껴져!',
      '연구가 한 단계 진전될 거야!',
    ],
  },
  {
    id: 'ria',
    emoji: '👸',
    name: '리아',
    job: '공주',
    preferredChains: ['gem', 'wheat'],
    unlockLevel: 7,
    dialogues: [
      '무도회 준비를 해야 해!',
      '왕실에 어울리는 걸 찾아줘.',
    ],
    thankDialogues: [
      '정말 아름다워! 고마워!',
      '왕실이 빛날 거야!',
    ],
  },
  {
    id: 'fiona',
    emoji: '🧝',
    name: '피오나',
    job: '엘프',
    preferredChains: ['magic', 'gem'],
    unlockLevel: 7,
    dialogues: [
      '숲의 균형을 유지해야 해.',
      '자연의 힘이 필요해.',
    ],
    thankDialogues: [
      '자연이 기뻐할 거야!',
      '숲이 다시 활기를 찾을 거야!',
    ],
  },
  {
    id: 'king',
    emoji: '👑',
    name: '국왕',
    job: '국왕',
    preferredChains: ['wood', 'stone', 'wheat', 'iron', 'magic', 'gem'],
    unlockLevel: 10,
    dialogues: [
      '왕국에 가장 좋은 것을 가져오라!',
      '이 왕명을 수행하라!',
    ],
    thankDialogues: [
      '훌륭하다! 왕국의 자랑이로다!',
      '그대의 충성을 잊지 않겠다!',
    ],
  },
];

export const getCharacter = (id: string) => CHARACTERS.find(c => c.id === id);

export const getAvailableCharacters = (kingdomLevel: number) =>
  CHARACTERS.filter(c => c.unlockLevel <= kingdomLevel);
