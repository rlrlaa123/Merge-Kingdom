import { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import { unlockAudio } from './utils/sound';
import Grid from './components/Grid';
import BottomBar from './components/BottomBar';
import CollectionModal from './components/CollectionModal';
import OfflineRewardModal from './components/OfflineRewardModal';
import ErrorBoundary from './components/ErrorBoundary';
import { useAutoIncome } from './hooks/useAutoIncome';
import { useAutoSave } from './hooks/useAutoSave';
import { useOfflineReward } from './hooks/useOfflineReward';
import './styles/global.css';

function Game() {
  const [collectionOpen, setCollectionOpen] = useState(false);
  const { reward, clearReward } = useOfflineReward();


  useAutoIncome();
  useAutoSave();

  useEffect(() => {
    const unlock = () => unlockAudio();
    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });
    return () => {
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
  }, []);

  return (
    <div className="app">
      <TopBar onOpenCollection={() => setCollectionOpen(true)} />
      <main className="main">
        <ErrorBoundary>
          <Grid />
        </ErrorBoundary>
      </main>
      <BottomBar />
      <CollectionModal open={collectionOpen} onClose={() => setCollectionOpen(false)} />
      <OfflineRewardModal reward={reward} onClose={clearReward} />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Game />
    </ErrorBoundary>
  );
}

export default App;
