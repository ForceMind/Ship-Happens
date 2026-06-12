import React, { useState } from 'react';
import { Route } from '../types';
import { ROUTES, PORTS } from '../content/data';
import styles from './styles.module.css';

interface Props {
  currentPortId: string;
  unlockedRoutes: string[];
  onSelectRoute: (route: Route, destinationPortId: string) => void;
  onCancel: () => void;
  player: import('../types').PlayerState;
}

export const RouteSelect: React.FC<Props> = ({ currentPortId, unlockedRoutes, onSelectRoute, onCancel, player }) => {
  const currentPort = PORTS.find(port => port.id === currentPortId);

  // Find all ports that are directly connected to currentPortId via any route
  const connectedPorts = PORTS.filter(p => 
    p.id !== currentPortId &&
    player.unlockedPorts.includes(p.id) &&
    ROUTES.some(r => 
      (r.fromPortId === currentPortId && r.toPortId === p.id) ||
      (r.fromPortId === p.id && r.toPortId === currentPortId)
    )
  );

  const [selectedPortId, setSelectedPortId] = useState<string>(connectedPorts.length > 0 ? connectedPorts[0].id : '');

  // Find routes connecting currentPort to selectedPort
  const connectingRoutes = ROUTES.filter(r => 
    (r.fromPortId === currentPortId && r.toPortId === selectedPortId) ||
    (r.fromPortId === selectedPortId && r.toPortId === currentPortId)
  );

  return (
    <div className={styles.container} style={{ overflowY: 'auto' }}>
      <h2 style={{ textAlign: 'center' }}>规划航线</h2>
      <p style={{ textAlign: 'center', marginBottom: '20px', color: '#f6d365' }}>
        当前出发港：{currentPort?.name || '未知港口'}
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.2rem' }}>目标港口：</span>
        {connectedPorts.length > 0 ? (
          <select
            className={styles.btnSecondary}
            style={{ padding: '10px', fontSize: '1.2rem', minWidth: '200px', backgroundColor: '#333', color: '#fff' }}
            value={selectedPortId}
            onChange={e => setSelectedPortId(e.target.value)}
          >
            {connectedPorts.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        ) : (
          <span style={{ color: '#f44336' }}>没有可前往的解锁港口</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {connectedPorts.length === 0 ? (
          <div className={styles.card}>
            <p style={{ textAlign: 'center', color: '#f6d365' }}>你需要先在交易所或酒馆获得新港口的情报。</p>
          </div>
        ) : connectingRoutes.length === 0 ? (
          <div className={styles.card}>
            <p style={{ textAlign: 'center', color: '#f6d365' }}>当前没有直达该港口的航线。</p>
          </div>
        ) : (
          connectingRoutes.map(r => {
            const isUnlocked = unlockedRoutes.includes(r.id);
            return (
              <div key={r.id} className={styles.card} style={{ opacity: isUnlocked ? 1 : 0.6, borderColor: isUnlocked ? '#f6d365' : '#555' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ flex: '1 1 300px' }}>
                    <h3 className={styles.cardTitle} style={{ color: isUnlocked ? '#f6d365' : '#aaa' }}>
                      {r.name} {!isUnlocked && '🔒 (未掌握此航路图)'}
                    </h3>
                    <p className={styles.itemDesc}>{r.description}</p>
                    <div style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '10px' }}>
                      <span style={{ marginRight: '15px' }}>⏱️ 航程节点: {r.totalNodes}</span>
                      <span style={{ marginRight: '15px' }}>💥 耐久损耗: {r.hullLossPerNode}/格</span>
                      <br/>
                      <span style={{ marginRight: '15px' }}>💰 贸易倍率: <span style={{ color: r.tradeMultiplier >= 1.5 ? '#4caf50' : '#fff' }}>x{r.tradeMultiplier}</span></span>
                      <span>⚔️ 冒险倍率: <span style={{ color: r.adventureMultiplier >= 1.5 ? '#4caf50' : '#fff' }}>x{r.adventureMultiplier}</span></span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '100px' }}>
                    <button
                      className={styles.btnPrimary}
                      onClick={() => onSelectRoute(r, selectedPortId)}
                      disabled={!isUnlocked}
                      style={{ backgroundColor: isUnlocked ? undefined : '#555', padding: '15px 30px', fontSize: '1.1rem' }}
                    >
                      {isUnlocked ? '扬帆起航' : '未解锁'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button className={styles.btnSecondary} onClick={onCancel}>返回避风港</button>
      </div>
    </div>
  );
};
