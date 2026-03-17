import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import Item from './Item';
import FloatingTextsOverlay from './FloatingTextsOverlay';
import { cellKey } from '../utils/gridHelpers';
import styles from './Cell.module.css';

const Cell = memo(({ r, c, item, isMergeTarget, isMergedCell }) => {
  const key = cellKey(r, c);
  const { setNodeRef, isOver } = useDroppable({ id: `cell-${key}`, data: { r, c } });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.cell} ${isOver ? styles.over : ''} ${isMergeTarget ? styles.mergeTarget : ''} ${isMergedCell ? styles.merged : ''}`}
    >
      {item && (
        <Item
          key={item.id}
          id={item.id}
          level={item.level}
          cellKey={key}
          isMerged={isMergedCell}
        />
      )}

      <FloatingTextsOverlay r={r} c={c} />
    </div>
  );
});

export default Cell;
