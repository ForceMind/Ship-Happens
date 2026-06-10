import { PlayerState } from '../types';

export interface StoryStatus {
  title: string;
  description: string;
  objective: string;
  cta: string;
  canAdvance: boolean;
}

export function getStoryStatus(player: PlayerState): StoryStatus | null {
  const storyProgress = Number.isFinite(player.storyProgress) ? player.storyProgress : 0;

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
    const targetGold = 10000;
    const canAdvance = player.gold >= targetGold;
    return {
      title: canAdvance ? '主线：崭露头角' : '主线目标：积累 10,000 金币',
      description: canAdvance
        ? '你的财富已经足以让各方势力记住你的名字，新的邀约正在港口等你。'
        : '做贸易、跑合同、冒险打捞，先让自己从破产船长变成真正有分量的人。',
      objective: canAdvance ? '新的主线剧情已解锁。' : `当前金币：${player.gold} / ${targetGold}`,
      cta: '继续主线',
      canAdvance,
    };
  }

  if (storyProgress === 2) {
    const hasPiratePath = player.bounty >= 100;
    const hasGovernorPath = player.reputation >= 100;
    const canAdvance = hasPiratePath || hasGovernorPath;
    let pathText = '提高声望可走帝国路线，提高通缉可走海盗路线。';
    if (hasPiratePath && hasGovernorPath) pathText = '帝国和海盗都盯上了你，你可以亲自选择未来。';
    else if (hasPiratePath) pathText = '你的通缉令已经传遍海域，海盗公会向你递来了黑色邀请。';
    else if (hasGovernorPath) pathText = '你的声望已经足够耀眼，帝国总督府向你递来了正式委任。';

    return {
      title: canAdvance ? '主线：命运的抉择' : '主线目标：选择你的旗帜',
      description: pathText,
      objective: canAdvance
        ? '阵营抉择已解锁。'
        : `声望 ${player.reputation} / 100，通缉 ${player.bounty} / 100`,
      cta: '做出抉择',
      canAdvance,
    };
  }

  if (storyProgress === 3) {
    const targetGold = 50000;
    const canAdvance = player.gold >= targetGold;
    const branchName = player.storyBranch === 'pirate' ? '海盗王' : '帝国总督';
    return {
      title: canAdvance ? `主线终章：${branchName}` : `主线目标：铺平${branchName}之路`,
      description: canAdvance
        ? '你的财富、舰队和名号都已经足够支撑最后一步。'
        : `继续积累财富，等你拥有 ${targetGold} 金币，就能完成${branchName}结局。`,
      objective: canAdvance ? '终章已解锁。' : `当前金币：${player.gold} / ${targetGold}`,
      cta: '进入终章',
      canAdvance,
    };
  }

  return null;
}

export function canAdvanceStory(player: PlayerState): boolean {
  return getStoryStatus(player)?.canAdvance ?? false;
}
