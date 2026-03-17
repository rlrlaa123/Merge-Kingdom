import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import Item from './Item';
import FloatingTextsOverlay from './FloatingTextsOverlay';
import { cellKey } from '../utils/gridHelpers';
import styles from './Cell.module.css';

// useDraggable을 Cell에서 호출하고, isDragging/ref/listeners를 Item에 prop으로 전달.
// Item은 memo + 순수 프레젠테이션이므로 isDragging이 안 바뀌면 리렌더링 안 됨.
const Cell = memo(({ r, c, item, isMergeTarget, isMergedCell }) => {
  const key = cellKey(r, c);
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `cell-${key}`, data: { r, c } });

  // item이 있을 때만 useDraggable 호출 (hook 호출 순서 보장을 위해 항상 호출, disabled로 제어)
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: item ? `item-${item.id}` : `empty-${key}`,
    data: { itemId: item?.id, cellKey: key },
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
