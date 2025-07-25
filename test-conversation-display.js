import { createRoot } from 'react-dom/client';
import ConversationDisplayTest from './client/components/ConversationDisplayTest.jsx';

// Create root element
const container = document.getElementById('root');
const root = createRoot(container);

// Render the test component
root.render(<ConversationDisplayTest />);

console.log('ConversationDisplay test loaded successfully!');