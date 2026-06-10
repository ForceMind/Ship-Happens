import React from 'react';
import { PlayerState, VoyageState } from '../types';
import { ENEMIES } from '../content/data';
import { calculateMaxHull, CombatAction } from '../engine';
import styles from './styles.module.css';

interface Props {
  player: PlayerState;
  voyage: VoyageState;
  onCombatAction: (action: CombatAction) => void;
}

export const CombatScreen: React.FC<Props> = ({ player, voyage, onCombatAction }) => {
  const combat = voyage.combatState;
  if (!combat) return null;

  const enemy = ENEMIES.find(e => e.id === combat.enemyId);
  if (!enemy) return null;

  const maxHull = calculateMaxHull(player.currentShip, player.ownedArmor);
  const hullPercent = Math.max(0, Math.min(100, (player.currentHull / maxHull) * 100));
  const enemyHpPercent = Math.max(0, Math.min(100, (combat.enemyHp / combat.enemyMaxHp) * 100));

  const hasNormalAmmo = (player.ownedAmmo['ammo_normal'] || 0) > 0;
  const hasChainAmmo = (player.ownedAmmo['ammo_chain'] || 0) > 0;
  const hasFireAmmo = (player.ownedAmmo['ammo_fire'] || 0) > 0;

  return (
    <div className={styles.container}>
      <h2 style={{ textAlign: 'center', color: '#f44336' }}>战斗中！</h2>
      
      <div className={styles.card} style={{ borderColor: '#f44336', borderWidth: '2px', borderStyle: 'solid' }}>
        <h3 className={styles.cardTitle}>{enemy.name}</h3>
        <p className={styles.itemDesc}>{enemy.description}</p>
        <div className={styles.healthBarContainer}>
          <div className={styles.healthBarFill} style={{ width: `${enemyHpPercent}%`, background: 'linear-gradient(90deg, #b71c1c, #f44336)' }}></div>
          <div className={styles.healthText}>敌方生命: {combat.enemyHp} / {combat.enemyMaxHp}</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: '20px 0', fontSize: '2rem' }}>
        ⚔️
      </div>

      <div className={styles.card} style={{ borderColor: '#4caf50', borderWidth: '2px', borderStyle: 'solid' }}>
        <h3 className={styles.cardTitle}>我方战船</h3>
        <div className={styles.healthBarContainer}>
          <div className={styles.healthBarFill} style={{ width: `${hullPercent}%` }}></div>
          <div className={styles.healthText}>耐久: {player.currentHull} / {maxHull}</div>
        </div>
        <p className={styles.itemDesc} style={{ marginTop: '10px' }}>
          普通炮弹: {player.ownedAmmo['ammo_normal'] || 0} | 
          链弹: {player.ownedAmmo['ammo_chain'] || 0} | 
          火弹: {player.ownedAmmo['ammo_fire'] || 0}
        </p>
      </div>

      <div className={styles.grid} style={{ marginTop: '20px' }}>
        <button className={styles.btnPrimary} style={{ background: '#f44336', color: '#fff' }} disabled={!hasNormalAmmo} onClick={() => onCombatAction('attack_normal')}>
          普通炮击 (15 伤害)
        </button>
        <button className={styles.btnPrimary} style={{ background: '#ff9800', color: '#fff' }} disabled={!hasChainAmmo} onClick={() => onCombatAction('attack_chain')}>
          链弹炮击 (降攻)
        </button>
        <button className={styles.btnPrimary} style={{ background: '#e91e63', color: '#fff' }} disabled={!hasFireAmmo} onClick={() => onCombatAction('attack_fire')}>
          火弹炮击 (海怪克星)
        </button>
        <button className={styles.btnPrimary} onClick={() => onCombatAction('board')}>
          登船肉搏 (看脸)
        </button>
        <button className={styles.btnSecondary} disabled={combat.playerRepairedThisCombat} onClick={() => onCombatAction('repair')}>
          紧急维修 (限1次)
        </button>
        <button className={styles.btnSecondary} onClick={() => onCombatAction('flee')}>
          尝试逃跑
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4 style={{ marginBottom: '10px' }}>战斗日志</h4>
        <div className={styles.logBox}>
          {combat.log.map((l, i) => (
            <div key={i} style={{ opacity: 1 - i * 0.15, color: l.includes('伤害') || l.includes('攻击') ? '#ffab91' : '#fff' }}>
              {l}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
