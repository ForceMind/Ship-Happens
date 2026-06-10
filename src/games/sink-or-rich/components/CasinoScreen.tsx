import React, { useState } from 'react';
import { PlayerState } from '../types';
import { Modal } from './Modal';
import styles from './styles.module.css';

interface Props {
  player: PlayerState;
  setPlayer: (p: PlayerState) => void;
  onLeave: () => void;
}

const ROULETTE_OPTIONS = [
  { color: 'red', label: '红色 (1赔3)' },
  { color: 'black', label: '黑色 (1赔3)' },
  { color: 'green', label: '绿色 (1赔3)' }
];

const SLOT_SYMBOLS = ['🍒', '🍋', '💎', '🔔', '🍉', '☠️'];

export const CasinoScreen: React.FC<Props> = ({ player, setPlayer, onLeave }) => {
  const [modal, setModal] = useState<{title: string, msg: string, onConfirm: () => void} | null>(null);

  const activeGame = player.currentPortId === 'port_royal' ? 'roulette' : 'slots';
  const [betAmount, setBetAmount] = useState<number>(100);

  // Roulette states
  const [rouletteChoice, setRouletteChoice] = useState<'red'|'black'|'green'>('red');
  const [spinningRoulette, setSpinningRoulette] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<string | null>(null);

  // Slot states
  const [spinningSlots, setSpinningSlots] = useState(false);
  const [slotResult, setSlotResult] = useState<string[]>(['❓', '❓', '❓']);

  const handleBetChange = (amount: number) => {
    setBetAmount(amount);
  };

  const playRoulette = () => {
    if (player.gold < betAmount) {
      setModal({ title: '余额不足', msg: '没钱还想赌？去找银行借点吧！', onConfirm: () => setModal(null) });
      return;
    }
    setPlayer({ ...player, gold: player.gold - betAmount });
    setSpinningRoulette(true);
    setRouletteResult(null);

    setTimeout(() => {
      setSpinningRoulette(false);
      const roll = Math.random();
      let outcome: 'red'|'black'|'green';
      if (roll < 0.333333) outcome = 'green';
      else if (roll < 0.666666) outcome = 'red';
      else outcome = 'black';

      setRouletteResult(outcome);
      if (outcome === rouletteChoice) {
        const multiplier = 3;
        const winnings = betAmount * multiplier;
        setPlayer({ ...player, gold: player.gold + winnings });
        setModal({ title: '赢啦！', msg: `开出了 ${outcome === 'red' ? '红色' : outcome === 'black' ? '黑色' : '绿色'}！恭喜赢取 ${winnings} 金币！`, onConfirm: () => setModal(null) });
      } else {
        setModal({ title: '输了', msg: `开出了 ${outcome === 'red' ? '红色' : outcome === 'black' ? '黑色' : '绿色'}！筹码全被收走了...（大转盘期望值严格为1.0，只要你玩得够久，不输不赢）`, onConfirm: () => setModal(null) });
      }
    }, 1500);
  };

  const playSlots = () => {
    if (player.gold < betAmount) {
      setModal({ title: '余额不足', msg: '没钱还想赌？去找银行借点吧！', onConfirm: () => setModal(null) });
      return;
    }
    setPlayer({ ...player, gold: player.gold - betAmount });
    setSpinningSlots(true);
    setSlotResult(['🔄', '🔄', '🔄']);

    setTimeout(() => {
      setSpinningSlots(false);
      const result = [
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
      ];
      setSlotResult(result);

      if (result[0] === result[1] && result[1] === result[2]) {
        // 3 matches
        if (result[0] === '☠️') {
          const winnings = betAmount * 21;
          setPlayer({ ...player, gold: player.gold + winnings });
          setModal({ title: '💀海盗大奖💀', msg: `摇出三个骷髅头！狂揽 ${winnings} 金币！`, onConfirm: () => setModal(null) });
        } else {
          const winnings = betAmount * 3;
          setPlayer({ ...player, gold: player.gold + winnings });
          setModal({ title: '大奖！', msg: `摇出三个相同图案！赢得 ${winnings} 金币！`, onConfirm: () => setModal(null) });
        }
      } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
        // 2 matches
        const winnings = betAmount * 2;
        setPlayer({ ...player, gold: player.gold + winnings });
        setModal({ title: '小奖！', msg: `摇出两个相同图案！赢得 ${winnings} 金币！`, onConfirm: () => setModal(null) });
      } else {
        setModal({ title: '没中', msg: '再来一次，下次一定中！', onConfirm: () => setModal(null) });
      }
    }, 1500);
  };

  return (
    <div className={styles.container} style={{ backgroundColor: '#1a0b1c', backgroundImage: 'radial-gradient(circle at center, #300a38 0%, #1a0b1c 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#ffb300', textShadow: '0 0 10px #ffb300' }}>
          {activeGame === 'roulette' ? '🎰 皇家大赌场 🎰' : '☠️ 海盗赌坊 ☠️'}
        </h2>
        <div style={{ color: '#ffeb3b', fontSize: '1.2rem', fontWeight: 'bold' }}>当前资金: 💰 {player.gold}</div>
      </div>

      <div className={styles.card} style={{ borderColor: '#ffb300', boxShadow: '0 0 20px rgba(255,179,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3>选择押注金额</h3>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
            {[100, 500, 1000, 5000].map(amt => (
              <button
                key={amt}
                className={betAmount === amt ? styles.btnPrimary : styles.btnSecondary}
                onClick={() => handleBetChange(amt)}
              >
                {amt} 金币
              </button>
            ))}
          </div>
        </div>

        {activeGame === 'roulette' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px' }}>幸运大转盘</h3>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '20px' }}>
              {ROULETTE_OPTIONS.map(opt => (
                <div
                  key={opt.color}
                  onClick={() => !spinningRoulette && setRouletteChoice(opt.color as any)}
                  style={{
                    padding: '20px',
                    borderRadius: '8px',
                    cursor: spinningRoulette ? 'default' : 'pointer',
                    backgroundColor: opt.color,
                    border: rouletteChoice === opt.color ? '4px solid #fff' : '4px solid transparent',
                    boxShadow: rouletteChoice === opt.color ? '0 0 15px #fff' : 'none',
                    fontWeight: 'bold',
                    color: opt.color === 'green' ? '#000' : '#fff'
                  }}
                >
                  {opt.label}
                </div>
              ))}
            </div>

            <div style={{ height: '60px', marginBottom: '20px', fontSize: '1.2rem' }}>
              {spinningRoulette ? (
                <div style={{ animation: 'pulse 0.5s infinite', color: '#ffb300' }}>转盘疯狂转动中... 🔄</div>
              ) : rouletteResult ? (
                <div>结果: 开出了 <span style={{ color: rouletteResult, fontWeight: 'bold', textTransform: 'uppercase' }}>{rouletteResult}</span>!</div>
              ) : (
                <div style={{ color: '#ccc' }}>买定离手！</div>
              )}
            </div>

            <button
              className={styles.btnPrimary}
              style={{ fontSize: '1.5rem', padding: '15px 40px', backgroundColor: '#e91e63' }}
              disabled={spinningRoulette}
              onClick={playRoulette}
            >
              开转！(扣除 {betAmount} 金)
            </button>
          </div>
        )}

        {activeGame === 'slots' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px' }}>海盗老虎机</h3>
            <p style={{ color: '#ccc', marginBottom: '20px' }}>两连同花 x2 | 三连同花 x3 | 三骷髅 x21</p>

            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '30px', fontSize: '4rem', background: '#000', padding: '20px', borderRadius: '10px', border: '4px solid #555' }}>
              <div>{slotResult[0]}</div>
              <div>{slotResult[1]}</div>
              <div>{slotResult[2]}</div>
            </div>

            <button
              className={styles.btnPrimary}
              style={{ fontSize: '1.5rem', padding: '15px 40px', backgroundColor: '#9c27b0' }}
              disabled={spinningSlots}
              onClick={playSlots}
            >
              拉动摇杆！(扣除 {betAmount} 金)
            </button>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button className={styles.btnSecondary} disabled={spinningRoulette || spinningSlots} onClick={onLeave}>
          洗手不干 (返回港口)
        </button>
      </div>

      {modal && (
        <Modal
          title={modal.title}
          message={modal.msg}
          onConfirm={modal.onConfirm}
        />
      )}
    </div>
  );
};
