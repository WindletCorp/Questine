import useSWR from 'swr'
import { supabase } from '../lib/supabase/client'

const fetchTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export function useTasks() {
  const { data, error, isLoading, mutate } = useSWR('tasks', fetchTasks)

  return {
    tasks: data,
    isLoading,
    isError: error,
    mutate
  }
}
