import React, { useState, useEffect } from 'react';
import { PlayerState } from '../types';
import { Modal } from './Modal';
import styles from './styles.module.css';

interface Props {
  player: PlayerState;
  onStartNew: () => void;
  onContinue: () => void;
  onReset: () => void;
  hasSavedVoyage: boolean;
}

export const TitleScreen: React.FC<Props> = ({ player, onStartNew, onContinue, onReset, hasSavedVoyage }) => {
  const [modal, setModal] = useState<{title: string, msg: string, onConfirm: () => void, onCancel: () => void} | null>(null);
  const canContinue = player.voyageCount > 0 || player.gold !== 1000 || hasSavedVoyage;

  return (
    <div className={styles.container}>
      <div className={styles.titleScreen}>
        <h1 className={styles.title}>一船暴富</h1>
        <h2 className={styles.subtitle}>Sink or Rich</h2>
        <p style={{ marginBottom: '2rem' }}>买一艘船，赌一次命。</p>

        {canContinue ? (
          <button className={styles.btnPrimary} onClick={onContinue}>
            继续游戏
          </button>
        ) : (
          <button className={styles.btnPrimary} onClick={onStartNew}>
            开始游戏
          </button>
        )}

        {canContinue && (
          <button className={styles.btnSecondary} onClick={() => {
            setModal({
              title: '重置存档',
              msg: '确定要重置存档吗？所有进度将丢失！',
              onConfirm: () => {
                onReset();
                setModal(null);
              },
              onCancel: () => setModal(null)
            });
          }}>
            重置存档
          </button>
        )}
      </div>
      {modal && (
        <Modal
          title={modal.title}
          message={modal.msg}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
        />
      )}
    </div>
  );
};
