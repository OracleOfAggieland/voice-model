/**
 * Accessibility utilities for voice interface components
 * Provides ARIA announcements, keyboard navigation, and screen reader support
 */

// ARIA live region types
export const ARIA_LIVE_TYPES = {
  OFF: 'off',
  POLITE: 'polite',
  ASSERTIVE: 'assertive',
};

// Voice state announcements
export const VOICE_STATE_ANNOUNCEMENTS = {
  idle: 'Voice interface ready. Press space to start session.',
  connecting: 'Connecting to voice service...',
  listening: 'Listening for your voice input.',
  speaking: 'AI is responding.',
  processing: 'Processing your request...',
  error: 'Voice interface error occurred.',
  muted: 'Microphone muted.',
  unmuted: 'Microphone unmuted.',
  paused: 'Voice session paused.',
  resumed: 'Voice session resumed.',
  stopped: 'Voice session ended.',
  // Additional state announcements
  session_started: 'Voice session started successfully.',
  session_ended: 'Voice session ended.',
  audio_detected: 'Audio input detected.',
  audio_stopped: 'Audio input stopped.',
  transcription_started: 'Transcription in progress.',
  transcription_completed: 'Transcription completed.',
  response_generating: 'AI response generating.',
  response_completed: 'AI response completed.',
  connection_lost: 'Connection lost. Attempting to reconnect.',
  connection_restored: 'Connection restored.',
  quality_adjusted: 'Audio quality automatically adjusted.',
};

// Keyboard navigation constants
export const KEYBOARD_KEYS = {
  SPACE: ' ',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
};

// Focus management utilities
export class FocusManager {
  constructor() {
    this.focusableElements = [
      'button',
      'input',
      'select',
      'textarea',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ];
    this.trapStack = [];
  }

  // Get all focusable elements within a container
  getFocusableElements(container) {
    const selector = this.focusableElements.join(', ');
    return Array.from(container.querySelectorAll(selector)).filter(
      el => !el.disabled && el.offsetParent !== null
    );
  }

  // Set up focus trap within a container
  trapFocus(container, initialFocus = null) {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return null;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key === KEYBOARD_KEYS.TAB) {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus initial element
    if (initialFocus && focusableElements.includes(initialFocus)) {
      initialFocus.focus();
    } else {
      firstElement.focus();
    }

    const trap = {
      container,
      handleKeyDown,
      release: () => {
        container.removeEventListener('keydown', handleKeyDown);
        this.trapStack = this.trapStack.filter(t => t !== trap);
      }
    };

    this.trapStack.push(trap);
    return trap;
  }

  // Release all focus traps
  releaseAllTraps() {
    this.trapStack.forEach(trap => trap.release());
    this.trapStack = [];
  }

  // Move focus to next/previous focusable element
  moveFocus(direction, container = typeof document !== 'undefined' ? document : null) {
    if (!container) return;
    const focusableElements = this.getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(document.activeElement);
    
    let nextIndex;
    if (direction === 'next') {
      nextIndex = currentIndex + 1;
      if (nextIndex >= focusableElements.length) nextIndex = 0;
    } else {
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) nextIndex = focusableElements.length - 1;
    }

    focusableElements[nextIndex]?.focus();
  }
}

// ARIA live announcer
export class AriaAnnouncer {
  constructor() {
    this.liveRegions = new Map();
    if (typeof document !== 'undefined' && document.body) {
      this.createLiveRegions();
    }
  }

  // Create ARIA live regions for announcements
  createLiveRegions() {
    if (typeof document === 'undefined' || !document.body) return;
    Object.values(ARIA_LIVE_TYPES).forEach(type => {
      if (type === ARIA_LIVE_TYPES.OFF) return;
      
      const region = document.createElement('div');
      region.setAttribute('aria-live', type);
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only';
      region.style.cssText = `
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      `;
      
      document.body.appendChild(region);
      this.liveRegions.set(type, region);
    });
  }

  // Announce message to screen readers
  announce(message, priority = ARIA_LIVE_TYPES.POLITE, delay = 100) {
    const region = this.liveRegions.get(priority);
    if (!region) return;

    // Clear previous announcement
    region.textContent = '';
    
    // Announce after brief delay to ensure screen reader picks it up
    setTimeout(() => {
      region.textContent = message;
    }, delay);
  }

