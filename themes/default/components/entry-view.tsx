"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, ArrowUp, Settings, Trash2 } from "lucide-react";
import { GlassButton } from "./glass-button";
import styles from "../theme.module.css";
import { useToastStore } from "@/lib/stores/toast-store";
import { getLocalUserSettings } from "@/lib/local-db/users";
import { getLocalChatMessages, saveLocalChatMessage, clearLocalChat } from "@/lib/local-db/chats";
import Link from "next/link";
import { ChatView } from "./chat-view";
import type { ModelMessage } from 'ai';

interface EntryViewProps {
  isActive: boolean;
  onClose: () => void;
  userId?: string;
}

export function EntryView({ isActive, onClose, userId }: EntryViewProps) {
  const [query, setQuery] = useState("");
  const [showSettingsPrompt, setShowSettingsPrompt] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ModelMessage[]>([]);

  useEffect(() => {
    if (userId) {
      getLocalChatMessages(userId).then(res => {
        if (res.data) {
          setMessages(res.data.map(m => ({ role: m.role as any, content: m.content })));
        }
      });
    }
  }, [userId]);

  const handleClearChat = async () => {
    if (!userId) return;
    await clearLocalChat(userId);
    setMessages([]);
    useToastStore.getState().addToast({
      title: "Chat Cleared",
      message: "Your AI conversation history has been cleared.",
      type: "success",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !userId) return;

    setIsProcessing(true);
    const newQuery = query;
    setQuery(""); // clear input immediately
    
    try {
      const { data: settings, error } = await getLocalUserSettings(userId);
      
      if (error || !settings?.byok_key) {
        setQuery(newQuery); // restore query if error
        useToastStore.getState().addToast({
          title: "API Key Required",
          message: "You need to configure your BYOK (Bring Your Own Key) setup before using AI features.",
          type: "error",
          duration: 5000,
        });
        setShowSettingsPrompt(true);
        setIsProcessing(false);
        return;
      }

      setShowSettingsPrompt(false);
      
      const updatedMessages = [...messages, { role: 'user' as const, content: newQuery }];
      setMessages(updatedMessages);
      await saveLocalChatMessage(userId, 'user', newQuery);

      // Rolling window: keep last 20 messages for context
      const contextMessages = updatedMessages.slice(-20);

      const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: contextMessages, userId }),
      });

      const data = await res.json();

      if (!res.ok) {
          throw new Error(data.error || 'Failed to generate response');
      }

      setMessages([...updatedMessages, ...(data.responseMessages || [])]);
      
      if (data.responseMessages && Array.isArray(data.responseMessages)) {
        for (const msg of data.responseMessages) {
          await saveLocalChatMessage(userId, msg.role, msg.content);
        }
      }

    } catch (err: any) {
      setQuery(newQuery); // restore input
      useToastStore.getState().addToast({
        title: "Connection Error",
        message: err.message,
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 items-center relative">
      
      {/* Dynamic Inline Chat History */}
      <ChatView messages={messages} />

      <div
        className="w-full p-4 rounded-[22px] border border-white/16 shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(0,0,0,0.25)] relative"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(32px) saturate(200%)",
          WebkitBackdropFilter: "blur(32px) saturate(200%)",
        }}
      >
        <div className="flex items-center justify-between w-full mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className={styles.waveformContainer}>
              <div className={styles.waveformBar} />
              <div className={styles.waveformBar} />
              <div className={styles.waveformBar} />
              <div className={styles.waveformBar} />
              <div className={styles.waveformBar} />
            </div>
            <span className="text-[10px] font-mono text-white/50 animate-pulse">
              {isProcessing ? "Processing..." : "Listening..."}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <GlassButton variant="circle" onClick={handleClearChat} className="w-6 h-6 border-transparent bg-transparent shadow-none text-white/40 hover:text-white/80" title="Clear Chat">
              <Trash2 className="w-3 h-3" />
            </GlassButton>
            <GlassButton variant="circle" onClick={onClose} className="w-6 h-6 border-transparent bg-transparent shadow-none text-white/40 hover:text-white/80">
              <span className="text-xs">✕</span>
            </GlassButton>
          </div>
        </div>

        <form className="w-full" onSubmit={handleSubmit}>
          <div 
            className="flex items-center px-3.5 py-2 w-full rounded-full border border-white/20 bg-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.45)]"
          >
            <Mic className="w-3.5 h-3.5 text-white/50 mr-2 shrink-0" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type command, task, or thought..." 
              className="bg-transparent border-none outline-none text-[13px] text-white placeholder:text-white/35 w-full font-medium"
              autoComplete="off"
              disabled={isProcessing}
            />
            <button 
              type="submit" 
              disabled={isProcessing}
              className="ml-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shrink-0 text-black transition-colors disabled:opacity-50"
              aria-label="Submit Entry"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {showSettingsPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="w-full max-w-[20rem]"
          >
            <Link href="/settings" className="w-full block">
              <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 text-[11px] font-semibold tracking-wide uppercase transition-all shadow-lg cursor-pointer">
                <Settings className="w-3.5 h-3.5" />
                Configure BYOK Settings
              </button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
