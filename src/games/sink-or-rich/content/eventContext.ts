import { GameEvent, PlayerState, VoyageState } from '../types';
import { PORTS, ROUTES } from './data';
import { FINALE_STORY_PROGRESS } from './progression';

type EventScene = {
  descriptions: string[];
};

const EVENT_SCENES: Record<string, EventScene> = {
  event_storm: {
    descriptions: [
      '云墙从海平线压过来，雨线像一排黑色桅杆，正沿着航道合拢。',
      '远处雷光一闪，潮湿的风把帆布拍得啪啪作响，水手们开始收紧绳索。'
    ]
  },
  event_reef: {
    descriptions: [
      '浪花突然变浅，船底下露出一道道灰白暗影，像牙齿一样等着咬住龙骨。',
      '瞭望手喊出了礁石方位，海水在前方碎成一片白沫。'
    ]
  },
  event_floating_cargo: {
    descriptions: [
      '几个木箱被海水推到航线上，箱角还挂着不同商会的残破封蜡。',
      '漂浮货箱在浪尖上碰撞，里面传出沉闷的响声，不知道是货物还是陷阱。'
    ]
  },
  event_shipwreck: {
    descriptions: [
      '半截船身斜插在浪里，破帆像湿透的旗帜一样贴在桅杆上。',
      '一片沉船残骸挡在前方，海鸟绕着木板盘旋，像是在等最后的拾荒者。'
    ]
  },
  event_trade_winds: {
    descriptions: [
      '海面忽然出现整齐白浪，风从船尾推来，像有人替你们展开了一条无形航道。',
      '帆面鼓起，顺风带贴着海面延伸，远处的泡沫线一路指向更快的水道。'
    ]
  },
  event_glowing_coral: {
    descriptions: [
      '水下珊瑚泛着蓝粉色微光，像一座沉在海底的药铺。',
      '夜色里，珊瑚礁一明一暗，照出几条可以穿行也可能搁浅的浅水沟。'
    ]
  },
  event_lost_fishermen: {
    descriptions: [
      '一条小渔船在浪里打转，船上的人拼命挥布，声音被风撕得断断续续。',
      '迷失的渔民把破桨举过头顶，船舱里还有孩子的哭声。'
    ]
  },
  event_navy_flotsam: {
    descriptions: [
      '几只印着海军徽记的木箱撞上船舷，封条被海水泡得发白。',
      '军需漂箱顺着暗流漂来，箱盖上还钉着王室仓库的铜牌。'
    ]
  },
  event_damaged_merchant: {
    descriptions: [
      '一艘商船斜在浪里冒烟，船长用最后一面信号旗请求援助。',
      '受损商船正在慢慢进水，甲板上的货主和水手吵成一团。'
    ]
  },
  event_pirate_block: {
    descriptions: [
      '黑旗快船从侧浪里钻出，炮口已经转向你们的船舷。',
      '一群海盗在船头敲着刀背，他们不急着开炮，像是已经算好了你的货值。'
    ]
  },
  event_giant_octopus: {
    descriptions: [
      '海面鼓起紫黑色的圆顶，触手从船底两侧升起，缠住了水线。',
      '水下阴影突然扩张，巨型章鱼的眼睛贴着浪花睁开。'
    ]
  },
  event_sea_serpent: {
    descriptions: [
      '黑潮里窜出一道细长脊背，海蛇绕着船身画出一圈冰冷的浪纹。',
      '长身海怪贴着浪尖滑行，鳞片上夹着失落航线的珊瑚屑。'
    ]
  },
  event_white_whale: {
    descriptions: [
      '白鲸从深水浮起，背上的旧伤像被海水磨平的古老航图。',
      '鲸群在远处分开，白鲸之王抬起额骨，像是在判断你们是否配走这条路。'
    ]
  },
  event_patrol: {
    descriptions: [
      '王国巡逻舰升起检查旗，炮门半开，示意所有船只降帆。',
      '巡防舰切到你们前方，甲板上的军官正在翻看通缉册。'
    ]
  },
  event_island: {
    descriptions: [
      '一座小岛从雾后露出，岸边有淡水痕迹，也有被火烧过的旧营地。',
      '无人小岛挡在航线旁，礁盘内侧似乎能避风，也可能藏着麻烦。'
    ]
  },
  event_black_market: {
    descriptions: [
      '没有旗帜的黑市船靠了过来，船舱里挂着遮光帘，交易声压得很低。',
      '一艘涂黑的双桅船从暗流里滑出，掌柜隔着甲板报出几样禁货。'
    ]
  },
  event_siren: {
    descriptions: [
      '歌声从雾里飘来，船员们的眼神开始发直，像听见了家乡的钟声。',
      '海面安静得不自然，只有一段旋律贴着船舷反复回响。'
    ]
  },
  event_bottle: {
    descriptions: [
      '一个封蜡漂流瓶撞上船侧，里面的羊皮纸已经被盐霜染黄。',
      '海浪送来一只玻璃瓶，瓶口缠着旧红绳，像某个时代留下的求救信。'
    ]
  },
  event_mutiny: {
    descriptions: [
      '船员们聚在前甲板压低声音，看到你靠近才突然散开。',
      '晚饭后没人唱歌，几个老水手盯着粮桶和钱袋，气氛越来越冷。'
    ]
  },
  event_ghost_fog: {
    descriptions: [
      '白雾像墙一样合上，指南针疯狂旋转，船铃无风自响。',
      '雾里传来另一艘船的桨声，可视线里什么也没有。'
    ]
  },
  event_blockade: {
    descriptions: [
      '海军封锁线横在前方，巡逻灯一盏接一盏扫过浪面。',
      '整支舰队把航道切成几段，军官用旗语命令所有商船靠边。'
    ]
  },
  event_whirlpool: {
    descriptions: [
      '海水向一个黑洞般的中心塌去，船头已经被旋涡边缘拉偏。',
      '大漩涡在前方张开，碎木、泡沫和鱼骨都绕着中心飞快旋转。'
    ]
  },
  event_leviathan: {
    descriptions: [
      '深渊沸腾，利维坦像一座活动的岛屿升起，天色瞬间暗了下来。',
      '海面裂开，巨兽的阴影遮住船帆，所有传说都在这一刻变成了实体。'
    ]
  },
  event_debt_collector: {
    descriptions: [
      '大洋银行的重型战舰追上来了，甲板上的账房把算盘敲得比炮声还响。',
      '讨债旗在风里展开，冷脸佣兵已经把登船钩架上船头。'
    ]
  }
};

