import { memo, useMemo, useCallback } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import BoardItem from './BoardItem';
import useGameStore from '../store/gameStore';
import type { BoardItem as BoardItemType } from '../store/gameStore';
import styles from './Cell.module.css';

interface Props {
  r: number;
  c: number;
  item: BoardItemType | null;
  isMergeTarget: boolean;
}

const Cell = memo(({ r, c, item, isMergeTarget }: Props) => {
  const tapEnergyBox = useGameStore(s => s.tapEnergyBox);
  const isEnergyBox = item?.special === 'energyBox';
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

  const handleClick = useCallback(() => {
    if (isEnergyBox) tapEnergyBox(r, c);
  }, [isEnergyBox, tapEnergyBox, r, c]);

  return (
    <div
      ref={setDropRef}
      className={`${styles.cell} ${isOver ? styles.over : ''} ${isMergeTarget ? styles.mergeTarget : ''}`}
      onClick={isEnergyBox ? handleClick : undefined}
    >
      {item && (
        <BoardItem
          key={item.id}
          chain={item.chain}
          level={item.level}
          special={item.special}
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
