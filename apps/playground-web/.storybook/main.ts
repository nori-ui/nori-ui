import type { StorybookConfig } from '@storybook/react-vite';

// STORYBOOK_BASE_PATH is set only by the production subpath build
// (build:storybook:prod) so every asset URL resolves under
// nori-ui.com/storybook. Local `yarn storybook` leaves it unset, so dev
// stays at http://localhost:6006/ with no /storybook prefix.
const basePath = process.env.STORYBOOK_BASE_PATH;

const config: StorybookConfig = {
    stories: ['../../../packages/core/src/**/*.stories.@(ts|tsx)'],
    addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
    framework: {
        name: '@storybook/react-vite',
        options: {},
    },
    docs: { autodocs: 'tag' },
    typescript: { check: false },
    viteFinal: (cfg) => {
        if (basePath) {
            cfg.base = basePath;
        }
        return cfg;
    },
};

export default config;
