import { createRoot } from 'react-dom/client';
import VoiceControlsTest from './client/components/VoiceControlsTest.jsx';
import './client/base.css';
import './client/styles/voice-controls.css';

// Create root and render the test component
const container = document.getElementById('root');
const root = createRoot(container);

root.render(<VoiceControlsTest />);

console.log('Voice Controls Test loaded successfully!');