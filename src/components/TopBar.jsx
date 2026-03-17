import { useRef, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import { formatNumber } from '../utils/formatNumber';
import styles from './TopBar.module.css';

const AnimatedCoins = ({ value }) => {
  const spring = useSpring(value, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, v => formatNumber(Math.round(v)));

  useEffect(() => { spring.set(value); }, [value, spring]);

  return <motion.span>{display}</motion.span>;
};

const TopBar = ({ onOpenCollection }) => {
  const coins = useGameStore(s => s.coins);
  const incomePerSec = useGameStore(s => s.getIncomePerSec());

  return (
    <div className={styles.topBar}>
      <div className={styles.coinInfo}>
        <span className={styles.coins}>
          🪙 <AnimatedCoins value={Math.floor(coins)} />
        </span>
        <span className={styles.income}>+{incomePerSec.toFixed(1)}/초</span>
      </div>
      <button className={styles.iconBtn} onClick={onOpenCollection}>📖</button>
    </div>
  );
};

export default TopBar;