  // Announce voice state changes
  announceVoiceState(state, additionalInfo = '') {
    const baseMessage = VOICE_STATE_ANNOUNCEMENTS[state] || `Voice state: ${state}`;
    const fullMessage = additionalInfo ? `${baseMessage} ${additionalInfo}` : baseMessage;
    
    const priority = state === 'error' ? ARIA_LIVE_TYPES.ASSERTIVE : ARIA_LIVE_TYPES.POLITE;
    this.announce(fullMessage, priority);
  }

  // Announce conversation updates
  announceMessage(speaker, content, isLive = false) {
    const speakerName = speaker === 'user' ? 'You said' : 'AI responded';
    const message = `${speakerName}: ${content}`;
    
    const priority = isLive ? ARIA_LIVE_TYPES.POLITE : ARIA_LIVE_TYPES.OFF;
    if (priority !== ARIA_LIVE_TYPES.OFF) {
      this.announce(message, priority);
    }
  }

  // Announce contextual panel changes
  announcePanelChange(panelType, action, details = '') {
    const actionText = {
      opened: 'opened',
      closed: 'closed',
      updated: 'updated',
      expanded: 'expanded',
      collapsed: 'collapsed'
    }[action] || action;
    
    const message = `${panelType} panel ${actionText}${details ? '. ' + details : ''}`;
    this.announce(message, ARIA_LIVE_TYPES.POLITE);
  }

  // Announce control state changes
  announceControlChange(controlName, newState, additionalInfo = '') {
    const message = `${controlName} ${newState}${additionalInfo ? '. ' + additionalInfo : ''}`;
    this.announce(message, ARIA_LIVE_TYPES.POLITE);
  }

  // Announce keyboard shortcut activation
  announceShortcut(shortcutName, action) {
    const message = `${shortcutName} activated: ${action}`;
    this.announce(message, ARIA_LIVE_TYPES.POLITE);
  }

  // Clean up live regions
  destroy() {
    this.liveRegions.forEach(region => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    });
    this.liveRegions.clear();
  }
}

// Keyboard shortcut manager
export class KeyboardShortcutManager {
  constructor() {
    this.shortcuts = new Map();
    this.isEnabled = true;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  // Register keyboard shortcut
  register(key, callback, options = {}) {
    const {
      ctrlKey = false,
      metaKey = false,
      altKey = false,
      shiftKey = false,
      preventDefault = true,
      description = '',
    } = options;

    const shortcutKey = this.createShortcutKey(key, { ctrlKey, metaKey, altKey, shiftKey });
    
    this.shortcuts.set(shortcutKey, {
      callback,
      preventDefault,
      description,
      key,
      modifiers: { ctrlKey, metaKey, altKey, shiftKey },
    });
  }

  // Unregister keyboard shortcut
  unregister(key, options = {}) {
    const shortcutKey = this.createShortcutKey(key, options);
    this.shortcuts.delete(shortcutKey);
  }

  // Create unique key for shortcut
  createShortcutKey(key, modifiers) {
    const { ctrlKey, metaKey, altKey, shiftKey } = modifiers;
    return `${ctrlKey ? 'ctrl+' : ''}${metaKey ? 'meta+' : ''}${altKey ? 'alt+' : ''}${shiftKey ? 'shift+' : ''}${key.toLowerCase()}`;
  }

  // Handle keydown events
  handleKeyDown(event) {
    if (!this.isEnabled) return;
    
    // Don't handle shortcuts when typing in input fields
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    )) {
      return;
    }

    const shortcutKey = this.createShortcutKey(event.key, {
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
    });

    const shortcut = this.shortcuts.get(shortcutKey);
    if (shortcut) {
      if (shortcut.preventDefault) {
        event.preventDefault();
      }
      shortcut.callback(event);
    }
  }

  // Enable keyboard shortcuts
  enable() {
    this.isEnabled = true;
    document.addEventListener('keydown', this.handleKeyDown);
  }

  // Disable keyboard shortcuts
  disable() {
    this.isEnabled = false;
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  // Get all registered shortcuts for help display
  getShortcuts() {
    return Array.from(this.shortcuts.entries()).map(([key, shortcut]) => ({
      key,
      description: shortcut.description,
      displayKey: this.formatShortcutDisplay(shortcut.key, shortcut.modifiers),
    }));
  }

  // Format shortcut for display
  formatShortcutDisplay(key, modifiers) {
    const parts = [];
    if (modifiers.ctrlKey) parts.push('Ctrl');
    if (modifiers.metaKey) parts.push('Cmd');
    if (modifiers.altKey) parts.push('Alt');
    if (modifiers.shiftKey) parts.push('Shift');
    parts.push(key.toUpperCase());
    return parts.join(' + ');
  }

  // Clean up
  destroy() {
    this.disable();
    this.shortcuts.clear();
  }
}

