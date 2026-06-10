export type RiskTag = 'low' | 'medium' | 'high' | 'extreme' | 'illegal';

export interface Ship {
  id: string;
  name: string;
  price: number;
  maxHull: number;
  cargoSlots: number;
  cannonSlots: number;
  speed: number;
  repairCostPerHull: number;
  description: string;
  availableInPorts?: string[];
}

export interface Crew {
  id: string;
  name: string;
  price: number;
  effectText: string;
  tags?: string[];
  availableInPorts?: string[];
}

export interface Ammo {
  id: string;
  name: string;
  price: number;
  damage: number;
  effectText: string;
  availableInPorts?: string[];
}

export interface Armor {
  id: string;
  name: string;
  price: number;
  effectText: string;
  availableInPorts?: string[];
}

export interface Cargo {
  id: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  slots: number;
  riskTag: RiskTag;
  description?: string;
  requiredReputation?: number;
  availableInPorts?: string[];
}

export interface PlayerCargo extends Cargo {
  actualBuyPrice: number;
  sourcePortId: string;
  uid: string;
}

export interface Contract {
  id: string;
  name: string;
  requiredCargoName: string;
  requiredAmount: number;
  reward: number;
  penalty: number;
  description?: string;
  requiredReputation?: number;
  destinationPortId?: string;
  destinationPortName?: string;
}

export interface Route {
  id: string;
  name: string;
  totalNodes: number;
  riskMultiplier: number;
  tradeMultiplier: number;
  adventureMultiplier: number;
  hullLossPerNode: number;
  description: string;
}

export type EventOptionChoice = {
  id: string;
  label: string;
  requirements?: {
    gold?: number;
    cargo?: number;
    crewId?: string;
    ammoId?: string;
  };
  resolve: (player: PlayerState, voyage: VoyageState) => {
    player: PlayerState;
    voyage: VoyageState;
    message: string;
    combatEnemyId?: string;
  };
};

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  probability?: number;
  options: EventOptionChoice[];
}

export type EnemyType = 'pirate' | 'monster' | 'patrol';

export interface Enemy {
  id: string;
  name: string;
  maxHp: number;
  attack: number;
  rewardGold: number;
  rewardCargoChance?: number;
  type: EnemyType;
  description: string;
}

export interface Port {
  id: string;
  name: string;
  description: string;
  colorTheme: string; // e.g., '#2a2a35'
  priceMultipliers: Record<string, number>; // cargoId -> multiplier
}

export interface PlayerState {
  currentPortId: string;
  gold: number;
  reputation: number;
  bounty: number;
  sinkCount: number;
  voyageCount: number;
  successfulVoyageCount: number;
  unlockedShips: string[];
  discoveredEvents: string[];
  currentShip: Ship | null;
  currentHull: number;
  ownedCrew: Crew[];
  ownedAmmo: Record<string, number>; // ammoId -> count
  ownedArmor: Armor[];
  cargo: PlayerCargo[];
  activeContract: Contract | null;
  rescuedByGuild: boolean; // used for the 300 gold rescue
  debt: number;
  storyProgress: number; // Main quest chapter index. Final playable chapter is defined in progression.ts.
  storyBranch?: 'pirate' | 'governor';
  unlockedRoutes: string[];
  unlockedPorts: string[];
  marketMultiplier: number;
  casinoProfitThisPort: number;
}

export type VoyageMode = 'sailing' | 'returning' | 'arrived' | 'sunk' | 'combat';

export interface CombatState {
  enemyId: string;
  enemyHp: number;
  enemyMaxHp: number;
  enemyNextAttackReduced: boolean;
  playerRepairedThisCombat: boolean;
  log: string[];
}

export type SeaEntityType = 'storm' | 'reef' | 'cargo' | 'merchant' | 'pirate' | 'monster' | 'patrol' | 'island' | 'black_market' | 'siren';

export interface SeaEntity {
  id: string;
  type: SeaEntityType;
  x: number;
  y: number;
  radius: number;
  eventId: string;
  resolved: boolean;
}

export interface VoyageState {
  route: Route | null;
  destinationPortId: string;
  position: number; // Still used conceptually for overall progress
  totalNodes: number;
  mapWidth: number;
  mapHeight: number;
  destinationPosition?: { x: number; y: number };
  playerPosition: { x: number; y: number };
  distanceTraveled: number;
  entities: SeaEntity[];
  mode: VoyageMode;
  temporaryGold: number;
  lootCargo: PlayerCargo[];
  eventsResolved: number;
  enemiesDefeated: number;
  monstersDefeated: number;
  log: string[];
  combatState: CombatState | null;
  currentEvent: GameEvent | null;
}
