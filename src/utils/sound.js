// Web Audio API 기반 프로그래매틱 효과음 — 외부 파일 로딩 없음
let ctx = null;

const getCtx = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
};

// 모바일 브라우저 AudioContext unlock (첫 터치 시)
export const unlockAudio = () => {
  const ac = getCtx();
  if (ac.state === 'suspended') ac.resume();
};

const play = (fn) => {
  try {
    const ac = getCtx();
    if (ac.state === 'suspended') return; // 아직 unlock 안 됨
    fn(ac);
  } catch { /* 무시 */ }
};

// 소환 — 톡 튀어나오는 팝
export const sfxSpawn = () => play((ac) => {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(600, ac.currentTime);
  o.frequency.exponentialRampToValueAtTime(1200, ac.currentTime + 0.08);
  g.gain.setValueAtTime(0.15, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
  o.connect(g).connect(ac.destination);
  o.start();
  o.stop(ac.currentTime + 0.15);
});

// 머지 — 상승 차임 2음
export const sfxMerge = () => play((ac) => {
  [523, 784].forEach((freq, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    const t = ac.currentTime + i * 0.1;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + 0.2);
  });
});

// 드래그 시작 — 짧은 클릭
export const sfxPickup = () => play((ac) => {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(800, ac.currentTime);
  g.gain.setValueAtTime(0.08, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
  o.connect(g).connect(ac.destination);
  o.start();
  o.stop(ac.currentTime + 0.05);
});

// 드롭 (스왑/이동) — 부드러운 착지
export const sfxDrop = () => play((ac) => {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(400, ac.currentTime);
  o.frequency.exponentialRampToValueAtTime(250, ac.currentTime + 0.1);
  g.gain.setValueAtTime(0.1, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
  o.connect(g).connect(ac.destination);
  o.start();
  o.stop(ac.currentTime + 0.12);
});

// 소환 실패 — 낮은 버즈
export const sfxFail = () => play((ac) => {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(150, ac.currentTime);
  g.gain.setValueAtTime(0.08, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
  o.connect(g).connect(ac.destination);
  o.start();
  o.stop(ac.currentTime + 0.2);
});
