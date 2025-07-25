/**
 * Financial Content Processing Utilities
 * Handles detection and highlighting of financial terms, numbers, and percentages
 */

// Financial keywords and terms to highlight
export const FINANCIAL_TERMS = {
  // Investment terms
  INVESTMENT: [
    'portfolio', 'investment', 'invest', 'investing', 'investor',
    'stocks', 'stock', 'shares', 'equity', 'equities',
    'bonds', 'bond', 'treasury', 'municipal',
    'mutual fund', 'mutual funds', 'etf', 'etfs', 'index fund', 'index funds',
    'dividend', 'dividends', 'yield', 'returns', 'return',
    'capital gains', 'capital gain', 'appreciation',
    'diversification', 'diversify', 'asset allocation',
    'risk tolerance', 'risk', 'volatility', 'beta',
    'market cap', 'large cap', 'mid cap', 'small cap',
    'growth', 'value', 'blend'
  ],
  
  // Banking and accounts
  BANKING: [
    'savings', 'checking', 'account', 'accounts',
    'bank', 'banking', 'credit union',
    'deposit', 'withdrawal', 'transfer',
    'interest rate', 'interest', 'apr', 'apy',
    'loan', 'mortgage', 'refinance', 'credit',
    'debt', 'liability', 'liabilities'
  ],
  
  // Retirement and planning
  RETIREMENT: [
    '401k', '401(k)', 'ira', 'roth ira', 'traditional ira',
    'retirement', 'pension', 'social security',
    'nest egg', 'retirement planning',
    'contribution', 'contributions', 'match', 'matching',
    'vesting', 'rollover'
  ],
  
  // Insurance and protection
  INSURANCE: [
    'insurance', 'life insurance', 'health insurance',
    'disability insurance', 'term life', 'whole life',
    'premium', 'premiums', 'deductible', 'coverage'
  ],
  
  // Tax terms
  TAX: [
    'tax', 'taxes', 'taxable', 'tax-free', 'tax-deferred',
    'deduction', 'deductions', 'credit', 'refund',
    'withholding', 'estimated taxes', 'tax bracket',
    'marginal rate', 'effective rate'
  ],
  
  // Market and economic terms
  MARKET: [
    'market', 'markets', 'bull market', 'bear market',
    'recession', 'inflation', 'deflation',
    'fed', 'federal reserve', 'interest rates',
    'gdp', 'unemployment', 'cpi', 'ppi',
    'sector', 'sectors', 'industry'
  ]
};

// Regex patterns for financial data
export const FINANCIAL_PATTERNS = {
  // Currency amounts: $1,000, $1.5M, $2.3B, etc.
  CURRENCY: /\$[\d,]+(?:\.\d{1,2})?[KMBTkmbt]?/g,
  
  // Percentages: 5%, 12.5%, -3.2%
  PERCENTAGE: /[-+]?\d+(?:\.\d+)?%/g,
  
  // Numbers with commas: 1,000, 50,000, 1,500,000
  LARGE_NUMBERS: /\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g,
  
  // Decimal numbers: 3.14, 0.05, 12.75
  DECIMAL_NUMBERS: /\b\d+\.\d+\b/g,
  
  // Years: 2024, 2025, etc.
  YEARS: /\b(19|20)\d{2}\b/g,
  
  // Ratios: 60/40, 70:30, 3:1
  RATIOS: /\b\d+[:/]\d+\b/g,
  
  // Basis points: 25bp, 50 basis points
  BASIS_POINTS: /\d+\s*(?:bp|basis\s+points?)/gi,
  
  // Account numbers (masked): ***1234, ****5678
  ACCOUNT_NUMBERS: /\*{3,}\d{4}/g
};

// Financial term categories for different highlighting styles
export const TERM_CATEGORIES = {
  HIGH_PRIORITY: ['portfolio', 'investment', 'retirement', 'risk', 'return'],
  MEDIUM_PRIORITY: ['stocks', 'bonds', 'savings', 'loan', 'tax'],
  LOW_PRIORITY: ['account', 'bank', 'interest', 'market']
};

/**
 * Detects financial terms in text
 * @param {string} text - The text to analyze
 * @returns {Array} Array of detected terms with positions and categories
 */
export function detectFinancialTerms(text) {
  const detectedTerms = [];
  const lowerText = text.toLowerCase();
  
  // Check each category of financial terms
  Object.entries(FINANCIAL_TERMS).forEach(([category, terms]) => {
    terms.forEach(term => {
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        detectedTerms.push({
          term: match[0],
          category: category.toLowerCase(),
          start: match.index,
          end: match.index + match[0].length,
          priority: getPriority(term)
        });
      }
    });
  });
  
  return detectedTerms.sort((a, b) => a.start - b.start);
}

/**
 * Detects financial numbers and patterns in text
 * @param {string} text - The text to analyze
 * @returns {Array} Array of detected numbers with positions and types
 */
export function detectFinancialNumbers(text) {
  const detectedNumbers = [];
  
  // Check each pattern type
  Object.entries(FINANCIAL_PATTERNS).forEach(([type, pattern]) => {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    
    while ((match = regex.exec(text)) !== null) {
      detectedNumbers.push({
        value: match[0],
        type: type.toLowerCase(),
        start: match.index,
        end: match.index + match[0].length,
        formatted: formatFinancialNumber(match[0], type)
      });
    }
  });
  
  return detectedNumbers.sort((a, b) => a.start - b.start);
}

