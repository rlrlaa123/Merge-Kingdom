import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import styles from './Cell.module.css';

// floatingTexts만 구독하는 전용 컴포넌트.
// Cell에서 분리함으로써 floatingTexts 변경 시 Cell(+AnimatePresence) 전체가
// 리렌더링되는 문제를 방지합니다.
const FloatingTextsOverlay = ({ r, c }) => {
  const allFloatingTexts = useGameStore(s => s.floatingTexts);
  const floatingTexts = useMemo(
    () => allFloatingTexts.filter(t => t.r === r && t.c === c),
    [allFloatingTexts, r, c]
  );

  return (
    <AnimatePresence>
      {floatingTexts.map(({ id, text }) => (
        <motion.div
          key={id}
          className={styles.floatingText}
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 0, y: -44, scale: 1.15 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: 'easeOut' }}
        >
          {text}
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export default FloatingTextsOverlay;
