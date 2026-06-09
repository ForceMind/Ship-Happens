import React from 'react';
import { Route } from '../types';
import { ROUTES } from '../content/data';
import styles from './styles.module.css';

interface Props {
  onSelectRoute: (route: Route) => void;
  onCancel: () => void;
}

export const RouteSelect: React.FC<Props> = ({ onSelectRoute, onCancel }) => {
  return (
    <div className={styles.container}>
      <h2 style={{ textAlign: 'center' }}>选择航线</h2>
      <p style={{ textAlign: 'center', marginBottom: '20px' }}>不同的航线意味着不同的风险和回报。</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {ROUTES.map(r => (
          <div key={r.id} className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 className={styles.cardTitle}>{r.name}</h3>
                <p className={styles.itemDesc}>{r.description}</p>
                <div style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '10px' }}>
                  <p>节点数: {r.totalNodes} | 基础耐久损耗: {r.hullLossPerNode}/格</p>
                  <p>
                    贸易倍率: <span style={{ color: r.tradeMultiplier >= 1.5 ? '#4caf50' : '#fff' }}>x{r.tradeMultiplier}</span> | 
                    冒险倍率: <span style={{ color: r.adventureMultiplier >= 1.5 ? '#4caf50' : '#fff' }}>x{r.adventureMultiplier}</span>
                  </p>
                </div>
              </div>
              <button className={styles.btnPrimary} onClick={() => onSelectRoute(r)}>出航</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button className={styles.btnSecondary} onClick={onCancel}>返回避风港</button>
      </div>
    </div>
  );
};
