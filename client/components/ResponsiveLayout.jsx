import { useState, useEffect, createContext, useContext } from 'react';

// Breakpoint definitions based on design document
const BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1200,
};

const LAYOUT_MODES = {
  FOCUS: 'focus',
  INFORMATION: 'information', 
  CONTROL: 'control',
};

// Context for responsive layout state
const ResponsiveLayoutContext = createContext();

export const useResponsiveLayout = () => {
  const context = useContext(ResponsiveLayoutContext);
  if (!context) {
    throw new Error('useResponsiveLayout must be used within ResponsiveLayout');
  }
  return context;
};

export default function ResponsiveLayout({ children }) {
  const [screenSize, setScreenSize] = useState('desktop');
  const [layoutMode, setLayoutMode] = useState(LAYOUT_MODES.INFORMATION);
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  // Device detection and breakpoint management
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setDimensions({ width, height });
      
      if (width >= BREAKPOINTS.desktop) {
        setScreenSize('desktop');
      } else if (width >= BREAKPOINTS.tablet) {
        setScreenSize('tablet');
      } else {
        setScreenSize('mobile');
      }
    };

    // Initial size detection
    updateScreenSize();

    // Add resize listener with debouncing
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScreenSize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', debouncedResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Adaptive grid system configuration
  const getGridConfig = () => {
    switch (screenSize) {
      case 'desktop':
        return {
          columns: 12,
          gaps: 'gap-6',
          padding: 'p-6',
          maxWidth: 'max-w-7xl',
          containerClass: 'grid grid-cols-12 gap-6 p-6 max-w-7xl mx-auto h-full',
        };
      case 'tablet':
        return {
          columns: 8,
          gaps: 'gap-4',
          padding: 'p-4',
          maxWidth: 'max-w-4xl',
          containerClass: 'grid grid-cols-8 gap-4 p-4 max-w-4xl mx-auto h-full',
        };
      case 'mobile':
        return {
          columns: 4,
          gaps: 'gap-3',
          padding: 'p-3',
          maxWidth: 'max-w-sm',
          containerClass: 'grid grid-cols-4 gap-3 p-3 max-w-sm mx-auto h-full',
        };
      default:
        return {
          columns: 12,
          gaps: 'gap-6',
          padding: 'p-6',
          maxWidth: 'max-w-7xl',
          containerClass: 'grid grid-cols-12 gap-6 p-6 max-w-7xl mx-auto h-full',
        };
    }
  };

  // Layout orchestration for different screen sizes
  const getLayoutClasses = () => {
    const base = 'transition-all duration-normal ease-smooth';
    
    switch (screenSize) {
      case 'desktop':
        return `${base} desktop-layout`;
      case 'tablet':
        return `${base} tablet-layout`;
      case 'mobile':
        return `${base} mobile-layout`;
      default:
        return `${base} desktop-layout`;
    }
  };

  // Panel visibility and priority management
  const getPanelVisibility = () => {
    switch (screenSize) {
      case 'desktop':
        return {
          showAllPanels: true,
          collapsiblePanels: false,
          priorityBased: false,
          maxVisiblePanels: null,
        };
      case 'tablet':
        return {
          showAllPanels: false,
          collapsiblePanels: true,
          priorityBased: true,
          maxVisiblePanels: 2,
        };
      case 'mobile':
        return {
          showAllPanels: false,
          collapsiblePanels: true,
          priorityBased: true,
          maxVisiblePanels: 1,
        };
      default:
        return {
          showAllPanels: true,
          collapsiblePanels: false,
          priorityBased: false,
          maxVisiblePanels: null,
        };
    }
  };

  // Smooth transitions between layout modes
  const transitionToMode = (newMode) => {
    if (newMode !== layoutMode) {
      setLayoutMode(newMode);
    }
  };

  // Context value with all responsive layout utilities
  const contextValue = {
    screenSize,
    layoutMode,
    dimensions,
    breakpoints: BREAKPOINTS,
    layoutModes: LAYOUT_MODES,
    gridConfig: getGridConfig(),
    layoutClasses: getLayoutClasses(),
    panelVisibility: getPanelVisibility(),
    setLayoutMode: transitionToMode,
    
    // Utility functions
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop',
    isSmallScreen: screenSize === 'mobile' || screenSize === 'tablet',
    
    // Responsive utilities
    getResponsiveValue: (mobileValue, tabletValue, desktopValue) => {
      switch (screenSize) {
        case 'mobile':
          return mobileValue;
        case 'tablet':
          return tabletValue || mobileValue;
        case 'desktop':
          return desktopValue || tabletValue || mobileValue;
        default:
          return desktopValue || tabletValue || mobileValue;
      }
    },
    
    // Column span utilities for adaptive grid
    getColumnSpan: (mobileSpan, tabletSpan, desktopSpan) => {
      switch (screenSize) {
        case 'mobile':
          return `col-span-${mobileSpan}`;
        case 'tablet':
          return `col-span-${tabletSpan || mobileSpan}`;
        case 'desktop':
          return `col-span-${desktopSpan || tabletSpan || mobileSpan}`;
        default:
          return `col-span-${desktopSpan || tabletSpan || mobileSpan}`;
      }
    },
  };

  return (
    <ResponsiveLayoutContext.Provider value={contextValue}>
      <div className={contextValue.layoutClasses}>
        {children}
      </div>
    </ResponsiveLayoutContext.Provider>
  );
}

// Higher-order component for responsive behavior
export function withResponsiveLayout(Component) {
  return function ResponsiveComponent(props) {
    return (
      <ResponsiveLayout>
        <Component {...props} />
      </ResponsiveLayout>
    );
  };
}

// Responsive container component
export function ResponsiveContainer({ children, className = '' }) {
  const { gridConfig } = useResponsiveLayout();
  
  return (
    <div className={`${gridConfig.containerClass} ${className}`}>
      {children}
    </div>
  );
}

// Responsive grid item component
export function ResponsiveGridItem({ 
  children, 
  mobileSpan = 4, 
  tabletSpan, 
  desktopSpan, 
  className = '' 
}) {
  const { getColumnSpan } = useResponsiveLayout();
  
  return (
    <div className={`${getColumnSpan(mobileSpan, tabletSpan, desktopSpan)} ${className}`}>
      {children}
    </div>
  );
}