'use client';

import React, { useRef } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MumbleBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
}

export function MumbleBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type or speak here...',
  className
}: MumbleBarProps) {
  const {
    isSupported,
    isListening,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    onResult: (text) => {
      // Append the new transcript segment if needed, or if it replaces everything:
      // The hook gives us the full transcript so far for this session.
      // We can update the parent value. 
      // But we might want to append to existing value if they started typing first.
      onChange(initialValueRef.current + (initialValueRef.current ? ' ' : '') + text);
    }
  });

  const initialValueRef = useRef(value);

  // When listening starts, lock in the current typed value so we append to it
  const handleToggleListen = () => {
    if (isListening) {
      stopListening();
    } else {
      initialValueRef.current = value;
      resetTranscript();
      startListening();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (onSubmit) onSubmit();
    }
  };

  return (
    <div className={cn('relative w-full flex flex-col', className)}>
      <AnimatePresence mode="wait">
        {isListening ? (
          <motion.div
            key="listening"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-center h-[120px] bg-blue-50 rounded-2xl border-2 border-blue-200 shadow-[0_4px_0_0_rgba(191,219,254,1)] p-4"
          >
            {/* Visualizer Mock */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: ['10px', '40px', '10px'],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut"
                  }}
                  className="w-2 bg-blue-400 rounded-full"
                />
              ))}
            </div>
            <div className="absolute bottom-3 left-0 right-0 text-center text-sm text-blue-500 font-medium">
              Listening...
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="typing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative"
          >
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full min-h-[120px] p-4 pr-[100px] bg-white rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_0_rgba(229,231,235,1)] resize-none focus:outline-none focus:border-blue-300 focus:shadow-[0_4px_0_0_rgba(147,197,253,1)] transition-all text-gray-800 placeholder:text-gray-400 font-medium"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        {onSubmit && (
          <button
            onClick={onSubmit}
            className="p-3 rounded-full bg-pink-100 text-pink-500 shadow-[0_4px_0_0_rgba(251,207,232,1)] hover:bg-pink-200 transition-all active:translate-y-1 active:shadow-none"
            title="Send"
          >
            <Send size={24} />
          </button>
        )}
        {isSupported && (
          <button
            onClick={handleToggleListen}
            className={cn(
              'p-3 rounded-full transition-all active:translate-y-1 active:shadow-none',
              isListening 
                ? 'bg-red-100 text-red-500 shadow-[0_4px_0_0_rgba(254,202,202,1)] hover:bg-red-200' 
                : 'bg-blue-100 text-blue-500 shadow-[0_4px_0_0_rgba(191,219,254,1)] hover:bg-blue-200'
            )}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
        )}
      </div>
    </div>
  );
}
