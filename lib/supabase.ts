import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy Supabase clients - only create when needed
let supabaseClient: SupabaseClient | null = null
let supabaseAdminClient: SupabaseClient | null = null

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
    }

    // Client-side Supabase client (for browser usage)
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      }
    })
  }
  return supabaseClient
}

function getSupabaseAdminClient(): SupabaseClient {
  if (!supabaseAdminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase service role key is not configured. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.')
    }

    // Server-side client with service role key for admin operations
    supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return supabaseAdminClient
}

// Export lazy getters
export const supabase = getSupabaseClient
export const supabaseAdmin = getSupabaseAdminClient

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
