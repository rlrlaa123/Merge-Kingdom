import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { getItem } from '../data/mergeTree';
import styles from './Item.module.css';

const Item = ({ id, level, cellKey, isMerged }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `item-${id}`,
    data: { itemId: id, cellKey },
  });

  const itemData = getItem(level);

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={styles.item}
      style={{ opacity: isDragging ? 0.25 : 1 }}
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      whileTap={{ scale: 0.88 }}
    >
      <motion.span
        className={styles.emoji}
        animate={isMerged ? {
          scale: [1, 1.5, 0.85, 1.1, 1],
          filter: ['drop-shadow(0 0 0px gold)', 'drop-shadow(0 0 12px gold)', 'drop-shadow(0 0 0px gold)'],
        } : {}}
        transition={{ duration: 0.5 }}
      >
        {itemData.emoji}
      </motion.span>
      <span className={styles.level}>Lv.{level}</span>
    </motion.div>
  );
};

export default Item;
