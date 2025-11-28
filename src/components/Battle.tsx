import React, { useEffect, useState } from 'react';
import { BattleState, BattleSystem } from '../systems/battleSystem';
import { TypingInput } from './TypingInput';
import { useI18n } from '../hooks/useI18n';
import wordsData from '../data/words.json';
import { SKILLS } from '../data/skills';

interface WordData {
  target: string;
  ja: string;
  en: string;
}

interface BattleProps {
  battleState: BattleState;
  onBattleUpdate: (newState: BattleState) => void;
  onBattleEnd: (winner: 'player' | 'enemy', finalHp: number, finalEn: number) => void;
  excludedWords: string[];
}

export const Battle: React.FC<BattleProps> = ({ battleState, onBattleUpdate, onBattleEnd, excludedWords }) => {
  const { t, language } = useI18n();
  const [currentWord, setCurrentWord] = useState<WordData | null>(null);
  const [showSkills, setShowSkills] = useState(false);

  // Pick a random word excluding the ones in excludedWords
  const getNextWord = (): WordData => {
    const availableWords = wordsData.filter(w => !excludedWords.includes(w.target));
    // Fallback if all words are excluded (should prevent this in UI but safety first)
    const source = availableWords.length > 0 ? availableWords : wordsData;
    const idx = Math.floor(Math.random() * source.length);
    return source[idx];
  };

  useEffect(() => {
    if (!currentWord) {
      setCurrentWord(getNextWord());
    }
  }, [currentWord]);

  useEffect(() => {
    if (battleState.isFinished && battleState.winner) {
      setTimeout(() => {
        onBattleEnd(battleState.winner!, battleState.player.hp, battleState.player.en || 0);
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

    // Execute attack with the word (BattleSystem handles damage calc and traits)
    const nextState = BattleSystem.executePlayerAttack(battleState, currentWord.target);
    onBattleUpdate(nextState);
    setCurrentWord(getNextWord());
  };

  const handleSkillUse = (skillId: string) => {
    const skill = SKILLS.find(s => s.id === skillId);
    if (!skill) return;

    if ((battleState.player.en || 0) >= skill.cost) {
      const nextState = BattleSystem.executeSkill(battleState, skillId);
      onBattleUpdate(nextState);
      setShowSkills(false); // Close menu after use
    }
  };

  return (
    <div className="w-full max-w-2xl border border-terminal-green bg-terminal-black p-4 relative shadow-[0_0_20px_rgba(0,255,0,0.1)]">
      {/* Enemy Status */}
      <div className="mb-8 relative">
        <div className="flex justify-between items-end mb-2">
          <div className="text-xl font-bold">{battleState.enemy.name}</div>
          <div className="text-xl">{battleState.enemy.hp} / {battleState.enemy.maxHp} HP</div>
        </div>
        <div className="w-full bg-terminal-darkGreen h-4">
          <div 
            className="bg-terminal-red h-full transition-all duration-300" 
            style={{ width: `${(battleState.enemy.hp / battleState.enemy.maxHp) * 100}%` }}
          />
        </div>
        {/* Weak Letters Display */}
        {battleState.enemy.weakLetters && battleState.enemy.weakLetters.length > 0 && (
          <div className="mt-2 text-sm text-terminal-yellow animate-pulse">
            WEAK: {battleState.enemy.weakLetters.join(' ')}
          </div>
        )}
      </div>

      {/* Battle Log */}
      <div className="h-32 overflow-y-auto border-t border-b border-terminal-darkGreen py-2 mb-4 font-mono text-sm space-y-1 scrollbar-thin">
        {battleState.log.slice().reverse().map((log, i) => (
          <div key={i} className="opacity-80">&gt; {t(log.key, log.params)}</div>
        ))}
      </div>

      {/* Player Action Area */}
      {battleState.turn === 'player' && !battleState.isFinished && (
        <div className="flex flex-col items-center relative">
          {currentWord && !showSkills && (
            <>
              <div className="text-terminal-green opacity-70 mb-1 text-lg">
                {language === 'ja' ? currentWord.ja : currentWord.en}
              </div>
              <TypingInput 
                targetWord={currentWord.target}
                onComplete={handleTypingComplete}
              />
              
              <button 
                onClick={() => setShowSkills(true)}
                className="mt-4 text-xs border border-terminal-green px-2 py-1 hover:bg-terminal-green hover:text-terminal-black transition-colors"
              >
                [ SKILLS ]
              </button>
            </>
          )}

          {showSkills && (
            <div className="w-full grid grid-cols-2 gap-2">
              <div className="col-span-2 flex justify-between items-center mb-2">
                <span className="font-bold">SELECT SKILL</span>
                <button onClick={() => setShowSkills(false)} className="text-sm hover:text-terminal-green/70">[CANCEL]</button>
              </div>
              {SKILLS.map(skill => {
                const canAfford = (battleState.player.en || 0) >= skill.cost;
                return (
                  <button
                    key={skill.id}
                    onClick={() => handleSkillUse(skill.id)}
                    disabled={!canAfford}
                    className={`border p-2 text-left flex justify-between items-center ${canAfford ? 'border-terminal-green hover:bg-terminal-green/10' : 'border-gray-700 text-gray-700 cursor-not-allowed'}`}
                  >
                    <div>
                      <div className="font-bold">{skill.name}</div>
                      <div className="text-xs opacity-70">{skill.description}</div>
                    </div>
                    <div className="text-sm">{skill.cost} EN</div>
                  </button>
                );
              })}
            </div>
          )}
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
  );
};
