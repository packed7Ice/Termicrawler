import React, { useState } from 'react';
import wordsData from '../data/words.json';

interface WordFilterProps {
  excludedWords: string[];
  remaining: number;
  onSelectWord: (word: string) => void;
  onClose: () => void;
}

export const WordFilter: React.FC<WordFilterProps> = ({ excludedWords, remaining, onSelectWord, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleWordClick = (word: string) => {
    if (excludedWords.includes(word)) return; // Already excluded
    
    if (window.confirm(`Exclude "${word}"? This cannot be undone.`)) {
      onSelectWord(word);
    }
  };

  const filteredWords = wordsData.filter(w => 
    w.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.ja.includes(searchTerm) ||
    w.en.toLowerCase().includes(searchTerm.toLowerCase())
  );

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      const cols = 3; // Assuming md:grid-cols-3

      if (e.key === 'ArrowUp') {
        setSelectedIndex(prev => Math.max(0, prev - cols));
      } else if (e.key === 'ArrowDown') {
        setSelectedIndex(prev => Math.min(filteredWords.length - 1, prev + cols));
      } else if (e.key === 'ArrowLeft') {
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setSelectedIndex(prev => Math.min(filteredWords.length - 1, prev + 1));
      } else if (e.key === 'Enter') {
        if (filteredWords[selectedIndex]) {
          handleWordClick(filteredWords[selectedIndex].target);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredWords, onClose, excludedWords]);

  return (
    <div className="absolute inset-0 bg-terminal-black z-50 flex flex-col p-8">
      <div className="flex justify-between items-center border-b border-terminal-green pb-4 mb-8">
        <div>
          <h2 className="text-4xl font-bold">SELECT WORD TO EXCLUDE</h2>
          <div className="text-terminal-yellow mt-2">REMAINING: {remaining}</div>
        </div>
        <button onClick={onClose} className="text-2xl hover:text-terminal-green/70">CANCEL [ESC]</button>
      </div>

      <div className="mb-4">
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search words..."
          className="w-full bg-terminal-black border border-terminal-green p-2 text-terminal-green focus:outline-none focus:border-terminal-green/70"
          autoFocus
        />
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4 content-start">
        {filteredWords.map((word, index) => {
          const isExcluded = excludedWords.includes(word.target);
          return (
            <div 
              key={word.target}
              onClick={() => handleWordClick(word.target)}
              className={`p-2 border transition-colors ${
                isExcluded 
                  ? 'border-terminal-red text-terminal-red bg-terminal-red/10 cursor-not-allowed opacity-50' 
                  : selectedIndex === index
                    ? 'bg-terminal-green text-terminal-black border-terminal-green'
                    : 'border-terminal-green hover:bg-terminal-green/20 cursor-pointer'
              }`}
            >
              <div className="font-bold">
                {selectedIndex === index && '> '}
                {word.target}
              </div>
              <div className="text-xs opacity-70">{word.ja} / {word.en}</div>
              {isExcluded && <div className="text-xs font-bold mt-1">[EXCLUDED]</div>}
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-right text-sm opacity-70">
        Total Words: {wordsData.length} | Excluded: {excludedWords.length}
      </div>
    </div>
  );
};
