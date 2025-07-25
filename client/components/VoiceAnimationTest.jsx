import { useState } from 'react';

/**
 * Test component to verify voice animation and styling foundation
 * This component demonstrates the new CSS custom properties, animations, and utility classes
 */
export default function VoiceAnimationTest() {
  const [currentState, setCurrentState] = useState('idle');

  const states = [
    { key: 'idle', label: 'Idle', class: 'voice-idle' },
    { key: 'listening', label: 'Listening', class: 'voice-listening' },
    { key: 'speaking', label: 'Speaking', class: 'voice-speaking' },
    { key: 'processing', label: 'Processing', class: 'voice-processing' },
  ];

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold text-center mb-8">Voice Animation Foundation Test</h2>
      
      {/* Voice State Selector */}
      <div className="flex justify-center space-x-4 mb-8">
        {states.map((state) => (
          <button
            key={state.key}
            onClick={() => setCurrentState(state.key)}
            className={`px-4 py-2 rounded-lg transition-all duration-normal hover-lift active-press ${
              currentState === state.key 
                ? 'bg-voice-listening text-white shadow-glow-voice-listening' 
                : 'glass hover-glow'
            }`}
          >
            {state.label}
          </button>
        ))}
      </div>

      {/* Main Voice Visualizer Demo */}
      <div className="flex justify-center mb-8">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center text-white font-semibold ${
          states.find(s => s.key === currentState)?.class || 'voice-idle'
        }`}>
          <span className="text-sm">{currentState.toUpperCase()}</span>
        </div>
      </div>

      {/* Glassmorphism Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Glass</h3>
          <p className="text-sm text-text-dim">Standard glassmorphism effect</p>
        </div>
        <div className="glass-light p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Glass Light</h3>
          <p className="text-sm text-text-dim">Lighter glassmorphism variant</p>
        </div>
        <div className="glass-lighter p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Glass Lighter</h3>
          <p className="text-sm text-text-dim">Even lighter variant</p>
        </div>
        <div className="glass-heavy p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Glass Heavy</h3>
          <p className="text-sm text-text-dim">Heavy blur effect</p>
        </div>
      </div>

      {/* Animation Examples */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass-panel animate-fade-in-up">
          <h3 className="font-semibold mb-2">Fade In Up</h3>
          <p className="text-sm text-text-dim">Animated panel entry</p>
        </div>
        <div className="glass-panel animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-semibold mb-2">Scale In</h3>
          <p className="text-sm text-text-dim">Scale animation with delay</p>
        </div>
        <div className="glass-panel animate-fade-in-right" style={{ animationDelay: '0.4s' }}>
          <h3 className="font-semibold mb-2">Fade In Right</h3>
          <p className="text-sm text-text-dim">Right slide animation</p>
        </div>
      </div>

      {/* Micro-interaction Examples */}
      <div className="flex justify-center space-x-4 mb-8">
        <button className="floating-element hover-lift active-press">
          <span className="text-sm">Hover Lift</span>
        </button>
        <button className="floating-element hover-scale button-press">
          <span className="text-sm">Scale & Press</span>
        </button>
        <button className="floating-element hover-glow elastic-bounce">
          <span className="text-sm">Glow & Bounce</span>
        </button>
      </div>

      {/* Particle Effect Demo */}
      <div className="relative h-32 glass rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold">Particle Container</span>
        </div>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="particle-float absolute w-2 h-2 bg-voice-listening rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Breathing Animation Demo */}
      <div className="flex justify-center">
        <div className="w-24 h-24 bg-gradient-voice-idle rounded-full animate-breathe flex items-center justify-center">
          <span className="text-white text-xs font-semibold">BREATHE</span>
        </div>
      </div>
    </div>
  );
}