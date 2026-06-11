import React from 'react';
import { Route } from '../types';
import { ROUTES, PORTS } from '../content/data';
import { getPortSeaRegionName, getPortUnavailableRouteNames, getPortVisibleRoutes } from '../content/seaRegions';
import { getVisibleRoutes } from '../content/progression';
import styles from './styles.module.css';

interface Props {
  currentPortId: string;
  unlockedRoutes: string[];
  onSelectRoute: (route: Route, destinationPortId: string) => void;
  onCancel: () => void;
  player: import('../types').PlayerState;
}

export const RouteSelect: React.FC<Props> = ({ currentPortId, unlockedRoutes, onSelectRoute, onCancel, player }) => {
  const availablePorts = PORTS.filter(p => p.id !== currentPortId && player.unlockedPorts.includes(p.id));
  const [selectedPortId, setSelectedPortId] = React.useState<string>(availablePorts.length > 0 ? availablePorts[0].id : PORTS[0].id);
  const visibleRoutes = getPortVisibleRoutes(player, currentPortId);
  const storyVisibleRoutes = getVisibleRoutes(player);
  const unavailableRouteNames = getPortUnavailableRouteNames(player, currentPortId);
  const currentPort = PORTS.find(port => port.id === currentPortId);

  React.useEffect(() => {
    if (availablePorts.length > 0 && !availablePorts.some(port => port.id === selectedPortId)) {
      setSelectedPortId(availablePorts[0].id);
    }
  }, [availablePorts, selectedPortId]);

  return (
    <div className={styles.container}>
      <h2 style={{ textAlign: 'center' }}>选择航线</h2>
      <p style={{ textAlign: 'center', marginBottom: '10px' }}>不同港口连接的海域不同。</p>
      <p style={{ textAlign: 'center', marginBottom: '20px', color: '#f6d365' }}>
        当前港口：{currentPort?.name || '未知港口'} | 海域：{getPortSeaRegionName(currentPortId)}
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.2rem' }}>目的港：</span>
        <select
          className={styles.btnSecondary}
          style={{ padding: '10px', fontSize: '1.2rem', minWidth: '150px', backgroundColor: '#333', color: '#fff' }}
          value={selectedPortId}
          onChange={e => setSelectedPortId(e.target.value)}
        >
          {availablePorts.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {visibleRoutes.length === 0 && (
          <div className={styles.card}>
            <p style={{ textAlign: 'center', color: '#f6d365' }}>当前港口暂时没有可用海域，换港口或推进主线会打开新的航线。</p>
          </div>
        )}
        {visibleRoutes.map(r => {
          const isUnlocked = unlockedRoutes.includes(r.id);
          return (
            <div key={r.id} className={styles.card} style={{ opacity: isUnlocked ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 className={styles.cardTitle}>{r.name} {!isUnlocked && '🔒'}</h3>
                  <p className={styles.itemDesc}>{r.description}</p>
                  <div style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '10px' }}>
                    <p>节点数: {r.totalNodes} | 基础耐久损耗: {r.hullLossPerNode}/格</p>
                    <p>
                      贸易倍率: <span style={{ color: r.tradeMultiplier >= 1.5 ? '#4caf50' : '#fff' }}>x{r.tradeMultiplier}</span> |
                      冒险倍率: <span style={{ color: r.adventureMultiplier >= 1.5 ? '#4caf50' : '#fff' }}>x{r.adventureMultiplier}</span>
                    </p>
                    {!isUnlocked && (
                      <p style={{ color: '#f44336', marginTop: '5px', fontWeight: 'bold' }}>需完成主线开拓后解锁海图</p>
                    )}
                  </div>
                </div>
                <button
                  className={styles.btnPrimary}
                  onClick={() => onSelectRoute(r, selectedPortId)}
                  disabled={!isUnlocked}
                  style={{ backgroundColor: isUnlocked ? undefined : '#555' }}
                >
                  {isUnlocked ? '出航' : '未解锁'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {storyVisibleRoutes.length < ROUTES.length && (
        <p style={{ textAlign: 'center', color: '#aaa', marginTop: '15px' }}>
          继续推进主线剧情，会显示下一条未知航线。
        </p>
      )}
      {unavailableRouteNames.length > 0 && (
        <p style={{ textAlign: 'center', color: '#aaa', marginTop: '8px' }}>
          当前港口不通：{unavailableRouteNames.join('、')}。换港口可进入不同海域。
        </p>
      )}

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button className={styles.btnSecondary} onClick={onCancel}>返回避风港</button>
      </div>
    </div>
  );
};
