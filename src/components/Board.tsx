import { useState, useCallback, useMemo } from 'react';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors, type DragStartEvent, type DragMoveEvent, type DragEndEvent } from '@dnd-kit/core';
import useGameStore, { type BoardItem } from '../store/gameStore';
import { getChainItem } from '../data/chains';
import Cell from './Cell';
import styles from './Board.module.css';

const parseKey = (key: string): [number, number] => {
  const [r, c] = key.split('-').map(Number);
  return [r, c];
};

interface BoardProps {
  onItemClick?: (item: BoardItem) => void;
}

const Board = ({ onItemClick }: BoardProps) => {
  const board = useGameStore(s => s.board);
  const boardSize = useGameStore(s => s.boardSize);
  const mergeItems = useGameStore(s => s.mergeItems);
  const swapItems = useGameStore(s => s.swapItems);
  const moveItem = useGameStore(s => s.moveItem);

  const [draggingItem, setDraggingItem] = useState<{ chain: string; level: number; fromKey: string; special?: string } | null>(null);
  const [mergeTargetKey, setMergeTargetKey] = useState<string | null>(null);

  const sensorOptions = useMemo(() => ({
    activationConstraint: { distance: 5 },
  }), []);
  const touchOptions = useMemo(() => ({
    activationConstraint: { delay: 0, tolerance: 5 },
  }), []);

  const pointerSensor = useSensor(PointerSensor, sensorOptions);
  const touchSensor = useSensor(TouchSensor, touchOptions);
  const sensors = useSensors(pointerSensor, touchSensor);

  const handleDragStart = useCallback((e: DragStartEvent) => {
    const { cellKey } = e.active.data.current as { cellKey: string };
    const [r, c] = parseKey(cellKey);
    const item = board[r]?.[c];
    if (item) setDraggingItem({ chain: item.chain, level: item.level, fromKey: cellKey, special: item.special });
  }, [board]);

  const handleDragMove = useCallback((e: DragMoveEvent) => {
    if (!draggingItem || !e.over) { setMergeTargetKey(null); return; }
    const { r, c } = e.over.data.current as { r: number; c: number };
    const targetItem = board[r]?.[c];
    const [fromR, fromC] = parseKey(draggingItem.fromKey);
    if (
      targetItem &&
      targetItem.chain === draggingItem.chain &&
      targetItem.level === draggingItem.level &&
      targetItem.special === draggingItem.special &&
      (r !== fromR || c !== fromC)
    ) {
      setMergeTargetKey(`${r}-${c}`);
    } else {
      setMergeTargetKey(null);
    }
  }, [draggingItem, board]);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setDraggingItem(null);
    setMergeTargetKey(null);
    if (!e.over) return;

    const { cellKey: fromKey } = e.active.data.current as { cellKey: string };
    const [fromR, fromC] = parseKey(fromKey);
    const { r: toR, c: toC } = e.over.data.current as { r: number; c: number };
    if (fromR === toR && fromC === toC) return;

    const fromItem = board[fromR]?.[fromC];
    const toItem = board[toR]?.[toC];

    const canMerge = fromItem && toItem &&
      fromItem.chain === toItem.chain &&
      fromItem.level === toItem.level &&
      fromItem.special === toItem.special;
    if (canMerge) {
      mergeItems(fromR, fromC, toR, toC);
    } else if (fromItem && toItem) {
      swapItems(fromR, fromC, toR, toC);
    } else if (fromItem && !toItem) {
      moveItem(fromR, fromC, toR, toC);
    }
  }, [board, mergeItems, swapItems, moveItem]);

  const dragOverlayItem = draggingItem
    ? (draggingItem.special === 'energyBox' ? { emoji: '⚡' } : getChainItem(draggingItem.chain, draggingItem.level))
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div
        className={styles.board}
        style={{
          gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
          gridTemplateRows: `repeat(${boardSize}, 1fr)`,
        }}
      >
        {Array.from({ length: boardSize }, (_, r) =>
          Array.from({ length: boardSize }, (_, c) => (
            <Cell
              key={`${r}-${c}`}
              r={r}
              c={c}
              item={board[r]?.[c] ?? null}
              isMergeTarget={mergeTargetKey === `${r}-${c}`}
              onItemClick={onItemClick}
            />
          ))
        )}
      </div>
      <DragOverlay dropAnimation={null}>
        {dragOverlayItem && (
          <div className={styles.overlay}>
            <span className={styles.overlayEmoji}>{dragOverlayItem.emoji}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default Board;
