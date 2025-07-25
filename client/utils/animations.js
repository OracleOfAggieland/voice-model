/**
 * Animation utilities for voice UI components
 */

// Animation duration constants
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 600,
  EXTRA_SLOW: 1200,
};

// Easing functions
export const EASING = {
  SMOOTH: 'cubic-bezier(0.4, 0, 0.2, 1)',
  BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  ELASTIC: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

// Voice state animation classes
export const VOICE_ANIMATIONS = {
  IDLE: 'voice-idle',
  LISTENING: 'voice-listening',
  SPEAKING: 'voice-speaking',
  PROCESSING: 'voice-processing',
};

// Utility function to add animation class with cleanup
export const animateElement = (element, animationClass, duration = ANIMATION_DURATIONS.NORMAL) => {
  return new Promise((resolve) => {
    if (!element) {
      resolve();
      return;
    }

    const cleanup = () => {
      element.classList.remove(animationClass);
      element.removeEventListener('animationend', cleanup);
      resolve();
    };

    element.addEventListener('animationend', cleanup);
    element.classList.add(animationClass);

    // Fallback timeout in case animationend doesn't fire
    setTimeout(cleanup, duration + 100);
  });
};

// Staggered animation for multiple elements
export const staggerAnimation = (elements, animationClass, staggerDelay = 100) => {
  return Promise.all(
    elements.map((element, index) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          animateElement(element, animationClass).then(resolve);
        }, index * staggerDelay);
      });
    })
  );
};

// Voice state transition with smooth animation
export const transitionVoiceState = (element, fromState, toState) => {
  if (!element) return Promise.resolve();

  return new Promise((resolve) => {
    // Remove current state class
    if (fromState) {
      element.classList.remove(fromState);
    }

    // Add transition class
    element.classList.add('voice-state-transition');

    // Add new state class after a brief delay
    setTimeout(() => {
      if (toState) {
        element.classList.add(toState);
      }
      
      // Remove transition class after animation completes
      setTimeout(() => {
        element.classList.remove('voice-state-transition');
        resolve();
      }, ANIMATION_DURATIONS.NORMAL);
    }, 50);
  });
};

// Particle animation helper
export const createParticleAnimation = (container, particleCount = 20) => {
  if (!container) return;

  const particles = [];
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle absolute w-1 h-1 bg-voice-listening rounded-full opacity-70';
    
    // Random starting position
    const startX = Math.random() * container.offsetWidth;
    const startY = Math.random() * container.offsetHeight;
    
    // Random drift direction
    const driftX = (Math.random() - 0.5) * 200;
    const driftY = (Math.random() - 0.5) * 200;
    
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;
    particle.style.setProperty('--drift-x', `${driftX}px`);
    particle.style.setProperty('--drift-y', `${driftY}px`);
    particle.style.animationDelay = `${Math.random() * 2}s`;
    
    container.appendChild(particle);
    particles.push(particle);
  }

  // Cleanup function
  return () => {
    particles.forEach(particle => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    });
  };
};

// Smooth scroll animation
export const smoothScrollTo = (element, target, duration = ANIMATION_DURATIONS.SLOW) => {
  if (!element) return Promise.resolve();

  const start = element.scrollTop;
  const change = target - start;
  const startTime = performance.now();

  return new Promise((resolve) => {
    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      element.scrollTop = start + (change * easeOut);

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(animateScroll);
  });
};

// Ripple effect animation
export const createRippleEffect = (element, event) => {
  if (!element || !event) return;

  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  const ripple = document.createElement('div');
  ripple.className = 'absolute rounded-full bg-white opacity-30 pointer-events-none';
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.transform = 'scale(0)';
  ripple.style.transition = `transform ${ANIMATION_DURATIONS.SLOW}ms ${EASING.SMOOTH}`;

  element.appendChild(ripple);

  // Trigger animation
  requestAnimationFrame(() => {
    ripple.style.transform = 'scale(1)';
  });

  // Cleanup
  setTimeout(() => {
    if (ripple.parentNode) {
      ripple.parentNode.removeChild(ripple);
    }
  }, ANIMATION_DURATIONS.SLOW);
};

// Check if user prefers reduced motion
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Conditional animation based on user preferences
export const conditionalAnimate = (element, animationClass, fallbackClass = '') => {
  if (prefersReducedMotion()) {
    if (fallbackClass) {
      element.classList.add(fallbackClass);
    }
    return Promise.resolve();
  }
  
  return animateElement(element, animationClass);
};

// Performance-aware animation frame helper
export const requestAnimationFrameThrottled = (() => {
  let isThrottled = false;
  
  return (callback) => {
    if (isThrottled) return;
    
    isThrottled = true;
    requestAnimationFrame(() => {
      callback();
      isThrottled = false;
    });
  };
})();

// Audio-reactive animation helper
export const createAudioReactiveAnimation = (element, audioData, options = {}) => {
  if (!element || !audioData) return;

  const {
    minScale = 0.8,
    maxScale = 1.2,
    smoothing = 0.1,
    property = 'transform'
  } = options;

  let currentScale = 1;
  
  const animate = () => {
    if (!audioData.length) return;

    // Calculate average amplitude
    const average = audioData.reduce((sum, value) => sum + value, 0) / audioData.length;
    const normalizedAmplitude = average / 255;
    
    // Calculate target scale
    const targetScale = minScale + (normalizedAmplitude * (maxScale - minScale));
    
    // Smooth the transition
    currentScale += (targetScale - currentScale) * smoothing;
    
    // Apply the animation
    if (property === 'transform') {
      element.style.transform = `scale(${currentScale})`;
    } else if (property === 'opacity') {
      element.style.opacity = currentScale;
    }
  };

  return animate;
};

export default {
  ANIMATION_DURATIONS,
  EASING,
  VOICE_ANIMATIONS,
  animateElement,
  staggerAnimation,
  transitionVoiceState,
  createParticleAnimation,
  smoothScrollTo,
  createRippleEffect,
  prefersReducedMotion,
  conditionalAnimate,
  requestAnimationFrameThrottled,
  createAudioReactiveAnimation,
};