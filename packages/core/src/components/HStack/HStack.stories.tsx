import type { Meta, StoryObj } from '@storybook/react';
import { useThemeColors } from '../../theme/use-theme-colors';
import { Text } from '../Text';
import { HStack } from './HStack';

// className-based bg colors don't reliably reach react-native-web's style
// pipeline on the native side (NativeWind's className → style transform
// isn't always wired in tests/storybook). Inline-styled themed chips work
// on both platforms and double as a token-usage demo.
function Chip({ label, tone }: { label: string; tone: 'primary' | 'subtle' | 'muted' }) {
    const colors = useThemeColors();
    const bg =
        tone === 'primary'
            ? colors.semantic.interactive.primary
            : tone === 'subtle'
              ? colors.semantic.background.subtle
              : colors.semantic.border.default;
    const fg = tone === 'primary' ? colors.semantic.text.inverted : colors.semantic.text.default;
    return (
        <Text
            style={{
                backgroundColor: bg,
                color: fg,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 6,
                overflow: 'hidden',
            }}
        >
            {label}
        </Text>
    );
}

const meta: Meta<typeof HStack> = {
    title: 'Primitives/HStack',
    component: HStack,
    render: (args) => (
        <HStack {...args}>
            <Chip label="A" tone="primary" />
            <Chip label="B" tone="subtle" />
            <Chip label="C" tone="muted" />
        </HStack>
    ),
};
export default meta;

export const Default: StoryObj<typeof HStack> = {};
export const WithGap: StoryObj<typeof HStack> = { args: { gap: 4 } };
export const Between: StoryObj<typeof HStack> = {
    args: { gap: 2, justify: 'between', className: 'w-full' },
};
