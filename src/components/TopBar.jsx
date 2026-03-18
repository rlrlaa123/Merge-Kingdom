import { useEffect, useRef, useState } from 'react';
import useGameStore from '../store/useGameStore';
import { QUESTS } from '../data/quests';
import { getNextKingdomLevel } from '../data/mergeTree';
import { formatNumber } from '../utils/formatNumber';
import styles from './TopBar.module.css';

const TopBar = ({ onOpenCollection, onOpenQuests, onOpenSettings }) => {
  const coins = useGameStore(s => s.coins);
  const incomePerSec = useGameStore(s => s.getIncomePerSec());
  const questProgress = useGameStore(s => s.questProgress);
  const claimedQuests = useGameStore(s => s.claimedQuests);
  const fame = useGameStore(s => s.fame);
  const kingdomLevel = useGameStore(s => s.kingdomLevel);
  const boostActive = useGameStore(s => s.boostActive);

  const [displayCoins, setDisplayCoins] = useState(Math.floor(coins));
  const animRef = useRef(null);
  const fromRef = useRef(Math.floor(coins));

  const claimableCount = QUESTS.filter(q =>
    !claimedQuests.includes(q.id) && (questProgress[q.id] || 0) >= q.target
  ).length;

  const nextKL = getNextKingdomLevel(kingdomLevel);
  const fameProgress = nextKL ? Math.min((fame / nextKL.fame) * 100, 100) : 100;

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
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
      else fromRef.current = target;
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [coins]);

  return (
    <div className={styles.topBar}>
      <div className={styles.left}>
        <div className={styles.coinRow}>
          <span className={styles.coins}>🪙 {formatNumber(displayCoins)}</span>
          <span className={styles.income}>
            +{incomePerSec.toFixed(1)}/초
            {boostActive && <span className={styles.boostBadge}>⚡×2</span>}
          </span>
        </div>
        <div className={styles.fameRow}>
          <span className={styles.fameLabel}>⭐ Lv.{kingdomLevel}</span>
          <div className={styles.fameBar}>
            <div className={styles.fameFill} style={{ width: `${fameProgress}%` }} />
          </div>
          <span className={styles.fameText}>
            {formatNumber(fame)}{nextKL ? `/${formatNumber(nextKL.fame)}` : ''}
          </span>
        </div>
      </div>
      <div className={styles.buttons}>
        <button className={styles.iconBtn} onClick={onOpenQuests}>
          📋{claimableCount > 0 && <span className={styles.badge}>{claimableCount}</span>}
        </button>
        <button className={styles.iconBtn} onClick={onOpenCollection}>📖</button>
        <button className={styles.iconBtn} onClick={onOpenSettings}>⚙️</button>
      </div>
    </div>
  );
};

export default TopBar;
