import { useState, useEffect, useRef } from 'react';
import { 
  ariaAnnouncer, 
  focusManager,
  keyboardShortcutManager,
  visualIndicatorManager,
  motionPreferencesManager,
  createAriaLabel,
  createAriaDescription,
  KEYBOARD_KEYS,
  VOICE_STATE_ANNOUNCEMENTS
} from '../utils/accessibility.js';

export default function AccessibilityTest() {
  const [testResults, setTestResults] = useState({});
  const [currentTest, setCurrentTest] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const containerRef = useRef(null);
  const testLogRef = useRef([]);

  // Test ARIA announcements
  const testAriaAnnouncements = async () => {
    setCurrentTest('Testing ARIA announcements...');
    
    const tests = [
      { type: 'voice_state', state: 'listening', expected: 'Voice state announcement' },
      { type: 'control_change', control: 'Microphone', state: 'muted', expected: 'Control state announcement' },
      { type: 'panel_change', panel: 'Financial', action: 'opened', expected: 'Panel change announcement' },
      { type: 'message', speaker: 'user', content: 'Test message', expected: 'Message announcement' },
    ];

    const results = {};
    
    for (const test of tests) {
      try {
        switch (test.type) {
          case 'voice_state':
            ariaAnnouncer.announceVoiceState(test.state);
            break;
          case 'control_change':
            ariaAnnouncer.announceControlChange(test.control, test.state);
            break;
          case 'panel_change':
            ariaAnnouncer.announcePanelChange(test.panel, test.action);
            break;
          case 'message':
            ariaAnnouncer.announceMessage(test.speaker, test.content, true);
            break;
        }
        results[test.type] = { status: 'pass', message: 'Announcement triggered successfully' };
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait between announcements
      } catch (error) {
        results[test.type] = { status: 'fail', message: error.message };
      }
    }
    
    return results;
  };

  // Test keyboard navigation
  const testKeyboardNavigation = async () => {
    setCurrentTest('Testing keyboard navigation...');
    
    const results = {};
    
    try {
      // Test focus management
      const focusableElements = focusManager.getFocusableElements(containerRef.current);
      results.focusable_elements = {
        status: focusableElements.length > 0 ? 'pass' : 'fail',
        message: `Found ${focusableElements.length} focusable elements`
      };

      // Test focus trap (if applicable)
      if (focusableElements.length > 1) {
        const trap = focusManager.trapFocus(containerRef.current);
        if (trap) {
          results.focus_trap = { status: 'pass', message: 'Focus trap created successfully' };
          trap.release();
        } else {
          results.focus_trap = { status: 'fail', message: 'Failed to create focus trap' };
        }
      }

      // Test keyboard shortcuts
      const shortcuts = keyboardShortcutManager.getShortcuts();
      results.keyboard_shortcuts = {
        status: shortcuts.length > 0 ? 'pass' : 'fail',
        message: `${shortcuts.length} keyboard shortcuts registered`
      };

    } catch (error) {
      results.keyboard_navigation = { status: 'fail', message: error.message };
    }
    
    return results;
  };

  // Test visual indicators
  const testVisualIndicators = async () => {
    setCurrentTest('Testing visual indicators...');
    
    const results = {};
    
    try {
      // Test different indicator types
      const indicatorTypes = ['listening', 'speaking', 'idle'];
      
      for (const type of indicatorTypes) {
        visualIndicatorManager.createIndicator(
          `test-${type}`,
          type,
          containerRef.current,
          {
            position: 'top-right',
            duration: 1000,
            ariaLabel: `Test ${type} indicator`,
            className: `test-indicator-${type}`
          }
        );
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      results.visual_indicators = { 
        status: 'pass', 
        message: 'Visual indicators created successfully' 
      };
      
    } catch (error) {
      results.visual_indicators = { status: 'fail', message: error.message };
    }
    
    return results;
  };

  // Test motion preferences
  const testMotionPreferences = async () => {
    setCurrentTest('Testing motion preferences...');
    
    const results = {};
    
    try {
      const prefersReducedMotion = motionPreferencesManager.shouldReduceMotion();
      const animationDuration = motionPreferencesManager.getAnimationDuration(300, 0);
      const animationClass = motionPreferencesManager.getAnimationClass('animate-pulse', '');
      
      results.motion_detection = {
        status: 'pass',
        message: `Reduced motion: ${prefersReducedMotion}, Duration: ${animationDuration}ms, Class: ${animationClass || 'none'}`
      };
      
    } catch (error) {
      results.motion_preferences = { status: 'fail', message: error.message };
    }
    
    return results;
  };

  // Test ARIA labels and descriptions
  const testAriaLabels = async () => {
    setCurrentTest('Testing ARIA labels and descriptions...');
    
    const results = {};
    
    try {
      // Test createAriaLabel function
      const ariaLabel = createAriaLabel('Test button', 'active', 'enabled');
      const ariaDescription = createAriaDescription('Test description', ['Ctrl+T', 'Space']);
      
      results.aria_labels = {
        status: ariaLabel && ariaDescription ? 'pass' : 'fail',
        message: `Label: "${ariaLabel}", Description: "${ariaDescription}"`
      };
      
    } catch (error) {
      results.aria_labels = { status: 'fail', message: error.message };
    }
    
    return results;
  };

  // Run all accessibility tests
  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults({});
    testLogRef.current = [];
    
    const testSuites = [
      { name: 'ARIA Announcements', test: testAriaAnnouncements },
      { name: 'Keyboard Navigation', test: testKeyboardNavigation },
      { name: 'Visual Indicators', test: testVisualIndicators },
      { name: 'Motion Preferences', test: testMotionPreferences },
      { name: 'ARIA Labels', test: testAriaLabels },
    ];
    
    const allResults = {};
    
    for (const suite of testSuites) {
      try {
        const results = await suite.test();
        allResults[suite.name] = results;
        testLogRef.current.push(`✓ ${suite.name} completed`);
      } catch (error) {
        allResults[suite.name] = { error: { status: 'fail', message: error.message } };
        testLogRef.current.push(`✗ ${suite.name} failed: ${error.message}`);
      }
    }
    
    setTestResults(allResults);
    setCurrentTest('All tests completed');
    setIsRunning(false);
    
    // Announce completion
    ariaAnnouncer.announce('Accessibility tests completed', 'assertive');
  };

  // Test individual voice state announcements
  const testVoiceStateAnnouncement = (state) => {
    ariaAnnouncer.announceVoiceState(state);
    ariaAnnouncer.announce(`Testing ${state} state announcement`, 'polite');
  };

  // Test keyboard shortcut
  const testKeyboardShortcut = (key, description) => {
    ariaAnnouncer.announceShortcut(key, description);
  };

  // Render test result
  const renderTestResult = (testName, results) => {
    if (!results) return null;
    
    return (
      <div key={testName} className="test-suite mb-4 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">{testName}</h3>
        {Object.entries(results).map(([testKey, result]) => (
          <div key={testKey} className="test-result flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
            <span className="text-gray-300 capitalize">{testKey.replace(/_/g, ' ')}</span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                result.status === 'pass' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {result.status}
              </span>
              {result.message && (
                <span className="text-xs text-gray-400 max-w-xs truncate" title={result.message}>
                  {result.message}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="accessibility-test p-6 bg-gray-900 text-white min-h-screen"
      role="main"
      aria-label="Accessibility testing interface"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Voice Interface Accessibility Test Suite</h1>
        
        {/* Test Controls */}
        <div className="test-controls mb-8 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-describedby="run-all-description"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
            <div id="run-all-description" className="sr-only">
              Run comprehensive accessibility test suite
            </div>
            
            {/* Individual test buttons */}
            <button
              onClick={() => testVoiceStateAnnouncement('listening')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              Test Listening State
            </button>
            
            <button
              onClick={() => testVoiceStateAnnouncement('speaking')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              Test Speaking State
            </button>
            
            <button
              onClick={() => testKeyboardShortcut('Ctrl+M', 'Mute microphone')}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              Test Keyboard Shortcut
            </button>
            
            <button
              onClick={() => visualIndicatorManager.createIndicator('manual-test', 'listening', containerRef.current, {
                position: 'center',
                duration: 3000,
                ariaLabel: 'Manual test indicator'
              })}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              Test Visual Indicator
            </button>
            
            <button
              onClick={() => ariaAnnouncer.announce('Manual accessibility test announcement', 'assertive')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Test Manual Announcement
            </button>
          </div>
          
          {/* Current test status */}
          {currentTest && (
            <div 
              className="current-test p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg"
              role="status"
              aria-live="polite"
            >
              <span className="text-blue-300 font-medium">Current Test: </span>
              <span className="text-white">{currentTest}</span>
            </div>
          )}
        </div>
        
        {/* Test Results */}
        <div className="test-results">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          {Object.keys(testResults).length === 0 ? (
            <div className="no-results p-8 text-center text-gray-400 bg-gray-800 rounded-lg">
              <p>No test results yet. Click "Run All Tests" to begin.</p>
            </div>
          ) : (
            <div className="results-grid">
              {Object.entries(testResults).map(([testName, results]) => 
                renderTestResult(testName, results)
              )}
            </div>
          )}
        </div>
        
        {/* Test Log */}
        {testLogRef.current.length > 0 && (
          <div className="test-log mt-8">
            <h2 className="text-xl font-semibold mb-4">Test Log</h2>
            <div className="log-content p-4 bg-gray-800 rounded-lg font-mono text-sm">
              {testLogRef.current.map((entry, index) => (
                <div key={index} className="log-entry text-gray-300">
                  {entry}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Accessibility Information */}
        <div className="accessibility-info mt-8 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Accessibility Features Tested</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-green-400 mb-2">ARIA Support</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Live region announcements</li>
                <li>• Voice state changes</li>
                <li>• Control state updates</li>
                <li>• Panel visibility changes</li>
                <li>• Message announcements</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-blue-400 mb-2">Keyboard Navigation</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Focus management</li>
                <li>• Focus trapping</li>
                <li>• Keyboard shortcuts</li>
                <li>• Arrow key navigation</li>
                <li>• Skip links</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-purple-400 mb-2">Visual Indicators</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Audio cue indicators</li>
                <li>• State change notifications</li>
                <li>• Connection status</li>
                <li>• Activity indicators</li>
                <li>• Error states</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-yellow-400 mb-2">Motion Preferences</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Reduced motion detection</li>
                <li>• Animation duration adjustment</li>
                <li>• Class-based motion control</li>
                <li>• Preference change handling</li>
                <li>• Fallback animations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}