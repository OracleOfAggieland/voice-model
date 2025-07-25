/**
 * Performance optimization test for voice interface components
 * Tests motion preferences, memory management, and automatic quality adjustment
 * Run with: node test-performance-optimization.js
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a test server for performance testing
const server = createServer((req, res) => {
  if (req.url === '/') {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voice Interface Performance Optimization Test</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #0f0f0f;
            color: white;
            overflow-x: hidden;
        }
        
        /* CSS Custom Properties for Motion */
        :root {
            --motion-duration-fast: 150ms;
            --motion-duration-normal: 300ms;
            --motion-duration-slow: 500ms;
            --motion-easing: cubic-bezier(0.4, 0, 0.2, 1);
            --motion-scale: 1.05;
            --motion-blur: 4px;
        }
        
        .motion-reduced {
            --motion-duration-fast: 50ms;
            --motion-duration-normal: 100ms;
            --motion-duration-slow: 150ms;
            --motion-easing: linear;
            --motion-scale: 1;
            --motion-blur: 0px;
        }
        
        @media (prefers-reduced-motion: reduce) {
            :root {
                --motion-duration-fast: 50ms;
                --motion-duration-normal: 100ms;
                --motion-duration-slow: 150ms;
                --motion-easing: linear;
                --motion-scale: 1;
                --motion-blur: 0px;
            }
        }
        
        .test-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .test-section {
            background: #1a1a1a;
            padding: 24px;
            margin: 20px 0;
            border-radius: 12px;
            border: 1px solid #333;
        }
        
        .test-button {
            background: #4f46e5;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            margin: 8px;
            font-size: 14px;
            font-weight: 500;
            transition: all var(--motion-duration-normal) var(--motion-easing);
        }
        
        .test-button:hover {
            background: #4338ca;
            transform: scale(var(--motion-scale));
        }
        
        .test-button:focus {
            outline: 2px solid #8b5cf6;
            outline-offset: 2px;
        }
        
        .test-button.danger {
            background: #dc2626;
        }
        
        .test-button.danger:hover {
            background: #b91c1c;
        }
        
        .performance-monitor {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin: 20px 0;
        }
        
        .metric-card {
            background: #2a2a2a;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #444;
        }
        
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #10b981;
        }
        
        .metric-value.warning {
            color: #f59e0b;
        }
        
        .metric-value.critical {
            color: #ef4444;
        }
        
        .metric-label {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 4px;
        }
        
        .animation-test-area {
            height: 200px;
            background: #2a2a2a;
            border-radius: 8px;
            position: relative;
            overflow: hidden;
            margin: 16px 0;
        }
        
        .animation-element {
            position: absolute;
            width: 40px;
            height: 40px;
            background: #8b5cf6;
            border-radius: 50%;
            transition: all var(--motion-duration-normal) var(--motion-easing);
        }
        
        .memory-test-area {
            background: #2a2a2a;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .log-entry {
            font-family: monospace;
            font-size: 12px;
            color: #d1d5db;
            margin: 2px 0;
            padding: 4px 8px;
            background: #1f2937;
            border-radius: 4px;
        }
        
        .log-entry.error {
            color: #fca5a5;
            background: #7f1d1d;
        }
        
        .log-entry.warning {
            color: #fcd34d;
            background: #78350f;
        }
        
        .log-entry.success {
            color: #86efac;
            background: #14532d;
        }
        
        .quality-indicator {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
        }
        
        .quality-high {
            background: #10b981;
            color: white;
        }
        
        .quality-medium {
            background: #f59e0b;
            color: white;
        }
        
        .quality-low {
            background: #ef4444;
            color: white;
        }
        
        .quality-minimal {
            background: #6b7280;
            color: white;
        }
        
        .canvas-container {
            background: #2a2a2a;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
            text-align: center;
        }
        
        .test-canvas {
            border: 1px solid #444;
            border-radius: 4px;
            background: #1a1a1a;
        }
    </style>
