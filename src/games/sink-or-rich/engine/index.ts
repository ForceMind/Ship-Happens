import { PlayerState, VoyageState, Route, Enemy, CombatState, Ship, Armor, VoyageMode, SeaEntityType, SeaEntity } from '../types';
import { GAME_EVENTS } from '../content/events';
import { ENEMIES, CARGO_TYPES, SHIPS } from '../content/data';
import { addStoryFlags } from '../content/progression';
import { renderContextualEvent, renderContextualOutcome, renderEncounterLog } from '../content/eventContext';

const FORCED_EVENT_IDS = new Set(['event_leviathan', 'event_debt_collector']);
const BANK_INTEREST_UPDATES_PER_MONTH = 30;

export function getEventEntityType(eventId: string): SeaEntityType {
  if (eventId === 'event_storm') return 'storm';
  if (eventId === 'event_reef') return 'reef';
  if (eventId === 'event_whirlpool') return 'whirlpool';
  if (eventId === 'event_shipwreck') return 'wreck';
  if (eventId === 'event_trade_winds') return 'wind';
  if (eventId === 'event_glowing_coral') return 'coral';
  if (eventId === 'event_lost_fishermen') return 'merchant';
  if (eventId === 'event_navy_flotsam') return 'cargo';
  if (eventId === 'event_floating_cargo') return 'cargo';
  if (eventId === 'event_damaged_merchant') return 'merchant';
  if (eventId === 'event_pirate_block') return 'pirate';
  if (eventId === 'event_giant_octopus') return 'monster';
  if (eventId === 'event_sea_serpent') return 'monster';
  if (eventId === 'event_white_whale') return 'monster';
  if (eventId === 'event_patrol') return 'patrol';
  if (eventId === 'event_island') return 'island';
  if (eventId === 'event_black_market') return 'black_market';
  if (eventId === 'event_siren') return 'siren';
  if (eventId === 'event_bottle') return 'cargo';
  if (eventId === 'event_mutiny') return 'merchant';
  if (eventId === 'event_ghost_fog') return 'storm';
  if (eventId === 'event_blockade') return 'patrol';
  if (eventId === 'event_leviathan') return 'monster';
  if (eventId === 'event_debt_collector') return 'patrol';
  return 'cargo';
}

function getSeaEntityRadius(type: SeaEntityType): number {
  if (type === 'storm' || type === 'reef' || type === 'whirlpool' || type === 'wind' || type === 'coral' || type === 'siren') return 80;
  return 40;
}

export function getSeaEntityChaseSpeed(entity: Pick<SeaEntity, 'type' | 'eventId'>): number {
  if (entity.type === 'pirate') return 2.5;
  if (entity.type !== 'monster') return 0;

  if (entity.eventId === 'event_giant_octopus') return 1.4;
  if (entity.eventId === 'event_sea_serpent') return 3.2;
  if (entity.eventId === 'event_white_whale') return 0.9;
  if (entity.eventId === 'event_leviathan') return 2.2;
  return 2.0;
}

export function createVoyageDestinationPosition(mapWidth: number): { x: number; y: number } {
  const side = Math.random() < 0.5 ? -1 : 1;
  const offset = 140 + Math.random() * 200;
  const x = Math.max(90, Math.min(mapWidth - 90, Math.round(mapWidth / 2 + side * offset)));
  return { x, y: 150 };
}

export function getVoyageDestinationPosition(voyage: Pick<VoyageState, 'mapWidth' | 'destinationPosition'>): { x: number; y: number } {
  return voyage.destinationPosition || { x: voyage.mapWidth / 2, y: 150 };
}

export function createDefaultPlayerState(): PlayerState {
  return {
    currentPortId: 'port_royal',
    gold: 1000,
    reputation: 0,
    bounty: 0,
    sinkCount: 0,
    voyageCount: 0,
    successfulVoyageCount: 0,
    unlockedShips: [],
    discoveredEvents: [],
    currentShip: null,
    currentHull: 0,
    ownedCrew: [],
    ownedAmmo: {},
    ownedArmor: [],
    cargo: [],
    activeContract: null,
    rescuedByGuild: false,
    debt: 0,
    debtInterestMinutes: 0,
    debtGraceMinutes: 0,
    storyProgress: 0,
    unlockedRoutes: ['route_coastal'],
    unlockedPorts: ['port_royal', 'port_tortuga'],
    marketMultiplier: 1.0,
    casinoProfitThisPort: 0,
  };
}

