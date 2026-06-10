import { Ship, Crew, Armor, Route, Cargo, Enemy, Ammo, Contract, Port } from '../types';

export const PORTS: Port[] = [
  {
    id: 'port_royal',
    name: '皇家直辖港',
    description: '宏伟而森严的首都港口。这里对奢侈品需求极高，但对违禁品查处极其严格。',
    colorTheme: '#1a365d',
    priceMultipliers: {
      cargo_wood: 0.8,
      cargo_spice: 1.0,
      cargo_silk: 1.5,
      cargo_jewelry: 1.5,
      cargo_weapons: 0.5,
      cargo_contraband: 0.5,
    }
  },
  {
    id: 'port_tortuga',
    name: '龟岛黑市',
    description: '法外之地。危险但充满机遇，这里军火和违禁品能卖出天价，但没有人需要昂贵的奢侈品。',
    colorTheme: '#3f2b1a',
    priceMultipliers: {
      cargo_wood: 1.0,
      cargo_spice: 0.8,
      cargo_silk: 0.7,
      cargo_jewelry: 0.6,
      cargo_weapons: 1.8,
      cargo_contraband: 1.8,
    }
  },
  {
    id: 'port_oriental',
    name: '东方明珠港',
    description: '香料与丝绸的故乡。从这里进货香料和丝绸非常便宜，但木材却极其稀缺。',
    colorTheme: '#4a1c1c',
    priceMultipliers: {
      cargo_wood: 1.5,
      cargo_spice: 0.6,
      cargo_silk: 0.6,
      cargo_jewelry: 1.0,
      cargo_weapons: 1.0,
      cargo_contraband: 1.0,
    }
  }
];

export const SHIPS: Ship[] = [
  {
    id: 'ship_fishing',
    name: '小渔船',
    price: 300,
    maxHull: 80,
    cargoSlots: 4,
    cannonSlots: 1,
    speed: 4,
    repairCostPerHull: 2,
    description: '便宜灵活，适合新手试水。',
    availableInPorts: ['port_royal', 'port_tortuga', 'port_oriental']
  },
  {
    id: 'ship_merchant',
    name: '商船',
    price: 800,
    maxHull: 140,
    cargoSlots: 10,
    cannonSlots: 1,
    speed: 3,
    repairCostPerHull: 4,
    description: '舱位大，适合正经贸易。',
    availableInPorts: ['port_royal', 'port_oriental']
  },
  {
    id: 'ship_war',
    name: '战船',
    price: 1200,
    maxHull: 160,
    cargoSlots: 5,
    cannonSlots: 3,
    speed: 3,
    repairCostPerHull: 6,
    description: '火力强，适合打劫和猎怪。',
    availableInPorts: ['port_royal', 'port_tortuga']
  },
  {
    id: 'ship_heavy',
    name: '重甲船',
    price: 1800,
    maxHull: 240,
    cargoSlots: 8,
    cannonSlots: 2,
    speed: 2,
    repairCostPerHull: 8,
    description: '很耐打，但维修昂贵。',
    availableInPorts: ['port_royal']
  },
  {
    id: 'ship_junk',
    name: '东方大福船',
    price: 3000,
    maxHull: 180,
    cargoSlots: 15,
    cannonSlots: 0,
    speed: 4,
    repairCostPerHull: 5,
    description: '东方特有的多桅帆船。货舱极大且航速优异，但完全没有武装能力。',
    availableInPorts: ['port_oriental']
  },
  {
    id: 'ship_ultimate',
    name: '海神无畏号',
    price: 50000,
    maxHull: 999,
    cargoSlots: 20,
    cannonSlots: 5,
    speed: 5,
    repairCostPerHull: 20,
    description: '象征着四海之王的终极战舰，足以去深渊挑战传说中的海妖。',
    availableInPorts: ['port_tortuga']
  }
];

