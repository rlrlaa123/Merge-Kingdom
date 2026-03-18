import { memo, useMemo } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import BoardItem from './BoardItem';
import type { BoardItem as BoardItemType } from '../store/gameStore';
import styles from './Cell.module.css';

interface Props {
  r: number;
  c: number;
  item: BoardItemType | null;
  isMergeTarget: boolean;
}

const Cell = memo(({ r, c, item, isMergeTarget }: Props) => {
  const cellKey = `${r}-${c}`;
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `cell-${cellKey}`,
    data: { r, c },
  });

  const draggableData = useMemo(() => ({ cellKey }), [cellKey]);
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: item ? `item-${item.id}` : `empty-${cellKey}`,
    data: draggableData,
    disabled: !item,
  });

  return (
    <div
      ref={setDropRef}
      className={`${styles.cell} ${isOver ? styles.over : ''} ${isMergeTarget ? styles.mergeTarget : ''}`}
    >
      {item && (
        <BoardItem
          key={item.id}
          chain={item.chain}
          level={item.level}
          isDragging={isDragging}
          dragRef={setDragRef}
          dragListeners={listeners}
          dragAttributes={attributes}
        />
      )}
    </div>
  );
});

export default Cell;
