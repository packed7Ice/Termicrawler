import React, { useEffect, useState } from 'react';
import { BattleState, BattleSystem } from '../systems/battleSystem';
import { TypingInput } from './TypingInput';
import { useI18n } from '../hooks/useI18n';
import wordsData from '../data/words.json';

interface WordData {
  target: string;
  ja: string;
  en: string;
}

interface BattleProps {
  battleState: BattleState;
  onBattleUpdate: (newState: BattleState) => void;
  onBattleEnd: (winner: 'player' | 'enemy', finalHp: number) => void;
}

export const Battle: React.FC<BattleProps> = ({ battleState, onBattleUpdate, onBattleEnd }) => {
  const { t, language } = useI18n();
  const [currentWord, setCurrentWord] = useState<WordData | null>(null);

  // Pick a random word
  const getNextWord = (): WordData => {
    const idx = Math.floor(Math.random() * wordsData.length);
    return wordsData[idx];
  };

  useEffect(() => {
    if (!currentWord) {
      setCurrentWord(getNextWord());
    }
  }, [currentWord]);

  useEffect(() => {
    if (battleState.isFinished && battleState.winner) {
      setTimeout(() => {
        onBattleEnd(battleState.winner!, battleState.player.hp);
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
    if (battleState.turn !== 'player' || !currentWord) return;

    // Calculate damage based on word length (simple logic)
    const damage = Math.floor(battleState.player.atk * (1 + currentWord.target.length * 0.1));
    const nextState = BattleSystem.executePlayerAttack(battleState, damage);
    onBattleUpdate(nextState);
    setCurrentWord(getNextWord());
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
        <div className="h-32 overflow-y-auto border-t border-b border-terminal-darkGreen py-2 mb-4 font-mono text-sm space-y-1 scrollbar-thin">
          {battleState.log.slice().reverse().map((log, i) => (
            <div key={i} className="opacity-80">&gt; {t(log.key, log.params)}</div>
          ))}
        </div>
        </div>

        {battleState.turn === 'player' && !battleState.isFinished && currentWord && (
          <div className="flex flex-col items-center">
            <div className="text-terminal-green opacity-70 mb-1 text-lg">
              {language === 'ja' ? currentWord.ja : currentWord.en}
            </div>
            <TypingInput 
              targetWord={currentWord.target}
              onComplete={handleTypingComplete}
            />
          </div>
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
