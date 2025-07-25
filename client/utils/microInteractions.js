import { animationEngine } from './animationEngine.js';
import { hapticFeedback } from './hapticFeedback.js';

/**
 * Micro-interactions for enhanced user experience
 */

export class MicroInteractionManager {
  constructor() {
    this.activeInteractions = new Map();
    this.interactionHistory = [];
    this.setupGlobalListeners();
  }

  setupGlobalListeners() {
    // Global click handler for ripple effects
    document.addEventListener('click', this.handleGlobalClick.bind(this));
    
    // Global keyboard navigation
    document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
  }

  handleGlobalClick(event) {
    const target = event.target.closest('[data-interactive]');
    if (target) {
      this.createRippleEffect(target, event);
      this.logInteraction('click', target);
    }
  }

  handleGlobalKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      const target = event.target;
      if (target.hasAttribute('data-interactive')) {
        this.triggerKeyboardActivation(target);
        this.logInteraction('keyboard', target);
      }
    }
  }

  // Button interactions
  setupButton(element, options = {}) {
    if (!element) return;

    const config = {
      haptic: true,
      ripple: true,
      scale: true,
      sound: false,
      ...options
    };

    element.setAttribute('data-interactive', 'true');
    
    // Mouse events
    element.addEventListener('mouseenter', (e) => this.handleButtonHover(e, config));
    element.addEventListener('mouseleave', (e) => this.handleButtonHoverEnd(e, config));
    element.addEventListener('mousedown', (e) => this.handleButtonPress(e, config));
    element.addEventListener('mouseup', (e) => this.handleButtonRelease(e, config));
    
    // Touch events
    element.addEventListener('touchstart', (e) => this.handleButtonPress(e, config), { passive: true });
    element.addEventListener('touchend', (e) => this.handleButtonRelease(e, config), { passive: true });
    
    // Focus events
    element.addEventListener('focus', (e) => this.handleButtonFocus(e, config));
    element.addEventListener('blur', (e) => this.handleButtonBlur(e, config));

    return () => {
      element.removeAttribute('data-interactive');
      // Remove all listeners (would need to store references for proper cleanup)
    };
  }

  async handleButtonHover(event, config) {
    const element = event.currentTarget;
    await animationEngine.buttonHover(element);
    
    if (config.haptic) {
      hapticFeedback.light();
    }
  }

  async handleButtonHoverEnd(event, config) {
    const element = event.currentTarget;
    await animationEngine.buttonHoverEnd(element);
  }

  async handleButtonPress(event, config) {
    const element = event.currentTarget;
    
    if (config.ripple) {
      this.createRippleEffect(element, event);
    }
    
    if (config.scale) {
      await animationEngine.buttonPress(element);
    }
    
    if (config.haptic) {
      hapticFeedback.medium();
    }

    this.addPressedState(element);
  }

  async handleButtonRelease(event, config) {
    const element = event.currentTarget;
    this.removePressedState(element);
  }

  async handleButtonFocus(event, config) {
    const element = event.currentTarget;
    element.classList.add('focus-visible');
    
    await animationEngine.animate(element, 
      { 
        boxShadow: '0 0 0 3px rgba(79, 195, 247, 0.3)',
        scale: 1.02
      },
      { duration: 0.2 }
    );
  }

  async handleButtonBlur(event, config) {
    const element = event.currentTarget;
    element.classList.remove('focus-visible');
    
    await animationEngine.animate(element,
      {
        boxShadow: '0 0 0 0px rgba(79, 195, 247, 0)',
        scale: 1
      },
      { duration: 0.2 }
    );
  }

  triggerKeyboardActivation(element) {
    // Simulate button press for keyboard activation
    this.createRippleEffect(element, {
      clientX: element.offsetLeft + element.offsetWidth / 2,
      clientY: element.offsetTop + element.offsetHeight / 2
    });
    
    animationEngine.buttonPress(element);
    hapticFeedback.medium();
  }

  // Ripple effect
  createRippleEffect(element, event) {
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement('div');
    ripple.className = 'micro-ripple';
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      transform: scale(0);
    `;

    const container = element.style.position === 'relative' ? element : 
                     element.closest('.relative') || element.parentElement;
    
    if (container) {
      container.style.position = 'relative';
      container.appendChild(ripple);

      animationEngine.animate(ripple, 
        { 
          scale: [0, 1],
          opacity: [0.3, 0]
        },
        { 
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1]
        }
      ).then(() => {
        if (ripple.parentElement) {
          ripple.parentElement.removeChild(ripple);
        }
      });
    }
  }

  // Input field interactions
  setupInput(element, options = {}) {
    if (!element) return;

    const config = {
      focusScale: true,
      labelFloat: true,
      haptic: true,
      ...options
    };

    element.addEventListener('focus', (e) => this.handleInputFocus(e, config));
    element.addEventListener('blur', (e) => this.handleInputBlur(e, config));
    element.addEventListener('input', (e) => this.handleInputChange(e, config));
  }

  async handleInputFocus(event, config) {
    const element = event.currentTarget;
    const label = element.parentElement.querySelector('label');
    
    if (config.focusScale) {
      await animationEngine.animate(element,
        {
          borderColor: 'rgba(79, 195, 247, 1)',
          boxShadow: '0 0 0 3px rgba(79, 195, 247, 0.1)'
        },
        { duration: 0.2 }
      );
    }

    if (config.labelFloat && label) {
      await animationEngine.animate(label,
        {
          scale: 0.85,
          y: -24,
          color: 'rgba(79, 195, 247, 1)'
        },
        { duration: 0.2 }
      );
    }

    if (config.haptic) {
      hapticFeedback.light();
    }
  }

  async handleInputBlur(event, config) {
    const element = event.currentTarget;
    const label = element.parentElement.querySelector('label');
    
    await animationEngine.animate(element,
      {
        borderColor: 'rgba(75, 85, 99, 0.6)',
        boxShadow: '0 0 0 0px rgba(79, 195, 247, 0)'
      },
      { duration: 0.2 }
    );

    if (config.labelFloat && label && !element.value) {
      await animationEngine.animate(label,
        {
          scale: 1,
          y: 0,
          color: 'rgba(156, 163, 175, 1)'
        },
        { duration: 0.2 }
      );
    }
  }

  handleInputChange(event, config) {
    if (config.haptic) {
      hapticFeedback.selection();
    }
  }

  // Loading states
  showLoadingState(element, options = {}) {
    const config = {
      spinner: true,
      pulse: false,
      text: 'Loading...',
      ...options
    };

    element.classList.add('loading-state');
    element.setAttribute('aria-busy', 'true');

    if (config.spinner) {
      this.addSpinner(element);
    }

    if (config.pulse) {
      this.addPulseEffect(element);
    }
  }

  hideLoadingState(element) {
    element.classList.remove('loading-state');
    element.removeAttribute('aria-busy');
    
    const spinner = element.querySelector('.loading-spinner');
    if (spinner) {
      spinner.remove();
    }

    element.style.animation = '';
  }

  addSpinner(element) {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
      <div class="spinner-circle"></div>
    `;
    
    element.appendChild(spinner);
  }

  addPulseEffect(element) {
    element.style.animation = 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite';
  }

  // State management
  addPressedState(element) {
    element.classList.add('pressed');
    element.setAttribute('data-pressed', 'true');
  }

  removePressedState(element) {
    element.classList.remove('pressed');
    element.removeAttribute('data-pressed');
  }

  // Interaction logging
  logInteraction(type, element) {
    this.interactionHistory.push({
      type,
      element: element.tagName + (element.className ? '.' + element.className : ''),
      timestamp: Date.now()
    });

    // Keep only recent interactions
    if (this.interactionHistory.length > 100) {
      this.interactionHistory.shift();
    }
  }

  // Utility methods
  setupElement(element, type, options = {}) {
    switch (type) {
      case 'button':
        return this.setupButton(element, options);
      case 'input':
        return this.setupInput(element, options);
      default:
        console.warn(`Unknown micro-interaction type: ${type}`);
    }
  }

  // Bulk setup for elements
  setupElements(selector, type, options = {}) {
    const elements = document.querySelectorAll(selector);
    const cleanupFunctions = [];

    elements.forEach(element => {
      const cleanup = this.setupElement(element, type, options);
      if (cleanup) cleanupFunctions.push(cleanup);
    });

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }

  // Performance monitoring
  getInteractionStats() {
    const recentInteractions = this.interactionHistory.filter(
      interaction => Date.now() - interaction.timestamp < 60000 // Last minute
    );

    return {
      total: this.interactionHistory.length,
      recent: recentInteractions.length,
      types: recentInteractions.reduce((acc, interaction) => {
        acc[interaction.type] = (acc[interaction.type] || 0) + 1;
        return acc;
      }, {})
    };
  }

  // Cleanup
  destroy() {
    this.activeInteractions.clear();
    this.interactionHistory = [];
    
    document.removeEventListener('click', this.handleGlobalClick);
    document.removeEventListener('keydown', this.handleGlobalKeydown);
  }
}

// Singleton instance
export const microInteractions = new MicroInteractionManager();

// Convenience functions
export const setupButtonInteractions = (element, options) => 
  microInteractions.setupButton(element, options);

export const setupInputInteractions = (element, options) => 
  microInteractions.setupInput(element, options);

export const createRipple = (element, event) => 
  microInteractions.createRippleEffect(element, event);

export const showLoading = (element, options) => 
  microInteractions.showLoadingState(element, options);

export const hideLoading = (element) => 
  microInteractions.hideLoadingState(element);