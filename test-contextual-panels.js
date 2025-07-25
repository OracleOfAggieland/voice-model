import { createRoot } from 'react-dom/client';
import ContextualPanels, { PANEL_TYPES, PANEL_POSITIONS } from './client/components/ContextualPanels.jsx';

// Mock conversation context data
const mockConversationContext = [
  { type: 'financial_term', value: 'Portfolio', confidence: 0.9 },
  { type: 'financial_number', value: '$125,000', confidence: 0.95 },
  { type: 'financial_term', value: 'Dividend Yield', confidence: 0.85 },
  { type: 'calculation', formula: '125000 * 0.05', result: '$6,250', confidence: 0.9 },
  { type: 'market_data', symbol: 'AAPL', value: 'Apple Inc.', confidence: 0.95 },
  { type: 'stock_symbol', symbol: 'MSFT', value: 'Microsoft', confidence: 0.9 },
];

// Mock financial data
const mockFinancialData = {
  'Total Value': '$125,000',
  'Annual Return': '8.5%',
  'Risk Level': 'Moderate',
  'Diversification': '85%',
};

// Mock session info
const mockSessionInfo = {
  duration: '5:23',
  quality: {
    audioLevel: 'Good',
    connectionStrength: 'Strong',
    latency: '45ms',
  },
  settings: {
    visualizationMode: 'Circular',
    autoScroll: true,
    contextPanels: true,
  },
};

function TestContextualPanels() {
  const handlePanelAction = (panelId, actionId, data) => {
    console.log('Panel action:', { panelId, actionId, data });
  };

  const handlePanelClose = (panelId) => {
    console.log('Panel closed:', panelId);
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: 'var(--color-base)',
      display: 'flex',
      gap: '20px',
      padding: '20px'
    }}>
      {/* Desktop Sidebar Test */}
      <div style={{ flex: '1', background: 'var(--glass-bg)', borderRadius: '12px', padding: '20px' }}>
        <h2 style={{ color: 'var(--color-text)', marginBottom: '20px' }}>Main Content Area</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          This simulates the main voice interface area. The contextual panels should appear 
          in the sidebar on the right.
        </p>
      </div>

      {/* Contextual Panels - Sidebar Position */}
      <ContextualPanels
        conversationContext={mockConversationContext}
        financialData={mockFinancialData}
        sessionInfo={mockSessionInfo}
        isVisible={true}
        position={PANEL_POSITIONS.SIDEBAR}
        maxPanels={4}
        onPanelAction={handlePanelAction}
        onPanelClose={handlePanelClose}
      />
    </div>
  );
}

function TestOverlayPanels() {
  const handlePanelAction = (panelId, actionId, data) => {
    console.log('Overlay panel action:', { panelId, actionId, data });
  };

  const handlePanelClose = (panelId) => {
    console.log('Overlay panel closed:', panelId);
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: 'var(--color-base)',
      position: 'relative',
      padding: '20px'
    }}>
      <div style={{ 
        width: '100%', 
        height: '100%', 
        background: 'var(--glass-bg)', 
        borderRadius: '12px', 
        padding: '20px',
        position: 'relative'
      }}>
        <h2 style={{ color: 'var(--color-text)', marginBottom: '20px' }}>Overlay Test</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          This tests the overlay position for contextual panels. They should appear 
          as floating panels on the right side.
        </p>

        {/* Contextual Panels - Overlay Position */}
        <ContextualPanels
          conversationContext={mockConversationContext}
          financialData={mockFinancialData}
          sessionInfo={mockSessionInfo}
          isVisible={true}
          position={PANEL_POSITIONS.OVERLAY}
          maxPanels={2}
          onPanelAction={handlePanelAction}
          onPanelClose={handlePanelClose}
        />
      </div>
    </div>
  );
}