export function calculateMaxHull(ship: Ship | null, armor: Armor[]): number {
  const shipDefinition = getShipDefinition(ship);
  if (!shipDefinition) return 0;
  let maxHull = shipDefinition.maxHull;
  if (armor.some(a => a.id === 'armor_wood')) {
    maxHull += 20;
  }
  return maxHull;
}

export function getShipDefinition(ship: Ship | null): Ship | null {
  if (!ship) return null;
  const canonicalShip = SHIPS.find(s => s.id === ship.id);
  return canonicalShip ? { ...ship, ...canonicalShip } : ship;
}

export function calculateRepairUnitCost(player: PlayerState): number {
  const shipDefinition = getShipDefinition(player.currentShip);
  if (!shipDefinition) return 0;

  let cost = shipDefinition.repairCostPerHull;
  if (player.bounty > 80) cost *= 1.4;
  else if (player.bounty > 50) cost *= 1.2;

  return Math.max(1, Math.ceil(cost));
}

export function calculateCargoUsed(player: PlayerState, voyage?: VoyageState): number {
  let used = 0;
  player.cargo.forEach(c => (used += c.slots));
  if (voyage) {
    voyage.lootCargo.forEach(c => (used += c.slots));
  }
  return used;
}

export function calculateRepairCost(player: PlayerState): number {
  if (!player.currentShip) return 0;
  const maxHull = calculateMaxHull(player.currentShip, player.ownedArmor);
  const currentHull = Number.isFinite(player.currentHull) ? player.currentHull : 0;
  const missingHull = maxHull - currentHull;
  if (missingHull <= 0) return 0;

  const shipDefinition = getShipDefinition(player.currentShip);
  if (!shipDefinition) return 0;

  let cost = missingHull * shipDefinition.repairCostPerHull;
  if (player.bounty > 80) cost *= 1.4;
  else if (player.bounty > 50) cost *= 1.2;

  return Math.floor(cost);
}

export function getDebtMonthlyInterestRate(debt: number): number {
  if (debt <= 0) return 0;
  if (debt <= 2000) return 0.04;
  if (debt <= 10000) return 0.07;
  if (debt <= 20000) return 0.1;
  return 0.15;
}

export function calculateDebtMinuteInterest(debt: number): number {
  const rate = getDebtMonthlyInterestRate(debt);
  if (rate <= 0) return 0;
  return Math.max(1, Math.floor((debt * rate) / BANK_INTEREST_UPDATES_PER_MONTH));
}

export function applyDebtMinuteInterest(player: PlayerState): PlayerState {
  if (player.debt <= 0) {
    return { ...player, debtInterestMinutes: 0, debtGraceMinutes: 0 };
  }

  if (player.debtGraceMinutes > 0) {
    return {
      ...player,
      debtGraceMinutes: Math.max(0, player.debtGraceMinutes - 1),
      debtInterestMinutes: player.debtInterestMinutes + 1,
    };
  }

  const interest = calculateDebtMinuteInterest(player.debt);
  return {
    ...player,
    debt: player.debt + interest,
    debtInterestMinutes: player.debtInterestMinutes + 1,
  };
}

export function canStartVoyage(player: PlayerState): boolean {
  if (!player.currentShip) return false;
  const maxHull = calculateMaxHull(player.currentShip, player.ownedArmor);
  const currentHull = Number.isFinite(player.currentHull) ? player.currentHull : 0;
  if (currentHull < maxHull * 0.3) return false;
  return true;
}

