/**
 * Test file for motion preferences and performance optimizations
 * Tests the implementation of task 8.2: motion preferences and performance optimizations
 */

// Import required utilities
import { 
    performanceMonitor, 
    memoryManager, 
    conversationMemoryManager,
    qualityManager,
    initializeMotionAwarePerformance,
    getMotionAwarePerformanceManager,
    QUALITY_LEVELS 
} from './client/utils/performance.js';

import { 
    motionPreferencesManager,
    ariaAnnouncer 
} from './client/utils/accessibility.js';

// Test configuration
const TEST_CONFIG = {
    simulateReducedMotion: true,
    simulatePoorPerformance: true,
    simulateMemoryPressure: true,
    testDuration: 10000, // 10 seconds
};

// Test state
let testResults = {
    motionPreferences: {},
    performanceOptimizations: {},
    memoryManagement: {},
    conversationCleanup: {},
    errors: []
};

// Create test interface
function createTestInterface() {
    const container = document.createElement('div');
    container.id = 'motion-performance-test';
    container.innerHTML = `
        <div class="test-container p-6 bg-gray-900 text-white min-h-screen">
            <h1 class="text-2xl font-bold mb-6">Motion Preferences & Performance Optimization Test</h1>
            
            <!-- Motion Preferences Section -->
            <div class="mb-8">
                <h2 class="text-xl font-semibold mb-4">Motion Preferences</h2>
                <div class="grid grid-cols-2 gap-4">
                    <div class="glass rounded-lg p-4">
                        <h3 class="font-medium mb-2">Current Settings</h3>
                        <div id="motion-status" class="space-y-1 text-sm">
                            <div>Reduced Motion: <span id="reduced-motion-status">Loading...</span></div>
                            <div>Animation Duration: <span id="animation-duration">Loading...</span></div>
                            <div>Max Duration: <span id="max-duration">Loading...</span></div>
                        </div>
                    </div>
                    <div class="glass rounded-lg p-4">
                        <h3 class="font-medium mb-2">Controls</h3>
                        <div class="space-y-2">
                            <button id="toggle-motion" class="btn btn-primary w-full">
                                Toggle Motion Preference
                            </button>
                            <button id="test-animations" class="btn btn-secondary w-full">
                                Test Animations
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Performance Monitoring Section -->
            <div class="mb-8">
                <h2 class="text-xl font-semibold mb-4">Performance Monitoring</h2>
                <div class="grid grid-cols-3 gap-4">
                    <div class="glass rounded-lg p-4">
                        <h3 class="font-medium mb-2">Frame Rate</h3>
                        <div id="fps-display" class="text-2xl font-mono">--</div>
                        <div id="fps-status" class="text-sm text-gray-400">Monitoring...</div>
                    </div>
                    <div class="glass rounded-lg p-4">
                        <h3 class="font-medium mb-2">Memory Usage</h3>
                        <div id="memory-display" class="text-2xl font-mono">--</div>
                        <div id="memory-status" class="text-sm text-gray-400">Monitoring...</div>
                    </div>
                    <div class="glass rounded-lg p-4">
                        <h3 class="font-medium mb-2">Quality Level</h3>
                        <div id="quality-display" class="text-2xl font-mono">--</div>
                        <div id="quality-status" class="text-sm text-gray-400">Monitoring...</div>
                    </div>
                </div>
            </div>

            <!-- Motion-Aware Optimizations Section -->
            <div class="mb-8">
                <h2 class="text-xl font-semibold mb-4">Motion-Aware Optimizations</h2>
                <div class="glass rounded-lg p-4">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-medium">Optimization History</h3>
                        <button id="clear-optimizations" class="btn btn-sm">Clear</button>
                    </div>
                    <div id="optimizations-list" class="space-y-2 max-h-40 overflow-y-auto">
                        <div class="text-gray-400 text-sm">No optimizations yet...</div>
                    </div>
                </div>
            </div>

            <!-- Conversation Memory Management Section -->
            <div class="mb-8">
                <h2 class="text-xl font-semibold mb-4">Conversation Memory Management</h2>
                <div class="grid grid-cols-2 gap-4">
                    <div class="glass rounded-lg p-4">
                        <h3 class="font-medium mb-2">Memory Statistics</h3>
                        <div id="memory-stats" class="space-y-1 text-sm">
                            <div>Messages: <span id="messages-count">0</span></div>
                            <div>Audio Buffers: <span id="audio-buffers-count">0</span></div>
                            <div>Visualization Data: <span id="viz-data-count">0</span></div>
                            <div>Health: <span id="memory-health">good</span></div>
                        </div>
                    </div>
                    <div class="glass rounded-lg p-4">
                        <h3 class="font-medium mb-2">Memory Controls</h3>
                        <div class="space-y-2">
                            <button id="simulate-messages" class="btn btn-secondary w-full">
                                Simulate 600 Messages
                            </button>
                            <button id="force-cleanup" class="btn btn-secondary w-full">
                                Force Memory Cleanup
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Test Animation Canvas -->
            <div class="mb-8">
                <h2 class="text-xl font-semibold mb-4">Animation Test Canvas</h2>
                <div class="glass rounded-lg p-4">
                    <canvas id="test-canvas" width="400" height="200" class="border border-gray-600 rounded"></canvas>
                    <div class="mt-2 flex space-x-2">
                        <button id="start-animation" class="btn btn-primary">Start Animation</button>
                        <button id="stop-animation" class="btn btn-secondary">Stop Animation</button>
                        <button id="stress-test" class="btn btn-warning">Stress Test</button>
                    </div>
                </div>
            </div>

            <!-- Test Results Section -->
            <div class="mb-8">
                <h2 class="text-xl font-semibold mb-4">Test Results</h2>
                <div class="glass rounded-lg p-4">
                    <pre id="test-results" class="text-sm bg-gray-800 p-4 rounded overflow-auto max-h-60">
                        Test results will appear here...
                    </pre>
                </div>
            </div>

            <!-- Status Messages -->
            <div id="status-messages" class="fixed bottom-4 right-4 space-y-2 z-50">
                <!-- Status messages will be inserted here -->
            </div>
        </div>
    `;

    document.body.appendChild(container);
    return container;
}

