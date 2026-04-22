import type { Preview } from '@storybook/react';
import '../src/styles.css';

const preview: Preview = {
    parameters: {
        layout: 'padded',
        backgrounds: {
            default: 'light',
            values: [
                { name: 'light', value: '#ffffff' },
                { name: 'dark', value: '#18181b' },
            ],
        },
        a11y: { disable: false },
    },
};

export default preview;
