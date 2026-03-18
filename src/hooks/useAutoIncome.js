import { useEffect } from 'react';
import useGameStore from '../store/useGameStore';

export const useAutoIncome = () => {
  const tick = useGameStore(s => s.tick);
  const tickFreeSpawn = useGameStore(s => s.tickFreeSpawn);
  const tickHarvest = useGameStore(s => s.tickHarvest);
  const tickBoost = useGameStore(s => s.tickBoost);

  useEffect(() => {
    const id = setInterval(() => {
      tick();
      tickFreeSpawn();
      tickHarvest();
      tickBoost();
    }, 1000);
    return () => clearInterval(id);
  }, [tick, tickFreeSpawn, tickHarvest, tickBoost]);
};
