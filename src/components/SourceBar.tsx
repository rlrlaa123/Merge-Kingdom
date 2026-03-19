import useGameStore from '../store/gameStore';
import { getChain } from '../data/chains';
import { getGeneratorEnergyCost } from '../data/generators';
import styles from './SourceBar.module.css';

const SourceBar = () => {
  const sources = useGameStore(s => s.sources);
  const tapSource = useGameStore(s => s.tapSource);
  const upgradeSource = useGameStore(s => s.upgradeSource);
  const getSourceUpgradeCost = useGameStore(s => s.getSourceUpgradeCost);
  const gold = useGameStore(s => s.gold);
  const energyCurrent = useGameStore(s => s.energy.current);

  return (
    <div className={styles.bar}>
      {sources.map(source => {
        const chain = getChain(source.chainId);
        if (!chain) return null;
        const eCost = getGeneratorEnergyCost(source.chainId);
        const hasEnergy = energyCurrent >= eCost;
        const upgCost = getSourceUpgradeCost(source.chainId);
        const canUpgrade = upgCost > 0 && gold >= upgCost;

        return (
          <div key={source.chainId} className={styles.sourceWrap}>
            <button
              className={`${styles.source} ${hasEnergy ? styles.ready : styles.cooling}`}
              onClick={() => tapSource(source.chainId)}
              disabled={!hasEnergy}
            >
              <span className={styles.emoji}>{chain.sourceEmoji}</span>
              {hasEnergy ? (
                <span className={styles.label}>⚡{eCost} {chain.sourceName}</span>
              ) : (
                <span className={styles.timer}>⚡부족</span>
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
