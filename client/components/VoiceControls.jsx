import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ariaAnnouncer, 
  focusManager,
  createAriaLabel,
  createAriaDescription,
  KEYBOARD_KEYS 
} from '../utils/accessibility.js';

// Voice control action types
const CONTROL_ACTIONS = {
  START_SESSION: 'start_session',
  STOP_SESSION: 'stop_session',
  PAUSE_SESSION: 'pause_session',
  RESUME_SESSION: 'resume_session',
  MUTE_MICROPHONE: 'mute_microphone',
  UNMUTE_MICROPHONE: 'unmute_microphone',
  TOGGLE_RECORDING: 'toggle_recording',
  TOGGLE_INPUT_MODE: 'toggle_input_mode',
  TOGGLE_VISUALIZATION: 'toggle_visualization',
  SAVE_NOTE: 'save_note',
  SHARE_CONVERSATION: 'share_conversation',
  OPEN_SETTINGS: 'open_settings',
};

// Input modes
const INPUT_MODES = {
  VOICE: 'voice',
  TEXT: 'text',
  HYBRID: 'hybrid',
};

// Visualization modes
const VISUALIZATION_MODES = {
  WAVEFORM: 'waveform',
  CIRCULAR: 'circular',
  PARTICLE: 'particle',
  MINIMAL: 'minimal',
};

// Control button configurations
const PRIMARY_CONTROLS = [
  {
    id: 'session-toggle',
    action: CONTROL_ACTIONS.START_SESSION,
    icon: 'microphone',
    label: 'Start Voice Session',
    primary: true,
    position: 'center',
  },
  {
    id: 'mute-toggle',
    action: CONTROL_ACTIONS.MUTE_MICROPHONE,
    icon: 'microphone-slash',
    label: 'Mute Microphone',
    primary: false,
    position: 'left',
  },
  {
    id: 'pause-toggle',
    action: CONTROL_ACTIONS.PAUSE_SESSION,
    icon: 'pause',
    label: 'Pause Session',
    primary: false,
    position: 'right',
  },
];

