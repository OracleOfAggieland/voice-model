import { useState, useEffect, useRef, useCallback } from 'react';
import FinancialContentRenderer from './FinancialContentRenderer';
import { extractFinancialContext } from '../utils/financialContentProcessor';
import { 
  ariaAnnouncer, 
  createAriaLabel,
  KEYBOARD_KEYS 
} from '../utils/accessibility.js';

// Message types
const MESSAGE_TYPES = {
  USER: 'user',
  AI: 'ai',
  SYSTEM: 'system',
};

// Message status types
const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  RECEIVED: 'received',
  ERROR: 'error',
};

export default function ConversationDisplay({
  messages = [],
  isUserSpeaking = false,
  isAISpeaking = false,
  currentTranscript = '',
  autoScroll = true,
  showTimestamps = false,
  enableFinancialHighlighting = true,
  className = '',
  onMessageClick,
  onScrollPositionChange,
  onFinancialTermClick,
  onFinancialNumberClick,
}) {
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const lastScrollTop = useRef(0);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((force = false) => {
    if (messagesEndRef.current && (autoScroll || force)) {
      if (!userScrolledUp || force) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }
    }
  }, [autoScroll, userScrolledUp]);

  // Handle scroll events to detect user scrolling
  const handleScroll = useCallback((e) => {
    const container = e.target;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
    
    // Detect if user scrolled up
    const scrolledUp = scrollTop < lastScrollTop.current;
    lastScrollTop.current = scrollTop;
    
    if (scrolledUp && !isAtBottom) {
      setUserScrolledUp(true);
      setShowScrollToBottom(true);
    } else if (isAtBottom) {
      setUserScrolledUp(false);
      setShowScrollToBottom(false);
    }

    // Notify parent of scroll position changes
    if (onScrollPositionChange) {
      onScrollPositionChange({
        scrollTop,
        scrollHeight,
        clientHeight,
        isAtBottom,
        userScrolledUp: scrolledUp && !isAtBottom,
      });
    }
  }, [onScrollPositionChange]);

  // Auto-scroll when new messages arrive and announce new messages
  useEffect(() => {
    scrollToBottom();
    
    // Announce new messages to screen readers
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.content) {
        // Only announce if it's a new message (not just a re-render)
        const messageId = lastMessage.id || `${lastMessage.speaker}-${lastMessage.timestamp}`;
        if (messageId !== lastMessage.previousId) {
          ariaAnnouncer.announceMessage(
            lastMessage.speaker, 
            lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : ''),
            false // Don't use live region for completed messages
          );
        }
      }
    }
  }, [messages.length, scrollToBottom]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get message styling classes
  const getMessageClasses = (message) => {
    const baseClasses = 'message-bubble animate-fade-in-up';
    const typeClasses = {
      [MESSAGE_TYPES.USER]: 'message-user',
      [MESSAGE_TYPES.AI]: 'message-ai',
      [MESSAGE_TYPES.SYSTEM]: 'message-system',
    };
    
    const statusClasses = {
      [MESSAGE_STATUS.SENDING]: 'message-sending',
      [MESSAGE_STATUS.SENT]: 'message-sent',
      [MESSAGE_STATUS.RECEIVED]: 'message-received',
      [MESSAGE_STATUS.ERROR]: 'message-error',
    };

    // Add financial content class if message contains financial terms
    let financialClass = '';
    if (enableFinancialHighlighting && message.content) {
      const context = extractFinancialContext(message.content);
      if (context.hasFinancialContent) {
        financialClass = `message-financial message-financial-${context.priority}`;
      }
    }

    return `${baseClasses} ${typeClasses[message.speaker] || ''} ${statusClasses[message.status] || ''} ${financialClass}`;
  };

  // Get speaker display name
  const getSpeakerName = (speaker) => {
    switch (speaker) {
      case MESSAGE_TYPES.USER:
        return 'You';
      case MESSAGE_TYPES.AI:
        return 'AI Assistant';
      case MESSAGE_TYPES.SYSTEM:
        return 'System';
      default:
        return speaker;
    }
  };

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (!isUserSpeaking && !isAISpeaking && !currentTranscript) return null;

    const speaker = isUserSpeaking ? MESSAGE_TYPES.USER : MESSAGE_TYPES.AI;
    const speakerName = getSpeakerName(speaker);
    
    return (
      <div className={`typing-indicator ${speaker === MESSAGE_TYPES.USER ? 'typing-user' : 'typing-ai'}`}>
        <div className="typing-indicator-content">
          <div className="typing-indicator-avatar">
            {speaker === MESSAGE_TYPES.USER ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            )}
          </div>
          
          <div className="typing-indicator-text">
            <div className="typing-indicator-label">
              {speakerName} {isUserSpeaking ? 'speaking' : isAISpeaking ? 'responding' : 'typing'}...
            </div>
            
            {currentTranscript && (
              <div className="typing-indicator-transcript">
                {currentTranscript}
              </div>
            )}
            
            {!currentTranscript && (
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render individual message with full accessibility
  const renderMessage = (message, index) => {
    const isLastMessage = index === messages.length - 1;
    const speakerName = getSpeakerName(message.speaker);
    const messageTime = message.timestamp ? formatTimestamp(message.timestamp) : '';
    
    // Create comprehensive ARIA label
    const ariaLabel = createAriaLabel(
      `Message from ${speakerName}`,
      message.status || 'received',
      messageTime ? `at ${messageTime}` : ''
    );
    
    return (
      <div
        key={message.id || index}
        className={getMessageClasses(message)}
        onClick={() => onMessageClick && onMessageClick(message)}
        onKeyDown={(e) => {
          if ((e.key === KEYBOARD_KEYS.ENTER || e.key === KEYBOARD_KEYS.SPACE) && onMessageClick) {
            e.preventDefault();
            onMessageClick(message);
          }
        }}
        style={{ animationDelay: `${index * 0.05}s` }}
        role={onMessageClick ? 'button' : 'article'}
        tabIndex={onMessageClick ? 0 : -1}
        aria-label={ariaLabel}
        aria-describedby={`message-content-${index}`}
      >
        <div className="message-header">
          <div 
            className="message-avatar"
            aria-hidden="true"
          >
            {message.speaker === MESSAGE_TYPES.USER ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            )}
          </div>
          
          <div className="message-meta">
            <span 
              className="message-speaker"
              aria-label={`Speaker: ${speakerName}`}
            >
              {speakerName}
            </span>
            {showTimestamps && message.timestamp && (
              <span 
                className="message-timestamp"
                aria-label={`Time: ${messageTime}`}
              >
                {messageTime}
              </span>
            )}
          </div>
          
          {message.confidence && (
            <div 
              className="message-confidence"
              role="progressbar"
              aria-valuenow={Math.round(message.confidence * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Confidence: ${Math.round(message.confidence * 100)}%`}
            >
              <div 
                className="confidence-bar"
                style={{ width: `${message.confidence * 100}%` }}
                aria-hidden="true"
              />
            </div>
          )}
        </div>
        
        <div 
          id={`message-content-${index}`}
          className="message-content"
          role="text"
        >
          {enableFinancialHighlighting ? (
            <FinancialContentRenderer
              content={message.content}
              showTooltips={true}
              onTermClick={onFinancialTermClick}
              onNumberClick={onFinancialNumberClick}
            />
          ) : (
            message.content
          )}
        </div>
        
        {message.metadata && (
          <div 
            className="message-metadata"
            aria-label="Message metadata"
          >
            {message.metadata.duration && (
              <span 
                className="metadata-duration"
                aria-label={`Duration: ${message.metadata.duration} seconds`}
              >
                {message.metadata.duration}s
              </span>
            )}
            {message.metadata.audioLevel && (
              <span 
                className="metadata-audio-level"
                aria-label={`Audio level: ${Math.round(message.metadata.audioLevel * 100)} percent`}
              >
                Level: {Math.round(message.metadata.audioLevel * 100)}%
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`conversation-display ${className}`}
      role="log"
      aria-label="Conversation messages"
      aria-describedby="conversation-description"
    >
      {/* Screen reader description */}
      <div id="conversation-description" className="sr-only">
        Conversation display showing messages between you and the AI assistant. 
        New messages will be announced automatically.
      </div>

      <div 
        ref={containerRef}
        className="conversation-messages"
        onScroll={handleScroll}
        role="region"
        aria-label="Message history"
        tabIndex={0}
        onKeyDown={(e) => {
          // Allow keyboard navigation through messages
          if (e.key === KEYBOARD_KEYS.ARROW_UP || e.key === KEYBOARD_KEYS.ARROW_DOWN) {
            e.preventDefault();
            
            // Navigate through clickable messages
            const clickableMessages = Array.from(containerRef.current.querySelectorAll('[role="button"]'));
            if (clickableMessages.length > 0) {
              const currentIndex = clickableMessages.indexOf(document.activeElement);
              let nextIndex;
              
              if (e.key === KEYBOARD_KEYS.ARROW_UP) {
                nextIndex = currentIndex > 0 ? currentIndex - 1 : clickableMessages.length - 1;
              } else {
                nextIndex = currentIndex < clickableMessages.length - 1 ? currentIndex + 1 : 0;
              }
              
              clickableMessages[nextIndex].focus();
              ariaAnnouncer.announce(`Message ${nextIndex + 1} of ${clickableMessages.length} focused`);
            }
          } else if (e.key === KEYBOARD_KEYS.HOME) {
            e.preventDefault();
            containerRef.current.scrollTop = 0;
            ariaAnnouncer.announce('Scrolled to top of conversation');
          } else if (e.key === KEYBOARD_KEYS.END) {
            e.preventDefault();
            scrollToBottom(true);
            ariaAnnouncer.announce('Scrolled to bottom of conversation');
          }
        }}
      >
        {messages.length === 0 ? (
          <div 
            className="conversation-empty"
            role="status"
            aria-label="No messages yet"
          >
            <div className="empty-state">
              <svg 
                className="w-12 h-12 text-gray-400 mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-400 text-center">
                Start a conversation to see messages here
              </p>
            </div>
          </div>
        ) : (
          <div 
            className="messages-list"
            role="group"
            aria-label={`${messages.length} messages`}
          >
            {messages.map((message, index) => renderMessage(message, index))}
            {renderTypingIndicator()}
          </div>
        )}
        
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>
      
      {/* Live region for current transcript */}
      {currentTranscript && (
        <div 
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="false"
        >
          Current transcript: {currentTranscript}
        </div>
      )}
      
      {showScrollToBottom && (
        <button
          className="scroll-to-bottom-btn floating-element focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
          onClick={() => scrollToBottom(true)}
          onKeyDown={(e) => {
            if (e.key === KEYBOARD_KEYS.ENTER || e.key === KEYBOARD_KEYS.SPACE) {
              e.preventDefault();
              scrollToBottom(true);
            }
          }}
          title="Scroll to bottom"
          aria-label="Scroll to bottom of conversation"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  );
}