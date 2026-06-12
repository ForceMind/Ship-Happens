import { PlayerState, VoyageState } from './types';
import { createDefaultPlayerState } from './engine';
import { SHIPS } from './content/data';
import { applyStoryUnlocks } from './content/progression';

const STORAGE_KEY_PLAYER = 'sink_or_rich_player_v1';
const STORAGE_KEY_VOYAGE = 'sink_or_rich_voyage_v1';

export function saveGame(player: PlayerState, voyage: VoyageState | null) {
  try {
    localStorage.setItem(STORAGE_KEY_PLAYER, JSON.stringify(player));
    if (voyage) {
      localStorage.setItem(STORAGE_KEY_VOYAGE, JSON.stringify(voyage));
    } else {
      localStorage.removeItem(STORAGE_KEY_VOYAGE);
    }
  } catch (e) {
    console.error('Failed to save game', e);
  }
}

export function loadGame(): { player: PlayerState; voyage: VoyageState | null } {
  try {
    const pStr = localStorage.getItem(STORAGE_KEY_PLAYER);
    const vStr = localStorage.getItem(STORAGE_KEY_VOYAGE);

    let player = pStr ? JSON.parse(pStr) : createDefaultPlayerState();

    // Migration for legacy saves
    if (player) {
      if (!player.unlockedRoutes) {
        player.unlockedRoutes = ['route_royal_tortuga_1'];
      }
      if (!player.unlockedPorts) {
        player.unlockedPorts = ['port_royal', 'port_tortuga'];
      }
      if (typeof player.marketMultiplier !== 'number') {
        player.marketMultiplier = 1.0;
      }
      if (typeof player.casinoProfitThisPort !== 'number') {
        player.casinoProfitThisPort = 0;
      }
      if (typeof player.debtInterestMinutes !== 'number') {
        player.debtInterestMinutes = 0;
      }
      if (typeof player.debtGraceMinutes !== 'number') {
        player.debtGraceMinutes = 0;
      }
      if (typeof player.storyProgress !== 'number') {
        player.storyProgress = 0;
      }
      if (player.storyBranch !== 'pirate' && player.storyBranch !== 'governor') {
        delete player.storyBranch;
      }
      if (player.storyProgress === 3 && player.storyBranch) {
        player.storyProgress = 4;
      }
      player = applyStoryUnlocks(player, player.storyProgress);
      if (player.currentShip) {
        const canonicalShip = SHIPS.find(s => s.id === player.currentShip.id);
        if (canonicalShip) {
          player.currentShip = { ...player.currentShip, ...canonicalShip };
        }
        if (typeof player.currentHull !== 'number') {
          player.currentHull = player.currentShip.maxHull;
        }
      }
      if (player.cargo && player.cargo.length > 0) {
        player.cargo = player.cargo.map((c: any) => ({
          ...c,
          actualBuyPrice: c.actualBuyPrice !== undefined ? c.actualBuyPrice : 0,
          sourcePortId: c.sourcePortId || 'unknown',
          uid: c.uid || `legacy_${Math.random()}`
        }));
      }
    }

    let voyage = vStr ? JSON.parse(vStr) : null;
    if (voyage && !voyage.destinationPosition) {
      voyage.destinationPosition = { x: voyage.mapWidth / 2, y: 150 };
    }

    return { player, voyage };
  } catch (e) {
    console.error('Failed to load game', e);
    return { player: createDefaultPlayerState(), voyage: null };
  }
}

export function resetGame(): PlayerState {
  try {
    localStorage.removeItem(STORAGE_KEY_PLAYER);
    localStorage.removeItem(STORAGE_KEY_VOYAGE);
  } catch (e) {
    console.error('Failed to reset game', e);
  }
  return createDefaultPlayerState();
}
