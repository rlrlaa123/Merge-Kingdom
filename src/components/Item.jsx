import { useDraggable } from '@dnd-kit/core';
import { getItem } from '../data/mergeTree';
import useGameStore from '../store/useGameStore';
import styles from './Item.module.css';

const Item = ({ id, level, cellKey, isMerged }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `item-${id}`,
    data: { itemId: id, cellKey },
  });

  const isFresh = useGameStore(s => s.freshItemIds.has(id));
  const itemData = getItem(level);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`${styles.item} ${isFresh ? styles.fresh : ''}`}
      style={{ opacity: isDragging ? 0 : 1 }}
    >
      <span className={`${styles.emoji} ${isMerged ? styles.mergedEmoji : ''}`}>
        {itemData.emoji}
      </span>
      <span className={styles.level}>Lv.{level}</span>
    </div>
  );
};

export default Item;
