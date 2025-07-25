/**
 * Performance monitoring and optimization utilities
 * Provides memory management, frame rate monitoring, and automatic quality adjustment
 */

// Performance monitoring constants
const PERFORMANCE_THRESHOLDS = {
  FRAME_RATE_TARGET: 60,
  FRAME_RATE_MIN: 30,
  MEMORY_WARNING_MB: 100,
  MEMORY_CRITICAL_MB: 200,
  ANIMATION_BUDGET_MS: 16, // 60fps budget
  IDLE_CALLBACK_TIMEOUT: 5000,
};

// Quality levels for automatic adjustment
export const QUALITY_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  MINIMAL: 'minimal',
};

// Performance metrics tracking
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      frameRate: 60,
      memoryUsage: 0,
      animationFrameTime: 0,
      lastFrameTime: performance.now(),
      frameCount: 0,
      droppedFrames: 0,
    };
    
    this.callbacks = new Set();
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.frameRateHistory = [];
    this.memoryHistory = [];
    
    this.startMonitoring();
  }

  // Start performance monitoring
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Only start monitoring in browser environment
    if (typeof window !== 'undefined' && typeof requestAnimationFrame !== 'undefined') {
      this.monitorFrameRate();
    }
    this.monitorMemoryUsage();
  }

  // Stop performance monitoring
  stopMonitoring() {
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // Monitor frame rate
  monitorFrameRate() {
    if (typeof requestAnimationFrame === 'undefined') {
      // Fallback for Node.js environment
      this.metrics.frameRate = 60; // Assume good performance
      return;
    }
    
    const measureFrame = (currentTime) => {
      if (!this.isMonitoring) return;
      
      const deltaTime = currentTime - this.metrics.lastFrameTime;
      this.metrics.animationFrameTime = deltaTime;
      this.metrics.lastFrameTime = currentTime;
      this.metrics.frameCount++;
      
      // Calculate frame rate
      if (deltaTime > 0) {
        const currentFPS = 1000 / deltaTime;
        this.metrics.frameRate = currentFPS;
        
        // Track frame rate history
        this.frameRateHistory.push(currentFPS);
        if (this.frameRateHistory.length > 60) {
          this.frameRateHistory.shift();
        }
        
        // Detect dropped frames
        if (currentFPS < PERFORMANCE_THRESHOLDS.FRAME_RATE_MIN) {
          this.metrics.droppedFrames++;
        }
      }
      
      requestAnimationFrame(measureFrame);
    };
    
    requestAnimationFrame(measureFrame);
  }

  // Monitor memory usage
  monitorMemoryUsage() {
    this.monitoringInterval = setInterval(() => {
      if (!this.isMonitoring) return;
      
      // Use performance.memory if available (Chrome)
      if (performance && performance.memory) {
        const memoryMB = performance.memory.usedJSHeapSize / (1024 * 1024);
        this.metrics.memoryUsage = memoryMB;
        
        // Track memory history
        this.memoryHistory.push(memoryMB);
        if (this.memoryHistory.length > 60) {
          this.memoryHistory.shift();
        }
        
        // Notify callbacks of performance changes
        this.notifyCallbacks();
      } else {
        // Fallback for environments without performance.memory
        this.metrics.memoryUsage = 50; // Assume reasonable memory usage
        this.notifyCallbacks();
      }
    }, 1000);
  }

  // Register callback for performance updates
  onPerformanceChange(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  // Notify all callbacks
  notifyCallbacks() {
    const performanceData = this.getPerformanceData();
    this.callbacks.forEach(callback => {
      try {
        callback(performanceData);
      } catch (error) {
        console.error('Error in performance callback:', error);
      }
    });
  }

  // Get current performance data
  getPerformanceData() {
    const avgFrameRate = this.frameRateHistory.length > 0
      ? this.frameRateHistory.reduce((sum, fps) => sum + fps, 0) / this.frameRateHistory.length
      : this.metrics.frameRate;
    
    const avgMemoryUsage = this.memoryHistory.length > 0
      ? this.memoryHistory.reduce((sum, mem) => sum + mem, 0) / this.memoryHistory.length
      : this.metrics.memoryUsage;

    return {
      frameRate: this.metrics.frameRate,
      avgFrameRate,
      memoryUsage: this.metrics.memoryUsage,
      avgMemoryUsage,
      animationFrameTime: this.metrics.animationFrameTime,
      frameCount: this.metrics.frameCount,
      droppedFrames: this.metrics.droppedFrames,
      isPerformanceGood: avgFrameRate >= PERFORMANCE_THRESHOLDS.FRAME_RATE_TARGET,
      isMemoryHealthy: avgMemoryUsage < PERFORMANCE_THRESHOLDS.MEMORY_WARNING_MB,
    };
  }

  // Get recommended quality level based on performance
  getRecommendedQuality() {
    const data = this.getPerformanceData();
    
    if (data.avgFrameRate >= PERFORMANCE_THRESHOLDS.FRAME_RATE_TARGET && 
        data.avgMemoryUsage < PERFORMANCE_THRESHOLDS.MEMORY_WARNING_MB) {
      return QUALITY_LEVELS.HIGH;
    } else if (data.avgFrameRate >= PERFORMANCE_THRESHOLDS.FRAME_RATE_MIN && 
               data.avgMemoryUsage < PERFORMANCE_THRESHOLDS.MEMORY_CRITICAL_MB) {
      return QUALITY_LEVELS.MEDIUM;
    } else if (data.avgFrameRate >= 20) {
      return QUALITY_LEVELS.LOW;
    } else {
      return QUALITY_LEVELS.MINIMAL;
    }
  }

  // Clean up
  destroy() {
    this.stopMonitoring();
    this.callbacks.clear();
  }
}

// Memory management utilities
export class MemoryManager {
  constructor() {
    this.cleanupTasks = new Set();
    this.memoryPressureCallbacks = new Set();
    this.isCleanupScheduled = false;
    this.conversationMemoryLimit = 1000; // Max messages to keep in memory
    this.audioBufferLimit = 50; // Max audio buffers to keep
    this.canvasContexts = new Set();
    this.eventListeners = new Map();
    this.timers = new Set();
    
    // Listen for memory pressure events if available
    if ('memory' in performance) {
      this.setupMemoryPressureDetection();
    }
    
    // Setup page visibility listener for cleanup
    this.setupVisibilityListener();
  }

  // Register cleanup task
  registerCleanupTask(task, priority = 'normal') {
    const cleanupTask = {
      task,
      priority,
      id: Math.random().toString(36).substr(2, 9),
    };
    
    this.cleanupTasks.add(cleanupTask);
    return () => this.cleanupTasks.delete(cleanupTask);
  }

  // Schedule cleanup during idle time
  scheduleCleanup() {
    if (this.isCleanupScheduled) return;
    
    this.isCleanupScheduled = true;
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.performCleanup();
        this.isCleanupScheduled = false;
      }, { timeout: PERFORMANCE_THRESHOLDS.IDLE_CALLBACK_TIMEOUT });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.performCleanup();
        this.isCleanupScheduled = false;
      }, 100);
    }
  }

  // Perform cleanup tasks
  performCleanup() {
    const sortedTasks = Array.from(this.cleanupTasks).sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    sortedTasks.forEach(({ task }) => {
      try {
        task();
      } catch (error) {
        console.error('Error in cleanup task:', error);
      }
    });
  }

  // Force immediate cleanup
  forceCleanup() {
    this.performCleanup();
    
    // Suggest garbage collection if available
    if ('gc' in window && typeof window.gc === 'function') {
      window.gc();
    }
  }

  // Setup memory pressure detection
  setupMemoryPressureDetection() {
    let lastMemoryCheck = 0;
    const checkInterval = 5000; // Check every 5 seconds
    
    const checkMemoryPressure = () => {
      const now = Date.now();
      if (now - lastMemoryCheck < checkInterval) return;
      
      lastMemoryCheck = now;
      
      if (performance.memory) {
        const memoryMB = performance.memory.usedJSHeapSize / (1024 * 1024);
        
        if (memoryMB > PERFORMANCE_THRESHOLDS.MEMORY_WARNING_MB) {
          this.notifyMemoryPressure('warning', memoryMB);
          this.scheduleCleanup();
        }
        
        if (memoryMB > PERFORMANCE_THRESHOLDS.MEMORY_CRITICAL_MB) {
          this.notifyMemoryPressure('critical', memoryMB);
          this.forceCleanup();
        }
      }
    };
    
    // Check memory pressure periodically
    setInterval(checkMemoryPressure, checkInterval);
  }

  // Register memory pressure callback
  onMemoryPressure(callback) {
    this.memoryPressureCallbacks.add(callback);
    return () => this.memoryPressureCallbacks.delete(callback);
  }

  // Notify memory pressure callbacks
  notifyMemoryPressure(level, memoryUsage) {
    this.memoryPressureCallbacks.forEach(callback => {
      try {
        callback(level, memoryUsage);
      } catch (error) {
        console.error('Error in memory pressure callback:', error);
      }
    });
  }

  // Register canvas context for cleanup
  registerCanvasContext(canvas, context) {
    this.canvasContexts.add({ canvas, context });
    return () => {
      this.canvasContexts.delete({ canvas, context });
    };
  }

  // Register event listener for cleanup
  registerEventListener(element, event, handler, options) {
    const key = `${element.constructor.name}-${event}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, new Set());
    }
    
    const listenerInfo = { element, event, handler, options };
    this.eventListeners.get(key).add(listenerInfo);
    
    element.addEventListener(event, handler, options);
    
    return () => {
      element.removeEventListener(event, handler, options);
      this.eventListeners.get(key)?.delete(listenerInfo);
    };
  }

  // Register timer for cleanup
  registerTimer(timerId, type = 'timeout') {
    const timerInfo = { id: timerId, type };
    this.timers.add(timerInfo);
    
    return () => {
      if (type === 'timeout') {
        clearTimeout(timerId);
      } else if (type === 'interval') {
        clearInterval(timerId);
      }
      this.timers.delete(timerInfo);
    };
  }

  // Clean up conversation memory
  cleanupConversationMemory(messages) {
    if (messages.length <= this.conversationMemoryLimit) return messages;
    
    // Keep recent messages and important ones
    const recentMessages = messages.slice(-this.conversationMemoryLimit * 0.8);
    const importantMessages = messages
      .slice(0, -this.conversationMemoryLimit * 0.8)
      .filter(msg => msg.important || msg.pinned);
    
    return [...importantMessages, ...recentMessages];
  }

  // Clean up audio buffers
  cleanupAudioBuffers(audioBuffers) {
    if (audioBuffers.length <= this.audioBufferLimit) return audioBuffers;
    
    // Keep only recent buffers
    const recentBuffers = audioBuffers.slice(-this.audioBufferLimit);
    
    // Clean up old buffers
    audioBuffers.slice(0, -this.audioBufferLimit).forEach(buffer => {
      if (buffer && typeof buffer.close === 'function') {
        buffer.close();
      }
    });
    
    return recentBuffers;
  }

  // Clean up canvas contexts
  cleanupCanvasContexts() {
    this.canvasContexts.forEach(({ canvas, context }) => {
      try {
        if (context && canvas) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          
          // Reset context state
          context.setTransform(1, 0, 0, 1, 0, 0);
          context.globalAlpha = 1;
          context.globalCompositeOperation = 'source-over';
        }
      } catch (error) {
        console.warn('Error cleaning up canvas context:', error);
      }
    });
  }

  // Clean up event listeners
  cleanupEventListeners() {
    this.eventListeners.forEach((listeners, key) => {
      listeners.forEach(({ element, event, handler, options }) => {
        try {
          element.removeEventListener(event, handler, options);
        } catch (error) {
          console.warn(`Error removing event listener ${key}:`, error);
        }
      });
    });
    this.eventListeners.clear();
  }

  // Clean up timers
  cleanupTimers() {
    this.timers.forEach(({ id, type }) => {
      try {
        if (type === 'timeout') {
          clearTimeout(id);
        } else if (type === 'interval') {
          clearInterval(id);
        }
      } catch (error) {
        console.warn(`Error clearing ${type}:`, error);
      }
    });
    this.timers.clear();
  }

  // Setup page visibility listener
  setupVisibilityListener() {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, perform cleanup
        this.scheduleCleanup();
      }
    };
    
    this.registerEventListener(document, 'visibilitychange', handleVisibilityChange);
  }

  // Get memory usage statistics
  getMemoryStats() {
    const stats = {
      cleanupTasks: this.cleanupTasks.size,
      canvasContexts: this.canvasContexts.size,
      eventListeners: Array.from(this.eventListeners.values()).reduce((sum, set) => sum + set.size, 0),
      timers: this.timers.size,
    };
    
    if (performance.memory) {
      stats.jsHeapSizeLimit = performance.memory.jsHeapSizeLimit;
      stats.totalJSHeapSize = performance.memory.totalJSHeapSize;
      stats.usedJSHeapSize = performance.memory.usedJSHeapSize;
      stats.memoryUsagePercent = (stats.usedJSHeapSize / stats.jsHeapSizeLimit) * 100;
    }
    
    return stats;
  }

  // Clean up
  destroy() {
    this.cleanupEventListeners();
    this.cleanupTimers();
    this.cleanupCanvasContexts();
    this.cleanupTasks.clear();
    this.memoryPressureCallbacks.clear();
    this.canvasContexts.clear();
  }
}

// Automatic quality adjustment manager
export class QualityManager {
  constructor(performanceMonitor) {
    this.performanceMonitor = performanceMonitor;
    this.currentQuality = QUALITY_LEVELS.HIGH;
    this.qualityCallbacks = new Set();
    this.adjustmentHistory = [];
    this.lastAdjustment = 0;
    this.adjustmentCooldown = 5000; // 5 seconds between adjustments
    
    // Listen to performance changes
    this.performanceMonitor.onPerformanceChange((data) => {
      this.considerQualityAdjustment(data);
    });
  }

  // Consider adjusting quality based on performance
  considerQualityAdjustment(performanceData) {
    const now = Date.now();
    if (now - this.lastAdjustment < this.adjustmentCooldown) return;
    
    const recommendedQuality = this.performanceMonitor.getRecommendedQuality();
    
    if (recommendedQuality !== this.currentQuality) {
      this.adjustQuality(recommendedQuality, performanceData);
      this.lastAdjustment = now;
    }
  }

  // Adjust quality level
  adjustQuality(newQuality, performanceData) {
    const oldQuality = this.currentQuality;
    this.currentQuality = newQuality;
    
    // Track adjustment history
    this.adjustmentHistory.push({
      timestamp: Date.now(),
      from: oldQuality,
      to: newQuality,
      reason: this.getAdjustmentReason(performanceData),
    });
    
    // Keep only recent history
    if (this.adjustmentHistory.length > 10) {
      this.adjustmentHistory.shift();
    }
    
    // Notify callbacks
    this.notifyQualityChange(newQuality, oldQuality, performanceData);
  }

  // Get reason for quality adjustment
  getAdjustmentReason(performanceData) {
    if (performanceData.avgFrameRate < PERFORMANCE_THRESHOLDS.FRAME_RATE_MIN) {
      return 'low_frame_rate';
    } else if (performanceData.avgMemoryUsage > PERFORMANCE_THRESHOLDS.MEMORY_CRITICAL_MB) {
      return 'high_memory_usage';
    } else if (performanceData.droppedFrames > 10) {
      return 'dropped_frames';
    } else if (performanceData.avgFrameRate >= PERFORMANCE_THRESHOLDS.FRAME_RATE_TARGET) {
      return 'performance_improved';
    }
    return 'automatic_adjustment';
  }

  // Register quality change callback
  onQualityChange(callback) {
    this.qualityCallbacks.add(callback);
    return () => this.qualityCallbacks.delete(callback);
  }

  // Notify quality change callbacks
  notifyQualityChange(newQuality, oldQuality, performanceData) {
    this.qualityCallbacks.forEach(callback => {
      try {
        callback(newQuality, oldQuality, performanceData);
      } catch (error) {
        console.error('Error in quality change callback:', error);
      }
    });
  }

  // Get current quality level
  getCurrentQuality() {
    return this.currentQuality;
  }

  // Get quality settings for different levels
  getQualitySettings(quality = this.currentQuality) {
    const settings = {
      [QUALITY_LEVELS.HIGH]: {
        animationQuality: 'high',
        particleCount: 100,
        visualizationComplexity: 'high',
        canvasResolution: 1.0,
        enableBlur: true,
        enableGlow: true,
        enableParticles: true,
        frameRateTarget: 60,
      },
      [QUALITY_LEVELS.MEDIUM]: {
        animationQuality: 'medium',
        particleCount: 50,
        visualizationComplexity: 'medium',
        canvasResolution: 0.8,
        enableBlur: true,
        enableGlow: false,
        enableParticles: true,
        frameRateTarget: 45,
      },
      [QUALITY_LEVELS.LOW]: {
        animationQuality: 'low',
        particleCount: 25,
        visualizationComplexity: 'low',
        canvasResolution: 0.6,
        enableBlur: false,
        enableGlow: false,
        enableParticles: false,
        frameRateTarget: 30,
      },
      [QUALITY_LEVELS.MINIMAL]: {
        animationQuality: 'minimal',
        particleCount: 0,
        visualizationComplexity: 'minimal',
        canvasResolution: 0.5,
        enableBlur: false,
        enableGlow: false,
        enableParticles: false,
        frameRateTarget: 20,
      },
    };
    
    return settings[quality] || settings[QUALITY_LEVELS.MEDIUM];
  }

  // Manually set quality level
  setQuality(quality) {
    if (Object.values(QUALITY_LEVELS).includes(quality)) {
      const oldQuality = this.currentQuality;
      this.currentQuality = quality;
      this.notifyQualityChange(quality, oldQuality, this.performanceMonitor.getPerformanceData());
    }
  }

  // Get adjustment history
  getAdjustmentHistory() {
    return [...this.adjustmentHistory];
  }
}

// Animation frame manager for efficient rendering
export class AnimationFrameManager {
  constructor() {
    this.animations = new Map();
    this.isRunning = false;
    this.frameId = null;
    this.lastFrameTime = 0;
    this.frameTimeTarget = 1000 / 60; // 60fps target
  }

  // Register animation
  register(id, callback, priority = 'normal') {
    const animation = {
      id,
      callback,
      priority,
      lastRun: 0,
      isActive: true,
    };
    
    this.animations.set(id, animation);
    
    if (!this.isRunning) {
      this.start();
    }
    
    return () => this.unregister(id);
  }

  // Unregister animation
  unregister(id) {
    this.animations.delete(id);
    
    if (this.animations.size === 0) {
      this.stop();
    }
  }

  // Start animation loop
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.animate();
  }

  // Stop animation loop
  stop() {
    this.isRunning = false;
    
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  // Main animation loop
  animate = (currentTime = performance.now()) => {
    if (!this.isRunning) return;
    
    const deltaTime = currentTime - this.lastFrameTime;
    
    // Throttle frame rate if needed
    if (deltaTime >= this.frameTimeTarget) {
      // Sort animations by priority
      const sortedAnimations = Array.from(this.animations.values()).sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      
      // Run animations
      sortedAnimations.forEach(animation => {
        if (animation.isActive) {
          try {
            animation.callback(currentTime, deltaTime);
            animation.lastRun = currentTime;
          } catch (error) {
            console.error(`Error in animation ${animation.id}:`, error);
          }
        }
      });
      
      this.lastFrameTime = currentTime;
    }
    
    this.frameId = requestAnimationFrame(this.animate);
  };

  // Pause animation
  pause(id) {
    const animation = this.animations.get(id);
    if (animation) {
      animation.isActive = false;
    }
  }

  // Resume animation
  resume(id) {
    const animation = this.animations.get(id);
    if (animation) {
      animation.isActive = true;
    }
  }

  // Set frame rate target
  setFrameRateTarget(fps) {
    this.frameTimeTarget = 1000 / fps;
  }

  // Clean up
  destroy() {
    this.stop();
    this.animations.clear();
  }
}

// Enhanced motion-aware performance optimization
export class MotionAwarePerformanceManager {
  constructor(performanceMonitor, qualityManager, motionPreferencesManager) {
    this.performanceMonitor = performanceMonitor;
    this.qualityManager = qualityManager;
    this.motionPreferencesManager = motionPreferencesManager;
    this.callbacks = new Set();
    this.optimizationHistory = [];
    
    // Listen for motion preference changes
    this.motionPreferencesManager.onChange((reducedMotion, previousState, preferences) => {
      this.handleMotionPreferenceChange(reducedMotion, preferences);
    });
    
    // Listen for performance changes
    this.performanceMonitor.onPerformanceChange((data) => {
      this.handlePerformanceChange(data);
    });
  }

  // Handle motion preference changes
  handleMotionPreferenceChange(reducedMotion, preferences) {
    const optimization = {
      timestamp: Date.now(),
      type: 'motion_preference',
      reducedMotion,
      preferences,
      actions: []
    };

    if (reducedMotion) {
      // Optimize for reduced motion
      optimization.actions.push('disable_complex_animations');
      optimization.actions.push('reduce_particle_count');
      optimization.actions.push('simplify_transitions');
      
      // Force lower quality if motion is reduced
      if (this.qualityManager.getCurrentQuality() === 'high') {
        this.qualityManager.setQuality('medium');
        optimization.actions.push('reduce_quality_to_medium');
      }
    } else {
      // Allow normal motion based on performance
      const performanceData = this.performanceMonitor.getPerformanceData();
      if (performanceData.isPerformanceGood) {
        optimization.actions.push('enable_normal_animations');
        optimization.actions.push('restore_particle_effects');
      }
    }

    this.optimizationHistory.push(optimization);
    this.notifyCallbacks(optimization);
  }

  // Handle performance changes with motion awareness
  handlePerformanceChange(performanceData) {
    const reducedMotion = this.motionPreferencesManager.shouldReduceMotion();
    
    const optimization = {
      timestamp: Date.now(),
      type: 'performance_change',
      performanceData,
      reducedMotion,
      actions: []
    };

    // More aggressive optimization if motion is already reduced
    if (reducedMotion) {
      if (!performanceData.isPerformanceGood) {
        optimization.actions.push('disable_all_animations');
        optimization.actions.push('reduce_canvas_resolution');
        optimization.actions.push('limit_frame_rate');
      }
    } else {
      // Standard performance optimization
      if (!performanceData.isPerformanceGood) {
        optimization.actions.push('reduce_animation_complexity');
        optimization.actions.push('lower_particle_count');
      }
    }

    if (optimization.actions.length > 0) {
      this.optimizationHistory.push(optimization);
      this.notifyCallbacks(optimization);
    }
  }

  // Register callback for optimization changes
  onOptimization(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  // Notify callbacks
  notifyCallbacks(optimization) {
    this.callbacks.forEach(callback => {
      try {
        callback(optimization);
      } catch (error) {
        console.error('Error in motion-aware performance callback:', error);
      }
    });
  }

  // Get current optimization recommendations
  getCurrentOptimizations() {
    const reducedMotion = this.motionPreferencesManager.shouldReduceMotion();
    const performanceData = this.performanceMonitor.getPerformanceData();
    const qualityLevel = this.qualityManager.getCurrentQuality();

    return {
      reducedMotion,
      performanceData,
      qualityLevel,
      recommendations: this.generateRecommendations(reducedMotion, performanceData, qualityLevel)
    };
  }

  // Generate optimization recommendations
  generateRecommendations(reducedMotion, performanceData, qualityLevel) {
    const recommendations = [];

    if (reducedMotion) {
      recommendations.push({
        type: 'motion',
        action: 'disable_complex_animations',
        reason: 'User prefers reduced motion',
        priority: 'high'
      });
      
      recommendations.push({
        type: 'motion',
        action: 'use_simple_transitions',
        reason: 'Accessibility preference',
        priority: 'high'
      });
    }

    if (!performanceData.isPerformanceGood) {
      recommendations.push({
        type: 'performance',
        action: 'reduce_quality',
        reason: `Low frame rate: ${performanceData.avgFrameRate.toFixed(1)} fps`,
        priority: 'medium'
      });
    }

    if (!performanceData.isMemoryHealthy) {
      recommendations.push({
        type: 'memory',
        action: 'cleanup_resources',
        reason: `High memory usage: ${performanceData.avgMemoryUsage.toFixed(1)} MB`,
        priority: 'high'
      });
    }

    return recommendations;
  }

  // Get optimization history
  getOptimizationHistory() {
    return [...this.optimizationHistory];
  }

  // Clean up
  destroy() {
    this.callbacks.clear();
    this.optimizationHistory = [];
  }
}

// Enhanced memory manager with conversation-specific optimizations
export class ConversationMemoryManager extends MemoryManager {
  constructor() {
    super();
    this.conversationCleanupThreshold = 500; // messages
    this.audioBufferCleanupThreshold = 30; // buffers
    this.visualizationDataLimit = 100; // data points
    this.lastConversationCleanup = 0;
    this.cleanupCooldown = 30000; // 30 seconds
  }

  // Clean up conversation-specific memory
  cleanupConversationMemory(messages, audioBuffers = [], visualizationData = []) {
    const now = Date.now();
    if (now - this.lastConversationCleanup < this.cleanupCooldown) {
      return { messages, audioBuffers, visualizationData };
    }

    this.lastConversationCleanup = now;
    const cleanupResults = {
      messagesRemoved: 0,
      audioBuffersRemoved: 0,
      visualizationDataRemoved: 0
    };

    // Clean up old messages
    let cleanedMessages = messages;
    if (messages.length > this.conversationCleanupThreshold) {
      const keepCount = Math.floor(this.conversationCleanupThreshold * 0.8);
      const importantMessages = messages.filter(msg => msg.important || msg.pinned);
      const recentMessages = messages.slice(-keepCount);
      
      cleanedMessages = [...importantMessages, ...recentMessages];
      cleanupResults.messagesRemoved = messages.length - cleanedMessages.length;
    }

    // Clean up audio buffers
    let cleanedAudioBuffers = audioBuffers;
    if (audioBuffers.length > this.audioBufferCleanupThreshold) {
      cleanedAudioBuffers = audioBuffers.slice(-this.audioBufferCleanupThreshold);
      cleanupResults.audioBuffersRemoved = audioBuffers.length - cleanedAudioBuffers.length;
      
      // Dispose of old buffers
      audioBuffers.slice(0, -this.audioBufferCleanupThreshold).forEach(buffer => {
        if (buffer && typeof buffer.close === 'function') {
          buffer.close();
        }
      });
    }

    // Clean up visualization data
    let cleanedVisualizationData = visualizationData;
    if (visualizationData.length > this.visualizationDataLimit) {
      cleanedVisualizationData = visualizationData.slice(-this.visualizationDataLimit);
      cleanupResults.visualizationDataRemoved = visualizationData.length - cleanedVisualizationData.length;
    }

    // Log cleanup results
    if (cleanupResults.messagesRemoved > 0 || cleanupResults.audioBuffersRemoved > 0 || cleanupResults.visualizationDataRemoved > 0) {
      console.log('Conversation memory cleanup completed:', cleanupResults);
    }

    return {
      messages: cleanedMessages,
      audioBuffers: cleanedAudioBuffers,
      visualizationData: cleanedVisualizationData,
      cleanupResults
    };
  }

  // Monitor conversation memory usage
  getConversationMemoryStats(messages = [], audioBuffers = [], visualizationData = []) {
    const stats = {
      messages: {
        count: messages.length,
        threshold: this.conversationCleanupThreshold,
        needsCleanup: messages.length > this.conversationCleanupThreshold
      },
      audioBuffers: {
        count: audioBuffers.length,
        threshold: this.audioBufferCleanupThreshold,
        needsCleanup: audioBuffers.length > this.audioBufferCleanupThreshold
      },
      visualizationData: {
        count: visualizationData.length,
        threshold: this.visualizationDataLimit,
        needsCleanup: visualizationData.length > this.visualizationDataLimit
      },
      overallHealth: 'good'
    };

    // Determine overall health
    if (stats.messages.needsCleanup || stats.audioBuffers.needsCleanup || stats.visualizationData.needsCleanup) {
      stats.overallHealth = 'needs_cleanup';
    }

    return stats;
  }
}

// Create singleton instances (lazy initialization for Node.js compatibility)
let performanceMonitor = null;
let memoryManager = null;
let conversationMemoryManager = null;
let qualityManager = null;
let animationFrameManager = null;

// Initialize singletons
function initializeSingletons() {
  if (typeof window !== 'undefined' && !performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
    memoryManager = new MemoryManager();
    conversationMemoryManager = new ConversationMemoryManager();
    qualityManager = new QualityManager(performanceMonitor);
    animationFrameManager = new AnimationFrameManager();
  }
}

// Export getters for singletons
export const getPerformanceMonitor = () => {
  initializeSingletons();
  return performanceMonitor;
};

export const getMemoryManager = () => {
  initializeSingletons();
  return memoryManager;
};

export const getConversationMemoryManager = () => {
  initializeSingletons();
  return conversationMemoryManager;
};

export const getQualityManager = () => {
  initializeSingletons();
  return qualityManager;
};

export const getAnimationFrameManager = () => {
  initializeSingletons();
  return animationFrameManager;
};

// Classes are already exported individually above

// Utility functions
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Motion-aware performance manager (initialized after accessibility utils are loaded)
let motionAwarePerformanceManager = null;

// Initialize motion-aware performance manager
export const initializeMotionAwarePerformance = (motionPreferencesManager) => {
  if (!motionAwarePerformanceManager) {
    initializeSingletons();
    motionAwarePerformanceManager = new MotionAwarePerformanceManager(
      getPerformanceMonitor(),
      getQualityManager(),
      motionPreferencesManager
    );
  }
  return motionAwarePerformanceManager;
};

// Get motion-aware performance manager
export const getMotionAwarePerformanceManager = () => {
  return motionAwarePerformanceManager;
};

// Clean up all performance utilities
export const cleanupPerformance = () => {
  if (performanceMonitor) performanceMonitor.destroy();
  if (memoryManager) memoryManager.destroy();
  if (conversationMemoryManager) conversationMemoryManager.destroy();
  if (qualityManager) qualityManager.destroy();
  if (animationFrameManager) animationFrameManager.destroy();
  if (motionAwarePerformanceManager) {
    motionAwarePerformanceManager.destroy();
  }
};