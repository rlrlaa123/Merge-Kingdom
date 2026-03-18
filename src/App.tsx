import { useEffect } from 'react';
import TopBar from './components/TopBar';
import SourceBar from './components/SourceBar';
import OrderBoard from './components/OrderBoard';
import Board from './components/Board';
import BottomBar from './components/BottomBar';
import FloatingTexts from './components/FloatingTexts';
import FtueOverlay from './components/FtueOverlay';
import useGameStore from './store/gameStore';
import './styles/global.css';

function App() {
  const load = useGameStore(s => s.load);
  const save = useGameStore(s => s.save);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const id = setInterval(save, 30_000);
    return () => clearInterval(id);
  }, [save]);

  useEffect(() => {
    const handleUnload = () => save();
    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') save();
    });
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [save]);

  return (
    <div className="app">
      <TopBar />
      <OrderBoard />
      <SourceBar />
      <main className="main">
        <Board />
      </main>
      <BottomBar />
      <FloatingTexts />
      <FtueOverlay />
    </div>
  );
}

export default App;
