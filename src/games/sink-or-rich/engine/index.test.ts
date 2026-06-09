import { describe, it, expect } from 'vitest';
import { calculateMaxHull, calculateRepairCost, canStartVoyage, createDefaultPlayerState } from './index';
import { SHIPS, ARMORS } from '../content/data';

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
});
