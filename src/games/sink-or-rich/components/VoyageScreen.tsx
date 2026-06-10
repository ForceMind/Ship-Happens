import React from 'react';
import { PlayerState, VoyageState } from '../types';
import { calculateMaxHull } from '../engine';
import { SeaMapCanvas } from './SeaMapCanvas';
import { Modal } from './Modal';
import styles from './styles.module.css';

interface Props {
  player: PlayerState;
  voyage: VoyageState;
  onShipMove: (dx: number, dy: number) => void;
  onReturn: () => void;
  onResolveEvent: (eventId: string, choiceId: string) => void;
}

export const VoyageScreen: React.FC<Props> = ({ player, voyage, onShipMove, onReturn, onResolveEvent }) => {
  const [modal, setModal] = React.useState<{title: string, msg: string, onConfirm: () => void, onCancel: () => void} | null>(null);
  const maxHull = calculateMaxHull(player.currentShip, player.ownedArmor);
  const hullPercent = Math.max(0, Math.min(100, (player.currentHull / maxHull) * 100));
  const totalCargoCount = player.cargo.length + voyage.lootCargo.length;

  const isPaused = !!voyage.currentEvent;

  return (
    <div className={styles.container}>
      <h2 style={{ textAlign: 'center' }}>{voyage.route?.name}</h2>

      <div className={styles.statsBar}>
        <div className={styles.statItem}><span className={styles.statLabel}>金币</span><span className={styles.statValue}>💰{player.gold}</span></div>
        <div className={styles.statItem}><span className={styles.statLabel}>临时冒险收入</span><span className={styles.statValue}>💰{voyage.temporaryGold}</span></div>
        <div className={styles.statItem}><span className={styles.statLabel}>携带货物</span><span className={styles.statValue}>📦{totalCargoCount}</span></div>
        <div className={styles.statItem}><span className={styles.statLabel}>炮弹</span><span className={styles.statValue}>💣{player.ownedAmmo['ammo_normal'] || 0}</span></div>
      </div>

      <div className={styles.healthBarContainer}>
        <div className={styles.healthBarFill} style={{ width: `${hullPercent}%` }}></div>
        <div className={styles.healthText}>耐久: {player.currentHull} / {maxHull}</div>
      </div>

      <div style={{ position: 'relative', margin: '20px 0' }}>
        <SeaMapCanvas
          player={player}
          voyage={voyage}
          ship={player.currentShip}
          isPaused={isPaused}
          onMove={onShipMove}
        />

        {voyage.currentEvent && (
          <div style={{
            position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.9)', padding: '20px', borderRadius: '12px',
            border: '2px solid #f6d365', width: '80%', zIndex: 10, textAlign: 'center'
          }}>
            <h3 style={{ color: '#f6d365', marginBottom: '10px' }}>⚠️ {voyage.currentEvent.name}</h3>
            <p style={{ marginBottom: '20px', fontSize: '1.1rem' }}>{voyage.currentEvent.description}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {voyage.currentEvent.options.map(opt => {
                let disabled = false;
                if (opt.requirements?.gold && player.gold < opt.requirements.gold) disabled = true;
                if (opt.requirements?.ammoId && (player.ownedAmmo[opt.requirements.ammoId] || 0) <= 0) disabled = true;

                return (
                  <button
                    key={opt.id}
                    className={styles.btnSecondary}
                    disabled={disabled}
                    onClick={() => onResolveEvent(voyage.currentEvent!.id, opt.id)}
                    style={{ textAlign: 'left', opacity: disabled ? 0.5 : 1, width: '100%' }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className={styles.btnSecondary} onClick={() => {
          setModal({
            title: '确认返航',
            msg: '中途返航将低价处理货物，且扣除合同违约金。确定要放弃本次航行吗？',
            onConfirm: () => {
              onReturn();
              setModal(null);
            },
            onCancel: () => setModal(null)
          });
        }}>
          返航
        </button>
        <div style={{ fontSize: '0.9rem', color: '#ccc' }}>使用 WASD 或 方向键 驾驶船只</div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4 style={{ marginBottom: '10px' }}>航海日志</h4>
        <div className={styles.logBox}>
          {voyage.log.map((l, i) => (
            <div key={i} style={{ opacity: 1 - i * 0.15 }}>{l}</div>
          ))}
        </div>
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
