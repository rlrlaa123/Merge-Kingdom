import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import Item from './Item';
import { cellKey } from '../utils/gridHelpers';
import styles from './Cell.module.css';

const Cell = ({ r, c, item, isMergeTarget }) => {
  const key = cellKey(r, c);
  const { setNodeRef, isOver } = useDroppable({ id: `cell-${key}`, data: { r, c } });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.cell} ${isOver ? styles.over : ''} ${isMergeTarget ? styles.mergeTarget : ''}`}
    >
      <AnimatePresence>
        {item && (
          <Item key={item.id} id={item.id} level={item.level} cellKey={key} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cell;
