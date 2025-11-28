import React, { useState } from 'react';
import wordsData from '../data/words.json';

interface WordFilterProps {
  excludedWords: string[];
  onSelectWord: (word: string) => void;
  onClose: () => void;
}

export const WordFilter: React.FC<WordFilterProps> = ({ excludedWords, onSelectWord, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleWordClick = (word: string) => {
    if (excludedWords.includes(word)) return; // Already excluded
    
    // Confirm selection? For now, just select immediately as per prompt flow
    // Or maybe we should ask for confirmation. 
    // Given the UI is "Select a word to exclude", direct action is probably expected.
    if (window.confirm(`Exclude "${word}"? This cannot be undone.`)) {
      onSelectWord(word);
    }
  };

  const filteredWords = wordsData.filter(w => 
    w.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.ja.includes(searchTerm) ||
    w.en.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="absolute inset-0 bg-terminal-black z-50 flex flex-col p-8">
      <div className="flex justify-between items-center border-b border-terminal-green pb-4 mb-8">
        <h2 className="text-4xl font-bold">SELECT WORD TO EXCLUDE</h2>
        <button onClick={onClose} className="text-2xl hover:text-terminal-green/70">CANCEL</button>
      </div>

      <div className="mb-4">
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search words..."
          className="w-full bg-terminal-black border border-terminal-green p-2 text-terminal-green focus:outline-none focus:border-terminal-green/70"
        />
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4 content-start">
        {filteredWords.map((word) => {
          const isExcluded = excludedWords.includes(word.target);
          return (
            <div 
              key={word.target}
              onClick={() => handleWordClick(word.target)}
              className={`p-2 border transition-colors ${
                isExcluded 
                  ? 'border-terminal-red text-terminal-red bg-terminal-red/10 cursor-not-allowed opacity-50' 
                  : 'border-terminal-green hover:bg-terminal-green/20 cursor-pointer'
              }`}
            >
              <div className="font-bold">{word.target}</div>
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