export function startVoyage(player: PlayerState, route: Route, destinationPortId: string): { player: PlayerState, voyage: VoyageState } {
  const mapWidth = 800;
  const mapHeight = route.totalNodes * 400 + 600; // e.g. 5 nodes = 2600 height
  const destinationPosition = createVoyageDestinationPosition(mapWidth);

  // Generate entities based on route risk
  const entityCount = Math.floor(route.totalNodes * route.riskMultiplier * 1.5);
  const generatedEntities: SeaEntity[] = [];
  let hasMonsterEntity = false;

  for (let i = 0; i < entityCount; i++) {
    const eventPool = GAME_EVENTS.filter(event => {
      if (FORCED_EVENT_IDS.has(event.id)) return false;
      const type = getEventEntityType(event.id);
      return !(hasMonsterEntity && type === 'monster');
    });
    const event = eventPool[Math.floor(Math.random() * eventPool.length)];
    const type = getEventEntityType(event.id);
    if (type === 'monster') hasMonsterEntity = true;

    generatedEntities.push({
      id: `entity_${i}_${Date.now()}`,
      type,
      x: Math.floor(Math.random() * (mapWidth - 100)) + 50,
      y: Math.floor(Math.random() * (mapHeight - 600)) + 200, // keep start and end clear
      radius: getSeaEntityRadius(type),
      eventId: event.id,
      resolved: false
    });
  }

  // Force spawn Leviathan if it's the abyss route
  if (route.id === 'route_abyss') {
    generatedEntities.splice(0, generatedEntities.length, ...generatedEntities.filter(entity => entity.type !== 'monster'));
    hasMonsterEntity = true;
    generatedEntities.push({
      id: `entity_boss_${Date.now()}`,
      type: 'monster',
      x: mapWidth / 2,
      y: 400, // Near the end port
      radius: 120, // Huge radius
      eventId: 'event_leviathan',
      resolved: false
    });
  }

  // Force spawn Debt Collector if debt is too high (> 20000)
  if (player.debt > 20000) {
    // Spawn 1-2 debt collectors
    const collectorCount = Math.floor(Math.random() * 2) + 1;
    for (let c = 0; c < collectorCount; c++) {
      generatedEntities.push({
        id: `entity_collector_${Date.now()}_${c}`,
        type: 'patrol',
        x: Math.floor(Math.random() * (mapWidth - 100)) + 50,
        y: Math.floor(Math.random() * (mapHeight - 800)) + 300,
        radius: 60,
        eventId: 'event_debt_collector',
        resolved: false
      });
    }
  }

  return {
    player: { ...player, voyageCount: player.voyageCount + 1, casinoProfitThisPort: 0 },
    voyage: {
      route,
      destinationPortId,
      position: 0,
      totalNodes: route.totalNodes,
      mapWidth,
      mapHeight,
      destinationPosition,
      playerPosition: { x: mapWidth / 2, y: mapHeight - 100 },
      distanceTraveled: 0,
      entities: generatedEntities,
      mode: 'sailing',
      temporaryGold: 0,
      lootCargo: [],
      eventsResolved: 0,
      enemiesDefeated: 0,
      monstersDefeated: 0,
      log: [`扬帆起航！驶入 ${route.name}。`],
      combatState: null,
      currentEvent: null
    }
  };
}

export function moveShip(player: PlayerState, voyage: VoyageState, dx: number, dy: number): { player: PlayerState, voyage: VoyageState, collidedEntityId: string | null } {
  if (voyage.mode !== 'sailing' || !voyage.route || !player.currentShip) return { player, voyage, collidedEntityId: null };

  const speedMultiplier = player.currentShip.speed * 0.8;
  const newX = Math.max(0, Math.min(voyage.mapWidth, voyage.playerPosition.x + dx * speedMultiplier));
  const newY = Math.max(150, Math.min(voyage.mapHeight, voyage.playerPosition.y + dy * speedMultiplier));

  const distanceMoved = Math.sqrt(Math.pow(newX - voyage.playerPosition.x, 2) + Math.pow(newY - voyage.playerPosition.y, 2));
  const newDistance = voyage.distanceTraveled + distanceMoved;

  let newPlayer = { ...player };
  let newVoyage = { ...voyage, playerPosition: { x: newX, y: newY }, distanceTraveled: newDistance };

  // Calculate hull loss based on distance traveled (e.g. 1 point per 300 pixels)
  // We use route.hullLossPerNode, let's say 400 pixels = 1 node
  const hullLossRate = voyage.route.hullLossPerNode / 400;
  const oldLoss = Math.floor(voyage.distanceTraveled * hullLossRate);
  const newLoss = Math.floor(newDistance * hullLossRate);

  if (newLoss > oldLoss) {
    newPlayer.currentHull = Math.max(0, newPlayer.currentHull - (newLoss - oldLoss));
  }

  if (newPlayer.currentHull <= 0) {
    const sunkState = checkSinking(newPlayer, newVoyage);
    return { ...sunkState, collidedEntityId: null };
  }

  // Update enemy positions (chasing) and Check collision
  let collidedEntityId: string | null = null;
  const shipRadius = 15;
  const timeScale = Math.sqrt(dx * dx + dy * dy);

  newVoyage.entities = newVoyage.entities.map(entity => {
    let newEntity = { ...entity };

    // Chasing logic
    if (!newEntity.resolved && (newEntity.type === 'pirate' || newEntity.type === 'monster')) {
      const dxEnemy = newX - newEntity.x;
      const dyEnemy = newY - newEntity.y;
      const dist = Math.sqrt(dxEnemy * dxEnemy + dyEnemy * dyEnemy);

      // Aggro radius 400px
      if (dist < 400 && dist > 5) {
        const baseSpeed = getSeaEntityChaseSpeed(newEntity);
        const actualTimeScale = Math.max(0.1, timeScale); // ensure they move slightly even if player barely moves
        newEntity.x += (dxEnemy / dist) * baseSpeed * actualTimeScale;
        newEntity.y += (dyEnemy / dist) * baseSpeed * actualTimeScale;
      }
    }

    // Collision check
    if (!newEntity.resolved && !collidedEntityId) {
      const dist = Math.sqrt(Math.pow(newEntity.x - newX, 2) + Math.pow(newEntity.y - newY, 2));
      if (dist < newEntity.radius + shipRadius) {
        collidedEntityId = newEntity.id;
      }
    }

    return newEntity;
  });

  return { player: newPlayer, voyage: newVoyage, collidedEntityId };
}

