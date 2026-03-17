import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { getItem } from '../data/mergeTree';
import useGameStore from '../store/useGameStore';
import styles from './Item.module.css';

const Item = ({ id, level, cellKey, isMerged }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `item-${id}`,
    data: { itemId: id, cellKey },
  });

  // spawn/merge로 새로 생성된 아이템만 pop-in 애니메이션
  // swap/move된 아이템은 initial=false로 즉시 표시 (overshoot 방지)
  const isFresh = useGameStore(s => s.freshItemIds.has(id));

  const itemData = getItem(level);

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={styles.item}
      style={{ opacity: isDragging ? 0 : 1 }}
      initial={isFresh ? { scale: 0.5, opacity: 0 } : false}
      animate={{ scale: 1, opacity: isDragging ? 0 : 1 }}
      exit={{ scale: 0.3, opacity: 0, transition: { duration: 0.1 } }}
      transition={{ type: 'spring', stiffness: 480, damping: 26 }}
      whileTap={{ scale: 0.9 }}
    >
      <motion.span
        className={styles.emoji}
        animate={isMerged ? {
          scale: [1, 1.45, 0.9, 1.1, 1],
          filter: [
            'drop-shadow(0 0 0px rgba(255,215,0,0))',
            'drop-shadow(0 0 14px rgba(255,215,0,0.9))',
            'drop-shadow(0 0 0px rgba(255,215,0,0))',
          ],
        } : { scale: 1 }}
        transition={{ duration: 0.45 }}
      >
        {itemData.emoji}
      </motion.span>
      <span className={styles.level}>Lv.{level}</span>
    </motion.div>
  );
};

export default Item;
