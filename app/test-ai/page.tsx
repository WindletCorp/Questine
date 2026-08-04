'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SimpleChatPage() {
    const supabase = createSupabaseBrowserClient();
    
    // Dynamic Auth States
    const [userId, setUserId] = useState<string | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    // Chat States
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Check auth state on mount
    useEffect(() => {
        supabase.auth.getUser().then(({ data, error }) => {
            if (error || !data.user) {
                setAuthError("Not authenticated. Sign in first.");
            } else {
                setUserId(data.user.id);
            }
            setIsAuthLoading(false);
        });
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || !userId) return;

        setIsLoading(true);
        setResponse('');

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, userId }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate response');
            }

            setResponse(data.text);
        } catch (err: any) {
            setResponse(`⚠️ Error: ${err.message}`);
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
    if (authError || !userId) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-slate-950 rounded-xl p-6 border border-slate-800 shadow-2xl text-center space-y-4">
                    <h1 className="text-xl font-bold text-white">🔐 Auth Required</h1>
                    <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 py-2 rounded-lg">{authError}</p>
                    <p className="text-xs text-slate-500">This test page requires an active, authenticated Supabase session.</p>
                </div>
            </div>
        );
    }

    // 3. Authenticated Chat Application View
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-950 rounded-xl p-6 border border-slate-800 shadow-2xl flex flex-col space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-xl font-bold text-white">BYOK Route Tester</h1>
                    <p className="text-xs text-slate-400">
                        Testing user ID: <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-400">{userId}</code>
                    </p>
                </div>

                {/* Output Screen */}
                <div className="min-h-[150px] bg-slate-900 border border-slate-800 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {isLoading && (
                        <div className="text-indigo-400 animate-pulse flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                            LLM is executing backend context tools and generating response...
                        </div>
                    )}
                    {!isLoading && !response && (
                        <span className="text-slate-500 italic">Response payload will appear here...</span>
                    )}
                    {!isLoading && response && (
                        <p className="text-slate-200">{response}</p>
                    )}
                </div>

                {/* Form Input */}
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Ask something matching your goals (e.g., 'What are my goals?')"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !prompt.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                        Send
                    </button>
                </form>

            </div>
        </div>
    );
}
