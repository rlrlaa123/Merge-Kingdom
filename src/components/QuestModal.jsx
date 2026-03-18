import { useRef } from 'react';
import useGameStore from '../store/useGameStore';
import { QUESTS } from '../data/quests';
import { formatNumber } from '../utils/formatNumber';
import { sfxMerge } from '../utils/sound';
import styles from './QuestModal.module.css';

const QuestModal = ({ open, onClose }) => {
  const questProgress = useGameStore(s => s.questProgress);
  const claimedQuests = useGameStore(s => s.claimedQuests);
  const claimQuest = useGameStore(s => s.claimQuest);
  const overlayRef = useRef(null);

  if (!open) return null;

  const handleClaim = (id) => {
    const ok = claimQuest(id);
    if (ok) sfxMerge();
  };

  return (
    <div ref={overlayRef} className={styles.overlay} onClick={e => e.target === overlayRef.current && onClose()}>
      <div className={styles.modal}>
        <h2 className={styles.title}>📋 퀘스트</h2>
        <div className={styles.list}>
          {QUESTS.map(q => {
            const progress = questProgress[q.id] || 0;
            const claimed = claimedQuests.includes(q.id);
            const completed = progress >= q.target;
            const pct = Math.min(progress / q.target * 100, 100);

            return (
              <div key={q.id} className={`${styles.quest} ${claimed ? styles.claimed : ''} ${completed && !claimed ? styles.ready : ''}`}>
                <div className={styles.questIcon}>{q.icon}</div>
                <div className={styles.questInfo}>
                  <div className={styles.questTitle}>{q.title}</div>
                  <div className={styles.questDesc}>{q.desc}</div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                  </div>
                  <div className={styles.progressText}>{progress}/{q.target}</div>
                </div>
                <div className={styles.questReward}>
                  {claimed ? (
                    <span className={styles.checkmark}>✅</span>
                  ) : completed ? (
                    <button className={styles.claimBtn} onClick={() => handleClaim(q.id)}>
                      {formatNumber(q.reward)} 🪙
                    </button>
                  ) : (
                    <span className={styles.rewardText}>{formatNumber(q.reward)} 🪙</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <button className={styles.closeBtn} onClick={onClose}>닫기</button>
      </div>
    </div>
  );
};

export default QuestModal;
