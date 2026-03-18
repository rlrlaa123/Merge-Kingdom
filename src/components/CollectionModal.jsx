import { useRef } from 'react';
import useGameStore from '../store/useGameStore';
import { TREES } from '../data/mergeTree';
import styles from './CollectionModal.module.css';

const CollectionModal = ({ open, onClose }) => {
  const discovered = useGameStore(s => s.discovered);
  const unlockedTrees = useGameStore(s => s.unlockedTrees);
  const overlayRef = useRef(null);

  if (!open) return null;

  const isDiscovered = (treeId, level) =>
    discovered.has(`${treeId}-${level}`) || discovered.has(level); // 이전 형식 호환

  return (
    <div ref={overlayRef} className={styles.overlay} onClick={e => e.target === overlayRef.current && onClose()}>
      <div className={styles.modal}>
        <h2 className={styles.title}>📖 도감</h2>
        {TREES.filter(t => unlockedTrees.includes(t.id)).map(tree => (
          <div key={tree.id}>
            <h3 className={styles.treeTitle}>{tree.icon} {tree.name}</h3>
            <div className={styles.grid}>
              {tree.items.map(item => {
                const found = isDiscovered(tree.id, item.level);
                return (
                  <div key={`${tree.id}-${item.level}`} className={`${styles.card} ${!found ? styles.locked : ''}`}>
                    <span className={styles.emoji}>{found ? item.emoji : '❓'}</span>
                    <span className={styles.name}>{found ? item.name : '???'}</span>
                    {found && <span className={styles.income}>+{item.coinsPerSec}/초</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <button className={styles.closeBtn} onClick={onClose}>닫기</button>
      </div>
    </div>
  );
};

export default CollectionModal;
