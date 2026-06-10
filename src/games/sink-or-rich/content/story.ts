import { PlayerState } from '../types';
import { PORTS, ROUTES } from './data';
import { FINALE_STORY_PROGRESS, hasStoryFlag, normalizeStoryProgress } from './progression';

export interface StoryStatus {
  title: string;
  description: string;
  objective: string;
  cta: string;
  canAdvance: boolean;
}

export function getStoryStatus(player: PlayerState): StoryStatus | null {
  const storyProgress = normalizeStoryProgress(player);

  if (storyProgress === 0) {
    return {
      title: '主线：破产船长的序章',
      description: '你的旧船队已经沉没，商会债主还在找你。先弄清楚自己为什么必须重回大海。',
      objective: '阅读序章，开始东山再起。',
      cta: '开始主线',
      canAdvance: true,
    };
  }

  if (storyProgress === 1) {
    const canAdvance = hasStoryFlag(player, 'sailed_route_coastal');
    return {
      title: canAdvance ? '主线：近海试航完成' : '主线目标：完成近海试航',
      description: canAdvance
        ? '你的船已经证明还能穿过近海，拿骚自由港愿意接纳你的补给线。'
        : '驾驶任意船只完成一次近海航线，把第一条补给线跑通。',
      objective: canAdvance ? '返回港口汇报近海试航。' : '尚未完成近海航线。',
      cta: '汇报试航',
      canAdvance,
    };
  }

  if (storyProgress === 2) {
    const targetGold = 3000;
    const canAdvance = hasStoryFlag(player, 'sailed_route_storm') && player.gold >= targetGold;
    const objectives: string[] = [];
    if (!hasStoryFlag(player, 'sailed_route_storm')) objectives.push('完成暴风航线');
    if (player.gold < targetGold) objectives.push(`金币 ${player.gold} / ${targetGold}`);
    return {
      title: canAdvance ? '主线：暴风航线开拓完成' : '主线目标：开拓暴风航线',
      description: canAdvance
        ? '你在暴风里保住了船和货，卡塔赫纳要塞港向你打开了军需渠道。'
        : '拿骚的领航员给了你第一张真正的风暴海图。穿过暴风航线，证明你不只是近海船长。',
      objective: canAdvance ? '新的军需港和黑潮海图即将开放。' : objectives.join('；'),
      cta: '提交暴风航海日志',
      canAdvance,
    };
  }

  if (storyProgress === 3) {
    const hasPiratePath = player.bounty >= 100;
    const hasGovernorPath = player.reputation >= 100;
    const sailedBlackTide = hasStoryFlag(player, 'sailed_route_black_tide');
    const canAdvance = sailedBlackTide && (hasPiratePath || hasGovernorPath);
    let pathText = '穿过黑潮之后，提高声望可走帝国路线，提高通缉可走海盗路线。';
    if (hasPiratePath && hasGovernorPath) pathText = '帝国和海盗都盯上了你，你可以亲自选择未来。';
    else if (hasPiratePath) pathText = '你的通缉令已经传遍海域，海盗公会向你递来了黑色邀请。';
    else if (hasGovernorPath) pathText = '你的声望已经足够耀眼，帝国总督府向你递来了正式委任。';
    const objectives: string[] = [];
    if (!sailedBlackTide) objectives.push('完成黑潮航线');
    if (!hasPiratePath && !hasGovernorPath) objectives.push(`声望 ${player.reputation} / 100，通缉 ${player.bounty} / 100`);

    return {
      title: canAdvance ? '主线：命运的抉择' : '主线目标：选择你的旗帜',
      description: pathText,
      objective: canAdvance
        ? '阵营抉择已解锁。'
        : objectives.join('；'),
      cta: '做出抉择',
      canAdvance,
    };
  }

  if (storyProgress === 4) {
    const completedBranchQuest = player.storyBranch === 'pirate'
      ? hasStoryFlag(player, 'pirate_treasure_found')
      : hasStoryFlag(player, 'queen_mission_completed');
    const branchName = player.storyBranch === 'pirate' ? '海盗王宝藏' : '女王远东敕令';
    return {
      title: completedBranchQuest ? `主线：${branchName}完成` : `主线目标：${branchName}`,
      description: player.storyBranch === 'pirate'
        ? '海盗公会给了你半张藏宝图。去密室接下任务，再到东方明珠港寻找海盗王遗藏。'
        : '帝国总督府等着你接女王远东敕令。接下任务后，把敕令送到东方明珠港。',
      objective: completedBranchQuest ? '阵营主线任务已完成，远洋补给线即将展开。' : `尚未完成${branchName}。`,
      cta: '展开远洋补给线',
      canAdvance: completedBranchQuest,
    };
  }

  if (storyProgress === 5) {
    const sailedCoral = hasStoryFlag(player, 'sailed_route_coral');
    const sailedMonsoon = hasStoryFlag(player, 'sailed_route_monsoon');
    const sailedLegend = hasStoryFlag(player, 'sailed_route_legend');
    const visitedPorts = PORTS.filter(port => hasStoryFlag(player, `visited_${port.id}`));
    const targetVisitedPorts = 5;
    const canAdvance = sailedCoral && sailedMonsoon && sailedLegend && visitedPorts.length >= targetVisitedPorts;
    const objectives: string[] = [];
    if (!sailedCoral) objectives.push('完成珊瑚群岛航线');
    if (!sailedMonsoon) objectives.push('完成季风远洋航线');
    if (!sailedLegend) objectives.push('完成传说航线');
    if (visitedPorts.length < targetVisitedPorts) objectives.push(`抵达不同港口 ${visitedPorts.length} / ${targetVisitedPorts}`);
    return {
      title: canAdvance ? '主线：远洋补给链完成' : '主线目标：铺开远洋补给链',
      description: canAdvance
        ? '你的补给链已经跨过半个世界，最后一张深渊海图浮出水面。'
        : '珊瑚群岛、季风远洋和传说航线会决定你能否支撑最后一场远征。',
      objective: canAdvance ? '深渊航线即将开放。' : objectives.join('；'),
      cta: '开启深渊远征',
      canAdvance,
    };
  }

  if (storyProgress === FINALE_STORY_PROGRESS) {
    const targetGold = 50000;
    const missingRoutes = ROUTES.filter(route => !player.unlockedRoutes.includes(route.id));
    const missingPorts = PORTS.filter(port => !player.unlockedPorts.includes(port.id));
    const defeatedLeviathan = hasStoryFlag(player, 'defeated_leviathan');
    const branchName = player.storyBranch === 'pirate' ? '海盗王' : '帝国总督';
    const completedBranchQuest = player.storyBranch === 'pirate'
      ? hasStoryFlag(player, 'pirate_treasure_found')
      : hasStoryFlag(player, 'queen_mission_completed');
    const branchQuestText = player.storyBranch === 'pirate' ? '尚未找到海盗王宝藏' : '尚未完成女王远东敕令';
    const canAdvance = player.gold >= targetGold && missingRoutes.length === 0 && missingPorts.length === 0 && defeatedLeviathan && completedBranchQuest;
    const objectives: string[] = [];
    if (player.gold < targetGold) objectives.push(`金币 ${player.gold} / ${targetGold}`);
    if (!completedBranchQuest) objectives.push(branchQuestText);
    if (missingPorts.length > 0) objectives.push(`未解锁港口：${missingPorts.map(port => port.name).join('、')}`);
    if (missingRoutes.length > 0) objectives.push(`未解锁海域：${missingRoutes.map(route => route.name).join('、')}`);
    if (!defeatedLeviathan) objectives.push('尚未击败深渊航线的最终海妖');

    return {
      title: canAdvance ? `主线终章：${branchName}` : `主线目标：铺平${branchName}之路`,
      description: canAdvance
        ? '你的财富、航海履历和深渊战绩都已经足够支撑最后一步。'
        : `财富只是门槛之一。想成为${branchName}，必须完成阵营主线任务、解锁所有港口与海域，并穿过深渊完成最终挑战。`,
      objective: canAdvance ? '终章已解锁。' : objectives.join('；'),
      cta: '进入终章',
      canAdvance,
    };
  }

  return null;
}

export function canAdvanceStory(player: PlayerState): boolean {
  return getStoryStatus(player)?.canAdvance ?? false;
}