export const CREW_MEMBERS: Crew[] = [
  { id: 'crew_sailor', name: '水手', price: 100, effectText: '风暴、漩涡等自然事件伤害降低 20%', availableInPorts: ['port_royal', 'port_tortuga', 'port_oriental'] },
  { id: 'crew_gunner', name: '炮手', price: 150, effectText: '炮击伤害 +20%', availableInPorts: ['port_royal', 'port_tortuga'] },
  { id: 'crew_doctor', name: '医生', price: 180, effectText: '船员受伤或死亡概率降低', availableInPorts: ['port_royal', 'port_oriental'] },
  { id: 'crew_repairman', name: '修船匠', price: 220, effectText: '每通过一个海域事件后，若未沉船，恢复 3 点耐久', availableInPorts: ['port_royal', 'port_tortuga', 'port_oriental'] },
  { id: 'crew_navigator', name: '领航员', price: 250, effectText: '暗礁、迷雾、偏航事件损失降低', availableInPorts: ['port_royal', 'port_oriental'] },
  { id: 'crew_pirate_king', name: '海盗头子', price: 300, effectText: '登船战收益 +30%，但通缉值增加更快', availableInPorts: ['port_tortuga'] },
  { id: 'crew_merchant_agent', name: '商会代理人', price: 300, effectText: '贸易收入 +15%，但抢劫收益 -10%', availableInPorts: ['port_royal', 'port_oriental'] },
];

export const AMMO_TYPES: Ammo[] = [
  { id: 'ammo_normal', name: '普通炮弹', price: 10, damage: 15, effectText: '基础攻击', availableInPorts: ['port_royal', 'port_tortuga', 'port_oriental'] },
  { id: 'ammo_chain', name: '链弹', price: 20, damage: 10, effectText: '降低敌人速度，提高逃跑成功率', availableInPorts: ['port_royal', 'port_tortuga'] },
  { id: 'ammo_fire', name: '火弹', price: 35, damage: 20, effectText: '对海怪额外有效，造成燃烧伤害', availableInPorts: ['port_tortuga', 'port_oriental'] },
];

export const ARMORS: Armor[] = [
  { id: 'armor_wood', name: '木板加固', price: 100, effectText: '最大耐久 +20', availableInPorts: ['port_royal', 'port_tortuga', 'port_oriental'] },
  { id: 'armor_iron', name: '铁甲板', price: 250, effectText: '战斗受到的伤害 -15%，但速度 -1', availableInPorts: ['port_royal'] },
  { id: 'armor_waterproof', name: '防水舱', price: 300, effectText: '每次航行第一次受到致命伤害时，船只保留 1 点耐久', availableInPorts: ['port_tortuga', 'port_oriental'] },
  { id: 'armor_watchtower', name: '瞭望塔', price: 180, effectText: '显示下一个海域可能事件的提示', availableInPorts: ['port_royal', 'port_oriental'] },
];

export const CARGO_TYPES: Cargo[] = [
  { id: 'cargo_wood', name: '木材', buyPrice: 30, sellPrice: 45, slots: 1, riskTag: 'low', requiredReputation: 0, availableInPorts: ['port_royal'] },
  { id: 'cargo_spice', name: '香料', buyPrice: 80, sellPrice: 130, slots: 1, riskTag: 'medium', requiredReputation: 10, availableInPorts: ['port_oriental'] },
  { id: 'cargo_silk', name: '丝绸', buyPrice: 120, sellPrice: 210, slots: 1, riskTag: 'high', requiredReputation: 30, availableInPorts: ['port_oriental'] },
  { id: 'cargo_jewelry', name: '珠宝', buyPrice: 300, sellPrice: 600, slots: 1, riskTag: 'extreme', requiredReputation: 80, availableInPorts: ['port_oriental'] },
  { id: 'cargo_weapons', name: '军火', buyPrice: 200, sellPrice: 400, slots: 1, riskTag: 'illegal', description: '提高遇到巡逻队检查的风险', requiredReputation: 150, availableInPorts: ['port_royal', 'port_tortuga'] },
  { id: 'cargo_contraband', name: '违禁品', buyPrice: 150, sellPrice: 450, slots: 1, riskTag: 'illegal', description: '被巡逻队检查时会罚款或没收', requiredReputation: 200, availableInPorts: ['port_tortuga'] },
  { id: 'cargo_imperial_porcelain', name: '帝王瓷器', buyPrice: 900, sellPrice: 1200, slots: 1, riskTag: 'extreme', description: '远东贡窑秘藏，不会出现在普通交易所。', requiredReputation: 0, availableInPorts: [] },
  { id: 'cargo_dragon_pearl', name: '龙涎珍珠', buyPrice: 1200, sellPrice: 1600, slots: 1, riskTag: 'extreme', description: '传说只有深海巨蚌才会孕出的异宝。', requiredReputation: 0, availableInPorts: [] },
  { id: 'cargo_ancient_astrolabe', name: '古代星盘', buyPrice: 1800, sellPrice: 2600, slots: 1, riskTag: 'extreme', description: '失落王朝的航海遗物，收藏家愿意重金收购。', requiredReputation: 0, availableInPorts: [] },
];

