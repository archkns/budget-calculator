import { useEffect, useRef } from 'react'

/**
 * Hook to monitor component performance and log render times
 * Only runs in development mode
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0)
  const startTime = useRef(performance.now())

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      renderCount.current += 1
      const endTime = performance.now()
      const renderTime = endTime - startTime.current
      
      if (renderTime > 16) { // Log if render takes longer than one frame (16ms)
        console.warn(`🐌 Slow render detected in ${componentName}:`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
          renderCount: renderCount.current
        })
      }
      
      startTime.current = performance.now()
    }
  })

  return {
    renderCount: renderCount.current
  }
}

/**
 * Hook to measure API call performance
 */
export function useApiPerformance() {
  const measureApiCall = async <T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now()
      
      try {
        const result = await apiCall()
        const endTime = performance.now()
        const duration = endTime - startTime
        
        if (duration > 1000) { // Log if API call takes longer than 1 second
          console.warn(`🐌 Slow API call detected:`, {
            endpoint,
            duration: `${duration.toFixed(2)}ms`
          })
        }
        
        return result
      } catch (error) {
        const endTime = performance.now()
        const duration = endTime - startTime
        
        console.error(`❌ API call failed:`, {
          endpoint,
          duration: `${duration.toFixed(2)}ms`,
          error
        })
        
        throw error
      }
    }
    
    return apiCall()
  }

  return { measureApiCall }
}
