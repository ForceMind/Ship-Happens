import { PlayerState, Route } from '../types';
import { PORTS, ROUTES } from './data';

export const FINAL_STORY_PROGRESS = 7;
export const FINALE_STORY_PROGRESS = 6;

const INITIAL_VISIBLE_ROUTE_COUNT = 3;

const STORY_ROUTE_UNLOCKS: Record<number, string[]> = {
  2: ['route_storm'],
  3: ['route_black_tide'],
  4: ['route_coral'],
  5: ['route_monsoon', 'route_legend'],
  6: ['route_abyss'],
};

const STORY_PORT_UNLOCKS: Record<number, string[]> = {
  2: ['port_nassau'],
  3: ['port_cartagena'],
  4: ['port_oriental'],
  5: ['port_azores'],
  6: ['port_madagascar'],
};

export const SEA_MONSTER_PROOF_FLAGS = [
  'monster_trophy_enemy_monster_1',
  'monster_trophy_enemy_sea_serpent',
  'monster_trophy_enemy_white_whale',
  'monster_trophy_enemy_monster_2',
];

export function normalizeStoryProgress(player: Pick<PlayerState, 'storyProgress'>): number {
  return Number.isFinite(player.storyProgress) ? player.storyProgress : 0;
}

export function getVisibleRouteCount(player: Pick<PlayerState, 'storyProgress'>): number {
  const storyProgress = normalizeStoryProgress(player);
  return Math.min(ROUTES.length, INITIAL_VISIBLE_ROUTE_COUNT + Math.max(0, storyProgress - 2));
}

export function getVisibleRoutes(player: Pick<PlayerState, 'storyProgress'>): Route[] {
  return ROUTES.slice(0, getVisibleRouteCount(player));
}

export function isRouteVisible(player: Pick<PlayerState, 'storyProgress'>, routeId: string): boolean {
  return getVisibleRoutes(player).some(route => route.id === routeId);
}

export function getRouteUnlockProgress(routeId: string): number {
  for (const [step, routeIds] of Object.entries(STORY_ROUTE_UNLOCKS)) {
    if (routeIds.includes(routeId)) return Number(step);
  }
  return 0;
}

export function isRouteUnlockAvailable(player: Pick<PlayerState, 'storyProgress'>, routeId: string): boolean {
  return normalizeStoryProgress(player) >= getRouteUnlockProgress(routeId);
}

export function applyStoryUnlocks(player: PlayerState, storyProgress: number): PlayerState {
  const routeUnlocks = new Set(player.unlockedRoutes);
  const portUnlocks = new Set(player.unlockedPorts);

  for (let step = 0; step <= storyProgress; step += 1) {
    STORY_ROUTE_UNLOCKS[step]?.forEach(routeId => routeUnlocks.add(routeId));
    STORY_PORT_UNLOCKS[step]?.forEach(portId => portUnlocks.add(portId));
  }

  return {
    ...player,
    storyProgress,
    unlockedRoutes: ROUTES.filter(route => routeUnlocks.has(route.id)).map(route => route.id),
    unlockedPorts: PORTS.filter(port => portUnlocks.has(port.id)).map(port => port.id),
  };
}

export function hasStoryFlag(player: Pick<PlayerState, 'discoveredEvents'>, flag: string): boolean {
  return player.discoveredEvents.includes(flag);
}

export function addStoryFlags(player: Pick<PlayerState, 'discoveredEvents'>, flags: string[]): string[] {
  return Array.from(new Set([...player.discoveredEvents, ...flags]));
}

export function hasSeaMonsterProof(player: Pick<PlayerState, 'discoveredEvents'>): boolean {
  return SEA_MONSTER_PROOF_FLAGS.some(flag => player.discoveredEvents.includes(flag));
}