export const CONTRACTS: Contract[] = [
  { id: 'contract_spice', name: '商会香料订单', requiredCargoName: '香料', requiredAmount: 3, reward: 450, penalty: 150, requiredReputation: 10 },
  { id: 'contract_silk', name: '贵族丝绸订单', requiredCargoName: '丝绸', requiredAmount: 3, reward: 750, penalty: 250, requiredReputation: 30 },
  { id: 'contract_jewelry', name: '珠宝密运', requiredCargoName: '珠宝', requiredAmount: 2, reward: 1200, penalty: 500, requiredReputation: 80 },
  { id: 'contract_contraband', name: '黑市违禁品', requiredCargoName: '违禁品', requiredAmount: 3, reward: 1100, penalty: 450, requiredReputation: 200 },
];

export const ROUTES: Route[] = [
  { id: 'route_coastal', name: '近海航线', totalNodes: 5, riskMultiplier: 0.8, tradeMultiplier: 1.0, adventureMultiplier: 1.0, hullLossPerNode: 3, description: '安全但收益低。' },
  { id: 'route_storm', name: '暴风航线', totalNodes: 7, riskMultiplier: 1.2, tradeMultiplier: 1.5, adventureMultiplier: 1.4, hullLossPerNode: 4, description: '风险和收益都适中。' },
  { id: 'route_black_tide', name: '黑潮航线', totalNodes: 9, riskMultiplier: 1.8, tradeMultiplier: 2.2, adventureMultiplier: 2.0, hullLossPerNode: 5, description: '高风险高收益。' },
  { id: 'route_legend', name: '传说航线', totalNodes: 12, riskMultiplier: 2.4, tradeMultiplier: 3.5, adventureMultiplier: 3.0, hullLossPerNode: 6, description: '极高风险，适合豪赌。' },
  { id: 'route_abyss', name: '深渊航线', totalNodes: 20, riskMultiplier: 5.0, tradeMultiplier: 10.0, adventureMultiplier: 10.0, hullLossPerNode: 15, description: '只有亡命之徒和真正的海神才敢踏足的死地。这里栖息着终极怪物。' },
];

export const ENEMIES: Enemy[] = [
  { id: 'enemy_pirate_1', name: '海盗船', maxHp: 60, attack: 12, rewardGold: 180, type: 'pirate', description: '一艘挂着黑旗的武装船只' },
  { id: 'enemy_pirate_2', name: '强盗快船', maxHp: 45, attack: 10, rewardGold: 140, type: 'pirate', description: '速度很快的小型海盗船' },
  { id: 'enemy_monster_1', name: '巨型章鱼', maxHp: 90, attack: 16, rewardGold: 300, type: 'monster', description: '潜伏在深海的恐怖巨兽' },
  { id: 'enemy_monster_2', name: '幽灵船', maxHp: 100, attack: 18, rewardGold: 360, type: 'monster', description: '传说中永远在海上漂泊的亡灵船' },
  { id: 'enemy_patrol_1', name: '海军巡防舰', maxHp: 120, attack: 20, rewardGold: 0, type: 'patrol', description: '代表王室维持治安的军舰，击沉会遭到通缉' },
  { id: 'enemy_debt_collector', name: '铁血讨债团', maxHp: 300, attack: 35, rewardGold: 0, type: 'patrol', description: '银行派来的冷血雇佣兵，欠债还钱天经地义！' },
  { id: 'enemy_leviathan', name: '海妖之母·利维坦', maxHp: 1500, attack: 80, rewardGold: 100000, type: 'monster', description: '【最终BOSS】海洋的真正霸主，深渊航线的主宰！' }
];
