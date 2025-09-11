import { useEffect, useRef } from 'react'

// Performance metrics interface for future use
// interface PerformanceMetrics {
//   renderTime: number
//   componentName: string
//   timestamp: number
// }

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(0)
  const renderCount = useRef<number>(0)

  useEffect(() => {
    renderStartTime.current = performance.now()
    renderCount.current += 1

    return () => {
      const renderTime = performance.now() - renderStartTime.current
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName}:`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
          renderCount: renderCount.current,
          timestamp: new Date().toISOString()
        })
      }

      // Store metrics for analysis (in production, you might send to analytics)
      if (renderTime > 16) { // More than one frame (16ms at 60fps)
        console.warn(`[Performance Warning] ${componentName} took ${renderTime.toFixed(2)}ms to render`)
      }
    }
  })

  return {
    renderCount: renderCount.current,
    startTiming: () => { renderStartTime.current = performance.now() },
    endTiming: () => performance.now() - renderStartTime.current
  }
}

// Hook to measure async operations
export function useAsyncPerformance(operationName: string) {
  const startTime = useRef<number>(0)

  const startTiming = () => {
    startTime.current = performance.now()
  }

  const endTiming = () => {
    const duration = performance.now() - startTime.current
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Async Performance] ${operationName}: ${duration.toFixed(2)}ms`)
    }

    if (duration > 1000) { // More than 1 second
      console.warn(`[Performance Warning] ${operationName} took ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  return { startTiming, endTiming }
}