import { useState } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import { formatNumber } from '../utils/formatNumber';
import { findEmptyCells } from '../utils/gridHelpers';
import styles from './BottomBar.module.css';

const BottomBar = () => {
  const spawnItem = useGameStore(s => s.spawnItem);
  const coins = useGameStore(s => s.coins);
  const grid = useGameStore(s => s.grid);
  const getSpawnCost = useGameStore(s => s.getSpawnCost);
  const cost = getSpawnCost();
  const canAfford = coins >= cost;
  const hasSpace = findEmptyCells(grid).length > 0;
  const canSpawn = canAfford && hasSpace;

  const [shakeKey, setShakeKey] = useState(0);

  const handleSpawn = () => {
    const ok = spawnItem();
    if (!ok) setShakeKey(k => k + 1);
  };

  const label = !hasSpace ? '🔒 그리드 꽉 참' : `🥚 소환`;
  const sublabel = !hasSpace ? '머지해서 공간 확보!' : `${formatNumber(cost)} 🪙`;

  return (
    <div className={styles.bottomBar}>
      <motion.button
        key={shakeKey}
        className={`${styles.spawnBtn} ${!canSpawn ? styles.disabled : ''}`}
        onClick={handleSpawn}
        whileTap={canSpawn ? { scale: 0.95 } : {}}
        animate={shakeKey > 0 ? { x: [-6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        <span>{label}</span>
        <span className={styles.cost}>{sublabel}</span>
      </motion.button>
    </div>
  );
};

export default BottomBar;
