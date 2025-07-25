import { animate, spring, stagger } from 'framer-motion';

/**
 * Centralized Animation Engine
 * Coordinates all animations across components with performance optimization
 */

export class AnimationEngine {
  constructor() {
    this.animations = new Map();
    this.sequences = new Map();
    this.defaultEasing = [0.4, 0, 0.2, 1];
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isPlaying = false;
    this.queue = [];
    
    // Performance monitoring
    this.frameRate = 60;
    this.lastFrameTime = 0;
    this.frameCount = 0;
    
    this.setupMotionPreferences();
    this.setupPerformanceMonitoring();
  }

  setupMotionPreferences() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', (e) => {
      this.reducedMotion = e.matches;
      if (this.reducedMotion) {
        this.stopAllAnimations();
      }
    });
  }

  setupPerformanceMonitoring() {
    const measurePerformance = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastFrameTime;
      
      if (deltaTime > 0) {
        this.frameRate = 1000 / deltaTime;
        this.frameCount++;
      }
      
      this.lastFrameTime = currentTime;
      
      // Adjust animation quality based on performance
      if (this.frameRate < 30 && this.frameCount > 60) {
        this.optimizeForPerformance();
      }
      
      requestAnimationFrame(measurePerformance);
    };
    
    requestAnimationFrame(measurePerformance);
  }

  optimizeForPerformance() {
    // Reduce animation complexity if performance is poor
    this.defaultEasing = 'linear';
    this.reducedMotion = true;
  }

  // Core animation methods
  animate(element, keyframes, options = {}) {
    if (this.reducedMotion && !options.force) {
      return Promise.resolve();
    }

    const animationOptions = {
      duration: 0.3,
      ease: this.defaultEasing,
      ...options
    };

    if (this.reducedMotion) {
      animationOptions.duration = Math.min(animationOptions.duration, 0.15);
    }

    const animation = animate(element, keyframes, animationOptions);
    const id = this.generateId();
    this.animations.set(id, animation);

    animation.then(() => {
      this.animations.delete(id);
    });

    return animation;
  }

  // Micro-interaction presets
  buttonPress(element, options = {}) {
    return this.animate(element, 
      { scale: [1, 0.95, 1] },
      { 
        duration: 0.15,
        ease: [0.4, 0, 0.6, 1],
        ...options 
      }
    );
  }

  buttonHover(element, options = {}) {
    return this.animate(element,
      { scale: 1.05, y: -2 },
      {
        duration: 0.2,
        ease: this.defaultEasing,
        ...options
      }
    );
  }

  buttonHoverEnd(element, options = {}) {
    return this.animate(element,
      { scale: 1, y: 0 },
      {
        duration: 0.2,
        ease: this.defaultEasing,
        ...options
      }
    );
  }

  fadeIn(element, options = {}) {
    return this.animate(element,
      { opacity: [0, 1], y: [20, 0] },
      {
        duration: 0.4,
        ease: this.defaultEasing,
        ...options
      }
    );
  }

  fadeOut(element, options = {}) {
    return this.animate(element,
      { opacity: [1, 0], y: [0, -20] },
      {
        duration: 0.3,
        ease: this.defaultEasing,
        ...options
      }
    );
  }

  slideIn(element, direction = 'up', options = {}) {
    const directions = {
      up: { y: [50, 0] },
      down: { y: [-50, 0] },
      left: { x: [50, 0] },
      right: { x: [-50, 0] }
    };

    return this.animate(element,
      {
        opacity: [0, 1],
        ...directions[direction]
      },
      {
        duration: 0.4,
        ease: this.defaultEasing,
        ...options
      }
    );
  }

  // Message-specific animations
  messageEnter(element, index = 0, options = {}) {
    return this.animate(element,
      {
        opacity: [0, 1],
        y: [30, 0],
        scale: [0.95, 1]
      },
      {
        duration: 0.5,
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1],
        ...options
      }
    );
  }

  messageExit(element, options = {}) {
    return this.animate(element,
      {
        opacity: [1, 0],
        x: [-20, 0],
        scale: [1, 0.95]
      },
      {
        duration: 0.3,
        ease: [0.4, 0, 0.6, 1],
        ...options
      }
    );
  }

  // Staggered animations
  staggerChildren(elements, animation, options = {}) {
    if (!elements.length) return Promise.resolve();

    const staggerDelay = options.staggerDelay || 0.1;
    const promises = elements.map((element, index) => {
      return this.animate(element, animation, {
        ...options,
        delay: (options.delay || 0) + (index * staggerDelay)
      });
    });

    return Promise.all(promises);
  }

  // Voice state animations
  voiceStateTransition(element, state, options = {}) {
    const stateAnimations = {
      idle: {
        scale: 1,
        opacity: 0.7,
        boxShadow: '0 0 0 0 rgba(79, 195, 247, 0)'
      },
      listening: {
        scale: [1, 1.1, 1.05],
        opacity: 1,
        boxShadow: '0 0 20px 5px rgba(79, 195, 247, 0.3)'
      },
      speaking: {
        scale: [1, 1.05, 1.02],
        opacity: 1,
        boxShadow: '0 0 25px 8px rgba(118, 75, 162, 0.4)'
      },
      processing: {
        scale: 1.02,
        opacity: 0.9,
        boxShadow: '0 0 15px 3px rgba(255, 193, 7, 0.3)'
      }
    };

    return this.animate(element, stateAnimations[state] || stateAnimations.idle, {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
      ...options
    });
  }

  // Panel animations
  panelSlideIn(element, options = {}) {
    return this.animate(element,
      {
        x: [300, 0],
        opacity: [0, 1]
      },
      {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
        ...options
      }
    );
  }

  panelSlideOut(element, options = {}) {
    return this.animate(element,
      {
        x: [0, 300],
        opacity: [1, 0]
      },
      {
        duration: 0.3,
        ease: [0.4, 0, 0.6, 1],
        ...options
      }
    );
  }

  // Page transitions
  pageTransition(exitElement, enterElement, options = {}) {
    const exitAnimation = this.fadeOut(exitElement, { duration: 0.2 });
    
    return exitAnimation.then(() => {
      return this.fadeIn(enterElement, { duration: 0.4 });
    });
  }

  // Sequence management
  createSequence(name, animations) {
    this.sequences.set(name, animations);
  }

  playSequence(name, context = {}) {
    const sequence = this.sequences.get(name);
    if (!sequence) return Promise.resolve();

    let promise = Promise.resolve();
    
    sequence.forEach(step => {
      if (step.parallel) {
        // Run animations in parallel
        const parallelPromises = step.animations.map(anim => 
          this[anim.method](anim.element, ...anim.args)
        );
        promise = promise.then(() => Promise.all(parallelPromises));
      } else {
        // Run animations in sequence
        promise = promise.then(() => 
          this[step.method](step.element, ...step.args)
        );
      }
    });

    return promise;
  }

  // Utility methods
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  stopAllAnimations() {
    this.animations.forEach(animation => {
      if (animation.stop) animation.stop();
    });
    this.animations.clear();
  }

  stopAnimation(id) {
    const animation = this.animations.get(id);
    if (animation && animation.stop) {
      animation.stop();
      this.animations.delete(id);
    }
  }

  // Performance utilities
  async waitForIdle() {
    return new Promise(resolve => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(resolve);
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  // Clean up
  destroy() {
    this.stopAllAnimations();
    this.sequences.clear();
  }
}

// Singleton instance
export const animationEngine = new AnimationEngine();

// Convenience methods
export const microAnimations = {
  buttonPress: (element, options) => animationEngine.buttonPress(element, options),
  buttonHover: (element, options) => animationEngine.buttonHover(element, options),
  buttonHoverEnd: (element, options) => animationEngine.buttonHoverEnd(element, options),
  fadeIn: (element, options) => animationEngine.fadeIn(element, options),
  fadeOut: (element, options) => animationEngine.fadeOut(element, options),
  slideIn: (element, direction, options) => animationEngine.slideIn(element, direction, options),
  messageEnter: (element, index, options) => animationEngine.messageEnter(element, index, options),
  voiceStateTransition: (element, state, options) => animationEngine.voiceStateTransition(element, state, options),
  staggerChildren: (elements, animation, options) => animationEngine.staggerChildren(elements, animation, options)
};