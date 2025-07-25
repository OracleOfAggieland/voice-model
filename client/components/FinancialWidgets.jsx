import { useState, useEffect, useRef, useCallback } from 'react';

// Financial widget types
export const WIDGET_TYPES = {
  PORTFOLIO_CHART: 'portfolio_chart',
  METRICS_DASHBOARD: 'metrics_dashboard',
  CALCULATION_DISPLAY: 'calculation_display',
  MARKET_DATA_FEED: 'market_data_feed',
  PERFORMANCE_CHART: 'performance_chart',
  ALLOCATION_PIE: 'allocation_pie',
};

// Main financial widgets container
export default function FinancialWidgets({
  data = {},
  widgetType = WIDGET_TYPES.METRICS_DASHBOARD,
  isRealTime = false,
  onAction,
  className = '',
}) {
  const [widgetData, setWidgetData] = useState(data);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update widget data when props change
  useEffect(() => {
    setWidgetData(data);
  }, [data]);

  // Real-time data updates (simulated)
  useEffect(() => {
    if (!isRealTime) return;

    const interval = setInterval(() => {
      // Simulate real-time market data updates
      setWidgetData(prevData => ({
        ...prevData,
        lastUpdated: new Date().toISOString(),
        // Add small random variations to simulate market movement
        ...(prevData.currentPrice && {
          currentPrice: prevData.currentPrice * (1 + (Math.random() - 0.5) * 0.02),
        }),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [isRealTime]);

  const renderWidget = () => {
    switch (widgetType) {
      case WIDGET_TYPES.PORTFOLIO_CHART:
        return <PortfolioChart data={widgetData} onAction={onAction} />;
      
      case WIDGET_TYPES.METRICS_DASHBOARD:
        return <MetricsDashboard data={widgetData} onAction={onAction} />;
      
      case WIDGET_TYPES.CALCULATION_DISPLAY:
        return <CalculationDisplay data={widgetData} onAction={onAction} />;
      
      case WIDGET_TYPES.MARKET_DATA_FEED:
        return <MarketDataFeed data={widgetData} onAction={onAction} isRealTime={isRealTime} />;
      
      case WIDGET_TYPES.PERFORMANCE_CHART:
        return <PerformanceChart data={widgetData} onAction={onAction} />;
      
      case WIDGET_TYPES.ALLOCATION_PIE:
        return <AllocationPie data={widgetData} onAction={onAction} />;
      
      default:
        return <div className="widget-error">Unknown widget type</div>;
    }
  };

  if (error) {
    return (
      <div className="financial-widget-error">
        <p>Error loading widget: {error}</p>
        <button onClick={() => setError(null)}>Retry</button>
      </div>
    );
  }

  return (
    <div className={`financial-widget ${widgetType} ${className}`}>
      {isLoading && <div className="widget-loading">Loading...</div>}
      {renderWidget()}
    </div>
  );
}

// Portfolio chart widget
function PortfolioChart({ data, onAction }) {
  const canvasRef = useRef(null);
  const { holdings = [], totalValue = 0, performance = [] } = data;

  useEffect(() => {
    if (!canvasRef.current || holdings.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw simple bar chart for holdings
    const barWidth = width / holdings.length - 10;
    const maxValue = Math.max(...holdings.map(h => h.value));

    holdings.forEach((holding, index) => {
      const barHeight = (holding.value / maxValue) * (height - 60);
      const x = index * (barWidth + 10) + 5;
      const y = height - barHeight - 30;

      // Draw bar
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, '#4fc3f7');
      gradient.addColorStop(1, '#29b6f6');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw label
      ctx.fillStyle = '#e0e6ed';
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(holding.symbol, x + barWidth / 2, height - 10);
      
      // Draw value
      ctx.fillText(
        `$${(holding.value / 1000).toFixed(1)}k`, 
        x + barWidth / 2, 
        y - 5
      );
    });
  }, [holdings]);

  return (
    <div className="portfolio-chart-widget">
      <div className="widget-header">
        <h4>Portfolio Holdings</h4>
        <span className="total-value">${totalValue.toLocaleString()}</span>
      </div>
      
      <canvas
        ref={canvasRef}
        width={280}
        height={150}
        className="portfolio-canvas"
      />
      
      <div className="widget-actions">
        <button onClick={() => onAction('view-details')} className="action-btn primary">
          View Details
        </button>
        <button onClick={() => onAction('rebalance')} className="action-btn secondary">
          Rebalance
        </button>
      </div>
    </div>
  );
}

// Metrics dashboard widget
function MetricsDashboard({ data, onAction }) {
  const {
    totalValue = 0,
    dayChange = 0,
    dayChangePercent = 0,
    totalReturn = 0,
    totalReturnPercent = 0,
    riskLevel = 'Moderate',
    diversificationScore = 0,
  } = data;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="metrics-dashboard-widget">
      <div className="widget-header">
        <h4>Portfolio Metrics</h4>
        <div className="last-updated">
          Updated {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-label">Total Value</div>
          <div className="metric-value">{formatCurrency(totalValue)}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Today</div>
          <div className={`metric-value ${dayChange >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(dayChange)}
            <span className="metric-percent">({formatPercent(dayChangePercent)})</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Total Return</div>
          <div className={`metric-value ${totalReturn >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(totalReturn)}
            <span className="metric-percent">({formatPercent(totalReturnPercent)})</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Risk Level</div>
          <div className="metric-value risk-indicator">
            <span className={`risk-badge ${riskLevel.toLowerCase()}`}>{riskLevel}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Diversification</div>
          <div className="metric-value">
            <div className="diversification-bar">
              <div 
                className="diversification-fill"
                style={{ width: `${diversificationScore}%` }}
              />
            </div>
            <span className="diversification-score">{diversificationScore}%</span>
          </div>
        </div>
      </div>

      <div className="widget-actions">
        <button onClick={() => onAction('analyze-performance')} className="action-btn primary">
          Analyze
        </button>
        <button onClick={() => onAction('export-report')} className="action-btn secondary">
          Export
        </button>
      </div>
    </div>
  );
}

// Calculation display widget
function CalculationDisplay({ data, onAction }) {
  const { calculations = [], activeCalculation = null } = data;

  const [selectedCalc, setSelectedCalc] = useState(activeCalculation || calculations[0]);

  const handleCalculationSelect = (calc) => {
    setSelectedCalc(calc);
    onAction('calculation-selected', calc);
  };

  const executeCalculation = (calc) => {
    onAction('execute-calculation', calc);
  };

  return (
    <div className="calculation-display-widget">
      <div className="widget-header">
        <h4>Financial Calculations</h4>
        <div className="calculation-count">{calculations.length} calculations</div>
      </div>

      {calculations.length > 0 ? (
        <>
          <div className="calculations-list">
            {calculations.map((calc, index) => (
              <div
                key={index}
                className={`calculation-item ${selectedCalc === calc ? 'selected' : ''}`}
                onClick={() => handleCalculationSelect(calc)}
              >
                <div className="calculation-type">{calc.type || 'Calculation'}</div>
                <div className="calculation-formula">{calc.formula}</div>
                <div className="calculation-result">{calc.result}</div>
                <div className="calculation-confidence">
                  Confidence: {Math.round((calc.confidence || 0.9) * 100)}%
                </div>
              </div>
            ))}
          </div>

          {selectedCalc && (
            <div className="selected-calculation">
              <div className="calculation-details">
                <h5>Selected Calculation</h5>
                <div className="calculation-breakdown">
                  <div className="formula-display">{selectedCalc.formula}</div>
                  <div className="result-display">{selectedCalc.result}</div>
                  {selectedCalc.explanation && (
                    <div className="explanation">{selectedCalc.explanation}</div>
                  )}
                </div>
              </div>

              <div className="widget-actions">
                <button 
                  onClick={() => executeCalculation(selectedCalc)} 
                  className="action-btn primary"
                >
                  Use Result
                </button>
                <button 
                  onClick={() => onAction('save-calculation', selectedCalc)} 
                  className="action-btn secondary"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="empty-calculations">
          <p>No calculations available</p>
          <button onClick={() => onAction('create-calculation')} className="action-btn primary">
            Create Calculation
          </button>
        </div>
      )}
    </div>
  );
}

// Market data feed widget
function MarketDataFeed({ data, onAction, isRealTime }) {
  const { symbols = [], marketData = {}, indices = [] } = data;
  const [selectedSymbol, setSelectedSymbol] = useState(symbols[0]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change, changePercent) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${formatPrice(change)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  return (
    <div className="market-data-feed-widget">
      <div className="widget-header">
        <h4>Market Data</h4>
        <div className="real-time-indicator">
          <div className={`status-dot ${isRealTime ? 'live' : 'delayed'}`} />
          {isRealTime ? 'Live' : 'Delayed'}
        </div>
      </div>

      {/* Market indices */}
      {indices.length > 0 && (
        <div className="market-indices">
          <h5>Market Indices</h5>
          <div className="indices-grid">
            {indices.map((index, i) => (
              <div key={i} className="index-item">
                <div className="index-name">{index.name}</div>
                <div className="index-value">{formatPrice(index.value)}</div>
                <div className={`index-change ${index.change >= 0 ? 'positive' : 'negative'}`}>
                  {formatChange(index.change, index.changePercent)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Symbol selector */}
      {symbols.length > 0 && (
        <div className="symbol-selector">
          <h5>Symbols</h5>
          <div className="symbols-list">
            {symbols.map((symbol, i) => (
              <button
                key={i}
                className={`symbol-btn ${selectedSymbol === symbol ? 'selected' : ''}`}
                onClick={() => setSelectedSymbol(symbol)}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected symbol data */}
      {selectedSymbol && marketData[selectedSymbol] && (
        <div className="symbol-data">
          <div className="symbol-header">
            <h5>{selectedSymbol}</h5>
            <div className="symbol-name">{marketData[selectedSymbol].name}</div>
          </div>
          
          <div className="price-data">
            <div className="current-price">
              {formatPrice(marketData[selectedSymbol].price)}
            </div>
            <div className={`price-change ${marketData[selectedSymbol].change >= 0 ? 'positive' : 'negative'}`}>
              {formatChange(
                marketData[selectedSymbol].change,
                marketData[selectedSymbol].changePercent
              )}
            </div>
          </div>

          <div className="additional-data">
            <div className="data-item">
              <span>Volume:</span>
              <span>{marketData[selectedSymbol].volume?.toLocaleString()}</span>
            </div>
            <div className="data-item">
              <span>High:</span>
              <span>{formatPrice(marketData[selectedSymbol].high)}</span>
            </div>
            <div className="data-item">
              <span>Low:</span>
              <span>{formatPrice(marketData[selectedSymbol].low)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="widget-actions">
        <button onClick={() => onAction('view-chart', selectedSymbol)} className="action-btn primary">
          View Chart
        </button>
        <button onClick={() => onAction('add-watchlist', selectedSymbol)} className="action-btn secondary">
          Add to Watchlist
        </button>
      </div>
    </div>
  );
}

// Performance chart widget
function PerformanceChart({ data, onAction }) {
  const canvasRef = useRef(null);
  const { performanceData = [], timeframe = '1M' } = data;

  useEffect(() => {
    if (!canvasRef.current || performanceData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw performance line chart
    const padding = 20;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    const minValue = Math.min(...performanceData.map(d => d.value));
    const maxValue = Math.max(...performanceData.map(d => d.value));
    const valueRange = maxValue - minValue;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i * chartHeight / 4);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw performance line
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.beginPath();

    performanceData.forEach((point, index) => {
      const x = padding + (index * chartWidth / (performanceData.length - 1));
      const y = padding + chartHeight - ((point.value - minValue) / valueRange * chartHeight);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw data points
    ctx.fillStyle = '#4fc3f7';
    performanceData.forEach((point, index) => {
      const x = padding + (index * chartWidth / (performanceData.length - 1));
      const y = padding + chartHeight - ((point.value - minValue) / valueRange * chartHeight);
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

  }, [performanceData]);

  return (
    <div className="performance-chart-widget">
      <div className="widget-header">
        <h4>Performance</h4>
        <div className="timeframe-selector">
          {['1D', '1W', '1M', '3M', '1Y'].map(tf => (
            <button
              key={tf}
              className={`timeframe-btn ${timeframe === tf ? 'selected' : ''}`}
              onClick={() => onAction('change-timeframe', tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={280}
        height={120}
        className="performance-canvas"
      />

      <div className="performance-stats">
        {performanceData.length > 0 && (
          <>
            <div className="stat-item">
              <span>Start:</span>
              <span>${performanceData[0]?.value.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span>End:</span>
              <span>${performanceData[performanceData.length - 1]?.value.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span>Change:</span>
              <span className={performanceData[performanceData.length - 1]?.value >= performanceData[0]?.value ? 'positive' : 'negative'}>
                {((performanceData[performanceData.length - 1]?.value - performanceData[0]?.value) / performanceData[0]?.value * 100).toFixed(2)}%
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Allocation pie chart widget
function AllocationPie({ data, onAction }) {
  const canvasRef = useRef(null);
  const { allocations = [] } = data;

  useEffect(() => {
    if (!canvasRef.current || allocations.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    let currentAngle = -Math.PI / 2; // Start at top

    const colors = [
      '#4fc3f7', '#81c784', '#ffd54f', '#ff8a65', 
      '#ba68c8', '#64b5f6', '#aed581', '#ffb74d'
    ];

    allocations.forEach((allocation, index) => {
      const sliceAngle = (allocation.percentage / 100) * 2 * Math.PI;
      
      // Draw slice
      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`${allocation.percentage}%`, labelX, labelY);

      currentAngle += sliceAngle;
    });

  }, [allocations]);

  return (
    <div className="allocation-pie-widget">
      <div className="widget-header">
        <h4>Asset Allocation</h4>
      </div>

      <div className="pie-container">
        <canvas
          ref={canvasRef}
          width={200}
          height={200}
          className="allocation-canvas"
        />
      </div>

      <div className="allocation-legend">
        {allocations.map((allocation, index) => (
          <div key={index} className="legend-item">
            <div 
              className="legend-color"
              style={{ 
                backgroundColor: [
                  '#4fc3f7', '#81c784', '#ffd54f', '#ff8a65', 
                  '#ba68c8', '#64b5f6', '#aed581', '#ffb74d'
                ][index % 8]
              }}
            />
            <span className="legend-label">{allocation.name}</span>
            <span className="legend-value">{allocation.percentage}%</span>
          </div>
        ))}
      </div>

      <div className="widget-actions">
        <button onClick={() => onAction('rebalance-allocation')} className="action-btn primary">
          Rebalance
        </button>
        <button onClick={() => onAction('view-allocation-details')} className="action-btn secondary">
          Details
        </button>
      </div>
    </div>
  );
}