// Initialize motion-aware performance manager
function initializeManagers() {
    try {
        // Initialize motion-aware performance manager
        const motionAwareManager = initializeMotionAwarePerformance(motionPreferencesManager);
        
        // Set up listeners
        motionPreferencesManager.onChange((reducedMotion, previousState, preferences) => {
            updateMotionStatus(reducedMotion, preferences);
            testResults.motionPreferences.lastChange = {
                timestamp: Date.now(),
                reducedMotion,
                previousState,
                preferences
            };
        });

        performanceMonitor.onPerformanceChange((data) => {
            updatePerformanceDisplay(data);
            testResults.performanceOptimizations.lastUpdate = {
                timestamp: Date.now(),
                data
            };
        });

        qualityManager.onQualityChange((newQuality, oldQuality, perfData) => {
            updateQualityDisplay(newQuality, oldQuality, perfData);
            testResults.performanceOptimizations.qualityChanges = testResults.performanceOptimizations.qualityChanges || [];
            testResults.performanceOptimizations.qualityChanges.push({
                timestamp: Date.now(),
                from: oldQuality,
                to: newQuality,
                reason: perfData
            });
        });

        motionAwareManager.onOptimization((optimization) => {
            addOptimizationToHistory(optimization);
            testResults.performanceOptimizations.optimizations = testResults.performanceOptimizations.optimizations || [];
            testResults.performanceOptimizations.optimizations.push(optimization);
        });

        return motionAwareManager;
    } catch (error) {
        console.error('Error initializing managers:', error);
        testResults.errors.push({
            timestamp: Date.now(),
            error: error.message,
            stack: error.stack
        });
        return null;
    }
}

