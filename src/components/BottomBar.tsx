import useGameStore from '../store/gameStore';
import styles from './BottomBar.module.css';

const BottomBar = () => {
  const expandBoard = useGameStore(s => s.expandBoard);
  const expandCost = useGameStore(s => s.getExpandCost());
  const gold = useGameStore(s => s.gold);
  const boardSize = useGameStore(s => s.boardSize);
  const resetGame = useGameStore(s => s.resetGame);

  return (
    <div className={styles.bar}>
      {expandCost && (
        <button
          className={`${styles.btn} ${gold >= expandCost ? styles.active : ''}`}
          onClick={expandBoard}
          disabled={gold < expandCost}
        >
          🔲 {boardSize + 1}×{boardSize + 1} ({expandCost}🪙)
        </button>
      )}
      <button className={styles.resetBtn} onClick={() => { if (confirm('정말 초기화?')) resetGame(); }}>
        ⚙️
      </button>
    </div>
  );
};

export default BottomBar;
