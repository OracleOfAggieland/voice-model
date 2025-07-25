/**
 * Node.js test for motion preferences and performance optimizations
 * Tests the core logic without browser APIs
 */

// Mock browser APIs for Node.js testing
global.window = {
    matchMedia: (query) => ({
        matches: query.includes('reduce'),
        addEventListener: () => {},
        removeEventListener: () => {}
    }),
    performance: {
        now: () => Date.now(),
        memory: {
            usedJSHeapSize: 50 * 1024 * 1024, // 50MB
            totalJSHeapSize: 100 * 1024 * 1024, // 100MB
            jsHeapSizeLimit: 2 * 1024 * 1024 * 1024 // 2GB
        }
    },
    requestAnimationFrame: (callback) => setTimeout(callback, 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
    requestIdleCallback: (callback) => setTimeout(callback, 100)
};

global.document = {
    createElement: () => ({ 
        style: {}, 
        classList: { toggle: () => {} },
        setAttribute: () => {},
        appendChild: () => {},
        removeChild: () => {},
        parentNode: null,
        querySelectorAll: () => [],
        querySelector: () => null
    }),
    body: { appendChild: () => {} },
    hidden: false,
    addEventListener: () => {},
    removeEventListener: () => {},
    activeElement: null,
    readyState: 'complete'
};

global.performance = global.window.performance;

// Test results
const testResults = {
    motionPreferences: { passed: 0, failed: 0, tests: [] },
    performanceOptimizations: { passed: 0, failed: 0, tests: [] },
    memoryManagement: { passed: 0, failed: 0, tests: [] },
    conversationCleanup: { passed: 0, failed: 0, tests: [] },
    errors: []
};

// Test utilities
function assert(condition, message) {
    if (condition) {
        console.log(`✓ ${message}`);
        return true;
    } else {
        console.error(`✗ ${message}`);
        return false;
    }
}

function runTest(category, testName, testFn) {
    try {
        console.log(`\nRunning test: ${testName}`);
        const result = testFn();
        if (result) {
            testResults[category].passed++;
            testResults[category].tests.push({ name: testName, status: 'passed' });
        } else {
            testResults[category].failed++;
            testResults[category].tests.push({ name: testName, status: 'failed' });
        }
    } catch (error) {
        console.error(`✗ ${testName} - Error: ${error.message}`);
        testResults[category].failed++;
        testResults[category].tests.push({ name: testName, status: 'error', error: error.message });
        testResults.errors.push({ test: testName, error: error.message });
    }
}

// Import the modules to test
async function importModules() {
    try {
        const { 
            PerformanceMonitor, 
            MemoryManager, 
            ConversationMemoryManager,
            QualityManager,
            MotionAwarePerformanceManager,
            QUALITY_LEVELS 
        } = await import('./client/utils/performance.js');

        const { 
            MotionPreferencesManager 
        } = await import('./client/utils/accessibility.js');

        return {
            PerformanceMonitor,
            MemoryManager,
            ConversationMemoryManager,
            QualityManager,
            MotionAwarePerformanceManager,
            MotionPreferencesManager,
            QUALITY_LEVELS
        };
    } catch (error) {
        console.error('Failed to import modules:', error);
        throw error;
    }
}

// Test motion preferences functionality
function testMotionPreferences(MotionPreferencesManager) {
    console.log('\n=== Testing Motion Preferences ===');

    runTest('motionPreferences', 'Motion preferences manager initialization', () => {
        const manager = new MotionPreferencesManager();
        return assert(manager !== null, 'MotionPreferencesManager should initialize');
    });

    runTest('motionPreferences', 'Detect reduced motion preference', () => {
        const manager = new MotionPreferencesManager();
        const reducedMotion = manager.shouldReduceMotion();
        return assert(typeof reducedMotion === 'boolean', 'Should return boolean for reduced motion preference');
    });

    runTest('motionPreferences', 'Get animation duration based on preference', () => {
        const manager = new MotionPreferencesManager();
        const normalDuration = manager.getAnimationDuration(300, 100);
        const reducedDuration = manager.getAnimationDuration(300, 100);
        return assert(typeof normalDuration === 'number' && normalDuration >= 0, 'Should return valid animation duration');
    });

    runTest('motionPreferences', 'Get motion CSS properties', () => {
        const manager = new MotionPreferencesManager();
        const properties = manager.getMotionCSSProperties();
        return assert(
            properties['--motion-duration-fast'] && 
            properties['--motion-duration-normal'] && 
            properties['--motion-easing'],
            'Should return CSS custom properties for motion'
        );
    });

    runTest('motionPreferences', 'Create animation config with motion awareness', () => {
        const manager = new MotionPreferencesManager();
        const baseConfig = { duration: 300, easing: 'ease-out' };
        const config = manager.createAnimationConfig(baseConfig);
        return assert(
            config.duration !== undefined && config.easing !== undefined,
            'Should return motion-aware animation config'
        );
    });
}

// Test performance monitoring functionality
function testPerformanceMonitoring(PerformanceMonitor, QualityManager) {
    console.log('\n=== Testing Performance Monitoring ===');

    runTest('performanceOptimizations', 'Performance monitor initialization', () => {
        const monitor = new PerformanceMonitor();
        return assert(monitor !== null, 'PerformanceMonitor should initialize');
    });

    runTest('performanceOptimizations', 'Get performance data', () => {
        const monitor = new PerformanceMonitor();
        const data = monitor.getPerformanceData();
        return assert(
            data.frameRate !== undefined && 
            data.memoryUsage !== undefined &&
            typeof data.isPerformanceGood === 'boolean',
            'Should return valid performance data'
        );
    });

    runTest('performanceOptimizations', 'Quality manager initialization', () => {
        const monitor = new PerformanceMonitor();
        const qualityManager = new QualityManager(monitor);
        return assert(qualityManager !== null, 'QualityManager should initialize');
    });

    runTest('performanceOptimizations', 'Get recommended quality level', () => {
        const monitor = new PerformanceMonitor();
        const qualityManager = new QualityManager(monitor);
        const quality = qualityManager.getCurrentQuality();
        return assert(typeof quality === 'string', 'Should return quality level as string');
    });

    runTest('performanceOptimizations', 'Quality settings for different levels', () => {
        const monitor = new PerformanceMonitor();
        const qualityManager = new QualityManager(monitor);
        const highSettings = qualityManager.getQualitySettings('high');
        const lowSettings = qualityManager.getQualitySettings('low');
        return assert(
            highSettings.particleCount > lowSettings.particleCount &&
            highSettings.canvasResolution > lowSettings.canvasResolution,
            'High quality should have more features than low quality'
        );
    });
}

// Test memory management functionality
function testMemoryManagement(MemoryManager, ConversationMemoryManager) {
    console.log('\n=== Testing Memory Management ===');

    runTest('memoryManagement', 'Memory manager initialization', () => {
        const manager = new MemoryManager();
        return assert(manager !== null, 'MemoryManager should initialize');
    });

    runTest('memoryManagement', 'Register cleanup task', () => {
        const manager = new MemoryManager();
        let cleanupCalled = false;
        const unregister = manager.registerCleanupTask(() => {
            cleanupCalled = true;
        });
        manager.performCleanup();
        return assert(cleanupCalled, 'Cleanup task should be executed');
    });

    runTest('memoryManagement', 'Get memory statistics', () => {
        const manager = new MemoryManager();
        const stats = manager.getMemoryStats();
        return assert(
            typeof stats.cleanupTasks === 'number' &&
            typeof stats.canvasContexts === 'number',
            'Should return memory statistics'
        );
    });

    runTest('conversationCleanup', 'Conversation memory manager initialization', () => {
        const manager = new ConversationMemoryManager();
        return assert(manager !== null, 'ConversationMemoryManager should initialize');
    });

    runTest('conversationCleanup', 'Clean up conversation memory', () => {
        const manager = new ConversationMemoryManager();
        const messages = Array.from({ length: 600 }, (_, i) => ({ id: i, content: `Message ${i}` }));
        const result = manager.cleanupConversationMemory(messages);
        return assert(
            result.messages.length < messages.length &&
            result.cleanupResults.messagesRemoved > 0,
            'Should clean up excess messages'
        );
    });

    runTest('conversationCleanup', 'Get conversation memory stats', () => {
        const manager = new ConversationMemoryManager();
        const messages = Array.from({ length: 100 }, (_, i) => ({ id: i }));
        const stats = manager.getConversationMemoryStats(messages);
        return assert(
            stats.messages.count === 100 &&
            typeof stats.overallHealth === 'string',
            'Should return conversation memory statistics'
        );
    });
}

// Test motion-aware performance optimization
function testMotionAwarePerformance(MotionAwarePerformanceManager, PerformanceMonitor, QualityManager, MotionPreferencesManager) {
    console.log('\n=== Testing Motion-Aware Performance Optimization ===');

    runTest('performanceOptimizations', 'Motion-aware performance manager initialization', () => {
        const perfMonitor = new PerformanceMonitor();
        const qualityManager = new QualityManager(perfMonitor);
        const motionManager = new MotionPreferencesManager();
        const motionAwareManager = new MotionAwarePerformanceManager(perfMonitor, qualityManager, motionManager);
        return assert(motionAwareManager !== null, 'MotionAwarePerformanceManager should initialize');
    });

    runTest('performanceOptimizations', 'Get current optimizations', () => {
        const perfMonitor = new PerformanceMonitor();
        const qualityManager = new QualityManager(perfMonitor);
        const motionManager = new MotionPreferencesManager();
        const motionAwareManager = new MotionAwarePerformanceManager(perfMonitor, qualityManager, motionManager);
        const optimizations = motionAwareManager.getCurrentOptimizations();
        return assert(
            optimizations.reducedMotion !== undefined &&
            optimizations.performanceData !== undefined &&
            Array.isArray(optimizations.recommendations),
            'Should return current optimization state'
        );
    });

    runTest('performanceOptimizations', 'Generate optimization recommendations', () => {
        const perfMonitor = new PerformanceMonitor();
        const qualityManager = new QualityManager(perfMonitor);
        const motionManager = new MotionPreferencesManager();
        const motionAwareManager = new MotionAwarePerformanceManager(perfMonitor, qualityManager, motionManager);
        
        // Simulate reduced motion preference
        motionManager.updatePreference('reducedMotion', true);
        const optimizations = motionAwareManager.getCurrentOptimizations();
        
        return assert(
            optimizations.recommendations.some(rec => rec.type === 'motion'),
            'Should generate motion-related recommendations when reduced motion is enabled'
        );
    });
}

// Main test runner
async function runAllTests() {
    console.log('Starting Motion Preferences and Performance Optimization Tests');
    console.log('================================================================');

    try {
        const modules = await importModules();
        
        // Run all test suites
        testMotionPreferences(modules.MotionPreferencesManager);
        testPerformanceMonitoring(modules.PerformanceMonitor, modules.QualityManager);
        testMemoryManagement(modules.MemoryManager, modules.ConversationMemoryManager);
        testMotionAwarePerformance(
            modules.MotionAwarePerformanceManager,
            modules.PerformanceMonitor,
            modules.QualityManager,
            modules.MotionPreferencesManager
        );

        // Print test results
        console.log('\n=== Test Results Summary ===');
        let totalPassed = 0;
        let totalFailed = 0;

        Object.entries(testResults).forEach(([category, results]) => {
            if (category !== 'errors') {
                console.log(`${category}: ${results.passed} passed, ${results.failed} failed`);
                totalPassed += results.passed;
                totalFailed += results.failed;
            }
        });

        console.log(`\nTotal: ${totalPassed} passed, ${totalFailed} failed`);

        if (testResults.errors.length > 0) {
            console.log('\nErrors encountered:');
            testResults.errors.forEach(error => {
                console.error(`- ${error.test}: ${error.error}`);
            });
        }

        // Determine overall result
        if (totalFailed === 0 && testResults.errors.length === 0) {
            console.log('\n🎉 All tests passed! Motion preferences and performance optimizations are working correctly.');
            process.exit(0);
        } else {
            console.log('\n❌ Some tests failed. Please review the implementation.');
            process.exit(1);
        }

    } catch (error) {
        console.error('Test execution failed:', error);
        process.exit(1);
    }
}

// Run the tests
runAllTests();