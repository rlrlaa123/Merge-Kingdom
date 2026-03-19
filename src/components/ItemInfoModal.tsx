import { memo } from 'react';
import { getChain, getChainItem } from '../data/chains';
import { ENERGY_BOX_VALUES } from '../data/generators';
import type { BoardItem } from '../store/gameStore';
import styles from './ItemInfoModal.module.css';

interface Props {
  item: BoardItem;
  onClose: () => void;
}

const ItemInfoModal = memo(({ item, onClose }: Props) => {
  if (item.special === 'energyBox') {
    const val = ENERGY_BOX_VALUES[item.level - 1] || 10;
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.mainEmoji}>⚡</div>
          <h3 className={styles.title}>에너지 박스</h3>
          <p className={styles.desc}>탭하면 ⚡+{val} 획득</p>
          {item.level < 3 && (
            <p className={styles.hint}>같은 박스 2개를 머지하면 더 큰 박스!</p>
          )}
          <button className={styles.closeBtn} onClick={onClose}>닫기</button>
        </div>
      </div>
    );
  }

  const chain = getChain(item.chain);
  const chainItem = getChainItem(item.chain, item.level);
  if (!chain || !chainItem) return null;

  const prevItem = item.level > 1 ? getChainItem(item.chain, item.level - 1) : null;
  const nextItem = item.level < chain.items.length ? getChainItem(item.chain, item.level + 1) : null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.mainEmoji}>{chainItem.emoji}</div>
        <h3 className={styles.title}>{chainItem.name}</h3>
        <p className={styles.sub}>{chain.name} 체인 · Lv.{item.level}</p>

        {/* 제작 방법 */}
        <div className={styles.section}>
          <span className={styles.label}>만드는 법</span>
          {item.level === 1 ? (
            <div className={styles.recipe}>
              {chain.sourceEmoji} 탭 → {chainItem.emoji}
            </div>
          ) : prevItem ? (
            <div className={styles.recipe}>
              {prevItem.emoji} + {prevItem.emoji} → {chainItem.emoji}
            </div>
          ) : null}
        </div>

        {/* 다음 단계 */}
        {nextItem && (
          <div className={styles.section}>
            <span className={styles.label}>다음 단계</span>
            <div className={styles.recipe}>
              {chainItem.emoji} + {chainItem.emoji} → {nextItem.emoji} {nextItem.name}
            </div>
          </div>
        )}

        {!nextItem && (
          <div className={styles.maxBadge}>✨ 최고 등급!</div>
        )}

        {/* 전체 체인 미리보기 */}
        <div className={styles.chainPreview}>
          {chain.items.map((ci, i) => (
            <span
              key={ci.id}
              className={`${styles.chainItem} ${ci.level === item.level ? styles.current : ''} ${ci.level > item.level ? styles.locked : ''}`}
            >
              {ci.emoji}
              {i < chain.items.length - 1 && <span className={styles.arrow}>→</span>}
            </span>
          ))}
        </div>

        <button className={styles.closeBtn} onClick={onClose}>닫기</button>
      </div>
    </div>
  );
});

export default ItemInfoModal;
