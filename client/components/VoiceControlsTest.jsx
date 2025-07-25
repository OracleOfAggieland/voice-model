import { useState, useEffect } from 'react';
import VoiceControls from './VoiceControls';

export default function VoiceControlsTest() {
  // Test state
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [position, setPosition] = useState('floating');
  const [size, setSize] = useState('medium');
  const [theme, setTheme] = useState('dark');
  const [showAdvancedControls, setShowAdvancedControls] = useState(true);
  const [inputMode, setInputMode] = useState('voice');
  const [visualizationMode, setVisualizationMode] = useState('circular');
  const [enableKeyboardShortcuts, setEnableKeyboardShortcuts] = useState(true);

  // Simulate session duration
  useEffect(() => {
    let interval;
    if (isSessionActive && !isPaused) {
      interval = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, isPaused]);

  // Simulate audio level changes
  useEffect(() => {
    let interval;
    if (isSessionActive && (isUserSpeaking || isAISpeaking)) {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 0.8 + 0.2);
      }, 100);
    } else {
      setAudioLevel(0);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, isUserSpeaking, isAISpeaking]);

  // Handle session control actions
  const handleSessionControl = (action, data) => {
    console.log('Session control action:', action, data);
    
    switch (action) {
      case 'start':
        setIsConnecting(true);
        setTimeout(() => {
          setIsConnecting(false);
          setIsSessionActive(true);
          setSessionDuration(0);
        }, 2000);
        break;
      case 'stop':
        setIsSessionActive(false);
        setIsUserSpeaking(false);
        setIsAISpeaking(false);
        setIsPaused(false);
        setSessionDuration(0);
        break;
      case 'pause':
        setIsPaused(true);
        setIsUserSpeaking(false);
        setIsAISpeaking(false);
        break;
      case 'resume':
        setIsPaused(false);
        break;
      case 'mute':
        setIsMuted(true);
        break;
      case 'unmute':
        setIsMuted(false);
        break;
    }
  };

  // Handle mode toggles
  const handleModeToggle = (mode, value) => {
    console.log('Mode toggle:', mode, value);
    if (mode === 'input') {
      setInputMode(value);
    } else if (mode === 'visualization') {
      setVisualizationMode(value);
    }
  };

  // Handle quick actions
  const handleQuickAction = (action, data) => {
    console.log('Quick action:', action, data);
  };

  // Simulate speaking states
  const simulateUserSpeaking = () => {
    if (!isSessionActive || isMuted) return;
    setIsUserSpeaking(true);
    setTimeout(() => setIsUserSpeaking(false), 3000);
  };

  const simulateAISpeaking = () => {
    if (!isSessionActive) return;
    setIsAISpeaking(true);
    setTimeout(() => setIsAISpeaking(false), 4000);
  };

  // Cycle connection quality
  const cycleConnectionQuality = () => {
    const qualities = ['good', 'fair', 'poor'];
    const currentIndex = qualities.indexOf(connectionQuality);
    setConnectionQuality(qualities[(currentIndex + 1) % qualities.length]);
  };

  return (
    <div className="voice-controls-test min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Voice Controls Test
        </h1>

        {/* Test Controls */}
        <div className="glass rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Test Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Session State Controls */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300">Session State</h3>
              <button
                onClick={simulateUserSpeaking}
                disabled={!isSessionActive || isMuted}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Simulate User Speaking
              </button>
              <button
                onClick={simulateAISpeaking}
                disabled={!isSessionActive}
                className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Simulate AI Speaking
              </button>
              <button
                onClick={cycleConnectionQuality}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Connection: {connectionQuality}
              </button>
            </div>

            {/* Appearance Controls */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300">Appearance</h3>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded"
              >
                <option value="floating">Floating</option>
                <option value="bottom">Bottom</option>
                <option value="sidebar">Sidebar</option>
              </select>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            {/* Feature Controls */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300">Features</h3>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showAdvancedControls}
                  onChange={(e) => setShowAdvancedControls(e.target.checked)}
                  className="rounded"
                />
                <span className="text-white">Advanced Controls</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={enableKeyboardShortcuts}
                  onChange={(e) => setEnableKeyboardShortcuts(e.target.checked)}
                  className="rounded"
                />
                <span className="text-white">Keyboard Shortcuts</span>
              </label>
              <select
                value={inputMode}
                onChange={(e) => setInputMode(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded"
              >
                <option value="voice">Voice Input</option>
                <option value="text">Text Input</option>
                <option value="hybrid">Hybrid Input</option>
              </select>
              <select
                value={visualizationMode}
                onChange={(e) => setVisualizationMode(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded"
              >
                <option value="waveform">Waveform</option>
                <option value="circular">Circular</option>
                <option value="particle">Particle</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
          </div>

          {/* Status Display */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-400">Session</div>
              <div className={`font-semibold ${isSessionActive ? 'text-green-400' : 'text-red-400'}`}>
                {isConnecting ? 'Connecting...' : isSessionActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Duration</div>
              <div className="font-semibold text-white font-mono">
                {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Audio Level</div>
              <div className="font-semibold text-white">
                {Math.round(audioLevel * 100)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Input Mode</div>
              <div className="font-semibold text-white capitalize">
                {inputMode}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Visualization</div>
              <div className="font-semibold text-white capitalize">
                {visualizationMode}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">State</div>
              <div className="font-semibold text-white">
                {isUserSpeaking ? 'User Speaking' : 
                 isAISpeaking ? 'AI Speaking' : 
                 isPaused ? 'Paused' : 
                 isMuted ? 'Muted' : 'Ready'}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="glass rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Instructions</h2>
          <div className="text-gray-300 space-y-2">
            <p>• Click the microphone button to start/stop a voice session</p>
            <p>• Use the mute button to toggle microphone muting</p>
            <p>• Use the pause button to pause/resume the session</p>
            <p>• The mode button toggles input and visualization modes</p>
            <p>• The star button shows quick actions (save, share, settings)</p>
            <p>• The expand button shows session info and keyboard shortcuts</p>
            <p>• Controls auto-hide after 5 seconds of inactivity during active sessions</p>
            <p>• Keyboard shortcuts: Space (start/stop), Ctrl+M (mute), Ctrl+P (pause), Ctrl+I (input mode), Ctrl+V (visualization)</p>
          </div>
        </div>
      </div>

      {/* Voice Controls Component */}
      <VoiceControls
        isSessionActive={isSessionActive}
        isUserSpeaking={isUserSpeaking}
        isAISpeaking={isAISpeaking}
        isMuted={isMuted}
        isPaused={isPaused}
        isConnecting={isConnecting}
        sessionDuration={sessionDuration}
        audioLevel={audioLevel}
        connectionQuality={connectionQuality}
        inputMode={inputMode}
        visualizationMode={visualizationMode}
        enableKeyboardShortcuts={enableKeyboardShortcuts}
        contextualActions={[
          {
            id: 'test-action',
            label: 'Test Action',
            icon: 'settings',
            action: 'test_action',
            disabled: false,
          }
        ]}
        onSessionControl={handleSessionControl}
        onModeToggle={handleModeToggle}
        onQuickAction={handleQuickAction}
        showAdvancedControls={showAdvancedControls}
        position={position}
        size={size}
        theme={theme}
      />
    </div>
  );
}