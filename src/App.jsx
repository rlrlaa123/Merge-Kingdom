import { useState } from 'react';
import TopBar from './components/TopBar';
import Grid from './components/Grid';
import BottomBar from './components/BottomBar';
import FloatingText from './components/FloatingText';
import CollectionModal from './components/CollectionModal';
import OfflineRewardModal from './components/OfflineRewardModal';
import { useAutoIncome } from './hooks/useAutoIncome';
import { useAutoSave } from './hooks/useAutoSave';
import { useOfflineReward } from './hooks/useOfflineReward';
import './styles/global.css';

function App() {
  const [collectionOpen, setCollectionOpen] = useState(false);
  const { reward, clearReward } = useOfflineReward();

  useAutoIncome();
  useAutoSave();

  return (
    <div className="app">
      <TopBar onOpenCollection={() => setCollectionOpen(true)} />
      <main className="main">
        <Grid />
      </main>
      <BottomBar />
      <FloatingText />
      <CollectionModal open={collectionOpen} onClose={() => setCollectionOpen(false)} />
      <OfflineRewardModal reward={reward} onClose={clearReward} />
    </div>
  );
}

export default App;