export default function VoiceControls({
  isSessionActive = false,
  isUserSpeaking = false,
  isAISpeaking = false,
  isMuted = false,
  isPaused = false,
  isConnecting = false,
  sessionDuration = 0,
  audioLevel = 0,
  connectionQuality = 'good',
  inputMode = INPUT_MODES.VOICE,
  visualizationMode = VISUALIZATION_MODES.CIRCULAR,
  enableKeyboardShortcuts = true,
  contextualActions = [],
  prefersReducedMotion = false,
  qualityLevel = 'high',
  performanceData = null,
  motionAwareOptimizations = [],
  conversationMemoryStats = null,
  onSessionControl,
  onModeToggle,
  onQuickAction,
  showAdvancedControls = false,
  position = 'floating', // 'floating', 'bottom', 'sidebar'
  size = 'medium', // 'small', 'medium', 'large'
  theme = 'dark',
  className = '',
}) {
  // Component state
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [animationState, setAnimationState] = useState('idle');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showModeToggles, setShowModeToggles] = useState(false);
  
  // Refs for animation and interaction
  const controlsRef = useRef(null);
  const activityTimeoutRef = useRef(null);
  const animationFrameRef = useRef(null);
  const keyboardListenerRef = useRef(null);

  // Auto-hide controls based on activity
  useEffect(() => {
    const resetActivityTimer = () => {
      setLastActivity(Date.now());
      setIsVisible(true);
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      
      // Hide controls after 5 seconds of inactivity (only when session is active)
      if (isSessionActive && !isExpanded) {
        activityTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      }
    };

    // Show controls immediately when session starts or user interacts
    if (isSessionActive || isUserSpeaking || isAISpeaking) {
      resetActivityTimer();
    }

    // Cleanup timeout on unmount
    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [isSessionActive, isUserSpeaking, isAISpeaking, isExpanded]);

  // Animation state management
  useEffect(() => {
    if (isConnecting) {
      setAnimationState('connecting');
    } else if (isUserSpeaking) {
      setAnimationState('listening');
    } else if (isAISpeaking) {
      setAnimationState('speaking');
    } else if (isSessionActive) {
      setAnimationState('active');
    } else {
      setAnimationState('idle');
    }
  }, [isConnecting, isUserSpeaking, isAISpeaking, isSessionActive]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (event) => {
      // Only handle shortcuts when not typing in input fields
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      const { key, ctrlKey, metaKey, altKey, shiftKey } = event;
      const isModifierPressed = ctrlKey || metaKey;

      switch (key.toLowerCase()) {
        case ' ': // Spacebar - Start/Stop session
          if (!isModifierPressed) {
            event.preventDefault();
            handleControlAction(isSessionActive ? CONTROL_ACTIONS.STOP_SESSION : CONTROL_ACTIONS.START_SESSION);
          }
          break;
        case 'm': // M - Mute/Unmute
          if (isModifierPressed) {
            event.preventDefault();
            handleControlAction(isMuted ? CONTROL_ACTIONS.UNMUTE_MICROPHONE : CONTROL_ACTIONS.MUTE_MICROPHONE);
          }
          break;
        case 'p': // P - Pause/Resume
          if (isModifierPressed) {
            event.preventDefault();
            handleControlAction(isPaused ? CONTROL_ACTIONS.RESUME_SESSION : CONTROL_ACTIONS.PAUSE_SESSION);
          }
          break;
        case 'i': // I - Toggle input mode
          if (isModifierPressed) {
            event.preventDefault();
            handleControlAction(CONTROL_ACTIONS.TOGGLE_INPUT_MODE);
          }
          break;
        case 'v': // V - Toggle visualization
          if (isModifierPressed) {
            event.preventDefault();
            handleControlAction(CONTROL_ACTIONS.TOGGLE_VISUALIZATION);
          }
          break;
        case 's': // S - Save note
          if (isModifierPressed && shiftKey) {
            event.preventDefault();
            handleControlAction(CONTROL_ACTIONS.SAVE_NOTE);
          }
          break;
        case 'e': // E - Expand/Collapse
          if (isModifierPressed) {
            event.preventDefault();
            toggleExpanded();
          }
          break;
        case 'escape': // Escape - Hide expanded panels
          if (isExpanded || showQuickActions || showModeToggles) {
            event.preventDefault();
            setIsExpanded(false);
            setShowQuickActions(false);
            setShowModeToggles(false);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    keyboardListenerRef.current = handleKeyDown;

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableKeyboardShortcuts, isSessionActive, isMuted, isPaused, isExpanded, showQuickActions, showModeToggles]);

  // Handle control actions with accessibility announcements
  const handleControlAction = useCallback((action, data = {}) => {
    setLastActivity(Date.now());
    
    let announcement = '';
    let controlName = '';
    let newState = '';
    
    switch (action) {
      case CONTROL_ACTIONS.START_SESSION:
        onSessionControl?.('start');
        controlName = 'Voice session';
        newState = 'started';
        announcement = 'Voice session started';
        break;
      case CONTROL_ACTIONS.STOP_SESSION:
        onSessionControl?.('stop');
        controlName = 'Voice session';
        newState = 'stopped';
        announcement = 'Voice session stopped';
        break;
      case CONTROL_ACTIONS.PAUSE_SESSION:
        onSessionControl?.('pause');
        controlName = 'Voice session';
        newState = 'paused';
        announcement = 'Voice session paused';
        break;
      case CONTROL_ACTIONS.RESUME_SESSION:
        onSessionControl?.('resume');
        controlName = 'Voice session';
        newState = 'resumed';
        announcement = 'Voice session resumed';
        break;
      case CONTROL_ACTIONS.MUTE_MICROPHONE:
        onSessionControl?.('mute');
        controlName = 'Microphone';
        newState = 'muted';
        announcement = 'Microphone muted';
        break;
      case CONTROL_ACTIONS.UNMUTE_MICROPHONE:
        onSessionControl?.('unmute');
        controlName = 'Microphone';
        newState = 'unmuted';
        announcement = 'Microphone unmuted';
        break;
      case CONTROL_ACTIONS.TOGGLE_INPUT_MODE:
        const nextInputMode = getNextInputMode();
        onModeToggle?.('input', nextInputMode);
        controlName = 'Input mode';
        newState = `changed to ${nextInputMode}`;
        announcement = `Input mode changed to ${nextInputMode}`;
        break;
      case CONTROL_ACTIONS.TOGGLE_VISUALIZATION:
        const nextVisualizationMode = getNextVisualizationMode();
        onModeToggle?.('visualization', nextVisualizationMode);
        controlName = 'Visualization';
        newState = `changed to ${nextVisualizationMode}`;
        announcement = `Visualization changed to ${nextVisualizationMode}`;
        break;
      case CONTROL_ACTIONS.SAVE_NOTE:
        onQuickAction?.('save_note', { timestamp: Date.now() });
        controlName = 'Note';
        newState = 'saved';
        announcement = 'Note saved';
        break;
      case CONTROL_ACTIONS.SHARE_CONVERSATION:
        onQuickAction?.('share_conversation', { timestamp: Date.now() });
        controlName = 'Conversation';
        newState = 'shared';
        announcement = 'Conversation shared';
        break;
      case CONTROL_ACTIONS.OPEN_SETTINGS:
        onQuickAction?.('open_settings', {});
        controlName = 'Settings';
        newState = 'opened';
        announcement = 'Settings opened';
        break;
      default:
        onSessionControl?.(action, data);
    }

    // Announce action to screen readers with enhanced information
    if (announcement) {
      ariaAnnouncer.announceControlChange(controlName, newState);
    }
  }, [onSessionControl, onModeToggle, onQuickAction, inputMode, visualizationMode]);

  // Get next input mode
  const getNextInputMode = useCallback(() => {
    const modes = Object.values(INPUT_MODES);
    const currentIndex = modes.indexOf(inputMode);
    return modes[(currentIndex + 1) % modes.length];
  }, [inputMode]);

  // Get next visualization mode
  const getNextVisualizationMode = useCallback(() => {
    const modes = Object.values(VISUALIZATION_MODES);
    const currentIndex = modes.indexOf(visualizationMode);
    return modes[(currentIndex + 1) % modes.length];
  }, [visualizationMode]);

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
    setLastActivity(Date.now());
  }, []);

  // Toggle quick actions panel
  const toggleQuickActions = useCallback(() => {
    setShowQuickActions(prev => !prev);
    setShowModeToggles(false);
    setLastActivity(Date.now());
  }, []);

  // Toggle mode toggles panel
  const toggleModeToggles = useCallback(() => {
    setShowModeToggles(prev => !prev);
    setShowQuickActions(false);
    setLastActivity(Date.now());
  }, []);

  // Get control button state
  const getControlState = (controlId) => {
    switch (controlId) {
      case 'session-toggle':
        return {
          active: isSessionActive,
          disabled: isConnecting,
          icon: isSessionActive ? 'stop' : 'microphone',
          label: isSessionActive ? 'Stop Session' : 'Start Session',
          action: isSessionActive ? CONTROL_ACTIONS.STOP_SESSION : CONTROL_ACTIONS.START_SESSION,
        };
      case 'mute-toggle':
        return {
          active: isMuted,
          disabled: !isSessionActive,
          icon: isMuted ? 'microphone-slash' : 'microphone',
          label: isMuted ? 'Unmute' : 'Mute',
          action: isMuted ? CONTROL_ACTIONS.UNMUTE_MICROPHONE : CONTROL_ACTIONS.MUTE_MICROPHONE,
        };
      case 'pause-toggle':
        return {
          active: isPaused,
          disabled: !isSessionActive,
          icon: isPaused ? 'play' : 'pause',
          label: isPaused ? 'Resume' : 'Pause',
          action: isPaused ? CONTROL_ACTIONS.RESUME_SESSION : CONTROL_ACTIONS.PAUSE_SESSION,
        };
      default:
        return { active: false, disabled: false };
    }
  };

  // Render control icon
  const renderIcon = (iconName, className = '') => {
    const iconPaths = {
      microphone: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8",
      'microphone-slash': "m1 1 22 22 M9 9v3a3 3 0 0 0 5.12 2.12l1.27-1.27A3 3 0 0 0 15 12V4a3 3 0 0 0-3-3 3 3 0 0 0-3 3v1 M19 10v2a7 7 0 0 1-.11 1.23 M12 19v4 M8 23h8",
      stop: "M6 6h12v12H6z",
      pause: "M6 4h4v16H6V4z M14 4h4v16h-4V4z",
      play: "m3 2 18 10L3 22V2z",
      settings: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
      expand: "M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3",
      'input-mode': "M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z M9 11h6 M9 15h6",
      'visualization': "M3 3v18h18 M7 16l4-4 4 4 4-4",
      'quick-actions': "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
      save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8",
      share: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8 M16 6l-4-4-4 4 M12 2v13",
      keyboard: "M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M8 8h.01 M12 8h.01 M16 8h.01 M8 12h.01 M12 12h.01 M16 12h.01 M10 16h4",
      'text-input': "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
      'voice-input': "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2",
    };

    return (
      <svg 
        className={`w-5 h-5 ${className}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        strokeWidth={2}
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d={iconPaths[iconName]} />
      </svg>
    );
  };

  // Render primary control button with full accessibility
  const renderControlButton = (control) => {
    const state = getControlState(control.id);
    const isPrimary = control.primary;
    
    // Build animation classes based on motion preferences
    const animationClasses = prefersReducedMotion 
      ? '' 
      : `transition-all duration-300 ease-smooth ${!state.disabled ? 'hover:scale-110 hover:bg-purple-500/40' : ''} ${isPrimary && isSessionActive ? 'animate-pulse' : ''}`;
    
    const buttonClasses = `
      voice-control-button
      ${isPrimary ? 'primary-control' : 'secondary-control'}
      ${state.active ? 'active' : ''}
      ${state.disabled ? 'disabled' : ''}
      ${animationState}
      ${animationClasses}
      ${isPrimary ? 'w-16 h-16' : 'w-12 h-12'}
      rounded-full
      flex items-center justify-center
      glass-strong
      ${state.active ? 'bg-purple-500/30 border-purple-400' : 'bg-gray-800/50 border-gray-600'}
      ${state.disabled ? 'opacity-50 cursor-not-allowed' : ''}
      backdrop-blur-md
      border
      shadow-lg
      focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900
    `;

    // Create comprehensive ARIA label
    const ariaLabel = createAriaLabel(
      state.label,
      state.active ? 'active' : 'inactive',
      state.disabled ? 'disabled' : 'enabled'
    );

    // Create ARIA description with keyboard shortcuts
    const shortcuts = [];
    if (control.id === 'session-toggle') shortcuts.push('Space');
    if (control.id === 'mute-toggle') shortcuts.push('Ctrl+M');
    if (control.id === 'pause-toggle') shortcuts.push('Ctrl+P');
    
    const ariaDescription = createAriaDescription(
      `${state.label} control button`,
      shortcuts
    );

    return (
      <button
        key={control.id}
        className={buttonClasses}
        onClick={() => !state.disabled && handleControlAction(state.action)}
        onKeyDown={(e) => {
          // Handle Enter and Space keys
          if ((e.key === KEYBOARD_KEYS.ENTER || e.key === KEYBOARD_KEYS.SPACE) && !state.disabled) {
            e.preventDefault();
            handleControlAction(state.action);
          }
        }}
        disabled={state.disabled}
        title={state.label}
        aria-label={ariaLabel}
        aria-describedby={`${control.id}-description`}
        aria-pressed={state.active}
        role="button"
        tabIndex={state.disabled ? -1 : 0}
      >
        {/* Hidden description for screen readers */}
        <span id={`${control.id}-description`} className="sr-only">
          {ariaDescription}
        </span>

        {renderIcon(state.icon, `${isPrimary ? 'w-6 h-6' : 'w-4 h-4'} text-white`)}
        
        {/* Audio level indicator for microphone button */}
        {control.id === 'session-toggle' && isSessionActive && audioLevel > 0 && (
          <div 
            className={`absolute inset-0 rounded-full border-2 border-green-400 ${prefersReducedMotion ? '' : 'animate-ping'}`}
            aria-hidden="true"
          />
        )}
        
        {/* Connection quality indicator */}
        {control.id === 'session-toggle' && isSessionActive && (
          <div 
            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
              connectionQuality === 'good' ? 'bg-green-400' :
              connectionQuality === 'fair' ? 'bg-yellow-400' : 'bg-red-400'
            }`}
            aria-label={`Connection quality: ${connectionQuality}`}
            role="status"
          />
        )}
      </button>
    );
  };

  // Get container classes based on position and visibility
  const getContainerClasses = () => {
    const baseClasses = 'voice-controls-container transition-all duration-500 ease-smooth';
    const positionClasses = {
      floating: 'fixed bottom-6 right-6 z-50',
      bottom: 'fixed bottom-0 left-0 right-0 z-40 p-4',
      sidebar: 'relative w-full',
    };
    
    const visibilityClasses = isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none';
    const sizeClasses = {
      small: 'scale-75',
      medium: 'scale-100',
      large: 'scale-125',
    };

    return `${baseClasses} ${positionClasses[position]} ${visibilityClasses} ${sizeClasses[size]} ${className}`;
  };

  // Render session info (when expanded)
  const renderSessionInfo = () => {
    if (!isExpanded || !isSessionActive) return null;

    const formatDuration = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="session-info glass-light rounded-lg p-3 mb-4 text-sm text-gray-300">
        <div className="flex justify-between items-center mb-2">
          <span>Session Duration</span>
          <span className="font-mono">{formatDuration(sessionDuration)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span>Audio Level</span>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-1 h-3 rounded-full ${
                  i < Math.floor(audioLevel * 5) ? 'bg-green-400' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span>Connection</span>
          <span className={`capitalize ${
            connectionQuality === 'good' ? 'text-green-400' :
            connectionQuality === 'fair' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {connectionQuality}
          </span>
        </div>
      </div>
    );
  };

  // Render mode toggles panel
  const renderModeToggles = () => {
    if (!showModeToggles) return null;

    return (
      <div className="mode-toggles glass-light rounded-lg p-3 mb-4 text-sm">
        <h4 className="text-white font-medium mb-3">Mode Controls</h4>
        
        {/* Input Mode Toggle */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-300">Input Mode</span>
          <button
            onClick={() => handleControlAction(CONTROL_ACTIONS.TOGGLE_INPUT_MODE)}
            className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full text-white hover:bg-gray-600 transition-colors"
            title={`Current: ${inputMode} - Click to cycle`}
          >
            {renderIcon(inputMode === INPUT_MODES.VOICE ? 'voice-input' : inputMode === INPUT_MODES.TEXT ? 'text-input' : 'input-mode', 'w-3 h-3')}
            <span className="capitalize text-xs">{inputMode}</span>
          </button>
        </div>

        {/* Visualization Mode Toggle */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-300">Visualization</span>
          <button
            onClick={() => handleControlAction(CONTROL_ACTIONS.TOGGLE_VISUALIZATION)}
            className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full text-white hover:bg-gray-600 transition-colors"
            title={`Current: ${visualizationMode} - Click to cycle`}
          >
            {renderIcon('visualization', 'w-3 h-3')}
            <span className="capitalize text-xs">{visualizationMode}</span>
          </button>
        </div>

        {/* Keyboard Shortcuts Info */}
        {enableKeyboardShortcuts && (
          <div className="pt-2 border-t border-gray-600">
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              {renderIcon('keyboard', 'w-3 h-3')}
              <span>Shortcuts enabled</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render quick actions panel
  const renderQuickActions = () => {
    if (!showQuickActions) return null;

    const defaultActions = [
      {
        id: 'save-note',
        label: 'Save Note',
        icon: 'save',
        action: CONTROL_ACTIONS.SAVE_NOTE,
        shortcut: 'Ctrl+Shift+S',
        disabled: !isSessionActive,
      },
      {
        id: 'share-conversation',
        label: 'Share',
        icon: 'share',
        action: CONTROL_ACTIONS.SHARE_CONVERSATION,
        shortcut: null,
        disabled: !isSessionActive,
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: 'settings',
        action: CONTROL_ACTIONS.OPEN_SETTINGS,
        shortcut: null,
        disabled: false,
      },
    ];

    const allActions = [...defaultActions, ...contextualActions];

    return (
      <div className="quick-actions glass-light rounded-lg p-3 mb-4 text-sm">
        <h4 className="text-white font-medium mb-3">Quick Actions</h4>
        
        <div className="grid grid-cols-1 gap-2">
          {allActions.map((action) => (
            <button
              key={action.id}
              onClick={() => !action.disabled && handleControlAction(action.action)}
              disabled={action.disabled}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left
                ${action.disabled 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
                }
              `}
              title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
            >
              {renderIcon(action.icon, 'w-4 h-4')}
              <span className="flex-1">{action.label}</span>
              {action.shortcut && (
                <span className="text-xs text-gray-400 font-mono">{action.shortcut}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Render keyboard shortcuts help
  const renderKeyboardShortcuts = () => {
    if (!isExpanded || !enableKeyboardShortcuts) return null;

    const shortcuts = [
      { key: 'Space', action: 'Start/Stop Session' },
      { key: 'Ctrl+M', action: 'Mute/Unmute' },
      { key: 'Ctrl+P', action: 'Pause/Resume' },
      { key: 'Ctrl+I', action: 'Toggle Input Mode' },
      { key: 'Ctrl+V', action: 'Toggle Visualization' },
      { key: 'Ctrl+E', action: 'Expand/Collapse' },
      { key: 'Escape', action: 'Close Panels' },
    ];

    return (
      <div className="keyboard-shortcuts glass-light rounded-lg p-3 mb-4 text-sm">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          {renderIcon('keyboard', 'w-4 h-4')}
          Keyboard Shortcuts
        </h4>
        
        <div className="grid grid-cols-1 gap-1">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex justify-between items-center py-1">
              <span className="text-gray-300">{shortcut.action}</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs font-mono text-gray-400">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={getContainerClasses()} 
      ref={controlsRef}
      role="toolbar"
      aria-label="Voice control toolbar"
      aria-describedby="voice-controls-description"
    >
      {/* Screen reader description */}
      <div id="voice-controls-description" className="sr-only">
        Voice control toolbar with session controls, mode toggles, and quick actions. 
        Use Tab to navigate between controls.
      </div>

      {/* Advanced control panels */}
      {renderModeToggles()}
      {renderQuickActions()}
      {renderSessionInfo()}
      {renderKeyboardShortcuts()}
      
      {/* Main controls */}
      <div 
        className={`
          voice-controls-main
          flex items-center justify-center gap-4
          ${position === 'floating' ? 'flex-row' : 'flex-row'}
        `}
        role="group"
        aria-label="Primary voice controls"
      >
        {PRIMARY_CONTROLS.map(renderControlButton)}
        
        {/* Advanced control buttons */}
        {showAdvancedControls && (
          <div role="group" aria-label="Advanced controls">
            {/* Mode toggles button */}
            <button
              className={`voice-control-button secondary-control w-10 h-10 rounded-full flex items-center justify-center glass-strong border backdrop-blur-md shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                prefersReducedMotion ? '' : 'transition-all duration-300 ease-smooth hover:scale-110 hover:bg-purple-500/40'
              } ${
                showModeToggles 
                  ? 'bg-purple-500/30 border-purple-400' 
                  : 'bg-gray-800/50 border-gray-600'
              }`}
              onClick={toggleModeToggles}
              onKeyDown={(e) => {
                if (e.key === KEYBOARD_KEYS.ENTER || e.key === KEYBOARD_KEYS.SPACE) {
                  e.preventDefault();
                  toggleModeToggles();
                }
              }}
              title="Mode Controls"
              aria-label={createAriaLabel(
                'Mode controls',
                showModeToggles ? 'expanded' : 'collapsed'
              )}
              aria-expanded={showModeToggles}
              aria-controls="mode-toggles-panel"
            >
              {renderIcon('input-mode', 'w-4 h-4 text-white')}
            </button>

            {/* Quick actions button */}
            <button
              className={`voice-control-button secondary-control w-10 h-10 rounded-full flex items-center justify-center glass-strong border backdrop-blur-md shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                prefersReducedMotion ? '' : 'transition-all duration-300 ease-smooth hover:scale-110 hover:bg-purple-500/40'
              } ${
                showQuickActions 
                  ? 'bg-purple-500/30 border-purple-400' 
                  : 'bg-gray-800/50 border-gray-600'
              }`}
              onClick={toggleQuickActions}
              onKeyDown={(e) => {
                if (e.key === KEYBOARD_KEYS.ENTER || e.key === KEYBOARD_KEYS.SPACE) {
                  e.preventDefault();
                  toggleQuickActions();
                }
              }}
              title="Quick Actions"
              aria-label={createAriaLabel(
                'Quick actions',
                showQuickActions ? 'expanded' : 'collapsed'
              )}
              aria-expanded={showQuickActions}
              aria-controls="quick-actions-panel"
            >
              {renderIcon('quick-actions', 'w-4 h-4 text-white')}
            </button>

            {/* Expand/collapse button */}
            <button
              className={`voice-control-button secondary-control w-10 h-10 rounded-full flex items-center justify-center glass-strong bg-gray-800/50 border border-gray-600 backdrop-blur-md shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                prefersReducedMotion ? '' : 'hover:scale-110 hover:bg-purple-500/40 transition-all duration-300 ease-smooth'
              }`}
              onClick={toggleExpanded}
              onKeyDown={(e) => {
                if (e.key === KEYBOARD_KEYS.ENTER || e.key === KEYBOARD_KEYS.SPACE) {
                  e.preventDefault();
                  toggleExpanded();
                }
              }}
              title={isExpanded ? 'Collapse' : 'Expand'}
              aria-label={createAriaLabel(
                'Expand controls',
                isExpanded ? 'expanded' : 'collapsed'
              )}
              aria-expanded={isExpanded}
            >
              {renderIcon('expand', `w-4 h-4 text-white ${prefersReducedMotion ? '' : 'transform transition-transform duration-300'} ${isExpanded ? 'rotate-180' : ''}`)}
            </button>
          </div>
        )}
      </div>

      {/* Activity indicator with accessibility */}
      {isSessionActive && (
        <div 
          className="activity-indicator absolute -bottom-2 left-1/2 transform -translate-x-1/2"
          role="status"
          aria-label={
            isUserSpeaking ? 'User is speaking' :
            isAISpeaking ? 'AI is responding' :
            'Session active'
          }
        >
          <div className={`w-2 h-2 rounded-full ${prefersReducedMotion ? '' : 'transition-colors duration-300'} ${
            isUserSpeaking ? `bg-blue-400 ${prefersReducedMotion ? '' : 'animate-pulse'}` :
            isAISpeaking ? `bg-purple-400 ${prefersReducedMotion ? '' : 'animate-pulse'}` :
            'bg-gray-500'
          }`} />
        </div>
      )}

      {/* Performance monitoring display (development only) */}
      {process.env.NODE_ENV === 'development' && performanceData && (
        <div 
          className="absolute -top-16 left-0 right-0 glass-light rounded px-2 py-1 text-xs text-gray-300 z-50"
          role="status"
          aria-label="Performance monitoring"
        >
          <div className="flex justify-between items-center space-x-2">
            <span>FPS: {performanceData.avgFrameRate?.toFixed(1)}</span>
            <span>Mem: {performanceData.avgMemoryUsage?.toFixed(1)}MB</span>
            <span>Quality: {qualityLevel}</span>
            {conversationMemoryStats?.overallHealth !== 'good' && (
              <span className="text-yellow-400">
                Mem: {conversationMemoryStats.overallHealth}
              </span>
            )}
            {motionAwareOptimizations.length > 0 && (
              <span className="text-blue-400">
                Opt: {motionAwareOptimizations.slice(-1)[0]?.actions.length || 0}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}