"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ModelMessage } from 'ai';

interface ChatViewProps {
  messages: ModelMessage[];
}

export function ChatView({ messages }: ChatViewProps) {
  if (messages.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto pb-2 scrollbar-none pointer-events-auto z-50">
      <AnimatePresence initial={false}>
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-[20px] p-3.5 text-[13px] leading-relaxed shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${
                m.role === 'user'
                  ? 'bg-white/10 backdrop-blur-2xl border border-white/20 text-white rounded-br-sm'
                  : 'bg-black/50 backdrop-blur-2xl border border-white/10 text-white/90 rounded-bl-sm'
              }`}
            >
              {typeof m.content === 'string' ? m.content : null}
              {m.role === 'assistant' && Array.isArray(m.content) && m.content.map((part: any, j: number) => {
                if (part.type === 'text') {
                  return <span key={j}>{part.text}</span>;
                }
                if (part.type === 'tool-call') {
                  return (
                    <div key={j} className="mt-2 text-[10px] font-mono text-purple-300/70 bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20 inline-block">
                      ⚙️ Executing: {part.toolName}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
