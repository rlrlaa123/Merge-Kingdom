import { useState, useEffect } from 'react';
import useGameStore from '../store/gameStore';
import { getChain } from '../data/chains';
import styles from './SourceBar.module.css';

const SourceBar = () => {
  const sources = useGameStore(s => s.sources);
  const tapSource = useGameStore(s => s.tapSource);
  const upgradeSource = useGameStore(s => s.upgradeSource);
  const getSourceUpgradeCost = useGameStore(s => s.getSourceUpgradeCost);
  const gold = useGameStore(s => s.gold);
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick(t => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.bar}>
      {sources.map(source => {
        const chain = getChain(source.chainId);
        if (!chain) return null;
        const now = Date.now();
        const ready = now >= source.cooldownEnd;
        const remaining = ready ? 0 : Math.ceil((source.cooldownEnd - now) / 1000);
        const upgCost = getSourceUpgradeCost(source.chainId);
        const canUpgrade = upgCost > 0 && gold >= upgCost;

        return (
          <div key={source.chainId} className={styles.sourceWrap}>
            <button
              className={`${styles.source} ${ready ? styles.ready : styles.cooling}`}
              onClick={() => tapSource(source.chainId)}
              disabled={!ready}
            >
              <span className={styles.emoji}>{chain.sourceEmoji}</span>
              {ready ? (
                <span className={styles.label}>{chain.sourceName}</span>
              ) : (
                <span className={styles.timer}>{remaining}초</span>
              )}
              {source.level > 1 && <span className={styles.lvBadge}>Lv{source.level}</span>}
            </button>
            {upgCost > 0 && (
              <button
                className={`${styles.upgradeBtn} ${canUpgrade ? styles.canUpgrade : ''}`}
                onClick={() => upgradeSource(source.chainId)}
                disabled={!canUpgrade}
              >
                ⬆ {upgCost}🪙
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SourceBar;
