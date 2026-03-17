import { motion } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import styles from './FloatingText.module.css';

const FloatingText = () => {
  const floatingTexts = useGameStore(s => s.floatingTexts);

  return (
    <div className={styles.container}>
      {floatingTexts.map(({ id, text }) => (
        <motion.div
          key={id}
          className={styles.text}
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -50 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          {text}
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingText;
