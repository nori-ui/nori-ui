// Smoke placeholder story — exists so Storybook + the playgrounds have
// something to render before Plan 05. Remove when Button lands.

import type { Meta, StoryObj } from '@storybook/react';
import { UnbogifyProvider, useTheme } from 'unbogify-ui/client';

function PlaceholderSmoke() {
    const theme = useTheme();
    return (
        <div data-testid="smoke" style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <strong>unbogify-ui smoke</strong>
            <div
                data-testid="smoke-swatch"
                style={{
                    width: 64,
                    height: 24,
                    marginTop: 8,
                    backgroundColor: theme.color.primary['500'],
                    borderRadius: 4,
                }}
            />
        </div>
    );
}

function WrappedSmoke() {
    return (
        <UnbogifyProvider>
            <PlaceholderSmoke />
        </UnbogifyProvider>
    );
}

const meta: Meta<typeof WrappedSmoke> = {
    title: 'Smoke/Placeholder',
    component: WrappedSmoke,
};

export default meta;

export const Default: StoryObj<typeof WrappedSmoke> = {};
