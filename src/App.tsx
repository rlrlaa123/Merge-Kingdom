import { useEffect } from 'react';
import TopBar from './components/TopBar';
import SourceBar from './components/SourceBar';
import OrderBoard from './components/OrderBoard';
import Board from './components/Board';
import BottomBar from './components/BottomBar';
import FloatingTexts from './components/FloatingTexts';
import FtueOverlay from './components/FtueOverlay';
import EnergyModal from './components/EnergyModal';
import useGameStore from './store/gameStore';
import './styles/global.css';

function App() {
  const load = useGameStore(s => s.load);
  const save = useGameStore(s => s.save);
  const tickEnergy = useGameStore(s => s.tickEnergy);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = setInterval(() => { tickEnergy(); save(); }, 5_000);
    return () => clearInterval(id);
  }, [save, tickEnergy]);
  useEffect(() => {
    const h = () => save();
    window.addEventListener('beforeunload', h);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });
    return () => window.removeEventListener('beforeunload', h);
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
      <EnergyModal />
    </div>
  );
}

export default App;
