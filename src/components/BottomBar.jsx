import { useState } from 'react';
import useGameStore from '../store/useGameStore';
import { TREES, getTreeItem } from '../data/mergeTree';
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
  const unlockTree = useGameStore(s => s.unlockTree);
  const expandGrid = useGameStore(s => s.expandGrid);
  const getExpandCost = useGameStore(s => s.getExpandCost);
  const addFloatingText = useGameStore(s => s.addFloatingText);
  const freeSpawnCharges = useGameStore(s => s.freeSpawnCharges);
  const maxFreeSpawnCharges = useGameStore(s => s.maxFreeSpawnCharges);
  const getFreeSpawnCooldownRemaining = useGameStore(s => s.getFreeSpawnCooldownRemaining);
  const activateBoost = useGameStore(s => s.activateBoost);
  const getBoostTimeRemaining = useGameStore(s => s.getBoostTimeRemaining);

  const cost = getSpawnCost();
  const canAfford = coins >= cost;
  const hasSpace = findEmptyCells(grid, gridSize).length > 0;
  const canSpawn = canAfford && hasSpace;
  const expandCost = getExpandCost();
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
    if (freeSpawnCharges <= 0) { sfxFail(); return; }
    if (!hasSpace) { sfxFail(); return; }
    const ok = freeSpawn();
    if (ok) sfxSpawn();
    else sfxFail();
  };

  const handleTreeSelect = (treeId) => {
    if (unlockedTrees.includes(treeId)) {
      setActiveTree(treeId);
    } else {
      const treeDef = TREES.find(t => t.id === treeId);
      if (treeDef && coins < treeDef.unlockCost) {
        sfxFail();
        addFloatingText(`${formatNumber(treeDef.unlockCost)} 🪙 필요!`, 2, 2);
      } else {
        const ok = unlockTree(treeId);
        if (ok) sfxMerge(); else sfxFail();
      }
    }
  };

  const handleExpand = () => {
    if (expandCost && coins < expandCost) {
      sfxFail();
      addFloatingText(`${formatNumber(expandCost)} 🪙 필요!`, 2, 2);
      return;
    }
    const ok = expandGrid();
    if (ok) sfxMerge(); else sfxFail();
  };

  const handleBoost = () => {
    const ok = activateBoost();
    if (ok) sfxMerge(); else sfxFail();
  };

  return (
    <div className={styles.bottomBar}>
      {/* 트리 + 확장 + 부스트 */}
      <div className={styles.treeRow}>
        {TREES.map(tree => {
          const unlocked = unlockedTrees.includes(tree.id);
          const active = activeTree === tree.id;
          const canUnlock = coins >= tree.unlockCost;
          return (
            <button
              key={tree.id}
              className={`${styles.treeBtn} ${active ? styles.active : ''} ${!unlocked ? styles.locked : ''}`}
              onClick={() => handleTreeSelect(tree.id)}
            >
              <span>{tree.icon}</span>
              {!unlocked && (
                <span className={`${styles.treeCost} ${canUnlock ? styles.affordable : ''}`}>
                  {formatNumber(tree.unlockCost)}
                </span>
              )}
              {unlocked && active && <span className={styles.activeDot} />}
            </button>
          );
        })}
        {expandCost && (
          <button
            className={`${styles.treeBtn} ${coins < expandCost ? styles.locked : ''}`}
            onClick={handleExpand}
          >
            <span>🔲</span>
            <span className={`${styles.treeCost} ${coins >= expandCost ? styles.affordable : ''}`}>
              {formatNumber(expandCost)}
            </span>
          </button>
        )}

        {/* 부스트 버튼 */}
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

        {/* 무료 소환 */}
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
