import { memo } from 'react';
import { getTreeItem } from '../data/mergeTree';
import useGameStore from '../store/useGameStore';
import styles from './Item.module.css';

const Item = memo(({ id, level, tree, isMerged, isDragging, dragRef, dragListeners, dragAttributes }) => {
  const isFresh = useGameStore(s => s.freshItemIds.has(id));
  const itemData = getTreeItem(tree || 'animal', level);

  return (
    <div
      ref={dragRef}
      {...dragListeners}
      {...dragAttributes}
      className={`${styles.item} ${isFresh ? styles.fresh : ''} ${isDragging ? styles.dragging : ''}`}
    >
      <span className={`${styles.emoji} ${isMerged ? styles.mergedEmoji : ''}`}>
        {itemData.emoji}
      </span>
      <span className={styles.level}>Lv.{level}</span>
    </div>
  );
});

export default Item;
