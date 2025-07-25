/**
 * Audio Analysis Utility for Real-time Voice Visualization
 * Provides Web Audio API integration and frequency analysis
 */

export class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.dataArray = null;
    this.bufferLength = 0;
    this.isInitialized = false;
    this.stream = null;
  }

  async initialize() {
    if (this.isInitialized) return true;

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512; // Higher resolution for better visualization
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      // Connect microphone to analyser
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);

      // Setup data arrays
      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize audio analyzer:', error);
      return false;
    }
  }

  getFrequencyData() {
    if (!this.isInitialized || !this.analyser) return null;
    
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  getTimeDomainData() {
    if (!this.isInitialized || !this.analyser) return null;
    
    const timeDomainArray = new Uint8Array(this.bufferLength);
    this.analyser.getByteTimeDomainData(timeDomainArray);
    return timeDomainArray;
  }

  getAudioLevel() {
    const frequencyData = this.getFrequencyData();
    if (!frequencyData) return 0;

    // Calculate RMS (Root Mean Square) for overall audio level
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      sum += frequencyData[i] * frequencyData[i];
    }
    return Math.sqrt(sum / frequencyData.length) / 255;
  }

  getFrequencyBands() {
    const frequencyData = this.getFrequencyData();
    if (!frequencyData) return { bass: 0, mid: 0, treble: 0 };

    const bassEnd = Math.floor(this.bufferLength * 0.1);
    const midEnd = Math.floor(this.bufferLength * 0.4);
    
    let bass = 0, mid = 0, treble = 0;
    
    // Bass frequencies (0-10% of spectrum)
    for (let i = 0; i < bassEnd; i++) {
      bass += frequencyData[i];
    }
    bass = (bass / bassEnd) / 255;

    // Mid frequencies (10-40% of spectrum)
    for (let i = bassEnd; i < midEnd; i++) {
      mid += frequencyData[i];
    }
    mid = (mid / (midEnd - bassEnd)) / 255;

    // Treble frequencies (40-100% of spectrum)
    for (let i = midEnd; i < this.bufferLength; i++) {
      treble += frequencyData[i];
    }
    treble = (treble / (this.bufferLength - midEnd)) / 255;

    return { bass, mid, treble };
  }

  destroy() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.isInitialized = false;
  }
}

/**
 * Visualization Styles for different audio representations
 */
export const VisualizationStyles = {
  WAVEFORM: 'waveform',
  CIRCULAR: 'circular',
  PARTICLE: 'particle',
  BARS: 'bars'
};

/**
 * Canvas utilities for responsive sizing and quality management
 */
export class CanvasManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pixelRatio = window.devicePixelRatio || 1;
    this.isHighPerformance = this.detectPerformanceCapability();
  }

  detectPerformanceCapability() {
    // Simple performance detection based on device characteristics
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return false;
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    
    // Basic heuristics for performance capability
    const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);
    const hasHighDPI = this.pixelRatio > 1;
    
    return !isMobile && hasHighDPI;
  }

  setupResponsiveCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const scaleFactor = this.isHighPerformance ? this.pixelRatio : Math.min(this.pixelRatio, 2);
    
    // Set actual canvas size
    this.canvas.width = rect.width * scaleFactor;
    this.canvas.height = rect.height * scaleFactor;
    
    // Scale context to match device pixel ratio
    this.ctx.scale(scaleFactor, scaleFactor);
    
    // Set CSS size to maintain layout
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    return {
      width: rect.width,
      height: rect.height,
      scaleFactor
    };
  }

  getAdaptiveQuality() {
    // Return quality settings based on performance capability
    if (this.isHighPerformance) {
      return {
        particleCount: 100,
        animationSmoothing: 0.1,
        effectIntensity: 1.0
      };
    } else {
      return {
        particleCount: 50,
        animationSmoothing: 0.2,
        effectIntensity: 0.7
      };
    }
  }
}