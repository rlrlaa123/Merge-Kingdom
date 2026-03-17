import { memo } from 'react';
import { getItem } from '../data/mergeTree';
import useGameStore from '../store/useGameStore';
import styles from './Item.module.css';

// 순수 프레젠테이션 컴포넌트. @dnd-kit 훅 없음 → 드래그 컨텍스트 변경 시 리렌더링 차단.
const Item = memo(({ id, level, isMerged, isDragging, dragRef, dragListeners, dragAttributes }) => {
  const isFresh = useGameStore(s => s.freshItemIds.has(id));
  const itemData = getItem(level);

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
