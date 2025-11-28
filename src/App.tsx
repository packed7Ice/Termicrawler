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

import { StorageUtils, GameSaveData } from './utils/storage';

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
  const { t, toggleLanguage } = useI18n();
  const [gameState, setGameState] = useState<GameState>('title');
  const [showShop, setShowShop] = useState(false);
  const [showWordFilter, setShowWordFilter] = useState(false);
  const [showSystemMenu, setShowSystemMenu] = useState(false);
  const [exclusionRemaining, setExclusionRemaining] = useState(0);
  // excludedWords is now part of player state (blockedWords)
  const [floor, setFloor] = useState(1);
  const [player, setPlayer] = useState(INITIAL_PLAYER);
  const [dungeon, setDungeon] = useState<DungeonMap | null>(null);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [gameLog, setGameLog] = useState<string[]>(['System initialized.', 'Dungeon generated.']);

  const addLog = (message: string) => {
    setGameLog(prev => [...prev, message]);
  };
  
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
    setShowSystemMenu(false);
  };

  const getCurrentSaveData = (): GameSaveData => ({
    floor,
    player,
    seed: Date.now(),
    settings: { language: 'ja' },
    timestamp: Date.now()
  });

  const [hasSaveData, setHasSaveData] = useState(false);

  useEffect(() => {
    setHasSaveData(StorageUtils.hasSave());
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (gameState !== 'dungeon' && gameState !== 'battle') return;

    const interval = setInterval(() => {
      StorageUtils.save(getCurrentSaveData());
      addLog('Game auto-saved.');
    }, 30000);

    return () => clearInterval(interval);
  }, [gameState, floor, player]);

  const handleContinue = () => {
    const data = StorageUtils.load();
    if (data) {
      handleLoad(data);
    }
  };

  const [selectedTitleIndex, setSelectedTitleIndex] = useState(0);

  // Movement & Global Keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // System Menu Toggle
      if (e.key === 'm' || e.key === 'M') {
        if (!showShop && !showWordFilter && gameState !== 'battle') {
          setShowSystemMenu(prev => !prev);
        }
        return;
      }

      // Language Toggle
      if (e.key === 'l' || e.key === 'L') {
        if (!showShop && !showWordFilter && !showSystemMenu && gameState !== 'battle') {
          toggleLanguage();
        }
        return;
      }

      // Title Screen Navigation
      if (gameState === 'title') {
        if (e.key === 'ArrowUp') {
          setSelectedTitleIndex(prev => Math.max(0, prev - 1));
        } else if (e.key === 'ArrowDown') {
          setSelectedTitleIndex(prev => Math.min(1, prev + 1));
        } else if (e.key === 'Enter') {
          if (selectedTitleIndex === 0) {
            handleStart();
          } else if (selectedTitleIndex === 1 && hasSaveData) {
            handleContinue();
          }
        }
        return;
      }

      // Game Over Navigation
      if (gameState === 'gameover') {
        if (e.key === 'Enter') {
          setGameState('title');
        }
        return;
      }



      if (gameState !== 'dungeon' || showShop || showWordFilter || showSystemMenu) return;

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

      // Shop check
      if (dungeon.grid[newY][newX] === 'shop') {
        setShowShop(true);
      }

      // Random Encounter (5% chance)
      if (Math.random() < 0.05) {
        startBattle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, dungeon, playerPos, floor, initDungeon, showShop, showWordFilter, showSystemMenu, selectedTitleIndex]);

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
      hp: 25 + floor * 10, // Nerfed from 30 + floor * 15
      maxHp: 25 + floor * 10,
      atk: 6 + floor * 2, // Nerfed from 8 + floor * 3
      isPlayer: false,
      weakLetters: weakLetters
    };
    
    const playerBattler: Battler = {
      ...player,
      name: 'Player',
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
          addLog(`LEVEL UP! Lv.${newLevel} (HP+10, EN+5, ATK+2)`);
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
    if ((player.credits || 0) < cost) return;

    // Special handling for word exclusion
    if (itemType === 'action' && itemId === 'exclude_word') {
      setPlayer(prev => ({
        ...prev,
        credits: (prev.credits || 0) - cost
      }));
      setShowShop(false);
      setExclusionRemaining(3); // Allow 3 words
      setShowWordFilter(true);
      addLog(`Purchased: Word Exclusion x3 (-${cost} CR)`);
      return;
    }

    setPlayer(prev => {
      const newCredits = (prev.credits || 0) - cost;
      let newHp = prev.hp;
      let newEn = prev.en || 0;
      const newTraits = { ...(prev.traits || {}) };
      let logMsg = '';

      if (itemType === 'item') {
        if (itemId === 'hp_restore') {
          newHp = Math.min(prev.maxHp, newHp + 50);
          logMsg = 'HP Restore';
        } else if (itemId === 'en_restore') {
          newEn = Math.min(prev.maxEn || 30, newEn + 30);
          logMsg = 'EN Restore';
        }
      } else if (itemType === 'trait') {
        // Upgrade trait level
        newTraits[itemId] = (newTraits[itemId] || 0) + 1;
        logMsg = `Trait Upgrade: ${itemId}`;
      }

      if (logMsg) addLog(`Purchased: ${logMsg} (-${cost} CR)`);

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
          {/* Filter button removed - accessed via Shop now */}
        </div>
      </header>

      <main className="flex-1 flex gap-4 relative">
        {gameState === 'title' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-terminal-black">
            <div className="text-6xl font-bold mb-8 animate-pulse text-terminal-green">TERMICRAWLER</div>
            <div className="space-y-4 w-64">
              <button 
                onClick={handleStart} 
                className={`terminal-btn w-full text-lg py-2 focus:outline-none focus:ring-2 focus:ring-terminal-green ${selectedTitleIndex === 0 ? 'bg-terminal-green text-terminal-black ring-2 ring-terminal-green' : ''}`}
                onMouseEnter={() => setSelectedTitleIndex(0)}
              >
                {selectedTitleIndex === 0 && '> '}{t('common.start')}
              </button>
              <button 
                onClick={handleContinue}
                disabled={!hasSaveData}
                className={`terminal-btn w-full text-lg py-2 ${!hasSaveData ? 'opacity-50 cursor-not-allowed' : ''} ${selectedTitleIndex === 1 ? 'bg-terminal-green text-terminal-black ring-2 ring-terminal-green' : ''}`}
                onMouseEnter={() => setSelectedTitleIndex(1)}
              >
                {selectedTitleIndex === 1 && '> '}{t('common.continue')}
              </button>
            </div>
            <div className="mt-8 text-sm opacity-50">PRESS ENTER TO SELECT</div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-terminal-black/90">
            <div className="text-6xl font-bold mb-8 text-terminal-red">CONNECTION LOST</div>
            <button 
              onClick={() => setGameState('title')} 
              className="terminal-btn text-lg py-2 px-8 focus:outline-none focus:ring-2 focus:ring-terminal-green"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') setGameState('title');
              }}
            >
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
                  excludedWords={player.blockedWords || []}
                  isPaused={showSystemMenu}
                />
              )}

              {/* Shop button removed */}
            </div>

            <div className="w-80 flex flex-col gap-4">
              <StatusPanel 
                hp={gameState === 'battle' && battleState ? battleState.player.hp : player.hp} 
                maxHp={gameState === 'battle' && battleState ? battleState.player.maxHp : player.maxHp} 
                en={gameState === 'battle' && battleState ? (battleState.player.en || 0) : (player.en || 30)}
                maxEn={gameState === 'battle' && battleState ? (battleState.player.maxEn || 30) : (player.maxEn || 30)}
                floor={floor} 
                level={player.level || 1} 
                exp={player.exp || 0} 
                credits={player.credits || 0}
                atk={player.atk}
              />
              
              <div className="terminal-border p-4 flex-1">
                <h3 className="border-b border-terminal-green mb-2">LOG</h3>
                <div className="text-sm opacity-70 space-y-1 h-48 overflow-y-auto scrollbar-thin flex flex-col-reverse">
                  {gameLog.slice().reverse().map((log, i) => (
                    <div key={i}>&gt; {log}</div>
                  ))}
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
            excludedWords={player.blockedWords || []}
            remaining={exclusionRemaining}
            onSelectWord={(word) => {
              setPlayer(prev => ({
                ...prev,
                blockedWords: [...(prev.blockedWords || []), word]
              }));
              setExclusionRemaining(prev => {
                const next = prev - 1;
                if (next <= 0) {
                  setShowWordFilter(false);
                }
                return next;
              });
            }}
            onClose={() => {
              setShowWordFilter(false);
              setExclusionRemaining(0);
            }}
          />
        )}
      </main>

      <button 
        onClick={() => setShowSystemMenu(true)}
        className="fixed bottom-4 right-4 z-40 terminal-btn text-sm"
      >
        SYSTEM [M]
      </button>

      <SaveLoadPanel 
        currentData={getCurrentSaveData()} 
        onLoad={handleLoad} 
        isOpen={showSystemMenu}
        onClose={() => setShowSystemMenu(false)}
      />
    </div>
  );
}

export default App;
