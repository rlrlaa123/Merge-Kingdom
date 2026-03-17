import {
  DndContext,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Cell from './Cell';
import useGameStore from '../store/useGameStore';
import { GRID_SIZE, parseKey } from '../utils/gridHelpers';
import { getItem } from '../data/mergeTree';
import styles from './Grid.module.css';

const Grid = () => {
  const grid = useGameStore(s => s.grid);
  const mergeItems = useGameStore(s => s.mergeItems);
  const swapItems = useGameStore(s => s.swapItems);
  const moveItem = useGameStore(s => s.moveItem);

  const [draggingItem, setDraggingItem] = useState(null);
  const [mergeTargetKey, setMergeTargetKey] = useState(null);

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 5 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 50, tolerance: 8 } });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = ({ active }) => {
    const { cellKey } = active.data.current;
    const [r, c] = parseKey(cellKey);
    setDraggingItem({ ...grid[r][c], cellKey });
  };

  const handleDragOver = ({ over }) => {
    if (!over || !draggingItem) return;
    const { r, c } = over.data.current;
    const [fromR, fromC] = parseKey(draggingItem.cellKey);
    const targetItem = grid[r][c];
    if (targetItem && targetItem.level === draggingItem.level && (r !== fromR || c !== fromC)) {
      setMergeTargetKey(`${r}-${c}`);
    } else {
      setMergeTargetKey(null);
    }
  };

  const handleDragEnd = ({ active, over }) => {
    setDraggingItem(null);
    setMergeTargetKey(null);
    if (!over) return;
    const { cellKey: fromKey } = active.data.current;
    const [fromR, fromC] = parseKey(fromKey);
    const { r: toR, c: toC } = over.data.current;
    if (fromR === toR && fromC === toC) return;

    const fromItem = grid[fromR][fromC];
    const toItem = grid[toR][toC];

    if (toItem) {
      if (fromItem.level === toItem.level) {
        mergeItems(fromR, fromC, toR, toC);
      } else {
        swapItems(fromR, fromC, toR, toC);
      }
    } else {
      moveItem(fromR, fromC, toR, toC);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className={styles.grid}>
        {Array.from({ length: GRID_SIZE }, (_, r) =>
          Array.from({ length: GRID_SIZE }, (_, c) => (
            <Cell
              key={`${r}-${c}`}
              r={r}
              c={c}
              item={grid[r][c]}
              isMergeTarget={mergeTargetKey === `${r}-${c}`}
            />
          ))
        )}
      </div>
      <DragOverlay>
        {draggingItem && (
          <div className={styles.dragOverlay}>
            <span>{getItem(draggingItem.level).emoji}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default Grid;
