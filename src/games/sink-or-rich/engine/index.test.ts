import { describe, it, expect } from 'vitest';
import { calculateMaxHull, calculateRepairCost, calculateRepairUnitCost, canStartVoyage, createDefaultPlayerState, settleArrival, startVoyage } from './index';
import { SHIPS, ARMORS, CARGO_TYPES, ROUTES, PORTS } from '../content/data';
import { getStoryStatus } from '../content/story';
import { clampCasinoPayout } from '../content/casino';
import { createContractKey, generateLocalContracts } from '../content/contracts';

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

  it('should not unlock the finale from gold alone', () => {
    const player = createDefaultPlayerState();
    player.storyProgress = 3;
    player.storyBranch = 'pirate';
    player.gold = 50000;

    const status = getStoryStatus(player);
    expect(status?.canAdvance).toBe(false);
    expect(status?.objective).toContain('未解锁海域');
  });

  it('should unlock the finale after all seas, ports, wealth, and the abyss challenge are complete', () => {
    const player = createDefaultPlayerState();
    player.storyProgress = 3;
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
    player.storyProgress = 3;
    player.storyBranch = 'pirate';
    player.gold = 50000;
    player.unlockedPorts = PORTS.map(port => port.id);
    player.unlockedRoutes = ROUTES.map(route => route.id);
    player.discoveredEvents = ['defeated_leviathan'];

    expect(getStoryStatus(player)?.objective).toContain('尚未找到海盗王宝藏');

    player.discoveredEvents.push('pirate_treasure_found');
    expect(getStoryStatus(player)?.canAdvance).toBe(true);
  });

  it('should generate contracts without exact duplicates', () => {
    const currentPort = PORTS.find(port => port.id === 'port_royal')!;
    const contracts = generateLocalContracts(currentPort, ['port_royal', 'port_tortuga', 'port_oriental'], PORTS, CARGO_TYPES);
    const keys = contracts.map(createContractKey);

    expect(contracts).toHaveLength(3);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