// Visual indicator utilities for audio cues
export class VisualIndicatorManager {
  constructor() {
    this.indicators = new Map();
  }

  // Create visual indicator for audio cue
  createIndicator(id, type, container, options = {}) {
    const {
      position = 'top-right',
      duration = 3000,
      className = '',
      ariaLabel = '',
    } = options;

    const indicator = document.createElement('div');
    indicator.className = `visual-indicator visual-indicator-${type} ${className}`;
    indicator.setAttribute('aria-label', ariaLabel);
    indicator.setAttribute('role', 'status');
    
    // Position the indicator
    indicator.style.cssText = `
      position: absolute;
      z-index: 1000;
      pointer-events: none;
      transition: all 0.3s ease;
    `;

    this.setIndicatorPosition(indicator, position);
    
    container.appendChild(indicator);
    this.indicators.set(id, indicator);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeIndicator(id);
      }, duration);
    }

    return indicator;
  }

  // Set indicator position
  setIndicatorPosition(indicator, position) {
    const positions = {
      'top-left': { top: '10px', left: '10px' },
      'top-right': { top: '10px', right: '10px' },
      'bottom-left': { bottom: '10px', left: '10px' },
      'bottom-right': { bottom: '10px', right: '10px' },
      'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    };

    const pos = positions[position] || positions['top-right'];
    Object.assign(indicator.style, pos);
  }

  // Update indicator content
  updateIndicator(id, content, ariaLabel = '') {
    const indicator = this.indicators.get(id);
    if (indicator) {
      indicator.innerHTML = content;
      if (ariaLabel) {
        indicator.setAttribute('aria-label', ariaLabel);
      }
    }
  }

  // Remove indicator
  removeIndicator(id) {
    const indicator = this.indicators.get(id);
    if (indicator && indicator.parentNode) {
      indicator.style.opacity = '0';
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
        this.indicators.delete(id);
      }, 300);
    }
  }

  // Clean up all indicators
  destroy() {
    this.indicators.forEach((indicator, id) => {
      this.removeIndicator(id);
    });
  }
}

// Motion preferences detection and management
export class MotionPreferencesManager {
  constructor() {
    this.prefersReducedMotion = this.detectReducedMotionPreference();
    this.callbacks = new Set();
    this.mediaQuery = null;
    this.setupMediaQueryListener();
    
    // Additional motion-related preferences
    this.preferences = {
      reducedMotion: this.prefersReducedMotion,
      allowAutoplay: !this.prefersReducedMotion,
      enableParallax: !this.prefersReducedMotion,
      enableTransitions: true,
      maxAnimationDuration: this.prefersReducedMotion ? 200 : 1000,
    };
  }

  // Detect user's motion preference
  detectReducedMotionPreference() {
    if (typeof window === 'undefined') return false;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  }

  // Set up listener for motion preference changes
  setupMediaQueryListener() {
    if (typeof window === 'undefined') return;
    
    this.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e) => {
      const wasReducedMotion = this.prefersReducedMotion;
      this.prefersReducedMotion = e.matches;
      
      // Update related preferences
      this.preferences.reducedMotion = e.matches;
      this.preferences.allowAutoplay = !e.matches;
      this.preferences.enableParallax = !e.matches;
      this.preferences.maxAnimationDuration = e.matches ? 200 : 1000;
      
      // Announce change to screen readers
      if (typeof ariaAnnouncer !== 'undefined') {
        ariaAnnouncer.announce(
          `Motion preferences ${e.matches ? 'enabled' : 'disabled'} reduced motion`,
          'polite'
        );
      }
      
      this.notifyCallbacks(wasReducedMotion);
    };