</head>
<body>
    <div class="test-container">
        <h1>Voice Interface Performance Optimization Test</h1>
        <p>This page tests performance optimizations including motion preferences, memory management, and automatic quality adjustment.</p>
        
        <!-- Performance Monitor -->
        <div class="test-section">
            <h2>Real-time Performance Monitor</h2>
            <div class="performance-monitor">
                <div class="metric-card">
                    <div class="metric-value" id="fps-value">60</div>
                    <div class="metric-label">FPS</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" id="memory-value">0</div>
                    <div class="metric-label">Memory (MB)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" id="frame-time-value">16</div>
                    <div class="metric-label">Frame Time (ms)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" id="quality-value">HIGH</div>
                    <div class="metric-label">Quality Level</div>
                </div>
            </div>
            <button class="test-button" onclick="togglePerformanceMonitoring()">
                <span id="monitor-toggle-text">Stop Monitoring</span>
            </button>
        </div>
        
        <!-- Motion Preferences Test -->
        <div class="test-section">
            <h2>Motion Preferences Test</h2>
            <p>Current motion preference: <span id="motion-preference">Normal</span></p>
            <div class="animation-test-area" id="animation-area">
                <!-- Animation elements will be added here -->
            </div>
            <button class="test-button" onclick="testMotionPreferences()">Check Motion Preferences</button>
            <button class="test-button" onclick="toggleMotionReduction()">Toggle Motion Reduction</button>
            <button class="test-button" onclick="startAnimationTest()">Start Animation Test</button>
            <button class="test-button" onclick="stopAnimationTest()">Stop Animation Test</button>
        </div>
        
        <!-- Memory Management Test -->
        <div class="test-section">
            <h2>Memory Management Test</h2>
            <p>Simulate long conversation sessions and memory cleanup.</p>
            <div class="memory-test-area" id="memory-log">
                <div class="log-entry">Memory management test ready...</div>
            </div>
            <button class="test-button" onclick="simulateLongConversation()">Simulate Long Conversation</button>
            <button class="test-button" onclick="createMemoryPressure()">Create Memory Pressure</button>
            <button class="test-button" onclick="triggerMemoryCleanup()">Trigger Cleanup</button>
            <button class="test-button danger" onclick="clearMemoryLog()">Clear Log</button>
        </div>
        
        <!-- Canvas Performance Test -->
        <div class="test-section">
            <h2>Canvas Performance Test</h2>
            <p>Test canvas rendering performance with quality adjustment.</p>
            <div class="canvas-container">
                <canvas id="test-canvas" class="test-canvas" width="600" height="300"></canvas>
            </div>
            <button class="test-button" onclick="startCanvasTest()">Start Canvas Test</button>
            <button class="test-button" onclick="stopCanvasTest()">Stop Canvas Test</button>
            <button class="test-button" onclick="adjustCanvasQuality('high')">High Quality</button>
            <button class="test-button" onclick="adjustCanvasQuality('medium')">Medium Quality</button>
            <button class="test-button" onclick="adjustCanvasQuality('low')">Low Quality</button>
        </div>
        
        <!-- Quality Adjustment Test -->
        <div class="test-section">
            <h2>Automatic Quality Adjustment Test</h2>
            <p>Current Quality: <span class="quality-indicator quality-high" id="current-quality">HIGH</span></p>
            <p>Test automatic quality adjustment based on performance metrics.</p>
            <button class="test-button" onclick="simulatePerformanceDrop()">Simulate Performance Drop</button>
            <button class="test-button" onclick="simulateMemoryPressure()">Simulate Memory Pressure</button>
            <button class="test-button" onclick="resetPerformance()">Reset Performance</button>
        </div>
    </div>

    <script>
        // Performance monitoring variables
        let performanceMonitor = null;
        let isMonitoring = true;
        let animationElements = [];
        let animationFrameId = null;
        let canvasAnimationId = null;
        let memoryTestData = [];
        let currentQuality = 'high';
        let motionReduced = false;
        
        // Mock performance monitor
        class PerformanceMonitor {
            constructor() {
                this.metrics = {
                    frameRate: 60,
                    memoryUsage: 0,
                    frameTime: 16,
                    frameCount: 0
                };
                this.callbacks = new Set();
                this.lastFrameTime = performance.now();
                this.isRunning = false;
            }
            
            start() {
                if (this.isRunning) return;
                this.isRunning = true;
                this.monitor();
            }
            
            stop() {
                this.isRunning = false;
                if (this.frameId) {
                    cancelAnimationFrame(this.frameId);
                }
            }
            
            monitor = (currentTime = performance.now()) => {
                if (!this.isRunning) return;
                
                const deltaTime = currentTime - this.lastFrameTime;
                this.metrics.frameTime = deltaTime;
                this.metrics.frameRate = deltaTime > 0 ? 1000 / deltaTime : 60;
                this.metrics.frameCount++;
                
                // Mock memory usage
                if (performance.memory) {
                    this.metrics.memoryUsage = performance.memory.usedJSHeapSize / (1024 * 1024);
                } else {
                    this.metrics.memoryUsage = Math.random() * 50 + 20; // Mock value
                }
                
                this.updateUI();
                this.lastFrameTime = currentTime;
                
                this.frameId = requestAnimationFrame(this.monitor);
            };
            
            updateUI() {
                document.getElementById('fps-value').textContent = Math.round(this.metrics.frameRate);
                document.getElementById('memory-value').textContent = Math.round(this.metrics.memoryUsage);
                document.getElementById('frame-time-value').textContent = Math.round(this.metrics.frameTime);
                
                // Update quality indicator colors
                const fpsElement = document.getElementById('fps-value');
                const memoryElement = document.getElementById('memory-value');
                
                fpsElement.className = 'metric-value';
                if (this.metrics.frameRate < 30) fpsElement.classList.add('critical');
                else if (this.metrics.frameRate < 45) fpsElement.classList.add('warning');
                
                memoryElement.className = 'metric-value';
                if (this.metrics.memoryUsage > 100) memoryElement.classList.add('critical');
                else if (this.metrics.memoryUsage > 50) memoryElement.classList.add('warning');
            }
            
            getMetrics() {
                return { ...this.metrics };
            }
        }
        
        // Initialize performance monitor
        performanceMonitor = new PerformanceMonitor();
        performanceMonitor.start();
        
        // Motion preferences detection
        function detectMotionPreferences() {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            motionReduced = prefersReducedMotion;
            
            document.getElementById('motion-preference').textContent = 
                prefersReducedMotion ? 'Reduced Motion' : 'Normal Motion';
            
            // Apply motion class to body
            document.body.classList.toggle('motion-reduced', prefersReducedMotion);
            
            return prefersReducedMotion;
        }
        
        // Test functions
        function togglePerformanceMonitoring() {
            if (isMonitoring) {
                performanceMonitor.stop();
                document.getElementById('monitor-toggle-text').textContent = 'Start Monitoring';
            } else {
                performanceMonitor.start();
                document.getElementById('monitor-toggle-text').textContent = 'Stop Monitoring';
            }
            isMonitoring = !isMonitoring;
        }
        
        function testMotionPreferences() {
            const prefersReducedMotion = detectMotionPreferences();
            logMessage(\`Motion preferences detected: \${prefersReducedMotion ? 'Reduced' : 'Normal'}\`, 'success');
        }
        
        function toggleMotionReduction() {
            motionReduced = !motionReduced;
            document.body.classList.toggle('motion-reduced', motionReduced);
            document.getElementById('motion-preference').textContent = 
                motionReduced ? 'Reduced Motion (Manual)' : 'Normal Motion (Manual)';
            logMessage(\`Motion reduction manually \${motionReduced ? 'enabled' : 'disabled'}\`, 'success');
        }
        
        function startAnimationTest() {
            const area = document.getElementById('animation-area');
            area.innerHTML = ''; // Clear existing elements
            animationElements = [];
            
            // Create animated elements
            for (let i = 0; i < 20; i++) {
                const element = document.createElement('div');
                element.className = 'animation-element';
                element.style.left = Math.random() * 560 + 'px';
                element.style.top = Math.random() * 160 + 'px';
                area.appendChild(element);
                animationElements.push(element);
            }
            
            // Start animation loop
            animateElements();
            logMessage('Animation test started with 20 elements', 'success');
        }
        
        function stopAnimationTest() {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            document.getElementById('animation-area').innerHTML = '';
            animationElements = [];
            logMessage('Animation test stopped', 'success');
        }
        
        function animateElements() {
            if (animationElements.length === 0) return;
            
            animationElements.forEach((element, index) => {
                const time = Date.now() * 0.001;
                const x = Math.sin(time + index) * 100 + 280;
                const y = Math.cos(time + index * 0.5) * 50 + 80;
                
                element.style.left = x + 'px';
                element.style.top = y + 'px';
            });
            
            animationFrameId = requestAnimationFrame(animateElements);
        }
        
        function simulateLongConversation() {
            logMessage('Simulating long conversation session...', 'success');
            
            // Simulate adding many messages
            for (let i = 0; i < 1000; i++) {
                memoryTestData.push({
                    id: i,
                    content: \`Message \${i}: \${Math.random().toString(36).substr(2, 50)}\`,
                    timestamp: Date.now() + i,
                    speaker: i % 2 === 0 ? 'user' : 'ai'
                });
            }
            
            logMessage(\`Added 1000 messages to memory. Total: \${memoryTestData.length}\`, 'warning');
            
            // Simulate memory cleanup after limit
            if (memoryTestData.length > 500) {
                const removed = memoryTestData.splice(0, memoryTestData.length - 500);
                logMessage(\`Cleaned up \${removed.length} old messages\`, 'success');
            }
        }
        
        function createMemoryPressure() {
            logMessage('Creating memory pressure...', 'warning');
            
            // Create large arrays to simulate memory pressure
            const largeArrays = [];
            for (let i = 0; i < 100; i++) {
                largeArrays.push(new Array(10000).fill(Math.random()));
            }
            
            // Keep reference to prevent immediate GC
            window.memoryPressureTest = largeArrays;
            
            logMessage('Memory pressure created (100 large arrays)', 'warning');
            
            // Simulate automatic cleanup after delay
            setTimeout(() => {
                delete window.memoryPressureTest;
                logMessage('Memory pressure cleaned up automatically', 'success');
            }, 5000);
        }
        
        function triggerMemoryCleanup() {
            logMessage('Triggering manual memory cleanup...', 'success');
            
            // Clear test data
            memoryTestData = [];
            
            // Clear any memory pressure test
            if (window.memoryPressureTest) {
                delete window.memoryPressureTest;
            }
            
            // Suggest garbage collection if available
            if (window.gc && typeof window.gc === 'function') {
                window.gc();
                logMessage('Garbage collection triggered', 'success');
            } else {
                logMessage('Garbage collection not available in this browser', 'warning');
            }
            
            logMessage('Memory cleanup completed', 'success');
        }
        
        function startCanvasTest() {
            const canvas = document.getElementById('test-canvas');
            const ctx = canvas.getContext('2d');
            
            let particles = [];
            for (let i = 0; i < getParticleCount(); i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    size: Math.random() * 3 + 1
                });
            }
            
            function animate() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Update and draw particles
                particles.forEach(particle => {
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    
                    if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                    if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
                    
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fillStyle = \`hsl(\${Date.now() * 0.01 % 360}, 70%, 60%)\`;
                    ctx.fill();
                });
                
                canvasAnimationId = requestAnimationFrame(animate);
            }
            
            animate();
            logMessage(\`Canvas test started with \${particles.length} particles\`, 'success');
        }
        
        function stopCanvasTest() {
            if (canvasAnimationId) {
                cancelAnimationFrame(canvasAnimationId);
                canvasAnimationId = null;
            }
            
            const canvas = document.getElementById('test-canvas');
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            logMessage('Canvas test stopped', 'success');
        }
        
        function getParticleCount() {
            switch (currentQuality) {
                case 'high': return 100;
                case 'medium': return 50;
                case 'low': return 25;
                default: return 10;
            }
        }
        
        function adjustCanvasQuality(quality) {
            currentQuality = quality;
            updateQualityIndicator(quality);
            logMessage(\`Canvas quality adjusted to \${quality.toUpperCase()}\`, 'success');
            
            // Restart canvas test with new quality if running
            if (canvasAnimationId) {
                stopCanvasTest();
                startCanvasTest();
            }
        }
        
        function updateQualityIndicator(quality) {
            const indicator = document.getElementById('current-quality');
            indicator.textContent = quality.toUpperCase();
            indicator.className = \`quality-indicator quality-\${quality}\`;
            
            document.getElementById('quality-value').textContent = quality.toUpperCase();
        }
        
        function simulatePerformanceDrop() {
            logMessage('Simulating performance drop...', 'warning');
            
            // Create performance-heavy task
            const heavyTask = () => {
                const start = performance.now();
                while (performance.now() - start < 50) {
                    // Busy wait to simulate heavy computation
                    Math.random();
                }
            };
            
            // Run heavy task multiple times
            const interval = setInterval(heavyTask, 16);
            
            // Auto-adjust quality after performance drop
            setTimeout(() => {
                if (currentQuality === 'high') {
                    adjustCanvasQuality('medium');
                    logMessage('Quality automatically reduced due to performance drop', 'warning');
                }
            }, 2000);
            
            // Stop heavy task after 5 seconds
            setTimeout(() => {
                clearInterval(interval);
                logMessage('Performance drop simulation ended', 'success');
            }, 5000);
        }
        
        function simulateMemoryPressure() {
            logMessage('Simulating memory pressure for quality adjustment...', 'warning');
            createMemoryPressure();
            
            // Auto-adjust quality due to memory pressure
            setTimeout(() => {
                if (currentQuality !== 'low') {
                    adjustCanvasQuality('low');
                    logMessage('Quality automatically reduced due to memory pressure', 'warning');
                }
            }, 1000);
        }
        
        function resetPerformance() {
            adjustCanvasQuality('high');
            triggerMemoryCleanup();
            logMessage('Performance reset to optimal settings', 'success');
        }
        
        function logMessage(message, type = 'info') {
            const log = document.getElementById('memory-log');
            const entry = document.createElement('div');
            entry.className = \`log-entry \${type}\`;
            entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
        }
        
        function clearMemoryLog() {
            document.getElementById('memory-log').innerHTML = 
                '<div class="log-entry">Memory management test ready...</div>';
        }
        
        // Initialize on page load
        document.addEventListener('DOMContentLoaded', () => {
            detectMotionPreferences();
            logMessage('Performance optimization test suite loaded', 'success');
            
            // Listen for motion preference changes
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            mediaQuery.addEventListener('change', (e) => {
                motionReduced = e.matches;
                document.body.classList.toggle('motion-reduced', e.matches);
                document.getElementById('motion-preference').textContent = 
                    e.matches ? 'Reduced Motion' : 'Normal Motion';
                logMessage(\`Motion preference changed: \${e.matches ? 'Reduced' : 'Normal'}\`, 'success');
            });
        });
    </script>
</body>
</html>
    `;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`🚀 Performance optimization test server running at http://localhost:${PORT}`);
  console.log('');
  console.log('Performance Features Tested:');
  console.log('• Real-time performance monitoring (FPS, memory, frame time)');
  console.log('• Motion preferences detection and respect');
  console.log('• Memory management for long conversation sessions');
  console.log('• Canvas rendering performance optimization');
  console.log('• Automatic quality adjustment based on performance');
  console.log('• Memory pressure simulation and cleanup');
  console.log('');
  console.log('Test Instructions:');
  console.log('1. Open the URL in your browser');
  console.log('2. Monitor real-time performance metrics');
  console.log('3. Test motion preferences (try enabling "Reduce motion" in your OS)');
  console.log('4. Simulate long conversations and memory pressure');
  console.log('5. Test canvas performance with different quality levels');
  console.log('6. Observe automatic quality adjustments');
  console.log('');
  console.log('For best results, open browser dev tools to monitor actual memory usage.');
});