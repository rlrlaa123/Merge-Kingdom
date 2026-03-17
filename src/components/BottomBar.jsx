import { motion } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import { formatNumber } from '../utils/formatNumber';
import styles from './BottomBar.module.css';

const BottomBar = () => {
  const spawnItem = useGameStore(s => s.spawnItem);
  const coins = useGameStore(s => s.coins);
  const getSpawnCost = useGameStore(s => s.getSpawnCost);
  const cost = getSpawnCost();
  const canSpawn = coins >= cost;

  const handleSpawn = () => {
    spawnItem();
  };

  return (
    <div className={styles.bottomBar}>
      <motion.button
        className={`${styles.spawnBtn} ${!canSpawn ? styles.disabled : ''}`}
        onClick={handleSpawn}
        whileTap={canSpawn ? { scale: 0.95 } : { x: [-4, 4, -4, 4, 0] }}
        transition={{ duration: 0.3 }}
        disabled={!canSpawn}
      >
        <span>🥚 소환</span>
        <span className={styles.cost}>{formatNumber(cost)} 🪙</span>
      </motion.button>
    </div>
  );
};

export default BottomBar;
