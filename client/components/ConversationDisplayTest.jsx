import { useState, useEffect } from 'react';
import ConversationDisplay from './ConversationDisplay';

// Sample messages for testing with financial content
const sampleMessages = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 300000),
    speaker: 'user',
    content: 'Hello, I need help with my portfolio analysis. I have about $150,000 invested.',
    confidence: 0.95,
    status: 'sent',
    metadata: {
      duration: 2.3,
      audioLevel: 0.8,
    },
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 280000),
    speaker: 'ai',
    content: 'Hello! I\'d be happy to help you analyze your $150,000 portfolio. Could you tell me what specific aspects you\'d like to focus on? Are you looking at risk assessment, diversification, or returns analysis?',
    confidence: 0.98,
    status: 'received',
    metadata: {
      duration: 4.1,
      audioLevel: 0.7,
    },
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 260000),
    speaker: 'user',
    content: 'I want to understand my risk exposure and see if my asset allocation is appropriate. I\'m 35 years old and currently have 60% stocks, 30% bonds, and 10% cash.',
    confidence: 0.92,
    status: 'sent',
    metadata: {
      duration: 3.8,
      audioLevel: 0.75,
    },
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 240000),
    speaker: 'ai',
    content: 'Great questions! Risk exposure and age-appropriate asset allocation are crucial for long-term investment success. Your current 60/30/10 allocation is quite conservative for age 35.\n\nBased on typical guidelines, someone in their 30s might consider 70-80% stocks with 20-30% bonds. Your 6.5% annual return target could benefit from higher equity exposure, potentially increasing returns by 1-2% annually.',
    confidence: 0.97,
    status: 'received',
    metadata: {
      duration: 8.2,
      audioLevel: 0.72,
    },
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 220000),
    speaker: 'user',
    content: 'That sounds reasonable. Can you show me some specific numbers? What would a $10,000 monthly contribution look like over 30 years?',
    confidence: 0.89,
    status: 'sent',
    metadata: {
      duration: 2.1,
      audioLevel: 0.82,
    },
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 200000),
    speaker: 'ai',
    content: 'Absolutely! With $10,000 monthly contributions over 30 years at 7.5% annual return, you\'d accumulate approximately $12.8 million. Here\'s the breakdown:\n\n• Total contributions: $3.6M\n• Investment growth: $9.2M\n• Final portfolio value: $12.8M\n\nThis assumes consistent market performance and dollar-cost averaging benefits.',
    confidence: 0.96,
    status: 'received',
    metadata: {
      duration: 6.8,
      audioLevel: 0.74,
    },
  },
];

