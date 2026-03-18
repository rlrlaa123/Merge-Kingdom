import { useState } from 'react';
import useGameStore from '../store/useGameStore';
import { TREES } from '../data/mergeTree';
import { formatNumber } from '../utils/formatNumber';
import { findEmptyCells } from '../utils/gridHelpers';
import { sfxSpawn, sfxFail, sfxMerge } from '../utils/sound';
import styles from './BottomBar.module.css';

const BottomBar = () => {
  const spawnItem = useGameStore(s => s.spawnItem);
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

  const cost = getSpawnCost();
  const canAfford = coins >= cost;
  const hasSpace = findEmptyCells(grid, gridSize).length > 0;
  const canSpawn = canAfford && hasSpace;
  const expandCost = getExpandCost();

  const [shake, setShake] = useState(false);

  const handleSpawn = () => {
    const ok = spawnItem();
    if (ok) { sfxSpawn(); } else { sfxFail(); setShake(true); setTimeout(() => setShake(false), 300); }
  };

  const handleTreeSelect = (treeId) => {
    if (unlockedTrees.includes(treeId)) {
      setActiveTree(treeId);
    } else {
      const ok = unlockTree(treeId);
      if (ok) sfxMerge();
      else sfxFail();
    }
  };

  const handleExpand = () => {
    const ok = expandGrid();
    if (ok) sfxMerge();
    else sfxFail();
  };

  const label = !hasSpace ? '🔒 꽉 참' : '🥚 소환';
  const sublabel = !hasSpace ? '머지하세요!' : `${formatNumber(cost)} 🪙`;

  return (
    <div className={styles.bottomBar}>
      {/* 트리 선택 */}
      <div className={styles.treeRow}>
        {TREES.map(tree => {
          const unlocked = unlockedTrees.includes(tree.id);
          const active = activeTree === tree.id;
          return (
            <button
              key={tree.id}
              className={`${styles.treeBtn} ${active ? styles.active : ''} ${!unlocked ? styles.locked : ''}`}
              onClick={() => handleTreeSelect(tree.id)}
            >
              <span>{tree.icon}</span>
              {!unlocked && <span className={styles.treeCost}>{formatNumber(tree.unlockCost)}</span>}
            </button>
          );
        })}

        {/* 그리드 확장 */}
        {expandCost && (
          <button
            className={`${styles.treeBtn} ${coins < expandCost ? styles.locked : ''}`}
            onClick={handleExpand}
          >
            <span>🔲</span>
            <span className={styles.treeCost}>{formatNumber(expandCost)}</span>
          </button>
        )}
      </div>

      {/* 소환 버튼 */}
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
