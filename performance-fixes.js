// 🛠️ FIXES CRÍTICOS para GESCOL - Soluciones inmediatas

// 1. STORE.JS OPTIMIZADO
import { legacy_createStore as createStore, applyMiddleware } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'

const initialState = {
  sidebarShow: true,
  theme: 'light',
}

const changeState = (state = initialState, { type, ...rest }) => {
  switch (type) {
    case 'set':
      return { ...state, ...rest }
    default:
      return state
  }
}

// ✅ Middleware para logging y optimización
const loggerMiddleware = store => next => action => {
  // Solo loggear en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Redux Action:', action.type, action)
  }
  return next(action)
}

// ✅ Store optimizado con DevTools
const store = createStore(
  changeState,
  composeWithDevTools(applyMiddleware(loggerMiddleware))
)

export default store

// 2. USEEFFECT CLEANUP TEMPLATE
// Para todos los componentes que necesiten cleanup:

// EJEMPLO - Dashboard.js optimizado
import { useState, useEffect, useRef, useCallback } from "react"

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const api = helpFetch()
  
  // ✅ Refs para cleanup
  const abortControllerRef = useRef(null)
  const themeChangeRef = useRef(null)
  
  // ✅ Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (themeChangeRef.current) {
      document.documentElement.removeEventListener('ColorSchemeChange', themeChangeRef.current)
    }
  }, [])
  
  // ✅ useEffect con cleanup
  useEffect(() => {
    // Crear AbortController para cancelar requests
    abortControllerRef.current = new AbortController()
    
    // Theme change handler
    themeChangeRef.current = () => {
      // Handle theme change
    }
    
    document.documentElement.addEventListener('ColorSchemeChange', themeChangeRef.current)
    
    // Cargar datos
    loadDashboardData()
    
    // ✅ Cleanup al desmontar
    return cleanup
  }, [cleanup])
  
  // ✅ Función optimizada con abort signal
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await api.get("/api/dashboard/summary", {
        signal: abortControllerRef.current.signal
      })
      // ... resto del código
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("❌ Error loading dashboard data:", error)
      }
    } finally {
      setLoading(false)
    }
  }
}

// 3. COMPONENTES MEMOIZADOS

// ✅ AppSidebar.js optimizado
import React, { memo, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'

const AppSidebar = memo(() => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)

  // ✅ Callbacks memoizados
  const handleVisibleChange = useCallback((visible) => {
    dispatch({ type: 'set', sidebarShow: visible })
  }, [dispatch])

  const handleToggle = useCallback(() => {
    dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })
  }, [dispatch, unfoldable])

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={handleVisibleChange}
    >
      {/* ... resto del componente */}
    </CSidebar>
  )
})

AppSidebar.displayName = 'AppSidebar'

// 4. LIMPIEZA DE ESTILOS INYECTADOS

// ✅ Hook personalizado para CSS dinámico
const useDynamicCSS = (cssText) => {
  const styleRef = useRef(null)
  
  useEffect(() => {
    if (!styleRef.current) {
      styleRef.current = document.createElement('style')
      styleRef.current.id = 'dynamic-styles'
      document.head.appendChild(styleRef.current)
    }
    
    styleRef.current.textContent = cssText
    
    // ✅ Cleanup
    return () => {
      if (styleRef.current && styleRef.current.parentNode) {
        styleRef.current.parentNode.removeChild(styleRef.current)
        styleRef.current = null
      }
    }
  }, [cssText])
}

// Uso en personal.js:
// useDynamicCSS(customCSS)

// 5. CHART.JS OPTIMIZADO

// ✅ Chart component con cleanup
const OptimizedChart = ({ data, options }) => {
  const chartRef = useRef(null)
  const chartInstanceRef = useRef(null)
  
  useEffect(() => {
    if (chartRef.current && data) {
      // Destruir chart anterior si existe
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }
      
      // Crear nuevo chart
      chartInstanceRef.current = new Chart(chartRef.current, {
        type: 'line',
        data,
        options
      })
    }
    
    // ✅ Cleanup
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
        chartInstanceRef.current = null
      }
    }
  }, [data, options])
  
  return <canvas ref={chartRef} />
}

// 6. INPUT REFOCUS FIX

// ✅ Hook para mantener foco en inputs
const useInputFocusFix = () => {
  useEffect(() => {
    const handleFocusLoss = (event) => {
      const target = event.target
      if (target.matches('input, textarea, select')) {
        // Pequeño delay para asegurar que el foco no se pierda
        setTimeout(() => {
          if (document.activeElement !== target && target.value !== '') {
            target.focus()
          }
        }, 10)
      }
    }
    
    document.addEventListener('blur', handleFocusLoss, true)
    
    return () => {
      document.removeEventListener('blur', handleFocusLoss, true)
    }
  }, [])
}

// 7. MEMORY LEAK DETECTOR

// ✅ Componente para detectar fugas de memoria
const MemoryLeakDetector = () => {
  useEffect(() => {
    const checkMemoryLeaks = () => {
      const observers = []
      
      // Detectar nodos DOM sin remover
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
            mutation.removedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const eventListeners = node.getEventListeners?.()
                if (eventListeners && Object.keys(eventListeners).length > 0) {
                  console.warn('🚨 EVENT LEAK DETECTED:', {
                    element: node.tagName,
                    listeners: Object.keys(eventListeners)
                  })
                }
              }
            })
          }
        })
      })
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      })
      
      observers.push(observer)
      
      return () => {
        observers.forEach(obs => obs.disconnect())
      }
    }
    
    const cleanup = checkMemoryLeaks()
    return cleanup
  }, [])
  
  return null
}

export {
  useDynamicCSS,
  OptimizedChart,
  useInputFocusFix,
  MemoryLeakDetector
}
