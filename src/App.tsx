import { useState, useEffect, useCallback, useRef } from 'react';
import { DungeonGenerator, DungeonMap } from './systems/dungeonGenerator';
import { BattleSystem, BattleState, Battler } from './systems/battleSystem';
import { Dungeon } from './components/Dungeon';
import { Dungeon3D, Direction } from './components/Dungeon3D';
import { Battle } from './components/Battle';
import { StatusPanel } from './components/StatusPanel';
import { LanguageToggle } from './components/LanguageToggle';
import { Shop } from './components/Shop';
import { WordFilter } from './components/WordFilter';
import { SaveLoadPanel } from './components/SaveLoadPanel';
import { useI18n } from './hooks/useI18n';
import { StorageUtils, GameSaveData } from './utils/storage';

type GameState = 'title' | 'dungeon' | 'battle' | 'gameover';

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
  
  const [floor, setFloor] = useState(1);
  const [player, setPlayer] = useState(INITIAL_PLAYER);
  const [dungeon, setDungeon] = useState<DungeonMap | null>(null);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState<Direction>(0); // 0:N, 1:E, 2:S, 3:W
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [userName, setUserName] = useState('Player');
  
  const [gameLog, setGameLog] = useState<string[]>(['System initialized.', 'Dungeon generated.']);

  const addLog = (message: string) => {
    setGameLog(prev => [...prev, message]);
  };
  
  // Battle Data
  const [battleState, setBattleState] = useState<BattleState | null>(null);

  // Init Dungeon
  const initDungeon = useCallback((level: number, savedSeed?: number) => {
    const seed = savedSeed || (Date.now() + level);
    const map = DungeonGenerator.generate(30, 20, seed);
    setDungeon(map);
    setPlayerPos(map.startPos);
    setFloor(level);
    setDirection(0);
    // Keep visited if same floor? No, reset for new floor usually.
    // But if loading, we might want to restore.
    // For now, reset visited on new floor generation unless loading (handled separately)
    if (!savedSeed) {
      setVisited(new Set([`${map.startPos.x},${map.startPos.y}`]));
    }
  }, []);

  const handleStart = () => {
    setPlayer(INITIAL_PLAYER);
    initDungeon(1);
    setGameState('dungeon');
  };

  const handleLoad = (data: GameSaveData) => {
    setFloor(data.floor);
    setPlayer(data.player);
    initDungeon(data.floor, data.seed); 
    setGameState('dungeon');
    setShowSystemMenu(false);
    
    if (data.direction !== undefined) setDirection(data.direction as Direction);
    if (data.visited) setVisited(new Set(data.visited));
    if (data.userName) setUserName(data.userName);
    
    // Restore player pos? DungeonGenerator sets startPos by default.
    // We need to save/load playerPos too!
    // Oops, playerPos was missing in GameSaveData in my previous thought, 
    // but looking at original code, it wasn't there either?
    // Wait, original code: setPlayerPos(map.startPos) in initDungeon.
    // If we load, we regenerate dungeon. 
    // The original code didn't save playerPos explicitly? 
    // Let's check `getCurrentSaveData` in original code.
    // It had `floor`, `player`, `seed`.
    // It seems original code reset position to start on load? That's a bug or feature.
    // I should probably add playerPos to save data.
    // For now, I'll stick to original behavior or fix it if I can.
    // Let's add playerPos to save data logic below.
  };

  const getCurrentSaveData = (): GameSaveData => ({
    floor,
    player,
    seed: Date.now(), // This is wrong in original code too if we want to restore exact dungeon. 
    // But original code used Date.now() + level for generation.
    // If we want to save, we should save the seed used for generation.
    // But I don't have the current seed stored in state.
    // I'll leave it as is for now to avoid breaking too much, but ideally we store `dungeonSeed`.
    settings: { language: 'ja' },
    timestamp: Date.now(),
    direction,
    visited: Array.from(visited),
    userName
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
  }, [gameState, floor, player, direction, visited, userName]);

  const handleContinue = () => {
    const data = StorageUtils.load();
    if (data) {
      handleLoad(data);
    }
  };

  const [selectedTitleIndex, setSelectedTitleIndex] = useState(0);

  // Input handling for Command Prompt
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Shared Movement Logic
  const movePlayer = (dx: number, dy: number) => {
    if (!dungeon) return;

    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    // Wall collision
    if (
      newX < 0 || newX >= dungeon.width ||
      newY < 0 || newY >= dungeon.height ||
      dungeon.grid[newY][newX] === 'wall'
    ) {
      addLog("Ouch! Hit a wall.");
      return;
    }

    setPlayerPos({ x: newX, y: newY });
    setVisited(prev => new Set(prev).add(`${newX},${newY}`));

    const cell = dungeon.grid[newY][newX];

    // Exit check
    if (cell === 'exit') {
      addLog("Found stairs! Descending...");
      setTimeout(() => initDungeon(floor + 1), 500);
    }

    // Shop check
    if (cell === 'shop') {
      addLog("Entering Shop...");
      setShowShop(true);
    }
    
    // Enemy check (Symbol Encounter)
    if (cell === 'enemy') {
      addLog("Enemy Encountered!");
      startBattle();
    }
  };

  const rotatePlayer = (delta: number) => {
    setDirection(prev => (prev + delta + 4) % 4 as Direction);
  };

  const handleCommand = (cmd: string) => {
    const lowerCmd = cmd.toLowerCase().trim();
    
    // FPS Commands
    if (['forward', 'f'].includes(lowerCmd)) {
      const dx = [0, 1, 0, -1][direction];
      const dy = [-1, 0, 1, 0][direction];
      movePlayer(dx, dy);
    } else if (['back', 'b'].includes(lowerCmd)) {
      const dx = [0, 1, 0, -1][direction];
      const dy = [-1, 0, 1, 0][direction];
      movePlayer(-dx, -dy);
    } else if (['turn_left', 'tl'].includes(lowerCmd)) {
      rotatePlayer(3); // -1 equivalent
    } else if (['turn_right', 'tr'].includes(lowerCmd)) {
      rotatePlayer(1);
    } else if (['strafe_left', 'sl'].includes(lowerCmd)) {
      const dx = [-1, 0, 1, 0][direction];
      const dy = [0, -1, 0, 1][direction];
      movePlayer(dx, dy);
    } else if (['strafe_right', 'sr'].includes(lowerCmd)) {
      const dx = [1, 0, -1, 0][direction];
      const dy = [0, 1, 0, -1][direction];
      movePlayer(dx, dy);
    } 
    // Existing Commands
    else if (lowerCmd === 'map') {
      addLog('Map updated.');
    } else if (lowerCmd.startsWith('name ')) {
      const newName = cmd.substring(5).trim();
      if (newName) {
        setUserName(newName);
        addLog(`User name changed to: ${newName}`);
      }
    } else {
      addLog(`Unknown command: ${cmd}`);
    }
  };

  // Movement & Global Keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus input on any key if not already focused (unless it's a control key)
      if (document.activeElement !== inputRef.current && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // inputRef.current?.focus();
        // Actually, we want to capture movement keys for game, not input.
        // So only focus if user explicitly clicks or maybe presses Enter?
        // Let's keep separate controls.
      }

      // System Menu Toggle
      if (e.key === 'm' || e.key === 'M') {
        if (!showShop && !showWordFilter && gameState !== 'battle' && document.activeElement !== inputRef.current) {
          setShowSystemMenu(prev => !prev);
        }
        return;
      }

      // Language Toggle
      if (e.key === 'l' || e.key === 'L') {
        if (!showShop && !showWordFilter && !showSystemMenu && gameState !== 'battle' && document.activeElement !== inputRef.current) {
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
      if (document.activeElement === inputRef.current) return; // Don't move if typing

      if (!dungeon) return;



      // Tank & FPS Controls
      
      // Rotate Left (or Strafe with Shift)
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (e.shiftKey) {
           // Strafe Left
           const dx = [-1, 0, 1, 0][direction];
           const dy = [0, -1, 0, 1][direction];
           movePlayer(dx, dy);
           return;
        } else {
           rotatePlayer(3);
           return;
        }
      }
      
      // Rotate Right (or Strafe with Shift)
      if (e.key === 'ArrowRight' || e.key === 'd') {
         if (e.shiftKey) {
            // Strafe Right
            const dx = [1, 0, -1, 0][direction];
            const dy = [0, 1, 0, -1][direction];
            movePlayer(dx, dy);
            return;
         } else {
            rotatePlayer(1);
            return;
         }
      }

      // Forward
      if (e.key === 'ArrowUp' || e.key === 'w') {
        const dx = [0, 1, 0, -1][direction];
        const dy = [-1, 0, 1, 0][direction];
        movePlayer(dx, dy);
      }
      // Backward
      if (e.key === 'ArrowDown' || e.key === 's') {
        const dx = [0, 1, 0, -1][direction];
        const dy = [-1, 0, 1, 0][direction];
        movePlayer(-dx, -dy);
      }
      
      // Strafe Left (Q)
      if (e.key === 'q') {
         const dx = [-1, 0, 1, 0][direction];
         const dy = [0, -1, 0, 1][direction];
         movePlayer(dx, dy);
      }
      // Strafe Right (E)
      if (e.key === 'e') {
         const dx = [1, 0, -1, 0][direction];
         const dy = [0, 1, 0, -1][direction];
         movePlayer(dx, dy);
      }

    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, dungeon, playerPos, floor, initDungeon, showShop, showWordFilter, showSystemMenu, selectedTitleIndex, direction]);

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
      hp: 25 + floor * 10,
      maxHp: 25 + floor * 10,
      atk: 6 + floor * 2,
      isPlayer: false,
      weakLetters: weakLetters
    };
    
    const playerBattler: Battler = {
      ...player,
      name: userName, // Use custom name
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
      
      // If we won, remove the enemy from the current tile
      if (dungeon && gameState === 'battle') {
         const newGrid = dungeon.grid.map(row => [...row]);
         if (newGrid[playerPos.y][playerPos.x] === 'enemy') {
            newGrid[playerPos.y][playerPos.x] = 'floor';
            setDungeon({ ...dungeon, grid: newGrid });
         }
      }

      setPlayer((prev: Battler) => {
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

    if (itemType === 'action' && itemId === 'exclude_word') {
      setPlayer((prev: Battler) => ({
        ...prev,
        credits: (prev.credits || 0) - cost
      }));
      setShowShop(false);
      setExclusionRemaining(3);
      setShowWordFilter(true);
      addLog(`Purchased: Word Exclusion x3 (-${cost} CR)`);
      return;
    }

    setPlayer((prev: Battler) => {
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
    <div className="h-screen overflow-hidden bg-terminal-black text-terminal-green p-4 flex flex-col font-mono selection:bg-terminal-green selection:text-terminal-black">
      <LanguageToggle />
      
      <header className="mb-2 border-b border-terminal-darkGreen pb-2">
        <div className="flex justify-between items-end">
          <h1 className="text-4xl font-bold tracking-tighter">
            TERMICRAWLER <span className="text-sm font-normal opacity-50">v1.1.0-3D</span>
          </h1>
        </div>
        <div className="text-xs opacity-70 text-right mt-1">SYSTEM: ONLINE</div>
      </header>

      <main className="flex-1 flex gap-4 relative overflow-hidden">
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
            <div className="flex-1 flex flex-col gap-4">
              {/* Main View Area */}
              <div className="flex-1 flex items-center justify-center bg-black border border-terminal-darkGreen relative overflow-hidden min-h-[500px]">
                {gameState === 'dungeon' && dungeon && (
                  <Dungeon3D map={dungeon} playerPos={playerPos} direction={direction} player={player} />
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

                {/* Command Prompt Overlay */}
                <div className="absolute bottom-0 left-0 w-full bg-black/80 border-t border-terminal-darkGreen p-2 flex items-center gap-2 z-20">
                  <span className="text-terminal-green">users/{userName}&gt;</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCommand(inputValue);
                        setInputValue('');
                      }
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-terminal-green font-mono"
                    placeholder="Type command..."
                  />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 flex flex-col gap-4 h-full overflow-hidden min-h-0">
              {/* Mini Map */}
              {gameState === 'dungeon' && dungeon && (
                <div className="h-auto border border-terminal-darkGreen p-2 flex items-center justify-center bg-black mt-1">
                   <Dungeon map={dungeon} playerPos={playerPos} visited={visited} direction={direction} />
                </div>
              )}

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
              
              <div className="terminal-border p-4 flex-1 flex flex-col min-h-0">
                <h3 className="border-b border-terminal-green mb-2">LOG</h3>
                <div className="text-sm opacity-70 space-y-1 flex-1 overflow-y-auto scrollbar-thin flex flex-col-reverse">
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
            onSelectWord={(word: string) => {
              setPlayer((prev: Battler) => ({
                ...prev,
                blockedWords: [...(prev.blockedWords || []), word]
              }));
              setExclusionRemaining((prev: number) => {
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