export function triggerEvent(player: PlayerState, voyage: VoyageState, entityId: string): VoyageState {
  const entity = voyage.entities.find(e => e.id === entityId);
  if (!entity) return voyage;
  const event = GAME_EVENTS.find(e => e.id === entity.eventId);
  const currentEvent = event ? renderContextualEvent(event, player, voyage) : null;
  return {
    ...voyage,
    currentEvent,
    entities: voyage.entities.map(e => e.id === entityId ? { ...e, resolved: true } : e),
    log: [event ? renderEncounterLog(event, player, voyage) : '遇到: 未知事件', ...voyage.log].slice(0, 5)
  };
}

export function resolveEventChoice(
  player: PlayerState,
  voyage: VoyageState,
  eventId: string,
  choiceId: string
): { player: PlayerState, voyage: VoyageState } {
  const event = GAME_EVENTS.find(e => e.id === eventId);
  if (!event) return { player, voyage };
  const choice = event.options.find(o => o.id === choiceId);
  if (!choice) return { player, voyage };

  let result = choice.resolve(player, voyage);
  result = { ...result, message: renderContextualOutcome(result.message, player, voyage) };

  // Create a shallow copy to prevent mutating the original React state directly
  result.voyage = { ...result.voyage };

  // Apply repairman crew effect if it's a non-combat resolution
  if (!result.combatEnemyId && result.player.currentHull > 0) {
    const hasRepairman = result.player.ownedCrew.some(c => c.id === 'crew_repairman');
    if (hasRepairman) {
      const maxHull = calculateMaxHull(result.player.currentShip, result.player.ownedArmor);
      result.player.currentHull = Math.min(maxHull, result.player.currentHull + 3);
    }
    result.voyage.eventsResolved += 1;
    result.voyage.currentEvent = null;
    result.voyage.log = [result.message, ...result.voyage.log].slice(0, 5);
  } else if (result.combatEnemyId) {
    result.voyage.log = [result.message, ...result.voyage.log].slice(0, 5);
    const enemy = ENEMIES.find(e => e.id === result.combatEnemyId);
    if (enemy) {
      result.voyage.mode = 'combat';
      // If giant octopus vs fire ammo, already handled in event if we want, but we handle it here:
      const enemyHp = (enemy.id === 'enemy_monster_1' && choiceId === 'octopus_fire_ammo')
        ? Math.max(0, enemy.maxHp - 40) : enemy.maxHp;

      result.voyage.combatState = {
        enemyId: enemy.id,
        enemyHp: enemyHp,
        enemyMaxHp: enemy.maxHp,
        enemyNextAttackReduced: false,
        playerRepairedThisCombat: false,
        log: [`进入战斗: ${enemy.name}!`]
      };
      result.voyage.currentEvent = null;
    }
  }

  // Check sinking
  return checkSinking(result.player, result.voyage);
}

