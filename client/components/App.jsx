import { useEffect, useRef, useState } from "react";
import * as feather from "react-feather";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import ToolPanel from "./ToolPanel";
import VoiceVisualizer from "./VoiceVisualizer";
import VoiceInterface from "./VoiceInterface";
import ResponsiveLayout from "./ResponsiveLayout";
import VoiceVisualizerEnhancedTest from "./VoiceVisualizerEnhancedTest";
import ConversationDisplayTest from "./ConversationDisplayTest";
import { VisualizationStyles } from "../utils/audioAnalysis.js";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [showVisualizerTest, setShowVisualizerTest] = useState(false);
  const [showConversationTest, setShowConversationTest] = useState(false);
  const [useNewVoiceInterface, setUseNewVoiceInterface] = useState(true);
  const [visualizationStyle, setVisualizationStyle] = useState(VisualizationStyles.CIRCULAR);
  const [messages, setMessages] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [conversationContext, setConversationContext] = useState([]);
  const [financialData, setFinancialData] = useState({});
  const [sessionInfo, setSessionInfo] = useState({});
  const peerConnection = useRef(null);
  const audioElement = useRef(null);

  async function startSession() {
    try {
      setSessionInfo(prevInfo => ({
        ...prevInfo,
        status: 'connecting',
        connectionStarted: new Date()
      }));

      // Get a session token for OpenAI Realtime API
      const tokenResponse = await fetch("/token");
      if (!tokenResponse.ok) {
        throw new Error(`Failed to get token: ${tokenResponse.status}`);
      }
      
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;

      if (!EPHEMERAL_KEY) {
        throw new Error('No API key received from server');
      }

      // Create a peer connection with enhanced configuration
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // Enhanced connection state monitoring
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        setSessionInfo(prevInfo => ({
          ...prevInfo,
          connectionState: pc.connectionState,
          lastConnectionStateChange: new Date()
        }));

        if (pc.connectionState === 'failed') {
          setSessionInfo(prevInfo => ({
            ...prevInfo,
            lastError: 'Connection failed',
            errorTime: new Date()
          }));
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
        setSessionInfo(prevInfo => ({
          ...prevInfo,
          iceConnectionState: pc.iceConnectionState
        }));
      };

      // Set up to play remote audio from the model
      audioElement.current = document.createElement("audio");
      audioElement.current.autoplay = true;
      pc.ontrack = (e) => {
        console.log('Received remote track');
        audioElement.current.srcObject = e.streams[0];
        setSessionInfo(prevInfo => ({
          ...prevInfo,
          remoteTrackReceived: new Date()
        }));
      };

      // Add local audio track for microphone input in the browser
      try {
        const ms = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        const audioTrack = ms.getTracks()[0];
        pc.addTrack(audioTrack);
        
        setSessionInfo(prevInfo => ({
          ...prevInfo,
          microphoneAccess: true,
          localTrackAdded: new Date()
        }));

        // Monitor track state
        audioTrack.onended = () => {
          console.log('Audio track ended');
          setSessionInfo(prevInfo => ({
            ...prevInfo,
            localTrackEnded: new Date()
          }));
        };

      } catch (mediaError) {
        console.error('Failed to get microphone access:', mediaError);
        setSessionInfo(prevInfo => ({
          ...prevInfo,
          lastError: 'Microphone access denied',
          errorTime: new Date()
        }));
        throw mediaError;
      }

      // Set up data channel for sending and receiving events
      const dc = pc.createDataChannel("oai-events");
      setDataChannel(dc);

      // Enhanced data channel configuration
      dc.addEventListener("open", () => {
        console.log('Data channel opened, sending session config');
        const sessionConfig = {
          type: "session.update",
          session: {
            instructions: `You are a professional financial advisor with expertise in personal finance, 
            investments, budgeting, and wealth management. You provide clear, actionable advice 
            tailored to individual needs. Always maintain a professional yet friendly tone. 
            Ask clarifying questions when needed to provide personalized recommendations. 
            Focus on helping users achieve their financial goals through sound financial planning.`,
            voice: "alloy",
            input_audio_transcription: {
              model: "whisper-1"
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 200
            }
          }
        };
        
        try {
          dc.send(JSON.stringify(sessionConfig));
          setSessionInfo(prevInfo => ({
            ...prevInfo,
            sessionConfigSent: new Date()
          }));
        } catch (sendError) {
          console.error('Failed to send session config:', sendError);
          setSessionInfo(prevInfo => ({
            ...prevInfo,
            lastError: 'Failed to send session config',
            errorTime: new Date()
          }));
        }
      });

      // Start the session using the Session Description Protocol (SDP)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`SDP request failed: ${sdpResponse.status}`);
      }

      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      
      await pc.setRemoteDescription(answer);
      peerConnection.current = pc;

      setSessionInfo(prevInfo => ({
        ...prevInfo,
        status: 'connected',
        connectionCompleted: new Date()
      }));

      console.log('Session started successfully');

    } catch (error) {
      console.error('Failed to start session:', error);
      setSessionInfo(prevInfo => ({
        ...prevInfo,
        status: 'error',
        lastError: error.message,
        errorTime: new Date(),
        connectionFailed: new Date()
      }));
      
      // Clean up on error
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      
      setDataChannel(null);
      setIsSessionActive(false);
      
      throw error;
    }
  }

  // Enhanced session cleanup with comprehensive error handling
  function stopSession() {
    try {
      console.log('Stopping session...');
      
      setSessionInfo(prevInfo => ({
        ...prevInfo,
        status: 'stopping',
        stopInitiated: new Date()
      }));

      // Close data channel safely
      if (dataChannel) {
        try {
          if (dataChannel.readyState === 'open') {
            dataChannel.close();
          }
        } catch (dcError) {
          console.error('Error closing data channel:', dcError);
        }
      }

      // Stop all media tracks
      if (peerConnection.current) {
        try {
          peerConnection.current.getSenders().forEach((sender) => {
            if (sender.track) {
              try {
                sender.track.stop();
                console.log('Stopped track:', sender.track.kind);
              } catch (trackError) {
                console.error('Error stopping track:', trackError);
              }
            }
          });

          // Close peer connection
          if (peerConnection.current.connectionState !== 'closed') {
            peerConnection.current.close();
          }
        } catch (pcError) {
          console.error('Error closing peer connection:', pcError);
        }
      }

      // Stop audio element
      if (audioElement.current) {
        try {
          audioElement.current.pause();
          audioElement.current.srcObject = null;
        } catch (audioError) {
          console.error('Error stopping audio element:', audioError);
        }
      }

      // Reset all state
      setIsSessionActive(false);
      setDataChannel(null);
      peerConnection.current = null;
      setIsUserSpeaking(false);
      setIsAISpeaking(false);
      setCurrentTranscript('');
      
      // Update session info with final state
      setSessionInfo(prevInfo => ({
        ...prevInfo,
        status: 'ended',
        endTime: new Date(),
        duration: prevInfo.startTime ? new Date() - prevInfo.startTime : 0,
        cleanupCompleted: new Date()
      }));

      console.log('Session stopped successfully');

    } catch (error) {
      console.error('Error during session cleanup:', error);
      
      // Force reset state even if cleanup failed
      setIsSessionActive(false);
      setDataChannel(null);
      peerConnection.current = null;
      setIsUserSpeaking(false);
      setIsAISpeaking(false);
      setCurrentTranscript('');
      
      setSessionInfo(prevInfo => ({
        ...prevInfo,
        status: 'error',
        lastError: `Cleanup error: ${error.message}`,
        errorTime: new Date(),
        endTime: new Date()
      }));
    }
  }

  // Enhanced session control with error handling and state management
  const handleSessionControl = async (action) => {
    try {
      setSessionInfo(prevInfo => ({
        ...prevInfo,
        lastControlAction: action,
        lastControlTime: new Date()
      }));

      switch (action) {
        case 'start':
          if (!isSessionActive) {
            setSessionInfo(prevInfo => ({
              ...prevInfo,
              status: 'connecting',
              connectionAttempts: (prevInfo.connectionAttempts || 0) + 1
            }));
            await startSession();
          } else {
            console.warn('Session already active');
          }
          break;
          
        case 'stop':
          setSessionInfo(prevInfo => ({
            ...prevInfo,
            status: 'stopping'
          }));
          stopSession();
          break;
          
        case 'pause':
          if (isSessionActive && dataChannel) {
            // Implement pause by temporarily stopping audio input
            const audioTracks = peerConnection.current?.getSenders()
              .map(sender => sender.track)
              .filter(track => track?.kind === 'audio');
            
            audioTracks.forEach(track => {
              track.enabled = false;
            });
            
            setSessionInfo(prevInfo => ({
              ...prevInfo,
              status: 'paused',
              pausedAt: new Date()
            }));
            
            console.log('Session paused');
          }
          break;
          
        case 'resume':
          if (isSessionActive && dataChannel) {
            // Resume by re-enabling audio input
            const audioTracks = peerConnection.current?.getSenders()
              .map(sender => sender.track)
              .filter(track => track?.kind === 'audio');
            
            audioTracks.forEach(track => {
              track.enabled = true;
            });
            
            setSessionInfo(prevInfo => ({
              ...prevInfo,
              status: 'active',
              resumedAt: new Date()
            }));
            
            console.log('Session resumed');
          }
          break;
          
        case 'mute':
          if (isSessionActive && peerConnection.current) {
            const audioTracks = peerConnection.current.getSenders()
              .map(sender => sender.track)
              .filter(track => track?.kind === 'audio');
            
            audioTracks.forEach(track => {
              track.enabled = false;
            });
            
            setSessionInfo(prevInfo => ({
              ...prevInfo,
              isMuted: true,
              mutedAt: new Date()
            }));
            
            console.log('Session muted');
          }
          break;
          
        case 'unmute':
          if (isSessionActive && peerConnection.current) {
            const audioTracks = peerConnection.current.getSenders()
              .map(sender => sender.track)
              .filter(track => track?.kind === 'audio');
            
            audioTracks.forEach(track => {
              track.enabled = true;
            });
            
            setSessionInfo(prevInfo => ({
              ...prevInfo,
              isMuted: false,
              unmutedAt: new Date()
            }));
            
            console.log('Session unmuted');
          }
          break;
          
        default:
          console.warn('Unknown session control action:', action);
          setSessionInfo(prevInfo => ({
            ...prevInfo,
            lastError: `Unknown action: ${action}`
          }));
      }
    } catch (error) {
      console.error('Error handling session control:', error);
      setSessionInfo(prevInfo => ({
        ...prevInfo,
        lastError: error.message,
        errorTime: new Date()
      }));
    }
  };

  // Send a message to the model
  function sendClientEvent(message) {
    if (dataChannel) {
      const timestamp = new Date().toLocaleTimeString();
      message.event_id = message.event_id || crypto.randomUUID();

      // send event before setting timestamp since the backend peer doesn't expect this field
      dataChannel.send(JSON.stringify(message));

      // if guard just in case the timestamp exists by miracle
      if (!message.timestamp) {
        message.timestamp = timestamp;
      }
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  }

  // Send a text message to the model
  function sendTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    // Add user message to messages state immediately
    const userMessage = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      speaker: "user",
      content: message,
      metadata: {
        eventType: "user_input"
      }
    };
    setMessages(prev => [...prev, userMessage]);
    updateConversationContext(userMessage);

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  // Handle message clicks in the new interface
  const handleMessageClick = (message) => {
    console.log('Message clicked:', message);
    // TODO: Implement message interaction features
  };

  // Handle financial term clicks
  const handleFinancialTermClick = (term, context) => {
    console.log('Financial term clicked:', term, context);
    // TODO: Show financial term definition or related information
  };

  // Handle financial number clicks
  const handleFinancialNumberClick = (number, context) => {
    console.log('Financial number clicked:', number, context);
    // TODO: Show calculation details or related financial data
  };

  // Handle contextual panel actions
  const handlePanelAction = (panelId, actionId, data) => {
    console.log('Panel action:', panelId, actionId, data);
    // TODO: Implement panel-specific actions
  };

  // Handle contextual panel close
  const handlePanelClose = (panelId) => {
    console.log('Panel closed:', panelId);
    setConversationContext(prev => prev.filter(item => item.id !== panelId));
  };

  // Connection monitoring and automatic recovery
  useEffect(() => {
    if (isSessionActive && peerConnection.current) {
      const monitorConnection = setInterval(() => {
        const pc = peerConnection.current;
        if (pc) {
          const connectionState = pc.connectionState;
          const iceConnectionState = pc.iceConnectionState;
          
          // Update session info with current connection status
          setSessionInfo(prevInfo => ({
            ...prevInfo,
            connectionState,
            iceConnectionState,
            lastConnectionCheck: new Date()
          }));

          // Handle connection failures
          if (connectionState === 'failed' || iceConnectionState === 'failed') {
            console.error('Connection failed, attempting to stop session');
            clearInterval(monitorConnection);
            stopSession();
          }

          // Handle disconnected state
          if (connectionState === 'disconnected') {
            console.warn('Connection disconnected');
            setSessionInfo(prevInfo => ({
              ...prevInfo,
              lastDisconnection: new Date()
            }));
          }
        }
      }, 5000); // Check every 5 seconds

      // Cleanup interval on unmount or session end
      return () => {
        clearInterval(monitorConnection);
      };
    }
  }, [isSessionActive]);

  // Session timeout monitoring
  useEffect(() => {
    if (isSessionActive) {
      const timeoutCheck = setInterval(() => {
        const now = new Date();
        const lastActivity = sessionInfo.lastActivity;
        
        if (lastActivity) {
          const timeSinceActivity = now - lastActivity;
          const timeoutThreshold = 5 * 60 * 1000; // 5 minutes
          
          if (timeSinceActivity > timeoutThreshold) {
            console.warn('Session timeout due to inactivity');
            setSessionInfo(prevInfo => ({
              ...prevInfo,
              lastError: 'Session timeout due to inactivity',
              errorTime: new Date()
            }));
            stopSession();
          }
        }
      }, 30000); // Check every 30 seconds

      return () => {
        clearInterval(timeoutCheck);
      };
    }
  }, [isSessionActive, sessionInfo.lastActivity]);

  // Enhanced event processing with error handling and fallback states
  const processEventToMessage = (event) => {
    try {
      // Handle conversation item creation
      if (event.type === "conversation.item.created" && event.item?.content) {
        const content = event.item.content[0];
        if (content?.type === "input_text" || content?.type === "text") {
          return {
            id: event.item.id || crypto.randomUUID(),
            timestamp: new Date(event.timestamp || Date.now()),
            speaker: event.item.role === "user" ? "user" : "ai",
            content: content.text || content.transcript || "",
            confidence: content.confidence || 1.0,
            metadata: {
              eventType: event.type,
              itemType: event.item?.type,
              processed: true
            }
          };
        }
      }
      
      // Handle real-time transcript updates
      if (event.type === "response.audio_transcript.delta" && event.delta) {
        setCurrentTranscript(prev => {
          const newTranscript = prev + event.delta;
          // Update session info with current transcript length
          setSessionInfo(prevInfo => ({
            ...prevInfo,
            currentTranscriptLength: newTranscript.length,
            lastActivity: new Date()
          }));
          return newTranscript;
        });
      }
      
      // Handle completed transcript
      if (event.type === "response.audio_transcript.done" && event.transcript) {
        const message = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          speaker: "ai",
          content: event.transcript,
          confidence: 1.0,
          metadata: {
            eventType: event.type,
            processed: true
          }
        };
        setMessages(prev => [...prev, message]);
        setCurrentTranscript('');
        
        // Update session statistics
        setSessionInfo(prevInfo => ({
          ...prevInfo,
          messageCount: (prevInfo.messageCount || 0) + 1,
          lastActivity: new Date()
        }));
        
        return message;
      }

      // Handle input audio buffer events for better state tracking
      if (event.type === "input_audio_buffer.committed") {
        setSessionInfo(prevInfo => ({
          ...prevInfo,
          lastUserInput: new Date(),
          inputBufferCommitted: true
        }));
      }

      // Handle response creation events
      if (event.type === "response.created") {
        setSessionInfo(prevInfo => ({
          ...prevInfo,
          responseInProgress: true,
          lastResponseStart: new Date()
        }));
      }

      // Handle response completion
      if (event.type === "response.done") {
        setSessionInfo(prevInfo => ({
          ...prevInfo,
          responseInProgress: false,
          lastResponseEnd: new Date()
        }));
      }

    } catch (error) {
      console.error('Error processing event to message:', error, event);
      // Return error message for debugging
      return {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        speaker: "system",
        content: `Error processing event: ${event.type}`,
        metadata: {
          eventType: event.type,
          error: error.message,
          processed: false
        }
      };
    }

    return null;
  };

  // Update conversation context based on messages
  const updateConversationContext = (newMessage) => {
    if (newMessage && newMessage.content) {
      // Extract financial terms and context
      const financialTerms = extractFinancialTerms(newMessage.content);
      const calculations = extractCalculations(newMessage.content);
      
      if (financialTerms.length > 0 || calculations.length > 0) {
        const contextItem = {
          id: crypto.randomUUID(),
          type: 'financial',
          title: 'Financial Context',
          content: {
            terms: financialTerms,
            calculations: calculations,
            message: newMessage.content
          },
          relevanceScore: 0.8,
          timestamp: new Date()
        };
        
        setConversationContext(prev => [contextItem, ...prev.slice(0, 9)]);
      }
    }
  };

  // Simple financial term extraction
  const extractFinancialTerms = (text) => {
    const financialKeywords = [
      'portfolio', 'investment', 'stock', 'bond', 'dividend', 'return', 'risk',
      'asset', 'liability', 'equity', 'debt', 'savings', 'retirement', '401k',
      'IRA', 'mutual fund', 'ETF', 'market', 'bull', 'bear', 'volatility'
    ];
    
    return financialKeywords.filter(term => 
      text.toLowerCase().includes(term.toLowerCase())
    );
  };

  // Simple calculation extraction
  const extractCalculations = (text) => {
    const calculations = [];
    const percentageRegex = /(\d+(?:\.\d+)?)\s*%/g;
    const dollarRegex = /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
    
    let match;
    while ((match = percentageRegex.exec(text)) !== null) {
      calculations.push({ type: 'percentage', value: match[1], text: match[0] });
    }
    
    while ((match = dollarRegex.exec(text)) !== null) {
      calculations.push({ type: 'currency', value: match[1], text: match[0] });
    }
    
    return calculations;
  };

  // Enhanced event listeners with error handling and connection monitoring
  useEffect(() => {
    if (dataChannel) {
      // Message event handler with error handling
      const handleMessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          if (!event.timestamp) {
            event.timestamp = new Date().toLocaleTimeString();
          }

          // Enhanced speaking state tracking with error handling
          try {
            if (event.type === "input_audio_buffer.speech_started") {
              setIsUserSpeaking(true);
              setSessionInfo(prevInfo => ({
                ...prevInfo,
                userSpeakingStarted: new Date(),
                lastActivity: new Date()
              }));
            } else if (event.type === "input_audio_buffer.speech_stopped") {
              setIsUserSpeaking(false);
              setSessionInfo(prevInfo => ({
                ...prevInfo,
                userSpeakingStopped: new Date(),
                lastActivity: new Date()
              }));
            } else if (event.type === "response.audio.delta") {
              setIsAISpeaking(true);
              setSessionInfo(prevInfo => ({
                ...prevInfo,
                aiSpeakingStarted: prevInfo.aiSpeakingStarted || new Date(),
                lastActivity: new Date()
              }));
            } else if (event.type === "response.audio.done" || event.type === "response.done") {
              setIsAISpeaking(false);
              setSessionInfo(prevInfo => ({
                ...prevInfo,
                aiSpeakingStopped: new Date(),
                lastActivity: new Date()
              }));
            }

            // Handle error events
            if (event.type === "error") {
              console.error('Received error event:', event);
              setSessionInfo(prevInfo => ({
                ...prevInfo,
                lastError: event.error?.message || 'Unknown error',
                errorTime: new Date()
              }));
            }

            // Handle session update events
            if (event.type === "session.updated") {
              setSessionInfo(prevInfo => ({
                ...prevInfo,
                sessionUpdated: new Date(),
                sessionConfig: event.session
              }));
            }

          } catch (stateError) {
            console.error('Error updating speaking states:', stateError);
          }

          // Process event into message for new interface with error handling
          try {
            const message = processEventToMessage(event);
            if (message) {
              updateConversationContext(message);
            }
          } catch (messageError) {
            console.error('Error processing event to message:', messageError);
          }

          // Always add to events list for debugging
          setEvents((prev) => [event, ...prev]);

        } catch (parseError) {
          console.error('Error parsing event data:', parseError, e.data);
          setSessionInfo(prevInfo => ({
            ...prevInfo,
            lastError: 'Failed to parse event data',
            errorTime: new Date()
          }));
        }
      };

      // Connection open handler
      const handleOpen = () => {
        console.log('Data channel opened');
        setIsSessionActive(true);
        setEvents([]);
        setMessages([]);
        setCurrentTranscript('');
        setConversationContext([]);
        setSessionInfo({
          startTime: new Date(),
          status: 'active',
          connectionState: 'open',
          messageCount: 0,
          errorCount: 0
        });
      };

      // Connection close handler
      const handleClose = () => {
        console.log('Data channel closed');
        setIsSessionActive(false);
        setIsUserSpeaking(false);
        setIsAISpeaking(false);
        setCurrentTranscript('');
        setSessionInfo(prevInfo => ({
          ...prevInfo,
          status: 'closed',
          connectionState: 'closed',
          endTime: new Date()
        }));
      };

      // Connection error handler
      const handleError = (error) => {
        console.error('Data channel error:', error);
        setSessionInfo(prevInfo => ({
          ...prevInfo,
          lastError: 'Data channel error',
          errorTime: new Date(),
          errorCount: (prevInfo.errorCount || 0) + 1
        }));
      };

      // Attach event listeners
      dataChannel.addEventListener("message", handleMessage);
      dataChannel.addEventListener("open", handleOpen);
      dataChannel.addEventListener("close", handleClose);
      dataChannel.addEventListener("error", handleError);

      // Cleanup function
      return () => {
        dataChannel.removeEventListener("message", handleMessage);
        dataChannel.removeEventListener("open", handleOpen);
        dataChannel.removeEventListener("close", handleClose);
        dataChannel.removeEventListener("error", handleError);
      };
    }
  }, [dataChannel]);

  // Show test component if in test mode
  if (showVisualizerTest) {
    return <VoiceVisualizerEnhancedTest />;
  }

  if (showConversationTest) {
    return <ConversationDisplayTest />;
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0zMCAzMG0tMiAwYTIgMiAwIDEgMCA0IDAgMiAyIDAgMSAwLTQgMHoiIGZpbGw9IiM0ZmMzZjcxMCIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-20"></div>
      
      {/* Main container */}
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <header className="glass p-4 border-b border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <feather.DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">WealthWise AI</h1>
                <p className="text-sm text-gray-300">Your Personal Financial Advisor</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setUseNewVoiceInterface(!useNewVoiceInterface)}
                className={`px-3 py-1 text-white text-sm rounded-lg transition-all ${
                  useNewVoiceInterface 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {useNewVoiceInterface ? 'New UI' : 'Legacy UI'}
              </button>
              <button
                onClick={() => setShowVisualizerTest(true)}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-all"
              >
                Test Audio Viz
              </button>
              <button
                onClick={() => setShowConversationTest(true)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all"
              >
                Test Conversation
              </button>
              <div className="flex items-center gap-2">
                <feather.TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-300">Markets Open</span>
              </div>
              <div className="flex items-center gap-2">
                <feather.BarChart2 className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-gray-300">Real-time Analysis</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <div className="flex-1 p-4 overflow-hidden">
          {useNewVoiceInterface ? (
            /* New Voice Interface */
            <ResponsiveLayout>
              <VoiceInterface
                isSessionActive={isSessionActive}
                isUserSpeaking={isUserSpeaking}
                isAISpeaking={isAISpeaking}
                events={events}
                messages={messages}
                currentTranscript={currentTranscript}
                conversationContext={conversationContext}
                financialData={financialData}
                sessionInfo={sessionInfo}
                enableFinancialHighlighting={true}
                onSessionControl={handleSessionControl}
                onTextMessage={sendTextMessage}
                onMessageClick={handleMessageClick}
                onFinancialTermClick={handleFinancialTermClick}
                onFinancialNumberClick={handleFinancialNumberClick}
                onPanelAction={handlePanelAction}
                onPanelClose={handlePanelClose}
              />
            </ResponsiveLayout>
          ) : (
            /* Legacy Interface */
            <>
              {/* Voice Visualizer */}
              <div className="glass mb-4 rounded-lg p-4">
                <VoiceVisualizer 
                  isActive={isSessionActive} 
                  isUserSpeaking={isUserSpeaking}
                  isAISpeaking={isAISpeaking}
                  isProcessing={false}
                  visualizationStyle={visualizationStyle}
                />
              </div>

              <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Chat/Event area */}
                <div className="flex-1 glass rounded-lg flex flex-col">
                  <div className="flex-1 p-4 overflow-y-auto">
                    <EventLog events={events} />
                  </div>
                  <div className="p-4 border-t border-white/10">
                    <SessionControls
                      startSession={startSession}
                      stopSession={stopSession}
                      sendClientEvent={sendClientEvent}
                      sendTextMessage={sendTextMessage}
                      events={events}
                      isSessionActive={isSessionActive}
                    />
                  </div>
                </div>

                {/* Tools/Features panel */}
                <div className="w-96 glass rounded-lg p-4 overflow-y-auto">
                  <ToolPanel
                    sendClientEvent={sendClientEvent}
                    sendTextMessage={sendTextMessage}
                    events={events}
                    isSessionActive={isSessionActive}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}