import { useEffect, useRef, useState } from 'react';
import useGameStore from '../store/useGameStore';
import { formatNumber } from '../utils/formatNumber';
import styles from './TopBar.module.css';

const TopBar = ({ onOpenCollection }) => {
  const coins = useGameStore(s => s.coins);
  const incomePerSec = useGameStore(s => s.getIncomePerSec());
  const [displayCoins, setDisplayCoins] = useState(Math.floor(coins));
  const animRef = useRef(null);
  const startRef = useRef(null);
  const fromRef = useRef(Math.floor(coins));

  useEffect(() => {
    const target = Math.floor(coins);
    if (target === fromRef.current) return;
    const from = fromRef.current;
    const diff = target - from;
    const duration = Math.min(Math.abs(diff) * 5, 400);
    const startTime = performance.now();
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayCoins(Math.round(from + diff * ease));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        fromRef.current = target;
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [coins]);

  return (
    <div className={styles.topBar}>
      <div className={styles.coinInfo}>
        <span className={styles.coins}>🪙 {formatNumber(displayCoins)}</span>
        <span className={styles.income}>+{incomePerSec.toFixed(1)}/초</span>
      </div>
      <button className={styles.iconBtn} onClick={onOpenCollection}>📖</button>
    </div>
  );
};

export default TopBar;
