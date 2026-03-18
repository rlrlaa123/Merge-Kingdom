import { useState, useEffect } from 'react';
import useGameStore from '../store/useGameStore';
import { getTreeItem } from '../data/mergeTree';
import { formatNumber } from '../utils/formatNumber';
import { sfxMerge, sfxFail } from '../utils/sound';
import styles from './OrderBoard.module.css';

const DIFF_CLASS = { easy: styles.easy, normal: styles.normal, hard: styles.hard };

const OrderBoard = () => {
  const orders = useGameStore(s => s.orders);
  const maxOrders = useGameStore(s => s.maxOrders);
  const orderSlotCooldowns = useGameStore(s => s.orderSlotCooldowns);
  const canDeliver = useGameStore(s => s.canDeliver);
  const deliverOrder = useGameStore(s => s.deliverOrder);
  const skipOrder = useGameStore(s => s.skipOrder);
  const grid = useGameStore(s => s.grid);
  const gridSize = useGameStore(s => s.gridSize);

  // 쿨다운 남은 시간 표시용 (1초마다 갱신)
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // 그리드 아이템 카운팅
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
    if (deliverOrder(id)) sfxMerge();
    else sfxFail();
  };

  // 쿨다운 슬롯 수
  const now = Date.now();
  const cooldownSlots = [];
  for (let i = orders.length; i < maxOrders; i++) {
    const cd = orderSlotCooldowns[i];
    if (cd && now < cd) {
      cooldownSlots.push(Math.ceil((cd - now) / 1000));
    }
  }

  return (
    <div className={styles.board}>
      {orders.map(order => {
        const deliverable = canDeliver(order.id);
        const diffClass = DIFF_CLASS[order.difficulty] || styles.normal;
        return (
          <div key={order.id} className={`${styles.card} ${diffClass} ${deliverable ? styles.ready : ''}`}>
            <div className={styles.header}>
              <span className={styles.label}>{order.label}</span>
              {order.difficulty === 'hard' && <span className={styles.hardBadge}>✨×2</span>}
            </div>
            <div className={styles.items}>
              {order.requirements.map((req, i) => {
                const emoji = getTreeItem(req.tree, req.level).emoji;
                const key = `${req.tree}-${req.level}`;
                const have = available[key] || 0;
                const met = have >= req.count;
                return (
                  <span key={i} className={`${styles.req} ${met ? styles.met : ''}`}>
                    {emoji}×{req.count}
                  </span>
                );
              })}
            </div>
            <div className={styles.reward}>
              {formatNumber(order.coinReward)} 🪙 +{order.fameReward} ⭐
            </div>
            <div className={styles.actions}>
              <button className={styles.deliverBtn} disabled={!deliverable} onClick={() => handleDeliver(order.id)}>
                납품
              </button>
              <button className={styles.skipBtn} onClick={() => skipOrder(order.id)}>✕</button>
            </div>
          </div>
        );
      })}
      {cooldownSlots.map((sec, i) => (
        <div key={`cd-${i}`} className={`${styles.card} ${styles.cooldownCard}`}>
          <div className={styles.cooldownText}>📦 새 주문 도착 중...</div>
          <div className={styles.cooldownTimer}>{sec}초</div>
        </div>
      ))}
    </div>
  );
};

export default OrderBoard;
