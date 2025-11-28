import LZString from 'lz-string';

const SAVE_KEY = 'termicrawler_save_v1';

export interface GameSaveData {
  floor: number;
  player: {
    hp: number;
    maxHp: number;
    atk: number;
    exp: number;
    level: number;
  };
  seed: number;
  settings: {
    language: 'ja' | 'en';
  };
  timestamp: number;
}

export const StorageUtils = {
  save: (data: GameSaveData): void => {
    try {
      const jsonString = JSON.stringify(data);
      const compressed = LZString.compressToEncodedURIComponent(jsonString);
      localStorage.setItem(SAVE_KEY, compressed);
      console.log('Game saved successfully.');
    } catch (e) {
      console.error('Failed to save game:', e);
    }
  },

  load: (): GameSaveData | null => {
    try {
      const compressed = localStorage.getItem(SAVE_KEY);
      if (!compressed) return null;

      const jsonString = LZString.decompressFromEncodedURIComponent(compressed);
      if (!jsonString) return null;

      const data = JSON.parse(jsonString) as GameSaveData;
      // Basic validation could be added here
      return data;
    } catch (e) {
      console.error('Failed to load game:', e);
      return null;
    }
  },

  exportSave: (): string => {
    const compressed = localStorage.getItem(SAVE_KEY);
    return compressed || '';
  },

  importSave: (compressedString: string): boolean => {
    try {
      const jsonString = LZString.decompressFromEncodedURIComponent(compressedString);
      if (!jsonString) return false;
      
      const data = JSON.parse(jsonString);
      // Validate essential fields
      if (typeof data.floor !== 'number' || !data.player) {
        return false;
      }

      localStorage.setItem(SAVE_KEY, compressedString);
      return true;
    } catch (e) {
      console.error('Failed to import save:', e);
      return false;
    }
  },

  hasSave: (): boolean => {
    return !!localStorage.getItem(SAVE_KEY);
  }
};
