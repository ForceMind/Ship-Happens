import React from 'react';
import { PlayerState } from '../types';

interface Props {
  player: PlayerState;
  onComplete: (newProgress: number, branch?: 'pirate' | 'governor') => void;
}

export const StoryScreen: React.FC<Props> = ({ player, onComplete }) => {
  let title = '';
  let content = '';
  let options: { text: string, onClick: () => void }[] = [];

  if (player.storyProgress === 0) {
    title = '序章：破产的船长';
    content = '海风中夹杂着朗姆酒的酸臭味，你在一间破旧的酒馆中醒来。你的船队在昨夜的风暴中沉没，不仅血本无归，还欠下了商会一屁股债。然而，大海的呼唤从未停止。这是你东山再起的最后机会。';
    options = [{ text: '升起风帆！', onClick: () => onComplete(1) }];
  } else if (player.storyProgress === 1) {
    title = '第一章：崭露头角';
    content = '你已经积累了超过 10,000 金币，名字开始在各大港口流传。商会的代理人对你刮目相看，而一些黑暗角落里的眼睛也开始注视你。你需要更加小心。';
    options = [{ text: '名利场，我来了。', onClick: () => onComplete(2) }];
  } else if (player.storyProgress === 2) {
    if (player.bounty >= 100 && player.reputation >= 100) {
      title = '第二章：命运的抉择';
      content = '你的名声和恶名都达到了顶峰！帝国海军和海盗工会都派人送来了密信。帝国希望你接受招安，成为私掠船长最终升任总督；而海盗们则尊称你为王，希望你带领他们抗击帝国。';
      options = [
        { text: '接受招安，成为帝国总督！(走白道)', onClick: () => onComplete(3, 'governor') },
        { text: '去他妈的帝国，老子要当海盗王！(走黑道)', onClick: () => onComplete(3, 'pirate') }
      ];
    } else if (player.bounty >= 100) {
      title = '第二章：黑色通缉令';
      content = '你已经被帝国列为头号通缉犯，但海盗们却视你为英雄。海盗工会的使者单膝跪地，向你献上海盗王冠的碎片。';
      options = [{ text: '戴上它，我就是海盗王！', onClick: () => onComplete(3, 'pirate') }];
    } else if (player.reputation >= 100) {
      title = '第二章：皇家的恩宠';
      content = '女王陛下听说了你的光辉事迹，特地派人送来了帝国总督的委任状。只要你积累足够的财富买下那座小岛，你就能成为一方诸侯。';
      options = [{ text: '叩谢皇恩，向总督之路迈进！', onClick: () => onComplete(3, 'governor') }];
    }
  } else if (player.storyProgress === 3) {
    if (player.storyBranch === 'governor') {
      title = '终章：帝国之盾';
      content = '你买下了加勒比海最美丽的岛屿，并在那里建立了一座坚不可摧的堡垒。女王亲自为你授勋，你从一个破产的倒霉蛋，蜕变为了权倾一时的帝国总督。';
    } else {
      title = '终章：四海之王';
      content = '你占领了传说的海盗天堂，用大炮轰碎了帝国的无敌舰队。现在，整个加勒比海都飘扬着你的黑旗，你，就是活着的神话——海盗王！';
    }
    options = [{ text: '激流勇退 (通关)', onClick: () => onComplete(4) }];
  }

  // Fallback for unexpected states
  if (!title) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
    }}>
      <div style={{
        width: '600px', maxWidth: '90%', padding: '40px',
        backgroundColor: '#f4e4bc', backgroundImage: 'linear-gradient(to bottom, #f4e4bc, #e0c896)',
        border: '10px solid #8b5a2b', borderRadius: '15px', color: '#3e2723',
        boxShadow: '0 10px 30px rgba(0,0,0,0.8)', fontFamily: 'serif',
        position: 'relative'
      }}>
        <h1 style={{ textAlign: 'center', borderBottom: '2px solid #8b5a2b', paddingBottom: '10px', marginBottom: '20px', color: '#5d4037' }}>{title}</h1>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '40px', textIndent: '2em' }}>
          {content}
        </p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {options.map((opt, i) => (
            <button key={i} onClick={opt.onClick} style={{
              padding: '12px 25px', backgroundColor: '#8b5a2b', color: '#fff',
              border: '2px solid #5d4037', borderRadius: '8px', fontSize: '1.1rem', cursor: 'pointer',
              fontWeight: 'bold', textShadow: '1px 1px 2px #000', transition: 'transform 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
