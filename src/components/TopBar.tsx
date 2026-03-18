import useGameStore from '../store/gameStore';
import { getNextLevelDef } from '../data/levels';
import styles from './TopBar.module.css';

const TopBar = () => {
  const gold = useGameStore(s => s.gold);
  const fame = useGameStore(s => s.fame);
  const kingdomLevel = useGameStore(s => s.kingdomLevel);

  const nextDef = getNextLevelDef(kingdomLevel);
  const progress = nextDef ? Math.min((fame / nextDef.fameRequired) * 100, 100) : 100;

  return (
    <div className={styles.bar}>
      <span className={styles.gold}>🪙 {gold}</span>
      <div className={styles.level}>
        <span className={styles.levelText}>⭐ Lv.{kingdomLevel}</span>
        <div className={styles.fameBar}>
          <div className={styles.fameFill} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.fameText}>{fame}{nextDef ? `/${nextDef.fameRequired}` : ''}</span>
      </div>
    </div>
  );
};

export default TopBar;
