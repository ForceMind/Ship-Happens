import React, { useState, useEffect } from 'react';
import { PlayerState, VoyageState, Route } from './types';
import { loadGame, saveGame, resetGame } from './storage';
import { startVoyage, moveShip, triggerEvent, resolveEventChoice, resolveCombatTurn, settleArrival, settleReturn, settleSinking, CombatAction } from './engine';

import { TitleScreen } from './components/TitleScreen';
import { PortScreen } from './components/PortScreen';
import { RouteSelect } from './components/RouteSelect';
import { VoyageScreen } from './components/VoyageScreen';
import { CombatScreen } from './components/CombatScreen';
import { SettlementScreen } from './components/SettlementScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { CasinoScreen } from './components/CasinoScreen';
import { StoryScreen } from './components/StoryScreen';
import { VersionBadge } from './components/VersionBadge';
import { canAdvanceStory } from './content/story';
import { applyStoryUnlocks, FINAL_STORY_PROGRESS } from './content/progression';

type AppScreen = 'title' | 'port' | 'route_select' | 'voyage' | 'combat' | 'settlement' | 'game_over' | 'casino';

export const SinkOrRichGame: React.FC = () => {
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [voyage, setVoyage] = useState<VoyageState | null>(null);
  const [screen, setScreen] = useState<AppScreen>('title');
  const [settlementResult, setSettlementResult] = useState<string[]>([]);
  const [settlementMode, setSettlementMode] = useState<'arrived' | 'returning' | 'sunk'>('arrived');
  const [showStory, setShowStory] = useState(false);

  useEffect(() => {
    if (!player) return;
    if (showStory || screen !== 'port' || !canAdvanceStory(player)) return;

    const timerId = window.setTimeout(() => setShowStory(true), 0);
    return () => window.clearTimeout(timerId);
  }, [player, screen, showStory]);

  useEffect(() => {
    const { player: p, voyage: v } = loadGame();
    setPlayer(p);
    setVoyage(v);
  }, []);

  useEffect(() => {
    if (player) saveGame(player, voyage);
  }, [player, voyage]);

  if (!player) return null;

  const handleStartNew = () => {
    const p = resetGame();
    setPlayer(p);
    setVoyage(null);
    setScreen('port');
  };

  const handleContinue = () => {
    if (voyage) {
      if (voyage.mode === 'combat') setScreen('combat');
      else if (voyage.mode === 'sailing') setScreen('voyage');
      else if (voyage.mode === 'sunk' || voyage.mode === 'arrived' || voyage.mode === 'returning') {
        setVoyage(null);
        setScreen('port');
      }
    } else {
      // Check bankruptcy on load
      if (player.currentShip === null && player.gold < 300 && player.rescuedByGuild) {
        setScreen('game_over');
      } else {
        setScreen('port');
      }
    }
  };

  const handleReset = () => {
    handleStartNew();
  };

  const handleSelectRoute = (route: Route, destinationPortId: string) => {
    const { player: p, voyage: v } = startVoyage(player, route, destinationPortId);
    setPlayer(p);
    setVoyage(v);
    setScreen('voyage');
  };

  const handleShipMove = (dx: number, dy: number) => {
    if (!voyage) return;

    const portX = voyage.mapWidth / 2;
    const portY = 150;
    const distToPort = Math.sqrt(Math.pow(voyage.playerPosition.x - portX, 2) + Math.pow(voyage.playerPosition.y - portY, 2));

    if (distToPort <= 60 && voyage.mode === 'sailing' && !voyage.currentEvent) {
      // Arrived
      const { player: p, resultMsg } = settleArrival(player, voyage);
      setPlayer(p);
      setVoyage(null);
      setSettlementResult(resultMsg);
      setSettlementMode('arrived');
      setScreen('settlement');
      return;
    }

    const { player: p, voyage: v, collidedEntityId } = moveShip(player, voyage, dx, dy);

    if (collidedEntityId) {
      const vWithEvent = triggerEvent(p, v, collidedEntityId);
      setPlayer(p);
      setVoyage(vWithEvent);
      if (vWithEvent.mode === 'combat') setScreen('combat');
    } else {
      setPlayer(p);
      setVoyage(v);
      if (v.mode === 'sunk') {
        const { player: p2, resultMsg } = settleSinking(p);
        setPlayer(p2);
        setVoyage(null);
        setSettlementResult(resultMsg);
        setSettlementMode('sunk');
        setScreen('settlement');
      }
    }
  };

  const handleResolveEvent = (eventId: string, choiceId: string) => {
    if (!voyage) return;
    const { player: p, voyage: v } = resolveEventChoice(player, voyage, eventId, choiceId);
    setPlayer(p);
    setVoyage(v);

    if (v.mode === 'sunk') {
      const { player: p2, resultMsg } = settleSinking(p);
      setPlayer(p2);
      setVoyage(null);
      setSettlementResult(resultMsg);
      setSettlementMode('sunk');
      setScreen('settlement');
    } else if (v.mode === 'combat') {
      setScreen('combat');
    }
  };

  const handleReturn = () => {
    if (!voyage) return;
    const { player: p, resultMsg } = settleReturn(player, voyage);
    setPlayer(p);
    setVoyage(null);
    setSettlementResult(resultMsg);
    setSettlementMode('returning');
    setScreen('settlement');
  };

  const handleCombatAction = (action: CombatAction) => {
    if (!voyage) return;
    const { player: p, voyage: v } = resolveCombatTurn(player, voyage, action);
    setPlayer(p);
    setVoyage(v);

    if (v.mode === 'sunk') {
      const { player: p2, resultMsg } = settleSinking(p);
      setPlayer(p2);
      setVoyage(null);
      setSettlementResult(resultMsg);
      setSettlementMode('sunk');
      setScreen('settlement');
    } else if (v.mode === 'sailing') {
      setScreen('voyage');
    }
  };

  const handleFinishSettlement = () => {
    if (settlementMode === 'sunk' && player.currentShip === null && player.gold < 300 && player.rescuedByGuild) {
      setScreen('game_over');
    } else {
      setScreen('port');
    }
  };

  return (
    <div>
      {screen === 'title' && (
        <TitleScreen
          player={player}
          hasSavedVoyage={!!voyage}
          onStartNew={handleStartNew}
          onContinue={handleContinue}
          onReset={handleReset}
        />
      )}
      {screen === 'port' && (
        <PortScreen
          player={player}
          setPlayer={setPlayer}
          onGoToRouteSelect={() => setScreen('route_select')}
          onBankrupt={() => setScreen('game_over')}
          onGoToCasino={() => setScreen('casino')}
          onGoToStory={() => setShowStory(true)}
        />
      )}
      {screen === 'casino' && (
        <CasinoScreen
          player={player}
          setPlayer={setPlayer}
          onLeave={() => setScreen('port')}
        />
      )}
      {screen === 'route_select' && (
        <RouteSelect
          currentPortId={player.currentPortId || 'port_royal'}
          unlockedRoutes={player.unlockedRoutes}
          player={player}
          onSelectRoute={handleSelectRoute}
          onCancel={() => setScreen('port')}
        />
      )}
      {screen === 'voyage' && voyage && (
        <VoyageScreen
          player={player}
          voyage={voyage}
          onShipMove={handleShipMove}
          onReturn={handleReturn}
          onResolveEvent={handleResolveEvent}
        />
      )}
      {screen === 'combat' && voyage && (
        <CombatScreen
          player={player}
          voyage={voyage}
          onCombatAction={handleCombatAction}
        />
      )}
      {screen === 'settlement' && (
        <SettlementScreen
          player={player}
          mode={settlementMode}
          resultMsg={settlementResult}
          onFinishSettlement={handleFinishSettlement}
        />
      )}
      {screen === 'game_over' && (
        <GameOverScreen
          player={player}
          onRestart={handleStartNew}
        />
      )}

      {showStory && (
        <StoryScreen
          player={player}
          onComplete={(newProgress, branch) => {
            if (newProgress === FINAL_STORY_PROGRESS) {
              resetGame();
              setScreen('title');
              setShowStory(false);
              return;
            }
            let update = applyStoryUnlocks(player, newProgress);
            if (branch) update.storyBranch = branch;
            setPlayer(update);
            setShowStory(false);
          }}
        />
      )}
      <VersionBadge />
    </div>
  );
};