export function checkSinking(player: PlayerState, voyage: VoyageState): { player: PlayerState, voyage: VoyageState } {
  if (player.currentHull <= 0) {
    const hasWaterproof = player.ownedArmor.some(a => a.id === 'armor_waterproof');
    if (hasWaterproof) {
      // Consume waterproof armor effect (remove it)
      const newArmor = player.ownedArmor.filter(a => a.id !== 'armor_waterproof');
      return {
        player: { ...player, currentHull: 1, ownedArmor: newArmor },
        voyage: { ...voyage, log: ['防水舱发挥了作用，勉强保住了 1 点耐久！', ...voyage.log].slice(0, 5) }
      };
    } else {
      return { player, voyage: { ...voyage, mode: 'sunk' } };
    }
  }
  return { player, voyage };
}

export type CombatAction = 'attack_normal' | 'attack_chain' | 'attack_fire' | 'board' | 'repair' | 'flee';

export function getEnemyCombatHint(enemyId: string): string | null {
  if (enemyId === 'enemy_monster_1') return '行动较慢，火弹效果最好，靠近肉搏会被触手反击。';
  if (enemyId === 'enemy_sea_serpent') return '追击最快，链弹更容易缠住它，普通炮击较难命中。';
  if (enemyId === 'enemy_white_whale') return '行动很慢但皮厚，普通炮击效果差，适合火弹或消耗战。';
  if (enemyId === 'enemy_leviathan') return '最终海妖，船体巨大，无法登船肉搏。';
  return null;
}

function getEnemyAttackText(enemyId: string): string {
  if (enemyId === 'enemy_monster_1') return '触手抽击';
  if (enemyId === 'enemy_sea_serpent') return '蛇身突刺';
  if (enemyId === 'enemy_white_whale') return '鲸尾撞击';
  if (enemyId === 'enemy_leviathan') return '深渊重击';
  return '敌人发动攻击';
}

function applyNormalDamageTraits(enemyId: string, damage: number): number {
  if (enemyId === 'enemy_sea_serpent') return Math.max(1, damage - 3);
  if (enemyId === 'enemy_white_whale') return Math.max(1, damage - 5);
  if (enemyId === 'enemy_leviathan') return Math.max(1, damage - 5);
  return damage;
}

function getChainDamage(enemyId: string): number {
  if (enemyId === 'enemy_sea_serpent') return 18;
  if (enemyId === 'enemy_monster_1') return 12;
  if (enemyId === 'enemy_white_whale') return 6;
  if (enemyId === 'enemy_leviathan') return 8;
  return 10;
}

function getFireDamage(enemyId: string, isMonster: boolean): number {
  if (!isMonster) return 20;
  if (enemyId === 'enemy_monster_1') return 45;
  if (enemyId === 'enemy_sea_serpent') return 35;
  if (enemyId === 'enemy_white_whale') return 24;
  if (enemyId === 'enemy_leviathan') return 35;
  return 35;
}

function getMonsterBoardDamage(enemyId: string): number {
  if (enemyId === 'enemy_monster_1') return Math.floor(Math.random() * 9) + 6;
  if (enemyId === 'enemy_sea_serpent') return Math.floor(Math.random() * 11) + 8;
  if (enemyId === 'enemy_white_whale') return Math.floor(Math.random() * 8) + 5;
  return Math.floor(Math.random() * 10) + 6;
}

