import useGameStore from '../store/useGameStore';
import styles from './LevelUpModal.module.css';

const LevelUpModal = () => {
  const levelUpUnlock = useGameStore(s => s.levelUpUnlock);
  const kingdomLevel = useGameStore(s => s.kingdomLevel);
  const clearLevelUpUnlock = useGameStore(s => s.clearLevelUpUnlock);

  if (!levelUpUnlock) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.icon}>⭐</div>
        <h2 className={styles.title}>왕국 레벨 UP!</h2>
        <p className={styles.level}>Lv.{kingdomLevel} 도달!</p>
        <p className={styles.unlock}>{levelUpUnlock.desc}</p>
        <button className={styles.btn} onClick={clearLevelUpUnlock}>확인</button>
      </div>
    </div>
  );
};

export default LevelUpModal;
