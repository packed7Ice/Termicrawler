import React, { useMemo } from 'react';
import { DungeonMap, CellType } from '../systems/dungeonGenerator';


export type Direction = 0 | 1 | 2 | 3; // 0:N, 1:E, 2:S, 3:W

import { Battler } from '../systems/battleSystem';

interface Dungeon3DProps {
  map: DungeonMap;
  playerPos: { x: number; y: number };
  direction: Direction;
  player: Battler;
}

// View configuration
const VIEW_DEPTH = 10; // Increased depth
const VIEW_WIDTH = 100; // Further increased width
const VIEW_HEIGHT = 30; // Further increased height

export const Dungeon3D = ({ map, playerPos, direction, player }: Dungeon3DProps) => {
  // Use a key to trigger CSS animation restart
  const [moveKey, setMoveKey] = React.useState(0);
  const prevPosRef = React.useRef(playerPos);

  // Trigger CSS animation on move
  React.useEffect(() => {
    if (prevPosRef.current.x !== playerPos.x || prevPosRef.current.y !== playerPos.y) {
      setMoveKey(prev => prev + 1);
      prevPosRef.current = playerPos;
    }
  }, [playerPos]);

  const renderView = useMemo(() => {
    // Initialize buffer
    const buffer: string[][] = Array(VIEW_HEIGHT).fill(null).map(() => Array(VIEW_WIDTH).fill(' '));

    // Helper to set char in buffer
    const setChar = (x: number, y: number, char: string) => {
      if (x >= 0 && x < VIEW_WIDTH && y >= 0 && y < VIEW_HEIGHT) {
        buffer[y][x] = char;
      }
    };

    // Helper to get cell at relative position
    const getCell = (depth: number, offset: number): CellType | 'out' => {
      let tx = playerPos.x;
      let ty = playerPos.y;

      // Forward movement based on direction
      const dx = [0, 1, 0, -1][direction];
      const dy = [-1, 0, 1, 0][direction];
      
      // Right vector for offset
      const rx = [1, 0, -1, 0][direction];
      const ry = [0, 1, 0, -1][direction];

      tx += dx * depth + rx * offset;
      ty += dy * depth + ry * offset;

      if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) return 'out';
      return map.grid[ty][tx];
    };

    // Helper to get screen coordinates for a cell face
    const getRect = (depth: number, offset: number) => {
      const wallHeight = Math.floor(VIEW_HEIGHT / (depth * 0.5 + 1));
      const spread = Math.floor(VIEW_WIDTH / (depth * 0.8 + 1));
      const centerY = Math.floor(VIEW_HEIGHT / 2);
      const centerX = Math.floor(VIEW_WIDTH / 2);
      
      const cellCenterX = centerX + offset * spread;
      const width = spread;
      const height = wallHeight;
      
      const left = cellCenterX - Math.floor(width / 2);
      const right = left + width;
      const top = centerY - Math.floor(height / 2);
      const bottom = top + height;
      
      return { left, right, top, bottom, width, height };
    };

    // Helper to draw a line
    const drawLine = (x0: number, y0: number, x1: number, y1: number, char: string) => {
      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      const sx = (x0 < x1) ? 1 : -1;
      const sy = (y0 < y1) ? 1 : -1;
      let err = dx - dy;

      while (true) {
        setChar(x0, y0, char);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
      }
    };

    // Render from back to front
    for (let depth = VIEW_DEPTH; depth >= 0; depth--) {
      // Render walls for left (-1), center (0), right (1)
      const range = depth === 0 ? 1 : 2;

      for (let offset = -range; offset <= range; offset++) {
        const cell = getCell(depth, offset);
        const rect = getRect(depth, offset);
        
        if (cell === 'wall' || cell === 'out') {
          // 1. Front Face (Occlusion Check)
          // Only draw front face if there is NO wall immediately in front of it (depth-1)
          const cellInFront = depth > 0 ? getCell(depth - 1, offset) : 'floor';
          const isOccluded = cellInFront === 'wall' || cellInFront === 'out';
          
          if (!isOccluded) {
             // Draw Front Face Edges
             // Top
             drawLine(rect.left, rect.top, rect.right - 1, rect.top, '-');
             // Bottom
             drawLine(rect.left, rect.bottom - 1, rect.right - 1, rect.bottom - 1, '-');
             // Left
             drawLine(rect.left, rect.top, rect.left, rect.bottom - 1, '|');
             // Right
             drawLine(rect.right - 1, rect.top, rect.right - 1, rect.bottom - 1, '|');
          }

          // 2. Side Faces (Connecting to depth-1)
          if (depth > 0) {
             const prevRect = getRect(depth - 1, offset);
             
             // Left Wall Side Face (Visible if offset < 0 and offset+1 is empty)
             // Actually, simpler: If I am a wall, and I am to the left (offset < 0), 
             // I should draw the connection to the previous depth on my RIGHT side?
             // No, if I am a wall at (-1), my RIGHT side faces the corridor (0).
             // So I connect my Right-Top to Prev-Right-Top.
             
             // Check if "Inner" side is visible
             let drawSide = false;
             let sideX = 0;
             let prevSideX = 0;
             let topChar = '';
             let bottomChar = '';

             if (offset < 0) { // Left Wall
                // Check if neighbor to right is empty (floor)
                const rightNeighbor = getCell(depth, offset + 1);
                if (rightNeighbor !== 'wall' && rightNeighbor !== 'out') {
                   drawSide = true;
                   sideX = rect.right - 1;
                   prevSideX = prevRect.right - 1;
                   topChar = '\\';
                   bottomChar = '/';
                }
             } else if (offset > 0) { // Right Wall
                // Check if neighbor to left is empty
                const leftNeighbor = getCell(depth, offset - 1);
                if (leftNeighbor !== 'wall' && leftNeighbor !== 'out') {
                   drawSide = true;
                   sideX = rect.left;
                   prevSideX = prevRect.left;
                   topChar = '/';
                   bottomChar = '\\';
                }
             }

             if (drawSide) {
                // Draw Top Edge
                drawLine(sideX, rect.top, prevSideX, prevRect.top, topChar);
                // Draw Bottom Edge
                drawLine(sideX, rect.bottom - 1, prevSideX, prevRect.bottom - 1, bottomChar);
                // Vertical at current depth is already drawn by Front Face or should be drawn here?
                // If Front Face was occluded, we didn't draw vertical.
                // So draw vertical at current depth
                drawLine(sideX, rect.top, sideX, rect.bottom - 1, '|');
             }
          }

        } else {
          // Draw Symbols (Enemies, etc)
          let symbolArt: string[] = [];
          
          if (cell === 'enemy') {
            symbolArt = ['/^^\\', '(@@)', '\\--/'];
          } else if (cell === 'shop') {
            symbolArt = ['[==]', '|$$|', '[==]'];
          } else if (cell === 'exit') {
            symbolArt = [' /\\ ', '/__\\', '|  |'];
          }

          if (symbolArt.length > 0) {
             if (depth < 6) {
                const artHeight = symbolArt.length;
                const artWidth = symbolArt[0].length;
                const startY = rect.top + Math.floor((rect.height - artHeight) / 2);
                const startX = rect.left + Math.floor((rect.width - artWidth) / 2);
                
                for (let r = 0; r < artHeight; r++) {
                  for (let c = 0; c < artWidth; c++) {
                    const ch = symbolArt[r][c];
                    if (ch !== ' ') {
                      setChar(startX + c, startY + r, ch);
                    }
                  }
                }
             } else {
                 setChar(rect.left + Math.floor(rect.width/2), rect.top + Math.floor(rect.height/2), cell === 'enemy' ? 'E' : '?');
             }
          }
        }
      }
    }
    
    // HUD Rendering
    const hudLines = [
      `HP: ${player.hp}/${player.maxHp}  EN: ${player.en || 0}/${player.maxEn || 30}  CR: ${player.credits || 0}`,
      `TRAITS: ${Object.keys(player.traits || {}).join(', ') || 'None'}`
    ];

    const hudBuffer = hudLines.map(line => {
      const padding = Math.max(0, VIEW_WIDTH - line.length);
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      return ' '.repeat(leftPad) + line + ' '.repeat(rightPad);
    });

    const viewString = buffer.map(row => row.join('')).join('\n');
    const hudString = hudBuffer.join('\n');
    
    return viewString + '\n' + '-'.repeat(VIEW_WIDTH) + '\n' + hudString;
  }, [map, playerPos, direction, player]);

  return (
    <div className="relative inline-block p-4 bg-black terminal-border overflow-hidden">
      <div className="scanline absolute inset-0 pointer-events-none"></div>
      <div className="crt-overlay absolute inset-0 pointer-events-none z-10"></div>
      <pre 
        key={moveKey}
        className="font-mono text-lg leading-none whitespace-pre text-terminal-green relative z-0 animate-head-bob" 
        style={{ textShadow: '0 0 5px rgba(0, 255, 0, 0.5)' }}
      >
        {renderView}
      </pre>
    </div>
  );
};
