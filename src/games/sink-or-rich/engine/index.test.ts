import { describe, it, expect } from 'vitest';
import {
  calculateMaxHull,
  calculateRepairCost,
  calculateRepairUnitCost,
  canStartVoyage,
  createDefaultPlayerState,
  getEnemyCombatHint,
  getSeaEntityChaseSpeed,
  getVoyageDestinationPosition,
  moveShip,
  resolveCombatTurn,
  settleArrival,
  startVoyage
} from './index';
import { SHIPS, ARMORS, CARGO_TYPES, ROUTES, PORTS } from '../content/data';
import { getStoryStatus } from '../content/story';
import { clampCasinoPayout } from '../content/casino';
import { createContractKey, generateLocalContracts } from '../content/contracts';
import { applyStoryUnlocks, FINALE_STORY_PROGRESS, getVisibleRoutes, hasSeaMonsterProof } from '../content/progression';

describe('Game Logic Tests', () => {
  it('should create default player state correctly', () => {
    const player = createDefaultPlayerState();
    expect(player.gold).toBe(1000);
    expect(player.currentShip).toBeNull();
    expect(player.casinoProfitThisPort).toBe(0);
  });

  it('should calculate max hull correctly with armor', () => {
    const ship = SHIPS[0]; // maxHull: 80
    const armor = ARMORS.find(a => a.id === 'armor_wood'); // +20 hull

    expect(calculateMaxHull(ship, [])).toBe(80);
    expect(calculateMaxHull(ship, [armor!])).toBe(100);
  });

  it('should calculate repair cost correctly', () => {
    const player = createDefaultPlayerState();
    player.currentShip = SHIPS[0]; // repairCostPerHull: 2
    player.currentHull = 50; // max is 80, missing 30

    expect(calculateRepairCost(player)).toBe(60); // 30 * 2
  });

  it('should calculate repair cost from canonical ship data for legacy ship snapshots', () => {
    const player = createDefaultPlayerState();
    player.currentShip = { id: 'ship_junk', name: '东方大福船' } as typeof player.currentShip;
    player.currentHull = 100;

    expect(calculateMaxHull(player.currentShip, [])).toBe(180);
    expect(calculateRepairCost(player)).toBe(400);
    expect(calculateRepairUnitCost(player)).toBe(5);
  });

  it('should check if voyage can start', () => {
    const player = createDefaultPlayerState();
    expect(canStartVoyage(player)).toBe(false); // no ship

    player.currentShip = SHIPS[0];
    player.currentHull = 10; // max 80, 10 is < 30% (24)
    expect(canStartVoyage(player)).toBe(false);

    player.currentHull = 30; // 30 >= 24
    expect(canStartVoyage(player)).toBe(true);
  });

  it('should move ships at visibly different map speeds', () => {
    const route = ROUTES.find(r => r.id === 'route_coastal')!;
    const basePlayer = createDefaultPlayerState();
    const baseVoyage = {
      route,
      destinationPortId: 'port_tortuga',
      position: 0,
      totalNodes: route.totalNodes,
      mapWidth: 800,
      mapHeight: 2600,
      playerPosition: { x: 100, y: 1000 },
      distanceTraveled: 0,
      entities: [],
      mode: 'sailing' as const,
      temporaryGold: 0,
      lootCargo: [],
      eventsResolved: 0,
      enemiesDefeated: 0,
      monstersDefeated: 0,
      log: [],
      combatState: null,
      currentEvent: null,
    };
    const fishing = SHIPS.find(s => s.id === 'ship_fishing')!;
    const junk = SHIPS.find(s => s.id === 'ship_junk')!;
    const heavy = SHIPS.find(s => s.id === 'ship_heavy')!;

    const fishingMove = moveShip({ ...basePlayer, currentShip: fishing, currentHull: fishing.maxHull }, baseVoyage, 1, 0).voyage.playerPosition.x - baseVoyage.playerPosition.x;
    const junkMove = moveShip({ ...basePlayer, currentShip: junk, currentHull: junk.maxHull }, baseVoyage, 1, 0).voyage.playerPosition.x - baseVoyage.playerPosition.x;
    const heavyMove = moveShip({ ...basePlayer, currentShip: heavy, currentHull: heavy.maxHull }, baseVoyage, 1, 0).voyage.playerPosition.x - baseVoyage.playerPosition.x;

    expect(junkMove).toBeGreaterThan(fishingMove);
    expect(fishingMove).toBeGreaterThan(heavyMove);
  });

  it('should place the destination port away from the starting centerline', () => {
    const player = createDefaultPlayerState();
    const route = ROUTES.find(r => r.id === 'route_coastal')!;
    const { voyage } = startVoyage(player, route, 'port_tortuga');
    const destinationPosition = getVoyageDestinationPosition(voyage);

    expect(destinationPosition.y).toBe(150);
    expect(Math.abs(destinationPosition.x - voyage.mapWidth / 2)).toBeGreaterThan(100);
  });

  it('should give sea monsters different chase speeds and combat hints', () => {
    const octopusSpeed = getSeaEntityChaseSpeed({ type: 'monster', eventId: 'event_giant_octopus' });
    const serpentSpeed = getSeaEntityChaseSpeed({ type: 'monster', eventId: 'event_sea_serpent' });
    const whaleSpeed = getSeaEntityChaseSpeed({ type: 'monster', eventId: 'event_white_whale' });
    const leviathanSpeed = getSeaEntityChaseSpeed({ type: 'monster', eventId: 'event_leviathan' });

    expect(serpentSpeed).toBeGreaterThan(leviathanSpeed);
    expect(leviathanSpeed).toBeGreaterThan(octopusSpeed);
    expect(octopusSpeed).toBeGreaterThan(whaleSpeed);
    expect(getSeaEntityChaseSpeed({ type: 'pirate', eventId: 'event_pirate_block' })).toBe(2.5);
    expect(getEnemyCombatHint('enemy_sea_serpent')).toContain('链弹');
  });

  it('should apply distinct sea monster combat traits', () => {
    const route = ROUTES.find(r => r.id === 'route_black_tide')!;
    const ship = SHIPS.find(s => s.id === 'ship_ultimate')!;
    const createCombatPlayer = () => ({
      ...createDefaultPlayerState(),
      currentShip: ship,
      currentHull: ship.maxHull,
      ownedAmmo: { ammo_normal: 1, ammo_chain: 1, ammo_fire: 1 },
    });
    const createCombatVoyage = (enemyId: string) => ({
      route,
      destinationPortId: 'port_nassau',
      position: 0,
      totalNodes: route.totalNodes,
      mapWidth: 800,
      mapHeight: 2600,
      playerPosition: { x: 100, y: 1000 },
      distanceTraveled: 0,
      entities: [],
      mode: 'combat' as const,
      temporaryGold: 0,
      lootCargo: [],
      eventsResolved: 0,
      enemiesDefeated: 0,
      monstersDefeated: 0,
      log: [],
      combatState: {
        enemyId,
        enemyHp: 100,
        enemyMaxHp: 100,
        enemyNextAttackReduced: false,
        playerRepairedThisCombat: false,
        log: [],
      },
      currentEvent: null,
    });

    expect(resolveCombatTurn(createCombatPlayer(), createCombatVoyage('enemy_white_whale'), 'attack_normal').voyage.combatState?.enemyHp).toBe(90);
    expect(resolveCombatTurn(createCombatPlayer(), createCombatVoyage('enemy_sea_serpent'), 'attack_chain').voyage.combatState?.enemyHp).toBe(82);
    expect(resolveCombatTurn(createCombatPlayer(), createCombatVoyage('enemy_monster_1'), 'attack_fire').voyage.combatState?.enemyHp).toBe(55);
    expect(resolveCombatTurn(createCombatPlayer(), createCombatVoyage('enemy_leviathan'), 'board').voyage.combatState?.enemyHp).toBe(100);
  });

  it('should keep carried cargo and add loot after successful arrival', () => {
    const player = createDefaultPlayerState();
    const ship = SHIPS.find(s => s.id === 'ship_merchant')!;
    const silk = CARGO_TYPES.find(c => c.id === 'cargo_silk')!;
    const jewelry = CARGO_TYPES.find(c => c.id === 'cargo_jewelry')!;
    const route = ROUTES.find(r => r.id === 'route_coastal')!;

    player.currentShip = ship;
    player.currentHull = ship.maxHull;
    player.cargo = [{
      ...silk,
      actualBuyPrice: 72,
      sourcePortId: 'port_oriental',
      uid: 'cargo_silk_test'
    }];

    const { player: settledPlayer } = settleArrival(player, {
      route,
      destinationPortId: 'port_royal',
      position: 0,
      totalNodes: route.totalNodes,
      mapWidth: 800,
      mapHeight: 2600,
      playerPosition: { x: 400, y: 150 },
      distanceTraveled: 0,
      entities: [],
      mode: 'arrived',
      temporaryGold: 123,
      lootCargo: [{
        ...jewelry,
        actualBuyPrice: 0,
        sourcePortId: 'unknown',
        uid: 'loot_jewelry_test'
      }],
      eventsResolved: 0,
      enemiesDefeated: 0,
      monstersDefeated: 0,
      log: [],
      combatState: null,
      currentEvent: null,
    });

    expect(settledPlayer.currentPortId).toBe('port_royal');
    expect(settledPlayer.gold).toBe(1123);
    expect(settledPlayer.cargo.map(c => c.uid)).toEqual(['cargo_silk_test', 'loot_jewelry_test']);
    expect(settledPlayer.discoveredEvents).toContain('visited_port_royal');
    expect(settledPlayer.discoveredEvents).toContain('sailed_route_coastal');
  });

  it('should treat legacy saves without story progress as the prologue', () => {
    const player = createDefaultPlayerState();
    delete (player as Partial<typeof player>).storyProgress;

    expect(getStoryStatus(player)?.title).toBe('主线：破产船长的序章');
  });

  it('should cap casino payout without exceeding the hidden session limit', () => {
    expect(clampCasinoPayout(105000, 5000, 0)).toBe(18000);
    expect(clampCasinoPayout(15000, 5000, 17000)).toBe(6000);
    expect(clampCasinoPayout(1000, 100, 0)).toBe(1000);
  });

  it('should reset casino profit tracking when starting a voyage', () => {
    const player = createDefaultPlayerState();
    const ship = SHIPS.find(s => s.id === 'ship_fishing')!;
    const route = ROUTES.find(r => r.id === 'route_coastal')!;

    player.currentShip = ship;
    player.currentHull = ship.maxHull;
    player.casinoProfitThisPort = 18000;

    const { player: sailingPlayer } = startVoyage(player, route, 'port_tortuga');
    expect(sailingPlayer.casinoProfitThisPort).toBe(0);
  });

  it('should generate at most one sea monster encounter per voyage', () => {
    const player = createDefaultPlayerState();
    const ship = SHIPS.find(s => s.id === 'ship_war')!;
    const route = ROUTES.find(r => r.id === 'route_legend')!;
    player.currentShip = ship;
    player.currentHull = ship.maxHull;

    for (let i = 0; i < 20; i += 1) {
      const { voyage } = startVoyage(player, route, 'port_nassau');
      expect(voyage.entities.filter(entity => entity.type === 'monster')).toHaveLength(
        voyage.entities.some(entity => entity.type === 'monster') ? 1 : 0
      );
      expect(voyage.entities.some(entity => entity.eventId === 'event_leviathan')).toBe(false);
    }
  });

  it('should force only the leviathan as the abyss sea monster', () => {
    const player = createDefaultPlayerState();
    const ship = SHIPS.find(s => s.id === 'ship_ultimate')!;
    const route = ROUTES.find(r => r.id === 'route_abyss')!;
    player.currentShip = ship;
    player.currentHull = ship.maxHull;

    const { voyage } = startVoyage(player, route, 'port_madagascar');
    const monsters = voyage.entities.filter(entity => entity.type === 'monster');

    expect(monsters).toHaveLength(1);
    expect(monsters[0].eventId).toBe('event_leviathan');
  });

  it('should turn sea monster victories into story proof', () => {
    const player = createDefaultPlayerState();
    const ship = SHIPS.find(s => s.id === 'ship_war')!;
    player.currentShip = ship;
    player.currentHull = ship.maxHull;
    player.ownedAmmo = { ammo_normal: 1 };

    const route = ROUTES.find(r => r.id === 'route_black_tide')!;
    const voyage = {
      route,
      destinationPortId: 'port_nassau',
      position: 0,
      totalNodes: route.totalNodes,
      mapWidth: 800,
      mapHeight: 2600,
      playerPosition: { x: 100, y: 1000 },
      distanceTraveled: 0,
      entities: [],
      mode: 'combat' as const,
      temporaryGold: 0,
      lootCargo: [],
      eventsResolved: 0,
      enemiesDefeated: 0,
      monstersDefeated: 0,
      log: [],
      combatState: {
        enemyId: 'enemy_sea_serpent',
        enemyHp: 1,
        enemyMaxHp: 130,
        enemyNextAttackReduced: false,
        playerRepairedThisCombat: false,
        log: [],
      },
      currentEvent: null,
    };

    const { player: updatedPlayer, voyage: updatedVoyage } = resolveCombatTurn(player, voyage, 'attack_normal');

    expect(hasSeaMonsterProof(updatedPlayer)).toBe(true);
    expect(updatedVoyage.monstersDefeated).toBe(1);
    expect(updatedPlayer.reputation).toBe(15);
  });

  it('should not unlock the finale from gold alone', () => {
    const player = createDefaultPlayerState();
    player.storyProgress = FINALE_STORY_PROGRESS;
    player.storyBranch = 'pirate';
    player.gold = 50000;

    const status = getStoryStatus(player);
    expect(status?.canAdvance).toBe(false);
    expect(status?.objective).toContain('未解锁海域');
  });

  it('should unlock the finale after all seas, ports, wealth, and the abyss challenge are complete', () => {
    const player = createDefaultPlayerState();
    player.storyProgress = FINALE_STORY_PROGRESS;
    player.storyBranch = 'governor';
    player.gold = 50000;
    player.unlockedPorts = PORTS.map(port => port.id);
    player.unlockedRoutes = ROUTES.map(route => route.id);
    player.discoveredEvents = ['defeated_leviathan'];

    expect(getStoryStatus(player)?.canAdvance).toBe(false);

    player.discoveredEvents.push('queen_mission_completed');
    expect(getStoryStatus(player)?.canAdvance).toBe(true);
  });

  it('should require the pirate treasure hunt for the pirate finale', () => {
    const player = createDefaultPlayerState();
    player.storyProgress = FINALE_STORY_PROGRESS;
    player.storyBranch = 'pirate';
    player.gold = 50000;
    player.unlockedPorts = PORTS.map(port => port.id);
    player.unlockedRoutes = ROUTES.map(route => route.id);
    player.discoveredEvents = ['defeated_leviathan'];

    expect(getStoryStatus(player)?.objective).toContain('尚未找到海盗王宝藏');

    player.discoveredEvents.push('pirate_treasure_found');
    expect(getStoryStatus(player)?.canAdvance).toBe(true);
  });

  it('should reveal routes gradually through story progress', () => {
    const player = createDefaultPlayerState();

    expect(getVisibleRoutes(player).map(route => route.id)).toEqual([
      'route_coastal',
      'route_storm',
      'route_black_tide'
    ]);

    player.storyProgress = 3;
    expect(getVisibleRoutes(player).map(route => route.id)).toContain('route_coral');
    expect(getVisibleRoutes(player).map(route => route.id)).not.toContain('route_monsoon');
  });

  it('should apply story route and port unlocks without losing existing state', () => {
    const player = createDefaultPlayerState();
    player.unlockedRoutes = ['route_coastal'];
    player.unlockedPorts = ['port_royal', 'port_tortuga'];

    const updated = applyStoryUnlocks(player, 5);

    expect(updated.unlockedRoutes).toEqual([
      'route_coastal',
      'route_storm',
      'route_black_tide',
      'route_coral',
      'route_monsoon',
      'route_legend'
    ]);
    expect(updated.unlockedPorts).toContain('port_nassau');
    expect(updated.unlockedPorts).toContain('port_azores');
    expect(updated.unlockedPorts).not.toContain('port_madagascar');
  });

  it('should generate contracts without exact duplicates', () => {
    const currentPort = PORTS.find(port => port.id === 'port_royal')!;
    const contracts = generateLocalContracts(currentPort, ['port_royal', 'port_tortuga', 'port_oriental'], PORTS, CARGO_TYPES);
    const keys = contracts.map(createContractKey);

    expect(contracts).toHaveLength(3);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