export function resolveCombatTurn(player: PlayerState, voyage: VoyageState, action: CombatAction): { player: PlayerState, voyage: VoyageState } {
  if (voyage.mode !== 'combat' || !voyage.combatState) return { player, voyage };
  let combat = { ...voyage.combatState };
  let newPlayer = { ...player };
  let newVoyage = { ...voyage };
  let combatLogs: string[] = [];

  const enemy = ENEMIES.find(e => e.id === combat.enemyId)!;
  const isMonster = enemy.type === 'monster';

  // Player action
  if (action === 'attack_normal') {
    newPlayer.ownedAmmo['ammo_normal'] = (newPlayer.ownedAmmo['ammo_normal'] || 0) - 1;
    let dmg = 15;
    if (newPlayer.ownedCrew.some(c => c.id === 'crew_gunner')) dmg = Math.floor(dmg * 1.2);
    dmg = applyNormalDamageTraits(enemy.id, dmg);
    combat.enemyHp -= dmg;
    combatLogs.push(`普通炮击造成了 ${dmg} 点伤害。`);
  } else if (action === 'attack_chain') {
    newPlayer.ownedAmmo['ammo_chain'] = (newPlayer.ownedAmmo['ammo_chain'] || 0) - 1;
    let dmg = getChainDamage(enemy.id);
    combat.enemyHp -= dmg;
    combat.enemyNextAttackReduced = true;
    combatLogs.push(`链弹造成了 ${dmg} 点伤害，敌人下一次攻击将被削弱。`);
  } else if (action === 'attack_fire') {
    newPlayer.ownedAmmo['ammo_fire'] = (newPlayer.ownedAmmo['ammo_fire'] || 0) - 1;
    let dmg = getFireDamage(enemy.id, isMonster);
    combat.enemyHp -= dmg;
    combatLogs.push(`火弹造成了 ${dmg} 点伤害。`);
  } else if (action === 'board') {
    if (isMonster) {
      if (enemy.id === 'enemy_leviathan') {
        combatLogs.push('利维坦太巨大，无法登船肉搏。');
      } else {
        let dmg = getMonsterBoardDamage(enemy.id);
        const hasPirateKing = newPlayer.ownedCrew.some(c => c.id === 'crew_pirate_king');
        if (hasPirateKing) dmg = Math.floor(dmg * 1.2);
        combat.enemyHp -= dmg;
        combatLogs.push(`冒险靠近海怪造成了 ${dmg} 点伤害。`);
        if (Math.random() < 0.35 && newPlayer.ownedCrew.length > 0) {
          const lostIdx = Math.floor(Math.random() * newPlayer.ownedCrew.length);
          combatLogs.push(`海怪反击中，${newPlayer.ownedCrew[lostIdx].name} 牺牲了！`);
          newPlayer.ownedCrew.splice(lostIdx, 1);
        }
      }
    } else {
      let dmg = Math.floor(Math.random() * 16) + 10; // 10-25
      const hasPirateKing = newPlayer.ownedCrew.some(c => c.id === 'crew_pirate_king');
      if (hasPirateKing) dmg = Math.floor(dmg * 1.3);
      combat.enemyHp -= dmg;
      combatLogs.push(`登船战造成了 ${dmg} 点伤害。`);
      if (Math.random() < 0.2 && newPlayer.ownedCrew.length > 0) {
        const lostIdx = Math.floor(Math.random() * newPlayer.ownedCrew.length);
        combatLogs.push(`惨烈肉搏中，${newPlayer.ownedCrew[lostIdx].name} 牺牲了！`);
        newPlayer.ownedCrew.splice(lostIdx, 1);
      }
    }
  } else if (action === 'repair') {
    combat.playerRepairedThisCombat = true;
    const hasRepairman = newPlayer.ownedCrew.some(c => c.id === 'crew_repairman');
    const heal = hasRepairman ? 12 : 5;
    const maxHull = calculateMaxHull(newPlayer.currentShip, newPlayer.ownedArmor);
    newPlayer.currentHull = Math.min(maxHull, newPlayer.currentHull + heal);
    combatLogs.push(`紧急维修恢复了 ${heal} 点耐久。`);
  } else if (action === 'flee') {
    const speed = newPlayer.currentShip?.speed || 1;
    const chance = speed * 0.15 + 0.1;
    if (Math.random() < chance) {
      combatLogs.push(`成功脱离战斗！`);
      newVoyage.mode = 'sailing';
      newVoyage.combatState = null;
      newVoyage.log = [...combatLogs, ...newVoyage.log].slice(0, 5);
      return { player: newPlayer, voyage: newVoyage };
    } else {
      combatLogs.push(`逃跑失败！`);
    }
  }

  // Check enemy death
  if (combat.enemyHp <= 0) {
    combatLogs.push(`击败了 ${enemy.name}!`);
    let rewardGold = enemy.rewardGold;
    if (voyage.route) rewardGold = Math.floor(rewardGold * voyage.route.adventureMultiplier);

    if (action === 'board' && newPlayer.ownedCrew.some(c => c.id === 'crew_pirate_king')) {
      rewardGold = Math.floor(rewardGold * 1.3);
    }

    newVoyage.temporaryGold += rewardGold;
    combatLogs.push(`获得 ${rewardGold} 金币奖励。`);

    if (Math.random() < 0.3) {
      const baseCargo = CARGO_TYPES[Math.floor(Math.random() * CARGO_TYPES.length)];
      const randomCargo: import('../types').PlayerCargo = {
        ...baseCargo,
        actualBuyPrice: 0,
        sourcePortId: 'unknown',
        uid: `loot_${Date.now()}_${Math.random()}`
      };
      newVoyage.lootCargo.push(randomCargo);
      combatLogs.push(`获得了战利品: ${randomCargo.name}。`);
    }

    if (isMonster) {
      newVoyage.monstersDefeated += 1;
      if (enemy.id !== 'enemy_leviathan') {
        newPlayer.reputation += 15;
        newPlayer.discoveredEvents = addStoryFlags(newPlayer, [`monster_trophy_${enemy.id}`]);
        combatLogs.push(`带回了${enemy.name}的证据，远洋补给线更相信你的海图。声望 +15。`);
      }
    } else {
      newVoyage.enemiesDefeated += 1;
    }

    if (enemy.id === 'enemy_leviathan' && !newPlayer.discoveredEvents.includes('defeated_leviathan')) {
      newPlayer.discoveredEvents = addStoryFlags(newPlayer, ['defeated_leviathan']);
      combatLogs.push('深渊的最终海妖已经沉入海底，所有海域都在传颂你的名字。');
    }

    if (enemy.id === 'enemy_patrol_1') {
      newPlayer.bounty += 30;
      newPlayer.reputation -= 20;
    }

    newVoyage.mode = 'sailing';
    newVoyage.eventsResolved += 1;
    newVoyage.combatState = null;

    const hasRepairman = newPlayer.ownedCrew.some(c => c.id === 'crew_repairman');
    if (hasRepairman) {
      const maxHull = calculateMaxHull(newPlayer.currentShip, newPlayer.ownedArmor);
      newPlayer.currentHull = Math.min(maxHull, newPlayer.currentHull + 3);
    }

    newVoyage.log = [...combatLogs, ...newVoyage.log].slice(0, 5);
    return { player: newPlayer, voyage: newVoyage };
  }

  // Enemy attack
  let enemyAttack = enemy.attack;
  if (combat.enemyNextAttackReduced) {
    enemyAttack = Math.floor(enemyAttack * 0.7);
    combat.enemyNextAttackReduced = false;
  }
  if (newPlayer.ownedArmor.some(a => a.id === 'armor_iron')) {
    enemyAttack = Math.floor(enemyAttack * 0.85);
  }

  newPlayer.currentHull -= enemyAttack;
  combatLogs.push(`${getEnemyAttackText(enemy.id)}，造成 ${enemyAttack} 点伤害！`);
  combat.log = combatLogs.reverse(); // recent first

  newVoyage.combatState = combat;

  return checkSinking(newPlayer, newVoyage);
}

