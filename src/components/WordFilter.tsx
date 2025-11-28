import React, { useState } from 'react';
import wordsData from '../data/words.json';

interface WordFilterProps {
  excludedWords: string[];
  onUpdateExcludedWords: (words: string[]) => void;
  onClose: () => void;
}

export const WordFilter: React.FC<WordFilterProps> = ({ excludedWords, onUpdateExcludedWords, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const toggleWord = (word: string) => {
    if (excludedWords.includes(word)) {
      onUpdateExcludedWords(excludedWords.filter(w => w !== word));
    } else {
      onUpdateExcludedWords([...excludedWords, word]);
    }
  };

  const filteredWords = wordsData.filter(w => 
    w.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.ja.includes(searchTerm) ||
    w.en.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="absolute inset-0 bg-terminal-black z-30 flex flex-col p-8">
      <div className="flex justify-between items-center border-b border-terminal-green pb-4 mb-8">
        <h2 className="text-4xl font-bold">WORD FILTER CONFIG</h2>
        <button onClick={onClose} className="text-2xl hover:text-terminal-green/70">X</button>
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
              onClick={() => toggleWord(word.target)}
              className={`p-2 border cursor-pointer transition-colors ${
                isExcluded 
                  ? 'border-terminal-red text-terminal-red bg-terminal-red/10' 
                  : 'border-terminal-darkGreen hover:bg-terminal-darkGreen/20'
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
