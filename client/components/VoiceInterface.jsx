import { useState, useEffect, useCallback, useRef } from 'react';
import { useResponsiveLayout } from './ResponsiveLayout';
import VoiceVisualizer from './VoiceVisualizer';
import ConversationDisplay from './ConversationDisplay';
import ContextualPanels, { PANEL_POSITIONS } from './ContextualPanels';
import VoiceControls from './VoiceControls';
import { VisualizationStyles } from '../utils/audioAnalysis.js';
import { 
  ariaAnnouncer, 
  keyboardShortcutManager, 
  visualIndicatorManager,
  motionPreferencesManager,
  createAriaLabel,
  createAriaDescription,
  KEYBOARD_KEYS 
} from '../utils/accessibility.js';
import { 
  getPerformanceMonitor, 
  getMemoryManager, 
  getConversationMemoryManager,
  getQualityManager,
  initializeMotionAwarePerformance,
  getMotionAwarePerformanceManager,
  QUALITY_LEVELS 
} from '../utils/performance.js';

// Voice state constants
const VOICE_STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting', 
  LISTENING: 'listening',
  SPEAKING: 'speaking',
  PROCESSING: 'processing',
  ERROR: 'error',
};

export default function VoiceInterface({
  isSessionActive = false,
  isUserSpeaking = false,
  isAISpeaking = false,
  events = [],
  messages = [],
  currentTranscript = '',
  conversationContext = [],
  financialData = {},
  sessionInfo = {},
  enableFinancialHighlighting = true,
  onSessionControl,
  onTextMessage,
  onMessageClick,
  onFinancialTermClick,
  onFinancialNumberClick,
  onPanelAction,
  onPanelClose,
  className = '',
}) {
  // Handle SSR by providing default values
  const responsiveLayout = useResponsiveLayout();
  const { 
    screenSize = 'desktop', 
    layoutMode = 'standard', 
    isMobile = false, 
    isTablet = false, 
    isDesktop = true,
    getResponsiveValue = () => {},
    layoutClasses = ''
  } = responsiveLayout || {};

  // Voice interface state management
  const [currentVoiceState, setCurrentVoiceState] = useState(VOICE_STATES.IDLE);
  const [interfaceMode, setInterfaceMode] = useState('standard');
  const [showContextualPanels, setShowContextualPanels] = useState(true);
  const [animationState, setAnimationState] = useState('idle');
  const [visualizationStyle, setVisualizationStyle] = useState(VisualizationStyles.CIRCULAR);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [currentQuality, setCurrentQuality] = useState(QUALITY_LEVELS.HIGH);
  const [performanceData, setPerformanceData] = useState(null);
  const [motionAwareOptimizations, setMotionAwareOptimizations] = useState([]);
  const [conversationMemoryStats, setConversationMemoryStats] = useState(null);
  
  // Accessibility refs
  const containerRef = useRef(null);
  const skipLinkRef = useRef(null);
  const mainContentRef = useRef(null);
  
  // Performance refs
  const cleanupTasksRef = useRef([]);

  // Initialize accessibility and performance features
  useEffect(() => {
    // Initialize motion-aware performance manager
    const motionAwareManager = initializeMotionAwarePerformance(motionPreferencesManager);
    
    // Set up motion preferences listener with enhanced callback
    const unsubscribeMotion = motionPreferencesManager.onChange((reducedMotion, previousState, preferences) => {
      setPrefersReducedMotion(reducedMotion);
      
      // Apply motion preferences to container
      if (containerRef.current) {
        motionPreferencesManager.applyToElement(containerRef.current);
      }
      
      // Announce change if it's different from previous state
      if (previousState !== undefined && previousState !== reducedMotion) {
        ariaAnnouncer.announce(
          `Motion preferences updated: ${reducedMotion ? 'reduced motion enabled' : 'normal motion enabled'}`,
          'polite'
        );
      }
    });
    
    // Initialize motion preferences
    const initialReducedMotion = motionPreferencesManager.shouldReduceMotion();
    setPrefersReducedMotion(initialReducedMotion);
    
    // Apply initial motion preferences
    if (containerRef.current) {
      motionPreferencesManager.applyToElement(containerRef.current);
    }

    // Set up motion-aware performance optimization listener
    const unsubscribeMotionAware = motionAwareManager.onOptimization((optimization) => {
      setMotionAwareOptimizations(prev => [...prev.slice(-9), optimization]); // Keep last 10
      
      // Apply optimizations based on type
      optimization.actions.forEach(action => {
        switch (action) {
          case 'disable_complex_animations':
            // This would be handled by child components
            console.log('Disabling complex animations due to motion preferences');
            break;
          case 'reduce_quality_to_medium':
            ariaAnnouncer.announce('Performance quality automatically reduced for better accessibility');
            break;
          case 'cleanup_resources':
            memoryManager.forceCleanup();
            break;
          default:
            console.log('Motion-aware optimization:', action);
        }
      });
    });

    // Get performance utilities
    const performanceMonitor = getPerformanceMonitor();
    const memoryManager = getMemoryManager();
    const conversationMemoryManager = getConversationMemoryManager();
    const qualityManager = getQualityManager();

    // Set up performance monitoring with memory management
    const unsubscribePerformance = performanceMonitor.onPerformanceChange((data) => {
      setPerformanceData(data);
      
      // Trigger memory cleanup if performance is poor
      if (!data.isPerformanceGood || !data.isMemoryHealthy) {
        memoryManager.scheduleCleanup();
      }
    });
    
    const unsubscribeQuality = qualityManager
      ? qualityManager.onQualityChange((newQuality, oldQuality, perfData) => {
          setCurrentQuality(newQuality);
          ariaAnnouncer.announce(`Performance quality adjusted to ${newQuality} level`);

          // Log quality change for debugging
          console.log(`Quality adjusted from ${oldQuality} to ${newQuality}`, {
            frameRate: perfData.avgFrameRate,
            memoryUsage: perfData.avgMemoryUsage,
            reason: qualityManager.getAdjustmentHistory().slice(-1)[0]?.reason
          });
        })
      : () => {};

    // Register memory cleanup tasks for long conversation sessions
    const cleanupVisualization = memoryManager.registerCleanupTask(() => {
      // Clean up visualization resources
      if (containerRef.current) {
        const canvases = containerRef.current.querySelectorAll('canvas');
        canvases.forEach(canvas => {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Register canvas context for ongoing management
            memoryManager.registerCanvasContext(canvas, ctx);
          }
        });
      }
    }, 'high');

    const cleanupEventListeners = memoryManager.registerCleanupTask(() => {
      // Clean up any orphaned event listeners
      cleanupTasksRef.current.forEach(cleanup => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
      cleanupTasksRef.current = [];
    }, 'normal');

    // Register cleanup for conversation memory management
    const cleanupConversationMemory = memoryManager.registerCleanupTask(() => {
      // Clean up conversation memory using enhanced manager
      const memoryStats = conversationMemoryManager.getConversationMemoryStats(messages);
      setConversationMemoryStats(memoryStats);
      
      if (memoryStats.overallHealth === 'needs_cleanup') {
        console.log('Conversation memory cleanup needed:', memoryStats);
        // This would trigger parent component to clean up messages
        if (onSessionControl) {
          // Could emit a custom event for memory cleanup
          console.log('Requesting conversation memory cleanup from parent');
        }
      }
    }, 'low');

    // Register performance monitoring cleanup
    const cleanupPerformanceData = memoryManager.registerCleanupTask(() => {
      // Clear old performance data
      setPerformanceData(null);
    }, 'low');

    // Set up keyboard shortcuts
    keyboardShortcutManager.enable();
    
    // Register global keyboard shortcuts
    keyboardShortcutManager.register(KEYBOARD_KEYS.SPACE, () => {
      if (onSessionControl) {
        onSessionControl(isSessionActive ? 'stop' : 'start');
      }
    }, {
      description: 'Start or stop voice session',
      preventDefault: true,
    });

    keyboardShortcutManager.register('m', () => {
      if (onSessionControl && isSessionActive) {
        onSessionControl('mute');
      }
    }, {
      ctrlKey: true,
      description: 'Mute or unmute microphone',
      preventDefault: true,
    });

    keyboardShortcutManager.register('p', () => {
      if (onSessionControl && isSessionActive) {
        onSessionControl('pause');
      }
    }, {
      ctrlKey: true,
      description: 'Pause or resume session',
      preventDefault: true,
    });

    keyboardShortcutManager.register('i', () => {
      toggleInterfaceMode();
    }, {
      ctrlKey: true,
      description: 'Toggle interface mode',
      preventDefault: true,
    });

    keyboardShortcutManager.register('c', () => {
      toggleContextualPanels();
    }, {
      ctrlKey: true,
      description: 'Toggle contextual panels',
      preventDefault: true,
    });

    // Skip link functionality
    keyboardShortcutManager.register('s', () => {
      if (mainContentRef.current) {
        mainContentRef.current.focus();
        ariaAnnouncer.announce('Skipped to main content');
      }
    }, {
      ctrlKey: true,
      description: 'Skip to main content',
      preventDefault: true,
    });

    // Additional accessibility shortcuts
    keyboardShortcutManager.register('h', () => {
      // Announce help information
      const shortcuts = keyboardShortcutManager.getShortcuts();
      const helpText = shortcuts.map(s => `${s.displayKey}: ${s.description}`).join('. ');
      ariaAnnouncer.announce(`Available shortcuts: ${helpText}`, 'assertive');
    }, {
      ctrlKey: true,
      description: 'Announce keyboard shortcuts',
      preventDefault: true,
    });

    keyboardShortcutManager.register('r', () => {
      // Announce current state
      const stateInfo = `Voice interface ${currentVoiceState}. Session ${isSessionActive ? 'active' : 'inactive'}.`;
      ariaAnnouncer.announce(stateInfo, 'polite');
    }, {
      ctrlKey: true,
      description: 'Announce current state',
      preventDefault: true,
    });

    keyboardShortcutManager.register('t', () => {
      // Focus on conversation display for navigation
      const conversationElement = containerRef.current?.querySelector('[role="log"]');
      if (conversationElement) {
        conversationElement.focus();
        ariaAnnouncer.announce('Focused on conversation display');
      }
    }, {
      ctrlKey: true,
      description: 'Focus conversation display',
      preventDefault: true,
    });

    return () => {
      unsubscribeMotion();
      unsubscribeMotionAware();
      unsubscribePerformance();
      unsubscribeQuality();
      cleanupVisualization();
      cleanupEventListeners();
      cleanupConversationMemory();
      cleanupPerformanceData();
      keyboardShortcutManager.destroy();
      
      // Clean up visual indicators
      visualIndicatorManager.removeIndicator('voice-state');
      visualIndicatorManager.removeIndicator('audio-input');
      visualIndicatorManager.removeIndicator('audio-output');
      
      // Schedule final cleanup
      memoryManager.scheduleCleanup();
    };
  }, [isSessionActive, onSessionControl]);

  // Determine current voice state based on props and announce changes
  useEffect(() => {
    let newState;
    let newAnimationState;

    if (!isSessionActive) {
      newState = VOICE_STATES.IDLE;
      newAnimationState = 'idle';
    } else if (isUserSpeaking) {
      newState = VOICE_STATES.LISTENING;
      newAnimationState = 'listening';
    } else if (isAISpeaking) {
      newState = VOICE_STATES.SPEAKING;
      newAnimationState = 'speaking';
    } else if (isSessionActive) {
      newState = VOICE_STATES.IDLE;
      newAnimationState = 'connected';
    }

    // Only announce and update if state actually changed
    if (newState !== currentVoiceState) {
      setCurrentVoiceState(newState);
      setAnimationState(newAnimationState);
      
      // Announce state change to screen readers
      ariaAnnouncer.announceVoiceState(newState);
      
      // Show visual indicator for audio cues
      if (containerRef.current) {
        const indicatorType = newState === VOICE_STATES.LISTENING ? 'listening' : 
                             newState === VOICE_STATES.SPEAKING ? 'speaking' : 'idle';
        
        // Create visual indicator with enhanced accessibility
        visualIndicatorManager.createIndicator(
          'voice-state',
          indicatorType,
          containerRef.current,
          {
            position: 'top-right',
            duration: 3000,
            ariaLabel: `Voice state: ${newState}`,
            className: 'voice-state-indicator'
          }
        );

        // Add audio cue visual indicators
        if (newState === VOICE_STATES.LISTENING) {
          visualIndicatorManager.createIndicator(
            'audio-input',
            'listening',
            containerRef.current,
            {
              position: 'top-left',
              duration: 0, // Persistent while listening
              ariaLabel: 'Audio input active',
              className: 'audio-input-indicator'
            }
          );
        } else {
          visualIndicatorManager.removeIndicator('audio-input');
        }

        if (newState === VOICE_STATES.SPEAKING) {
          visualIndicatorManager.createIndicator(
            'audio-output',
            'speaking',
            containerRef.current,
            {
              position: 'bottom-right',
              duration: 0, // Persistent while speaking
              ariaLabel: 'AI audio output active',
              className: 'audio-output-indicator'
            }
          );
        } else {
          visualIndicatorManager.removeIndicator('audio-output');
        }
      }
    }
  }, [isSessionActive, isUserSpeaking, isAISpeaking, currentVoiceState]);

  // Layout orchestration for different screen sizes
  const getLayoutConfiguration = useCallback(() => {
    const baseConfig = {
      showVisualizer: true,
      showControls: true,
      showConversation: true,
      showContextPanels: showContextualPanels,
    };

    switch (screenSize) {
      case 'desktop':
        return {
          ...baseConfig,
          visualizerSize: 'large',
          layout: 'grid',
          panelPosition: 'sidebar',
          controlsPosition: 'floating',
        };
      case 'tablet':
        return {
          ...baseConfig,
          visualizerSize: 'medium',
          layout: 'flex',
          panelPosition: 'overlay',
          controlsPosition: 'bottom',
          showContextPanels: interfaceMode !== 'minimal',
        };
      case 'mobile':
        return {
          ...baseConfig,
          visualizerSize: 'small',
          layout: 'stack',
          panelPosition: 'modal',
          controlsPosition: 'bottom',
          showContextPanels: false,
        };
      default:
        return baseConfig;
    }
  }, [screenSize, showContextualPanels, interfaceMode]);

  // Smooth state transitions between voice modes
  const handleStateTransition = useCallback((newState) => {
    if (newState !== currentVoiceState) {
      setAnimationState('transitioning');
      
      // Brief transition delay for smooth animation
      setTimeout(() => {
        setCurrentVoiceState(newState);
        setAnimationState(newState);
      }, 150);
    }
  }, [currentVoiceState]);

  // Interface mode management
  const toggleInterfaceMode = useCallback(() => {
    const modes = ['standard', 'minimal', 'focus'];
    const currentIndex = modes.indexOf(interfaceMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setInterfaceMode(nextMode);
  }, [interfaceMode]);

  // Contextual panel management
  const toggleContextualPanels = useCallback(() => {
    setShowContextualPanels(prev => !prev);
  }, []);

  // Panel action handlers
  const handlePanelAction = useCallback((panelId, actionId, data) => {
    onPanelAction?.(panelId, actionId, data);
  }, [onPanelAction]);

  const handlePanelClose = useCallback((panelId) => {
    onPanelClose?.(panelId);
  }, [onPanelClose]);

  // Visualization style management
  const cycleVisualizationStyle = useCallback(() => {
    const styles = Object.values(VisualizationStyles);
    const currentIndex = styles.indexOf(visualizationStyle);
    const nextStyle = styles[(currentIndex + 1) % styles.length];
    setVisualizationStyle(nextStyle);
  }, [visualizationStyle]);

  // Get responsive container classes with accessibility considerations
  const getContainerClasses = () => {
    const baseClasses = 'voice-interface-container';
    const stateClasses = `voice-state-${currentVoiceState}`;
    const modeClasses = `interface-mode-${interfaceMode}`;
    const layoutClasses = `layout-${screenSize}`;
    
    // Apply motion preferences
    const motionClasses = prefersReducedMotion 
      ? 'motion-reduced' 
      : 'transition-all duration-slow ease-smooth';
    
    return `${baseClasses} ${stateClasses} ${modeClasses} ${layoutClasses} ${motionClasses} ${className}`;
  };

  // Get visualizer configuration based on screen size, state, and performance
  const getVisualizerConfig = () => {
    const config = getLayoutConfiguration();
    const qualityManager = getQualityManager();
    const qualitySettings = qualityManager
      ? qualityManager.getQualitySettings(currentQuality)
      : {};
    
    return {
      size: config.visualizerSize,
      isActive: isSessionActive,
      isUserSpeaking,
      isAISpeaking,
      state: currentVoiceState,
      animationState,
      visualizationStyle,
      responsive: true,
      prefersReducedMotion,
      qualityLevel: currentQuality,
      qualitySettings,
      performanceData,
    };
  };

  // Main layout structure based on screen size
  const renderLayout = () => {
    const config = getLayoutConfiguration();

    if (isMobile) {
      return renderMobileLayout(config);
    } else if (isTablet) {
      return renderTabletLayout(config);
    } else {
      return renderDesktopLayout(config);
    }
  };

  // Desktop layout with full features
  const renderDesktopLayout = (config) => (
    <div className="h-full grid grid-cols-12 gap-6">
      {/* Main voice area */}
      <div className="col-span-8 flex flex-col">
        {/* Voice visualizer */}
        <div className="flex-shrink-0 glass rounded-lg p-6 mb-4">
          <VoiceVisualizer {...getVisualizerConfig()} />
        </div>
        
        {/* Conversation area */}
        <div className="flex-1 glass rounded-lg overflow-hidden">
          <ConversationDisplay
            messages={messages}
            isUserSpeaking={isUserSpeaking}
            isAISpeaking={isAISpeaking}
            currentTranscript={currentTranscript}
            autoScroll={true}
            showTimestamps={true}
            enableFinancialHighlighting={enableFinancialHighlighting}
            onMessageClick={onMessageClick}
            onFinancialTermClick={onFinancialTermClick}
            onFinancialNumberClick={onFinancialNumberClick}
          />
        </div>
      </div>

      {/* Contextual panels sidebar */}
      {config.showContextPanels && (
        <div className="col-span-4">
          <ContextualPanels
            conversationContext={conversationContext}
            financialData={financialData}
            sessionInfo={sessionInfo}
            isVisible={showContextualPanels}
            position={PANEL_POSITIONS.SIDEBAR}
            maxPanels={4}
            onPanelAction={handlePanelAction}
            onPanelClose={handlePanelClose}
          />
        </div>
      )}
    </div>
  );

  // Tablet layout with collapsible panels
  const renderTabletLayout = (config) => (
    <div className="h-full flex flex-col gap-4">
      {/* Voice visualizer */}
      <div className="flex-shrink-0 glass rounded-lg p-4">
        <VoiceVisualizer {...getVisualizerConfig()} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex gap-4">
        {/* Conversation area */}
        <div className="flex-1 glass rounded-lg overflow-hidden">
          <ConversationDisplay
            messages={messages}
            isUserSpeaking={isUserSpeaking}
            isAISpeaking={isAISpeaking}
            currentTranscript={currentTranscript}
            autoScroll={true}
            showTimestamps={false}
            enableFinancialHighlighting={enableFinancialHighlighting}
            onMessageClick={onMessageClick}
            onFinancialTermClick={onFinancialTermClick}
            onFinancialNumberClick={onFinancialNumberClick}
          />
        </div>

        {/* Collapsible context panel */}
        {config.showContextPanels && (
          <div className="w-80">
            <ContextualPanels
              conversationContext={conversationContext}
              financialData={financialData}
              sessionInfo={sessionInfo}
              isVisible={showContextualPanels}
              position={PANEL_POSITIONS.OVERLAY}
              maxPanels={2}
              onPanelAction={handlePanelAction}
              onPanelClose={handlePanelClose}
            />
          </div>
        )}
      </div>
    </div>
  );

  // Mobile layout with streamlined interface
  const renderMobileLayout = (config) => (
    <div className="h-full flex flex-col gap-3">
      {/* Voice visualizer */}
      <div className="flex-shrink-0 glass rounded-lg p-3">
        <VoiceVisualizer {...getVisualizerConfig()} />
      </div>

      {/* Main conversation area */}
      <div className="flex-1 glass rounded-lg overflow-hidden">
        <ConversationDisplay
          messages={messages}
          isUserSpeaking={isUserSpeaking}
          isAISpeaking={isAISpeaking}
          currentTranscript={currentTranscript}
          autoScroll={true}
          showTimestamps={false}
          onMessageClick={onMessageClick}
        />
      </div>


    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={getContainerClasses()}
      role="main"
      aria-label={createAriaLabel(
        'Voice interface',
        currentVoiceState,
        isSessionActive ? 'Session active' : 'Session inactive'
      )}
      aria-describedby="voice-interface-description"
    >
      {/* Skip link for keyboard navigation */}
      <a
        ref={skipLinkRef}
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded"
        onClick={(e) => {
          e.preventDefault();
          if (mainContentRef.current) {
            mainContentRef.current.focus();
            ariaAnnouncer.announce('Skipped to main content');
          }
        }}
      >
        Skip to main content
      </a>

      {/* Screen reader description */}
      <div 
        id="voice-interface-description" 
        className="sr-only"
        aria-live="polite"
      >
        {createAriaDescription(
          'Voice interface for AI conversation. Use space to start or stop session.',
          ['Ctrl+M to mute', 'Ctrl+P to pause', 'Ctrl+S to skip to content']
        )}
      </div>

      {/* Interface mode indicator (development helper) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 glass-light rounded px-3 py-1 text-xs text-gray-300 z-50 space-y-1">
          <div>{screenSize} | {interfaceMode} | {currentVoiceState}</div>
          <div>Quality: {currentQuality} | Motion: {prefersReducedMotion ? 'Reduced' : 'Normal'}</div>
          {performanceData && (
            <div>
              FPS: {performanceData.avgFrameRate?.toFixed(1)} | 
              Mem: {performanceData.avgMemoryUsage?.toFixed(1)}MB
            </div>
          )}
          {conversationMemoryStats && conversationMemoryStats.overallHealth !== 'good' && (
            <div className="text-yellow-400">
              Memory: {conversationMemoryStats.overallHealth}
            </div>
          )}
          {motionAwareOptimizations.length > 0 && (
            <div className="text-blue-400">
              Optimizations: {motionAwareOptimizations.slice(-1)[0]?.actions.length || 0}
            </div>
          )}
        </div>
      )}

      {/* Main content area */}
      <div 
        id="main-content"
        ref={mainContentRef}
        tabIndex={-1}
        className="focus:outline-none"
      >
        {renderLayout()}
      </div>

      {/* Voice Controls */}
      <VoiceControls
        isSessionActive={isSessionActive}
        isUserSpeaking={isUserSpeaking}
        isAISpeaking={isAISpeaking}
        isMuted={false}
        isPaused={false}
        isConnecting={currentVoiceState === VOICE_STATES.CONNECTING}
        sessionDuration={0}
        audioLevel={0.5}
        connectionQuality="good"
        inputMode="voice"
        visualizationMode={visualizationStyle}
        enableKeyboardShortcuts={true}
        contextualActions={[]}
        prefersReducedMotion={prefersReducedMotion}
        qualityLevel={currentQuality}
        performanceData={performanceData}
        motionAwareOptimizations={motionAwareOptimizations}
        conversationMemoryStats={conversationMemoryStats}
        onSessionControl={onSessionControl}
        onModeToggle={(mode, value) => {
          if (mode === 'visualization') {
            cycleVisualizationStyle();
            ariaAnnouncer.announce(`Visualization style changed to ${visualizationStyle}`);
          } else if (mode === 'interface') {
            toggleInterfaceMode();
            ariaAnnouncer.announce(`Interface mode changed to ${interfaceMode}`);
          } else if (mode === 'panels') {
            toggleContextualPanels();
            ariaAnnouncer.announce(
              showContextualPanels ? 'Contextual panels hidden' : 'Contextual panels shown'
            );
          }
        }}
        onQuickAction={(action, data) => {
          console.log('Quick action:', action, data);
          ariaAnnouncer.announce(`Quick action: ${action}`);
        }}
        showAdvancedControls={!isMobile}
        position="floating"
        size={isMobile ? 'small' : isTablet ? 'medium' : 'large'}
        theme="dark"
      />
    </div>
  );
}