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
        "text-4xl font-bold font-mono tracking-widest transition-colors duration-100",
        isError ? "text-terminal-red" : "text-terminal-green"
      )}>
        <span className="text-terminal-yellow">{input}</span>
        <span className="opacity-50">{targetWord.slice(input.length)}</span>
      </div>
    </div>
  );
};
