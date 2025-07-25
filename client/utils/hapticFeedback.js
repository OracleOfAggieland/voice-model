/**
 * Haptic Feedback System
 * Provides tactile feedback for supported devices
 */

export class HapticFeedbackManager {
    constructor() {
      this.isSupported = this.checkSupport();
      this.isEnabled = true;
      this.patterns = this.initializePatterns();
    }
  
    checkSupport() {
      // Check for various haptic APIs
      return !!(
        navigator.vibrate ||
        navigator.webkitVibrate ||
        navigator.mozVibrate ||
        navigator.msVibrate ||
        (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function')
      );
    }
  
    initializePatterns() {
      return {
        light: [10],
        medium: [20],
        heavy: [50],
        success: [10, 50, 10],
        error: [100, 50, 100],
        warning: [25, 25, 25],
        notification: [15, 30, 15],
        selection: [5],
        impact: [30],
        double: [20, 30, 20],
        heartbeat: [25, 50, 25, 50, 100]
      };
    }
  
    // Core vibration method
    vibrate(pattern) {
      if (!this.isSupported || !this.isEnabled) {
        return false;
      }
  
      try {
        // Modern browsers
        if (navigator.vibrate) {
          return navigator.vibrate(pattern);
        }
        
        // Webkit browsers
        if (navigator.webkitVibrate) {
          return navigator.webkitVibrate(pattern);
        }
        
        // Mozilla browsers
        if (navigator.mozVibrate) {
          return navigator.mozVibrate(pattern);
        }
        
        // IE/Edge
        if (navigator.msVibrate) {
          return navigator.msVibrate(pattern);
        }
        
        return false;
      } catch (error) {
        console.warn('Haptic feedback error:', error);
        return false;
      }
    }
  
    // Predefined haptic patterns
    light() {
      return this.vibrate(this.patterns.light);
    }
  
    medium() {
      return this.vibrate(this.patterns.medium);
    }
  
    heavy() {
      return this.vibrate(this.patterns.heavy);
    }
  
    success() {
      return this.vibrate(this.patterns.success);
    }
  
    error() {
      return this.vibrate(this.patterns.error);
    }
  
    warning() {
      return this.vibrate(this.patterns.warning);
    }
  
    notification() {
      return this.vibrate(this.patterns.notification);
    }
  
    selection() {
      return this.vibrate(this.patterns.selection);
    }
  
    impact() {
      return this.vibrate(this.patterns.impact);
    }
  
    double() {
      return this.vibrate(this.patterns.double);
    }
  
    heartbeat() {
      return this.vibrate(this.patterns.heartbeat);
    }
  
    // Custom patterns
    custom(pattern) {
      if (Array.isArray(pattern)) {
        return this.vibrate(pattern);
      } else if (typeof pattern === 'number') {
        return this.vibrate([pattern]);
      }
      return false;
    }
  
    // Context-aware haptic feedback
    buttonPress(importance = 'medium') {
      const patterns = {
        low: this.patterns.light,
        medium: this.patterns.medium,
        high: this.patterns.heavy
      };
      
      return this.vibrate(patterns[importance] || patterns.medium);
    }
  
    voiceStateChange(state) {
      const statePatterns = {
        listening: this.patterns.light,
        speaking: this.patterns.medium,
        processing: this.patterns.warning,
        error: this.patterns.error,
        success: this.patterns.success
      };
      
      return this.vibrate(statePatterns[state] || this.patterns.light);
    }
  
    messageReceived(priority = 'normal') {
      const priorityPatterns = {
        low: this.patterns.light,
        normal: this.patterns.notification,
        high: this.patterns.heavy,
        urgent: this.patterns.error
      };
      
      return this.vibrate(priorityPatterns[priority] || priorityPatterns.normal);
    }
  
    navigationFeedback(action) {
      const navigationPatterns = {
        swipe: this.patterns.light,
        scroll: this.patterns.selection,
        tap: this.patterns.medium,
        longPress: this.patterns.heavy
      };
      
      return this.vibrate(navigationPatterns[action] || this.patterns.selection);
    }
  
    // Control methods
    enable() {
      this.isEnabled = true;
    }
  
    disable() {
      this.isEnabled = false;
    }
  
    toggle() {
      this.isEnabled = !this.isEnabled;
      return this.isEnabled;
    }
  
    // Settings
    setPattern(name, pattern) {
      this.patterns[name] = pattern;
    }
  
    getPattern(name) {
      return this.patterns[name];
    }
  
    getAllPatterns() {
      return { ...this.patterns };
    }
  
    // Device capability detection
    async requestPermission() {
      // For iOS 13+ devices that require permission
      if (typeof DeviceMotionEvent !== 'undefined' && 
          typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceMotionEvent.requestPermission();
          return permission === 'granted';
        } catch (error) {
          console.warn('Motion permission request failed:', error);
          return false;
        }
      }
      
      return this.isSupported;
    }
  
    // Advanced features
    createSequence(sequences, interval = 100) {
      if (!Array.isArray(sequences)) return false;
      
      let currentIndex = 0;
      
      const playNext = () => {
        if (currentIndex < sequences.length) {
          this.vibrate(sequences[currentIndex]);
          currentIndex++;
          setTimeout(playNext, interval);
        }
      };
      
      playNext();
      return true;
    }
  
    // Accessibility integration
    shouldUseHapticForA11y() {
      // Check if user prefers reduced motion (might also prefer reduced haptics)
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return this.isEnabled && !prefersReducedMotion;
    }
  
    accessibilityFeedback(type) {
      if (!this.shouldUseHapticForA11y()) return false;
      
      const a11yPatterns = {
        focus: this.patterns.light,
        select: this.patterns.medium,
        activate: this.patterns.heavy,
        navigate: this.patterns.selection,
        error: this.patterns.error,
        success: this.patterns.success
      };
      
      return this.vibrate(a11yPatterns[type] || this.patterns.light);
    }
  
    // React hooks integration
    createHapticHook() {
      return {
        isSupported: this.isSupported,
        isEnabled: this.isEnabled,
        light: () => this.light(),
        medium: () => this.medium(),
        heavy: () => this.heavy(),
        success: () => this.success(),
        error: () => this.error(),
        custom: (pattern) => this.custom(pattern),
        enable: () => this.enable(),
        disable: () => this.disable(),
        toggle: () => this.toggle()
      };
    }
  
    // Testing and debugging
    test() {
      console.log('Testing haptic feedback...');
      console.log('Supported:', this.isSupported);
      console.log('Enabled:', this.isEnabled);
      
      if (this.isSupported && this.isEnabled) {
        // Test sequence
        setTimeout(() => this.light(), 0);
        setTimeout(() => this.medium(), 200);
        setTimeout(() => this.heavy(), 400);
        setTimeout(() => this.success(), 600);
        
        console.log('Haptic test sequence started');
      } else {
        console.log('Haptic feedback not available');
      }
    }
  
    // Performance tracking
    getUsageStats() {
      // This would typically track usage patterns
      return {
        supported: this.isSupported,
        enabled: this.isEnabled,
        patternsCount: Object.keys(this.patterns).length
      };
    }
  }
  
  // Singleton instance
  export const hapticFeedback = new HapticFeedbackManager();
  
  // React hook
  export function useHapticFeedback() {
    return hapticFeedback.createHapticHook();
  }
  
  // Convenience exports
  export const {
    light,
    medium,
    heavy,
    success,
    error,
    warning,
    notification,
    selection,
    impact
  } = hapticFeedback;