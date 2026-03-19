import useGameStore from '../store/gameStore';
import { getNextLevelDef } from '../data/levels';
import styles from './TopBar.module.css';

const TopBar = () => {
  const gold = useGameStore(s => s.gold);
  const fame = useGameStore(s => s.fame);
  const kingdomLevel = useGameStore(s => s.kingdomLevel);
  const energy = useGameStore(s => s.energy);

  const nextDef = getNextLevelDef(kingdomLevel);
  const fameProgress = nextDef ? Math.min((fame / nextDef.fameRequired) * 100, 100) : 100;
  const energyPct = Math.min((energy.current / energy.max) * 100, 100);
  const isLow = energy.current <= 5;

  return (
    <div className={styles.bar}>
      <div className={styles.energySection}>
        <span className={styles.energyText}>⚡ {energy.current}/{energy.max}</span>
        <div className={styles.energyBar}>
          <div
            className={`${styles.energyFill} ${isLow ? styles.energyLow : ''}`}
            style={{ width: `${energyPct}%` }}
          />
        </div>
      </div>
      <span className={styles.gold}>🪙 {gold}</span>
      <div className={styles.level}>
        <span className={styles.levelText}>⭐{kingdomLevel}</span>
        <div className={styles.fameBar}>
          <div className={styles.fameFill} style={{ width: `${fameProgress}%` }} />
        </div>
      </div>
    </div>
  );
};

export default TopBar;
