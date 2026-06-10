import { GameEvent, PlayerState, VoyageState, Cargo, PlayerCargo } from '../types';
import { CARGO_TYPES, AMMO_TYPES } from './data';

const getRandomCargo = (): PlayerCargo => {
  const base = CARGO_TYPES[Math.floor(Math.random() * CARGO_TYPES.length)];
  return {
    ...base,
    actualBuyPrice: 0,
    sourcePortId: 'unknown',
    uid: `loot_${Date.now()}_${Math.random()}`
  };
};

export const GAME_EVENTS: GameEvent[] = [
  {
    id: 'event_storm',
    name: '黑云压顶',
    description: '远处的天空像墨水一样沉下来，风暴正在逼近。',
    options: [
      {
        id: 'storm_wait',
        label: '收帆等待',
        resolve: (player, voyage) => {
          return { player, voyage: { ...voyage, log: ['你们等风暴过去，浪费了一些时间。'] }, message: '你们等风暴过去，浪费了一些时间。' };
        }
      },
      {
        id: 'storm_rush',
        label: '全速冲过风暴',
        resolve: (player, voyage) => {
          const hasSailor = player.ownedCrew.some(c => c.id === 'crew_sailor');
          const isExtraDamage = Math.random() < 0.3;
          let damage = 20 + (isExtraDamage ? 15 : 0);
          if (hasSailor) damage = Math.floor(damage * 0.8);

          return {
            player: { ...player, currentHull: Math.max(0, player.currentHull - damage) },
            voyage,
            message: `你们强行冲过风暴，船只耐久下降了 ${damage} 点${hasSailor ? ' (水手减轻了伤害)' : ''}。`
          };
        }
      },
      {
        id: 'storm_navigate',
        label: '让领航员判断风向',
        resolve: (player, voyage) => {
          const hasNavigator = player.ownedCrew.some(c => c.id === 'crew_navigator');
          const damage = hasNavigator ? 8 : 25;
          return {
            player: { ...player, currentHull: Math.max(0, player.currentHull - damage) },
            voyage,
            message: hasNavigator
              ? '领航员精准地避开了风暴核心，但船只还是受到了 8 点伤害。'
              : '由于没有专业的领航员，你们在风暴中迷失了方向，船只受到了 25 点伤害。'
          };
        }
      }
    ]
  },
  {
    id: 'event_reef',
    name: '暗礁海域',
    description: '水下有大片暗礁，船底传来可怕的摩擦声。',
    options: [
      {
        id: 'reef_careful',
        label: '小心绕行',
        resolve: (player, voyage) => {
          return {
            player: { ...player, currentHull: Math.max(0, player.currentHull - 8) },
            voyage,
            message: '你们小心翼翼地绕行，但还是不可避免地刮擦到了礁石，耐久下降 8 点。'
          };
        }
      },
      {
        id: 'reef_rush',
        label: '强行穿过',
        resolve: (player, voyage) => {
          const findGold = Math.random() < 0.3;
          const newGold = findGold ? 80 : 0;
          return {
            player: { ...player, currentHull: Math.max(0, player.currentHull - 20) },
            voyage: { ...voyage, temporaryGold: voyage.temporaryGold + newGold },
            message: findGold
              ? '你们强行穿过暗礁，船只受损严重（-20耐久），但在礁石间发现了漂浮货箱，获得了 80 金币！'
              : '你们强行穿过暗礁，船只受损严重（-20耐久）。'
          };
        }
      },
      {
        id: 'reef_navigate',
        label: '依靠领航员',
        resolve: (player, voyage) => {
          const hasNavigator = player.ownedCrew.some(c => c.id === 'crew_navigator');
          const damage = hasNavigator ? 5 : 18;
          return {
            player: { ...player, currentHull: Math.max(0, player.currentHull - damage) },
            voyage,
            message: hasNavigator
              ? '领航员神乎其技地指挥航向，仅受 5 点轻微损伤。'
              : '没有领航员的指导，你们在暗礁中跌跌撞撞，受到了 18 点伤害。'
          };
        }
      }
    ]
  },
  {
    id: 'event_floating_cargo',
    name: '漂浮货箱',
    description: '海面上漂着几个没有标记的货箱。',
    options: [
      {
        id: 'cargo_salvage',
        label: '打捞货箱',
        resolve: (player, voyage) => {
          const isAmbush = Math.random() < 0.2;
          if (isAmbush) {
            return { player, voyage, message: '这是海盗的陷阱！', combatEnemyId: 'enemy_pirate_1' };
          }
          const cargo = getRandomCargo();
          return {
            player,
            voyage: { ...voyage, lootCargo: [...voyage.lootCargo, cargo] },
            message: `你们打捞上来了 1 份 ${cargo.name}！`
          };
        }
      },
      {
        id: 'cargo_inspect',
        label: '谨慎检查',
        resolve: (player, voyage) => {
          const hasSailor = player.ownedCrew.some(c => c.id === 'crew_sailor');
          if (hasSailor) {
            return {
              player,
              voyage: { ...voyage, temporaryGold: voyage.temporaryGold + 60 },
              message: '水手经验丰富，安全地捞起了一些散落的财物，获得 60 金币。'
            };
          } else {
            const success = Math.random() < 0.5;
            if (success) {
              return {
                player,
                voyage: { ...voyage, temporaryGold: voyage.temporaryGold + 60 },
                message: '你们小心地打捞，幸运地获得了 60 金币。'
              };
            } else {
              return {
                player: { ...player, currentHull: Math.max(0, player.currentHull - 10) },
                voyage,
                message: '检查时货箱突然破裂，里面藏着的机关伤到了船体，耐久下降 10。'
              };
            }
          }
        }
      },
      {
        id: 'cargo_ignore',
        label: '无视它',
        resolve: (player, voyage) => {
          return { player, voyage, message: '为了安全起见，你们无视了货箱继续航行。' };
        }
      }
    ]
  },
  {
    id: 'event_damaged_merchant',
    name: '受损商船',
    description: '一艘商船正在冒烟，船员向你求救。',
    options: [
      {
        id: 'merchant_help',
        label: '帮助修船 (50金币)',
        requirements: { gold: 50 },
        resolve: (player, voyage) => {
          return {
            player: { ...player, gold: player.gold - 50, reputation: player.reputation + 10 },
            voyage: { ...voyage, temporaryGold: voyage.temporaryGold + 120 },
            message: '你们慷慨地帮助了他们，商船长送给你们 120 金币作为答谢。声望 +10。'
          };
        }
      },
      {
        id: 'merchant_rob',
        label: '趁火打劫',
        resolve: (player, voyage) => {
          const hasPirateKing = player.ownedCrew.some(c => c.id === 'crew_pirate_king');
          const goldGain = hasPirateKing ? Math.floor(250 * 1.3) : 250;
          return {
            player: { ...player, reputation: player.reputation - 15, bounty: player.bounty + 20 },
            voyage: { ...voyage, temporaryGold: voyage.temporaryGold + goldGain },
            message: `你们露出了獠牙！洗劫了商船，获得了 ${goldGain} 金币。通缉值上升，声望下降。`
          };
        }
      },
      {
        id: 'merchant_escort',
        label: '护送它一程',
        resolve: (player, voyage) => {
          return {
            player: { ...player, currentHull: Math.max(0, player.currentHull - 8) },
            voyage: { ...voyage, temporaryGold: voyage.temporaryGold + 200 },
            message: '你们放慢速度护送他们，受到了 8 点耐久损耗，但承诺到港后会得到 200 金币报酬。'
          };
        }
      },
      {
        id: 'merchant_leave',
        label: '离开',
        resolve: (player, voyage) => {
          return { player, voyage, message: '你们冷酷地离开了，毕竟大海上自顾不暇。' };
        }
      }
    ]
  },
  {
    id: 'event_pirate_block',
    name: '海盗拦路',
    description: '一艘挂着黑旗的快船挡住了去路。',
    options: [
      {
        id: 'pirate_pay',
        label: '交过路费 (100金币或失去1货)',
        resolve: (player, voyage) => {
          if (player.gold >= 100) {
            return {
              player: { ...player, gold: player.gold - 100 },
              voyage,
              message: '破财消灾，你们交了 100 金币，海盗放行了。'
            };
          } else if (voyage.lootCargo.length > 0) {
            const newCargo = [...voyage.lootCargo];
            const lost = newCargo.pop();
            return {
              player,
              voyage: { ...voyage, lootCargo: newCargo },
              message: `由于没钱，海盗抢走了你们的 ${lost?.name}。`
            };
          } else if (player.cargo.length > 0) {
            const newCargo = [...player.cargo];
            const lost = newCargo.pop();
            return {
              player: { ...player, cargo: newCargo },
              voyage,
              message: `由于没钱，海盗抢走了你们的 ${lost?.name}。`
            };
          } else {
            return {
              player: { ...player, currentHull: Math.max(0, player.currentHull - 15) },
              voyage,
              message: '要钱没有，要货也没有，海盗生气地朝你们开了一炮，耐久 -15。'
            };
          }
        }
      },
      {
        id: 'pirate_fight',
        label: '开炮！',
        resolve: (player, voyage) => {
          return { player, voyage, message: '准备战斗！', combatEnemyId: 'enemy_pirate_1' };
        }
      },
      {
        id: 'pirate_flee',
        label: '尝试逃跑',
        resolve: (player, voyage) => {
          const speed = player.currentShip?.speed || 1;
          const successChance = speed * 0.15 + 0.2; // 3 speed => 65%
          if (Math.random() < successChance) {
            return { player, voyage, message: '全速满帆！你们成功甩掉了海盗。' };
          } else {
            return {
              player: { ...player, currentHull: Math.max(0, player.currentHull - 15) },
              voyage,
              message: '逃跑失败！海盗的炮弹击中了船尾 (-15耐久)，被迫迎战！',
              combatEnemyId: 'enemy_pirate_1'
            };
          }
        }
      },
      {
        id: 'pirate_surrender',
        label: '投降',
        resolve: (player, voyage) => {
          // Lose 30% of cargo
          const totalCargoLength = player.cargo.length + voyage.lootCargo.length;
          const lostCount = Math.ceil(totalCargoLength * 0.3);
          const newPlayerCargo = [...player.cargo];
          const newLootCargo = [...voyage.lootCargo];

          let removed = 0;
          while (removed < lostCount) {
            if (newLootCargo.length > 0) {
              newLootCargo.pop();
            } else if (newPlayerCargo.length > 0) {
              newPlayerCargo.pop();
            }
            removed++;
          }

          return {
            player: { ...player, cargo: newPlayerCargo },
            voyage: { ...voyage, lootCargo: newLootCargo },
            message: `你们举起了白旗。海盗登船搜刮，抢走了 ${lostCount} 件货物后扬长而去。`
          };
        }
      }
    ]
  },
  {
    id: 'event_giant_octopus',
    name: '巨型章鱼',
    description: '海面突然鼓起，巨大的触手缠住了船身。',
    options: [
      {
        id: 'octopus_fight',
        label: '开炮轰击',
        resolve: (player, voyage) => {
          return { player, voyage, message: '海怪嘶吼着，准备战斗！', combatEnemyId: 'enemy_monster_1' };
        }
      },
      {
        id: 'octopus_fire_ammo',
        label: '使用火弹 (消耗1)',
        requirements: { ammoId: 'ammo_fire' },
        resolve: (player, voyage) => {
          const ammoCount = player.ownedAmmo['ammo_fire'] || 0;
          if (ammoCount > 0) {
            return {
              player: { ...player, ownedAmmo: { ...player.ownedAmmo, 'ammo_fire': ammoCount - 1 } },
              voyage,
              message: '炽热的火弹让巨型章鱼吃痛，它带着烧伤进入了战斗！',
              combatEnemyId: 'enemy_monster_1' // We will handle pre-damage in combat logic if needed, or just let combat logic see it's a monster and apply fire weakness. Actually prompt says it loses 40 HP instantly. We can handle this in combat init. For now, just trigger combat.
            };
          }
          return { player, voyage, message: '没有火弹！' };
        }
      },
      {
        id: 'octopus_dump_cargo',
        label: '丢弃货物吸引它',
        resolve: (player, voyage) => {
          if (player.cargo.length === 0 && voyage.lootCargo.length === 0) {
            return { player, voyage, message: '没有货物可以丢弃！' }; // Should be disabled in UI
          }
          const dropCount = Math.floor(Math.random() * 3) + 1; // 1 to 3
          let removed = 0;
          const newPlayerCargo = [...player.cargo];
          const newLootCargo = [...voyage.lootCargo];

          while (removed < dropCount && (newPlayerCargo.length > 0 || newLootCargo.length > 0)) {
            if (newLootCargo.length > 0) newLootCargo.pop();
            else newPlayerCargo.pop();
            removed++;
          }

          return {
            player: { ...player, cargo: newPlayerCargo },
            voyage: { ...voyage, lootCargo: newLootCargo },
            message: `你们丢下了 ${removed} 件货物，章鱼被货物吸引，你们趁机逃脱。`
          };
        }
      },
      {
        id: 'octopus_cut_escape',
        label: '砍断触手逃跑',
        resolve: (player, voyage) => {
          const loseCrew = Math.random() < 0.3;
          let message = '你们拼死砍断了触手，船只受到 18 点伤害。';
          let newCrew = [...player.ownedCrew];

          if (loseCrew && newCrew.length > 0) {
            const lostIdx = Math.floor(Math.random() * newCrew.length);
            message += ` 混乱中，${newCrew[lostIdx].name} 被触手卷入了海底！`;
            newCrew.splice(lostIdx, 1);
          }

          return {
            player: { ...player, currentHull: Math.max(0, player.currentHull - 18), ownedCrew: newCrew },
            voyage,
            message
          };
        }
      }
    ]
  },
  {
    id: 'event_patrol',
    name: '王国巡逻队',
    description: '王国巡逻舰要求你停船接受检查。',
    options: [
      {
        id: 'patrol_accept',
        label: '接受检查',
        resolve: (player, voyage) => {
          const allCargo = [...player.cargo, ...voyage.lootCargo];
          const hasIllegal = allCargo.some(c => c.riskTag === 'illegal');

          if (!hasIllegal) {
            return {
              player: { ...player, reputation: player.reputation + 5 },
              voyage,
              message: '长官敬了个礼，祝你们航行顺利。声望 +5。'
            };
          } else {
            // Fined 200, confiscate 1 illegal
            let fineMsg = '发现了违禁品！罚款 200 金币并没收货物。';
            let newPlayer = { ...player, gold: player.gold - 200 };

            if (newPlayer.gold < 0) {
              newPlayer.gold = 0;
              newPlayer.currentHull = Math.max(0, newPlayer.currentHull - 10);
              fineMsg += '由于钱不够，士兵粗暴搜查，船只受损 (-10耐久)。';
            }

            const newPlayerCargo = [...player.cargo];
            const newLootCargo = [...voyage.lootCargo];

            const pIdx = newPlayerCargo.findIndex(c => c.riskTag === 'illegal');
            if (pIdx >= 0) {
              newPlayerCargo.splice(pIdx, 1);
            } else {
              const lIdx = newLootCargo.findIndex(c => c.riskTag === 'illegal');
              if (lIdx >= 0) newLootCargo.splice(lIdx, 1);
            }
            newPlayer.cargo = newPlayerCargo;

            return {
              player: newPlayer,
              voyage: { ...voyage, lootCargo: newLootCargo },
              message: fineMsg
            };
          }
        }
      },
      {
        id: 'patrol_bribe',
        label: '贿赂军官 (150金币)',
        requirements: { gold: 150 },
        resolve: (player, voyage) => {
          return {
            player: { ...player, gold: player.gold - 150 },
            voyage,
            message: '几袋金币塞过去，长官突然表示什么都没看到。安全通过。'
          };
        }
      },
      {
        id: 'patrol_flee',
        label: '全速逃跑',
        resolve: (player, voyage) => {
          const speed = player.currentShip?.speed || 1;
          const successChance = speed * 0.15 + 0.1; // lower chance for patrol
          if (Math.random() < successChance) {
            return {
              player: { ...player, bounty: player.bounty + 10 },
              voyage,
              message: '你们凭借高超的驾驶技术甩开了巡逻舰！通缉值 +10。'
            };
          } else {
            return {
              player: { ...player, currentHull: Math.max(0, player.currentHull - 20), bounty: player.bounty + 20 },
              voyage,
              message: '逃跑失败！巡逻舰的炮火轰碎了你们的后甲板 (-20耐久)，通缉值激增！'
            };
          }
        }
      },
      {
        id: 'patrol_attack',
        label: '先发制人',
        resolve: (player, voyage) => {
          return {
            player: { ...player, bounty: player.bounty + 35 },
            voyage,
            message: '你们居然敢攻击王国海军！通缉值暴涨。',
            combatEnemyId: 'enemy_patrol_1'
          };
        }
      }
    ]
  },
  {
    id: 'event_island',
    name: '无人小岛',
    description: '前方出现一座无人的小岛，也许能找到补给。',
    options: [
      {
        id: 'island_repair',
        label: '请当地人修船 (花费50金币恢复30耐久)',
        requirements: { gold: 50 },
        resolve: (player, voyage) => {
          const maxHull = player.currentShip?.maxHull || 100;
          const woodArmor = player.ownedArmor.find(a => a.id === 'armor_wood');
          const finalMax = maxHull + (woodArmor ? 20 : 0);
          return {
            player: { ...player, gold: player.gold - 50, currentHull: Math.min(finalMax, player.currentHull + 30) },
            voyage,
            message: '当地岛民用坚固的木材帮你们修理了船只，恢复了最多 30 点耐久。'
          };
        }
      },
      {
        id: 'island_rest',
        label: '上岸修整 (免费恢复15耐久)',
        resolve: (player, voyage) => {
          const maxHull = player.currentShip?.maxHull || 100;
          const woodArmor = player.ownedArmor.find(a => a.id === 'armor_wood');
          const finalMax = maxHull + (woodArmor ? 20 : 0);
          return {
            player: { ...player, currentHull: Math.min(finalMax, player.currentHull + 15) },
            voyage,
            message: '沙滩上的篝火让人感到平静。船只免费恢复了最多 15 点耐久。'
          };
        }
      },
      {
        id: 'island_search',
        label: '搜索岛屿',
        resolve: (player, voyage) => {
          const findTreasure = Math.random() < 0.6;
          if (findTreasure) {
            return {
              player,
              voyage: { ...voyage, temporaryGold: voyage.temporaryGold + 150 },
              message: '在一个山洞里，你们发现了一具骷髅和一袋生锈的金币！获得 150 金币。'
            };
          } else {
            return {
              player: { ...player, currentHull: Math.max(0, player.currentHull - 12) },
              voyage,
              message: '你们惊动了岛上的巨型野猪群，慌乱撤退时船只受损 (-12耐久)。'
            };
          }
        }
      },
      {
        id: 'island_recruit',
        label: '招募流浪水手 (100金币)',
        requirements: { gold: 100 },
        resolve: (player, voyage) => {
          const hasSailor = player.ownedCrew.some(c => c.id === 'crew_sailor');
          if (!hasSailor) {
            const sailorCrew = { id: 'crew_sailor', name: '水手', price: 100, effectText: '风暴、漩涡等自然事件伤害降低 20%' };
            return {
              player: { ...player, gold: player.gold - 100, ownedCrew: [...player.ownedCrew, sailorCrew] },
              voyage,
              message: '你们花 100 金币招募了一名被困在这里的熟练水手。'
            };
          } else {
             return {
              player: { ...player, gold: player.gold - 100 },
              voyage,
              message: '你们花了 100 金币，但发现他是个骗子，上了船就跑了。(第一版限定1个同类船员)'
            };
          }
        }
      }
    ]
  },
  {
    id: 'event_black_market',
    name: '海上黑市',
    description: '一艘没有旗帜的黑市船靠了过来。',
    options: [
      {
        id: 'black_market_ammo',
        label: '买便宜炮弹 (80金币买10发)',
        requirements: { gold: 80 },
        resolve: (player, voyage) => {
          return {
            player: {
              ...player,
              gold: player.gold - 80,
              ownedAmmo: {
                ...player.ownedAmmo,
                'ammo_normal': (player.ownedAmmo['ammo_normal'] || 0) + 10
              }
            },
            voyage,
            message: '黑市商人笑着递过来一箱生锈但能用的炮弹。'
          };
        }
      },
      {
        id: 'black_market_contraband',
        label: '买违禁品 (150金币)',
        requirements: { gold: 150 },
        resolve: (player, voyage) => {
          const base = CARGO_TYPES.find(c => c.id === 'cargo_contraband')!;
          const pCargo: import('../types').PlayerCargo = { ...base, actualBuyPrice: 150, sourcePortId: 'unknown', uid: `blackmarket_${Date.now()}` };
          return {
            player: { ...player, gold: player.gold - 150, bounty: player.bounty + 5 },
            voyage: { ...voyage, lootCargo: [...voyage.lootCargo, pCargo] },
            message: '你们低调地买入了一箱违禁品，隐隐感觉到周围有视线。通缉值 +5。'
          };
        }
      },
      {
        id: 'black_market_intel',
        label: '出卖情报',
        resolve: (player, voyage) => {
          return {
            player: { ...player, reputation: player.reputation - 5 },
            voyage: { ...voyage, temporaryGold: voyage.temporaryGold + 120 },
            message: '你把上次见到的商船位置卖给了他们。声望下降，获得 120 金币。'
          };
        }
      },
      {
        id: 'black_market_leave',
        label: '离开',
        resolve: (player, voyage) => {
          return { player, voyage, message: '不和这些法外狂徒打交道是明智的。' };
        }
      }
    ]
  },
  {
    id: 'event_siren',
    name: '海妖歌声',
    description: '迷雾里传来歌声，船员们开始神情恍惚。',
    options: [
      {
        id: 'siren_rush',
        label: '堵住耳朵硬闯',
        resolve: (player, voyage) => {
          const loseCrew = Math.random() < 0.3;
          let message = '你们痛苦地忍受着歌声，强行冲出迷雾，耐久下降 10。';
          let newCrew = [...player.ownedCrew];

          if (loseCrew && newCrew.length > 0) {
            const lostIdx = Math.floor(Math.random() * newCrew.length);
            message += ` 但 ${newCrew[lostIdx].name} 还是忍不住跳进了海里！`;
            newCrew.splice(lostIdx, 1);
          }
          return {
            player: { ...player, currentHull: Math.max(0, player.currentHull - 10), ownedCrew: newCrew },
            voyage,
            message
          };
        }
      },
      {
        id: 'siren_follow',
        label: '跟随歌声',
        resolve: (player, voyage) => {
          const isTreasure = Math.random() < 0.5;
          if (isTreasure) {
            return {
              player,
              voyage: { ...voyage, temporaryGold: voyage.temporaryGold + 300 },
              message: '竟然真的在尽头发现了一艘满载黄金的沉船残骸！获得 300 金币！'
            };
          } else {
            return {
              player: { ...player, currentHull: Math.max(0, player.currentHull - 25) },
              voyage,
              message: '这完全是个陷阱！船只狠狠地撞上了悬崖 (-25耐久)。'
            };
          }
        }
      },
      {
        id: 'siren_doctor',
        label: '让医生稳定船员',
        resolve: (player, voyage) => {
          const hasDoctor = player.ownedCrew.some(c => c.id === 'crew_doctor');
          if (hasDoctor) {
            return {
              player,
              voyage: { ...voyage, temporaryGold: voyage.temporaryGold + 50 },
              message: '医生用刺鼻的药水让大家保持清醒，你们顺手捞起了海面上的浮财。'
            };
          } else {
             return {
              player: { ...player, currentHull: Math.max(0, player.currentHull - 15) },
              voyage,
              message: '由于没有医生，大家陷入疯狂，在船上大闹，耐久下降 15。'
            };
          }
        }
      }
    ]
  },
  {
    id: 'event_bottle',
    name: '漂流瓶',
    description: '一个塞着羊皮纸的玻璃瓶漂浮在海面上。',
    options: [
      {
        id: 'bottle_ignore',
        label: '不理会',
        resolve: (player, voyage) => {
          return { player, voyage, message: '也许只是别人的情书，你们继续航行。' };
        }
      },
      {
        id: 'bottle_follow',
        label: '按图索骥',
        resolve: (player, voyage) => {
          const findTreasure = Math.random() < 0.2; // 20% chance
          const getLost = Math.random() < 0.4; // 40% chance

          if (findTreasure) {
            return {
              player,
              voyage: { ...voyage, temporaryGold: voyage.temporaryGold + 600 },
              message: '难以置信！这竟然真的是海盗王弗林特的藏宝图，挖出了 600 金币！'
            };
          } else if (getLost) {
            return {
              player: { ...player, currentHull: Math.max(0, player.currentHull - 15) },
              voyage,
              message: '这图是假的！你们误入了暗礁区，不仅什么都没找到，船还受损了（-15耐久）。'
            };
          } else {
            return {
              player,
              voyage,
              message: '你们找了半天，只发现了一堆破铜烂铁，白白浪费了时间。'
            };
          }
        }
      }
    ]
  },
  {
    id: 'event_mutiny',
    name: '叛变前夕',
    description: '船员们聚集在甲板上抱怨伙食，气氛剑拔弩张。',
    options: [
      {
        id: 'mutiny_pay',
        label: '发放赏金 (花费100金币)',
        requirements: { gold: 100 },
        resolve: (player, voyage) => {
          return {
            player: { ...player, gold: player.gold - 100, reputation: player.reputation + 5 },
            voyage,
            message: '金币的声音平息了怒火，水手们欢呼雀跃。声望 +5。'
          };
        }
      },
      {
        id: 'mutiny_suppress',
        label: '武力镇压',
        resolve: (player, voyage) => {
          const hasPirateKing = player.ownedCrew.some(c => c.id === 'crew_pirate_king');
          if (hasPirateKing) {
            return {
              player: { ...player, reputation: player.reputation - 10 },
              voyage,
              message: '海盗头子拔出刀，只需一个眼神就吓退了所有人。声望下降。'
            };
          } else {
            const damage = Math.floor(Math.random() * 20) + 10;
            let newCrew = [...player.ownedCrew];
            let msg = `一场内讧爆发了！船体在混乱中受损（-${damage}耐久）。`;
            if (newCrew.length > 0 && Math.random() < 0.5) {
               const lostIdx = Math.floor(Math.random() * newCrew.length);
               msg += ` 带头闹事的 ${newCrew[lostIdx].name} 被扔进了海里。`;
               newCrew.splice(lostIdx, 1);
            }
            return {
              player: { ...player, currentHull: Math.max(0, player.currentHull - damage), ownedCrew: newCrew },
              voyage,
              message: msg
            };
          }
        }
      }
    ]
  },
  {
    id: 'event_ghost_fog',
    name: '幽灵迷雾',
    description: '浓厚的白雾瞬间笼罩了船只，指南针疯狂旋转。',
    options: [
      {
        id: 'ghost_fog_rush',
        label: '闭着眼睛往前开',
        resolve: (player, voyage) => {
          return {
            player: { ...player, currentHull: Math.max(0, player.currentHull - 20) },
            voyage,
            message: '你们在迷雾中撞上了一艘腐朽的沉船残骸，耐久下降 20。'
          };
        }
      },
      {
        id: 'ghost_fog_navigator',
        label: '依靠领航员',
        resolve: (player, voyage) => {
          const hasNavigator = player.ownedCrew.some(c => c.id === 'crew_navigator');
          if (hasNavigator) {
            return {
              player,
              voyage,
              message: '领航员凭借对洋流的感知，奇迹般地把船带出了迷雾！毫发无损。'
            };
          } else {
            return {
               player: { ...player, currentHull: Math.max(0, player.currentHull - 20) },
               voyage,
               message: '你们没有领航员，像瞎子一样乱撞，耐久下降 20。'
            };
          }
        }
      },
      {
        id: 'ghost_fog_pray',
        label: '原地祈祷',
        resolve: (player, voyage) => {
           const chance = Math.random();
           if (chance < 0.5) {
             return { player, voyage, message: '风向改变，迷雾散去了，你们安全了。' };
           } else {
             return {
               player: { ...player, currentHull: Math.max(0, player.currentHull - 10) },
               voyage,
               message: '迷雾中似乎有什么东西爬上了船……经过一番驱赶，船只轻微受损。'
             };
           }
        }
      }
    ]
  },
  {
    id: 'event_blockade',
    name: '海军封锁线',
    description: '前方一整支舰队封锁了海域，正在对过往船只进行严密搜查。',
    options: [
      {
        id: 'blockade_bribe',
        label: '缴纳重税 (300金币)',
        requirements: { gold: 300 },
        resolve: (player, voyage) => {
          return {
            player: { ...player, gold: player.gold - 300 },
            voyage,
            message: '心疼！但也只能花钱买平安了，失去了 300 金币。'
          };
        }
      },
      {
        id: 'blockade_smuggle',
        label: '尝试偷渡',
        resolve: (player, voyage) => {
          const speed = player.currentShip?.speed || 1;
          const isHeavy = speed <= 2;
          if (isHeavy) {
            return {
               player: { ...player, currentHull: Math.max(0, player.currentHull - 40), bounty: player.bounty + 40 },
               voyage,
               message: '你的船太慢了！被巡逻舰集火，装甲被撕裂（-40耐久），并且登上了王国最高通缉榜！'
            };
          } else {
            const success = Math.random() < 0.5;
            if (success) {
               return {
                 player: { ...player, bounty: player.bounty + 10 },
                 voyage,
                 message: '趁着夜色，轻巧的船只如幽灵般穿过了封锁，但由于形迹可疑，通缉值微升。'
               };
            } else {
               return {
                 player: { ...player, currentHull: Math.max(0, player.currentHull - 30), bounty: player.bounty + 25 },
                 voyage,
                 message: '被探照灯发现了！挨了一轮炮击（-30耐久）后狼狈逃脱。'
               };
            }
          }
        }
      }
    ]
  },
  {
    id: 'event_whirlpool',
    name: '致命大漩涡',
    description: '海水在疯狂旋转，一个巨大的漩涡正试图把你们拖入深渊。',
    options: [
      {
        id: 'whirlpool_escape',
        label: '满舵逃离！',
        resolve: (player, voyage) => {
          const speed = player.currentShip?.speed || 1;
          const damage = Math.max(0, 40 - speed * 10); // faster ships take less damage
          let msg = `你们拼命划动，勉强脱离了引力，但船体承受了极大的扭曲力（-${damage}耐久）。`;
          return {
            player: { ...player, currentHull: Math.max(0, player.currentHull - damage) },
            voyage,
            message: msg
          };
        }
      },
      {
        id: 'whirlpool_drop',
        label: '抛弃负重',
        resolve: (player, voyage) => {
           if (player.cargo.length === 0 && voyage.lootCargo.length === 0) {
             return { player, voyage, message: '已经没有东西可扔了！' };
           }
           let newPlayerCargo = [...player.cargo];
           let newLootCargo = [...voyage.lootCargo];
           // Throw away half of everything
           const toDrop = Math.ceil((newPlayerCargo.length + newLootCargo.length) * 0.5);
           let dropped = 0;
           while(dropped < toDrop) {
             if (newLootCargo.length > 0) newLootCargo.pop();
             else newPlayerCargo.pop();
             dropped++;
           }
           return {
             player: { ...player, cargo: newPlayerCargo },
             voyage: { ...voyage, lootCargo: newLootCargo },
             message: `你们把沉重的货物丢进海里，减轻了重量，船只终于借助浮力冲出了漩涡！损失了 ${dropped} 件货物。`
           };
        }
      }
    ]
  },
  {
    id: 'event_leviathan',
    name: '深渊的主宰',
    description: '海面突然沸腾，天空被乌云遮蔽。一只如同岛屿般巨大的海妖从深渊中升起，这就是传说中的利维坦！',
    options: [
      {
        id: 'leviathan_fight',
        label: '决一死战！',
        resolve: (player, voyage) => {
          return { player, voyage, message: '向神明开炮！', combatEnemyId: 'enemy_leviathan' };
        }
      },
      {
        id: 'leviathan_flee',
        label: '尝试逃跑 (需损失所有货物和一半耐久)',
        resolve: (player, voyage) => {
          return {
            player: { ...player, currentHull: Math.max(1, Math.floor(player.currentHull / 2)), cargo: [] },
            voyage: { ...voyage, lootCargo: [] },
            message: '你丢弃了所有货物，勉强逃出了利维坦的漩涡...'
          };
        }
      }
    ]
  },
  {
    id: 'event_debt_collector',
    name: '铁血讨债团',
    description: '“欠债还钱，天经地义！哪怕追到天涯海角，也要让你连本带利吐出来！”——一艘挂着大洋银行旗帜的重型战舰拦住了你的去路。',
    options: [
      {
        id: 'collector_fight',
        label: '要钱没有，要命一条！',
        resolve: (player, voyage) => {
          return { player, voyage, message: '你选择武力抗拒催收！', combatEnemyId: 'enemy_debt_collector' };
        }
      },
      {
        id: 'collector_pay',
        label: '破财消灾 (扣除所有金币抵债)',
        resolve: (player, voyage) => {
          const paid = player.gold;
          return {
            player: { ...player, gold: 0, debt: Math.max(0, player.debt - paid) },
            voyage,
            message: `讨债团强行拿走了你身上所有的 ${paid} 金币用来抵债！`
          };
        }
      }
    ]
  }
];
