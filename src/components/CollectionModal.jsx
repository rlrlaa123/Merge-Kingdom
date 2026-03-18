import { useRef } from 'react';
import useGameStore from '../store/useGameStore';
import { MERGE_TREE } from '../data/mergeTree';
import styles from './CollectionModal.module.css';

const CollectionModal = ({ open, onClose }) => {
  const discovered = useGameStore(s => s.discovered);
  const overlayRef = useRef(null);

  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div ref={overlayRef} className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <h2 className={styles.title}>📖 도감</h2>
        <div className={styles.grid}>
          {MERGE_TREE.map(item => (
            <div key={item.level} className={`${styles.card} ${!discovered.has(item.level) ? styles.locked : ''}`}>
              <span className={styles.emoji}>{discovered.has(item.level) ? item.emoji : '❓'}</span>
              <span className={styles.name}>{discovered.has(item.level) ? item.name : '???'}</span>
              {discovered.has(item.level) && (
                <span className={styles.income}>+{item.coinsPerSec}/초</span>
              )}
            </div>
          ))}
        </div>
        <button className={styles.closeBtn} onClick={onClose}>닫기</button>
      </div>
    </div>
  );
};

export default CollectionModal;