// Update motion status display
function updateMotionStatus(reducedMotion, preferences) {
    const reducedMotionEl = document.getElementById('reduced-motion-status');
    const animationDurationEl = document.getElementById('animation-duration');
    const maxDurationEl = document.getElementById('max-duration');

    if (reducedMotionEl) {
        reducedMotionEl.textContent = reducedMotion ? 'Enabled' : 'Disabled';
        reducedMotionEl.className = reducedMotion ? 'text-yellow-400' : 'text-green-400';
    }

    if (animationDurationEl) {
        animationDurationEl.textContent = `${preferences.maxAnimationDuration}ms`;
    }

    if (maxDurationEl) {
        maxDurationEl.textContent = `${preferences.maxAnimationDuration}ms`;
    }
}

// Update performance display
function updatePerformanceDisplay(data) {
    const fpsEl = document.getElementById('fps-display');
    const fpsStatusEl = document.getElementById('fps-status');
    const memoryEl = document.getElementById('memory-display');
    const memoryStatusEl = document.getElementById('memory-status');

    if (fpsEl) {
        fpsEl.textContent = data.avgFrameRate?.toFixed(1) || '--';
        fpsEl.className = `text-2xl font-mono ${data.isPerformanceGood ? 'text-green-400' : 'text-red-400'}`;
    }

    if (fpsStatusEl) {
        fpsStatusEl.textContent = data.isPerformanceGood ? 'Good' : 'Poor';
        fpsStatusEl.className = `text-sm ${data.isPerformanceGood ? 'text-green-400' : 'text-red-400'}`;
    }

    if (memoryEl) {
        memoryEl.textContent = data.avgMemoryUsage?.toFixed(1) + 'MB' || '--';
        memoryEl.className = `text-2xl font-mono ${data.isMemoryHealthy ? 'text-green-400' : 'text-red-400'}`;
    }

    if (memoryStatusEl) {
        memoryStatusEl.textContent = data.isMemoryHealthy ? 'Healthy' : 'High';
        memoryStatusEl.className = `text-sm ${data.isMemoryHealthy ? 'text-green-400' : 'text-red-400'}`;
    }
}

// Update quality display
function updateQualityDisplay(newQuality, oldQuality, perfData) {
    const qualityEl = document.getElementById('quality-display');
    const qualityStatusEl = document.getElementById('quality-status');

    if (qualityEl) {
        qualityEl.textContent = newQuality.toUpperCase();
        qualityEl.className = `text-2xl font-mono ${
            newQuality === 'high' ? 'text-green-400' :
            newQuality === 'medium' ? 'text-yellow-400' :
            'text-red-400'
        }`;
    }

    if (qualityStatusEl) {
        qualityStatusEl.textContent = oldQuality ? `Changed from ${oldQuality}` : 'Current level';
    }

    // Show status message
    showStatusMessage(`Quality adjusted to ${newQuality}`, 'info');
}

