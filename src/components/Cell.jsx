import { useMemo, memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import Item from './Item';
import { cellKey } from '../utils/gridHelpers';
import useGameStore from '../store/useGameStore';
import styles from './Cell.module.css';

const Cell = memo(({ r, c, item, isMergeTarget, isMergedCell }) => {
  const key = cellKey(r, c);
  const { setNodeRef, isOver } = useDroppable({ id: `cell-${key}`, data: { r, c } });
  const allFloatingTexts = useGameStore(s => s.floatingTexts);
  const floatingTexts = useMemo(
    () => allFloatingTexts.filter(t => t.r === r && t.c === c),
    [allFloatingTexts, r, c]
  );

  return (
    <div
      ref={setNodeRef}
      className={`${styles.cell} ${isOver ? styles.over : ''} ${isMergeTarget ? styles.mergeTarget : ''} ${isMergedCell ? styles.merged : ''}`}
    >
      <AnimatePresence>
        {item && (
          <Item
            key={item.id}
            id={item.id}
            level={item.level}
            cellKey={key}
            isMerged={isMergedCell}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {floatingTexts.map(({ id, text }) => (
          <motion.div
            key={id}
            className={styles.floatingText}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -44, scale: 1.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: 'easeOut' }}
          >
            {text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

export default Cell;
