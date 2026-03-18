import { memo } from 'react';
import { getTreeItem } from '../data/mergeTree';
import useGameStore from '../store/useGameStore';
import styles from './Item.module.css';

const Item = memo(({ id, level, tree, special, isMerged, isDragging, isHarvestReady, onHarvest, dragRef, dragListeners, dragAttributes }) => {
  const isFresh = useGameStore(s => s.freshItemIds.has(id));

  if (special === 'rock') {
    return (
      <div ref={dragRef} className={`${styles.item} ${styles.rock}`}>
        <span className={styles.emoji}>🪨</span>
      </div>
    );
  }

  const itemData = getTreeItem(tree || 'animal', level);
  const specialClass = special === 'golden' ? styles.golden : special === 'wildcard' ? styles.wildcard : '';

  return (
    <div
      ref={dragRef}
      {...dragListeners}
      {...dragAttributes}
      className={`${styles.item} ${isFresh ? styles.fresh : ''} ${isDragging ? styles.dragging : ''} ${specialClass}`}
      onClick={isHarvestReady && !isDragging ? onHarvest : undefined}
    >
      <span className={`${styles.emoji} ${isMerged ? styles.mergedEmoji : ''}`}>
        {itemData.emoji}
      </span>
      <span className={styles.level}>Lv.{level}</span>
      {isHarvestReady && !isDragging && <span className={styles.harvestCoin}>🪙</span>}
    </div>
  );
});

export default Item;
