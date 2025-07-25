import { useState } from 'react';
import ContextualPanels, { PANEL_POSITIONS } from './ContextualPanels';

// Mock data for testing financial widgets
const mockConversationContext = [
  { type: 'financial_term', value: 'Portfolio', confidence: 0.9 },
  { type: 'financial_number', value: '$125,000', confidence: 0.95 },
  { type: 'financial_term', value: 'Dividend Yield', confidence: 0.85 },
  { type: 'financial_term', value: 'Asset Allocation', confidence: 0.88 },
  { type: 'calculation', formula: '125000 * 0.07', result: '$8,750', confidence: 0.9, type: 'Annual Return' },
  { type: 'calculation', formula: '8750 / 12', result: '$729.17', confidence: 0.95, type: 'Monthly Income' },
  { type: 'calculation', formula: '125000 * 0.6', result: '$75,000', confidence: 0.9, type: 'Stock Allocation' },
  { type: 'market_data', symbol: 'AAPL', value: 'Apple Inc.', confidence: 0.95, price: 175.50 },
  { type: 'stock_symbol', symbol: 'MSFT', value: 'Microsoft', confidence: 0.9, price: 380.25 },
  { type: 'market_data', symbol: 'SPY', value: 'S&P 500 ETF', confidence: 0.92, price: 450.75 },
];

const mockFinancialData = {
  'Total Value': '$125,000',
  'Day Change': '+$1,250',
  'Day Change %': '+1.02%',
  'Total Return': '+$15,000',
  'Total Return %': '+13.6%',
  'Risk Level': 'Moderate',
  'Diversification': '85%',
  'Growth Rate': '7.2%',
  holdings: [
    { symbol: 'STOCKS', value: 75000, percentage: 60 },
    { symbol: 'BONDS', value: 37500, percentage: 30 },
    { symbol: 'CASH', value: 12500, percentage: 10 },
  ],
  allocations: [
    { name: 'US Stocks', percentage: 45 },
    { name: 'International Stocks', percentage: 15 },
    { name: 'Bonds', percentage: 30 },
    { name: 'Cash', percentage: 10 },
  ],
  performanceData: [
    { date: '2024-01-01', value: 110000 },
    { date: '2024-02-01', value: 115000 },
    { date: '2024-03-01', value: 112000 },
    { date: '2024-04-01', value: 118000 },
    { date: '2024-05-01', value: 125000 },
  ],
};

const mockSessionInfo = {
  duration: '8:45',
  quality: {
    audioLevel: 'Excellent',
    connectionStrength: 'Strong',
    latency: '32ms',
  },
  settings: {
    visualizationMode: 'Circular',
    autoScroll: true,
    contextPanels: true,
  },
};

