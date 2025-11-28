import React, { useEffect, useState } from 'react';
import { BattleState, BattleSystem } from '../systems/battleSystem';
import { TypingInput } from './TypingInput';
import { useI18n } from '../hooks/useI18n';
import words from '../data/words.json';

interface BattleProps {
  battleState: BattleState;
  onBattleUpdate: (newState: BattleState) => void;
  onBattleEnd: (winner: 'player' | 'enemy') => void;
}

export const Battle: React.FC<BattleProps> = ({ battleState, onBattleUpdate, onBattleEnd }) => {
  const { t } = useI18n();
  const [targetWord, setTargetWord] = useState('');

  // Pick a random word
  const getNextWord = () => {
    const idx = Math.floor(Math.random() * words.length);
    return words[idx];
  };

  useEffect(() => {
    if (!targetWord) {
      setTargetWord(getNextWord());
    }
  }, [targetWord]);

  useEffect(() => {
    if (battleState.isFinished && battleState.winner) {
      setTimeout(() => {
        onBattleEnd(battleState.winner!);
      }, 1500);
    } else if (battleState.turn === 'enemy') {
      // Enemy turn delay
      setTimeout(() => {
        const nextState = BattleSystem.executeEnemyTurn(battleState);
        onBattleUpdate(nextState);
      }, 1000);
    }
  }, [battleState, onBattleEnd, onBattleUpdate]);

  const handleTypingComplete = () => {
    if (battleState.turn !== 'player') return;

    // Calculate damage based on word length (simple logic)
    const damage = Math.floor(battleState.player.atk * (1 + targetWord.length * 0.1));
    const nextState = BattleSystem.executePlayerAttack(battleState, damage);
    onBattleUpdate(nextState);
    setTargetWord(getNextWord());
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      <div className="terminal-border w-full mb-4 p-6 bg-terminal-black/90">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center">
            <div className="text-4xl mb-2">👾</div>
            <div className="text-xl font-bold">{battleState.enemy.name}</div>
            <div className="text-terminal-red">HP: {battleState.enemy.hp} / {battleState.enemy.maxHp}</div>
            <div className="w-32 h-2 bg-terminal-darkGreen mt-1 mx-auto border border-terminal-green">
              <div 
                className="h-full bg-terminal-red transition-all duration-300"
                style={{ width: `${(battleState.enemy.hp / battleState.enemy.maxHp) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="h-32 overflow-y-auto border-t border-b border-terminal-darkGreen py-2 mb-4 font-mono text-sm space-y-1 scrollbar-thin">
          {battleState.log.slice().reverse().map((log, i) => (
            <div key={i} className="opacity-80">&gt; {log}</div>
          ))}
        </div>

        {battleState.turn === 'player' && !battleState.isFinished && (
          <TypingInput 
            targetWord={targetWord}
            onComplete={handleTypingComplete}
          />
        )}

        {battleState.turn === 'enemy' && (
          <div className="text-center text-terminal-red animate-pulse">
            ENEMY TURN...
          </div>
        )}
        
        {battleState.isFinished && (
          <div className="text-center text-terminal-yellow text-xl font-bold animate-bounce">
            {battleState.winner === 'player' ? t('battle.win') : t('battle.lose')}
          </div>
        )}
      </div>
    </div>
  );
};