export function settleArrival(player: import('../types').PlayerState, voyage: import('../types').VoyageState): { player: import('../types').PlayerState, resultMsg: string[] } {
  let p = { ...player };
  let msg = ['成功到达目的港！'];

  // Transfer loot to cargo
  p.cargo = [...p.cargo, ...voyage.lootCargo];

  // Set market multiplier based on the route taken
  p.marketMultiplier = voyage.route ? voyage.route.tradeMultiplier : 1.0;
  p.discoveredEvents = addStoryFlags(p, [
    `visited_${voyage.destinationPortId}`,
    ...(voyage.route ? [`sailed_${voyage.route.id}`] : [])
  ]);
  if (p.marketMultiplier > 1) {
    msg.push(`穿越高风险航线，当前港口商会对此行货物开出 ${p.marketMultiplier} 倍高价收购！`);
  }

  // Contract checkome
  let contractIncome = 0;
  let contractPenalty = 0;
  if (p.activeContract) {
    if (voyage.destinationPortId === p.activeContract.destinationPortId || !p.activeContract.destinationPortId) {
      const requiredCount = p.cargo.filter(c => c.name === p.activeContract!.requiredCargoName).length;
      if (requiredCount >= p.activeContract.requiredAmount) {
        contractIncome = p.activeContract.reward;
        p.reputation += 10;

        // Consume the required cargo
        let consumed = 0;
        p.cargo = p.cargo.filter(c => {
          if (c.name === p.activeContract!.requiredCargoName && consumed < p.activeContract!.requiredAmount) {
            consumed++;
            return false;
          }
          return true;
        });

        msg.push(`合同完成 (${p.activeContract.name}): +${contractIncome} 金币, +10 声望`);
      } else {
        contractPenalty = p.activeContract.penalty;
        p.reputation -= 5;
        msg.push(`未带齐货物，合同违约 (${p.activeContract.name}): -${contractPenalty} 金币, -5 声望`);
      }
    } else {
      contractPenalty = p.activeContract.penalty;
      p.reputation -= 5;
      msg.push(`未抵达指定目的港，合同违约 (${p.activeContract.name}): -${contractPenalty} 金币, -5 声望`);
    }
    p.activeContract = null;
  }
  p.gold += contractIncome - contractPenalty;

  // Adventure income
  p.gold += voyage.temporaryGold;
  msg.push(`海上冒险收入: +${voyage.temporaryGold} 金币`);

  // Route reputation
  const routeRep = voyage.route ? voyage.route.totalNodes : 5;
  p.reputation += routeRep;
  msg.push(`航行成功奖励: +${routeRep} 声望`);

  msg.push(`当前通缉值: ${p.bounty}, 声望: ${p.reputation}, 债务: ${p.debt}`);

  p.activeContract = null;
  p.successfulVoyageCount += 1;
  p.currentPortId = voyage.destinationPortId;

  return { player: p, resultMsg: msg };
}

