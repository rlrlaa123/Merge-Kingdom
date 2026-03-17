import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { getItem } from '../data/mergeTree';
import styles from './Item.module.css';

const Item = ({ id, level, cellKey }) => {
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
      style={{ opacity: isDragging ? 0.3 : 1 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      whileTap={{ scale: 0.9 }}
    >
      <span className={styles.emoji}>{itemData.emoji}</span>
      <span className={styles.level}>Lv.{level}</span>
    </motion.div>
  );
};

export default Item;
