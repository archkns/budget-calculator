import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
}

if (!supabaseServiceKey) {
  throw new Error('Supabase service role key is not configured. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.')
}

// Client-side Supabase client (for browser usage)
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
})

// Server-side client with service role key for admin operations
export const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper function to check if Supabase is available (always true now)
export function checkSupabaseConnection() {
  return true
}

// Helper function for API routes to handle Supabase errors
export function handleSupabaseError(error: unknown, operation: string) {
  console.error(`Supabase error during ${operation}:`, error)
  
  if (error && typeof error === 'object' && 'code' in error) {
    const errorCode = (error as { code: string }).code;
    
    if (errorCode === 'PGRST116') {
      return { error: 'Resource not found', status: 404 }
    }
    
    if (errorCode === '23505') {
      return { error: 'Resource already exists', status: 409 }
    }
    
    if (errorCode === '23503') {
      return { error: 'Foreign key constraint violation', status: 400 }
    }
  }
  
  return { error: `Failed to ${operation}`, status: 500 }
}
