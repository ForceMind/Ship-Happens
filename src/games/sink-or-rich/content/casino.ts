const CASINO_MAX_SINGLE_PAYOUT = 18000;
const CASINO_SESSION_PROFIT_CAP = 18000;

export function clampCasinoPayout(rawWinnings: number, stake: number, sessionProfitBeforeRound: number) {
  const remainingSessionPayout = CASINO_SESSION_PROFIT_CAP - sessionProfitBeforeRound + stake;
  return Math.max(0, Math.min(rawWinnings, CASINO_MAX_SINGLE_PAYOUT, remainingSessionPayout));
}
