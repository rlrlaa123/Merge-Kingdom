import { memo, useRef } from 'react';
import { getItem } from '../data/mergeTree';
import useGameStore from '../store/useGameStore';
import styles from './Item.module.css';

const Item = memo(({ id, level, isMerged, isDragging, dragRef, dragListeners, dragAttributes }) => {
  const renderCount = useRef(0);
  renderCount.current += 1;
  const isFresh = useGameStore(s => s.freshItemIds.has(id));
  const itemData = getItem(level);

  // 렌더링 추적 - 드래그 중 다른 아이템이 리렌더되면 이 로그가 찍힘
  console.log(`[Item] id=${id} level=${level} isDragging=${isDragging} isFresh=${isFresh} render=#${renderCount.current}`);

  return (
    <div
      ref={dragRef}
      {...dragListeners}
      {...dragAttributes}
      className={`${styles.item} ${isFresh ? styles.fresh : ''} ${isDragging ? styles.dragging : ''}`}
    >
      <span className={`${styles.emoji} ${isMerged ? styles.mergedEmoji : ''}`}>
        {itemData.emoji}
      </span>
      <span className={styles.level}>Lv.{level}</span>
    </div>
  );
});

export default Item;
