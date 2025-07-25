import { animationEngine } from './animationEngine.js';

/**
 * Loading States and Skeleton Screen Manager
 */

export class LoadingStateManager {
  constructor() {
    this.loadingElements = new Map();
    this.skeletonTemplates = new Map();
    this.defaultOptions = {
      showSkeleton: true,
      animateIn: true,
      animateOut: true,
      minimumDuration: 300
    };
  }

  // Skeleton screen templates
  initializeSkeletonTemplates() {
    this.skeletonTemplates.set('message', this.createMessageSkeleton);
    this.skeletonTemplates.set('button', this.createButtonSkeleton);
    this.skeletonTemplates.set('card', this.createCardSkeleton);
    this.skeletonTemplates.set('list', this.createListSkeleton);
    this.skeletonTemplates.set('avatar', this.createAvatarSkeleton);
    this.skeletonTemplates.set('text', this.createTextSkeleton);
  }

  // Show loading state
  async showLoading(element, options = {}) {
    const config = { ...this.defaultOptions, ...options };
    const loadingId = this.generateId();
    
    const loadingState = {
      id: loadingId,
      element,
      startTime: Date.now(),
      config,
      originalContent: element.innerHTML,
      originalAttributes: this.captureAttributes(element)
    };

    this.loadingElements.set(loadingId, loadingState);

    // Add loading classes
    element.classList.add('loading-state');
    element.setAttribute('aria-busy', 'true');

    if (config.showSkeleton) {
      await this.showSkeleton(element, config);
    } else {
      await this.showSpinner(element, config);
    }

    return loadingId;
  }

  // Hide loading state
  async hideLoading(elementOrId, options = {}) {
    const loadingState = this.getLoadingState(elementOrId);
    if (!loadingState) return;

    const { element, startTime, config, originalContent } = loadingState;
    const elapsed = Date.now() - startTime;
    
    // Ensure minimum duration
    if (elapsed < config.minimumDuration) {
      await this.delay(config.minimumDuration - elapsed);
    }

    // Animate out if enabled
    if (config.animateOut) {
      await this.animateContentOut(element);
    }

    // Restore original content
    element.innerHTML = originalContent;
    this.restoreAttributes(element, loadingState.originalAttributes);

    // Remove loading classes
    element.classList.remove('loading-state');
    element.removeAttribute('aria-busy');

    // Animate in if enabled
    if (config.animateIn) {
      await this.animateContentIn(element);
    }

    this.loadingElements.delete(loadingState.id);
  }

  // Skeleton creation methods
  createMessageSkeleton() {
    return `
      <div class="skeleton-message">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-content">
          <div class="skeleton-line skeleton-line-short"></div>
          <div class="skeleton-line skeleton-line-medium"></div>
          <div class="skeleton-line skeleton-line-long"></div>
        </div>
      </div>
    `;
  }

  createButtonSkeleton() {
    return `<div class="skeleton-button"></div>`;
  }

  createCardSkeleton() {
    return `
      <div class="skeleton-card">
        <div class="skeleton-header"></div>
        <div class="skeleton-line skeleton-line-long"></div>
        <div class="skeleton-line skeleton-line-medium"></div>
        <div class="skeleton-footer">
          <div class="skeleton-button skeleton-button-small"></div>
          <div class="skeleton-button skeleton-button-small"></div>
        </div>
      </div>
    `;
  }

  createListSkeleton(count = 3) {
    const items = Array(count).fill().map(() => `
      <div class="skeleton-list-item">
        <div class="skeleton-avatar skeleton-avatar-small"></div>
        <div class="skeleton-content">
          <div class="skeleton-line skeleton-line-medium"></div>
          <div class="skeleton-line skeleton-line-short"></div>
        </div>
      </div>
    `).join('');

    return `<div class="skeleton-list">${items}</div>`;
  }

  createAvatarSkeleton() {
    return `<div class="skeleton-avatar"></div>`;
  }

  createTextSkeleton(lines = 2) {
    const textLines = Array(lines).fill().map((_, index) => {
      const lengths = ['short', 'medium', 'long'];
      const length = lengths[index % lengths.length];
      return `<div class="skeleton-line skeleton-line-${length}"></div>`;
    }).join('');

    return `<div class="skeleton-text">${textLines}</div>`;
  }

  // Show skeleton
  async showSkeleton(element, config) {
    const skeletonType = config.skeletonType || this.detectSkeletonType(element);
    const template = this.skeletonTemplates.get(skeletonType) || this.createTextSkeleton;
    
    const skeletonHTML = typeof template === 'function' ? 
      template(config.skeletonCount) : template;

    element.innerHTML = skeletonHTML;

    if (config.animateIn) {
      await this.animateSkeletonIn(element);
    }
  }

  // Show spinner
  async showSpinner(element, config) {
    const spinnerHTML = `
      <div class="loading-spinner-container">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        ${config.loadingText ? `<div class="loading-text">${config.loadingText}</div>` : ''}
      </div>
    `;

    element.innerHTML = spinnerHTML;

    if (config.animateIn) {
      await animationEngine.fadeIn(element.querySelector('.loading-spinner-container'));
    }
  }

