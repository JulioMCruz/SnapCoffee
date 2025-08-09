import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

export function SdkInitializer() {
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState('starting')

  useEffect(() => {
    let initTimeout: NodeJS.Timeout
    let stepTimeout: NodeJS.Timeout

    const logWithTimestamp = (message: string, data?: any) => {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] ${message}`, data || '')
    }

    const initializeSdk = async () => {
      try {
        logWithTimestamp("🚀 SDK INITIALIZATION: Starting process...")
        setStep('checking-environment')
        
        // Log environment details
        logWithTimestamp("🌍 SDK INITIALIZATION: Environment details", {
          userAgent: navigator.userAgent,
          url: window.location.href,
          parent: window.parent === window ? 'same' : 'different',
          referrer: document.referrer
        })

        // Set a timeout to force initialization if it takes too long
        initTimeout = setTimeout(() => {
          logWithTimestamp("⚠️ SDK INITIALIZATION: TIMEOUT - Forcing ready state after 3 seconds")
          setStep('timeout-fallback')
          setInitialized(true)
          
          // Try to call ready one more time asynchronously
          sdk.actions.ready()
            .then(() => logWithTimestamp("📱 SDK INITIALIZATION: Late ready() call succeeded"))
            .catch((e) => logWithTimestamp("📱 SDK INITIALIZATION: Late ready() call failed", e))
        }, 3000)

        // Step 1: Get context with detailed logging
        setStep('getting-context')
        logWithTimestamp("📱 SDK INITIALIZATION: Step 1 - Getting SDK context...")
        
        const contextPromise = sdk.context
        const contextTimeout = new Promise((_, reject) => {
          stepTimeout = setTimeout(() => {
            reject(new Error('Context retrieval timeout after 2 seconds'))
          }, 2000)
        })

        let context
        try {
          context = await Promise.race([contextPromise, contextTimeout])
          clearTimeout(stepTimeout)
          logWithTimestamp("✅ SDK INITIALIZATION: Context retrieved successfully", context)
        } catch (contextError) {
          logWithTimestamp("❌ SDK INITIALIZATION: Context retrieval failed", contextError)
          throw contextError
        }

        // Step 2: Check if we're in Farcaster environment using official SDK method
        setStep('validating-environment')
        const isInMiniApp = sdk.isInMiniApp
        const hasContext = !!(
          context?.client?.clientFid ||
          context?.isMinApp ||
          context?.miniApp
        )
        const userAgentCheck = navigator.userAgent.includes('FarcasterMobile')
        
        const isFarcasterEnv = isInMiniApp || hasContext || userAgentCheck
        
        logWithTimestamp("🔍 SDK INITIALIZATION: Environment validation", {
          officialSDK_isInMiniApp: isInMiniApp,
          hasContext,
          clientFid: context?.client?.clientFid,
          isMinApp: context?.isMinApp,
          miniApp: context?.miniApp,
          userAgentCheck,
          finalResult: isFarcasterEnv
        })

        if (isFarcasterEnv) {
          // Step 3: Call ready() with detailed logging
          setStep('calling-ready')
          logWithTimestamp("📞 SDK INITIALIZATION: Step 3 - Calling sdk.actions.ready()...")
          
          const readyPromise = sdk.actions.ready()
          const readyTimeout = new Promise((_, reject) => {
            stepTimeout = setTimeout(() => {
              reject(new Error('Ready call timeout after 2 seconds'))
            }, 2000)
          })

          try {
            await Promise.race([readyPromise, readyTimeout])
            clearTimeout(stepTimeout)
            logWithTimestamp("✅ SDK INITIALIZATION: ready() call completed successfully!")
          } catch (readyError) {
            logWithTimestamp("❌ SDK INITIALIZATION: ready() call failed", readyError)
            throw readyError
          }

          logWithTimestamp("🎉 SDK INITIALIZATION: Complete - SDK ready and splash screen should be hidden")
          clearTimeout(initTimeout)
          setStep('complete')
          setInitialized(true)
        } else {
          logWithTimestamp("📍 SDK INITIALIZATION: Not in Farcaster environment, skipping ready() call")
          clearTimeout(initTimeout)
          setStep('skipped-not-farcaster')
          setInitialized(true)
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logWithTimestamp("❌ SDK INITIALIZATION: FAILED", {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          step
        })
        setError(errorMessage)
        clearTimeout(initTimeout)
        
        // Still set as initialized to prevent blocking the app
        setStep('failed-continuing')
        setInitialized(true)
      }
    }

    // Add a small delay to ensure DOM is ready, then start initialization
    const timer = setTimeout(() => {
      logWithTimestamp("⏰ SDK INITIALIZATION: Starting after DOM ready delay")
      initializeSdk()
    }, 500) // Increased delay for mobile

    return () => {
      clearTimeout(timer)
      if (initTimeout) clearTimeout(initTimeout)
      if (stepTimeout) clearTimeout(stepTimeout)
    }
  }, [])

  // Show initialization status in development mode for debugging
  if (process.env.NODE_ENV === 'development' && !initialized) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        background: error ? 'rgba(255,0,0,0.8)' : 'rgba(0,0,0,0.8)', 
        color: 'white', 
        padding: '8px 12px', 
        fontSize: '11px',
        fontFamily: 'monospace',
        zIndex: 9999,
        maxWidth: '90vw',
        lineHeight: '1.2'
      }}>
        <div>🔧 SDK Init: {step}</div>
        {error && <div>❌ Error: {error}</div>}
        {!initialized && <div>⏳ Waiting...</div>}
      </div>
    )
  }

  return null
}