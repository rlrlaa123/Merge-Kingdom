import {
  DndContext,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { useState, useCallback, useMemo } from 'react';
import { getTreeItem } from '../data/mergeTree';
import Cell from './Cell';
import useGameStore from '../store/useGameStore';
import { parseKey } from '../utils/gridHelpers';
import { sfxPickup, sfxMerge, sfxDrop } from '../utils/sound';
import styles from './Grid.module.css';

const Grid = () => {
  const grid = useGameStore(s => s.grid);
  const gridSize = useGameStore(s => s.gridSize);
  const mergeItems = useGameStore(s => s.mergeItems);
  const swapItems = useGameStore(s => s.swapItems);
  const moveItem = useGameStore(s => s.moveItem);

  const [draggingItem, setDraggingItem] = useState(null);
  const [mergeTargetKey, setMergeTargetKey] = useState(null);
  const [mergedKey, setMergedKey] = useState(null);

  const mouseOptions = useMemo(() => ({ activationConstraint: { distance: 5 } }), []);
  const touchOptions = useMemo(() => ({ activationConstraint: { delay: 0, tolerance: 5 } }), []);
  const mouseSensor = useSensor(MouseSensor, mouseOptions);
  const touchSensor = useSensor(TouchSensor, touchOptions);
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = useCallback(({ active }) => {
    const { cellKey } = active.data.current;
    const [r, c] = parseKey(cellKey);
    setDraggingItem({ ...grid[r][c], cellKey });
    setMergedKey(null);
    sfxPickup();
  }, [grid]);

  const handleDragOver = useCallback(({ over }) => {
    if (!over || !draggingItem) { setMergeTargetKey(null); return; }
    const { r, c } = over.data.current;
    const [fromR, fromC] = parseKey(draggingItem.cellKey);
    const targetItem = grid[r][c];
    if (
      targetItem &&
      targetItem.level === draggingItem.level &&
      (targetItem.tree || 'animal') === (draggingItem.tree || 'animal') &&
      (r !== fromR || c !== fromC)
    ) {
      setMergeTargetKey(`${r}-${c}`);
    } else {
      setMergeTargetKey(null);
    }
  }, [draggingItem, grid]);

  const handleDragEnd = useCallback(({ active, over }) => {
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
      if (fromItem.level === toItem.level && (fromItem.tree || 'animal') === (toItem.tree || 'animal')) {
        const merged = mergeItems(fromR, fromC, toR, toC);
        if (merged) {
          sfxMerge();
          setMergedKey(`${toR}-${toC}`);
          setTimeout(() => setMergedKey(null), 600);
        }
      } else {
        sfxDrop();
        swapItems(fromR, fromC, toR, toC);
      }
    } else {
      sfxDrop();
      moveItem(fromR, fromC, toR, toC);
    }
  }, [grid, mergeItems, swapItems, moveItem]);

  const gridStyle = {
    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
    gridTemplateRows: `repeat(${gridSize}, 1fr)`,
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className={styles.grid} style={gridStyle}>
        {Array.from({ length: gridSize }, (_, r) =>
          Array.from({ length: gridSize }, (_, c) => (
            <Cell
              key={`${r}-${c}`}
              r={r}
              c={c}
              item={grid[r]?.[c]}
              isMergeTarget={mergeTargetKey === `${r}-${c}`}
              isMergedCell={mergedKey === `${r}-${c}`}
            />
          ))
        )}
      </div>
      <DragOverlay dropAnimation={null}>
        {draggingItem && (
          <div className={styles.dragOverlay}>
            <span>{getTreeItem(draggingItem.tree || 'animal', draggingItem.level).emoji}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default Grid;
