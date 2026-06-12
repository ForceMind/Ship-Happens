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

  let activeGame = 'slots';
  if (player.currentPortId === 'port_royal') activeGame = 'roulette';
  else if (player.currentPortId === 'port_tortuga') activeGame = 'coin_flip';
  else if (player.currentPortId === 'port_oriental') activeGame = 'dice';
  else if (player.currentPortId === 'port_madagascar') activeGame = 'shell';

  const [betAmount, setBetAmount] = useState<number>(100);

  // Roulette states
  const [rouletteChoice, setRouletteChoice] = useState<'red'|'black'|'green'>('red');
  const [spinningRoulette, setSpinningRoulette] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<string | null>(null);

  // Slot states
  const [spinningSlots, setSpinningSlots] = useState(false);
  const [slotResult, setSlotResult] = useState<string[]>(['❓', '❓', '❓']);

  // Coin states
  const [coinChoice, setCoinChoice] = useState<'heads'|'tails'>('heads');
  const [spinningCoin, setSpinningCoin] = useState(false);
  const [coinResult, setCoinResult] = useState<string | null>(null);

  // Dice states
  const [diceChoice, setDiceChoice] = useState<'big'|'small'>('big');
  const [spinningDice, setSpinningDice] = useState(false);
  const [diceResult, setDiceResult] = useState<number[]>([1,1,1]);
  const [diceTotal, setDiceTotal] = useState<number | null>(null);

  // Shell states
  const [shellChoice, setShellChoice] = useState<number>(0);
  const [spinningShell, setSpinningShell] = useState(false);
  const [shellResult, setShellResult] = useState<number | null>(null);

  const handleBetChange = (amount: number) => {
    setBetAmount(amount);
  };

  const getCommonStates = () => {
    return {
      stake: betAmount,
      startingGold: player.gold,
      profitBeforeRound: player.casinoProfitThisPort || 0
    };
  };

  const checkBet = () => {
    if (player.gold < betAmount) {
      setModal({ title: '余额不足', msg: '没钱还想赌？去找银行借点吧！', onConfirm: () => setModal(null) });
      return false;
    }
    return true;
  };

  const applyLoss = (stake: number, profitBeforeRound: number) => {
    setPlayer({ ...player, gold: player.gold - stake, casinoProfitThisPort: profitBeforeRound - stake });
  };

  const applyWin = (stake: number, rawWinnings: number, profitBeforeRound: number) => {
    const finalWinnings = clampCasinoPayout(rawWinnings, stake, profitBeforeRound);
    setPlayer({ ...player, gold: player.gold - stake + finalWinnings, casinoProfitThisPort: profitBeforeRound - stake + finalWinnings });
    return finalWinnings;
  };

  const playRoulette = () => {
    if (spinningRoulette || !checkBet()) return;
    const { stake, profitBeforeRound } = getCommonStates();
    applyLoss(stake, profitBeforeRound);
    setSpinningRoulette(true);
    setRouletteResult(null);

    setTimeout(() => {
      setSpinningRoulette(false);
      const roll = Math.random();
      let outcome: 'red'|'black'|'green' = roll < 0.333333 ? 'green' : (roll < 0.666666 ? 'red' : 'black');
      setRouletteResult(outcome);

      if (outcome === rouletteChoice) {
        const w = applyWin(stake, stake * 3, profitBeforeRound);
        setModal({ title: '赢啦！', msg: `转盘停下，幸运站在你这边。你赢得 ${w} 金币！`, onConfirm: () => setModal(null) });
      } else {
        setModal({ title: '输了', msg: '转盘停下，筹码全被收走了...', onConfirm: () => setModal(null) });
      }
    }, 1500);
  };

  const playSlots = () => {
    if (spinningSlots || !checkBet()) return;
    const { stake, profitBeforeRound } = getCommonStates();
    applyLoss(stake, profitBeforeRound);
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
        const mult = result[0] === '☠️' ? 21 : 3;
        const w = applyWin(stake, stake * mult, profitBeforeRound);
        setModal({ title: '走运了！', msg: `机器吐出一袋${mult === 21 ? '沉甸甸的' : ''}金币。你赢得 ${w} 金币！`, onConfirm: () => setModal(null) });
      } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
        const w = applyWin(stake, stake * 2, profitBeforeRound);
        setModal({ title: '有点手气！', msg: `机器吐出一些金币。你赢得 ${w} 金币！`, onConfirm: () => setModal(null) });
      } else {
        setModal({ title: '没中', msg: '再来一次，下次一定中！', onConfirm: () => setModal(null) });
      }
    }, 1500);
  };

  const playCoinFlip = () => {
    if (spinningCoin || !checkBet()) return;
    const { stake, profitBeforeRound } = getCommonStates();
    applyLoss(stake, profitBeforeRound);
    setSpinningCoin(true);
    setCoinResult(null);

    setTimeout(() => {
      setSpinningCoin(false);
      const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
      setCoinResult(outcome);

      if (outcome === coinChoice) {
        const w = applyWin(stake, stake * 2, profitBeforeRound);
        setModal({ title: '猜中了！', msg: `硬币落地是${outcome === 'heads' ? '正面' : '反面'}，你赢得 ${w} 金币！`, onConfirm: () => setModal(null) });
      } else {
        setModal({ title: '猜错了', msg: `硬币落地是${outcome === 'heads' ? '正面' : '反面'}，筹码被收走了。`, onConfirm: () => setModal(null) });
      }
    }, 1500);
  };

  const playDice = () => {
    if (spinningDice || !checkBet()) return;
    const { stake, profitBeforeRound } = getCommonStates();
    applyLoss(stake, profitBeforeRound);
    setSpinningDice(true);
    setDiceResult(['🎲', '🎲', '🎲'] as any);
    setDiceTotal(null);

    setTimeout(() => {
      setSpinningDice(false);
      const r = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ];
      setDiceResult(r);
      const total = r[0] + r[1] + r[2];
      setDiceTotal(total);
      
      const outcome = total > 10 ? 'big' : 'small';

      if (outcome === diceChoice) {
        const w = applyWin(stake, stake * 2, profitBeforeRound);
        setModal({ title: '赢啦！', msg: `骰子点数 ${total} (${outcome === 'big' ? '大' : '小'})。你赢得 ${w} 金币！`, onConfirm: () => setModal(null) });
      } else {
        setModal({ title: '输了', msg: `骰子点数 ${total} (${outcome === 'big' ? '大' : '小'})，庄家通吃。`, onConfirm: () => setModal(null) });
      }
    }, 1500);
  };

  const playShell = () => {
    if (spinningShell || !checkBet()) return;
    const { stake, profitBeforeRound } = getCommonStates();
    applyLoss(stake, profitBeforeRound);
    setSpinningShell(true);
    setShellResult(null);

    setTimeout(() => {
      setSpinningShell(false);
      const outcome = Math.floor(Math.random() * 3);
      setShellResult(outcome);

      if (outcome === shellChoice) {
        const w = applyWin(stake, stake * 3, profitBeforeRound);
        setModal({ title: '好眼力！', msg: `珍珠果然在第 ${outcome + 1} 个贝壳里！你赢得 ${w} 金币！`, onConfirm: () => setModal(null) });
      } else {
        setModal({ title: '被骗了！', msg: `珍珠其实在第 ${outcome + 1} 个贝壳里，你的钱归骗子了。`, onConfirm: () => setModal(null) });
      }
    }, 1500);
  };

  const isSpinning = spinningRoulette || spinningSlots || spinningCoin || spinningDice || spinningShell;

  return (
    <div className={styles.container} style={{ backgroundColor: '#1a0b1c', backgroundImage: 'radial-gradient(circle at center, #300a38 0%, #1a0b1c 100%)', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#ffb300', textShadow: '0 0 10px #ffb300', margin: 0 }}>
          {activeGame === 'roulette' ? '🎰 皇家大赌场 🎰' : 
           activeGame === 'coin_flip' ? '☠️ 龟岛黑赌桌 ☠️' :
           activeGame === 'dice' ? '🎲 东方长乐坊 🎲' :
           activeGame === 'shell' ? '🐚 街头三仙归洞 🐚' :
           '☠️ 海盗老虎机 ☠️'}
        </h2>
        <div style={{ color: '#ffeb3b', fontSize: '1.2rem', fontWeight: 'bold' }}>当前资金: 💰 {player.gold}</div>
      </div>

      <div className={styles.card} style={{ borderColor: '#ffb300', boxShadow: '0 0 20px rgba(255,179,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3>选择押注金额</h3>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
            {[100, 500, 1000, 5000].map(amt => (
              <button
                key={amt}
                className={betAmount === amt ? styles.btnPrimary : styles.btnSecondary}
                onClick={() => handleBetChange(amt)}
                style={{ minWidth: '80px' }}
              >
                {amt}
              </button>
            ))}
          </div>
        </div>

        {activeGame === 'roulette' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px' }}>幸运大转盘</h3>
            <p style={{ color: '#ccc', marginBottom: '20px' }}>选择颜色，命中后获得 3 倍返还。</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
              {ROULETTE_OPTIONS.map(opt => (
                <div
                  key={opt.color}
                  onClick={() => !spinningRoulette && setRouletteChoice(opt.color as any)}
                  style={{
                    padding: '15px 30px',
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
                <div style={{ animation: 'pulse 0.5s infinite', color: '#ffb300' }}>转动中... 🔄</div>
              ) : rouletteResult ? (
                <div>结果: <span style={{ color: rouletteResult, fontWeight: 'bold' }}>{rouletteResult}</span></div>
              ) : (
                <div style={{ color: '#ccc' }}>买定离手！</div>
              )}
            </div>
            <button className={styles.btnPrimary} style={{ fontSize: '1.2rem', padding: '15px 30px', backgroundColor: '#e91e63' }} disabled={spinningRoulette} onClick={playRoulette}>
              开转！({betAmount} 金)
            </button>
          </div>
        )}

        {activeGame === 'slots' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px' }}>摇杆老虎机</h3>
            <p style={{ color: '#ccc', marginBottom: '20px' }}>两同2倍，三同3倍，骷髅三连21倍。</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '30px', fontSize: 'clamp(2rem, 8vw, 4rem)', background: '#000', padding: '15px', borderRadius: '10px', border: '4px solid #555', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '40px' }}>{slotResult[0]}</div>
              <div style={{ minWidth: '40px' }}>{slotResult[1]}</div>
              <div style={{ minWidth: '40px' }}>{slotResult[2]}</div>
            </div>
            <button className={styles.btnPrimary} style={{ fontSize: '1.2rem', padding: '15px 30px', backgroundColor: '#9c27b0' }} disabled={spinningSlots} onClick={playSlots}>
              拉动摇杆！({betAmount} 金)
            </button>
          </div>
        )}

        {activeGame === 'coin_flip' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px' }}>猜硬币</h3>
            <p style={{ color: '#ccc', marginBottom: '20px' }}>正面或反面，简单粗暴的 2 倍赔率。</p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '20px' }}>
              {['heads', 'tails'].map(opt => (
                <div
                  key={opt}
                  onClick={() => !spinningCoin && setCoinChoice(opt as any)}
                  style={{
                    padding: '15px 30px',
                    borderRadius: '8px',
                    cursor: spinningCoin ? 'default' : 'pointer',
                    backgroundColor: '#424242',
                    border: coinChoice === opt ? '4px solid #ffb300' : '4px solid transparent',
                    fontWeight: 'bold',
                    color: '#fff'
                  }}
                >
                  {opt === 'heads' ? '正面' : '反面'}
                </div>
              ))}
            </div>
            <div style={{ height: '60px', marginBottom: '20px', fontSize: '1.5rem' }}>
              {spinningCoin ? <div style={{ animation: 'pulse 0.2s infinite' }}>🪙 抛掷中...</div> : 
               coinResult ? <div>结果: {coinResult === 'heads' ? '正面' : '反面'}</div> : <div style={{ color: '#ccc' }}>选择正反面</div>}
            </div>
            <button className={styles.btnPrimary} style={{ fontSize: '1.2rem', padding: '15px 30px', backgroundColor: '#f57c00' }} disabled={spinningCoin} onClick={playCoinFlip}>
              抛硬币！({betAmount} 金)
            </button>
          </div>
        )}

        {activeGame === 'dice' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px' }}>骰子猜大小</h3>
            <p style={{ color: '#ccc', marginBottom: '20px' }}>三颗骰子，大(11-18) 或 小(3-10)，2 倍赔率。</p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '20px' }}>
              {['big', 'small'].map(opt => (
                <div
                  key={opt}
                  onClick={() => !spinningDice && setDiceChoice(opt as any)}
                  style={{
                    padding: '15px 30px',
                    borderRadius: '8px',
                    cursor: spinningDice ? 'default' : 'pointer',
                    backgroundColor: '#d32f2f',
                    border: diceChoice === opt ? '4px solid #fff' : '4px solid transparent',
                    fontWeight: 'bold',
                    color: '#fff'
                  }}
                >
                  {opt === 'big' ? '押 大' : '押 小'}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '10px', fontSize: '3rem' }}>
              <div>{spinningDice ? '🎲' : diceResult[0]}</div>
              <div>{spinningDice ? '🎲' : diceResult[1]}</div>
              <div>{spinningDice ? '🎲' : diceResult[2]}</div>
            </div>
            <div style={{ height: '40px', marginBottom: '20px', fontSize: '1.2rem' }}>
              {spinningDice ? <div style={{ animation: 'pulse 0.2s infinite' }}>摇骰中...</div> : 
               diceTotal ? <div>点数: {diceTotal} ({diceTotal > 10 ? '大' : '小'})</div> : <div style={{ color: '#ccc' }}>买定离手</div>}
            </div>
            <button className={styles.btnPrimary} style={{ fontSize: '1.2rem', padding: '15px 30px', backgroundColor: '#c62828' }} disabled={spinningDice} onClick={playDice}>
              开盅！({betAmount} 金)
            </button>
          </div>
        )}

        {activeGame === 'shell' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px' }}>街头三仙归洞</h3>
            <p style={{ color: '#ccc', marginBottom: '20px' }}>猜中珍珠藏在哪个贝壳下，获得 3 倍返还。</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
              {[0, 1, 2].map(idx => (
                <div
                  key={idx}
                  onClick={() => !spinningShell && setShellChoice(idx)}
                  style={{
                    padding: '20px',
                    borderRadius: '8px',
                    cursor: spinningShell ? 'default' : 'pointer',
                    backgroundColor: '#607d8b',
                    border: shellChoice === idx ? '4px solid #ffb300' : '4px solid transparent',
                    fontWeight: 'bold',
                    color: '#fff',
                    fontSize: '2rem',
                    width: '60px'
                  }}
                >
                  {shellResult === idx ? '⚪' : '🐚'}
                </div>
              ))}
            </div>
            <div style={{ height: '40px', marginBottom: '20px', fontSize: '1.2rem' }}>
              {spinningShell ? <div style={{ animation: 'pulse 0.2s infinite' }}>交换中... 🤲</div> : 
               shellResult !== null ? <div>珍珠在第 {shellResult + 1} 个贝壳！</div> : <div style={{ color: '#ccc' }}>选一个贝壳</div>}
            </div>
            <button className={styles.btnPrimary} style={{ fontSize: '1.2rem', padding: '15px 30px', backgroundColor: '#455a64' }} disabled={spinningShell} onClick={playShell}>
              揭晓！({betAmount} 金)
            </button>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px', marginBottom: '20px' }}>
        <button className={styles.btnSecondary} disabled={isSpinning} onClick={onLeave}>
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
