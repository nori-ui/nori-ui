import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Alias react-native → react-native-web so imports from `unbogify-ui` and
// `lucide-react-native` resolve to web-compatible components.
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: [
            { find: /^react-native$/, replacement: 'react-native-web' },
            { find: /^react-native\/(.*)$/, replacement: 'react-native-web/$1' },
        ],
    },
    server: {
        port: 5173,
    },
    // Let Vite prebundle workspace packages to speed up cold starts.
    optimizeDeps: {
        include: ['unbogify-ui', 'unbogify-ui/client', '@unbogify/tokens'],
    },
    build: {
        outDir: path.resolve(__dirname, 'dist'),
        emptyOutDir: true,
    },
});
