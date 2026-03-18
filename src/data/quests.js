// 퀘스트 정의
// type: 'merge' | 'spawn' | 'reach_level' | 'earn_coins' | 'collect'
// target: 달성 목표 수치

export const QUESTS = [
  // === 초보자 퀘스트 ===
  { id: 'first_merge',    title: '첫 머지!',           desc: '아이템을 처음으로 머지하세요',    type: 'merge',       target: 1,    reward: 50,   icon: '🤝' },
  { id: 'spawn_5',        title: '알 수집가',          desc: '아이템을 5번 소환하세요',         type: 'spawn',       target: 5,    reward: 80,   icon: '🥚' },
  { id: 'reach_lv3',      title: '아기새 탄생',        desc: 'Lv.3 아이템을 만드세요',          type: 'reach_level', target: 3,    reward: 150,  icon: '🐥' },

  // === 중급 퀘스트 ===
  { id: 'merge_10',       title: '머지 마스터',        desc: '10번 머지하세요',                 type: 'merge',       target: 10,   reward: 200,  icon: '⚡' },
  { id: 'spawn_20',       title: '소환사',             desc: '아이템을 20번 소환하세요',        type: 'spawn',       target: 20,   reward: 300,  icon: '✨' },
  { id: 'reach_lv5',      title: '하늘의 왕',          desc: 'Lv.5 독수리를 만드세요',          type: 'reach_level', target: 5,    reward: 500,  icon: '🦅' },
  { id: 'earn_1000',      title: '부자의 길',          desc: '총 1,000 코인을 벌어보세요',      type: 'earn_coins',  target: 1000, reward: 300,  icon: '💰' },

  // === 고급 퀘스트 ===
  { id: 'merge_50',       title: '머지 달인',          desc: '50번 머지하세요',                 type: 'merge',       target: 50,   reward: 800,  icon: '🔥' },
  { id: 'reach_lv6',      title: '드래곤 소환',        desc: 'Lv.6 드래곤을 만드세요',          type: 'reach_level', target: 6,    reward: 1500, icon: '🐉' },
  { id: 'earn_10000',     title: '코인 제왕',          desc: '총 10,000 코인을 벌어보세요',     type: 'earn_coins',  target: 10000,reward: 1000, icon: '👑' },
  { id: 'spawn_100',      title: '전설의 소환사',      desc: '아이템을 100번 소환하세요',       type: 'spawn',       target: 100,  reward: 1500, icon: '🌟' },

  // === 전설 퀘스트 ===
  { id: 'reach_lv7',      title: '킹 오브 킹',        desc: 'Lv.7 킹을 만드세요!',             type: 'reach_level', target: 7,    reward: 5000, icon: '👑' },
  { id: 'merge_200',      title: '머지의 신',          desc: '200번 머지하세요',                type: 'merge',       target: 200,  reward: 3000, icon: '💎' },
  { id: 'collect_all',    title: '컴플리트!',          desc: '모든 아이템을 도감에 등록하세요',  type: 'collect',     target: 7,    reward: 10000,icon: '🏆' },
];

export const getQuestById = (id) => QUESTS.find(q => q.id === id);
