import useGameStore from '../store/gameStore';
import styles from './FtueOverlay.module.css';

const STEPS = [
  null, // 0 = done
  { text: '🌳 나무를 탭해서\n나뭇가지를 만들어보세요!', target: 'source' },
  { text: '같은 아이템 두 개를\n드래그해서 합쳐보세요! 🪵+🪵', target: 'board' },
  { text: '주문의 [납품] 버튼을\n눌러 아이템을 납품하세요! 📦', target: 'orders' },
  { text: '🎉 훌륭해요! 이제 자유롭게\n주문을 완료하며 왕국을 키워보세요!', target: null },
];

const FtueOverlay = () => {
  const ftueStep = useGameStore(s => s.ftueStep);
  const advanceFtue = useGameStore(s => s.advanceFtue);

  if (ftueStep <= 0 || ftueStep >= STEPS.length) return null;
  const step = STEPS[ftueStep];
  if (!step) return null;

  return (
    <div className={styles.overlay} onClick={ftueStep === 4 ? advanceFtue : undefined}>
      <div className={styles.bubble}>
        <div className={styles.text}>{step.text}</div>
        {ftueStep === 4 && <div className={styles.tapHint}>탭하여 시작 →</div>}
        <div className={styles.stepIndicator}>{ftueStep}/4</div>
      </div>
    </div>
  );
};

export default FtueOverlay;
