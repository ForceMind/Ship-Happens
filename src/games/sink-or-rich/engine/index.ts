import { PlayerState, VoyageState, Route, Enemy, CombatState, Ship, Armor, VoyageMode } from '../types';
import { GAME_EVENTS } from '../content/events';
import { ENEMIES, PORTS, CARGO_TYPES } from '../content/data';

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
  };
}

export function calculateMaxHull(ship: Ship | null, armor: Armor[]): number {
  if (!ship) return 0;
  let maxHull = ship.maxHull;
  if (armor.some(a => a.id === 'armor_wood')) {
    maxHull += 20;
  }
  return maxHull;
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
  const missingHull = maxHull - player.currentHull;
  if (missingHull <= 0) return 0;
  
  let cost = missingHull * player.currentShip.repairCostPerHull;
  if (player.bounty > 80) cost *= 1.4;
  else if (player.bounty > 50) cost *= 1.2;
  
  return Math.floor(cost);
}

export function canStartVoyage(player: PlayerState): boolean {
  if (!player.currentShip) return false;
  const maxHull = calculateMaxHull(player.currentShip, player.ownedArmor);
  if (player.currentHull < maxHull * 0.3) return false;
  return true;
}

export function startVoyage(player: PlayerState, route: Route, destinationPortId: string): { player: PlayerState, voyage: VoyageState } {
  const mapWidth = 800;
  const mapHeight = route.totalNodes * 400 + 600; // e.g. 5 nodes = 2600 height
  
  const entities: typeof GAME_EVENTS[0]['id'][] = [];
  // Generate entities based on route risk
  const entityCount = Math.floor(route.totalNodes * route.riskMultiplier * 1.5);
  const generatedEntities = [];
  
  for (let i = 0; i < entityCount; i++) {
    const event = GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
    let type = 'cargo';
    if (event.id === 'event_storm') type = 'storm';
    if (event.id === 'event_reef') type = 'reef';
    if (event.id === 'event_floating_cargo') type = 'cargo';
    if (event.id === 'event_damaged_merchant') type = 'merchant';
    if (event.id === 'event_pirate_block') type = 'pirate';
    if (event.id === 'event_giant_octopus') type = 'monster';
    if (event.id === 'event_patrol') type = 'patrol';
    if (event.id === 'event_island') type = 'island';
    if (event.id === 'event_black_market') type = 'black_market';
    if (event.id === 'event_siren') type = 'siren';
    if (event.id === 'event_bottle') type = 'cargo';
    if (event.id === 'event_mutiny') type = 'merchant';
    if (event.id === 'event_ghost_fog') type = 'storm';
    if (event.id === 'event_blockade') type = 'patrol';
    if (event.id === 'event_whirlpool') type = 'reef';
    if (event.id === 'event_leviathan') type = 'monster';
    if (event.id === 'event_debt_collector') type = 'patrol';

    generatedEntities.push({
      id: `entity_${i}_${Date.now()}`,
      type: type as any,
      x: Math.floor(Math.random() * (mapWidth - 100)) + 50,
      y: Math.floor(Math.random() * (mapHeight - 600)) + 200, // keep start and end clear
      radius: type === 'storm' || type === 'reef' || type === 'siren' ? 80 : 40,
      eventId: event.id,
      resolved: false
    });
  }

  // Force spawn Leviathan if it's the abyss route
  if (route.id === 'route_abyss') {
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
    player: { ...player, voyageCount: player.voyageCount + 1 },
    voyage: {
      route,
      destinationPortId,
      position: 0,
      totalNodes: route.totalNodes,
      mapWidth,
      mapHeight,
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
        const baseSpeed = newEntity.type === 'pirate' ? 2.5 : 2.0;
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
  return {
    ...voyage,
    currentEvent: event || null,
    entities: voyage.entities.map(e => e.id === entityId ? { ...e, resolved: true } : e),
    log: [`遇到: ${event?.name}`, ...voyage.log].slice(0, 5)
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
    combat.enemyHp -= dmg;
    combatLogs.push(`普通炮击造成了 ${dmg} 点伤害。`);
  } else if (action === 'attack_chain') {
    newPlayer.ownedAmmo['ammo_chain'] = (newPlayer.ownedAmmo['ammo_chain'] || 0) - 1;
    let dmg = 10;
    combat.enemyHp -= dmg;
    combat.enemyNextAttackReduced = true;
    combatLogs.push(`链弹造成了 ${dmg} 点伤害，敌人下一次攻击将被削弱。`);
  } else if (action === 'attack_fire') {
    newPlayer.ownedAmmo['ammo_fire'] = (newPlayer.ownedAmmo['ammo_fire'] || 0) - 1;
    let dmg = 20;
    if (isMonster) dmg += 15;
    combat.enemyHp -= dmg;
    combatLogs.push(`火弹造成了 ${dmg} 点伤害。`);
  } else if (action === 'board') {
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
      const randomCargo = CARGO_TYPES[Math.floor(Math.random() * CARGO_TYPES.length)];
      newVoyage.lootCargo.push(randomCargo);
      combatLogs.push(`获得了战利品: ${randomCargo.name}。`);
    }

    if (isMonster) newVoyage.monstersDefeated += 1;
    else newVoyage.enemiesDefeated += 1;

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
  combatLogs.push(`敌人发动攻击，造成 ${enemyAttack} 点伤害！`);
  combat.log = combatLogs.reverse(); // recent first

  newVoyage.combatState = combat;

  return checkSinking(newPlayer, newVoyage);
}

export function settleArrival(player: PlayerState, voyage: VoyageState): { player: PlayerState, resultMsg: string[] } {
  let p = { ...player };
  let msg = ['成功到达目的港！'];

  // Trade income
  let tradeIncome = 0;
  const destinationPort = PORTS.find(port => port.id === voyage.destinationPortId) || PORTS[0];
  const allCargo = [...p.cargo, ...voyage.lootCargo];
  allCargo.forEach(c => {
    let sell = c.sellPrice;
    const portMultiplier = destinationPort.priceMultipliers[c.id] || 1;
    sell = Math.floor(sell * portMultiplier);
    if (voyage.route) sell = Math.floor(sell * voyage.route.tradeMultiplier);
    tradeIncome += sell;
  });
  
  if (p.ownedCrew.some(c => c.id === 'crew_merchant_agent')) {
    tradeIncome = Math.floor(tradeIncome * 1.15);
  }
  
  p.gold += tradeIncome;
  msg.push(`贸易收入: +${tradeIncome} 金币`);

  // Contract income
  let contractIncome = 0;
  let contractPenalty = 0;
  if (p.activeContract) {
    const requiredCount = allCargo.filter(c => c.name === p.activeContract!.requiredCargoName).length;
    if (requiredCount >= p.activeContract.requiredAmount) {
      contractIncome = p.activeContract.reward;
      p.reputation += 10;
      msg.push(`合同完成 (${p.activeContract.name}): +${contractIncome} 金币, +10 声望`);
    } else {
      contractPenalty = p.activeContract.penalty;
      p.reputation -= 5;
      msg.push(`合同违约 (${p.activeContract.name}): -${contractPenalty} 金币, -5 声望`);
    }
  }
  p.gold += contractIncome - contractPenalty;

  // Adventure income
  p.gold += voyage.temporaryGold;
  msg.push(`海上冒险收入: +${voyage.temporaryGold} 金币`);

  // Route reputation
  const routeRep = voyage.route ? voyage.route.totalNodes : 5;
  p.reputation += routeRep;
  msg.push(`航行成功奖励: +${routeRep} 声望`);

  // Debt interest
  if (p.debt > 0) {
    const interest = Math.floor(p.debt * (voyage.route ? voyage.route.totalNodes * 0.01 : 0.05));
    p.debt += interest;
    msg.push(`银行利息结算: 债务增加 ${interest} 金币`);
  }

  msg.push(`当前通缉值: ${p.bounty}, 声望: ${p.reputation}, 债务: ${p.debt}`);
  
  p.cargo = [];
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

  // Debt interest
  if (p.debt > 0) {
    const interest = Math.floor(p.debt * (voyage.route ? Math.max(1, voyage.route.totalNodes * 0.005) : 0.02));
    p.debt += interest;
    msg.push(`银行利息结算(返航折扣): 债务增加 ${interest} 金币`);
  }

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
  
  if (p.activeContract) {
    p.gold = Math.max(0, p.gold - p.activeContract.penalty);
    p.reputation -= 10;
    msg.push(`合同违约: -${p.activeContract.penalty} 金币, -10 声望`);
  }

  // Debt interest
  if (p.debt > 0) {
    const interest = Math.floor(p.debt * 0.05); // 5% flat penalty for sinking
    p.debt += interest;
    msg.push(`银行利息结算(沉船惩罚): 债务增加 ${interest} 金币`);
  }

  p.cargo = [];
  p.activeContract = null;
  p.sinkCount += 1;
  return { player: p, resultMsg: msg };
}
