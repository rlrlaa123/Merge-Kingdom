import { useState } from 'react';
import useGameStore from '../store/useGameStore';
import { TREES, getTreeItem } from '../data/mergeTree';
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
  const addFloatingText = useGameStore(s => s.addFloatingText);

  const cost = getSpawnCost();
  const canAfford = coins >= cost;
  const hasSpace = findEmptyCells(grid, gridSize).length > 0;
  const canSpawn = canAfford && hasSpace;
  const expandCost = getExpandCost();

  const [shake, setShake] = useState(false);

  // 현재 선택된 트리의 Lv.1 이모지
  const activeTreeLv1 = getTreeItem(activeTree, 1).emoji;

  const handleSpawn = () => {
    const ok = spawnItem();
    if (ok) { sfxSpawn(); } else { sfxFail(); setShake(true); setTimeout(() => setShake(false), 300); }
  };

  const handleTreeSelect = (treeId) => {
    if (unlockedTrees.includes(treeId)) {
      setActiveTree(treeId);
    } else {
      const treeDef = TREES.find(t => t.id === treeId);
      if (treeDef && coins < treeDef.unlockCost) {
        // 코인 부족 피드백
        sfxFail();
        addFloatingText(`${formatNumber(treeDef.unlockCost)} 🪙 필요!`, 2, 2);
      } else {
        const ok = unlockTree(treeId);
        if (ok) sfxMerge();
        else sfxFail();
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
    if (ok) sfxMerge();
    else sfxFail();
  };

  const label = !hasSpace ? '🔒 꽉 참' : `${activeTreeLv1} 소환`;
  const sublabel = !hasSpace ? '머지하세요!' : `${formatNumber(cost)} 🪙`;

  return (
    <div className={styles.bottomBar}>
      {/* 트리 선택 */}
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
              title={unlocked ? tree.name : `${tree.name} (${formatNumber(tree.unlockCost)} 🪙)`}
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

        {/* 그리드 확장 */}
        {expandCost && (
          <button
            className={`${styles.treeBtn} ${coins < expandCost ? styles.locked : ''}`}
            onClick={handleExpand}
            title={`그리드 확장 (${formatNumber(expandCost)} 🪙)`}
          >
            <span>🔲</span>
            <span className={`${styles.treeCost} ${coins >= expandCost ? styles.affordable : ''}`}>
              {formatNumber(expandCost)}
            </span>
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
