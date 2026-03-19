import useGameStore, { type BoardItem } from '../store/gameStore';
import styles from './OrderBoard.module.css';

const DIFF_CLASS: Record<string, string> = {
  easy: styles.easy,
  medium: styles.medium,
  hard: styles.hard,
};

interface Props {
  onItemClick?: (item: BoardItem) => void;
}

const OrderBoard = ({ onItemClick }: Props) => {
  const orders = useGameStore(s => s.orders);
  const canDeliver = useGameStore(s => s.canDeliver);
  const deliverOrder = useGameStore(s => s.deliverOrder);
  const board = useGameStore(s => s.board);
  const boardSize = useGameStore(s => s.boardSize);

  // 보드 아이템 카운팅
  const available: Record<string, number> = {};
  for (let r = 0; r < boardSize; r++)
    for (let c = 0; c < boardSize; c++) {
      const item = board[r]?.[c];
      if (item && !item.special) {
        const key = `${item.chain}-${item.level}`;
        available[key] = (available[key] || 0) + 1;
      }
    }

  const doneCount = orders.filter(o => o.delivered).length;
  const sortedOrders = [...orders].sort((a, b) => (a.delivered ? 1 : 0) - (b.delivered ? 1 : 0));

  return (
    <div className={styles.wrapper}>
      <div className={styles.progress}>
        주문 {doneCount}/4
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${(doneCount / 4) * 100}%` }} />
        </div>
      </div>
      <div className={styles.board}>
        {sortedOrders.map(order => {
          const deliverable = canDeliver(order.id);
          const diffClass = DIFF_CLASS[order.difficulty] || '';
          return (
            <div
              key={order.id}
              className={`${styles.card} ${diffClass} ${deliverable ? styles.ready : ''} ${order.delivered ? styles.delivered : ''}`}
            >
              {order.delivered ? (
                <div className={styles.doneOverlay}>✅</div>
              ) : (
                <>
                  <div className={styles.header}>
                    <span className={styles.character}>{order.characterEmoji}</span>
                    <span className={styles.name}>{order.characterName}</span>
                  </div>
                  <div className={styles.dialogue}>"{order.dialogue}"</div>
                  <div className={styles.items}>
                    {order.items.map((item, i) => {
                      const key = `${item.chain}-${item.level}`;
                      const have = available[key] || 0;
                      const met = have >= item.quantity;
                      return (
                        <span
                          key={i}
                          className={`${styles.req} ${met ? styles.met : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onItemClick?.({ id: '', chain: item.chain, level: item.level });
                          }}
                        >
                          {item.emoji}×{item.quantity}
                        </span>
                      );
                    })}
                  </div>
                  <div className={styles.reward}>
                    🪙{order.coinReward} ⭐{order.fameReward}
                  </div>
                  <button
                    className={styles.deliverBtn}
                    disabled={!deliverable}
                    onClick={() => deliverOrder(order.id)}
                  >
                    납품
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderBoard;
