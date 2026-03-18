import { useState } from 'react';
import useGameStore from '../store/useGameStore';
import { getTreeItem } from '../data/mergeTree';
import { formatNumber } from '../utils/formatNumber';
import { findEmptyCells } from '../utils/gridHelpers';
import { sfxSpawn, sfxFail, sfxMerge } from '../utils/sound';
import styles from './BottomBar.module.css';

const formatTime = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}초`;
};

const BottomBar = () => {
  const spawnItem = useGameStore(s => s.spawnItem);
  const freeSpawn = useGameStore(s => s.freeSpawn);
  const coins = useGameStore(s => s.coins);
  const grid = useGameStore(s => s.grid);
  const gridSize = useGameStore(s => s.gridSize);
  const getSpawnCost = useGameStore(s => s.getSpawnCost);
  const activeTree = useGameStore(s => s.activeTree);
  const unlockedTrees = useGameStore(s => s.unlockedTrees);
  const setActiveTree = useGameStore(s => s.setActiveTree);
  const freeSpawnCharges = useGameStore(s => s.freeSpawnCharges);
  const maxFreeSpawnCharges = useGameStore(s => s.maxFreeSpawnCharges);
  const getFreeSpawnCooldownRemaining = useGameStore(s => s.getFreeSpawnCooldownRemaining);
  const activateBoost = useGameStore(s => s.activateBoost);
  const getBoostTimeRemaining = useGameStore(s => s.getBoostTimeRemaining);

  const cost = getSpawnCost();
  const hasSpace = findEmptyCells(grid, gridSize).length > 0;
  const canSpawn = coins >= cost && hasSpace;
  const freeRemaining = getFreeSpawnCooldownRemaining();
  const boostInfo = getBoostTimeRemaining();
  const activeTreeLv1 = getTreeItem(activeTree, 1).emoji;

  const [shake, setShake] = useState(false);

  const handleSpawn = () => {
    const ok = spawnItem();
    if (ok) sfxSpawn();
    else { sfxFail(); setShake(true); setTimeout(() => setShake(false), 300); }
  };

  const handleFreeSpawn = () => {
    if (freeSpawnCharges <= 0 || !hasSpace) { sfxFail(); return; }
    const ok = freeSpawn();
    if (ok) sfxSpawn(); else sfxFail();
  };

  const handleBoost = () => {
    const ok = activateBoost();
    if (ok) sfxMerge(); else sfxFail();
  };

  return (
    <div className={styles.bottomBar}>
      {/* 트리 선택 + 부스트 */}
      <div className={styles.treeRow}>
        {unlockedTrees.map(treeId => {
          const active = activeTree === treeId;
          const icon = treeId === 'animal' ? '🐾' : treeId === 'plant' ? '🌿' : '🏗️';
          return (
            <button
              key={treeId}
              className={`${styles.treeBtn} ${active ? styles.active : ''}`}
              onClick={() => setActiveTree(treeId)}
            >
              <span>{icon}</span>
              {active && <span className={styles.activeDot} />}
            </button>
          );
        })}
        <button
          className={`${styles.treeBtn} ${boostInfo.type === 'active' ? styles.boostActive : ''} ${boostInfo.type === 'cooldown' ? styles.locked : ''}`}
          onClick={handleBoost}
          disabled={boostInfo.type !== 'ready'}
        >
          <span>⚡</span>
          {boostInfo.type === 'ready' && <span className={styles.treeCost + ' ' + styles.affordable}>×2</span>}
          {boostInfo.type === 'active' && <span className={styles.treeCost + ' ' + styles.affordable}>{formatTime(boostInfo.remaining)}</span>}
          {boostInfo.type === 'cooldown' && <span className={styles.treeCost}>{formatTime(boostInfo.remaining)}</span>}
        </button>
      </div>

      {/* 소환 버튼 */}
      <div className={styles.spawnRow}>
        <button
          className={`${styles.spawnBtn} ${!canSpawn ? styles.disabled : ''} ${shake ? styles.shake : ''}`}
          onClick={handleSpawn}
        >
          <span>{!hasSpace ? '🔒 꽉 참' : `${activeTreeLv1} 소환`}</span>
          <span className={styles.cost}>{!hasSpace ? '머지하세요!' : `${formatNumber(cost)} 🪙`}</span>
        </button>
        <button
          className={`${styles.freeBtn} ${freeSpawnCharges <= 0 || !hasSpace ? styles.disabled : ''}`}
          onClick={handleFreeSpawn}
        >
          <span>🆓</span>
          <span className={styles.freeCharges}>
            {freeSpawnCharges > 0 ? `${freeSpawnCharges}/${maxFreeSpawnCharges}` : formatTime(freeRemaining)}
          </span>
        </button>
      </div>
    </div>
  );
};

export default BottomBar;
