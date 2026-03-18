import { memo } from 'react';
import { getItem } from '../data/mergeTree';
import useGameStore from '../store/useGameStore';
import styles from './Item.module.css';

const Item = memo(({ id, level, isMerged, isDragging, dragRef, dragListeners, dragAttributes }) => {
  const isFresh = useGameStore(s => s.freshItemIds.has(id));
  const itemData = getItem(level);

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