export default function ContextualPanelsTest() {
  const [position, setPosition] = useState(PANEL_POSITIONS.SIDEBAR);
  const [maxPanels, setMaxPanels] = useState(4);
  const [isVisible, setIsVisible] = useState(true);
  const [contextData, setContextData] = useState(mockConversationContext);
  const [financialData, setFinancialData] = useState(mockFinancialData);

  const handlePanelAction = (panelId, actionId, data) => {
    console.log('Panel Action:', { panelId, actionId, data });
    
    // Simulate some actions
    switch (actionId) {
      case 'view-details':
        alert(`Viewing details for ${panelId}`);
        break;
      case 'rebalance':
        alert('Opening rebalancing tool...');
        break;
      case 'analyze-performance':
        alert('Opening performance analysis...');
        break;
      case 'execute-calculation':
        alert(`Executing calculation: ${data.formula} = ${data.result}`);
        break;
      case 'view-chart':
        alert(`Opening chart for ${data}`);
        break;
      case 'add-watchlist':
        alert(`Adding ${data} to watchlist`);
        break;
      default:
        console.log('Unhandled action:', actionId);
    }
  };

  const handlePanelClose = (panelId) => {
    console.log('Panel Closed:', panelId);
  };

  const addMoreContext = () => {
    const newContext = [
      ...contextData,
      { type: 'financial_term', value: 'ROI', confidence: 0.9 },
      { type: 'calculation', formula: '15000 / 110000', result: '13.6%', confidence: 0.95, type: 'Return Rate' },
      { type: 'market_data', symbol: 'GOOGL', value: 'Alphabet Inc.', confidence: 0.88, price: 2750.00 },
    ];
    setContextData(newContext);
  };

  const updateFinancialData = () => {
    const updatedData = {
      ...financialData,
      'Total Value': '$127,500',
      'Day Change': '+$2,500',
      'Day Change %': '+2.0%',
    };
    setFinancialData(updatedData);
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
      {/* Main Content Area */}
      <div style={{ 
        flex: position === PANEL_POSITIONS.SIDEBAR ? '1' : '1',
        background: 'var(--glass-bg)', 
        borderRadius: '12px', 
        padding: '20px',
        position: 'relative'
      }}>
        <h2 style={{ color: 'var(--color-text)', marginBottom: '20px' }}>
          Enhanced Contextual Panels Test
        </h2>
        
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--color-text)', fontSize: '1.1rem', marginBottom: '10px' }}>
            Controls
          </h3>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
            <button 
              onClick={() => setPosition(PANEL_POSITIONS.SIDEBAR)}
              className={`action-btn ${position === PANEL_POSITIONS.SIDEBAR ? 'primary' : 'secondary'}`}
            >
              Sidebar
            </button>
            <button 
              onClick={() => setPosition(PANEL_POSITIONS.OVERLAY)}
              className={`action-btn ${position === PANEL_POSITIONS.OVERLAY ? 'primary' : 'secondary'}`}
            >
              Overlay
            </button>
            <button 
              onClick={() => setIsVisible(!isVisible)}
              className={`action-btn ${isVisible ? 'primary' : 'secondary'}`}
            >
              {isVisible ? 'Hide' : 'Show'} Panels
            </button>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
            <button onClick={addMoreContext} className="action-btn secondary">
              Add Context
            </button>
            <button onClick={updateFinancialData} className="action-btn secondary">
              Update Data
            </button>
            <button 
              onClick={() => setMaxPanels(maxPanels === 4 ? 2 : 4)}
              className="action-btn secondary"
            >
              Max Panels: {maxPanels}
            </button>
          </div>
        </div>

        <div style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
          <p>
            This test demonstrates the enhanced contextual panels with integrated financial widgets:
          </p>
          <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
            <li>Financial metrics dashboard with real-time styling</li>
            <li>Portfolio charts with canvas-based visualizations</li>
            <li>Interactive calculation displays</li>
            <li>Market data feeds with live indicators</li>
            <li>Asset allocation pie charts</li>
            <li>Performance charts with timeframe selection</li>
          </ul>
          
          <p style={{ marginTop: '15px' }}>
            Try the controls above to test different panel positions, add more context data,
            and see how the priority system manages panel display.
          </p>
          
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            background: 'var(--glass-bg-lighter)',
            borderRadius: '8px',
            border: '1px solid var(--glass-border)'
          }}>
            <h4 style={{ color: 'var(--color-text)', marginBottom: '10px' }}>Current Status:</h4>
            <p>Position: <strong>{position}</strong></p>
            <p>Max Panels: <strong>{maxPanels}</strong></p>
            <p>Context Items: <strong>{contextData.length}</strong></p>
            <p>Visible: <strong>{isVisible ? 'Yes' : 'No'}</strong></p>
          </div>
        </div>

        {/* Overlay panels render here */}
        {position === PANEL_POSITIONS.OVERLAY && (
          <ContextualPanels
            conversationContext={contextData}
            financialData={financialData}
            sessionInfo={mockSessionInfo}
            isVisible={isVisible}
            position={position}
            maxPanels={maxPanels}
            onPanelAction={handlePanelAction}
            onPanelClose={handlePanelClose}
          />
        )}
      </div>

      {/* Sidebar panels render here */}
      {position === PANEL_POSITIONS.SIDEBAR && (
        <div style={{ width: '320px', flexShrink: 0 }}>
          <ContextualPanels
            conversationContext={contextData}
            financialData={financialData}
            sessionInfo={mockSessionInfo}
            isVisible={isVisible}
            position={position}
            maxPanels={maxPanels}
            onPanelAction={handlePanelAction}
            onPanelClose={handlePanelClose}
          />
        </div>
      )}
    </div>
  );
}