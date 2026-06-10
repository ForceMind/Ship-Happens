import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';
import { PlayerState } from '../types';
import { BANKRUPT_ENDINGS } from '../content/endings';
import { FINAL_STORY_PROGRESS } from '../content/progression';

interface Props {
  player: PlayerState;
  onRestart: () => void;
}

export function GameOverScreen({ player, onRestart }: Props) {
  const [endingText, setEndingText] = useState('');
  const isVictory = player.storyProgress >= FINAL_STORY_PROGRESS;

  useEffect(() => {
    if (isVictory) {
      setEndingText('你已经完成所有海域的征服，故事被写进港口传说。新的船长还会继续追逐这片海。');
    } else {
      const randomIndex = Math.floor(Math.random() * BANKRUPT_ENDINGS.length);
      setEndingText(BANKRUPT_ENDINGS[randomIndex]);
    }
  }, [isVictory]);

  return (
    <div className={styles.gameOverContainer}>
      <div className={styles.crawlWrapper}>
        <div className={styles.crawlText}>
          {isVictory ? (
            <React.Fragment>
              <h1 style={{ color: '#FFD700' }}>四海传奇</h1>
              <p>带着 {player.gold} 金币和完整海图，你选择了功成身退。</p>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <h1>彻底破产</h1>
              <p>你的船沉了，身上连一艘小渔船都买不起（金币: {player.gold}）。</p>
            </React.Fragment>
          )}
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