const ROUTE_CONTEXT: Record<string, string[]> = {
  route_coastal: ['近海航线的潮声还带着港口味道，任何小麻烦都会很快传回岸上。', '这里离补给线不远，水手们更在意名声和损耗。'],
  route_storm: ['暴风航线的气压很低，所有决定都要抢在下一阵横风前完成。', '雨云压着桅杆，连最普通的遭遇也变得更危险。'],
  route_black_tide: ['黑潮把残骸和怪影都卷到一起，错过一步就会被暗流带偏。', '这片海的流速很怪，奖赏和风险都会被放大。'],
  route_coral: ['珊瑚群岛的浅水会放大每次转舵的代价，熟路比蛮力更重要。', '彩色礁盘在水下铺开，任何亮光都可能是宝物或陷阱。'],
  route_monsoon: ['季风远洋航线看的是窗口，耽搁太久就会错过整片风。', '远洋风向正在变，船队的每个选择都会影响后续航程。'],
  route_legend: ['传说航线上的每一处浪花都有人讲过旧故事，真假只能靠你亲自验证。', '这里已经不是普通商路，遇见的东西大多和旧王朝、海盗王或深海有关。'],
  route_abyss: ['深渊航线没有真正安全的水面，连沉默都像警告。', '这里的海水黑得发亮，每个决定都像写进最后的航海日志。']
};

const PORT_CONTEXT: Record<string, string[]> = {
  port_royal: ['皇家直辖港的税吏会追问这件事的来龙去脉。', '王室港口的规矩很重，体面的处理方式会更值钱。'],
  port_tortuga: ['龟岛酒馆会把这件事添油加醋讲三遍。', '黑市水手认结果不认规矩，强硬手段更容易换来名声。'],
  port_nassau: ['拿骚的自由船长们只关心你带回多少消息。', '自由港里消息比货物跑得快，任何选择都会变成谈资。'],
  port_cartagena: ['卡塔赫纳的军需官会仔细检查每一处损伤。', '要塞港更相信秩序和证明，胆子太大容易惹来审查。'],
  port_oriental: ['东方明珠港的商人会从礼节和细节里判断你的价值。', '远东商路讲究人情和信物，鲁莽会被记很久。'],
  port_azores: ['亚速尔补给港最看重实用情报和可修复的船况。', '补给港的修船匠会把这段经历当成下一次报价的依据。'],
  port_madagascar: ['马达加斯加的旧海盗会用这事衡量你有没有资格谈传说。', '避风港的人不问来路，只问你敢不敢拿走机会。']
};

