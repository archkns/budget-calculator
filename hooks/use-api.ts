import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  showToast?: boolean
}

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(async (
    url: string, 
    options: RequestInit = {}, 
    apiOptions: UseApiOptions = {}
  ) => {
    const { onSuccess, onError, showToast = true } = apiOptions
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = errorData.error || response.statusText || 'Request failed'
        
        if (showToast) {
          toast.error(errorMessage)
        }
        
        setError(errorMessage)
        onError?.(errorData)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      onSuccess?.(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      
      if (showToast && !apiOptions.onError) {
        toast.error(errorMessage)
      }
      
      setError(errorMessage)
      onError?.(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const get = useCallback((url: string, options: UseApiOptions = {}) => 
    request(url, { method: 'GET' }, options), [request])

  const post = useCallback((url: string, data: any, options: UseApiOptions = {}) => 
    request(url, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }, options), [request])

  const put = useCallback((url: string, data: any, options: UseApiOptions = {}) => 
    request(url, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }, options), [request])

  const del = useCallback((url: string, options: UseApiOptions = {}) => 
    request(url, { method: 'DELETE' }, options), [request])

  return {
    loading,
    error,
    request,
    get,
    post,
    put,
    delete: del,
  }
}
