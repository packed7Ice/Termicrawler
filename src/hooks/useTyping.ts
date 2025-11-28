import { useState, useEffect } from 'react';

interface UseTypingProps {
  targetWord?: string;
  onComplete?: (word: string) => void;
  onMistake?: () => void;
  enabled?: boolean;
}

export const useTyping = ({ targetWord, onComplete, onMistake, enabled = true }: UseTypingProps) => {
  const [input, setInput] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Alphanumeric input
        const char = e.key;
        
        if (targetWord) {
          const nextCharIndex = input.length;
          // Case insensitive comparison
          if (targetWord[nextCharIndex].toUpperCase() === char.toUpperCase()) {
            const newInput = input + targetWord[nextCharIndex]; // Use target casing for consistency
            setInput(newInput);
            setIsError(false);
            
            if (newInput === targetWord) {
              onComplete?.(targetWord);
              setInput('');
            }
          } else {
            setIsError(true);
            onMistake?.();
            // Optional: shake effect or sound
            setTimeout(() => setIsError(false), 200);
          }
        } else {
          // Free typing mode (if needed)
          setInput(prev => prev + char);
        }
      } else if (e.key === 'Backspace') {
        setInput(prev => prev.slice(0, -1));
        setIsError(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input, targetWord, onComplete, onMistake, enabled]);

  return { input, isError, setInput };
};