const STORY_CONTEXT: Record<string, string[]> = {
  opening: ['你还在重建名声，每次遭遇都可能决定债主和商会怎么看你。', '旧船队沉没的阴影还没散，船员们正在观察你是否配当船长。'],
  coastal: ['近海补给线刚刚铺开，岸上的人还在等你的第一批可靠消息。', '你开始被称作能跑完整航线的人，但这还远远不够。'],
  storm: ['暴风海图已经把你推向真正的远洋，谨慎和野心都开始变得昂贵。', '拿骚和要塞港都在看你能不能穿过更坏的海况。'],
  branch: ['帝国和海盗都在拉拢你，你在海上的每个选择都会偏向一面旗帜。', '命运的分岔已经出现，声望和通缉不再只是数字。'],
  faction: ['阵营任务已经压在航海日志里，女王敕令或藏宝图都需要更远的航线。', '你的旗帜有了方向，海上的传闻也开始主动找上门。'],
  ocean: ['远洋补给链正在成形，港口、海怪证据和旧航线逐渐连成一张大图。', '你已经不是单纯跑货，所有海域都在考验这条补给链能否撑住。'],
  finale: ['终章近了，财富、深渊和阵营承诺都在逼你做最后的选择。', '海盗王或殖民地总督的传说正在成形，每次遭遇都像最后一段注脚。']
};

const TIME_CONTEXT = [
  ['清晨的海雾还没散，瞭望手只能凭声音判断距离。', '潮水刚换向，船身还带着夜航留下的湿冷。'],
  ['正午阳光把海面照得发白，任何旗帜和伤痕都无处藏身。', '午后的热风让甲板发烫，船员们更容易急躁。'],
  ['黄昏把浪尖染成铜色，远处的帆影看起来都像敌人。', '落日前的风开始转向，留给你们犹豫的时间不多。'],
  ['月光照着船尾的航迹，旧传闻在夜航时听起来格外真实。', '深夜的海面只剩浪声，连最细小的动静都会被放大。']
];

const ROUTE_OPTION_SUFFIX: Record<string, string> = {
  route_coastal: '按近海规矩',
  route_storm: '抢在横风前',
  route_black_tide: '顺着黑潮判断',
  route_coral: '避开浅礁',
  route_monsoon: '借季风窗口',
  route_legend: '按旧海图试探',
  route_abyss: '冒深渊风险'
};

function pick<T>(items: T[] | undefined): T | undefined {
  if (!items || items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

function pickMany(items: string[], count: number): string[] {
  const pool = [...items];
  const selected: string[] = [];
  while (pool.length > 0 && selected.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    selected.push(pool.splice(index, 1)[0]);
  }
  return selected;
}

function getStoryContextKey(player: PlayerState): keyof typeof STORY_CONTEXT {
  const progress = Number.isFinite(player.storyProgress) ? player.storyProgress : 0;
  if (progress <= 0) return 'opening';
  if (progress === 1) return 'coastal';
  if (progress === 2) return 'storm';
  if (progress === 3) return 'branch';
  if (progress === 4) return 'faction';
  if (progress === 5) return 'ocean';
  if (progress >= FINALE_STORY_PROGRESS) return 'finale';
  return 'ocean';
}

function getTimeContext(player: PlayerState): string[] {
  return TIME_CONTEXT[player.voyageCount % TIME_CONTEXT.length];
}

function getContextPool(player: PlayerState, voyage: VoyageState): string[] {
  const routeId = voyage.route?.id;
  const destinationPortId = voyage.destinationPortId;
  return [
    ...(routeId ? ROUTE_CONTEXT[routeId] || [] : []),
    ...(PORT_CONTEXT[destinationPortId] || PORT_CONTEXT[player.currentPortId] || []),
    ...STORY_CONTEXT[getStoryContextKey(player)],
    ...getTimeContext(player)
  ];
}

function getOptionSuffix(player: PlayerState, voyage: VoyageState): string {
  const suffixes = [
    voyage.route?.id ? ROUTE_OPTION_SUFFIX[voyage.route.id] : undefined,
    player.storyBranch === 'pirate' ? '按黑旗路数' : undefined,
    player.storyBranch === 'governor' ? '按王室章程' : undefined,
    player.voyageCount % 2 === 0 ? '趁潮水变化' : '听瞭望手口令'
  ].filter(Boolean) as string[];
  return pick(suffixes) || '看海况决定';
}

export function renderContextualEvent(event: GameEvent, player: PlayerState, voyage: VoyageState): GameEvent {
  const eventScene = EVENT_SCENES[event.id];
  const sceneDescription = pick(eventScene?.descriptions) || event.description;
  const contextLines = pickMany(getContextPool(player, voyage), 2);
  const suffix = getOptionSuffix(player, voyage);

  return {
    ...event,
    description: [sceneDescription, ...contextLines].join(' '),
    options: event.options.map(option => ({
      ...option,
      label: `${option.label}（${suffix}）`
    }))
  };
}

export function renderEncounterLog(event: GameEvent, player: PlayerState, voyage: VoyageState): string {
  const routeName = voyage.route?.name || '未知海域';
  const destinationName = PORTS.find(port => port.id === voyage.destinationPortId)?.name || '目的港';
  return `遇到: ${event.name}（${routeName}，驶向${destinationName}）`;
}

export function renderContextualOutcome(message: string, player: PlayerState, voyage: VoyageState): string {
  const context = pick(getContextPool(player, voyage));
  if (!context) return message;
  return `${message} ${context}`;
}
