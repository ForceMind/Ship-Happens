import React, { useState, useEffect } from 'react';
import { PlayerCargo, PlayerState } from '../types';
import { SHIPS, CREW_MEMBERS, AMMO_TYPES, ARMORS, CARGO_TYPES, PORTS, ROUTES } from '../content/data';
import { getStoryStatus } from '../content/story';
import { generateLocalContracts } from '../content/contracts';
import { addStoryFlags, FINALE_STORY_PROGRESS, hasStoryFlag, isRouteUnlockAvailable, isRouteVisible } from '../content/progression';
import { calculateCargoUsed, getDebtMonthlyInterestRate, calculateMaxHull, calculateRepairCost, calculateRepairUnitCost, canStartVoyage } from '../engine';
import { Modal } from './Modal';
import styles from './styles.module.css';

interface Props {
  player: PlayerState;
  setPlayer: (p: PlayerState) => void;
  onGoToRouteSelect: () => void;
  onBankrupt: () => void;
  onGoToCasino: () => void;
  onGoToStory?: () => void;
}

export const PortScreen: React.FC<Props> = ({ player, setPlayer, onGoToRouteSelect, onBankrupt, onGoToCasino, onGoToStory }) => {
  const [activeTab, setActiveTab] = useState<'ship'|'crew'|'ammo'|'armor'|'cargo'|'contract'|'repair'|'bank'|'building'>('ship');
  const [modal, setModal] = useState<{title: string, msg: string, onConfirm: () => void, onCancel?: () => void} | null>(null);
  const [localContracts, setLocalContracts] = useState<import('../types').Contract[]>([]);

  const currentPort = PORTS.find(p => p.id === (player.currentPortId || 'port_royal')) || PORTS[0];

  useEffect(() => {
    setLocalContracts(generateLocalContracts(currentPort, player.unlockedPorts, PORTS, CARGO_TYPES));
  }, [currentPort, player.unlockedPorts]);

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
  const storyStatus = getStoryStatus(player);
  const finaleUnlocked = Boolean(storyStatus?.canAdvance && player.storyProgress === FINALE_STORY_PROGRESS);
  const routeNameById = (routeId: string) => ROUTES.find(route => route.id === routeId)?.name || '未知海域';
  const portNameById = (portId: string) => PORTS.find(port => port.id === portId)?.name || '未知港口';
  const ownsStoryFlag = (flag: string) => hasStoryFlag(player, flag);
  const withStoryFlags = (flags: string[]) => addStoryFlags(player, flags);

  const buyRouteChart = (routeId: string, cost: number, requiredReputation: number, requiredBounty = 0) => {
    if (!isRouteVisible(player, routeId) || !isRouteUnlockAvailable(player, routeId)) {
      setModal({title: '海图未现', msg: '这片海域还没有出现在你的主线海图上，继续推进主线剧情。', onConfirm: () => setModal(null)});
      return;
    }

    const hasReputation = player.reputation >= requiredReputation;
    const hasBounty = requiredBounty > 0 && player.bounty >= requiredBounty;
    if (player.gold >= cost && (hasReputation || hasBounty)) {
      setPlayer({
        ...player,
        gold: player.gold - cost,
        unlockedRoutes: player.unlockedRoutes.includes(routeId) ? player.unlockedRoutes : [...player.unlockedRoutes, routeId]
      });
      setModal({title: '获取海图', msg: `你获得了${routeNameById(routeId)}的航海许可。`, onConfirm: () => setModal(null)});
    } else {
      const requirementText = requiredBounty > 0
        ? `需要 ${cost} 金币，且声望或通缉达到 ${requiredReputation}。`
        : `需要 ${cost} 金币和 ${requiredReputation} 声望。`;
      setModal({title: '条件不足', msg: requirementText, onConfirm: () => setModal(null)});
    }
  };

  const buyPortPass = (portId: string, cost: number, requiredReputation: number, requiredBounty = 0) => {
    const hasReputation = player.reputation >= requiredReputation;
    const hasBounty = requiredBounty > 0 && player.bounty >= requiredBounty;
    if (player.gold >= cost && (hasReputation || hasBounty)) {
      setPlayer({
        ...player,
        gold: player.gold - cost,
        unlockedPorts: player.unlockedPorts.includes(portId) ? player.unlockedPorts : [...player.unlockedPorts, portId]
      });
      setModal({title: '港口许可', msg: `你取得了${portNameById(portId)}的长期停靠权。`, onConfirm: () => setModal(null)});
    } else {
      const requirementText = requiredBounty > 0
        ? `需要 ${cost} 金币，且声望或通缉达到 ${requiredReputation}。`
        : `需要 ${cost} 金币和 ${requiredReputation} 声望。`;
      setModal({title: '条件不足', msg: requirementText, onConfirm: () => setModal(null)});
    }
  };

  const doAzoresOverhaul = () => {
    const max = calculateMaxHull(player.currentShip, player.ownedArmor);
    const missingHull = Math.max(0, max - player.currentHull);
    const cost = Math.floor(missingHull * calculateRepairUnitCost(player) * 0.75);
    if (!player.currentShip || missingHull === 0) {
      setModal({title: '无需整备', msg: '你的船已经处于良好状态。', onConfirm: () => setModal(null)});
      return;
    }
    if (player.gold < cost) {
      setModal({title: '余额不足', msg: `远洋整备需要 ${cost} 金币。`, onConfirm: () => setModal(null)});
      return;
    }
    setPlayer({...player, gold: player.gold - cost, currentHull: max});
    setModal({title: '远洋整备完成', msg: `亚速尔船坞用 ${cost} 金币把你的船整备到满耐久。`, onConfirm: () => setModal(null)});
  };

  const acceptQueenMission = () => {
    setPlayer({
      ...player,
      discoveredEvents: withStoryFlags(['queen_mission_accepted']),
      unlockedPorts: player.unlockedPorts.includes('port_oriental') ? player.unlockedPorts : [...player.unlockedPorts, 'port_oriental']
    });
    setModal({
      title: '女王远东敕令',
      msg: '女王的密使交给你一封火漆诏书：把王室敕令送到东方明珠港，建立第一条正式远东总督航线。',
      onConfirm: () => setModal(null)
    });
  };

  const completeQueenMission = () => {
    setPlayer({
      ...player,
      gold: player.gold + 5000,
      reputation: player.reputation + 50,
      discoveredEvents: withStoryFlags(['queen_mission_completed'])
    });
    setModal({
      title: '敕令送达',
      msg: '东方商会在女王诏书上盖下印章。帝国承认了你的远东功绩，奖励 5000 金币，声望 +50。',
      onConfirm: () => setModal(null)
    });
  };

  const acceptPirateTreasureHunt = () => {
    setPlayer({
      ...player,
      discoveredEvents: withStoryFlags(['pirate_treasure_clue'])
    });
    setModal({
      title: '海盗王藏宝图',
      msg: '密室里的老海盗交出半张盐渍海图：宝藏不在陆地，而在通往东方明珠港的传说航线上。',
      onConfirm: () => setModal(null)
    });
  };

  const completePirateTreasureHunt = () => {
    setPlayer({
      ...player,
      gold: player.gold + 8000,
      bounty: player.bounty + 50,
      discoveredEvents: withStoryFlags(['pirate_treasure_found'])
    });
    setModal({
      title: '宝藏现世',
      msg: '你在东方旧仓库的暗墙后找到了海盗王遗留的金箱和黑旗誓约。获得 8000 金币，通缉 +50。',
      onConfirm: () => setModal(null)
    });
  };

  const buyShip = (shipId: string) => {
    const ship = SHIPS.find(s => s.id === shipId)!;
    if (player.currentShip) {
      setModal({
        title: '替换提示',
        msg: '您当前已经有一艘船了！直接购买会抛弃旧船且不退款。请先手动“卖掉”旧船再购买新船！',
        onConfirm: () => setModal(null)
      });
      return;
    }
    if (player.gold >= ship.price) {
      setPlayer({ ...player, gold: player.gold - ship.price, currentShip: ship, currentHull: ship.maxHull });
    }
  };

  const sellShip = () => {
    if (!player.currentShip) return;
    if (player.cargo.length > 0 || player.activeContract) {
      setModal({
        title: '无法出售',
        msg: '船上还有货物，或您还有未完成的合同！请先处理完再卖船。',
        onConfirm: () => setModal(null)
      });
      return;
    }
    const sellPrice = Math.floor(player.currentShip.price * 0.8 * (player.currentHull / maxHull));
    setModal({
      title: '出售船只',
      msg: `当前耐久 ${player.currentHull}/${maxHull}，按照折旧您能获得 ${sellPrice} 金币。确认卖出吗？`,
      onConfirm: () => {
        setPlayer({ ...player, gold: player.gold + sellPrice, currentShip: null, currentHull: 0 });
        setModal(null);
      },
      onCancel: () => setModal(null)
    });
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
    const price = getCargoBuyPrice(cargo.id, cargo.buyPrice);
    if (player.gold >= price && cargoUsed + cargo.slots <= cargoTotal) {
      const pCargo: import('../types').PlayerCargo = {
        ...cargo,
        actualBuyPrice: price,
        sourcePortId: currentPort.id,
        uid: `cargo_${Date.now()}_${Math.random()}`
      };
      setPlayer({ ...player, gold: player.gold - price, cargo: [...player.cargo, pCargo] });
    }
  };

  const buyTreasureBundle = () => {
    const cost = 2000;
    const requiredSlots = 3;
    const availableSlots = player.currentShip ? player.currentShip.cargoSlots - cargoUsed : 0;

    if (player.gold < cost) {
      setModal({title: '余额不足', msg: `需要 ${cost} 金币。`, onConfirm: () => setModal(null)});
      return;
    }

    if (availableSlots < requiredSlots) {
      setModal({title: '舱位不足', msg: `秘宝箱需要至少 ${requiredSlots} 个空余舱位。`, onConfirm: () => setModal(null)});
      return;
    }

    const treasurePool = [
      'cargo_imperial_porcelain',
      'cargo_imperial_porcelain',
      'cargo_dragon_pearl',
      'cargo_dragon_pearl',
      'cargo_ancient_astrolabe',
    ]
      .map(id => CARGO_TYPES.find(c => c.id === id))
      .filter((cargo): cargo is NonNullable<typeof cargo> => Boolean(cargo));

    if (treasurePool.length === 0) return;

    const picked = Array.from({ length: requiredSlots }, () => treasurePool[Math.floor(Math.random() * treasurePool.length)]);
    const splitPrices = picked.map((_, index) => Math.floor(cost / requiredSlots) + (index < cost % requiredSlots ? 1 : 0));
    const bundleCargo: PlayerCargo[] = picked.map((cargo, index) => ({
      ...cargo,
      actualBuyPrice: splitPrices[index],
      sourcePortId: currentPort.id,
      uid: `treasure_bundle_${Date.now()}_${index}_${Math.random()}`
    }));

    setPlayer({
      ...player,
      gold: player.gold - cost,
      cargo: [...player.cargo, ...bundleCargo]
    });
    setModal({
      title: '秘宝采购成功',
      msg: `你花费 ${cost} 金币拿到 ${bundleCargo.map(c => c.name).join('、')}。这些珍品不会在普通交易所出售，带去外港才能卖出好价钱。`,
      onConfirm: () => setModal(null)
    });
  };

  const returnLocalCargo = (index: number) => {
    const c = player.cargo[index];
    // 退货收取 10% 折旧费
    const refundPrice = Math.floor(c.actualBuyPrice * 0.9);
    const newCargo = [...player.cargo];
    newCargo.splice(index, 1);
    setPlayer({ ...player, gold: player.gold + refundPrice, cargo: newCargo });
  };

  const sellForeignCargo = (index: number) => {
    const c = player.cargo[index];
    const sellPrice = Math.floor(getCargoSellPrice(c.id, c.sellPrice) * player.marketMultiplier);
    const newCargo = [...player.cargo];
    newCargo.splice(index, 1);
    setPlayer({ ...player, gold: player.gold + sellPrice, cargo: newCargo });
  };

  const sellAllForeignCargo = () => {
    let totalEarnings = 0;
    const newCargo = player.cargo.filter(c => {
      if (c.sourcePortId !== currentPort.id) {
        totalEarnings += Math.floor(getCargoSellPrice(c.id, c.sellPrice) * player.marketMultiplier);
        return false;
      }
      return true;
    });
    if (totalEarnings > 0) {
      setPlayer({ ...player, gold: player.gold + totalEarnings, cargo: newCargo });
      setModal({title: '交易完成', msg: `你把所有外地货物和战利品卖给了交易所，共获得 ${totalEarnings} 金币！`, onConfirm: () => setModal(null)});
    }
  };

  const discardCargo = (index: number) => {
    const newCargo = [...player.cargo];
    newCargo.splice(index, 1);
    setPlayer({ ...player, cargo: newCargo });
  };

  const takeContract = (contractId: string) => {
    const contract = localContracts.find(c => c.id === contractId)!;
    setPlayer({ ...player, activeContract: contract });
  };

  const doRepair = () => {
    if (repairCost > 0 && player.gold >= repairCost) {
      setPlayer({ ...player, gold: player.gold - repairCost, currentHull: maxHull });
    } else if (player.gold > 0 && repairCost > 0) {
      // Partial repair
      const repairUnitCost = calculateRepairUnitCost(player);
      const missingHull = Math.max(0, maxHull - player.currentHull);
      const affordableHull = Math.min(missingHull, Math.floor(player.gold / repairUnitCost));
      if (affordableHull > 0) {
        setPlayer({
          ...player,
          gold: player.gold - (affordableHull * repairUnitCost),
          currentHull: player.currentHull + affordableHull
        });
      } else {
        setModal({
          title: '维修费不足',
          msg: `至少需要 ${repairUnitCost} 金币才能修复 1 点耐久。`,
          onConfirm: () => setModal(null)
        });
      }
    }
  };

  const doRescue = () => {
    setPlayer({ ...player, gold: player.gold + 300, rescuedByGuild: true });
    setModal({ title: '商会救济', msg: '商会看你可怜，施舍了你 300 金币。好自为之！', onConfirm: () => setModal(null) });
  };

  const isAvailable = (item: { availableInPorts?: string[] }) => {
    if (!item.availableInPorts) return true;
    return item.availableInPorts.includes(player.currentPortId);
  };

  const creditLimit = 2000 + player.reputation * 100;
  const borrowAmount = Math.min(1000, Math.max(0, creditLimit - player.debt));
  const currentDebtRate = getDebtMonthlyInterestRate(player.debt);
  const debtRateAfterBorrow = getDebtMonthlyInterestRate(player.debt + borrowAmount);
  const formatDebtMonthlyRate = (rate: number) => `${(rate * 100).toFixed(2)}% / 月`;

  const doBorrow = () => {
    if (borrowAmount > 0) {
      setPlayer({ ...player, gold: player.gold + borrowAmount, debt: player.debt + borrowAmount });
    }
  };

  const doRepay = (amount: number) => {
    if (player.debt > 0 && player.gold >= amount) {
      const nextDebt = player.debt - amount;
      setPlayer({
        ...player,
        gold: player.gold - amount,
        debt: nextDebt,
        debtInterestMinutes: nextDebt > 0 ? player.debtInterestMinutes : 0,
        debtGraceMinutes: nextDebt > 0 ? player.debtGraceMinutes : 0,
      });
    }
  };

  return (
    <div className={styles.container} style={{ backgroundColor: currentPort.colorTheme, transition: 'background-color 1s ease' }}>
      {modal && <Modal title={modal.title} message={modal.msg} onConfirm={modal.onConfirm} onCancel={modal.onCancel} />}
      <h2 style={{ textAlign: 'center', marginBottom: '5px' }}>{currentPort.name}</h2>
      <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#ccc', marginBottom: '15px' }}>{currentPort.description}</p>

      <div className={styles.statsBar}>
        <div className={styles.statItem}><span className={styles.statLabel}>金币</span><span className={styles.statValue}>💰{player.gold}</span></div>
        <div className={styles.statItem}><span className={styles.statLabel}>当前船</span><span className={styles.statValue}>{player.currentShip ? player.currentShip.name : '无'}</span></div>
        <div className={styles.statItem}><span className={styles.statLabel}>耐久</span><span className={styles.statValue}>{player.currentHull}/{maxHull}</span></div>
        <div className={styles.statItem}><span className={styles.statLabel}>舱位</span><span className={styles.statValue}>{cargoUsed}/{cargoTotal}</span></div>
        <div className={styles.statItem}><span className={styles.statLabel}>通缉/声望</span><span className={styles.statValue}>☠️{player.bounty} / 🌟{player.reputation}</span></div>
        <div className={styles.statItem}><span className={styles.statLabel}>债务</span><span className={styles.statValue} style={{color: player.debt > 0 ? '#f44336' : '#fff'}}>💰{player.debt}</span></div>
      </div>

      {player.storyProgress === FINALE_STORY_PROGRESS && (
        <div className={styles.card} style={{ borderColor: '#FFD700', background: 'rgba(255, 215, 0, 0.1)' }}>
          <h3 style={{ color: '#FFD700', textAlign: 'center' }}>终章之路</h3>
          <p style={{ textAlign: 'center', marginBottom: '10px' }}>
            {finaleUnlocked ? '所有海域、港口与深渊挑战都已完成，是时候把你的旗帜插到最后的海岸。' : storyStatus?.objective}
          </p>
          <button
            className={styles.btnPrimary}
            style={{ width: '100%', backgroundColor: '#FFD700', color: '#000' }}
            disabled={!finaleUnlocked || !onGoToStory}
            onClick={onGoToStory}
          >
            {finaleUnlocked ? '进入终章 (主线通关)' : '终章尚未解锁'}
          </button>
        </div>
      )}

      {!player.currentShip && player.gold < 300 && (
        <div className={styles.card} style={{ borderColor: 'red' }}>
          <p>看起来你已经破产并且连最便宜的船都买不起了。</p>
          {!player.rescuedByGuild ? (
            <>
              <button className={styles.btnPrimary} onClick={doRescue}>
                商会救济 (+300金币)
              </button>
              <p className={styles.statLabel}>注意：商会的救济金每局只能申请一次！</p>
            </>
          ) : (
            <>
              <button className={styles.btnPrimary} style={{ backgroundColor: '#8B0000' }} onClick={onBankrupt}>
                彻底破产 (结束游戏)
              </button>
              <p className={styles.statLabel}>你浪费了商会的救济金，现在真的无路可走了。</p>
            </>
          )}
        </div>
      )}

      {/* Top buttons removed to prevent duplication */}

      <div style={{ display: 'flex', overflowX: 'auto', gap: '5px', marginBottom: '15px', paddingBottom: '10px' }}>
        <button className={activeTab === 'ship' ? styles.btnPrimary : styles.btnSecondary} onClick={() => setActiveTab('ship')}>船只</button>
        <button className={activeTab === 'crew' ? styles.btnPrimary : styles.btnSecondary} onClick={() => setActiveTab('crew')}>船员</button>
        <button className={activeTab === 'ammo' ? styles.btnPrimary : styles.btnSecondary} onClick={() => setActiveTab('ammo')}>炮弹</button>
        <button className={activeTab === 'armor' ? styles.btnPrimary : styles.btnSecondary} onClick={() => setActiveTab('armor')}>护甲</button>
        <button className={activeTab === 'cargo' ? styles.btnPrimary : styles.btnSecondary} onClick={() => setActiveTab('cargo')}>货物</button>
        <button className={activeTab === 'contract' ? styles.btnPrimary : styles.btnSecondary} onClick={() => setActiveTab('contract')}>合同</button>
        <button className={activeTab === 'repair' ? styles.btnPrimary : styles.btnSecondary} onClick={() => setActiveTab('repair')}>维修</button>
        <button className={activeTab === 'bank' ? styles.btnPrimary : styles.btnSecondary} onClick={() => setActiveTab('bank')}>银行</button>
        <button className={activeTab === 'building' ? styles.btnPrimary : styles.btnSecondary} onClick={() => setActiveTab('building')}>建筑</button>
      </div>

      <div className={styles.card}>
        {activeTab === 'ship' && (
          <div className={styles.grid}>
            {SHIPS.filter(s => isAvailable(s) || player.currentShip?.id === s.id).map(s => {
              const isOwned = player.currentShip?.id === s.id;
              return (
                <div key={s.id} className={styles.itemCard}>
                  <div>
                    <div className={styles.itemName}>{s.name} {isOwned && <span style={{color: '#4caf50'}}>(当前座驾)</span>}</div>
                    <div className={styles.itemDesc}>{s.description}</div>
                    <div className={styles.itemDesc}>耐久:{s.maxHull} 舱位:{s.cargoSlots} 炮位:{s.cannonSlots} 航速:{s.speed}</div>
                    <div className={styles.itemPrice}>💰 {s.price}</div>
                  </div>
                  {isOwned ? (
                    <button className={styles.btnSecondary} style={{ margin: 0, color: '#f44336' }} onClick={sellShip}>
                      卖掉
                    </button>
                  ) : (
                    <button className={styles.btnPrimary} style={{ margin: 0 }} disabled={player.gold < s.price} onClick={() => buyShip(s.id)}>购买</button>
                  )}
                </div>
              );
            })}
            {player.reputation < 300 && (
              <div className={styles.itemCard} style={{ opacity: 0.5, borderStyle: 'dashed', borderColor: '#ccc' }}>
                <div>
                  <div className={styles.itemName}>??? (终极战舰)</div>
                  <div className={styles.itemDesc}>造船厂最深处的绝密图纸，据说只有女王册封的总督才有资格看一眼。（解锁条件：声望 300）</div>
                  <div className={styles.itemPrice}>💰 ???</div>
                </div>
                <button className={styles.btnPrimary} disabled style={{ margin: 0 }}>🔒 未解锁</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'crew' && (
          <div className={styles.grid}>
            {CREW_MEMBERS.filter(isAvailable).map(c => {
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
            {player.bounty < 300 && (
              <div className={styles.itemCard} style={{ opacity: 0.5, borderStyle: 'dashed', borderColor: '#ccc' }}>
                <div>
                  <div className={styles.itemName}>??? (神秘人物)</div>
                  <div className={styles.itemDesc}>酒馆角落里戴着兜帽的危险男人。他只和四海最臭名昭著的恶棍打交道。（解锁条件：通缉 300）</div>
                  <div className={styles.itemPrice}>💰 ???</div>
                </div>
                <button className={styles.btnPrimary} disabled style={{ margin: 0 }}>🔒 未解锁</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ammo' && (
          <div className={styles.grid}>
            {AMMO_TYPES.filter(isAvailable).map(a => {
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
            {ARMORS.filter(isAvailable).map(a => {
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
            {player.reputation < 150 && (
              <div className={styles.itemCard} style={{ opacity: 0.5, borderStyle: 'dashed', borderColor: '#ccc' }}>
                <div>
                  <div className={styles.itemName}>??? (远古遗物)</div>
                  <div className={styles.itemDesc}>黑市商人藏起来的宝贝，由深渊巨兽的鳞片打造而成。（解锁条件：声望 150）</div>
                  <div className={styles.itemPrice}>💰 ???</div>
                </div>
                <button className={styles.btnPrimary} disabled style={{ margin: 0 }}>🔒 未解锁</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cargo' && (
          <div>
            <h3 style={{ marginBottom: '15px' }}>交易所 - 购买</h3>
            <div className={styles.grid}>
              {CARGO_TYPES.filter(isAvailable).map(c => {
                const buyPrice = getCargoBuyPrice(c.id, c.buyPrice);
                const locked = player.reputation < (c.requiredReputation || 0);
                return (
                  <div key={c.id} className={styles.itemCard}>
                    <div>
                      <div className={styles.itemName}>{c.name} {c.riskTag === 'illegal' && '☠️'} {locked && '🔒'}</div>
                      <div className={styles.itemDesc}>当前港口进价: 💰 {buyPrice}</div>
                      {c.description && <div className={styles.itemDesc} style={{ color: '#f44336' }}>{c.description}</div>}
                      {locked && <div className={styles.itemDesc} style={{ color: '#f44336' }}>需声望: {c.requiredReputation}</div>}
                    </div>
                    <button className={styles.btnPrimary} style={{ margin: 0 }} disabled={locked || player.gold < buyPrice || cargoUsed + c.slots > cargoTotal} onClick={() => buyCargo(c.id)}>
                      买入
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>我的货舱 (舱位: {cargoUsed}/{cargoTotal})</h3>
              {player.cargo.some(c => c.sourcePortId !== currentPort.id) && (
                <button className={styles.btnPrimary} style={{ backgroundColor: '#4caf50', margin: 0, padding: '5px 15px' }} onClick={sellAllForeignCargo}>
                  一键售出全部外地货
                </button>
              )}
            </div>

            {player.cargo.length === 0 ? (
              <p style={{ color: '#ccc' }}>货舱空空如也，快去进点货吧！</p>
            ) : (
              <div className={styles.grid}>
                {player.cargo.map((c, idx) => {
                  const isLocal = c.sourcePortId === currentPort.id;
                  const refundPrice = Math.floor(c.actualBuyPrice * 0.9);
                  const sellPrice = Math.floor(getCargoSellPrice(c.id, c.sellPrice) * player.marketMultiplier);
                  const profit = sellPrice - c.actualBuyPrice;

                  return (
                    <div key={c.uid || idx} className={styles.itemCard} style={{ borderColor: isLocal ? '#777' : '#2196f3' }}>
                      <div>
                        <div className={styles.itemName}>{c.name} {isLocal ? '(本地)' : '(外地)'}</div>
                        <div className={styles.itemDesc}>占用舱位: {c.slots}</div>
                        <div className={styles.itemDesc}>
                          进价: 💰 {c.actualBuyPrice === 0 ? '0 (战利品)' : c.actualBuyPrice}
                        </div>
                        {isLocal ? (
                          <div className={styles.itemDesc} style={{ color: '#f44336' }}>
                            退货可得: 💰 {refundPrice} (折旧10%)
                          </div>
                        ) : (
                          <div className={styles.itemDesc} style={{ color: profit > 0 ? '#4caf50' : '#f44336' }}>
                            跨洋销售价: 💰 {sellPrice} {profit > 0 ? `(赚 ${profit})` : `(亏 ${Math.abs(profit)})`}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'row', gap: '5px' }}>
                        <button className={styles.btnSecondary} style={{ padding: '5px 10px', margin: 0, fontSize: '0.9rem', whiteSpace: 'nowrap' }} onClick={() => discardCargo(idx)}>
                          丢弃
                        </button>
                        {isLocal ? (
                          <button className={styles.btnSecondary} style={{ padding: '5px 10px', margin: 0, fontSize: '0.9rem', whiteSpace: 'nowrap' }} onClick={() => returnLocalCargo(idx)}>
                            退货
                          </button>
                        ) : (
                          <button className={styles.btnPrimary} style={{ padding: '5px 10px', margin: 0, fontSize: '0.9rem', whiteSpace: 'nowrap', backgroundColor: '#2196f3' }} onClick={() => sellForeignCargo(idx)}>
                            销售
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'contract' && (
          <div>
            {player.activeContract ? (
              <div>
                <h3 style={{ color: '#f6d365' }}>当前合同：{player.activeContract.name}</h3>
                <p>要求: {player.activeContract.requiredCargoName} x{player.activeContract.requiredAmount}</p>
                <p>目的港: {player.activeContract.destinationPortName}</p>
                <p>奖励: <span style={{ color: '#4caf50' }}>{player.activeContract.reward}</span> | 违约金: <span style={{ color: '#f44336' }}>{player.activeContract.penalty}</span></p>
                <p className={styles.itemDesc}>注意：必须在目的港才能完成交货！接合同不给货，需自己买。</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {localContracts.map(c => {
                  const locked = player.reputation < (c.requiredReputation || 0);
                  return (
                    <div key={c.id} className={styles.itemCard}>
                      <div>
                        <div className={styles.itemName}>{c.name} {locked && '🔒'}</div>
                        <div className={styles.itemDesc}>目的港: {c.destinationPortName}</div>
                        <div className={styles.itemDesc}>要求: {c.requiredCargoName} x{c.requiredAmount}</div>
                        <div className={styles.itemDesc}>奖励: {c.reward} | 违约: {c.penalty}</div>
                        {locked && <div className={styles.itemDesc} style={{ color: '#f44336' }}>需声望: {c.requiredReputation}</div>}
                      </div>
                      <button className={styles.btnPrimary} style={{ margin: 0 }} disabled={locked} onClick={() => takeContract(c.id)}>接取</button>
                    </div>
                  );
                })}
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
            ) : !player.currentShip ? (
              <p>你还没有船，谈何维修？</p>
            ) : (
              <p>船只状态完好，不需要维修。</p>
            )}
            {!canSail && player.currentShip && (
              <p style={{ color: '#f44336' }}>船况太差，至少维修到 30% 才能出海！</p>
            )}
          </div>
        )}

        {activeTab === 'bank' && (
          <div>
            <h3 style={{ color: '#f6d365' }}>大洋银行</h3>
            <div className={styles.statItem} style={{ marginBottom: '15px' }}>
              <span className={styles.statLabel}>当前债务</span>
              <span className={styles.statValue} style={{color: player.debt > 0 ? '#f44336' : '#fff'}}>💰 {player.debt}</span>
            </div>
            <div className={styles.statItem} style={{ marginBottom: '15px' }}>
              <span className={styles.statLabel}>当前月利率</span>
              <span className={styles.statValue}>{formatDebtMonthlyRate(currentDebtRate)}</span>
            </div>
            {borrowAmount > 0 && (
              <div className={styles.statItem} style={{ marginBottom: '15px' }}>
                <span className={styles.statLabel}>借后月利率</span>
                <span className={styles.statValue}>{formatDebtMonthlyRate(debtRateAfterBorrow)}</span>
              </div>
            )}
            <p className={styles.statLabel} style={{ marginBottom: '15px' }}>借钱越多利息越高，债务每分钟更新。</p>
            <div className={styles.statItem} style={{ marginBottom: '15px' }}>
              <span className={styles.statLabel}>信用额度</span>
              <span className={styles.statValue}>💰 {creditLimit} (基于声望)</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className={styles.btnPrimary} disabled={borrowAmount <= 0} onClick={doBorrow}>
                借款 +{borrowAmount || 0}
              </button>
              {player.debt > 500 && (
                <button className={styles.btnSecondary} disabled={player.gold < 500} onClick={() => doRepay(500)}>
                  还款 500
                </button>
              )}
              {player.debt > 0 ? (
                <button className={styles.btnSecondary} disabled={player.gold < player.debt} onClick={() => doRepay(player.debt)}>
                  全部还清 {player.debt}
                </button>
              ) : (
                <button className={styles.btnSecondary} disabled>
                  暂无债务
                </button>
              )}
            </div>
            {player.debt > 20000 && <p style={{ color: '#f44336', marginTop: '10px' }}>⚠️ 警告：您的债务已超标，讨债佣兵可能在海上拦截您！</p>}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        {!player.currentShip && <p className={styles.statLabel}>需要先购买一艘船</p>}
        {activeTab === 'building' && (
          <div className={styles.storyBanner}>
            <div>
              <div className={styles.storyTitle}>{storyStatus?.title || '主线剧情：尾声'}</div>
              <div className={styles.storyDesc}>{storyStatus?.description || '你的故事已经写进港口传说，新的船长还会继续追逐这片海。'}</div>
              {storyStatus && (
                <div className={storyStatus.canAdvance ? styles.storyReady : styles.storyObjective}>
                  {storyStatus.objective}
                </div>
              )}
            </div>
            {storyStatus?.canAdvance && onGoToStory ? (
              <button className={styles.btnPrimary} style={{ margin: 0, whiteSpace: 'nowrap' }} onClick={onGoToStory}>
                {storyStatus.cta}
              </button>
            ) : (
              <button className={styles.btnSecondary} style={{ margin: 0, whiteSpace: 'nowrap' }} disabled>
                等待推进
              </button>
            )}
          </div>
        )}

        {activeTab === 'building' && player.currentPortId === 'port_royal' && (
          <div className={styles.card} style={{ borderColor: '#e91e63' }}>
            <h3 style={{ color: '#e91e63', textAlign: 'center', marginBottom: '20px' }}>帝国总督府</h3>
            <p style={{ textAlign: 'center', color: '#ccc' }}>肃穆的帝国政府大楼。只要你有足够的金币和声望，即使是海盗也能在这里买到贵族的身份。</p>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button
                className={styles.btnPrimary}
                onClick={() => {
                  const cost = player.bounty * 100;
                  if (player.gold >= cost) {
                    setPlayer({...player, gold: player.gold - cost, bounty: 0});
                    setModal({title: '罪名洗清', msg: `你花费了 ${cost} 金币打点总督，现在的记录像白纸一样干净了。`, onConfirm: () => setModal(null)});
                  } else {
                    setModal({title: '余额不足', msg: `打点总督需要 ${cost} 金币（通缉值x100）。没钱就别来总督府！`, onConfirm: () => setModal(null)});
                  }
                }}
                disabled={player.bounty === 0}
              >
                洗刷罪名 (花费 {player.bounty * 100} 金币)
              </button>

              {isRouteVisible(player, 'route_storm') && isRouteUnlockAvailable(player, 'route_storm') && !player.unlockedRoutes.includes('route_storm') && (
                <button
                  className={styles.btnPrimary}
                  onClick={() => buyRouteChart('route_storm', 5000, 50)}
                >
                  购买暴风航线委任状 (5000金 / 需50声望)
                </button>
              )}

              {isRouteVisible(player, 'route_black_tide') && isRouteUnlockAvailable(player, 'route_black_tide') && !player.unlockedRoutes.includes('route_black_tide') && (
                <button
                  className={styles.btnPrimary}
                  onClick={() => buyRouteChart('route_black_tide', 10000, 100)}
                >
                  购买黑潮航线海图 (10000金 / 需100声望)
                </button>
              )}

              {player.storyProgress === 4 && player.storyBranch === 'governor' && !ownsStoryFlag('queen_mission_accepted') && (
                <button
                  className={styles.btnPrimary}
                  style={{ backgroundColor: '#FFD700', color: '#000' }}
                  onClick={acceptQueenMission}
                >
                  接女王远东敕令
                </button>
              )}

              {!player.unlockedPorts.includes('port_oriental') && (
                <button
                  className={styles.btnPrimary}
                  style={{ backgroundColor: '#ff9800' }}
                  onClick={() => {
                    if (player.gold >= 8000 && player.reputation >= 80) {
                      setPlayer({...player, gold: player.gold - 8000, unlockedPorts: [...player.unlockedPorts, 'port_oriental']});
                      setModal({title: '获取通行证', msg: '你获得了前往神秘东方贸易港的永久通行证！', onConfirm: () => setModal(null)});
                    } else {
                      setModal({title: '条件不足', msg: '需要 8000 金币和 80 声望才能获得东方港通行证。', onConfirm: () => setModal(null)});
                    }
                  }}
                >
                  购买东方贸易港通行证 (8000金 / 需80声望)
                </button>
              )}

              {storyStatus?.canAdvance && player.storyProgress > 0 && player.storyProgress < 4 && onGoToStory && (
                <button className={styles.btnPrimary} style={{ backgroundColor: '#FFD700', color: '#000' }} onClick={onGoToStory}>
                  继续主线：面见帝国海军上将
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'building' && player.currentPortId === 'port_tortuga' && (
          <div className={styles.card} style={{ borderColor: '#9c27b0' }}>
            <h3 style={{ color: '#9c27b0', textAlign: 'center', marginBottom: '20px' }}>海盗公会密室</h3>
            <p style={{ textAlign: 'center', color: '#ccc' }}>阴暗潮湿的地下室，空气中弥漫着朗姆酒和血腥味。这里只认金币，不问出处。</p>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button
                className={styles.btnPrimary}
                onClick={() => {
                  const cost = player.bounty * 80;
                  if (player.gold >= cost) {
                    setPlayer({...player, gold: player.gold - cost, bounty: 0});
                    setModal({title: '黑道销账', msg: `你花费了 ${cost} 金币在黑市买到了假身份。`, onConfirm: () => setModal(null)});
                  } else {
                    setModal({title: '余额不足', msg: `假身份需要 ${cost} 金币（通缉值x80）。`, onConfirm: () => setModal(null)});
                  }
                }}
                disabled={player.bounty === 0}
              >
                黑市销账假身份 (花费 {player.bounty * 80} 金币)
              </button>

              {isRouteVisible(player, 'route_legend') && isRouteUnlockAvailable(player, 'route_legend') && !player.unlockedRoutes.includes('route_legend') && (
                <button
                  className={styles.btnPrimary}
                  onClick={() => buyRouteChart('route_legend', 15000, 150, 150)}
                >
                  购买传说航线残图 (15000金 / 需150声望或通缉)
                </button>
              )}

              {isRouteVisible(player, 'route_abyss') && isRouteUnlockAvailable(player, 'route_abyss') && !player.unlockedRoutes.includes('route_abyss') && (
                <button
                  className={styles.btnPrimary}
                  onClick={() => buyRouteChart('route_abyss', 20000, 150, 150)}
                >
                  购买深渊禁忌海图 (20000金 / 需150声望或通缉)
                </button>
              )}

              {player.storyProgress === 4 && player.storyBranch === 'pirate' && !ownsStoryFlag('pirate_treasure_clue') && (
                <button
                  className={styles.btnPrimary}
                  style={{ backgroundColor: '#FFD700', color: '#000' }}
                  onClick={acceptPirateTreasureHunt}
                >
                  接下海盗王宝藏寻觅
                </button>
              )}

              {storyStatus?.canAdvance && player.storyProgress > 0 && player.storyProgress < 4 && onGoToStory && (
                <button className={styles.btnPrimary} style={{ backgroundColor: '#FFD700', color: '#000' }} onClick={onGoToStory}>
                  继续主线：拜会海盗王
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'building' && player.currentPortId === 'port_nassau' && (
          <div className={styles.card} style={{ borderColor: '#2ecc71' }}>
            <h3 style={{ color: '#2ecc71', textAlign: 'center', marginBottom: '20px' }}>自由港航海会</h3>
            <p style={{ textAlign: 'center', color: '#ccc' }}>这里的私掠船长会交换礁盘、水道和补给岛位置。没人问你效忠谁，只问你敢不敢开新航线。</p>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {isRouteVisible(player, 'route_coral') && isRouteUnlockAvailable(player, 'route_coral') && !player.unlockedRoutes.includes('route_coral') && (
                <button className={styles.btnPrimary} onClick={() => buyRouteChart('route_coral', 12000, 80, 80)}>
                  购买珊瑚群岛水道图 (12000金 / 需80声望或通缉)
                </button>
              )}

              {!player.unlockedPorts.includes('port_azores') && player.storyProgress >= 5 && (
                <button className={styles.btnPrimary} onClick={() => buyPortPass('port_azores', 9000, 100)}>
                  签订亚速尔补给契约 (9000金 / 需100声望)
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'building' && player.currentPortId === 'port_cartagena' && (
          <div className={styles.card} style={{ borderColor: '#b8860b' }}>
            <h3 style={{ color: '#b8860b', textAlign: 'center', marginBottom: '20px' }}>要塞军需处</h3>
            <p style={{ textAlign: 'center', color: '#ccc' }}>帝国军需官掌握远洋炮舰的季风记录。帮他们跑通黑潮之后，他们才会把下一段航线交出来。</p>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {isRouteVisible(player, 'route_monsoon') && isRouteUnlockAvailable(player, 'route_monsoon') && !player.unlockedRoutes.includes('route_monsoon') && (
                <button className={styles.btnPrimary} onClick={() => buyRouteChart('route_monsoon', 14000, 120)}>
                  购买季风远洋航线档案 (14000金 / 需120声望)
                </button>
              )}

              {!player.unlockedPorts.includes('port_azores') && player.storyProgress >= 5 && (
                <button className={styles.btnPrimary} onClick={() => buyPortPass('port_azores', 9000, 100)}>
                  申请亚速尔军需补给权 (9000金 / 需100声望)
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'building' && player.currentPortId === 'port_oriental' && (
          <div className={styles.card} style={{ borderColor: '#009688' }}>
            <h3 style={{ color: '#009688', textAlign: 'center', marginBottom: '20px' }}>远东大商行</h3>
            <p style={{ textAlign: 'center', color: '#ccc' }}>来自远东的神秘商会。如果你愿意出大价钱，他们会把珍稀货物打包卖给你。</p>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button
                className={styles.btnPrimary}
                onClick={buyTreasureBundle}
                disabled={!player.currentShip}
              >
                大宗秘宝盲盒 (2000金 / 需3舱位)
              </button>

              {player.storyProgress === 4 && player.storyBranch === 'governor' && ownsStoryFlag('queen_mission_accepted') && !ownsStoryFlag('queen_mission_completed') && (
                <button
                  className={styles.btnPrimary}
                  style={{ backgroundColor: '#FFD700', color: '#000' }}
                  onClick={completeQueenMission}
                >
                  递交女王远东敕令
                </button>
              )}

              {player.storyProgress === 4 && player.storyBranch === 'pirate' && ownsStoryFlag('pirate_treasure_clue') && !ownsStoryFlag('pirate_treasure_found') && (
                <button
                  className={styles.btnPrimary}
                  style={{ backgroundColor: '#FFD700', color: '#000' }}
                  onClick={completePirateTreasureHunt}
                >
                  搜寻海盗王宝藏
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'building' && player.currentPortId === 'port_azores' && (
          <div className={styles.card} style={{ borderColor: '#03a9f4' }}>
            <h3 style={{ color: '#03a9f4', textAlign: 'center', marginBottom: '20px' }}>远洋补给站</h3>
            <p style={{ textAlign: 'center', color: '#ccc' }}>亚速尔是远征前的最后可靠船坞。船体、淡水和药品都能在这里补齐。</p>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button className={styles.btnPrimary} disabled={!player.currentShip} onClick={doAzoresOverhaul}>
                远洋整备 (按缺失耐久 75% 收费)
              </button>

              {isRouteVisible(player, 'route_legend') && isRouteUnlockAvailable(player, 'route_legend') && !player.unlockedRoutes.includes('route_legend') && (
                <button className={styles.btnPrimary} onClick={() => buyRouteChart('route_legend', 15000, 150, 150)}>
                  拼合传说航线星图 (15000金 / 需150声望或通缉)
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'building' && player.currentPortId === 'port_madagascar' && (
          <div className={styles.card} style={{ borderColor: '#ff5722' }}>
            <h3 style={{ color: '#ff5722', textAlign: 'center', marginBottom: '20px' }}>海盗王旧寨</h3>
            <p style={{ textAlign: 'center', color: '#ccc' }}>旧寨的石墙上刻着深渊海图的最后一段。走到这里的人，已经没有近海退路。</p>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {isRouteVisible(player, 'route_abyss') && isRouteUnlockAvailable(player, 'route_abyss') && !player.unlockedRoutes.includes('route_abyss') && (
                <button className={styles.btnPrimary} onClick={() => buyRouteChart('route_abyss', 20000, 150, 150)}>
                  取走深渊最终海图 (20000金 / 需150声望或通缉)
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px', display: 'flex', gap: '10px' }}>
        {player.currentPortId !== 'port_oriental' && (
          <button
            className={styles.btnSecondary}
            style={{ flex: 1, fontSize: '1.2rem', padding: '15px', color: player.currentPortId === 'port_royal' ? '#ffb300' : '#d500f9', borderColor: player.currentPortId === 'port_royal' ? '#ffb300' : '#d500f9' }}
            onClick={onGoToCasino}
          >
            {player.currentPortId === 'port_royal' ? '🎰 皇家大赌场' : '☠️ 海盗赌坊'}
          </button>
        )}
        <button
          className={styles.btnPrimary}
          style={{ flex: 2, fontSize: '1.5rem', padding: '15px' }}
          disabled={!canSail}
          onClick={onGoToRouteSelect}
        >
          出海！
        </button>
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
