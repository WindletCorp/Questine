import type { AppError } from "./types";

export function handleDbError(error: unknown): AppError {
  if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, any>;

    // Handle Supabase/PostgREST specific error codes
    // 23505 = unique_violation
    if (errObj.code === '23505') {
      return {
        code: 'CONFLICT',
        message: 'This record already exists or conflicts with another record.',
        details: error
      };
    }
    
    // 23503 = foreign_key_violation
    if (errObj.code === '23503') {
      return {
        code: 'VALIDATION_ERROR',
        message: 'A related record was not found.',
        details: error
      };
    }

    // Handle Dexie specific errors
    if (errObj.name === 'ConstraintError') {
      return {
        code: 'CONFLICT',
        message: 'This record already exists locally.',
        details: error
      };
    }
    if (errObj.name === 'NotFoundError') {
      return {
        code: 'NOT_FOUND',
        message: 'Record not found locally.',
        details: error
      };
    }

    // Try to extract a useful message if it's a generic Error object
    if (typeof errObj.message === 'string') {
       // if it looks like a network error from fetch
      if (errObj.message.toLowerCase().includes('network') || errObj.message.toLowerCase().includes('fetch')) {
         return {
            code: 'NETWORK_ERROR',
            message: 'Network error occurred. Please check your connection.',
            details: error
         };
      }
      return {
        code: 'INTERNAL_ERROR',
        message: errObj.message,
        details: error
      };
    }
  }

  // Fallback for completely unknown errors
  return {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred.',
    details: error
  };
}
