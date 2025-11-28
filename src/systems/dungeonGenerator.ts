export type CellType = 'wall' | 'floor' | 'start' | 'exit';

export interface Position {
  x: number;
  y: number;
}

export interface DungeonMap {
  width: number;
  height: number;
  grid: CellType[][];
  startPos: Position;
  exitPos: Position;
  rooms: Room[];
}

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const DungeonGenerator = {
  generate: (width: number, height: number, seed: number): DungeonMap => {
    // Simple random generator based on seed (pseudo-random)
    const random = (min: number, max: number) => {
      const x = Math.sin(seed++) * 10000;
      return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
    };

    const grid: CellType[][] = Array(height).fill(null).map(() => Array(width).fill('wall'));
    const rooms: Room[] = [];
    const maxRooms = 10;
    const minRoomSize = 3;
    const maxRoomSize = 8;

    for (let i = 0; i < maxRooms; i++) {
      const w = random(minRoomSize, maxRoomSize);
      const h = random(minRoomSize, maxRoomSize);
      const x = random(1, width - w - 1);
      const y = random(1, height - h - 1);

      const newRoom: Room = { x, y, w, h };

      // Check collision
      let failed = false;
      for (const other of rooms) {
        if (
          newRoom.x <= other.x + other.w &&
          newRoom.x + newRoom.w >= other.x &&
          newRoom.y <= other.y + other.h &&
          newRoom.y + newRoom.h >= other.y
        ) {
          failed = true;
          break;
        }
      }

      if (!failed) {
        // Carve room
        for (let ry = 0; ry < h; ry++) {
          for (let rx = 0; rx < w; rx++) {
            grid[y + ry][x + rx] = 'floor';
          }
        }

        // Connect to previous room
        if (rooms.length > 0) {
          const prev = rooms[rooms.length - 1];
          const prevCenter = { x: Math.floor(prev.x + prev.w / 2), y: Math.floor(prev.y + prev.h / 2) };
          const newCenter = { x: Math.floor(newRoom.x + newRoom.w / 2), y: Math.floor(newRoom.y + newRoom.h / 2) };

          // Horizontal then Vertical
          if (random(0, 1) === 0) {
            for (let cx = Math.min(prevCenter.x, newCenter.x); cx <= Math.max(prevCenter.x, newCenter.x); cx++) {
              grid[prevCenter.y][cx] = 'floor';
            }
            for (let cy = Math.min(prevCenter.y, newCenter.y); cy <= Math.max(prevCenter.y, newCenter.y); cy++) {
              grid[cy][newCenter.x] = 'floor';
            }
          } else {
            // Vertical then Horizontal
            for (let cy = Math.min(prevCenter.y, newCenter.y); cy <= Math.max(prevCenter.y, newCenter.y); cy++) {
              grid[cy][prevCenter.x] = 'floor';
            }
            for (let cx = Math.min(prevCenter.x, newCenter.x); cx <= Math.max(prevCenter.x, newCenter.x); cx++) {
              grid[newCenter.y][cx] = 'floor';
            }
          }
        }

        rooms.push(newRoom);
      }
    }

    const startRoom = rooms[0];
    const exitRoom = rooms[rooms.length - 1];

    const startPos = { 
      x: Math.floor(startRoom.x + startRoom.w / 2), 
      y: Math.floor(startRoom.y + startRoom.h / 2) 
    };
    const exitPos = { 
      x: Math.floor(exitRoom.x + exitRoom.w / 2), 
      y: Math.floor(exitRoom.y + exitRoom.h / 2) 
    };

    grid[startPos.y][startPos.x] = 'start';
    grid[exitPos.y][exitPos.x] = 'exit';

    return { width, height, grid, startPos, exitPos, rooms };
  }
};