// Add optimization to history
function addOptimizationToHistory(optimization) {
    const listEl = document.getElementById('optimizations-list');
    if (!listEl) return;

    // Clear placeholder text
    if (listEl.children.length === 1 && listEl.children[0].textContent.includes('No optimizations')) {
        listEl.innerHTML = '';
    }

    const optimizationEl = document.createElement('div');
    optimizationEl.className = 'p-2 bg-gray-800 rounded text-sm';
    optimizationEl.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <div class="font-medium text-blue-400">${optimization.type.replace('_', ' ').toUpperCase()}</div>
                <div class="text-gray-300">${optimization.actions.join(', ')}</div>
            </div>
            <div class="text-xs text-gray-500">
                ${new Date(optimization.timestamp).toLocaleTimeString()}
            </div>
        </div>
    `;

    listEl.insertBefore(optimizationEl, listEl.firstChild);

    // Keep only last 10 optimizations
    while (listEl.children.length > 10) {
        listEl.removeChild(listEl.lastChild);
    }
}

// Update memory statistics
function updateMemoryStats(stats) {
    const messagesEl = document.getElementById('messages-count');
    const audioBuffersEl = document.getElementById('audio-buffers-count');
    const vizDataEl = document.getElementById('viz-data-count');
    const healthEl = document.getElementById('memory-health');

    if (messagesEl) messagesEl.textContent = stats.messages?.count || 0;
    if (audioBuffersEl) audioBuffersEl.textContent = stats.audioBuffers?.count || 0;
    if (vizDataEl) vizDataEl.textContent = stats.visualizationData?.count || 0;
    
    if (healthEl) {
        healthEl.textContent = stats.overallHealth || 'good';
        healthEl.className = stats.overallHealth === 'good' ? 'text-green-400' : 'text-red-400';
    }
}

// Show status message
function showStatusMessage(message, type = 'info') {
    const container = document.getElementById('status-messages');
    if (!container) return;

    const messageEl = document.createElement('div');
    messageEl.className = `p-3 rounded-lg shadow-lg max-w-sm ${
        type === 'error' ? 'bg-red-600' :
        type === 'warning' ? 'bg-yellow-600' :
        type === 'success' ? 'bg-green-600' :
        'bg-blue-600'
    } text-white`;
    messageEl.textContent = message;

    container.appendChild(messageEl);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
        }
    }, 3000);
}

// Animation test functions
let animationId = null;
let stressTestActive = false;

function startTestAnimation() {
    const canvas = document.getElementById('test-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const particles = [];
    const particleCount = motionPreferencesManager.shouldReduceMotion() ? 10 : 50;

    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            radius: Math.random() * 5 + 2,
            color: `hsl(${Math.random() * 360}, 70%, 60%)`
        });
    }

    function animate() {
        if (!animationId) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Bounce off walls
            if (particle.x <= 0 || particle.x >= canvas.width) particle.vx *= -1;
            if (particle.y <= 0 || particle.y >= canvas.height) particle.vy *= -1;

            // Draw particle
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.fill();
        });

        animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);
    showStatusMessage('Animation started', 'success');
}

function stopTestAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
        
        const canvas = document.getElementById('test-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        showStatusMessage('Animation stopped', 'info');
    }
}

function startStressTest() {
    if (stressTestActive) return;
    
    stressTestActive = true;
    showStatusMessage('Starting stress test...', 'warning');

    // Create multiple heavy animations
    const stressAnimations = [];
    for (let i = 0; i < 5; i++) {
        const stressId = setInterval(() => {
            // Simulate heavy computation
            const start = performance.now();
            while (performance.now() - start < 10) {
                Math.random() * Math.random();
            }
        }, 16); // ~60fps
        
        stressAnimations.push(stressId);
    }

    // Stop stress test after 5 seconds
    setTimeout(() => {
        stressAnimations.forEach(id => clearInterval(id));
        stressTestActive = false;
        showStatusMessage('Stress test completed', 'success');
    }, 5000);
}

// Set up event listeners
function setupEventListeners() {
    // Motion preference controls
    document.getElementById('toggle-motion')?.addEventListener('click', () => {
        // Simulate motion preference toggle (for testing)
        const currentReduced = motionPreferencesManager.shouldReduceMotion();
        motionPreferencesManager.updatePreference('reducedMotion', !currentReduced);
        showStatusMessage(`Motion preference ${!currentReduced ? 'enabled' : 'disabled'}`, 'info');
    });

    document.getElementById('test-animations')?.addEventListener('click', () => {
        if (animationId) {
            stopTestAnimation();
        } else {
            startTestAnimation();
        }
    });

    // Performance controls
    document.getElementById('start-animation')?.addEventListener('click', startTestAnimation);
    document.getElementById('stop-animation')?.addEventListener('click', stopTestAnimation);
    document.getElementById('stress-test')?.addEventListener('click', startStressTest);

    // Memory management controls
    document.getElementById('simulate-messages')?.addEventListener('click', () => {
        const messages = Array.from({ length: 600 }, (_, i) => ({
            id: i,
            content: `Test message ${i}`,
            timestamp: Date.now() - (600 - i) * 1000,
            speaker: i % 2 === 0 ? 'user' : 'ai'
        }));

        const stats = conversationMemoryManager.getConversationMemoryStats(messages);
        updateMemoryStats(stats);
        testResults.memoryManagement.simulatedMessages = {
            timestamp: Date.now(),
            messageCount: messages.length,
            stats
        };
        showStatusMessage(`Simulated ${messages.length} messages`, 'info');
    });

    document.getElementById('force-cleanup')?.addEventListener('click', () => {
        memoryManager.forceCleanup();
        conversationMemoryManager.scheduleCleanup();
        showStatusMessage('Memory cleanup forced', 'success');
    });

    document.getElementById('clear-optimizations')?.addEventListener('click', () => {
        const listEl = document.getElementById('optimizations-list');
        if (listEl) {
            listEl.innerHTML = '<div class="text-gray-400 text-sm">No optimizations yet...</div>';
        }
    });
}

// Update test results display
function updateTestResults() {
    const resultsEl = document.getElementById('test-results');
    if (resultsEl) {
        resultsEl.textContent = JSON.stringify(testResults, null, 2);
    }
}

// Run comprehensive tests
async function runTests() {
    console.log('Starting motion preferences and performance optimization tests...');
    
    try {
        // Test 1: Motion preferences detection
        console.log('Test 1: Motion preferences detection');
        const initialMotionState = motionPreferencesManager.shouldReduceMotion();
        testResults.motionPreferences.initialState = initialMotionState;
        
        // Test 2: Performance monitoring
        console.log('Test 2: Performance monitoring');
        const performanceData = performanceMonitor.getPerformanceData();
        testResults.performanceOptimizations.initialPerformance = performanceData;
        
        // Test 3: Quality management
        console.log('Test 3: Quality management');
        const currentQuality = qualityManager.getCurrentQuality();
        testResults.performanceOptimizations.initialQuality = currentQuality;
        
        // Test 4: Memory management
        console.log('Test 4: Memory management');
        const memoryStats = memoryManager.getMemoryStats();
        testResults.memoryManagement.initialStats = memoryStats;
        
        // Test 5: Conversation memory management
        console.log('Test 5: Conversation memory management');
        const testMessages = Array.from({ length: 100 }, (_, i) => ({ id: i, content: `Test ${i}` }));
        const conversationStats = conversationMemoryManager.getConversationMemoryStats(testMessages);
        testResults.conversationCleanup.testStats = conversationStats;
        
        console.log('All tests completed successfully');
        updateTestResults();
        showStatusMessage('All tests completed', 'success');
        
    } catch (error) {
        console.error('Test error:', error);
        testResults.errors.push({
            timestamp: Date.now(),
            error: error.message,
            stack: error.stack
        });
        updateTestResults();
        showStatusMessage('Test error: ' + error.message, 'error');
    }
}

// Initialize the test
function initializeTest() {
    console.log('Initializing motion preferences and performance optimization test...');
    
    // Create test interface
    const container = createTestInterface();
    
    // Initialize managers
    const motionAwareManager = initializeManagers();
    
    if (!motionAwareManager) {
        showStatusMessage('Failed to initialize managers', 'error');
        return;
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Update initial displays
    const initialMotionState = motionPreferencesManager.shouldReduceMotion();
    const initialPreferences = motionPreferencesManager.getPreferences();
    updateMotionStatus(initialMotionState, initialPreferences);
    
    // Start monitoring
    performanceMonitor.startMonitoring();
    
    // Run initial tests
    setTimeout(runTests, 1000);
    
    // Set up periodic updates
    setInterval(() => {
        const performanceData = performanceMonitor.getPerformanceData();
        updatePerformanceDisplay(performanceData);
        updateTestResults();
    }, 1000);
    
    console.log('Test initialized successfully');
    showStatusMessage('Test initialized', 'success');
}

// Start the test when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTest);
} else {
    initializeTest();
}

// Export for manual testing
window.motionPerformanceTest = {
    initializeTest,
    runTests,
    testResults,
    showStatusMessage,
    startTestAnimation,
    stopTestAnimation,
    startStressTest
};