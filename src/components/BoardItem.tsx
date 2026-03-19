import { memo } from 'react';
import { getChainItem } from '../data/chains';
import { ENERGY_BOX_VALUES } from '../data/generators';
import styles from './BoardItem.module.css';

interface Props {
  chain: string;
  level: number;
  special?: string;
  isDragging?: boolean;
  dragRef?: (el: HTMLElement | null) => void;
  dragListeners?: Record<string, unknown>;
  dragAttributes?: Record<string, unknown>;
}

const BoardItem = memo(({ chain, level, special, isDragging, dragRef, dragListeners, dragAttributes }: Props) => {
  if (special === 'energyBox') {
    const val = ENERGY_BOX_VALUES[level - 1] || 10;
    return (
      <div ref={dragRef} {...(dragListeners as any)} {...(dragAttributes as any)}
        className={`${styles.item} ${styles.energyBox} ${isDragging ? styles.dragging : ''}`}>
        <span className={styles.emoji}>⚡</span>
        <span className={styles.boxLabel}>+{val}</span>
      </div>
    );
  }

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
