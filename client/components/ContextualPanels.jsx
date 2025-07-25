import { useState, useEffect, useCallback, useMemo } from 'react';
import { useResponsiveLayout } from './ResponsiveLayout';
import FinancialWidgets, { WIDGET_TYPES } from './FinancialWidgets';

// Panel types and priorities
const PANEL_TYPES = {
  FINANCIAL_WIDGET: 'financial_widget',
  QUICK_ACTIONS: 'quick_actions',
  REFERENCE_DATA: 'reference_data',
  SESSION_INFO: 'session_info',
  CALCULATIONS: 'calculations',
  MARKET_DATA: 'market_data',
};

const PANEL_PRIORITIES = {
  [PANEL_TYPES.FINANCIAL_WIDGET]: 1,
  [PANEL_TYPES.QUICK_ACTIONS]: 2,
  [PANEL_TYPES.CALCULATIONS]: 3,
  [PANEL_TYPES.MARKET_DATA]: 4,
  [PANEL_TYPES.REFERENCE_DATA]: 5,
  [PANEL_TYPES.SESSION_INFO]: 6,
};

const PANEL_POSITIONS = {
  SIDEBAR: 'sidebar',
  OVERLAY: 'overlay',
  MODAL: 'modal',
};

export default function ContextualPanels({
  conversationContext = [],
  financialData = {},
  sessionInfo = {},
  isVisible = true,
  position = PANEL_POSITIONS.SIDEBAR,
  maxPanels = 3,
  onPanelAction,
  onPanelClose,
  className = '',
}) {
  const { screenSize, isMobile, isTablet, isDesktop } = useResponsiveLayout();
  
  // Panel state management
  const [activePanels, setActivePanels] = useState([]);
  const [collapsedPanels, setCollapsedPanels] = useState(new Set());
  const [animatingPanels, setAnimatingPanels] = useState(new Set());
  const [panelData, setPanelData] = useState({});

  // Generate contextual panels based on conversation content
  const generateContextualPanels = useCallback((context) => {
    const panels = [];
    
    // Analyze conversation for financial terms and topics
    const financialTerms = context.filter(item => 
      item.type === 'financial_term' || item.type === 'financial_number'
    );
    
    const calculations = context.filter(item => 
      item.type === 'calculation' || item.type === 'formula'
    );
    
    const marketReferences = context.filter(item => 
      item.type === 'market_data' || item.type === 'stock_symbol'
    );

    // Financial widget panel
    if (financialTerms.length > 0 || Object.keys(financialData).length > 0) {
      panels.push({
        id: 'financial-widget',
        type: PANEL_TYPES.FINANCIAL_WIDGET,
        title: 'Financial Overview',
        priority: PANEL_PRIORITIES[PANEL_TYPES.FINANCIAL_WIDGET],
        data: {
          terms: financialTerms,
          metrics: financialData,
        },
        relevanceScore: financialTerms.length * 0.3 + Object.keys(financialData).length * 0.7,
      });
    }

    // Quick actions panel
    if (context.length > 0) {
      const actions = generateQuickActions(context);
      if (actions.length > 0) {
        panels.push({
          id: 'quick-actions',
          type: PANEL_TYPES.QUICK_ACTIONS,
          title: 'Quick Actions',
          priority: PANEL_PRIORITIES[PANEL_TYPES.QUICK_ACTIONS],
          data: { actions },
          relevanceScore: actions.length * 0.5,
        });
      }
    }

    // Calculations panel
    if (calculations.length > 0) {
      panels.push({
        id: 'calculations',
        type: PANEL_TYPES.CALCULATIONS,
        title: 'Calculations',
        priority: PANEL_PRIORITIES[PANEL_TYPES.CALCULATIONS],
        data: { calculations },
        relevanceScore: calculations.length * 0.8,
      });
    }

    // Market data panel
    if (marketReferences.length > 0) {
      panels.push({
        id: 'market-data',
        type: PANEL_TYPES.MARKET_DATA,
        title: 'Market Data',
        priority: PANEL_PRIORITIES[PANEL_TYPES.MARKET_DATA],
        data: { references: marketReferences },
        relevanceScore: marketReferences.length * 0.6,
      });
    }

    // Session info panel (always available but low priority)
    if (sessionInfo && Object.keys(sessionInfo).length > 0) {
      panels.push({
        id: 'session-info',
        type: PANEL_TYPES.SESSION_INFO,
        title: 'Session Info',
        priority: PANEL_PRIORITIES[PANEL_TYPES.SESSION_INFO],
        data: sessionInfo,
        relevanceScore: 0.2,
      });
    }

    return panels;
  }, [financialData, sessionInfo]);

  // Generate quick actions based on context
  const generateQuickActions = useCallback((context) => {
    const actions = [];
    
    // Financial-related actions
    const hasFinancialContent = context.some(item => 
      item.type === 'financial_term' || item.type === 'financial_number'
    );
    
    if (hasFinancialContent) {
      actions.push(
        { id: 'show-portfolio', label: 'Show Portfolio', icon: 'chart', category: 'financial' },
        { id: 'calculate', label: 'Calculate', icon: 'calculator', category: 'financial' },
        { id: 'save-note', label: 'Save Note', icon: 'bookmark', category: 'general' }
      );
    }

    // Market data actions
    const hasMarketData = context.some(item => 
      item.type === 'market_data' || item.type === 'stock_symbol'
    );
    
    if (hasMarketData) {
      actions.push(
        { id: 'view-chart', label: 'View Chart', icon: 'trending-up', category: 'market' },
        { id: 'add-watchlist', label: 'Add to Watchlist', icon: 'eye', category: 'market' }
      );
    }

    // General actions
    actions.push(
      { id: 'share-conversation', label: 'Share', icon: 'share', category: 'general' },
      { id: 'export-data', label: 'Export', icon: 'download', category: 'general' }
    );

    return actions;
  }, []);

  // Priority-based panel selection for limited screen space
  const selectPanelsForDisplay = useMemo(() => {
    const availablePanels = generateContextualPanels(conversationContext);
    
    // Sort by priority and relevance score
    const sortedPanels = availablePanels.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Lower priority number = higher priority
      }
      return b.relevanceScore - a.relevanceScore; // Higher relevance = higher priority
    });

    // Determine max panels based on screen size
    let displayLimit = maxPanels;
    if (isMobile) {
      displayLimit = 1;
    } else if (isTablet) {
      displayLimit = Math.min(2, maxPanels);
    }

    return sortedPanels.slice(0, displayLimit);
  }, [conversationContext, maxPanels, isMobile, isTablet, generateContextualPanels]);

  // Update active panels when context changes
  useEffect(() => {
    const newPanels = selectPanelsForDisplay;
    const currentPanelIds = activePanels.map(p => p.id);
    const newPanelIds = newPanels.map(p => p.id);

    // Animate out panels that are no longer relevant
    const panelsToRemove = activePanels.filter(panel => 
      !newPanelIds.includes(panel.id)
    );

    // Animate in new panels
    const panelsToAdd = newPanels.filter(panel => 
      !currentPanelIds.includes(panel.id)
    );

    if (panelsToRemove.length > 0 || panelsToAdd.length > 0) {
      // Start exit animations for removed panels
      if (panelsToRemove.length > 0) {
        setAnimatingPanels(prev => new Set([...prev, ...panelsToRemove.map(p => p.id)]));
        
        setTimeout(() => {
          setActivePanels(newPanels);
          setAnimatingPanels(prev => {
            const updated = new Set(prev);
            panelsToRemove.forEach(p => updated.delete(p.id));
            return updated;
          });
        }, 300); // Match CSS transition duration
      } else {
        setActivePanels(newPanels);
      }

      // Update panel data
      const newPanelData = {};
      newPanels.forEach(panel => {
        newPanelData[panel.id] = panel.data;
      });
      setPanelData(newPanelData);
    }
  }, [selectPanelsForDisplay, activePanels]);

  // Panel collapse/expand handlers
  const togglePanelCollapse = useCallback((panelId) => {
    setCollapsedPanels(prev => {
      const updated = new Set(prev);
      if (updated.has(panelId)) {
        updated.delete(panelId);
      } else {
        updated.add(panelId);
      }
      return updated;
    });
  }, []);

  const handlePanelAction = useCallback((panelId, actionId, data) => {
    onPanelAction?.(panelId, actionId, data);
  }, [onPanelAction]);

  const handlePanelClose = useCallback((panelId) => {
    setAnimatingPanels(prev => new Set([...prev, panelId]));
    
    setTimeout(() => {
      setActivePanels(prev => prev.filter(p => p.id !== panelId));
      setCollapsedPanels(prev => {
        const updated = new Set(prev);
        updated.delete(panelId);
        return updated;
      });
      setAnimatingPanels(prev => {
        const updated = new Set(prev);
        updated.delete(panelId);
        return updated;
      });
      onPanelClose?.(panelId);
    }, 300);
  }, [onPanelClose]);

  // Get container classes based on position and screen size
  const getContainerClasses = () => {
    const baseClasses = 'contextual-panels-container';
    const positionClasses = `panels-${position}`;
    const screenClasses = `panels-${screenSize}`;
    const visibilityClasses = isVisible ? 'panels-visible' : 'panels-hidden';
    
    return `${baseClasses} ${positionClasses} ${screenClasses} ${visibilityClasses} ${className}`;
  };

  // Get panel animation classes
  const getPanelClasses = (panel) => {
    const baseClasses = 'contextual-panel glass';
    const typeClasses = `panel-${panel.type}`;
    const collapsedClasses = collapsedPanels.has(panel.id) ? 'panel-collapsed' : 'panel-expanded';
    const animatingClasses = animatingPanels.has(panel.id) ? 'panel-animating' : '';
    
    return `${baseClasses} ${typeClasses} ${collapsedClasses} ${animatingClasses}`;
  };

  if (!isVisible || activePanels.length === 0) {
    return null;
  }

  return (
    <div className={getContainerClasses()}>
      {activePanels.map((panel, index) => (
        <div
          key={panel.id}
          className={getPanelClasses(panel)}
          style={{
            animationDelay: `${index * 0.1}s`,
            zIndex: 10 - panel.priority, // Higher priority panels on top
          }}
        >
          {/* Panel Header */}
          <div className="panel-header">
            <div className="panel-title-section">
              <h3 className="panel-title">{panel.title}</h3>
              <div className="panel-relevance">
                <div 
                  className="relevance-indicator"
                  style={{ width: `${Math.min(panel.relevanceScore * 100, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="panel-controls">
              <button
                onClick={() => togglePanelCollapse(panel.id)}
                className="panel-control-btn"
                title={collapsedPanels.has(panel.id) ? 'Expand' : 'Collapse'}
              >
                <svg 
                  className={`w-4 h-4 transition-transform ${collapsedPanels.has(panel.id) ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <button
                onClick={() => handlePanelClose(panel.id)}
                className="panel-control-btn panel-close-btn"
                title="Close panel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="panel-content">
            <PanelContent
              panel={panel}
              data={panelData[panel.id]}
              isCollapsed={collapsedPanels.has(panel.id)}
              onAction={(actionId, data) => handlePanelAction(panel.id, actionId, data)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Individual panel content renderer
function PanelContent({ panel, data, isCollapsed, onAction }) {
  if (isCollapsed) {
    return null;
  }

  switch (panel.type) {
    case PANEL_TYPES.FINANCIAL_WIDGET:
      return <FinancialWidgetContent data={data} onAction={onAction} />;
    
    case PANEL_TYPES.QUICK_ACTIONS:
      return <QuickActionsContent data={data} onAction={onAction} />;
    
    case PANEL_TYPES.CALCULATIONS:
      return <CalculationsContent data={data} onAction={onAction} />;
    
    case PANEL_TYPES.MARKET_DATA:
      return <MarketDataContent data={data} onAction={onAction} />;
    
    case PANEL_TYPES.REFERENCE_DATA:
      return <ReferenceDataContent data={data} onAction={onAction} />;
    
    case PANEL_TYPES.SESSION_INFO:
      return <SessionInfoContent data={data} onAction={onAction} />;
    
    default:
      return (
        <div className="panel-placeholder">
          <p className="text-gray-400">Panel content coming soon</p>
        </div>
      );
  }
}

// Financial widget content component
function FinancialWidgetContent({ data, onAction }) {
  const { terms = [], metrics = {} } = data || {};

  // Determine the best widget type based on available data
  const getWidgetType = () => {
    if (Object.keys(metrics).length >= 5) {
      return WIDGET_TYPES.METRICS_DASHBOARD;
    } else if (metrics.holdings && Array.isArray(metrics.holdings)) {
      return WIDGET_TYPES.PORTFOLIO_CHART;
    } else if (metrics.allocations && Array.isArray(metrics.allocations)) {
      return WIDGET_TYPES.ALLOCATION_PIE;
    } else {
      return WIDGET_TYPES.METRICS_DASHBOARD;
    }
  };

  // Transform data for financial widgets
  const transformedData = {
    // Metrics dashboard data
    totalValue: parseFloat(metrics['Total Value']?.replace(/[$,]/g, '') || metrics['Portfolio Value']?.replace(/[$,]/g, '') || '0'),
    dayChange: parseFloat(metrics['Day Change']?.replace(/[$,]/g, '') || '0'),
    dayChangePercent: parseFloat(metrics['Day Change %']?.replace(/%/g, '') || '0'),
    totalReturn: parseFloat(metrics['Total Return']?.replace(/[$,]/g, '') || '0'),
    totalReturnPercent: parseFloat(metrics['Total Return %']?.replace(/%/g, '') || metrics['Growth Rate']?.replace(/%/g, '') || '0'),
    riskLevel: metrics['Risk Level'] || 'Moderate',
    diversificationScore: parseFloat(metrics['Diversification']?.replace(/%/g, '') || '75'),
    
    // Portfolio chart data
    holdings: metrics.holdings || [
      { symbol: 'STOCKS', value: 60000, percentage: 60 },
      { symbol: 'BONDS', value: 30000, percentage: 30 },
      { symbol: 'CASH', value: 10000, percentage: 10 },
    ],
    
    // Allocation pie data
    allocations: metrics.allocations || [
      { name: 'Stocks', percentage: 60 },
      { name: 'Bonds', percentage: 30 },
      { name: 'Cash', percentage: 10 },
    ],
    
    // Performance data
    performanceData: metrics.performanceData || [
      { date: '2024-01-01', value: 100000 },
      { date: '2024-02-01', value: 105000 },
      { date: '2024-03-01', value: 103000 },
      { date: '2024-04-01', value: 108000 },
      { date: '2024-05-01', value: 112000 },
    ],
  };

  return (
    <div className="financial-widget-content">
      <FinancialWidgets
        data={transformedData}
        widgetType={getWidgetType()}
        isRealTime={false}
        onAction={onAction}
      />
      
      {/* Additional context from terms */}
      {terms.length > 0 && (
        <div className="financial-terms-context">
          <h5 className="context-title">Related Terms</h5>
          <div className="terms-tags">
            {terms.slice(0, 6).map((term, index) => (
              <span key={index} className="term-tag">
                {term.value}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Quick actions content component
function QuickActionsContent({ data, onAction }) {
  const { actions = [] } = data || {};

  const getActionIcon = (iconName) => {
    const icons = {
      chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      calculator: "M9 7h6m0 10v-3m-3 3h.01m-4.01 0h.01m2-7h.01m0 4h.01m4-4h.01m2-7H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2z",
      bookmark: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z",
      'trending-up': "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
      eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
      share: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z",
      download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
    };
    return icons[iconName] || icons.bookmark;
  };

  return (
    <div className="quick-actions-content">
      <div className="actions-grid">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.id, action)}
            className={`action-item ${action.category}`}
            title={action.label}
          >
            <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getActionIcon(action.icon)} />
            </svg>
            <span className="action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Calculations content component
function CalculationsContent({ data, onAction }) {
  const { calculations = [] } = data || {};

  // Transform calculations for the financial widget
  const calculationWidgetData = {
    calculations: calculations.map(calc => ({
      ...calc,
      type: calc.type || 'Financial Calculation',
      confidence: calc.confidence || 0.9,
      explanation: calc.explanation || `Calculation: ${calc.formula || calc.expression}`,
    })),
    activeCalculation: calculations[0],
  };

  return (
    <div className="calculations-content">
      {calculations.length > 0 ? (
        <FinancialWidgets
          data={calculationWidgetData}
          widgetType={WIDGET_TYPES.CALCULATION_DISPLAY}
          onAction={onAction}
        />
      ) : (
        <div className="empty-state">
          <p className="text-gray-400">No calculations available</p>
          <button 
            onClick={() => onAction('create-calculation')} 
            className="action-btn primary"
          >
            Create Calculation
          </button>
        </div>
      )}
    </div>
  );
}

// Market data content component
function MarketDataContent({ data, onAction }) {
  const { references = [] } = data || {};

  // Transform market references for the financial widget
  const marketWidgetData = {
    symbols: references.map(ref => ref.symbol || ref.value).filter(Boolean),
    marketData: references.reduce((acc, ref) => {
      const symbol = ref.symbol || ref.value;
      if (symbol) {
        acc[symbol] = {
          name: ref.name || symbol,
          price: ref.price || 150 + Math.random() * 100, // Mock price
          change: (Math.random() - 0.5) * 10,
          changePercent: (Math.random() - 0.5) * 5,
          volume: Math.floor(Math.random() * 1000000),
          high: ref.high || 160 + Math.random() * 100,
          low: ref.low || 140 + Math.random() * 100,
        };
      }
      return acc;
    }, {}),
    indices: [
      { name: 'S&P 500', value: 4500, change: 25.5, changePercent: 0.57 },
      { name: 'NASDAQ', value: 14200, change: -15.2, changePercent: -0.11 },
      { name: 'DOW', value: 35000, change: 120.8, changePercent: 0.35 },
    ],
  };

  return (
    <div className="market-data-content">
      {references.length > 0 ? (
        <FinancialWidgets
          data={marketWidgetData}
          widgetType={WIDGET_TYPES.MARKET_DATA_FEED}
          isRealTime={true}
          onAction={onAction}
        />
      ) : (
        <div className="empty-state">
          <p className="text-gray-400">No market data available</p>
          <button 
            onClick={() => onAction('add-market-data')} 
            className="action-btn primary"
          >
            Add Market Data
          </button>
        </div>
      )}
    </div>
  );
}

// Reference data content component
function ReferenceDataContent({ data, onAction }) {
  return (
    <div className="reference-data-content">
      <p className="text-gray-400">Reference data panel</p>
    </div>
  );
}

// Session info content component
function SessionInfoContent({ data, onAction }) {
  const { duration, quality, settings } = data || {};

  return (
    <div className="session-info-content">
      {duration && (
        <div className="info-item">
          <span className="info-label">Duration</span>
          <span className="info-value">{duration}</span>
        </div>
      )}
      
      {quality && (
        <div className="info-item">
          <span className="info-label">Quality</span>
          <span className="info-value">{quality.audioLevel || 'Good'}</span>
        </div>
      )}
      
      {settings && (
        <div className="info-item">
          <span className="info-label">Mode</span>
          <span className="info-value">{settings.visualizationMode || 'Standard'}</span>
        </div>
      )}
    </div>
  );
}

// Export panel types and positions for external use
export { PANEL_TYPES, PANEL_POSITIONS };