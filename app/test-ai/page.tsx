'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from "@/lib/auth/use-auth";
import { useSyncStore } from "@/lib/stores/sync-store";
import { type ModelMessage } from 'ai';

export default function SimpleChatPage() {
    const { session, isLoading: isAuthLoading } = useAuth();
    const isOnline = useSyncStore(state => state.isOnline);

    const userId = session?.user_id || null;

    // Chat States
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ModelMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !userId) return;

        const newMessages = [...messages, { role: 'user' as const, content: input }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages, userId }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate response');
            }

            // Append the response messages from the AI SDK
            setMessages([...newMessages, ...(data.responseMessages || [])]);
        } catch (err: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${err.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    // 1. Initial Auth Check Spinner
    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-2"></div>
                <p className="text-sm text-slate-400">Checking auth…</p>
            </div>
        );
    }

    // 2. Unauthenticated Guard Shield
    if (!userId) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-slate-950 rounded-xl p-6 border border-slate-800 shadow-2xl text-center space-y-4">
                    <h1 className="text-xl font-bold text-white">🔐 Auth Required</h1>
                    <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 py-2 rounded-lg">Not authenticated. Sign in first.</p>
                    <p className="text-xs text-slate-500">This test page requires an active, authenticated session.</p>
                </div>
            </div>
        );
    }

    // 3. Authenticated Chat Application View
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 py-10">
            <div className="w-full max-w-2xl bg-slate-950 rounded-xl p-6 border border-slate-800 shadow-2xl flex flex-col h-[80vh]">

                {/* Header */}
                <div className="mb-4">
                    <h1 className="text-xl font-bold text-white">BYOK Route Tester</h1>
                    <p className="text-xs text-slate-400">
                        Testing user ID: <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-400">{userId}</code>
                    </p>
                    {!isOnline && (
                        <div className="mt-2 text-xs font-medium text-red-400 bg-red-950/30 border border-red-900/50 p-2 rounded">
                            ⚠️ AI Chat requires an active internet connection. You are currently offline.
                        </div>
                    )}
                </div>

                {/* Output Screen */}
                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto mb-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-slate-500 italic text-center mt-10">No messages yet. Say hello!</div>
                    )}
                    
                    {messages.map((m, i) => (
                        <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] rounded-lg p-3 ${
                                m.role === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-br-none' 
                                    : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                            }`}>
                                {typeof m.content === 'string' ? m.content : null}
                                {m.role === 'assistant' && Array.isArray(m.content) && m.content.map((part: any, j: number) => {
                                    if (part.type === 'tool-call') {
                                        return (
                                            <div key={j} className="mt-2 text-xs bg-slate-950 p-2 rounded text-slate-400 border border-slate-700">
                                                <div className="font-semibold text-indigo-300">Tool Call: {part.toolName}</div>
                                            </div>
                                        );
                                    }
                                    if (part.type === 'text') {
                                        return <span key={j}>{part.text}</span>;
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="text-indigo-400 animate-pulse flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                            LLM is executing backend context tools and generating response...
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>

                {/* Form Input */}
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Ask something matching your goals..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim() || !isOnline}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                        Send
                    </button>
                </form>

            </div>
        </div>
    );
}
