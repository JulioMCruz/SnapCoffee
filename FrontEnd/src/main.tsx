import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('🚀 Starting Snap Coffee Mini App...');

createRoot(document.getElementById("root")!).render(<App />);
