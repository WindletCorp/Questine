import useSWR from 'swr'
import { supabase } from '../lib/supabase/client'

const fetchJournals = async () => {
  const { data, error } = await supabase
    .from('journals')
    .select('*')
    .order('date', { ascending: false })
  
  if (error) throw error
  return data
}

export function useJournals() {
  const { data, error, isLoading, mutate } = useSWR('journals', fetchJournals)

  return {
    journals: data,
    isLoading,
    isError: error,
    mutate
  }
}
