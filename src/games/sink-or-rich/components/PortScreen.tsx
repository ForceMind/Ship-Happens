import React, { useState } from 'react';
import { PlayerState } from '../types';
import { SHIPS, CREW_MEMBERS, AMMO_TYPES, ARMORS, CARGO_TYPES, CONTRACTS, PORTS } from '../content/data';
import { calculateCargoUsed, calculateMaxHull, calculateRepairCost, canStartVoyage } from '../engine';
import styles from './styles.module.css';

interface Props {
  player: PlayerState;
  setPlayer: (p: PlayerState) => void;
  onGoToRouteSelect: () => void;
  onRetireVictory: () => void;
}

export const PortScreen: React.FC<Props> = ({ player, setPlayer, onGoToRouteSelect, onRetireVictory }) => {
  const [activeTab, setActiveTab] = useState<'ship'|'crew'|'ammo'|'armor'|'cargo'|'contract'|'repair'>('ship');

  const currentPort = PORTS.find(p => p.id === (player.currentPortId || 'port_royal')) || PORTS[0];

  const getCargoBuyPrice = (cargoId: string, baseBuyPrice: number) => {
    const multiplier = currentPort.priceMultipliers[cargoId] || 1;
    return Math.floor(baseBuyPrice * multiplier);
  };

  const getCargoSellPrice = (cargoId: string, baseSellPrice: number) => {
    const multiplier = currentPort.priceMultipliers[cargoId] || 1;
    return Math.floor(baseSellPrice * multiplier);
  };

  const maxHull = calculateMaxHull(player.currentShip, player.ownedArmor);
  const cargoUsed = calculateCargoUsed(player);
  const cargoTotal = player.currentShip ? player.currentShip.cargoSlots : 0;
  const repairCost = calculateRepairCost(player);
  const canSail = canStartVoyage(player);

  const buyShip = (shipId: string) => {
    const ship = SHIPS.find(s => s.id === shipId)!;
    if (player.gold >= ship.price) {
      if (player.currentShip && !window.confirm('购买新船会替换旧船且旧船不折现，确认购买吗？')) return;
      setPlayer({ ...player, gold: player.gold - ship.price, currentShip: ship, currentHull: ship.maxHull });
    }
  };

  const buyCrew = (crewId: string) => {
    const crew = CREW_MEMBERS.find(c => c.id === crewId)!;
    if (player.gold >= crew.price && !player.ownedCrew.some(c => c.id === crewId)) {
      setPlayer({ ...player, gold: player.gold - crew.price, ownedCrew: [...player.ownedCrew, crew] });
    }
  };

  const buyAmmo = (ammoId: string) => {
    const ammo = AMMO_TYPES.find(a => a.id === ammoId)!;
    if (player.gold >= ammo.price) {
      setPlayer({ 
        ...player, 
        gold: player.gold - ammo.price, 
        ownedAmmo: { ...player.ownedAmmo, [ammoId]: (player.ownedAmmo[ammoId] || 0) + 1 }
      });
    }
  };

  const buyArmor = (armorId: string) => {
    const armor = ARMORS.find(a => a.id === armorId)!;
    if (player.gold >= armor.price && !player.ownedArmor.some(a => a.id === armorId)) {
      setPlayer({ ...player, gold: player.gold - armor.price, ownedArmor: [...player.ownedArmor, armor] });
    }
  };

  const buyCargo = (cargoId: string) => {
    const cargo = CARGO_TYPES.find(c => c.id === cargoId)!;
    if (player.gold >= getCargoBuyPrice(cargo.id, cargo.buyPrice) && cargoUsed + cargo.slots <= cargoTotal) {
      setPlayer({ ...player, gold: player.gold - getCargoBuyPrice(cargo.id, cargo.buyPrice), cargo: [...player.cargo, cargo] });
    }
  };

  const takeContract = (contractId: string) => {
    const contract = CONTRACTS.find(c => c.id === contractId)!;
    if (!player.activeContract) {
      setPlayer({ ...player, activeContract: contract });
    }
  };

  const doRepair = () => {
    if (repairCost > 0 && player.gold >= repairCost) {
      setPlayer({ ...player, gold: player.gold - repairCost, currentHull: maxHull });
    } else if (player.gold > 0 && repairCost > 0) {
      // Partial repair
      const affordableHull = Math.floor(player.gold / player.currentShip!.repairCostPerHull);
      if (affordableHull > 0) {
        setPlayer({ 
          ...player, 
          gold: player.gold - (affordableHull * player.currentShip!.repairCostPerHull),
          currentHull: player.currentHull + affordableHull
        });
      }
    }
  };

  const doRescue = () => {
    setPlayer({ ...player, gold: player.gold + 300, rescuedByGuild: true });
  };

  return (
    <div className={styles.container} style={{ backgroundColor: currentPort.colorTheme, transition: 'background-color 1s ease' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '5px' }}>{currentPort.name}</h2>
      <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#ccc', marginBottom: '15px' }}>{currentPort.description}</p>
      
      <div className={styles.statsBar}>
        <div className={styles.statItem}><span className={styles.statLabel}>金币</span><span className={styles.statValue}>💰{player.gold}</span></div>
        <div className={styles.statItem}><span className={styles.statLabel}>当前船</span><span className={styles.statValue}>{player.currentShip ? player.currentShip.name : '无'}</span></div>
        <div className={styles.statItem}><span className={styles.statLabel}>耐久</span><span className={styles.statValue}>{player.currentHull}/{maxHull}</span></div>
        <div className={styles.statItem}><span className={styles.statLabel}>舱位</span><span className={styles.statValue}>{cargoUsed}/{cargoTotal}</span></div>
        <div className={styles.statItem}><span className={styles.statLabel}>通缉/声望</span><span className={styles.statValue}>☠️{player.bounty} / 🌟{player.reputation}</span></div>
      </div>

      {player.gold >= 50000 && (
        <div className={styles.card} style={{ borderColor: '#FFD700', background: 'rgba(255, 215, 0, 0.1)' }}>
          <h3 style={{ color: '#FFD700', textAlign: 'center' }}>你已经积累了惊人的财富！</h3>
          <p style={{ textAlign: 'center', marginBottom: '10px' }}>你可以选择激流勇退，买下岛屿安度余生。</p>
          <button className={styles.btnPrimary} style={{ width: '100%', backgroundColor: '#FFD700', color: '#000' }} onClick={onRetireVictory}>
            退休：富甲一方 (通关)
          </button>
        </div>
      )}

      {!player.currentShip && player.gold < 300 && (
        <div className={styles.card} style={{ borderColor: 'red' }}>
          <p>看起来你已经破产并且连最便宜的船都买不起了。</p>
          <button className={styles.btnPrimary} onClick={doRescue} disabled={player.rescuedByGuild}>
            商会救济 (+300金币) {player.rescuedByGuild ? '(已使用)' : ''}
          </button>
          <p className={styles.statLabel}>防死档机制：每局只能使用一次</p>
        </div>
      )}

      <div style={{ display: 'flex', overflowX: 'auto', gap: '5px', marginBottom: '15px', paddingBottom: '10px' }}>
        <button className={activeTab === 'ship' ? styles.btnPrimary : styles.btnSecondary} onClick={() => setActiveTab('ship')}>船只</button>
        <button className={activeTab === 'crew' ? styles.btnPrimary : styles.btnSecondary} onClick={() => setActiveTab('crew')}>船员</button>
        <button className={activeTab === 'ammo' ? styles.btnPrimary : styles.btnSecondary} onClick={() => setActiveTab('ammo')}>炮弹</button>
        <button className={activeTab === 'armor' ? styles.btnPrimary : styles.btnSecondary} onClick={() => setActiveTab('armor')}>护甲</button>
        <button className={activeTab === 'cargo' ? styles.btnPrimary : styles.btnSecondary} onClick={() => setActiveTab('cargo')}>货物</button>
        <button className={activeTab === 'contract' ? styles.btnPrimary : styles.btnSecondary} onClick={() => setActiveTab('contract')}>合同</button>
        <button className={activeTab === 'repair' ? styles.btnPrimary : styles.btnSecondary} onClick={() => setActiveTab('repair')}>维修</button>
      </div>

      <div className={styles.card}>
        {activeTab === 'ship' && (
          <div className={styles.grid}>
            {SHIPS.map(s => (
              <div key={s.id} className={styles.itemCard}>
                <div>
                  <div className={styles.itemName}>{s.name}</div>
                  <div className={styles.itemDesc}>{s.description}</div>
                  <div className={styles.itemDesc}>耐久:{s.maxHull} 舱位:{s.cargoSlots} 炮位:{s.cannonSlots}</div>
                  <div className={styles.itemPrice}>💰 {s.price}</div>
                </div>
                <button className={styles.btnPrimary} style={{ margin: 0 }} disabled={player.gold < s.price} onClick={() => buyShip(s.id)}>购买</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'crew' && (
          <div className={styles.grid}>
            {CREW_MEMBERS.map(c => {
              const owned = player.ownedCrew.some(oc => oc.id === c.id);
              return (
                <div key={c.id} className={styles.itemCard}>
                  <div>
                    <div className={styles.itemName}>{c.name}</div>
                    <div className={styles.itemDesc}>{c.effectText}</div>
                    <div className={styles.itemPrice}>💰 {c.price}</div>
                  </div>
                  <button className={styles.btnPrimary} style={{ margin: 0 }} disabled={player.gold < c.price || owned} onClick={() => buyCrew(c.id)}>
                    {owned ? '已雇佣' : '雇佣'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'ammo' && (
          <div className={styles.grid}>
            {AMMO_TYPES.map(a => {
              const count = player.ownedAmmo[a.id] || 0;
              return (
                <div key={a.id} className={styles.itemCard}>
                  <div>
                    <div className={styles.itemName}>{a.name} (持有: {count})</div>
                    <div className={styles.itemDesc}>伤害: {a.damage} | {a.effectText}</div>
                    <div className={styles.itemPrice}>💰 {a.price}</div>
                  </div>
                  <button className={styles.btnPrimary} style={{ margin: 0 }} disabled={player.gold < a.price} onClick={() => buyAmmo(a.id)}>购买</button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'armor' && (
          <div className={styles.grid}>
            {ARMORS.map(a => {
              const owned = player.ownedArmor.some(oa => oa.id === a.id);
              return (
                <div key={a.id} className={styles.itemCard}>
                  <div>
                    <div className={styles.itemName}>{a.name}</div>
                    <div className={styles.itemDesc}>{a.effectText}</div>
                    <div className={styles.itemPrice}>💰 {a.price}</div>
                  </div>
                  <button className={styles.btnPrimary} style={{ margin: 0 }} disabled={player.gold < a.price || owned} onClick={() => buyArmor(a.id)}>
                    {owned ? '已装备' : '装备'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'cargo' && (
          <div className={styles.grid}>
            {CARGO_TYPES.map(c => {
              const buyPrice = getCargoBuyPrice(c.id, c.buyPrice);
              const sellPrice = getCargoSellPrice(c.id, c.sellPrice);
              return (
                <div key={c.id} className={styles.itemCard}>
                  <div>
                    <div className={styles.itemName}>{c.name} {c.riskTag === 'illegal' && '☠️'}</div>
                    <div className={styles.itemDesc}>进价: {buyPrice} | 售价: {sellPrice}</div>
                    {c.description && <div className={styles.itemDesc} style={{ color: '#f44336' }}>{c.description}</div>}
                    <div className={styles.itemPrice}>💰 {buyPrice}</div>
                  </div>
                  <button className={styles.btnPrimary} style={{ margin: 0 }} disabled={player.gold < buyPrice || cargoUsed + c.slots > cargoTotal} onClick={() => buyCargo(c.id)}>
                    买入
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'contract' && (
          <div>
            {player.activeContract ? (
              <div>
                <h3 style={{ color: '#f6d365' }}>当前合同：{player.activeContract.name}</h3>
                <p>要求: {player.activeContract.requiredCargoName} x{player.activeContract.requiredAmount}</p>
                <p>奖励: <span style={{ color: '#4caf50' }}>{player.activeContract.reward}</span> | 违约金: <span style={{ color: '#f44336' }}>{player.activeContract.penalty}</span></p>
                <p className={styles.itemDesc}>注意：接合同不给货，需自己去市场买。</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {CONTRACTS.map(c => (
                  <div key={c.id} className={styles.itemCard}>
                    <div>
                      <div className={styles.itemName}>{c.name}</div>
                      <div className={styles.itemDesc}>要求: {c.requiredCargoName} x{c.requiredAmount}</div>
                      <div className={styles.itemDesc}>奖励: {c.reward} | 违约: {c.penalty}</div>
                    </div>
                    <button className={styles.btnPrimary} style={{ margin: 0 }} onClick={() => takeContract(c.id)}>接取</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'repair' && (
          <div>
            <h3 style={{ color: '#f6d365' }}>船坞维修</h3>
            <p>当前耐久: {player.currentHull} / {maxHull}</p>
            {repairCost > 0 ? (
              <div>
                <p>完全维修需要: 💰{repairCost}</p>
                <button className={styles.btnPrimary} disabled={player.gold === 0} onClick={doRepair}>
                  {player.gold >= repairCost ? '修满' : '用尽金币维修'}
                </button>
              </div>
            ) : (
              <p>船只状态完好，不需要维修。</p>
            )}
            {!canSail && player.currentShip && (
              <p style={{ color: '#f44336' }}>船况太差，至少维修到 30% 才能出海！</p>
            )}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button 
          className={styles.btnPrimary} 
          style={{ width: '100%', fontSize: '1.5rem', padding: '15px' }}
          disabled={!canSail} 
          onClick={onGoToRouteSelect}
        >
          出海！
        </button>
        {!player.currentShip && <p className={styles.statLabel}>需要先购买一艘船</p>}
      </div>

    </div>
  );
};
