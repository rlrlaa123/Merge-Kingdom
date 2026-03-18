import useGameStore from '../store/useGameStore';
import { getTreeItem } from '../data/mergeTree';
import { formatNumber } from '../utils/formatNumber';
import { sfxMerge, sfxFail } from '../utils/sound';
import styles from './OrderBoard.module.css';

const OrderBoard = () => {
  const orders = useGameStore(s => s.orders);
  const maxOrders = useGameStore(s => s.maxOrders);
  const canDeliver = useGameStore(s => s.canDeliver);
  const deliverOrder = useGameStore(s => s.deliverOrder);
  const skipOrder = useGameStore(s => s.skipOrder);
  const grid = useGameStore(s => s.grid);
  const gridSize = useGameStore(s => s.gridSize);

  // 그리드에서 사용 가능한 아이템 수 계산
  const available = {};
  for (let r = 0; r < gridSize; r++)
    for (let c = 0; c < gridSize; c++) {
      const item = grid[r]?.[c];
      if (item && item.special !== 'rock') {
        const key = `${item.tree || 'animal'}-${item.level}`;
        available[key] = (available[key] || 0) + 1;
      }
    }

  const handleDeliver = (id) => {
    const ok = deliverOrder(id);
    if (ok) sfxMerge();
    else sfxFail();
  };

  if (orders.length === 0) return null;

  return (
    <div className={styles.board}>
      {orders.map(order => {
        const deliverable = canDeliver(order.id);
        return (
          <div key={order.id} className={`${styles.card} ${deliverable ? styles.ready : ''}`}>
            <div className={styles.items}>
              {order.requirements.map((req, i) => {
                const emoji = getTreeItem(req.tree, req.level).emoji;
                const key = `${req.tree}-${req.level}`;
                const have = available[key] || 0;
                const met = have >= req.count;
                return (
                  <span key={i} className={`${styles.req} ${met ? styles.met : ''}`}>
                    {emoji}×{req.count}{met ? '✅' : ''}
                  </span>
                );
              })}
            </div>
            <div className={styles.reward}>
              {formatNumber(order.coinReward)} 🪙 +{order.fameReward} ⭐
            </div>
            <div className={styles.actions}>
              <button
                className={styles.deliverBtn}
                disabled={!deliverable}
                onClick={() => handleDeliver(order.id)}
              >
                납품
              </button>
              <button className={styles.skipBtn} onClick={() => skipOrder(order.id)}>✕</button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderBoard;
