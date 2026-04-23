import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StyleSheet } from 'react-native';
import { App } from './App';
import './styles.css';

// NativeWind defaults dark-mode to 'media'. Setting it to 'class' silences
// the runtime warning and aligns with our tokens preset's darkMode: ['class', ...].
// Cast: RN-Web's StyleSheet type doesn't include NativeWind's extension.
(StyleSheet as unknown as { setFlag?: (name: string, value: string) => void }).setFlag?.('darkMode', 'class');

const el = document.getElementById('root');
if (!el) throw new Error('#root not found');

createRoot(el).render(
    <StrictMode>
        <App />
    </StrictMode>
);
