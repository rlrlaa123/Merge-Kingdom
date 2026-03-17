import useGameStore from '../store/useGameStore';
import { formatNumber } from '../utils/formatNumber';
import styles from './TopBar.module.css';

const TopBar = ({ onOpenCollection }) => {
  const coins = useGameStore(s => s.coins);
  const incomePerSec = useGameStore(s => s.getIncomePerSec());

  return (
    <div className={styles.topBar}>
      <div className={styles.coinInfo}>
        <span className={styles.coins}>🪙 {formatNumber(coins)}</span>
        <span className={styles.income}>+{incomePerSec.toFixed(1)}/초</span>
      </div>
      <button className={styles.iconBtn} onClick={onOpenCollection}>📖</button>
    </div>
  );
};

export default TopBar;
