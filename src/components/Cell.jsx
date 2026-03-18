import { memo, useMemo, useCallback } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import Item from './Item';
import FloatingTextsOverlay from './FloatingTextsOverlay';
import useGameStore from '../store/useGameStore';
import { cellKey } from '../utils/gridHelpers';
import styles from './Cell.module.css';

const Cell = memo(({ r, c, item, isMergeTarget, isMergedCell }) => {
  const key = cellKey(r, c);
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `cell-${key}`, data: { r, c } });

  const isRock = item?.special === 'rock';
  const draggableId = item && !isRock ? `item-${item.id}` : `empty-${key}`;
  const draggableData = useMemo(() => ({ itemId: item?.id, cellKey: key }), [item?.id, key]);

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: draggableId,
    data: draggableData,
    disabled: !item || isRock,
  });

  const isHarvestReady = useGameStore(s => item && !isRock ? s.isHarvestReady(item.id) : false);
  const harvestItem = useGameStore(s => s.harvestItem);
  const removeRock = useGameStore(s => s.removeRock);
  const handleHarvest = useCallback(() => harvestItem(r, c), [harvestItem, r, c]);
  const handleRockTap = useCallback(() => removeRock(r, c), [removeRock, r, c]);

  return (
    <div
      ref={setDropRef}
      className={`${styles.cell} ${isOver ? styles.over : ''} ${isMergeTarget ? styles.mergeTarget : ''} ${isMergedCell ? styles.merged : ''}`}
      onClick={isRock ? handleRockTap : undefined}
    >
      {item && (
        <Item
          key={item.id}
          id={item.id}
          level={item.level}
          tree={item.tree}
          special={item.special}
          isMerged={isMergedCell}
          isDragging={isDragging}
          isHarvestReady={isHarvestReady}
          onHarvest={handleHarvest}
          dragRef={setDragRef}
          dragListeners={isRock ? {} : listeners}
          dragAttributes={isRock ? {} : attributes}
        />
      )}
      <FloatingTextsOverlay r={r} c={c} />
    </div>
  );
});

export default Cell;