/**
 * Gets priority level for a financial term
 * @param {string} term - The financial term
 * @returns {string} Priority level (high, medium, low)
 */
function getPriority(term) {
  const lowerTerm = term.toLowerCase();
  
  if (TERM_CATEGORIES.HIGH_PRIORITY.some(t => lowerTerm.includes(t))) {
    return 'high';
  } else if (TERM_CATEGORIES.MEDIUM_PRIORITY.some(t => lowerTerm.includes(t))) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Formats financial numbers for better display
 * @param {string} value - The raw number value
 * @param {string} type - The type of number
 * @returns {string} Formatted number
 */
function formatFinancialNumber(value, type) {
  switch (type) {
    case 'CURRENCY':
      return value; // Already formatted
    case 'PERCENTAGE':
      return value;
    case 'LARGE_NUMBERS':
      // Add thousand separators if not present
      const num = parseFloat(value.replace(/,/g, ''));
      return num.toLocaleString();
    default:
      return value;
  }
}

/**
 * Processes text to add financial highlighting markup
 * @param {string} text - The text to process
 * @returns {Array} Array of text segments with highlighting information
 */
export function processFinancialContent(text) {
  if (!text || typeof text !== 'string') {
    return [{ text, type: 'text' }];
  }
  
  const segments = [];
  const allMatches = [];
  
  // Collect all financial terms
  const terms = detectFinancialTerms(text);
  terms.forEach(term => {
    allMatches.push({
      ...term,
      matchType: 'term'
    });
  });
  
  // Collect all financial numbers
  const numbers = detectFinancialNumbers(text);
  numbers.forEach(number => {
    allMatches.push({
      ...number,
      matchType: 'number'
    });
  });
  
  // Sort all matches by position
  allMatches.sort((a, b) => a.start - b.start);
  
  // Remove overlapping matches (keep the first one)
  const filteredMatches = [];
  let lastEnd = 0;
  
  allMatches.forEach(match => {
    if (match.start >= lastEnd) {
      filteredMatches.push(match);
      lastEnd = match.end;
    }
  });
  
  // Build segments
  let currentPos = 0;
  
  filteredMatches.forEach(match => {
    // Add text before the match
    if (match.start > currentPos) {
      segments.push({
        text: text.slice(currentPos, match.start),
        type: 'text'
      });
    }
    
    // Add the highlighted match
    segments.push({
      text: match.matchType === 'term' ? match.term : match.value,
      type: match.matchType === 'term' ? 'financial-term' : 'financial-number',
      category: match.category || match.type,
      priority: match.priority,
      formatted: match.formatted
    });
    
    currentPos = match.end;
  });
  
  // Add remaining text
  if (currentPos < text.length) {
    segments.push({
      text: text.slice(currentPos),
      type: 'text'
    });
  }
  
  return segments;
}

/**
 * Extracts financial context from a message
 * @param {string} text - The message text
 * @returns {Object} Financial context information
 */
export function extractFinancialContext(text) {
  const terms = detectFinancialTerms(text);
  const numbers = detectFinancialNumbers(text);
  
  // Categorize terms
  const categories = {};
  terms.forEach(term => {
    if (!categories[term.category]) {
      categories[term.category] = [];
    }
    categories[term.category].push(term.term);
  });
  
  // Categorize numbers
  const numberTypes = {};
  numbers.forEach(number => {
    if (!numberTypes[number.type]) {
      numberTypes[number.type] = [];
    }
    numberTypes[number.type].push(number.value);
  });
  
  return {
    hasFinancialContent: terms.length > 0 || numbers.length > 0,
    termCount: terms.length,
    numberCount: numbers.length,
    categories,
    numberTypes,
    priority: terms.some(t => t.priority === 'high') ? 'high' : 
              terms.some(t => t.priority === 'medium') ? 'medium' : 'low'
  };
}

/**
 * Generates suggestions based on financial content
 * @param {Object} context - Financial context from extractFinancialContext
 * @returns {Array} Array of suggested actions or information
 */
export function generateFinancialSuggestions(context) {
  const suggestions = [];
  
  if (!context.hasFinancialContent) {
    return suggestions;
  }
  
  // Investment-related suggestions
  if (context.categories.investment) {
    suggestions.push({
      type: 'action',
      title: 'Portfolio Analysis',
      description: 'Analyze your investment portfolio',
      icon: 'TrendingUp'
    });
  }
  
  // Retirement planning suggestions
  if (context.categories.retirement) {
    suggestions.push({
      type: 'action',
      title: 'Retirement Calculator',
      description: 'Calculate retirement savings needs',
      icon: 'Calendar'
    });
  }
  
  // Currency amounts suggest budget analysis
  if (context.numberTypes.currency) {
    suggestions.push({
      type: 'action',
      title: 'Budget Tracker',
      description: 'Track and categorize expenses',
      icon: 'DollarSign'
    });
  }
  
  // Tax-related suggestions
  if (context.categories.tax) {
    suggestions.push({
      type: 'info',
      title: 'Tax Optimization',
      description: 'Learn about tax-efficient strategies',
      icon: 'FileText'
    });
  }
  
  return suggestions;
}