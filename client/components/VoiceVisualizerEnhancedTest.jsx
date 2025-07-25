import { useState, useEffect } from "react";
import VoiceVisualizer from "./VoiceVisualizer.jsx";
import { VisualizationStyles } from "../utils/audioAnalysis.js";

export default function VoiceVisualizerEnhancedTest() {
  const [isActive, setIsActive] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [visualizationStyle, setVisualizationStyle] = useState(VisualizationStyles.CIRCULAR);

  // Auto-cycle through states for demonstration
  useEffect(() => {
    if (!isActive) return;

    const stateSequence = [
      { user: false, ai: false, processing: false, duration: 2000 }, // idle
      { user: true, ai: false, processing: false, duration: 3000 },  // listening
      { user: false, ai: false, processing: true, duration: 1500 },  // processing
      { user: false, ai: true, processing: false, duration: 4000 },  // speaking
    ];

    let currentStateIndex = 0;
    let timeoutId;

    const cycleStates = () => {
      const state = stateSequence[currentStateIndex];
      setIsUserSpeaking(state.user);
      setIsAISpeaking(state.ai);
      setIsProcessing(state.processing);

      currentStateIndex = (currentStateIndex + 1) % stateSequence.length;
      timeoutId = setTimeout(cycleStates, state.duration);
    };

    cycleStates();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isActive]);

  const handleToggleActive = () => {
    setIsActive(!isActive);
    if (isActive) {
      setIsUserSpeaking(false);
      setIsAISpeaking(false);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Enhanced Voice Visualizer Test
        </h1>
        
        {/* Controls */}
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <button
              onClick={handleToggleActive}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isActive ? 'Stop Session' : 'Start Session'}
            </button>

            <select
              value={visualizationStyle}
              onChange={(e) => setVisualizationStyle(e.target.value)}
              className="px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-600"
            >
              <option value={VisualizationStyles.CIRCULAR}>Circular</option>
              <option value={VisualizationStyles.WAVEFORM}>Waveform</option>
              <option value={VisualizationStyles.PARTICLE}>Particle</option>
              <option value={VisualizationStyles.BARS}>Bars</option>
            </select>

            {/* Manual state controls */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsUserSpeaking(!isUserSpeaking);
                  setIsAISpeaking(false);
                  setIsProcessing(false);
                }}
                className={`px-4 py-2 rounded text-sm ${
                  isUserSpeaking ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}
              >
                User Speaking
              </button>
              <button
                onClick={() => {
                  setIsAISpeaking(!isAISpeaking);
                  setIsUserSpeaking(false);
                  setIsProcessing(false);
                }}
                className={`px-4 py-2 rounded text-sm ${
                  isAISpeaking ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}
              >
                AI Speaking
              </button>
              <button
                onClick={() => {
                  setIsProcessing(!isProcessing);
                  setIsUserSpeaking(false);
                  setIsAISpeaking(false);
                }}
                className={`px-4 py-2 rounded text-sm ${
                  isProcessing ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}
              >
                Processing
              </button>
            </div>
          </div>
        </div>

        {/* Status Display */}
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 mb-8">
          <div className="text-center text-white">
            <p className="text-lg font-medium">
              Current State: {
                isProcessing ? 'Processing' :
                isUserSpeaking ? 'Listening' :
                isAISpeaking ? 'Speaking' :
                isActive ? 'Idle (Connected)' : 'Inactive'
              }
            </p>
            <p className="text-sm text-gray-300 mt-1">
              Visualization: {visualizationStyle} | 
              Session: {isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>

        {/* Visualizer */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-8">
          <VoiceVisualizer
            isActive={isActive}
            isUserSpeaking={isUserSpeaking}
            isAISpeaking={isAISpeaking}
            isProcessing={isProcessing}
            visualizationStyle={visualizationStyle}
          />
        </div>

        {/* Feature Description */}
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 mt-8">
          <h2 className="text-xl font-bold text-white mb-4">Enhanced Features</h2>
          <div className="grid md:grid-cols-2 gap-4 text-gray-300">
            <div>
              <h3 className="font-semibold text-white mb-2">Visual States</h3>
              <ul className="text-sm space-y-1">
                <li>• <span className="text-blue-400">Idle:</span> Subtle ambient animation</li>
                <li>• <span className="text-blue-400">Listening:</span> Real-time audio visualization</li>
                <li>• <span className="text-purple-400">Speaking:</span> AI response animations</li>
                <li>• <span className="text-yellow-400">Processing:</span> Loading/thinking state</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Enhancements</h3>
              <ul className="text-sm space-y-1">
                <li>• Smooth state transitions</li>
                <li>• Enhanced particle effects</li>
                <li>• Improved visual feedback</li>
                <li>• Multiple visualization modes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}