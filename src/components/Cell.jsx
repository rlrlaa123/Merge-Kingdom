import { memo, useMemo } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import Item from './Item';
import FloatingTextsOverlay from './FloatingTextsOverlay';
import { cellKey } from '../utils/gridHelpers';
import styles from './Cell.module.css';

const Cell = memo(({ r, c, item, isMergeTarget, isMergedCell }) => {
  const key = cellKey(r, c);
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `cell-${key}`, data: { r, c } });

  const draggableId = item ? `item-${item.id}` : `empty-${key}`;
  const draggableData = useMemo(() => ({ itemId: item?.id, cellKey: key }), [item?.id, key]);

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: draggableId,
    data: draggableData,
    disabled: !item,
  });

  return (
    <div
      ref={setDropRef}
      className={`${styles.cell} ${isOver ? styles.over : ''} ${isMergeTarget ? styles.mergeTarget : ''} ${isMergedCell ? styles.merged : ''}`}
    >
      {item && (
        <Item
          key={item.id}
          id={item.id}
          level={item.level}
          tree={item.tree}
          isMerged={isMergedCell}
          isDragging={isDragging}
          dragRef={setDragRef}
          dragListeners={listeners}
          dragAttributes={attributes}
        />
      )}
      <FloatingTextsOverlay r={r} c={c} />
    </div>
  );
});

export default Cell;
