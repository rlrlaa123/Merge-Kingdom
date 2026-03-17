import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import { MERGE_TREE } from '../data/mergeTree';
import styles from './CollectionModal.module.css';

const CollectionModal = ({ open, onClose }) => {
  const discovered = useGameStore(s => s.discovered);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className={styles.modal}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CollectionModal;
