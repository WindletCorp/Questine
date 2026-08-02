'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useChatStore } from '@/hooks/useChatStore'


export default function TestPage() {
  const [session, setSession] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [log, setLog] = useState<string>('')
  const [goals, setGoals] = useState('')
  const [constraints, setConstraints] = useState('')

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

  const handleSetBYOK = async () => {
    if (!session?.user) return
    const key = prompt('Enter your Google Gemini API Key:')
    if (!key) return
    const { error } = await supabase.from('users').update({ byok_key: key }).eq('id', session.user.id)
    if (error) setLog('Error saving key: ' + error.message)
    else setLog('BYOK key saved successfully!')
  }

  const handleSetContext = async () => {
    if (!session?.user) return
    const { error } = await supabase.from('users').update({ goals, constraints }).eq('id', session.user.id)
    if (error) setLog('Error saving context: ' + error.message)
    else setLog('Global context saved successfully! The AI will now use this.')
  }

  // 1. Test AI Chat
  const { messages, setMessages } = useChatStore()
  const [input, setInput] = useState('')

  const handleInputChange = (e: any) => setInput(e.target.value)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    const newMessages = [...messages, { role: 'user', content: input, id: Date.now().toString() } as any]
    setMessages(newMessages)
    setInput('')
    
    // Filter out any empty assistant messages from previous failed runs before sending
    const validMessages = newMessages.filter(m => m.content.trim() !== '')

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ messages: validMessages })
      })
      if (!res.ok) throw new Error(await res.text())
      
      const data = await res.json()
      console.log('Exact AI response:', data.text)
      
      setMessages((prev: any) => [
        ...prev, 
        { role: 'assistant', content: data.text, id: Date.now().toString() } as any
      ])
    } catch (err: any) {
      setLog('Chat Error: ' + err.message)
    }
  }

  // 2. Test AI Routine
  const testRoutine = async () => {
    setLog('Generating routine...')
    try {
      const res = await fetch('/api/ai/routine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({})
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setLog('Routine Generated:\n' + JSON.stringify(data, null, 2))
    } catch (e: any) {
      setLog('Routine Error: ' + e.message)
    }
  }

  // 3. Test AI Journal
  const testJournal = async () => {
    setLog('Analyzing journal...')
    try {
      const res = await fetch('/api/ai/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ content: "I feel very overwhelmed today. I need to make sure I finish my math homework and call my mom." })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setLog('Journal Analysis:\n' + JSON.stringify(data, null, 2))
    } catch (e: any) {
      setLog('Journal Error: ' + e.message)
    }
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
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-purple-500 text-white rounded w-fit" onClick={handleSetBYOK}>Set Gemini API Key (BYOK)</button>
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
              <h2 className="text-xl font-bold mb-4">1. Test Routine API</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={testRoutine}>Generate Dummy Routine</button>
            </div>

            <div className="p-4 border rounded">
              <h2 className="text-xl font-bold mb-4">2. Test Journal API</h2>
              <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={testJournal}>Analyze Dummy Journal</button>
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

          <div className="p-4 border rounded flex flex-col gap-4">
            <h2 className="text-xl font-bold">3. Test Chat API (Accountability Partner)</h2>
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto h-96 flex flex-col gap-2">
              {messages.map((m: any) => (
                <div key={m.id} className={`p-2 rounded max-w-[80%] ${m.role === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white self-start'}`}>
                  <b>{m.role}: </b>{m.content}
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input className="flex-1 p-2 border rounded text-black" value={input} onChange={handleInputChange} placeholder="Say something..." />
              <button type="submit" className="px-4 py-2 bg-black text-white rounded">Send</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
