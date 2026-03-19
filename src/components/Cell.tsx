import { memo, useMemo, useCallback, useRef } from 'react';
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
  onItemClick?: (item: BoardItemType) => void;
}

const Cell = memo(({ r, c, item, isMergeTarget, onItemClick }: Props) => {
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

  // 드래그와 클릭 구분: pointerdown 위치와 pointerup 위치가 거의 같으면 클릭
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!pointerStart.current || !item) return;
    const dx = Math.abs(e.clientX - pointerStart.current.x);
    const dy = Math.abs(e.clientY - pointerStart.current.y);
    // 5px 이내면 클릭으로 판정
    if (dx < 5 && dy < 5) {
      if (isEnergyBox) {
        tapEnergyBox(r, c);
      } else if (onItemClick) {
        onItemClick(item);
      }
    }
    pointerStart.current = null;
  }, [item, isEnergyBox, tapEnergyBox, r, c, onItemClick]);

  return (
    <div
      ref={setDropRef}
      className={`${styles.cell} ${isOver ? styles.over : ''} ${isMergeTarget ? styles.mergeTarget : ''}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
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
