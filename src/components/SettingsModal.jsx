import { useRef, useState } from 'react';
import useGameStore from '../store/useGameStore';
import styles from './SettingsModal.module.css';

const SettingsModal = ({ open, onClose }) => {
  const resetGame = useGameStore(s => s.resetGame);
  const [confirmStep, setConfirmStep] = useState(0);
  const overlayRef = useRef(null);

  if (!open) return null;

  const handleReset = () => {
    if (confirmStep === 0) {
      setConfirmStep(1);
    } else {
      resetGame();
      setConfirmStep(0);
      onClose();
    }
  };

  const handleClose = () => {
    setConfirmStep(0);
    onClose();
  };

  return (
    <div ref={overlayRef} className={styles.overlay} onClick={e => e.target === overlayRef.current && handleClose()}>
      <div className={styles.modal}>
        <h2 className={styles.title}>⚙️ 설정</h2>

        <div className={styles.section}>
          <button
            className={`${styles.resetBtn} ${confirmStep === 1 ? styles.danger : ''}`}
            onClick={handleReset}
          >
            {confirmStep === 0 ? '🗑️ 게임 초기화' : '⚠️ 정말 초기화하시겠습니까?'}
          </button>
          {confirmStep === 1 && (
            <p className={styles.warn}>모든 진행 상황이 삭제됩니다. 되돌릴 수 없습니다!</p>
          )}
        </div>

        <button className={styles.closeBtn} onClick={handleClose}>닫기</button>
      </div>
    </div>
  );
};

export default SettingsModal;
