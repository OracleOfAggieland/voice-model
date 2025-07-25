import { useState } from "react";
import * as feather from "react-feather";

function SessionStopped({ startSession }) {
  const [isActivating, setIsActivating] = useState(false);

  function handleStartSession() {
    if (isActivating) return;

    setIsActivating(true);
    startSession();
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
      <button
        onClick={handleStartSession}
        className={`
          relative px-8 py-4 rounded-full font-semibold text-white
          ${isActivating 
            ? 'bg-gray-600 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105'
          }
          transition-all duration-300 flex items-center gap-3
          shadow-lg hover:shadow-xl
        `}
      >
        <feather.Mic className="w-5 h-5" />
        {isActivating ? "Connecting..." : "Start Financial Consultation"}
      </button>
      <p className="text-sm text-gray-400">Click to connect with your AI financial advisor</p>
    </div>
  );
}

function SessionActive({ stopSession, sendTextMessage }) {
  const [message, setMessage] = useState("");
  const [showPrompts, setShowPrompts] = useState(false);

  const samplePrompts = [
    "How should I diversify my investment portfolio?",
    "Create a budget plan for my $5,000 monthly income",
    "What's the best way to save for retirement?",
    "Should I invest in stocks or bonds right now?",
    "How can I improve my credit score?",
  ];

  function handleSendClientEvent() {
    sendTextMessage(message);
    setMessage("");
  }

  function sendPrompt(prompt) {
    sendTextMessage(prompt);
    setShowPrompts(false);
  }

  return (
    <div className="flex flex-col w-full h-full space-y-3">
      {showPrompts && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-gray-800/95 backdrop-blur rounded-lg p-3 space-y-2 shadow-xl">
          <p className="text-xs text-gray-400 mb-2">Sample questions:</p>
          {samplePrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => sendPrompt(prompt)}
              className="block w-full text-left text-sm p-2 rounded hover:bg-white/10 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
      
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowPrompts(!showPrompts)}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          title="Show sample questions"
        >
          <feather.HelpCircle className="w-5 h-5" />
        </button>
        
        <div className="flex-1 relative">
          <input
            onKeyDown={(e) => {
              if (e.key === "Enter" && message.trim()) {
                handleSendClientEvent();
              }
            }}
            type="text"
            placeholder="Ask about investments, budgeting, savings..."
            className="w-full px-6 py-3 rounded-full bg-white/10 border border-white/20 
                     placeholder-gray-400 focus:outline-none focus:border-white/40 
                     transition-colors"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        
        <button
          onClick={() => {
            if (message.trim()) {
              handleSendClientEvent();
            }
          }}
          className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 
                   hover:from-blue-600 hover:to-purple-700 transition-all duration-300
                   disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!message.trim()}
        >
          <feather.MessageSquare className="w-5 h-5" />
        </button>
        
        <button
          onClick={stopSession}
          className="p-3 rounded-full bg-red-500/20 hover:bg-red-500/30 
                   border border-red-500/50 transition-colors"
          title="End session"
        >
          <feather.MicOff className="w-5 h-5 text-red-400" />
        </button>
      </div>
      
      <p className="text-xs text-gray-400 text-center">
        Speak naturally or type your financial questions
      </p>
    </div>
  );
}

export default function SessionControls({
  startSession,
  stopSession,
  sendClientEvent,
  sendTextMessage,
  serverEvents,
  isSessionActive,
}) {
  return (
    <div className="relative h-full">
      {isSessionActive ? (
        <SessionActive
          stopSession={stopSession}
          sendClientEvent={sendClientEvent}
          sendTextMessage={sendTextMessage}
          serverEvents={serverEvents}
        />
      ) : (
        <SessionStopped startSession={startSession} />
      )}
    </div>
  );
}