/**
 * Visualization Renderers for different audio visualization styles
 */

export class WaveformRenderer {
  constructor(canvas, canvasManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvasManager = canvasManager;
  }

  render(audioData, options = {}) {
    const { width, height } = this.canvasManager.setupResponsiveCanvas();
    const { 
      visualState = 'idle',
      previousState = 'idle',
      transitionProgress = 1.0,
      time = 0 
    } = options;
    
    this.ctx.clearRect(0, 0, width, height);
    
    // Handle smooth transitions between states
    if (transitionProgress < 1.0) {
      this.renderTransition(width, height, previousState, visualState, transitionProgress, time, audioData);
    } else {
      this.renderState(width, height, visualState, time, audioData);
    }
  }

  renderState(width, height, state, time, audioData) {
    switch (state) {
      case 'listening':
        this.renderListeningWaveform(audioData, width, height);
        break;
      case 'speaking':
        this.renderSpeakingWaveform(width, height, time);
        break;
      case 'processing':
        this.renderProcessingWaveform(width, height, time);
        break;
      case 'idle':
      default:
        this.renderIdleWaveform(width, height, time);
        break;
    }
  }

  renderTransition(width, height, fromState, toState, progress, time, audioData) {
    const easeProgress = this.easeInOutCubic(progress);
    
    // Render previous state with decreasing opacity
    this.ctx.globalAlpha = 1.0 - easeProgress;
    this.renderState(width, height, fromState, time, audioData);
    
    // Render target state with increasing opacity
    this.ctx.globalAlpha = easeProgress;
    this.renderState(width, height, toState, time, audioData);
    
    this.ctx.globalAlpha = 1.0;
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  renderListeningWaveform(timeDomainData, width, height) {
    if (!timeDomainData) return;
    
    const centerY = height / 2;
    const sliceWidth = width / timeDomainData.length;
    
    // Enhanced waveform with glow effect
    this.ctx.shadowColor = '#4fc3f7';
    this.ctx.shadowBlur = 8;
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = '#4fc3f7';
    this.ctx.beginPath();
    
    let x = 0;
    for (let i = 0; i < timeDomainData.length; i++) {
      const v = timeDomainData[i] / 128.0;
      const y = v * height / 2;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
    
    // Add reflection effect
    this.ctx.globalAlpha = 0.3;
    this.ctx.scale(1, -1);
    this.ctx.translate(0, -height);
    this.ctx.stroke();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.globalAlpha = 1.0;
  }

  renderSpeakingWaveform(width, height, time) {
    const centerY = height / 2;
    const amplitude = 40;
    const frequency = 0.02;
    
    // Multiple layered waveforms for richer effect
    const layers = [
      { amplitude: amplitude, frequency: frequency, color: '#764ba2', width: 4, alpha: 1.0 },
      { amplitude: amplitude * 0.7, frequency: frequency * 1.5, color: '#667eea', width: 2, alpha: 0.7 },
      { amplitude: amplitude * 0.4, frequency: frequency * 2.2, color: '#a855f7', width: 1, alpha: 0.5 }
    ];
    
    layers.forEach(layer => {
      this.ctx.globalAlpha = layer.alpha;
      this.ctx.lineWidth = layer.width;
      this.ctx.strokeStyle = layer.color;
      this.ctx.shadowColor = layer.color;
      this.ctx.shadowBlur = layer.width * 2;
      this.ctx.beginPath();
      
      for (let x = 0; x < width; x++) {
        const y = centerY + 
          Math.sin((x * layer.frequency) + (time * 0.005)) * layer.amplitude * 
          Math.sin(time * 0.003 + x * 0.01) *
          (1 + Math.sin(time * 0.002) * 0.3);
        
        if (x === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      
      this.ctx.stroke();
    });
    
    this.ctx.globalAlpha = 1.0;
    this.ctx.shadowBlur = 0;
  }

  renderProcessingWaveform(width, height, time) {
    const centerY = height / 2;
    const segments = 8;
    const segmentWidth = width / segments;
    
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = '#ffc107';
    this.ctx.shadowColor = '#ffc107';
    this.ctx.shadowBlur = 6;
    
    for (let i = 0; i < segments; i++) {
      const phase = (time * 0.008) + (i * 0.5);
      const amplitude = 20 + Math.sin(phase) * 15;
      const x1 = i * segmentWidth;
      const x2 = (i + 1) * segmentWidth;
      const y1 = centerY + Math.sin(phase) * amplitude;
      const y2 = centerY + Math.sin(phase + 0.5) * amplitude;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }
    
    this.ctx.shadowBlur = 0;
  }

  renderIdleWaveform(width, height, time) {
    const centerY = height / 2;
    const amplitude = 10;
    
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = '#ffffff40';
    this.ctx.beginPath();
    
    for (let x = 0; x < width; x++) {
      const y = centerY + Math.sin((x * 0.01) + (time * 0.001)) * amplitude;
      
      if (x === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.stroke();
  }
}

export class CircularRenderer {
  constructor(canvas, canvasManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvasManager = canvasManager;
  }

  render(audioData, options = {}) {
    const { width, height } = this.canvasManager.setupResponsiveCanvas();
    const { 
      visualState = 'idle',
      previousState = 'idle',
      transitionProgress = 1.0,
      isUserSpeaking = false, 
      isAISpeaking = false, 
      isProcessing = false,
      time = 0, 
      audioLevel = 0 
    } = options;
    
    this.ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.15;
    
    // Handle smooth transitions between states
    if (transitionProgress < 1.0) {
      this.renderTransition(centerX, centerY, baseRadius, previousState, visualState, transitionProgress, time, audioData, audioLevel);
    } else {
      this.renderState(centerX, centerY, baseRadius, visualState, time, audioData, audioLevel);
    }
  }

  renderState(centerX, centerY, baseRadius, state, time, audioData, audioLevel) {
    switch (state) {
      case 'listening':
        this.renderListeningState(audioData, centerX, centerY, baseRadius, audioLevel);
        break;
      case 'speaking':
        this.renderSpeakingState(centerX, centerY, baseRadius, time);
        break;
      case 'processing':
        this.renderProcessingState(centerX, centerY, baseRadius, time);
        break;
      case 'idle':
      default:
        this.renderIdleState(centerX, centerY, baseRadius, time);
        break;
    }
  }

  renderTransition(centerX, centerY, baseRadius, fromState, toState, progress, time, audioData, audioLevel) {
    // Render both states with opacity based on transition progress
    const easeProgress = this.easeInOutCubic(progress);
    
    // Render previous state with decreasing opacity
    this.ctx.globalAlpha = 1.0 - easeProgress;
    this.renderState(centerX, centerY, baseRadius, fromState, time, audioData, audioLevel);
    
    // Render target state with increasing opacity
    this.ctx.globalAlpha = easeProgress;
    this.renderState(centerX, centerY, baseRadius, toState, time, audioData, audioLevel);
    
    this.ctx.globalAlpha = 1.0;
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  renderListeningState(frequencyData, centerX, centerY, baseRadius, audioLevel) {
    if (frequencyData) {
      // Animated frequency bars around the circle
      const bars = 64;
      const angleStep = (Math.PI * 2) / bars;
      
      for (let i = 0; i < bars; i++) {
        const angle = i * angleStep;
        const dataIndex = Math.floor((i / bars) * frequencyData.length);
        const barHeight = (frequencyData[dataIndex] / 255) * 60;
        
        const x1 = centerX + Math.cos(angle) * (baseRadius + 10);
        const y1 = centerY + Math.sin(angle) * (baseRadius + 10);
        const x2 = centerX + Math.cos(angle) * (baseRadius + 10 + barHeight);
        const y2 = centerY + Math.sin(angle) * (baseRadius + 10 + barHeight);
        
        // Dynamic color based on frequency intensity
        const hue = 200 + (barHeight * 2);
        const saturation = 70 + (audioLevel * 30);
        this.ctx.strokeStyle = `hsl(${hue}, ${saturation}%, 60%)`;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
      }
      
      // Add particle effects for high audio levels
      if (audioLevel > 0.3) {
        this.renderAudioParticles(centerX, centerY, baseRadius, audioLevel, '#4fc3f7');
      }
    }
    
    // Central orb with audio-reactive intensity
    this.renderCentralOrb(centerX, centerY, baseRadius, audioLevel, '#4fc3f7');
  }

  renderSpeakingState(centerX, centerY, baseRadius, time) {
    const pulseRadius = baseRadius + Math.sin(time * 0.003) * 20;
    
    // Animated rings with enhanced effects
    for (let i = 0; i < 4; i++) {
      const ringRadius = pulseRadius + (i * 15) + (Math.sin(time * 0.002 + i) * 5);
      const opacity = 0.7 - (i * 0.15);
      
      // Add glow effect
      this.ctx.shadowColor = 'rgba(118, 75, 162, 0.5)';
      this.ctx.shadowBlur = 10;
      this.ctx.strokeStyle = `rgba(118, 75, 162, ${opacity})`;
      this.ctx.lineWidth = 2 + (Math.sin(time * 0.004 + i) * 0.5);
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }
    
    // Add flowing particles around the rings
    this.renderFlowingParticles(centerX, centerY, pulseRadius, time, '#764ba2');
    
    // Central orb with enhanced glow
    this.renderCentralOrb(centerX, centerY, baseRadius, 0.8, '#764ba2');
  }

  renderIdleState(centerX, centerY, baseRadius, time) {
    const breatheRadius = baseRadius + Math.sin(time * 0.001) * 5;
    
    // Subtle breathing animation
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, breatheRadius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Add subtle ambient particles
    this.renderAmbientParticles(centerX, centerY, baseRadius, time);
    
    // Central dot with gentle pulse
    const pulseIntensity = 0.5 + Math.sin(time * 0.002) * 0.2;
    this.ctx.fillStyle = `rgba(255, 255, 255, ${pulseIntensity})`;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderProcessingState(centerX, centerY, baseRadius, time) {
    // Spinning loading animation
    const spinSpeed = time * 0.005;
    const segments = 8;
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2 + spinSpeed;
      const opacity = 0.3 + (Math.sin(spinSpeed * 2 + i) * 0.4);
      const radius = baseRadius + Math.sin(time * 0.003 + i) * 10;
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      this.ctx.fillStyle = `rgba(255, 193, 7, ${opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Central processing indicator
    this.renderCentralOrb(centerX, centerY, baseRadius * 0.6, 0.6, '#ffc107');
  }

  renderCentralOrb(centerX, centerY, radius, intensity, color) {
    const orbRadius = radius * (0.5 + intensity * 0.3);
    
    // Enhanced glow effect
    const gradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, orbRadius + 30
    );
    gradient.addColorStop(0, `${color}90`);
    gradient.addColorStop(0.5, `${color}60`);
    gradient.addColorStop(0.8, `${color}30`);
    gradient.addColorStop(1, `${color}00`);
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, orbRadius + 30, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Core orb with subtle inner glow
    const coreGradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, orbRadius
    );
    coreGradient.addColorStop(0, color);
    coreGradient.addColorStop(0.7, color);
    coreGradient.addColorStop(1, `${color}80`);
    
    this.ctx.fillStyle = coreGradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderAudioParticles(centerX, centerY, baseRadius, audioLevel, color) {
    const particleCount = Math.floor(audioLevel * 20);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = baseRadius + 80 + (Math.random() * 40);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const size = 1 + (audioLevel * 3);
      
      this.ctx.fillStyle = `${color}80`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  renderFlowingParticles(centerX, centerY, radius, time, color) {
    const particleCount = 12;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + (time * 0.002);
      const distance = radius + 25 + (Math.sin(time * 0.003 + i) * 10);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const size = 2 + Math.sin(time * 0.004 + i) * 1;
      const opacity = 0.6 + Math.sin(time * 0.003 + i) * 0.3;
      
      this.ctx.fillStyle = `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  renderAmbientParticles(centerX, centerY, baseRadius, time) {
    const particleCount = 6;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + (time * 0.0005);
      const distance = baseRadius + 40 + (Math.sin(time * 0.001 + i) * 20);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const size = 1 + Math.sin(time * 0.002 + i) * 0.5;
      const opacity = 0.2 + Math.sin(time * 0.001 + i) * 0.1;
      
      this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}

export class ParticleRenderer {
  constructor(canvas, canvasManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvasManager = canvasManager;
    this.particles = [];
    this.maxParticles = this.canvasManager.getAdaptiveQuality().particleCount;
  }

  render(audioData, options = {}) {
    const { width, height } = this.canvasManager.setupResponsiveCanvas();
    const { 
      visualState = 'idle',
      previousState = 'idle',
      transitionProgress = 1.0,
      isUserSpeaking = false, 
      isAISpeaking = false, 
      isProcessing = false,
      time = 0, 
      audioLevel = 0, 
      frequencyBands = {} 
    } = options;
    
    this.ctx.clearRect(0, 0, width, height);
    
    // Update particles based on current state
    this.updateParticlesByState(width, height, visualState, audioLevel, frequencyBands, time);
    
    // Render particles
    this.renderParticles();
  }

  updateParticlesByState(width, height, visualState, audioLevel, frequencyBands, time) {
    const centerX = width / 2;
    const centerY = height / 2;
    
    switch (visualState) {
      case 'listening':
        this.updateListeningParticles(centerX, centerY, audioLevel, frequencyBands);
        break;
      case 'speaking':
        this.updateSpeakingParticles(centerX, centerY, time);
        break;
      case 'processing':
        this.updateProcessingParticles(centerX, centerY, time);
        break;
      case 'idle':
      default:
        this.updateIdleParticles(centerX, centerY, time);
        break;
    }
    
    // Update existing particles
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;
      particle.vx *= particle.friction || 0.99;
      particle.vy *= particle.friction || 0.99;
      
      // Apply state-specific forces
      this.applyStateForces(particle, centerX, centerY, visualState, audioLevel);
      
      return particle.life > 0;
    });
  }

  updateListeningParticles(centerX, centerY, audioLevel, frequencyBands) {
    const particlesToAdd = Math.floor(audioLevel * 8) + 2;
    
    for (let i = 0; i < particlesToAdd && this.particles.length < this.maxParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 100;
      
      this.particles.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 1.0,
        decay: 0.008 + Math.random() * 0.012,
        size: 1 + Math.random() * 3 + (audioLevel * 2),
        color: '#4fc3f7',
        frequency: frequencyBands.bass || 0,
        friction: 0.98,
        type: 'listening'
      });
    }
  }

  updateSpeakingParticles(centerX, centerY, time) {
    const particlesToAdd = 3;
    
    for (let i = 0; i < particlesToAdd && this.particles.length < this.maxParticles; i++) {
      const angle = (time * 0.002) + (i * Math.PI * 2 / particlesToAdd);
      const distance = 80 + Math.sin(time * 0.003 + i) * 30;
      
      this.particles.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        vx: Math.cos(angle + Math.PI/2) * 2,
        vy: Math.sin(angle + Math.PI/2) * 2,
        life: 1.0,
        decay: 0.006,
        size: 2 + Math.random() * 2,
        color: '#764ba2',
        friction: 0.995,
        type: 'speaking'
      });
    }
  }

  updateProcessingParticles(centerX, centerY, time) {
    const particlesToAdd = 2;
    
    for (let i = 0; i < particlesToAdd && this.particles.length < this.maxParticles; i++) {
      const angle = time * 0.005 + (i * Math.PI);
      const distance = 60 + Math.sin(time * 0.004 + i) * 20;
      
      this.particles.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        vx: Math.cos(angle) * 1,
        vy: Math.sin(angle) * 1,
        life: 1.0,
        decay: 0.01,
        size: 2 + Math.sin(time * 0.006 + i),
        color: '#ffc107',
        friction: 0.97,
        type: 'processing'
      });
    }
  }

  updateIdleParticles(centerX, centerY, time) {
    // Minimal ambient particles
    if (Math.random() < 0.1 && this.particles.length < 10) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 50;
      
      this.particles.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: 1.0,
        decay: 0.003,
        size: 1 + Math.random(),
        color: 'rgba(255, 255, 255, 0.4)',
        friction: 0.999,
        type: 'idle'
      });
    }
  }

  applyStateForces(particle, centerX, centerY, visualState, audioLevel) {
    const dx = centerX - particle.x;
    const dy = centerY - particle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;
    
    switch (visualState) {
      case 'listening':
        // Attraction to center based on audio level
        const attraction = 0.05 * audioLevel;
        particle.vx += (dx / distance) * attraction;
        particle.vy += (dy / distance) * attraction;
        break;
        
      case 'speaking':
        // Orbital motion around center
        const orbitalForce = 0.02;
        particle.vx += (-dy / distance) * orbitalForce;
        particle.vy += (dx / distance) * orbitalForce;
        break;
        
      case 'processing':
        // Spinning motion
        const spinForce = 0.03;
        particle.vx += (-dy / distance) * spinForce;
        particle.vy += (dx / distance) * spinForce;
        break;
        
      case 'idle':
        // Very gentle drift towards center
        const gentleAttraction = 0.001;
        particle.vx += (dx / distance) * gentleAttraction;
        particle.vy += (dy / distance) * gentleAttraction;
        break;
    }
  }

  renderParticles() {
    this.particles.forEach(particle => {
      const alpha = particle.life;
      const size = particle.size * particle.life;
      
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Add glow effect for larger particles
      if (size > 3) {
        this.ctx.globalAlpha = alpha * 0.3;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, size * 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
    
    this.ctx.globalAlpha = 1.0;
  }
}

export class BarsRenderer {
  constructor(canvas, canvasManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvasManager = canvasManager;
  }

  render(audioData, options = {}) {
    const { width, height } = this.canvasManager.setupResponsiveCanvas();
    const { 
      visualState = 'idle',
      previousState = 'idle',
      transitionProgress = 1.0,
      time = 0 
    } = options;
    
    this.ctx.clearRect(0, 0, width, height);
    
    // Handle smooth transitions between states
    if (transitionProgress < 1.0) {
      this.renderTransition(width, height, previousState, visualState, transitionProgress, time, audioData);
    } else {
      this.renderState(width, height, visualState, time, audioData);
    }
  }

  renderState(width, height, state, time, audioData) {
    switch (state) {
      case 'listening':
        this.renderListeningBars(audioData, width, height);
        break;
      case 'speaking':
        this.renderSpeakingBars(width, height, time);
        break;
      case 'processing':
        this.renderProcessingBars(width, height, time);
        break;
      case 'idle':
      default:
        this.renderIdleBars(width, height, time);
        break;
    }
  }

  renderTransition(width, height, fromState, toState, progress, time, audioData) {
    const easeProgress = this.easeInOutCubic(progress);
    
    // Render previous state with decreasing opacity
    this.ctx.globalAlpha = 1.0 - easeProgress;
    this.renderState(width, height, fromState, time, audioData);
    
    // Render target state with increasing opacity
    this.ctx.globalAlpha = easeProgress;
    this.renderState(width, height, toState, time, audioData);
    
    this.ctx.globalAlpha = 1.0;
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  renderListeningBars(frequencyData, width, height) {
    if (!frequencyData) return;
    
    const barCount = 32;
    const barWidth = width / barCount;
    const maxBarHeight = height * 0.8;
    
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * frequencyData.length);
      const barHeight = (frequencyData[dataIndex] / 255) * maxBarHeight;
      
      const x = i * barWidth;
      const y = height - barHeight;
      
      // Enhanced gradient with glow effect
      const gradient = this.ctx.createLinearGradient(0, height, 0, y);
      gradient.addColorStop(0, '#4fc3f7');
      gradient.addColorStop(0.5, '#29b6f6');
      gradient.addColorStop(1, '#0288d1');
      
      this.ctx.fillStyle = gradient;
      this.ctx.shadowColor = '#4fc3f7';
      this.ctx.shadowBlur = 4;
      this.ctx.fillRect(x, y, barWidth - 2, barHeight);
      
      // Add top highlight
      if (barHeight > 10) {
        this.ctx.fillStyle = '#ffffff60';
        this.ctx.fillRect(x, y, barWidth - 2, 2);
      }
    }
    
    this.ctx.shadowBlur = 0;
  }

  renderSpeakingBars(width, height, time) {
    const barCount = 24;
    const barWidth = width / barCount;
    const maxBarHeight = height * 0.7;
    
    for (let i = 0; i < barCount; i++) {
      const phase = time * 0.003 + i * 0.5;
      const barHeight = maxBarHeight * 
        (0.2 + 0.8 * Math.abs(Math.sin(phase)) * (1 + Math.sin(time * 0.002) * 0.3));
      
      const x = i * barWidth;
      const y = height - barHeight;
      
      // Enhanced gradient with multiple stops
      const gradient = this.ctx.createLinearGradient(0, height, 0, y);
      gradient.addColorStop(0, '#764ba2');
      gradient.addColorStop(0.4, '#667eea');
      gradient.addColorStop(0.8, '#a855f7');
      gradient.addColorStop(1, '#c084fc');
      
      this.ctx.fillStyle = gradient;
      this.ctx.shadowColor = '#764ba2';
      this.ctx.shadowBlur = 6;
      this.ctx.fillRect(x, y, barWidth - 2, barHeight);
      
      // Add animated top glow
      const glowIntensity = Math.sin(phase * 2) * 0.5 + 0.5;
      this.ctx.fillStyle = `rgba(192, 132, 252, ${glowIntensity * 0.8})`;
      this.ctx.fillRect(x, y, barWidth - 2, 3);
    }
    
    this.ctx.shadowBlur = 0;
  }

  renderProcessingBars(width, height, time) {
    const barCount = 16;
    const barWidth = width / barCount;
    const maxBarHeight = height * 0.5;
    
    for (let i = 0; i < barCount; i++) {
      const phase = (time * 0.006) + (i * 0.3);
      const barHeight = maxBarHeight * 
        (0.1 + 0.9 * Math.abs(Math.sin(phase)));
      
      const x = i * barWidth;
      const y = height - barHeight;
      
      // Processing color scheme
      const gradient = this.ctx.createLinearGradient(0, height, 0, y);
      gradient.addColorStop(0, '#ffc107');
      gradient.addColorStop(0.6, '#ffb300');
      gradient.addColorStop(1, '#ff8f00');
      
      this.ctx.fillStyle = gradient;
      this.ctx.shadowColor = '#ffc107';
      this.ctx.shadowBlur = 4;
      this.ctx.fillRect(x, y, barWidth - 2, barHeight);
    }
    
    this.ctx.shadowBlur = 0;
  }

  renderIdleBars(width, height, time) {
    const barCount = 16;
    const barWidth = width / barCount;
    const maxBarHeight = height * 0.2;
    
    for (let i = 0; i < barCount; i++) {
      const barHeight = maxBarHeight * 
        (0.1 + 0.1 * Math.abs(Math.sin(time * 0.001 + i * 0.3)));
      
      const x = i * barWidth;
      const y = height - barHeight;
      
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.fillRect(x, y, barWidth - 2, barHeight);
    }
  }
}