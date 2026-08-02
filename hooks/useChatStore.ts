import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UIMessage } from 'ai'

interface ChatState {
  messages: UIMessage[]
  addMessage: (message: UIMessage) => void
  setMessages: (messages: UIMessage[] | ((prev: UIMessage[]) => UIMessage[])) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      setMessages: (updater) => set((state) => ({ messages: typeof updater === 'function' ? updater(state.messages) : updater })),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'questine-chat-storage',
    }
  )
)
