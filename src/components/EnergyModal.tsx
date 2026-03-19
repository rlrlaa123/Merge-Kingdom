import { useState, useEffect } from 'react';
import useGameStore from '../store/gameStore';
import { COIN_ENERGY_COST, COIN_ENERGY_AMOUNT, AD_ENERGY, MAX_ADS_PER_DAY, ENERGY_REGEN_INTERVAL } from '../data/generators';
import styles from './EnergyModal.module.css';

const EnergyModal = () => {
  const energy = useGameStore(s => s.energy);
  const gold = useGameStore(s => s.gold);
  const watchAd = useGameStore(s => s.watchAd);
  const buyEnergy = useGameStore(s => s.buyEnergy);
  const claimFreeGift = useGameStore(s => s.claimFreeGift);
  const canClaimFreeGift = useGameStore(s => s.canClaimFreeGift);
  const getFreeGiftCooldown = useGameStore(s => s.getFreeGiftCooldown);

  const [show, setShow] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // 에너지 0이면 자동 표시
  useEffect(() => {
    if (energy.current <= 0) setShow(true);
  }, [energy.current]);

  if (!show || energy.current > 0) return null;

  const nextRegenSec = Math.ceil((ENERGY_REGEN_INTERVAL - (Date.now() - energy.lastRegenTime)) / 1000);
  const adsLeft = MAX_ADS_PER_DAY - energy.adWatchCountToday;
  const canBuy = gold >= COIN_ENERGY_COST;
  const giftReady = canClaimFreeGift();
  const giftCd = getFreeGiftCooldown();

  const formatTime = (s: number) => {
    if (s <= 0) return '0초';
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}분 ${s % 60}초` : `${s}초`;
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.icon}>⚡</div>
        <h2 className={styles.title}>에너지 부족!</h2>
        <p className={styles.sub}>다음 에너지까지: {formatTime(Math.max(0, nextRegenSec))}</p>

        {giftReady && (
          <button className={styles.btn + ' ' + styles.gift} onClick={() => { claimFreeGift(); setShow(false); }}>
            🎁 무료 선물 받기
          </button>
        )}
        {!giftReady && giftCd > 0 && (
          <div className={styles.info}>🎁 다음 선물: {formatTime(giftCd)}</div>
        )}

        {adsLeft > 0 && (
          <button className={styles.btn + ' ' + styles.ad} onClick={() => { watchAd(); setShow(false); }}>
            🎬 광고 보기 → ⚡+{AD_ENERGY} ({adsLeft}/{MAX_ADS_PER_DAY})
          </button>
        )}

        <button
          className={`${styles.btn} ${styles.buy} ${!canBuy ? styles.disabled : ''}`}
          onClick={() => { if (canBuy) { buyEnergy(); setShow(false); } }}
          disabled={!canBuy}
        >
          🪙 {COIN_ENERGY_COST} → ⚡+{COIN_ENERGY_AMOUNT}
        </button>

        <button className={styles.closeBtn} onClick={() => setShow(false)}>
          기다리기
        </button>
      </div>
    </div>
  );
};

export default EnergyModal;
