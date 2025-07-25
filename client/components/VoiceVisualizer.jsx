import { useEffect, useRef, useState } from "react";
import { AudioAnalyzer, VisualizationStyles, CanvasManager } from "../utils/audioAnalysis.js";
import { 
  WaveformRenderer, 
  CircularRenderer, 
  ParticleRenderer, 
  BarsRenderer 
} from "../utils/visualizationRenderers.js";
import { 
  visualIndicatorManager,
  createAriaLabel 
} from '../utils/accessibility.js';
import { 
  animationFrameManager, 
  memoryManager,
  QUALITY_LEVELS 
} from '../utils/performance.js';

export default function VoiceVisualizer({
  isActive,
  isUserSpeaking,
  isAISpeaking,
  isProcessing = false,
  visualizationStyle = VisualizationStyles.CIRCULAR,
  prefersReducedMotion = false,
  qualityLevel = QUALITY_LEVELS.HIGH,
  qualitySettings = {},
  performanceData = null
}) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioAnalyzerRef = useRef(null);
  const canvasManagerRef = useRef(null);
  const renderersRef = useRef({});
  const transitionStateRef = useRef({
    currentState: 'idle',
    targetState: 'idle',
    transitionProgress: 1.0,
    transitionDuration: 800 // ms
  });
  
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [audioError, setAudioError] = useState(null);

  // Determine current visual state
  const getVisualState = () => {
    if (!isActive) return 'idle';
    if (isProcessing) return 'processing';
    if (isUserSpeaking) return 'listening';
    if (isAISpeaking) return 'speaking';
    return 'idle';
  };

  // Initialize audio analyzer and canvas manager
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        if (!audioAnalyzerRef.current) {
          audioAnalyzerRef.current = new AudioAnalyzer();
        }
        
        const success = await audioAnalyzerRef.current.initialize();
        setIsAudioInitialized(success);
        
        if (!success) {
          setAudioError("Failed to access microphone");
        }
      } catch (error) {
        console.error("Audio initialization error:", error);
        setAudioError(error.message);
        setIsAudioInitialized(false);
      }
    };

    if (isActive && !isAudioInitialized) {
      initializeAudio();
    }

    return () => {
      if (audioAnalyzerRef.current) {
        audioAnalyzerRef.current.destroy();
        audioAnalyzerRef.current = null;
        setIsAudioInitialized(false);
      }
    };
  }, [isActive, isAudioInitialized]);

  // Initialize canvas manager and renderers
  useEffect(() => {
    if (canvasRef.current && !canvasManagerRef.current) {
      canvasManagerRef.current = new CanvasManager(canvasRef.current);
      
      // Initialize all renderers
      renderersRef.current = {
        [VisualizationStyles.WAVEFORM]: new WaveformRenderer(canvasRef.current, canvasManagerRef.current),
        [VisualizationStyles.CIRCULAR]: new CircularRenderer(canvasRef.current, canvasManagerRef.current),
        [VisualizationStyles.PARTICLE]: new ParticleRenderer(canvasRef.current, canvasManagerRef.current),
        [VisualizationStyles.BARS]: new BarsRenderer(canvasRef.current, canvasManagerRef.current)
      };
    }
  }, []);

  // Handle state transitions
  useEffect(() => {
    const currentVisualState = getVisualState();
    const transitionState = transitionStateRef.current;
    
    if (currentVisualState !== transitionState.targetState) {
      transitionState.currentState = transitionState.targetState;
      transitionState.targetState = currentVisualState;
      transitionState.transitionProgress = 0.0;
    }
  }, [isActive, isUserSpeaking, isAISpeaking, isProcessing]);

  // Main animation loop
  useEffect(() => {
    if (!canvasRef.current || !canvasManagerRef.current) return;

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      const time = Date.now();
      const renderer = renderersRef.current[visualizationStyle];
      
      if (!renderer) return;

      // Update transition progress
      const transitionState = transitionStateRef.current;
      if (transitionState.transitionProgress < 1.0) {
        transitionState.transitionProgress = Math.min(1.0, 
          transitionState.transitionProgress + (16 / transitionState.transitionDuration));
      }

      let audioData = null;
      let timeDomainData = null;
      let audioLevel = 0;
      let frequencyBands = { bass: 0, mid: 0, treble: 0 };

      // Get real-time audio data when user is speaking
      if (isUserSpeaking && audioAnalyzerRef.current && isAudioInitialized) {
        audioData = audioAnalyzerRef.current.getFrequencyData();
        timeDomainData = audioAnalyzerRef.current.getTimeDomainData();
        audioLevel = audioAnalyzerRef.current.getAudioLevel();
        frequencyBands = audioAnalyzerRef.current.getFrequencyBands();
      }

      // Render the visualization with state information
      renderer.render(audioData || timeDomainData, {
        visualState: transitionState.targetState,
        previousState: transitionState.currentState,
        transitionProgress: transitionState.transitionProgress,
        isUserSpeaking,
        isAISpeaking,
        isProcessing,
        time,
        audioLevel,
        frequencyBands
      });
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isUserSpeaking, isAISpeaking, isProcessing, visualizationStyle, isAudioInitialized]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasManagerRef.current) {
        canvasManagerRef.current.setupResponsiveCanvas();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get current status for accessibility
  const getStatusText = () => {
    if (isProcessing) return "Processing your request";
    if (isUserSpeaking) return "Listening to your voice";
    if (isAISpeaking) return "AI is responding";
    if (isActive) return "Voice interface connected and ready";
    return "Voice interface inactive";
  };

  const getDescriptionText = () => {
    if (audioError) return `Audio Error: ${audioError}`;
    if (isActive) return "Voice visualization showing audio activity. Ask me anything about your finances";
    return "Voice visualization inactive. Click Start to begin voice session";
  };

  return (
    <div 
      className="relative w-full h-48 flex items-center justify-center"
      role="img"
      aria-label={createAriaLabel(
        'Voice visualization',
        getStatusText(),
        `Style: ${visualizationStyle}`
      )}
      aria-describedby="voice-visualizer-description"
    >
      {/* Screen reader description */}
      <div id="voice-visualizer-description" className="sr-only">
        {getDescriptionText()}
        {prefersReducedMotion && " Animations are reduced based on your preferences."}
      </div>

      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ 
          background: 'transparent',
          imageRendering: 'auto'
        }}
        aria-hidden="true"
      />
      
      {/* Status overlay */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <div className="text-center">
          <p className="text-lg font-medium text-white">
            {isProcessing
              ? "Processing..."
              : isUserSpeaking
              ? "Listening..."
              : isAISpeaking
              ? "Speaking..."
              : isActive
              ? "Connected"
              : "Inactive"}
          </p>
          <p className="text-sm text-gray-400">
            {audioError 
              ? `Audio Error: ${audioError}`
              : isActive 
                ? "Ask me anything about your finances" 
                : "Click Start to begin"
            }
          </p>
          
          {/* Audio initialization status */}
          {isActive && !isAudioInitialized && !audioError && (
            <p className="text-xs text-yellow-400 mt-1">
              Initializing audio...
            </p>
          )}
        </div>
      </div>

      {/* Visual indicators for audio cues */}
      {isUserSpeaking && (
        <div 
          className="absolute top-4 left-4 w-3 h-3 bg-blue-400 rounded-full"
          role="status"
          aria-label="User is speaking"
        />
      )}
      
      {isAISpeaking && (
        <div 
          className="absolute top-4 left-4 w-3 h-3 bg-purple-400 rounded-full"
          role="status"
          aria-label="AI is responding"
        />
      )}

      {/* Visualization style indicator (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 text-xs text-white/50 pointer-events-none">
          {visualizationStyle}
        </div>
      )}
    </div>
  );
}