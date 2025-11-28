import { useState, useEffect, useCallback } from 'react';
import { DungeonGenerator, DungeonMap } from './systems/dungeonGenerator';
import { BattleSystem, BattleState, Battler } from './systems/battleSystem';
import { Dungeon } from './components/Dungeon';
import { Battle } from './components/Battle';
import { StatusPanel } from './components/StatusPanel';
import { LanguageToggle } from './components/LanguageToggle';
import { Shop } from './components/Shop';
import { WordFilter } from './components/WordFilter';
import { SaveLoadPanel } from './components/SaveLoadPanel';
import { useI18n } from './hooks/useI18n';

type GameState = 'title' | 'dungeon' | 'battle' | 'gameover';

import { GameSaveData } from './utils/storage';

const INITIAL_PLAYER: Battler = {
  name: 'Player',
  hp: 100,
  maxHp: 100,
  en: 30,
  maxEn: 30,
  atk: 10,
  level: 1,
  exp: 0,
  credits: 0,
  isPlayer: true,
  traits: {}
};

function App() {
  const { t } = useI18n();
  const [gameState, setGameState] = useState<GameState>('title');
  const [showShop, setShowShop] = useState(false);
  const [showWordFilter, setShowWordFilter] = useState(false);
  const [excludedWords, setExcludedWords] = useState<string[]>([]);
  
  // Game Data
  const [floor, setFloor] = useState(1);
  const [player, setPlayer] = useState(INITIAL_PLAYER);
  const [dungeon, setDungeon] = useState<DungeonMap | null>(null);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  
  // Battle Data
  const [battleState, setBattleState] = useState<BattleState | null>(null);

  // Init Dungeon
  const initDungeon = useCallback((level: number) => {
    const map = DungeonGenerator.generate(30, 20, Date.now() + level);
    setDungeon(map);
    setPlayerPos(map.startPos);
    setFloor(level);
  }, []);

  const handleStart = () => {
    setPlayer(INITIAL_PLAYER);
    initDungeon(1);
    setGameState('dungeon');
  };

  const handleLoad = (data: GameSaveData) => {
    setFloor(data.floor);
    setPlayer(data.player);
    initDungeon(data.floor); 
    setGameState('dungeon');
  };

  const getCurrentSaveData = (): GameSaveData => ({
    floor,
    player,
    seed: Date.now(),
    settings: { language: 'ja' },
    timestamp: Date.now()
  });

  // Movement
  useEffect(() => {
    if (gameState !== 'dungeon' || showShop) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!dungeon) return;

      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowUp' || e.key === 'w') dy = -1;
      if (e.key === 'ArrowDown' || e.key === 's') dy = 1;
      if (e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
      if (e.key === 'ArrowRight' || e.key === 'd') dx = 1;

      if (dx === 0 && dy === 0) return;

      const newX = playerPos.x + dx;
      const newY = playerPos.y + dy;

      // Wall collision
      if (
        newX < 0 || newX >= dungeon.width ||
        newY < 0 || newY >= dungeon.height ||
        dungeon.grid[newY][newX] === 'wall'
      ) {
        return;
      }

      setPlayerPos({ x: newX, y: newY });

      // Exit check
      if (dungeon.grid[newY][newX] === 'exit') {
        initDungeon(floor + 1);
      }

      // Random Encounter (10% chance)
      if (Math.random() < 0.05) {
        startBattle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, dungeon, playerPos, floor, initDungeon, showShop]);

  const startBattle = () => {
    // Generate 1-3 random weak letters
    const possibleLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const weakLettersCount = Math.floor(Math.random() * 3) + 1;
    const weakLetters: string[] = [];
    for (let i = 0; i < weakLettersCount; i++) {
      const char = possibleLetters[Math.floor(Math.random() * possibleLetters.length)];
      if (!weakLetters.includes(char)) {
        weakLetters.push(char);
      }
    }

    const enemy: Battler = {
      name: `Bug v${floor}.0`,
      hp: 20 + floor * 10,
      maxHp: 20 + floor * 10,
      atk: 5 + floor * 2,
      isPlayer: false,
      weakLetters: weakLetters
    };
    
    const playerBattler: Battler = {
      ...player,
      name: 'Player', // Ensure name is set, overwriting if necessary, or just use player.name if it exists
      isPlayer: true
    };

    setBattleState(BattleSystem.init(playerBattler, enemy));
    setGameState('battle');
  };

  const getNextLevelExp = (level: number) => {
    return Math.floor(50 * Math.pow(1.2, level - 1));
  };

  const handleBattleEnd = (winner: 'player' | 'enemy', finalHp: number, finalEn: number) => {
    if (winner === 'player') {
      const expGain = 10 + (floor * 2);
      
      setPlayer(prev => {
        let newExp = (prev.exp || 0) + expGain;
        let newLevel = prev.level || 1;
        let newMaxHp = prev.maxHp;
        let newMaxEn = prev.maxEn || 30;
        let newAtk = prev.atk;
        let newHp = finalHp;
        let newEn = finalEn;
        let leveledUp = false;

        let nextLevelExp = getNextLevelExp(newLevel);

        while (newExp >= nextLevelExp) {
          newExp -= nextLevelExp;
          newLevel++;
          newMaxHp += 10;
          newMaxEn += 5;
          newAtk += 2;
          leveledUp = true;
          nextLevelExp = getNextLevelExp(newLevel);
        }

        if (leveledUp) {
          newHp = newMaxHp;
          newEn = newMaxEn;
        } else {
          newHp = Math.min(newMaxHp, newHp + 5);
          newEn = Math.min(newMaxEn, newEn + 2);
        }

        return {
          ...prev,
          hp: newHp,
          maxHp: newMaxHp,
          en: newEn,
          maxEn: newMaxEn,
          atk: newAtk,
          level: newLevel,
          exp: newExp,
          credits: (prev.credits || 0) + 10 + (floor * 5)
        };
      });
      setGameState('dungeon');
    } else {
      setGameState('gameover');
    }
  };

  const handlePurchase = (cost: number, itemType: string, itemId: string) => {
    setPlayer(prev => {
      if ((prev.credits || 0) < cost) return prev; // Not enough credits

      const newCredits = (prev.credits || 0) - cost;
      let newHp = prev.hp;
      let newEn = prev.en || 0;
      const newTraits = { ...(prev.traits || {}) };

      if (itemType === 'item') {
        if (itemId === 'hp_restore') {
          newHp = Math.min(prev.maxHp, newHp + 50);
        } else if (itemId === 'en_restore') {
          newEn = Math.min(prev.maxEn || 30, newEn + 30);
        }
      } else if (itemType === 'trait') {
        // Upgrade trait level
        newTraits[itemId] = (newTraits[itemId] || 0) + 1;
      }

      return {
        ...prev,
        hp: newHp,
        en: newEn,
        credits: newCredits,
        traits: newTraits
      };
    });
  };

  return (
    <div className="min-h-screen bg-terminal-black text-terminal-green p-4 flex flex-col font-mono selection:bg-terminal-green selection:text-terminal-black">
      <LanguageToggle />
      
      <header className="mb-4 border-b border-terminal-darkGreen pb-2">
        <div className="flex justify-between items-end">
          <h1 className="text-5xl font-bold tracking-tighter">
            TERMICRAWLER <span className="text-sm font-normal opacity-50">v1.0.0</span>
          </h1>
        </div>
        <div className="text-xs opacity-70 text-right mt-1">SYSTEM: ONLINE</div>
        <div className="absolute top-0 right-0 mt-2 mr-2 flex gap-2">
          <button 
            onClick={() => setShowWordFilter(true)}
            className="text-xs border border-terminal-green px-2 py-1 hover:bg-terminal-green hover:text-terminal-black transition-colors"
          >
            FILTER
          </button>
        </div>
      </header>

      <main className="flex-1 flex gap-4 relative">
        {gameState === 'title' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-terminal-black">
            <div className="text-6xl font-bold mb-8 animate-pulse text-terminal-green">TERMICRAWLER</div>
            <div className="space-y-4 w-64">
              <button onClick={handleStart} className="terminal-btn w-full text-lg py-2">
                {t('common.start')}
              </button>
              <button className="terminal-btn w-full text-lg py-2 opacity-50 cursor-not-allowed">
                {t('common.continue')}
              </button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-terminal-black/90">
            <div className="text-6xl font-bold mb-8 text-terminal-red">CONNECTION LOST</div>
            <button onClick={() => setGameState('title')} className="terminal-btn text-lg py-2 px-8">
              REBOOT SYSTEM
            </button>
          </div>
        )}

        {(gameState === 'dungeon' || gameState === 'battle') && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center relative">
              {gameState === 'dungeon' && dungeon && (
                <Dungeon map={dungeon} playerPos={playerPos} />
              )}
              
              {gameState === 'battle' && battleState && (
                <Battle 
                  battleState={battleState} 
                  onBattleUpdate={setBattleState}
                  onBattleEnd={handleBattleEnd}
                  excludedWords={excludedWords}
                />
              )}

              {gameState === 'dungeon' && !showShop && (
                <div className="absolute bottom-4 right-4">
                  <button 
                    onClick={() => setShowShop(true)}
                    className="terminal-btn px-4 py-2"
                  >
                    OPEN SHOP
                  </button>
                </div>
              )}
            </div>

            <div className="w-80 flex flex-col gap-4">
              <StatusPanel 
                hp={gameState === 'battle' && battleState ? battleState.player.hp : player.hp} 
                maxHp={gameState === 'battle' && battleState ? battleState.player.maxHp : player.maxHp} 
                en={player.en || 30}
                maxEn={player.maxEn || 30}
                floor={floor} 
                level={player.level || 1} 
                exp={player.exp || 0} 
                credits={player.credits || 0}
              />
              
              <div className="terminal-border p-4 flex-1">
                <h3 className="border-b border-terminal-green mb-2">LOG</h3>
                <div className="text-sm opacity-70 space-y-1">
                  <div>&gt; System initialized.</div>
                  <div>&gt; Dungeon generated.</div>
                  {gameState === 'battle' && <div>&gt; Combat mode engaged.</div>}
                </div>
              </div>
            </div>
          </>
        )}

        {showShop && (
          <Shop 
            credits={player.credits || 0} 
            onClose={() => setShowShop(false)}
            onPurchase={handlePurchase}
          />
        )}

        {showWordFilter && (
          <WordFilter 
            excludedWords={excludedWords}
            onUpdateExcludedWords={setExcludedWords}
            onClose={() => setShowWordFilter(false)}
          />
        )}
      </main>

      <SaveLoadPanel currentData={getCurrentSaveData()} onLoad={handleLoad} />
    </div>
  );
}

export default App;
