import React, { useState } from 'react';
import { PlayerState } from '../types';
import { clampCasinoPayout } from '../content/casino';
import { Modal } from './Modal';
import styles from './styles.module.css';

interface Props {
  player: PlayerState;
  setPlayer: (p: PlayerState) => void;
  onLeave: () => void;
}

const ROULETTE_OPTIONS = [
  { color: 'red', label: '红色' },
  { color: 'black', label: '黑色' },
  { color: 'green', label: '绿色' }
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
    if (spinningRoulette) return;
    if (player.gold < betAmount) {
      setModal({ title: '余额不足', msg: '没钱还想赌？去找银行借点吧！', onConfirm: () => setModal(null) });
      return;
    }
    const stake = betAmount;
    const startingGold = player.gold;
    const profitBeforeRound = player.casinoProfitThisPort || 0;

    setPlayer({ ...player, gold: startingGold - stake, casinoProfitThisPort: profitBeforeRound - stake });
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
        const winnings = clampCasinoPayout(stake * multiplier, stake, profitBeforeRound);
        setPlayer({ ...player, gold: startingGold - stake + winnings, casinoProfitThisPort: profitBeforeRound - stake + winnings });
        setModal({ title: '赢啦！', msg: `转盘停下，幸运站在你这边。你赢得 ${winnings} 金币！`, onConfirm: () => setModal(null) });
      } else {
        setModal({ title: '输了', msg: '转盘停下，筹码全被收走了...', onConfirm: () => setModal(null) });
      }
    }, 1500);
  };

  const playSlots = () => {
    if (spinningSlots) return;
    if (player.gold < betAmount) {
      setModal({ title: '余额不足', msg: '没钱还想赌？去找银行借点吧！', onConfirm: () => setModal(null) });
      return;
    }
    const stake = betAmount;
    const startingGold = player.gold;
    const profitBeforeRound = player.casinoProfitThisPort || 0;

    setPlayer({ ...player, gold: startingGold - stake, casinoProfitThisPort: profitBeforeRound - stake });
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
        if (result[0] === '☠️') {
          const winnings = clampCasinoPayout(stake * 21, stake, profitBeforeRound);
          setPlayer({ ...player, gold: startingGold - stake + winnings, casinoProfitThisPort: profitBeforeRound - stake + winnings });
          setModal({ title: '走运了！', msg: `机器吐出一袋沉甸甸的金币。你赢得 ${winnings} 金币！`, onConfirm: () => setModal(null) });
        } else {
          const winnings = clampCasinoPayout(stake * 3, stake, profitBeforeRound);
          setPlayer({ ...player, gold: startingGold - stake + winnings, casinoProfitThisPort: profitBeforeRound - stake + winnings });
          setModal({ title: '走运了！', msg: `机器吐出一袋金币。你赢得 ${winnings} 金币！`, onConfirm: () => setModal(null) });
        }
      } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
        const winnings = clampCasinoPayout(stake * 2, stake, profitBeforeRound);
        setPlayer({ ...player, gold: startingGold - stake + winnings, casinoProfitThisPort: profitBeforeRound - stake + winnings });
        setModal({ title: '有点手气！', msg: `机器吐出一些金币。你赢得 ${winnings} 金币！`, onConfirm: () => setModal(null) });
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
            <p style={{ color: '#ccc', marginBottom: '20px' }}>每次拉杆都是随机开奖，剩下就看海风站在哪一边。</p>

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
