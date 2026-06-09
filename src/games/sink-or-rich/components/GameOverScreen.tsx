import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';
import { PlayerState } from '../types';
import { BANKRUPT_ENDINGS } from '../content/endings';

interface Props {
  player: PlayerState;
  onRestart: () => void;
}

export function GameOverScreen({ player, onRestart }: Props) {
  const [endingText, setEndingText] = useState('');

  useEffect(() => {
    // Pick a random ending on mount
    const randomIndex = Math.floor(Math.random() * BANKRUPT_ENDINGS.length);
    setEndingText(BANKRUPT_ENDINGS[randomIndex]);
  }, []);

  return (
    <div className={styles.gameOverContainer}>
      <div className={styles.crawlWrapper}>
        <div className={styles.crawlText}>
          <h1>彻底破产</h1>
          <p>你的船沉了，身上连一艘小渔船都买不起（金币: {player.gold}）。</p>
          <br /><br />
          <p className={styles.highlightText}>{endingText}</p>
          <br /><br /><br /><br />
          <p>--- 游戏结束 ---</p>
          <br />
          <p>出航次数: {player.voyageCount}</p>
          <p>成功抵达: {player.successfulVoyageCount}</p>
          <p>沉船次数: {player.sinkCount}</p>
        </div>
      </div>
      
      <button className={styles.btnRestart} onClick={onRestart}>
        接受命运，重新开始
      </button>
    </div>
  );
}
