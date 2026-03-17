import { useEffect } from 'react';
import useGameStore from '../store/useGameStore';

export const useAutoIncome = () => {
  const tick = useGameStore(s => s.tick);
  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);
};
