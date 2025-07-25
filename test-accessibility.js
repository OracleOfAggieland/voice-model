/**
 * Test file for accessibility features in voice interface components
 * Run with: node test-accessibility.js
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a simple test server
const server = createServer((req, res) => {
  if (req.url === '/') {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voice Interface Accessibility Test</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #1a1a1a;
            color: white;
        }
        .test-container {
            max-width: 800px;
            margin: 0 auto;
        }
        .test-section {
            background: #2a2a2a;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            border: 1px solid #444;
        }
        .test-button {
            background: #4f46e5;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin: 5px;
            font-size: 14px;
        }
        .test-button:hover {
            background: #4338ca;
        }
        .test-button:focus {
            outline: 2px solid #8b5cf6;
            outline-offset: 2px;
        }
        .test-result {
            background: #1e293b;
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
            border-left: 4px solid #10b981;
        }
        .test-result.error {
            border-left-color: #ef4444;
        }
        .sr-only {
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0, 0, 0, 0) !important;
            white-space: nowrap !important;
            border: 0 !important;
        }
        .visual-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(59, 130, 246, 0.9);
            color: white;
            padding: 10px 15px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .keyboard-hint {
            background: #374151;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            color: #d1d5db;
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="test-container">
        <h1>Voice Interface Accessibility Test Suite</h1>
        <p>This page tests the accessibility features of the voice interface components.</p>
        
        <!-- Screen reader announcements -->
        <div id="aria-live-polite" aria-live="polite" aria-atomic="true" class="sr-only"></div>
        <div id="aria-live-assertive" aria-live="assertive" aria-atomic="true" class="sr-only"></div>
        
        <!-- ARIA Announcements Test -->
        <div class="test-section">
            <h2>ARIA Announcements Test</h2>
            <p>Test screen reader announcements for voice state changes.</p>
            <button class="test-button" onclick="testVoiceStateAnnouncement('listening')">
                Test Listening State
            </button>
            <button class="test-button" onclick="testVoiceStateAnnouncement('speaking')">
                Test Speaking State
            </button>
            <button class="test-button" onclick="testVoiceStateAnnouncement('idle')">
                Test Idle State
            </button>
            <button class="test-button" onclick="testControlAnnouncement('Microphone', 'muted')">
                Test Control Change
            </button>
            <div class="keyboard-hint">
                Screen reader users will hear announcements when buttons are pressed.
            </div>
        </div>
        
        <!-- Keyboard Navigation Test -->
        <div class="test-section">
            <h2>Keyboard Navigation Test</h2>
            <p>Test keyboard navigation and focus management.</p>
            <button class="test-button" onclick="testFocusManagement()" tabindex="0">
                Button 1 (Test Focus)
            </button>
            <button class="test-button" onclick="testKeyboardShortcuts()" tabindex="0">
                Button 2 (Test Shortcuts)
            </button>
            <button class="test-button" onclick="testFocusTrap()" tabindex="0">
                Button 3 (Test Focus Trap)
            </button>
            <input type="text" placeholder="Test input field" class="test-button" style="background: #374151;">
            <div class="keyboard-hint">
                Use Tab to navigate, Enter/Space to activate buttons. Try Ctrl+H for help.
            </div>
        </div>
        
        <!-- Visual Indicators Test -->
        <div class="test-section">
            <h2>Visual Indicators Test</h2>
            <p>Test visual indicators for audio cues and state changes.</p>
            <button class="test-button" onclick="showVisualIndicator('listening', 'Listening for input')">
                Show Listening Indicator
            </button>
            <button class="test-button" onclick="showVisualIndicator('speaking', 'AI is speaking')">
                Show Speaking Indicator
            </button>
            <button class="test-button" onclick="showVisualIndicator('error', 'Connection error')">
                Show Error Indicator
            </button>
            <div class="keyboard-hint">
                Visual indicators appear in the top-right corner for users who cannot hear audio cues.
            </div>
        </div>
        
        <!-- Motion Preferences Test -->
        <div class="test-section">
            <h2>Motion Preferences Test</h2>
            <p>Test respect for reduced motion preferences.</p>
            <button class="test-button" onclick="testMotionPreferences()">
                Check Motion Preferences
            </button>
            <button class="test-button" onclick="testAnimationWithMotion()">
                Test Animation (Respects Preferences)
            </button>
            <div class="keyboard-hint">
                Animations will be reduced or disabled if you have "prefers-reduced-motion" enabled in your system.
            </div>
        </div>
        
        <!-- Test Results -->
        <div class="test-section">
            <h2>Test Results</h2>
            <div id="test-results">
                <p>Run tests above to see results here.</p>
            </div>
        </div>
    </div>

    <script>
        // Mock accessibility utilities for testing
        const ARIA_LIVE_TYPES = {
            POLITE: 'polite',
            ASSERTIVE: 'assertive'
        };

        const VOICE_STATE_ANNOUNCEMENTS = {
            idle: 'Voice interface ready. Press space to start session.',
            listening: 'Listening for your voice input.',
            speaking: 'AI is responding.',
            error: 'Voice interface error occurred.'
        };

        // ARIA Announcer mock
        class AriaAnnouncer {
            announce(message, priority = ARIA_LIVE_TYPES.POLITE) {
                const region = document.getElementById(\`aria-live-\${priority}\`);
                if (region) {
                    region.textContent = '';
                    setTimeout(() => {
                        region.textContent = message;
                    }, 100);
                }
                this.logResult('ARIA Announcement', \`"\${message}" announced with priority: \${priority}\`);
            }

            announceVoiceState(state) {
                const message = VOICE_STATE_ANNOUNCEMENTS[state] || \`Voice state: \${state}\`;
                this.announce(message, state === 'error' ? ARIA_LIVE_TYPES.ASSERTIVE : ARIA_LIVE_TYPES.POLITE);
            }

            announceControlChange(controlName, newState) {
                const message = \`\${controlName} \${newState}\`;
                this.announce(message, ARIA_LIVE_TYPES.POLITE);
            }

            logResult(testName, message, isError = false) {
                const resultsDiv = document.getElementById('test-results');
                const resultDiv = document.createElement('div');
                resultDiv.className = \`test-result \${isError ? 'error' : ''}\`;
                resultDiv.innerHTML = \`
                    <strong>\${testName}:</strong> \${message}
                    <small style="display: block; margin-top: 5px; opacity: 0.7;">
                        \${new Date().toLocaleTimeString()}
                    </small>
                \`;
                resultsDiv.appendChild(resultDiv);
                resultsDiv.scrollTop = resultsDiv.scrollHeight;
            }
        }

        // Visual Indicator Manager mock
        class VisualIndicatorManager {
            createIndicator(id, type, message) {
                // Remove existing indicator
                const existing = document.getElementById(\`indicator-\${id}\`);
                if (existing) existing.remove();

                // Create new indicator
                const indicator = document.createElement('div');
                indicator.id = \`indicator-\${id}\`;
                indicator.className = 'visual-indicator';
                indicator.textContent = message;
                indicator.setAttribute('role', 'status');
                indicator.setAttribute('aria-label', message);

                // Style based on type
                if (type === 'listening') {
                    indicator.style.background = 'rgba(59, 130, 246, 0.9)';
                } else if (type === 'speaking') {
                    indicator.style.background = 'rgba(139, 92, 246, 0.9)';
                } else if (type === 'error') {
                    indicator.style.background = 'rgba(239, 68, 68, 0.9)';
                }

                document.body.appendChild(indicator);

                // Auto-remove after 3 seconds
                setTimeout(() => {
                    if (indicator.parentNode) {
                        indicator.style.opacity = '0';
                        setTimeout(() => indicator.remove(), 300);
                    }
                }, 3000);

                ariaAnnouncer.logResult('Visual Indicator', \`\${type} indicator shown: "\${message}"\`);
            }
        }

        // Initialize mocks
        const ariaAnnouncer = new AriaAnnouncer();
        const visualIndicatorManager = new VisualIndicatorManager();

        // Test functions
        function testVoiceStateAnnouncement(state) {
            ariaAnnouncer.announceVoiceState(state);
        }

        function testControlAnnouncement(control, state) {
            ariaAnnouncer.announceControlChange(control, state);
        }

        function testFocusManagement() {
            const buttons = document.querySelectorAll('.test-button');
            let currentIndex = Array.from(buttons).indexOf(document.activeElement);
            if (currentIndex === -1) currentIndex = 0;
            
            const nextIndex = (currentIndex + 1) % buttons.length;
            buttons[nextIndex].focus();
            
            ariaAnnouncer.logResult('Focus Management', \`Moved focus to button \${nextIndex + 1}\`);
        }

        function testKeyboardShortcuts() {
            ariaAnnouncer.logResult('Keyboard Shortcuts', 'Available shortcuts: Ctrl+H (help), Tab (navigate), Enter/Space (activate)');
        }

        function testFocusTrap() {
            const focusableElements = document.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])');
            ariaAnnouncer.logResult('Focus Trap', \`Found \${focusableElements.length} focusable elements\`);
        }

        function showVisualIndicator(type, message) {
            visualIndicatorManager.createIndicator('test', type, message);
        }

        function testMotionPreferences() {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            ariaAnnouncer.logResult('Motion Preferences', \`Prefers reduced motion: \${prefersReducedMotion}\`);
        }

        function testAnimationWithMotion() {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const duration = prefersReducedMotion ? '0.01s' : '0.3s';
            
            const testElement = document.createElement('div');
            testElement.style.cssText = \`
                position: fixed;
                top: 50%;
                left: 50%;
                width: 100px;
                height: 100px;
                background: #4f46e5;
                border-radius: 50%;
                transform: translate(-50%, -50%) scale(0);
                transition: transform \${duration} ease-out;
                z-index: 1001;
            \`;
            
            document.body.appendChild(testElement);
            
            setTimeout(() => {
                testElement.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 10);
            
            setTimeout(() => {
                testElement.style.transform = 'translate(-50%, -50%) scale(0)';
                setTimeout(() => testElement.remove(), prefersReducedMotion ? 20 : 300);
            }, prefersReducedMotion ? 50 : 1000);
            
            ariaAnnouncer.logResult('Animation Test', \`Animation duration: \${duration} (reduced motion: \${prefersReducedMotion})\`);
        }

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'h':
                        e.preventDefault();
                        ariaAnnouncer.announce('Available shortcuts: Ctrl+H for help, Tab to navigate, Enter or Space to activate buttons', 'assertive');
                        break;
                    case 'm':
                        e.preventDefault();
                        testControlAnnouncement('Microphone', 'muted');
                        break;
                    case 'l':
                        e.preventDefault();
                        testVoiceStateAnnouncement('listening');
                        break;
                    case 's':
                        e.preventDefault();
                        testVoiceStateAnnouncement('speaking');
                        break;
                }
            }
        });

        // Initialize page
        document.addEventListener('DOMContentLoaded', () => {
            ariaAnnouncer.logResult('Page Load', 'Accessibility test suite loaded. Use Ctrl+H for keyboard shortcuts help.');
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

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🧪 Accessibility test server running at http://localhost:${PORT}`);
  console.log('');
  console.log('Test Features:');
  console.log('• ARIA announcements for voice state changes');
  console.log('• Keyboard navigation and focus management');
  console.log('• Visual indicators for audio cues');
  console.log('• Motion preference detection and respect');
  console.log('• Screen reader compatibility');
  console.log('');
  console.log('Keyboard Shortcuts:');
  console.log('• Ctrl+H: Show help');
  console.log('• Ctrl+M: Test microphone mute announcement');
  console.log('• Ctrl+L: Test listening state announcement');
  console.log('• Ctrl+S: Test speaking state announcement');
  console.log('• Tab: Navigate between elements');
  console.log('• Enter/Space: Activate buttons');
  console.log('');
  console.log('Open the URL in your browser and test with a screen reader for full accessibility testing.');
});