  // Animation methods
  async animateSkeletonIn(element) {
    const skeletonElements = element.querySelectorAll('[class*="skeleton-"]');
    
    await animationEngine.staggerChildren(
      Array.from(skeletonElements),
      { opacity: [0, 1], y: [20, 0] },
      { staggerDelay: 0.05, duration: 0.4 }
    );
  }

  async animateContentOut(element) {
    await animationEngine.fadeOut(element, { duration: 0.2 });
  }

  async animateContentIn(element) {
    await animationEngine.fadeIn(element, { duration: 0.4 });
  }

  // Utility methods
  detectSkeletonType(element) {
    const classList = element.classList;
    
    if (classList.contains('message') || classList.contains('chat-message')) {
      return 'message';
    } else if (classList.contains('button') || element.tagName === 'BUTTON') {
      return 'button';
    } else if (classList.contains('card')) {
      return 'card';
    } else if (classList.contains('list') || element.tagName === 'UL' || element.tagName === 'OL') {
      return 'list';
    } else if (classList.contains('avatar')) {
      return 'avatar';
    }
    
    return 'text';
  }

  getLoadingState(elementOrId) {
    if (typeof elementOrId === 'string') {
      return this.loadingElements.get(elementOrId);
    } else {
      // Find by element
      for (const loadingState of this.loadingElements.values()) {
        if (loadingState.element === elementOrId) {
          return loadingState;
        }
      }
    }
    return null;
  }

  captureAttributes(element) {
    const attributes = {};
    for (const attr of element.attributes) {
      attributes[attr.name] = attr.value;
    }
    return attributes;
  }

  restoreAttributes(element, attributes) {
    // Remove current attributes (except class and data-* attributes we want to keep)
    for (const attr of element.attributes) {
      if (!attr.name.startsWith('data-') && attr.name !== 'class') {
        element.removeAttribute(attr.name);
      }
    }

    // Restore original attributes
    for (const [name, value] of Object.entries(attributes)) {
      if (!name.startsWith('data-') || name === 'class') {
        element.setAttribute(name, value);
      }
    }
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Batch operations
  async showMultipleLoading(elements, options = {}) {
    const loadingIds = [];
    
    for (const element of elements) {
      const id = await this.showLoading(element, options);
      loadingIds.push(id);
    }

    return loadingIds;
  }

  async hideMultipleLoading(loadingIds, options = {}) {
    const promises = loadingIds.map(id => this.hideLoading(id, options));
    return Promise.all(promises);
  }

  // Progress loading
  showProgressLoading(element, options = {}) {
    const config = { progress: 0, showPercentage: true, ...options };
    
    const progressHTML = `
      <div class="loading-progress-container">
        <div class="loading-progress-bar">
          <div class="loading-progress-fill" style="width: ${config.progress}%"></div>
        </div>
        ${config.showPercentage ? `<div class="loading-percentage">${config.progress}%</div>` : ''}
        ${config.loadingText ? `<div class="loading-text">${config.loadingText}</div>` : ''}
      </div>
    `;

    element.innerHTML = progressHTML;
    element.classList.add('loading-state');

    return {
      updateProgress: (progress) => {
        const fill = element.querySelector('.loading-progress-fill');
        const percentage = element.querySelector('.loading-percentage');
        
        if (fill) {
          animationEngine.animate(fill, { width: `${progress}%` }, { duration: 0.3 });
        }
        
        if (percentage) {
          percentage.textContent = `${progress}%`;
        }
      },
      complete: () => this.hideLoading(element, options)
    };
  }

  // Cleanup
  cleanup() {
    this.loadingElements.clear();
    this.skeletonTemplates.clear();
  }

  // Statistics
  getActiveLoadingStates() {
    return Array.from(this.loadingElements.values());
  }

  getLoadingStatistics() {
    const activeStates = this.getActiveLoadingStates();
    
    return {
      activeCount: activeStates.length,
      averageDuration: activeStates.length > 0 ? 
        activeStates.reduce((sum, state) => sum + (Date.now() - state.startTime), 0) / activeStates.length : 0,
      skeletonTypes: activeStates.reduce((acc, state) => {
        const type = state.config.skeletonType || 'text';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

// Initialize templates
const loadingManager = new LoadingStateManager();
loadingManager.initializeSkeletonTemplates();

export { loadingManager };

// Convenience functions
export const showLoading = (element, options) => 
  loadingManager.showLoading(element, options);

export const hideLoading = (elementOrId, options) => 
  loadingManager.hideLoading(elementOrId, options);

export const showProgressLoading = (element, options) => 
  loadingManager.showProgressLoading(element, options);

export const showSkeleton = (element, type, options = {}) => 
  loadingManager.showLoading(element, { ...options, skeletonType: type });