import { memo } from 'react';
import { getChainItem } from '../data/chains';
import styles from './BoardItem.module.css';

interface Props {
  chain: string;
  level: number;
  isDragging?: boolean;
  dragRef?: (el: HTMLElement | null) => void;
  dragListeners?: Record<string, unknown>;
  dragAttributes?: Record<string, unknown>;
}

const BoardItem = memo(({ chain, level, isDragging, dragRef, dragListeners, dragAttributes }: Props) => {
  const item = getChainItem(chain, level);
  if (!item) return null;

  return (
    <div
      ref={dragRef}
      {...(dragListeners as any)}
      {...(dragAttributes as any)}
      className={`${styles.item} ${isDragging ? styles.dragging : ''}`}
    >
      <span className={styles.emoji}>{item.emoji}</span>
    </div>
  );
});

export default BoardItem;
