import { useState } from 'react';
import ResponsiveLayout from './ResponsiveLayout';
import VoiceInterface from './VoiceInterface';

export default function VoiceInterfaceTest() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [events] = useState([]);

  const handleSessionControl = (action) => {
    console.log('Session control:', action);
    switch (action) {
      case 'start':
        setIsSessionActive(true);
        break;
      case 'stop':
        setIsSessionActive(false);
        setIsUserSpeaking(false);
        setIsAISpeaking(false);
        break;
      case 'pause':
        setIsUserSpeaking(false);
        setIsAISpeaking(false);
        break;
      default:
        break;
    }
  };

  const handleTextMessage = (message) => {
    console.log('Text message:', message);
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <ResponsiveLayout>
        <div className="h-full p-4">
          {/* Test Controls */}
          <div className="mb-4 glass rounded-lg p-4">
            <h2 className="text-white text-lg font-semibold mb-3">Voice Interface Test</h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleSessionControl(isSessionActive ? 'stop' : 'start')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                {isSessionActive ? 'Stop Session' : 'Start Session'}
              </button>
              <button
                onClick={() => setIsUserSpeaking(!isUserSpeaking)}
                disabled={!isSessionActive}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-md transition-colors"
              >
                {isUserSpeaking ? 'Stop Speaking' : 'User Speaking'}
              </button>
              <button
                onClick={() => setIsAISpeaking(!isAISpeaking)}
                disabled={!isSessionActive}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-md transition-colors"
              >
                {isAISpeaking ? 'Stop AI' : 'AI Speaking'}
              </button>
            </div>
          </div>

          {/* Voice Interface */}
          <div className="flex-1">
            <VoiceInterface
              isSessionActive={isSessionActive}
              isUserSpeaking={isUserSpeaking}
              isAISpeaking={isAISpeaking}
              events={events}
              onSessionControl={handleSessionControl}
              onTextMessage={handleTextMessage}
            />
          </div>
        </div>
      </ResponsiveLayout>
    </div>
  );
}