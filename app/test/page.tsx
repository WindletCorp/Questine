'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useChat } from '@ai-sdk/react'

export default function TestPage() {
  const [session, setSession] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [log, setLog] = useState<string>('')
  const [goals, setGoals] = useState('')
  const [constraints, setConstraints] = useState('')
  const [byokProvider, setByokProvider] = useState('google')
  const [input, setInput] = useState('')
  const chatState = useChat({
    maxSteps: 5,
    headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {},
    body: { context: 'chat' },
    onError: (err) => setLog('Error: ' + err.message)
  })
  const { messages, isLoading } = chatState;
  // Check auth on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setLog(error.message)
    else setLog('Logged in successfully!')
  }

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setLog(error.message)
    else setLog('Signed up successfully! Check your email (or Supabase logs) if confirmation is enabled.')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setLog('Logged out. Please log in again to sync cookies.')
  }

  const handleSetBYOK = async () => {
    if (!session?.user) return
    const key = prompt(`Enter your ${byokProvider === 'google' ? 'Google Gemini' : 'OpenAI'} API Key:`)
    if (!key) return
    const { error } = await supabase.from('users').upsert({ id: session.user.id, byok_key: key, byok_provider: byokProvider })
    if (error) setLog('Error saving key: ' + error.message)
    else setLog('BYOK key and provider saved successfully!')
  }

  const handleSetContext = async () => {
    if (!session?.user) return
    const { error } = await supabase.from('users').upsert({ id: session.user.id, goals, constraints })
    if (error) setLog('Error saving context: ' + error.message)
    else setLog('Global context saved successfully! The AI will now use this.')
  }

  // 4. Test CRUD Operations
  const handleCreateTask = async () => {
    if (!session?.user) return
    const { error } = await supabase.from('tasks').insert({ label: 'Test task from UI', user_id: session.user.id })
    if (error) setLog('Error creating task: ' + error.message)
    else setLog('Dummy task created!')
  }

  const handleCreateJournal = async () => {
    if (!session?.user) return
    const { error } = await supabase.from('journals').insert({ 
      content: 'I had a really productive day today, but I am tired.', 
      date: new Date().toISOString().split('T')[0],
      user_id: session.user.id 
    })
    if (error) setLog('Error creating journal: ' + error.message)
    else setLog('Dummy journal created!')
  }

  const handleCreateRoutineBlock = async () => {
    if (!session?.user) return
    const { error } = await supabase.from('routine_blocks').insert({ 
      label: 'Deep Work', 
      category: 'Work', 
      type: 'PLAN',
      start_time: 480, // 8:00 AM
      end_time: 600, // 10:00 AM
      user_id: session.user.id 
    })
    if (error) setLog('Error creating routine block: ' + error.message)
    else setLog('Dummy routine block created!')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Backend Testing Page</h1>
      
      {!session ? (
        <div className="p-4 border rounded flex flex-col gap-4">
          <h2 className="text-xl">Authentication Required</h2>
          <input className="p-2 border rounded text-black" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="p-2 border rounded text-black" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={handleLogin}>Log In</button>
            <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={handleSignup}>Sign Up</button>
          </div>
        </div>
      ) : (
        <div className="p-4 border rounded flex flex-col gap-4">
          <h2 className="text-xl">Authenticated as: {session.user.email}</h2>
          <div className="flex gap-4 items-center">
            <select 
              value={byokProvider} 
              onChange={(e) => setByokProvider(e.target.value)}
              className="p-2 border rounded text-black"
            >
              <option value="google">Google Gemini</option>
              <option value="openai">OpenAI</option>
            </select>
            <button className="px-4 py-2 bg-purple-500 text-white rounded w-fit" onClick={handleSetBYOK}>Set API Key (BYOK)</button>
          </div>
          <div className="flex gap-4 items-center mt-2">
            <button className="px-4 py-2 bg-red-500 text-white rounded w-fit" onClick={handleLogout}>Log Out</button>
          </div>
          
          <div className="flex flex-col gap-2 mt-4">
            <h3 className="font-bold text-lg">Global AI Context</h3>
            <textarea className="p-2 border rounded text-black" placeholder="Your Goals (e.g., Get shredded, finish side project)" value={goals} onChange={e => setGoals(e.target.value)} />
            <textarea className="p-2 border rounded text-black" placeholder="Your Constraints (e.g., Only have 2 hours free per day)" value={constraints} onChange={e => setConstraints(e.target.value)} />
            <button className="px-4 py-2 bg-yellow-600 text-white rounded w-fit" onClick={handleSetContext}>Save Context to Database</button>
          </div>
        </div>
      )}

      {session && (
        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <div className="p-4 border rounded">
              <h2 className="text-xl font-bold mb-4">Test AI Chat</h2>
              <div className="flex flex-col gap-2 h-64 overflow-y-auto mb-4 border p-2 rounded">
                <div>useChat keys: {JSON.stringify(Object.keys(chatState))}</div>
                {messages.map(m => (
                  <div key={m.id} className={`p-2 rounded ${m.role === 'user' ? 'bg-blue-100 text-blue-900 self-end' : 'bg-gray-100 text-gray-900 self-start'}`}>
                    <strong>{m.role === 'user' ? 'You: ' : 'AI: '}</strong>
                    {m.content}
                    {m.toolInvocations && m.toolInvocations.map((tool: any) => (
                      <div key={tool.toolCallId} className="text-xs text-gray-500 mt-1">
                        Called tool: {tool.toolName}
                      </div>
                    ))}
                  </div>
                ))}
                {isLoading && <div className="text-gray-500">AI is thinking...</div>}
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                // We will implement sending here once we know what useChat exports
                if (chatState.append) {
                  chatState.append({ role: 'user', content: input });
                  setInput('');
                } else if (chatState.sendMessage) {
                  chatState.sendMessage({ content: input });
                  setInput('');
                }
              }} className="flex gap-2">
                <input 
                  className="flex-1 p-2 border rounded text-black" 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  placeholder="Say something..." 
                />
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded" disabled={isLoading || !input?.trim()}>Send</button>
              </form>
            </div>

            <div className="p-4 border rounded">
              <h2 className="text-xl font-bold mb-4">4. Test Data Creation</h2>
              <div className="flex flex-col gap-2">
                <button className="px-4 py-2 bg-purple-600 text-white rounded" onClick={handleCreateTask}>Create Dummy Task</button>
                <button className="px-4 py-2 bg-teal-600 text-white rounded" onClick={handleCreateJournal}>Create Dummy Journal</button>
                <button className="px-4 py-2 bg-orange-600 text-white rounded" onClick={handleCreateRoutineBlock}>Create Dummy Routine Block</button>
              </div>
            </div>

            <div className="p-4 border rounded h-64 overflow-auto bg-gray-900 text-green-400 font-mono text-sm">
              <h2 className="text-white sticky top-0 bg-gray-900 pb-2">Logs & JSON Output:</h2>
              <pre>{log}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