export default function ConversationDisplayTest() {
  const [messages, setMessages] = useState([]);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [enableFinancialHighlighting, setEnableFinancialHighlighting] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);

  // Simulate conversation flow
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messageIndex < sampleMessages.length) {
        setMessages(prev => [...prev, sampleMessages[messageIndex]]);
        setMessageIndex(prev => prev + 1);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [messageIndex]);

  // Simulate typing states
  const simulateUserSpeaking = () => {
    setIsUserSpeaking(true);
    setCurrentTranscript('');
    
    const transcript = 'What about international diversification? Should I allocate 15-20% to emerging markets?';
    let index = 0;
    
    const typeInterval = setInterval(() => {
      if (index < transcript.length) {
        setCurrentTranscript(transcript.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setIsUserSpeaking(false);
          setCurrentTranscript('');
          
          // Add the completed message
          const newMessage = {
            id: Date.now().toString(),
            timestamp: new Date(),
            speaker: 'user',
            content: transcript,
            confidence: 0.93,
            status: 'sent',
            metadata: {
              duration: 2.8,
              audioLevel: 0.78,
            },
          };
          setMessages(prev => [...prev, newMessage]);
        }, 500);
      }
    }, 100);
  };

  const simulateAISpeaking = () => {
    setIsAISpeaking(true);
    setCurrentTranscript('');
    
    setTimeout(() => {
      const response = 'International diversification is excellent for reducing portfolio risk. I recommend allocating 20-30% of your equity holdings to international markets, with 15% in developed markets and 5-10% in emerging markets. This could improve your risk-adjusted returns by 0.5-1.0% annually while reducing volatility by 10-15%.';
      let index = 0;
      
      const typeInterval = setInterval(() => {
        if (index < response.length) {
          setCurrentTranscript(response.slice(0, index + 1));
          index++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => {
            setIsAISpeaking(false);
            setCurrentTranscript('');
            
            // Add the completed message
            const newMessage = {
              id: Date.now().toString(),
              timestamp: new Date(),
              speaker: 'ai',
              content: response,
              confidence: 0.96,
              status: 'received',
              metadata: {
                duration: 6.4,
                audioLevel: 0.74,
              },
            };
            setMessages(prev => [...prev, newMessage]);
          }, 500);
        }
      }, 50);
    }, 1000);
  };

  const addSystemMessage = () => {
    const systemMessage = {
      id: Date.now().toString(),
      timestamp: new Date(),
      speaker: 'system',
      content: 'Voice session quality: Excellent (98% accuracy)',
      status: 'received',
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const clearMessages = () => {
    setMessages([]);
    setMessageIndex(0);
    setIsUserSpeaking(false);
    setIsAISpeaking(false);
    setCurrentTranscript('');
  };

  const handleMessageClick = (message) => {
    console.log('Message clicked:', message);
  };

  const handleScrollPositionChange = (scrollInfo) => {
    console.log('Scroll position changed:', scrollInfo);
  };

  const handleFinancialTermClick = (term) => {
    console.log('Financial term clicked:', term);
  };

  const handleFinancialNumberClick = (number) => {
    console.log('Financial number clicked:', number);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="h-full max-w-4xl mx-auto flex flex-col gap-4">
        {/* Test Controls */}
        <div className="glass-light rounded-lg p-4">
          <h2 className="text-xl font-semibold text-white mb-4">ConversationDisplay Test</h2>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={simulateUserSpeaking}
              disabled={isUserSpeaking || isAISpeaking}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Simulate User Speaking
            </button>
            
            <button
              onClick={simulateAISpeaking}
              disabled={isUserSpeaking || isAISpeaking}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Simulate AI Speaking
            </button>
            
            <button
              onClick={addSystemMessage}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Add System Message
            </button>
            
            <button
              onClick={clearMessages}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Clear Messages
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              Auto Scroll
            </label>
            
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={showTimestamps}
                onChange={(e) => setShowTimestamps(e.target.checked)}
                className="rounded"
              />
              Show Timestamps
            </label>
            
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={enableFinancialHighlighting}
                onChange={(e) => setEnableFinancialHighlighting(e.target.checked)}
                className="rounded"
              />
              Financial Highlighting
            </label>
          </div>
          
          <div className="mt-3 text-sm text-gray-300">
            Messages: {messages.length} | 
            User Speaking: {isUserSpeaking ? 'Yes' : 'No'} | 
            AI Speaking: {isAISpeaking ? 'Yes' : 'No'} |
            Financial Highlighting: {enableFinancialHighlighting ? 'On' : 'Off'}
            {currentTranscript && (
              <div className="mt-1 text-xs text-blue-300">
                Current: "{currentTranscript}"
              </div>
            )}
          </div>
        </div>

        {/* ConversationDisplay Component */}
        <div className="flex-1 glass rounded-lg overflow-hidden">
          <ConversationDisplay
            messages={messages}
            isUserSpeaking={isUserSpeaking}
            isAISpeaking={isAISpeaking}
            currentTranscript={currentTranscript}
            autoScroll={autoScroll}
            showTimestamps={showTimestamps}
            enableFinancialHighlighting={enableFinancialHighlighting}
            onMessageClick={handleMessageClick}
            onScrollPositionChange={handleScrollPositionChange}
            onFinancialTermClick={handleFinancialTermClick}
            onFinancialNumberClick={handleFinancialNumberClick}
          />
        </div>
      </div>
    </div>
  );
}