export function settleReturn(player: PlayerState, voyage: VoyageState): { player: PlayerState, resultMsg: string[] } {
  let p = { ...player };
  let msg = ['中途返航结算。'];

  // Discount trade
  let tradeIncome = 0;
  const allCargo = [...p.cargo, ...voyage.lootCargo];
  allCargo.forEach(c => {
    tradeIncome += Math.floor(c.buyPrice * 0.8);
  });
  p.gold += tradeIncome;
  msg.push(`货物低价处理: +${tradeIncome} 金币`);

  let contractPenalty = 0;
  if (p.activeContract) {
    contractPenalty = p.activeContract.penalty;
    p.reputation -= 5;
    msg.push(`合同违约 (${p.activeContract.name}): -${contractPenalty} 金币, -5 声望`);
  }
  p.gold -= contractPenalty;

  let adventureIncome = Math.floor(voyage.temporaryGold * 0.7);
  p.gold += adventureIncome;
  msg.push(`带回冒险收入 (70%): +${adventureIncome} 金币`);

  msg.push(`当前通缉值: ${p.bounty}, 声望: ${p.reputation}, 债务: ${p.debt}`);

  p.cargo = [];
  p.activeContract = null;

  return { player: p, resultMsg: msg };
}

export function settleSinking(player: PlayerState): { player: PlayerState, resultMsg: string[] } {
  let p = { ...player };
  p.currentShip = null;
  p.currentHull = 0;
  p.ownedCrew = [];
  p.ownedAmmo = {};
  p.ownedArmor = [];
  let msg = ['船沉了。货物、炮弹、船员和这一趟的发财梦，全都留在海底了。'];

  if (p.gold > 0) {
    let cost = Math.floor(p.gold * 0.2);
    if (cost < 100 && p.gold >= 100) cost = 100;
    else if (cost < 100) cost = p.gold;
    p.gold -= cost;
    msg.push(`你抱着一块碎木板在海上漂流，被过路的商船救起。作为报酬，你支付了 ${cost} 金币的救援费。`);
  } else {
    msg.push(`你抱着一块碎木板在海上漂流，被好心的渔民捞起，所幸你本来就身无分文，没啥可失去的了。`);
  }

  if (p.activeContract) {
    p.gold = Math.max(0, p.gold - p.activeContract.penalty);
    p.reputation -= 10;
    msg.push(`合同违约: -${p.activeContract.penalty} 金币, -10 声望`);
  }

  p.cargo = [];
  p.activeContract = null;
  p.sinkCount += 1;
  return { player: p, resultMsg: msg };
}
