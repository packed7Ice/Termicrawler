export type SymbolKind = 'enemy' | 'shop' | 'stairs' | 'player';

export interface SymbolDefinition {
  kind: SymbolKind;
  id: string;
  // 3D View ASCII Art (multiple lines)
  asciiArt: string[];
  // Mini Map Character (single char)
  miniMapChar: string;
  // Color for 3D view
  color: string;
}

export const SYMBOLS: Record<string, SymbolDefinition> = {
  enemy_bug: {
    kind: 'enemy',
    id: 'enemy_bug',
    asciiArt: [
      '  /--\\  ',
      ' ( oo ) ',
      '--|  |--',
      ' /    \\ '
    ],
    miniMapChar: 'E',
    color: '#ff0000'
  },
  shop: {
    kind: 'shop',
    id: 'shop',
    asciiArt: [
      ' [SHOP] ',
      ' |====| ',
      ' |$$$$| ',
      ' |____| '
    ],
    miniMapChar: '$',
    color: '#ffff00'
  },
  stairs: {
    kind: 'stairs',
    id: 'stairs',
    asciiArt: [
      '   __   ',
      ' _|__|_ ',
      '|______|',
      '        '
    ],
    miniMapChar: '>',
    color: '#00ff00'
  },
  player: {
    kind: 'player',
    id: 'player',
    asciiArt: [], // Player is not rendered in 3D view (first person)
    miniMapChar: '@',
    color: '#00ff00'
  }
};