    // Use modern addEventListener if available, fallback to addListener
    if (this.mediaQuery.addEventListener) {
      this.mediaQuery.addEventListener('change', handleChange);
    } else {
      this.mediaQuery.addListener(handleChange);
    }
  }

  // Register callback for motion preference changes
  onChange(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  // Notify all callbacks of preference change
  notifyCallbacks(previousState) {
    this.callbacks.forEach(callback => {
      try {
        callback(this.prefersReducedMotion, previousState, this.preferences);
      } catch (error) {
        console.error('Error in motion preference callback:', error);
      }
    });
  }

  // Get animation duration based on preference
  getAnimationDuration(normalDuration, reducedDuration = 0) {
    if (this.prefersReducedMotion) {
      return Math.min(reducedDuration, this.preferences.maxAnimationDuration);
    }
    return Math.min(normalDuration, this.preferences.maxAnimationDuration);
  }

  // Get animation class based on preference
  getAnimationClass(normalClass, reducedClass = '') {
    return this.prefersReducedMotion ? reducedClass : normalClass;
  }

  // Get CSS custom properties for motion preferences
  getMotionCSSProperties() {
    return {
      '--motion-duration-fast': this.getAnimationDuration(150, 50) + 'ms',
      '--motion-duration-normal': this.getAnimationDuration(300, 100) + 'ms',
      '--motion-duration-slow': this.getAnimationDuration(500, 150) + 'ms',
      '--motion-easing': this.prefersReducedMotion ? 'linear' : 'cubic-bezier(0.4, 0, 0.2, 1)',
      '--motion-scale': this.prefersReducedMotion ? '1' : '1.05',
      '--motion-blur': this.prefersReducedMotion ? '0px' : '4px',
    };
  }

  // Apply motion preferences to element
  applyToElement(element) {
    if (!element) return;
    
    const properties = this.getMotionCSSProperties();
    Object.entries(properties).forEach(([property, value]) => {
      element.style.setProperty(property, value);
    });
    
    // Add class for CSS targeting
    element.classList.toggle('motion-reduced', this.prefersReducedMotion);
    element.classList.toggle('motion-normal', !this.prefersReducedMotion);
  }

  // Create motion-aware animation config
  createAnimationConfig(baseConfig) {
    const config = { ...baseConfig };
    
    if (this.prefersReducedMotion) {
      config.duration = this.getAnimationDuration(config.duration || 300, 100);
      config.easing = 'linear';
      config.iterations = 1;
      config.delay = Math.min(config.delay || 0, 100);
      
      // Disable complex animations
      if (config.keyframes) {
        config.keyframes = config.keyframes.map(frame => ({
          ...frame,
          transform: frame.transform?.replace(/scale\([^)]+\)/g, 'scale(1)') || frame.transform,
          filter: frame.filter?.replace(/blur\([^)]+\)/g, 'blur(0px)') || frame.filter,
        }));
      }
    }
    
    return config;
  }

  // Check if specific animation type should be disabled
  shouldDisableAnimation(animationType) {
    if (!this.prefersReducedMotion) return false;
    
    const disabledAnimations = [
      'parallax',
      'autoplay',
      'infinite-scroll',
      'particle-effects',
      'complex-transforms',
      'blur-effects',
    ];
    
    return disabledAnimations.includes(animationType);
  }

  // Check if animations should be disabled
  shouldReduceMotion() {
    return this.prefersReducedMotion;
  }

  // Get motion preferences object
  getPreferences() {
    return { ...this.preferences };
  }

  // Update specific preference
  updatePreference(key, value) {
    if (key in this.preferences) {
      this.preferences[key] = value;
      this.notifyCallbacks(this.prefersReducedMotion);
    }
  }

  // Clean up
  destroy() {
    if (this.mediaQuery && this.mediaQuery.removeEventListener) {
      this.mediaQuery.removeEventListener('change', this.handleChange);
    }
    this.callbacks.clear();
  }
}

// Create singleton instances
export const focusManager = new FocusManager();
export const ariaAnnouncer = new AriaAnnouncer();
export const keyboardShortcutManager = new KeyboardShortcutManager();
export const visualIndicatorManager = new VisualIndicatorManager();
export const motionPreferencesManager = new MotionPreferencesManager();

// Utility functions
export const createAriaLabel = (baseLabel, state, additionalInfo = '') => {
  const stateText = state ? `, ${state}` : '';
  const infoText = additionalInfo ? `, ${additionalInfo}` : '';
  return `${baseLabel}${stateText}${infoText}`;
};

export const createAriaDescription = (description, shortcuts = []) => {
  const shortcutText = shortcuts.length > 0 
    ? `. Keyboard shortcuts: ${shortcuts.join(', ')}`
    : '';
  return `${description}${shortcutText}`;
};

// Clean up all accessibility utilities
export const cleanupAccessibility = () => {
  ariaAnnouncer.destroy();
  keyboardShortcutManager.destroy();
  visualIndicatorManager.destroy();
  focusManager.releaseAllTraps();
};