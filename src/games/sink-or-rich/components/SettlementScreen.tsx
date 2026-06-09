import React from 'react';
import { PlayerState, VoyageMode } from '../types';
import { calculateMaxHull, calculateRepairCost } from '../engine';
import styles from './styles.module.css';

interface Props {
  player: PlayerState;
  mode: VoyageMode; // 'arrived', 'returning', 'sunk'
  resultMsg: string[];
  onFinishSettlement: () => void;
}

export const SettlementScreen: React.FC<Props> = ({ player, mode, resultMsg, onFinishSettlement }) => {
  let title = '';
  let color = '#fff';
  
  if (mode === 'arrived') {
    title = '成功到港！';
    color = '#4caf50';
  } else if (mode === 'returning') {
    title = '狼狈返航';
    color = '#ff9800';
  } else if (mode === 'sunk') {
    title = '沉船！';
    color = '#f44336';
  }

  const maxHull = calculateMaxHull(player.currentShip, player.ownedArmor);
  const repairCost = calculateRepairCost(player);

  return (
    <div className={styles.container}>
      <div className={styles.titleScreen}>
        <h1 className={styles.title} style={{ color, background: 'none', WebkitTextFillColor: color }}>{title}</h1>
        
        <div className={styles.card} style={{ width: '100%', maxWidth: '400px', textAlign: 'left', margin: '20px 0' }}>
          <h3 className={styles.cardTitle}>结算明细</h3>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
            {resultMsg.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>

        {mode !== 'sunk' && player.currentShip && (
          <div className={styles.card} style={{ width: '100%', maxWidth: '400px', textAlign: 'left' }}>
            <h3 className={styles.cardTitle}>船只状况</h3>
            <p>剩余耐久: {player.currentHull} / {maxHull}</p>
            {repairCost > 0 ? (
              <p style={{ color: '#ff9800' }}>建议维修费: 💰{repairCost} (请在港口手动维修)</p>
            ) : (
              <p style={{ color: '#4caf50' }}>船只完好，无需维修。</p>
            )}
          </div>
        )}

        <button className={styles.btnPrimary} style={{ marginTop: '30px' }} onClick={onFinishSettlement}>
          返回避风港
        </button>
      </div>
    </div>
  );
};
