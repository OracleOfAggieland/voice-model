import { useState, useEffect } from 'react';
import VoiceVisualizer from './VoiceVisualizer';
import { VisualizationStyles } from '../utils/audioAnalysis.js';

export default function VoiceVisualizerTest() {
  const [isActive, setIsActive] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [visualizationStyle, setVisualizationStyle] = useState(VisualizationStyles.CIRCULAR);
  const [testMode, setTestMode] = useState('manual');

  // Auto-cycle through states for demo
  useEffect(() => {
    if (testMode === 'auto') {
      const interval = setInterval(() => {
        const states = [
          { user: false, ai: false },
          { user: true, ai: false },
          { user: false, ai: true },
          { user: false, ai: false }
        ];
        
        const currentIndex = states.findIndex(state => 
          state.user === isUserSpeaking && state.ai === isAISpeaking
        );
        const nextState = states[(currentIndex + 1) % states.length];
        
        setIsUserSpeaking(nextState.user);
        setIsAISpeaking(nextState.ai);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [testMode, isUserSpeaking, isAISpeaking]);

  const cycleVisualizationStyle = () => {
    const styles = Object.values(VisualizationStyles);
    const currentIndex = styles.indexOf(visualizationStyle);
    const nextStyle = styles[(currentIndex + 1) % styles.length];
    setVisualizationStyle(nextStyle);
  };

  const toggleTestMode = () => {
    setTestMode(prev => prev === 'manual' ? 'auto' : 'manual');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Voice Visualizer Test - Real-time Audio Analysis
        </h1>
        
        {/* Controls */}
        <div className="glass rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isActive 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </button>
            
            <button
              onClick={() => setIsUserSpeaking(!isUserSpeaking)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isUserSpeaking 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
              disabled={!isActive}
            >
              User Speaking
            </button>
            
            <button
              onClick={() => setIsAISpeaking(!isAISpeaking)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isAISpeaking 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
              disabled={!isActive}
            >
              AI Speaking
            </button>
            
            <button
              onClick={toggleTestMode}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                testMode === 'auto' 
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {testMode === 'auto' ? 'Auto Mode' : 'Manual Mode'}
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={cycleVisualizationStyle}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all"
            >
              Style: {visualizationStyle}
            </button>
            
            <div className="text-white text-sm">
              <span className="font-medium">Status:</span>
              <span className="ml-2">
                {!isActive ? 'Inactive' : 
                 isUserSpeaking ? 'User Speaking' : 
                 isAISpeaking ? 'AI Speaking' : 'Connected'}
              </span>
            </div>
          </div>
        </div>

        {/* Visualization Test Area */}
        <div className="glass rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Real-time Audio Visualization
          </h2>
          
          <div className="bg-black/20 rounded-lg p-4">
            <VoiceVisualizer
              isActive={isActive}
              isUserSpeaking={isUserSpeaking}
              isAISpeaking={isAISpeaking}
              visualizationStyle={visualizationStyle}
            />
          </div>
        </div>

        {/* Feature Information */}
        <div className="glass rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Features Implemented
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white">
            <div>
              <h3 className="font-semibold text-green-400 mb-2">✅ Audio Analysis</h3>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>• Web Audio API integration</li>
                <li>• Real-time frequency analysis</li>
                <li>• Audio level detection</li>
                <li>• Frequency band separation</li>
                <li>• Time domain data processing</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-green-400 mb-2">✅ Visualization Styles</h3>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>• Circular: Radial frequency bars</li>
                <li>• Waveform: Real-time waveform display</li>
                <li>• Particle: Dynamic particle system</li>
                <li>• Bars: Traditional frequency bars</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-green-400 mb-2">✅ Responsive Canvas</h3>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>• Device pixel ratio optimization</li>
                <li>• Performance capability detection</li>
                <li>• Adaptive quality settings</li>
                <li>• Automatic canvas resizing</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-green-400 mb-2">✅ Performance Features</h3>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>• 60fps animation targeting</li>
                <li>• Memory efficient rendering</li>
                <li>• Mobile device optimization</li>
                <li>• Graceful error handling</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-900/30 rounded-lg">
            <p className="text-blue-200 text-sm">
              <strong>Note:</strong> This implementation provides real-time audio analysis and multiple 
              visualization styles with responsive canvas sizing and adaptive quality management. 
              The Web Audio API integration enables advanced frequency analysis for immersive voice interactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}