import { processFinancialContent } from '../utils/financialContentProcessor';

/**
 * Component for rendering text with financial content highlighting
 */
export default function FinancialContentRenderer({ 
  content, 
  className = '',
  showTooltips = true,
  onTermClick,
  onNumberClick 
}) {
  if (!content || typeof content !== 'string') {
    return <span className={className}>{content}</span>;
  }

  const segments = processFinancialContent(content);

  const handleSegmentClick = (segment, event) => {
    event.stopPropagation();
    
    if (segment.type === 'financial-term' && onTermClick) {
      onTermClick(segment);
    } else if (segment.type === 'financial-number' && onNumberClick) {
      onNumberClick(segment);
    }
  };

  const getSegmentClassName = (segment) => {
    const baseClasses = 'financial-highlight';
    
    if (segment.type === 'text') {
      return '';
    }
    
    if (segment.type === 'financial-term') {
      const priorityClass = `financial-term-${segment.priority}`;
      const categoryClass = `financial-category-${segment.category}`;
      return `${baseClasses} financial-term ${priorityClass} ${categoryClass}`;
    }
    
    if (segment.type === 'financial-number') {
      const typeClass = `financial-number-${segment.category}`;
      return `${baseClasses} financial-number ${typeClass}`;
    }
    
    return '';
  };

  const getTooltipContent = (segment) => {
    if (!showTooltips) return null;
    
    if (segment.type === 'financial-term') {
      return {
        title: segment.text,
        description: `Financial term (${segment.category})`,
        priority: segment.priority
      };
    }
    
    if (segment.type === 'financial-number') {
      return {
        title: segment.formatted || segment.text,
        description: `${segment.category.replace('_', ' ').toLowerCase()}`,
        type: segment.category
      };
    }
    
    return null;
  };

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        const segmentClassName = getSegmentClassName(segment);
        const tooltip = getTooltipContent(segment);
        const isClickable = segment.type !== 'text' && (onTermClick || onNumberClick);
        
        return (
          <span
            key={index}
            className={`${segmentClassName} ${isClickable ? 'cursor-pointer' : ''}`}
            onClick={isClickable ? (e) => handleSegmentClick(segment, e) : undefined}
            title={tooltip ? `${tooltip.title} - ${tooltip.description}` : undefined}
            data-financial-type={segment.type}
            data-financial-category={segment.category}
            data-financial-priority={segment.priority}
          >
            {segment.text}
          </span>
        );
      })}
    </span>
  );
}