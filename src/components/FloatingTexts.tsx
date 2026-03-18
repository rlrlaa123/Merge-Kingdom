import useGameStore from '../store/gameStore';
import styles from './FloatingTexts.module.css';

const FloatingTexts = () => {
  const texts = useGameStore(s => s.floatingTexts);
  
  return (
    <div className={styles.container}>
      {texts.map(t => (
        <div
          key={t.id}
          className={styles.text}
          style={{ left: `${(t.x / 5) * 100}%`, top: `${(t.y / 5) * 100}%` }}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
};

export default FloatingTexts;
