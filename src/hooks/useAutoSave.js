import { useEffect } from 'react';
import useGameStore from '../store/useGameStore';

export const useAutoSave = () => {
  const save = useGameStore(s => s.save);
  useEffect(() => {
    const id = setInterval(save, 30_000);
    const onUnload = () => save();
    window.addEventListener('beforeunload', onUnload);
    return () => {
      clearInterval(id);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [save]);
};
