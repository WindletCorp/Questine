import useSWR from 'swr'
import { supabase } from '../lib/supabase/client'

const fetchRoutineBlocks = async () => {
  const { data, error } = await supabase
    .from('routine_blocks')
    .select('*')
    .order('start_time', { ascending: true })
  
  if (error) throw error
  return data
}

export function useRoutines() {
  const { data, error, isLoading, mutate } = useSWR('routine_blocks', fetchRoutineBlocks)

  return {
    routineBlocks: data,
    isLoading,
    isError: error,
    mutate
  }
}
