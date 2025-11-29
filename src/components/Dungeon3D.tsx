import { useMemo } from 'react';
import { DungeonMap, CellType } from '../systems/dungeonGenerator';
import { SYMBOLS } from '../data/symbols';

export type Direction = 0 | 1 | 2 | 3; // 0:N, 1:E, 2:S, 3:W

interface Dungeon3DProps {
  map: DungeonMap;
  playerPos: { x: number; y: number };
  direction: Direction;
}

// View configuration
const VIEW_DEPTH = 6;
const VIEW_WIDTH = 60;
const VIEW_HEIGHT = 20;

export const Dungeon3D = ({ map, playerPos, direction }: Dungeon3DProps) => {
  
  const renderView = useMemo(() => {
    // Initialize buffer
    const buffer: string[][] = Array(VIEW_HEIGHT).fill(null).map(() => Array(VIEW_WIDTH).fill(' '));

    // Helper to set char in buffer
    const setChar = (x: number, y: number, char: string) => {
      if (x >= 0 && x < VIEW_WIDTH && y >= 0 && y < VIEW_HEIGHT) {
        buffer[y][x] = char;
        // Color handling could be added here if we use spans, but for now just chars
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

    // Render from back to front (Painter's algorithm)
    for (let depth = VIEW_DEPTH; depth >= 0; depth--) {
      // Calculate perspective scale
      // Depth 0 is player pos, Depth 1 is 1 step ahead
      // We want depth 0 to be full screen (or close to it), depth VIEW_DEPTH to be small
      
      // Simple perspective projection
      // Wall height at depth z: H / (z + 1)
      
      const wallHeight = Math.floor(VIEW_HEIGHT / (depth * 0.5 + 1));

      
      const centerY = Math.floor(VIEW_HEIGHT / 2);
      const centerX = Math.floor(VIEW_WIDTH / 2);
      
      // Render walls for left (-1), center (0), right (1)
      // We render wider range for closer depths to cover peripheral vision
      const range = depth === 0 ? 1 : 2;

      for (let offset = -range; offset <= range; offset++) {
        const cell = getCell(depth, offset);
        
        // Calculate screen position for this cell
        // Offset 0 is center. Offset -1 is left.
        // We need to project the offset based on depth too.
        
        // Perspective spread: offset * (Width / (depth + 1))
        const spread = Math.floor(VIEW_WIDTH / (depth * 0.8 + 1)); 
        const cellCenterX = centerX + offset * spread;
        
        const cellLeft = cellCenterX - Math.floor(spread / 2);
        const cellRight = cellLeft + spread;
        const cellTop = centerY - Math.floor(wallHeight / 2);
        const cellBottom = cellTop + wallHeight;
        
        // Clip to screen
        // If it's a wall, draw it
        if (cell === 'wall' || cell === 'out') {
          // Draw wall face
          // Different shading for depth
          const shade = depth > 4 ? '#' : depth > 2 ? '=' : '|';
          
          // Only draw if visible (simple occlusion is handled by painter's algo order)
          // But we need to be careful not to overwrite closer objects if we draw back to front.
          // Actually, Painter's algorithm means we draw BACK first, then FRONT.
          // So we overwrite.
          
          // Draw wall rect
          // We need to fill the area
          for (let y = Math.max(0, cellTop); y < Math.min(VIEW_HEIGHT, cellBottom); y++) {
            for (let x = Math.max(0, cellLeft); x < Math.min(VIEW_WIDTH, cellRight); x++) {
              // Add some texture
              const isEdge = x === cellLeft || x === cellRight - 1 || y === cellTop || y === cellBottom - 1;
              buffer[y][x] = isEdge ? '#' : shade;
            }
          }
        } else {
          // It's a floor/passage.
          // Draw Symbols
          let symbolArt: string[] = [];
          
          if (cell === 'enemy') {
            symbolArt = SYMBOLS.enemy_bug.asciiArt;
          } else if (cell === 'shop') {
            symbolArt = SYMBOLS.shop.asciiArt;
          } else if (cell === 'exit') {
            symbolArt = SYMBOLS.stairs.asciiArt;
          }

          if (symbolArt.length > 0) {
            if (depth > 3) {
               // Far away, draw single char
               const char = cell === 'enemy' ? 'E' : cell === 'shop' ? '$' : '>';
               const cx = Math.floor((cellLeft + cellRight) / 2);
               const cy = Math.floor((cellTop + cellBottom) / 2);
               setChar(cx, cy, char);
            } else {
               // Close enough, draw AA
               const artHeight = symbolArt.length;
               const artWidth = symbolArt[0].length;
               
               const startY = centerY - Math.floor(artHeight / 2) + Math.floor(depth * 1);
               const startX = cellCenterX - Math.floor(artWidth / 2);
               
               for (let r = 0; r < artHeight; r++) {
                 for (let c = 0; c < artWidth; c++) {
                   const ch = symbolArt[r][c];
                   if (ch !== ' ') {
                     setChar(startX + c, startY + r, ch);
                   }
                 }
               }
            }
          }
        }
      }
    }
    
    // Convert buffer to string
    return buffer.map(row => row.join('')).join('\n');
  }, [map, playerPos, direction]);

  return (
    <div className="inline-block p-2 bg-black terminal-border">
      <pre className="font-mono text-lg leading-none whitespace-pre text-terminal-green">
        {renderView}
      </pre>
    </div>
  );
};
