import { useState, useEffect } from 'react';
import useGameStore from '../store/useGameStore';

export const useOfflineReward = () => {
  const [reward, setReward] = useState(null);
  const load = useGameStore(s => s.load);
  const calcOfflineReward = useGameStore(s => s.calcOfflineReward);

  useEffect(() => {
    const data = load();
    if (data?.savedAt) {
      const { income, elapsed } = calcOfflineReward(data.savedAt);
      if (income > 0) {
        useGameStore.setState(state => ({ coins: state.coins + income }));
        setReward({ income, elapsed });
      }
    } else {
      // 신규 시작 — 주문 슬롯 채우기
      useGameStore.getState().initOrders();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { reward, clearReward: () => setReward(null) };
};
