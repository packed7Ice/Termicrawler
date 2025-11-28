import React from 'react';
import { useTyping } from '../hooks/useTyping';
import clsx from 'clsx';

interface TypingInputProps {
  targetWord: string;
  onComplete: (word: string) => void;
  disabled?: boolean;
}

export const TypingInput: React.FC<TypingInputProps> = ({ targetWord, onComplete, disabled }) => {
  const { input, isError } = useTyping({
    targetWord,
    onComplete,
    enabled: !disabled
  });

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="text-xl mb-2 text-terminal-green opacity-70">TYPE TO ATTACK</div>
      <div className={clsx(
        "font-bold font-mono tracking-widest transition-colors duration-100 break-words text-center max-w-full",
        targetWord.length > 20 ? "text-lg md:text-xl" : targetWord.length > 12 ? "text-xl md:text-2xl" : "text-2xl md:text-3xl",
        isError ? "text-terminal-red" : "text-terminal-green"
      )}>
        <span className="text-terminal-yellow">
          {input.split('').map((char, i) => (
            <span key={i}>{char === ' ' ? '␣' : char}</span>
          ))}
        </span>
        <span className="opacity-50">
          {targetWord.slice(input.length).split('').map((char, i) => (
            <span key={i}>{char === ' ' ? '␣' : char}</span>
          ))}
        </span>
      </div>
    </div>
  );
};
