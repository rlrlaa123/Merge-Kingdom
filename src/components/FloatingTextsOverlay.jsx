import { useMemo } from 'react';
import useGameStore from '../store/useGameStore';
import styles from './Cell.module.css';

const FloatingTextsOverlay = ({ r, c }) => {
  const allFloatingTexts = useGameStore(s => s.floatingTexts);
  const floatingTexts = useMemo(
    () => allFloatingTexts.filter(t => t.r === r && t.c === c),
    [allFloatingTexts, r, c]
  );

  return floatingTexts.map(({ id, text }) => (
    <div key={id} className={styles.floatingText}>
      {text}
    </div>
  ));
};

export default FloatingTextsOverlay;