function TestCollapsiblePanels() {
  const handlePanelAction = (panelId, actionId, data) => {
    console.log('Collapsible panel action:', { panelId, actionId, data });
  };

  const handlePanelClose = (panelId) => {
    console.log('Collapsible panel closed:', panelId);
  };

  // Test with limited context to see priority system
  const limitedContext = [
    { type: 'financial_term', value: 'ROI', confidence: 0.9 },
    { type: 'calculation', formula: '1000 * 1.05', result: '$1,050', confidence: 0.95 },
  ];

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: 'var(--color-base)',
      display: 'flex',
      gap: '20px',
      padding: '20px'
    }}>
      <div style={{ flex: '1', background: 'var(--glass-bg)', borderRadius: '12px', padding: '20px' }}>
        <h2 style={{ color: 'var(--color-text)', marginBottom: '20px' }}>Collapsible Test</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Test the collapse/expand functionality and priority system with limited panels.
          Click the chevron icons to collapse/expand panels.
        </p>
      </div>

      <ContextualPanels
        conversationContext={limitedContext}
        financialData={{ 'Current Value': '$1,050' }}
        sessionInfo={mockSessionInfo}
        isVisible={true}
        position={PANEL_POSITIONS.SIDEBAR}
        maxPanels={2}
        onPanelAction={handlePanelAction}
        onPanelClose={handlePanelClose}
      />
    </div>
  );
}

// Test different scenarios
function runTests() {
  console.log('Testing ContextualPanels component...');
  
  // Test 1: Basic sidebar functionality
  console.log('Test 1: Sidebar panels');
  const container1 = document.createElement('div');
  container1.id = 'test-sidebar';
  document.body.appendChild(container1);
  const root1 = createRoot(container1);
  root1.render(<TestContextualPanels />);
  
  // Switch to overlay test after 5 seconds
  setTimeout(() => {
    console.log('Test 2: Overlay panels');
    root1.render(<TestOverlayPanels />);
  }, 5000);
  
  // Switch to collapsible test after 10 seconds
  setTimeout(() => {
    console.log('Test 3: Collapsible panels');
    root1.render(<TestCollapsiblePanels />);
  }, 10000);
  
  // Test panel priority system
  setTimeout(() => {
    console.log('Testing panel priority system...');
    
    // Create context with many items to test priority
    const highPriorityContext = [
      { type: 'financial_term', value: 'Portfolio', confidence: 0.9 },
      { type: 'financial_number', value: '$500,000', confidence: 0.95 },
      { type: 'calculation', formula: '500000 * 0.07', result: '$35,000', confidence: 0.9 },
      { type: 'market_data', symbol: 'SPY', value: 'S&P 500 ETF', confidence: 0.95 },
      { type: 'financial_term', value: 'Asset Allocation', confidence: 0.85 },
      { type: 'calculation', formula: '35000 / 12', result: '$2,917', confidence: 0.9 },
    ];
    
    const PriorityTest = () => (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        background: 'var(--color-base)',
        display: 'flex',
        gap: '20px',
        padding: '20px'
      }}>
        <div style={{ flex: '1', background: 'var(--glass-bg)', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ color: 'var(--color-text)', marginBottom: '20px' }}>Priority System Test</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Testing panel priority system with many contextual items. 
            Only the highest priority panels should be displayed (max 3).
          </p>
        </div>

        <ContextualPanels
          conversationContext={highPriorityContext}
          financialData={{
            'Portfolio Value': '$500,000',
            'Annual Income': '$35,000',
            'Monthly Income': '$2,917',
            'Growth Rate': '7%',
          }}
          sessionInfo={mockSessionInfo}
          isVisible={true}
          position={PANEL_POSITIONS.SIDEBAR}
          maxPanels={3}
          onPanelAction={(panelId, actionId, data) => {
            console.log('Priority test action:', { panelId, actionId, data });
          }}
          onPanelClose={(panelId) => {
            console.log('Priority test panel closed:', panelId);
          }}
        />
      </div>
    );
    
    root1.render(<PriorityTest />);
  }, 15000);
}

// Run tests when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runTests);
} else {
  runTests();
}