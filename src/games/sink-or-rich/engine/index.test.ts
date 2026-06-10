import { describe, it, expect } from 'vitest';
import { calculateMaxHull, calculateRepairCost, canStartVoyage, createDefaultPlayerState, settleArrival } from './index';
import { SHIPS, ARMORS, CARGO_TYPES, ROUTES } from '../content/data';
import { getStoryStatus } from '../content/story';

describe('Game Logic Tests', () => {
  it('should create default player state correctly', () => {
    const player = createDefaultPlayerState();
    expect(player.gold).toBe(1000);
    expect(player.currentShip).toBeNull();
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
});
