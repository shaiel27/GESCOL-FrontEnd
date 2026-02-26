// 🚨 DEBUGGING TOOL - Performance Monitor para GESCOL
// Uso: Copiar este código en la consola del navegador durante el uso prolongado

class GESCOLPerformanceMonitor {
  constructor() {
    this.listeners = new Map()
    this.renders = 0
    this.memorySnapshots = []
    this.startMonitoring()
  }

  startMonitoring() {
    // Monitor de re-renders de React
    this.observeReactRenders()
    
    // Monitor de event listeners
    this.trackEventListeners()
    
    // Monitor de memoria
    this.startMemoryTracking()
    
    // Monitor de inputs bloqueados
    this.trackInputBlocking()
  }

  observeReactRenders() {
    // Contar re-renders
    let renderCount = 0
    const originalLog = console.log
    console.log = (...args) => {
      if (args[0]?.includes('🔄') || args[0]?.includes('📊')) {
        renderCount++
        this.renders++
      }
      originalLog.apply(console, args)
    }
  }

  trackEventListeners() {
    // Trackear listeners añadidos
    const originalAddEventListener = EventTarget.prototype.addEventListener
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (!window.GESCOL_MONITOR.listeners.has(this)) {
        window.GESCOL_MONITOR.listeners.set(this, new Map())
      }
      window.GESCOL_MONITOR.listeners.get(this).set(type, listener)
      return originalAddEventListener.call(this, type, listener, options)
    }
  }

  startMemoryTracking() {
    setInterval(() => {
      if (performance.memory) {
        this.memorySnapshots.push({
          timestamp: Date.now(),
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        })
        
        // Alerta si memoria crece demasiado
        if (this.memorySnapshots.length > 2) {
          const last = this.memorySnapshots[this.memorySnapshots.length - 1]
          const prev = this.memorySnapshots[this.memorySnapshots.length - 2]
          if (last.used > prev.used * 1.5) {
            console.warn('🚨 MEMORY LEAK DETECTED:', {
              before: prev.used,
              after: last.used,
              growth: ((last.used - prev.used) / prev.used * 100).toFixed(2) + '%'
            })
          }
        }
      }
    }, 5000)
  }

  trackInputBlocking() {
    // Detectar cuando los inputs dejan de responder
    const inputs = document.querySelectorAll('input, textarea, select')
    inputs.forEach(input => {
      const originalFocus = input.onfocus
      input.addEventListener('focus', () => {
        const focusTime = Date.now()
        setTimeout(() => {
          if (document.activeElement !== input) {
            console.error('🚨 INPUT BLOCKED:', {
              element: input.tagName + (input.id ? '#' + input.id : ''),
              lostFocusAfter: Date.now() - focusTime + 'ms'
            })
          }
        }, 100)
      })
    })
  }

  generateReport() {
    return {
      totalRenders: this.renders,
      eventListeners: Array.from(this.listeners.values()).reduce((acc, curr) => acc + curr.size, 0),
      memoryGrowth: this.memorySnapshots.length > 1 ? 
        ((this.memorySnapshots[this.memorySnapshots.length - 1].used - this.memorySnapshots[0].used) / this.memorySnapshots[0].used * 100).toFixed(2) + '%' : 'N/A',
      recommendations: this.generateRecommendations()
    }
  }

  generateRecommendations() {
    const recommendations = []
    
    if (this.renders > 100) {
      recommendations.push('🔴 EXCESSIVE RE-RENDERS: Implement React.memo y useMemo')
    }
    
    if (this.memorySnapshots.length > 2) {
      const growth = ((this.memorySnapshots[this.memorySnapshots.length - 1].used - this.memorySnapshots[0].used) / this.memorySnapshots[0].used * 100)
      if (growth > 50) {
        recommendations.push('🔴 MEMORY LEAK: Limpiar event listeners y useEffect')
      }
    }
    
    return recommendations
  }
}

// Inicializar monitor
window.GESCOL_MONITOR = new GESCOLPerformanceMonitor()

// Comando para ver reporte
// console.log('📊 PERFORMANCE REPORT:', window.GESCOL_MONITOR.generateReport())
