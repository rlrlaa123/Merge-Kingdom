import { useState } from 'react';
import useGameStore from '../store/useGameStore';
import { formatNumber } from '../utils/formatNumber';
import { findEmptyCells } from '../utils/gridHelpers';
import { sfxSpawn, sfxFail } from '../utils/sound';
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

  const [shake, setShake] = useState(false);

  const handleSpawn = () => {
    const ok = spawnItem();
    if (ok) {
      sfxSpawn();
    } else {
      sfxFail();
      setShake(true);
      setTimeout(() => setShake(false), 300);
    }
  };

  const label = !hasSpace ? '🔒 그리드 꽉 참' : '🥚 소환';
  const sublabel = !hasSpace ? '머지해서 공간 확보!' : `${formatNumber(cost)} 🪙`;

  return (
    <div className={styles.bottomBar}>
      <button
        className={`${styles.spawnBtn} ${!canSpawn ? styles.disabled : ''} ${shake ? styles.shake : ''}`}
        onClick={handleSpawn}
      >
        <span>{label}</span>
        <span className={styles.cost}>{sublabel}</span>
      </button>
    </div>
  );
};

export default BottomBar;
