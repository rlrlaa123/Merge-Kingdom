import { formatNumber } from '../utils/formatNumber';
import styles from './OfflineRewardModal.module.css';

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
};

const OfflineRewardModal = ({ reward, onClose }) => {
  if (!reward) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.icon}>🎁</div>
        <h2 className={styles.title}>오프라인 보상!</h2>
        <p className={styles.desc}>{formatTime(reward.elapsed)} 동안 열심히 일했어요</p>
        <div className={styles.reward}>
          <span>🪙 +{formatNumber(reward.income)}</span>
        </div>
        <button className={styles.btn} onClick={onClose}>받기!</button>
      </div>
    </div>
  );
};

export default OfflineRewardModal;
