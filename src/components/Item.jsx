import { useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { getItem } from '../data/mergeTree';
import styles from './Item.module.css';

const Item = ({ id, level, cellKey, isMerged }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `item-${id}`,
    data: { itemId: id, cellKey },
  });

  // 마운트 시 항상 pop-in (dropAnimation=null이므로 Overlay와 겹치지 않음)
  const initialRef = useRef({ scale: 0.5, opacity: 0 });

  const itemData = getItem(level);

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={styles.item}
      style={{ opacity: isDragging ? 0 : 1 }}
      initial={initialRef.current}
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
