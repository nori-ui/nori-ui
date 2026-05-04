import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Platform, Text as RNText, View } from 'react-native';
import { FloatButton } from './FloatButton';

const meta: Meta<typeof FloatButton> = {
    title: 'Actions/FloatButton',
    component: FloatButton,
};
export default meta;
type Story = StoryObj<typeof FloatButton>;

// Tiny cross-platform icons (SVG on web, glyph on native) so the stories
// render cleanly in both Storybook and the native playground.
function makeGlyph(svgPath: string, glyph: string, ariaLabel: string) {
    return function Icon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
        if (Platform.OS === 'web') {
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-label={ariaLabel}
                >
                    <title>{ariaLabel}</title>
                    <path d={svgPath} />
                </svg>
            );
        }
        return <RNText style={{ fontSize: size, color, lineHeight: size * 1.05 }}>{glyph}</RNText>;
    };
}

const PlusIcon = makeGlyph('M12 5v14M5 12h14', '+', 'Add');
const HelpIcon = makeGlyph('M12 17h.01M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', '?', 'Help');
const StarIcon = makeGlyph(
    'M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26z',
    '★',
    'Favorite'
);
const ChatIcon = makeGlyph('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', '💬', 'Chat');
const ShareIcon = makeGlyph('M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13', '↗', 'Share');

/** Default circular FAB at medium size. */
export const Basic: Story = {
    render: () => (
        <View style={{ height: 280 }}>
            <FloatButton accessibilityLabel="Add new" icon={<PlusIcon />} />
        </View>
    ),
};

/** Three sizes side-by-side (rendered inline rather than fixed for showcase). */
export const Sizes: Story = {
    parameters: { platforms: ['web'] },
    render: () => (
        <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center', padding: 16 }}>
            <FloatButton
                size="small"
                placement="top-left"
                offset={{ x: 0, y: 0 }}
                accessibilityLabel="sm"
                icon={<PlusIcon size={16} />}
            />
            <FloatButton
                size="medium"
                placement="top-left"
                offset={{ x: 64, y: 0 }}
                accessibilityLabel="md"
                icon={<PlusIcon />}
            />
            <FloatButton
                size="large"
                placement="top-left"
                offset={{ x: 144, y: 0 }}
                accessibilityLabel="lg"
                icon={<PlusIcon size={24} />}
            />
        </View>
    ),
};

/** All four variants. */
export const Variants: Story = {
    parameters: { platforms: ['web'] },
    render: () => (
        <View style={{ flexDirection: 'row', gap: 16, padding: 16 }}>
            <FloatButton
                variant="primary"
                placement="top-left"
                offset={{ x: 16, y: 16 }}
                accessibilityLabel="primary"
                icon={<PlusIcon />}
            />
            <FloatButton
                variant="secondary"
                placement="top-left"
                offset={{ x: 88, y: 16 }}
                accessibilityLabel="secondary"
                icon={<PlusIcon />}
            />
            <FloatButton
                variant="tertiary"
                placement="top-left"
                offset={{ x: 160, y: 16 }}
                accessibilityLabel="tertiary"
                icon={<PlusIcon />}
            />
            <FloatButton
                variant="surface"
                placement="top-left"
                offset={{ x: 232, y: 16 }}
                accessibilityLabel="surface"
                icon={<PlusIcon />}
            />
        </View>
    ),
};

/** Extended pill with an inline label. */
export const Extended: Story = {
    render: () => (
        <View style={{ height: 240 }}>
            <FloatButton shape="extended" icon={<PlusIcon />} label="New project" accessibilityLabel="New project" />
        </View>
    ),
};

/** Square FAB — AntD parity. */
export const Square: Story = {
    render: () => (
        <View style={{ height: 240 }}>
            <FloatButton shape="square" icon={<HelpIcon />} accessibilityLabel="Help" />
        </View>
    ),
};

/** Numeric badge in the top-right corner. */
export const WithBadge: Story = {
    render: () => (
        <View style={{ height: 240 }}>
            <FloatButton icon={<ChatIcon />} accessibilityLabel="Chat" badge={{ count: 12 }} />
        </View>
    ),
};

/** Loading state — spinner replaces the icon, presses are suppressed. */
export const Loading: Story = {
    render: () => (
        <View style={{ height: 240 }}>
            <FloatButton icon={<PlusIcon />} accessibilityLabel="Saving" loading />
        </View>
    ),
};

/** Group of actions with a stacked vertical expansion. */
export const GroupVertical: Story = {
    render: () => {
        function Demo() {
            return (
                <View style={{ height: 360 }}>
                    <FloatButton.Group icon={<PlusIcon />} accessibilityLabel="More actions">
                        <FloatButton icon={<ChatIcon size={16} />} accessibilityLabel="Chat" tooltip="Chat" />
                        <FloatButton icon={<StarIcon size={16} />} accessibilityLabel="Favorite" tooltip="Favorite" />
                        <FloatButton icon={<ShareIcon size={16} />} accessibilityLabel="Share" tooltip="Share" />
                    </FloatButton.Group>
                </View>
            );
        }
        return <Demo />;
    },
};

/** Group declared via `actions` array — same shape under the hood. */
export const GroupActionsArray: Story = {
    render: () => (
        <View style={{ height: 360 }}>
            <FloatButton.Group
                icon={<PlusIcon />}
                accessibilityLabel="More actions"
                actions={[
                    { icon: <ChatIcon size={16} />, accessibilityLabel: 'Chat', tooltip: 'Chat' },
                    { icon: <StarIcon size={16} />, accessibilityLabel: 'Favorite', tooltip: 'Favorite' },
                    { icon: <ShareIcon size={16} />, accessibilityLabel: 'Share', tooltip: 'Share' },
                ]}
            />
        </View>
    ),
};

/** Group with a backdrop / scrim that closes on tap. */
export const GroupBackdrop: Story = {
    render: () => (
        <View style={{ height: 360 }}>
            <FloatButton.Group icon={<PlusIcon />} accessibilityLabel="More actions" backdrop>
                <FloatButton icon={<ChatIcon size={16} />} accessibilityLabel="Chat" tooltip="Chat" />
                <FloatButton icon={<StarIcon size={16} />} accessibilityLabel="Favorite" tooltip="Favorite" />
            </FloatButton.Group>
        </View>
    ),
};

/** Controlled group state. */
export const GroupControlled: Story = {
    render: () => {
        function Demo() {
            const [open, setOpen] = useState(false);
            return (
                <View style={{ height: 360 }}>
                    <FloatButton.Group icon={<PlusIcon />} accessibilityLabel="More" open={open} onOpenChange={setOpen}>
                        <FloatButton icon={<ChatIcon size={16} />} accessibilityLabel="Chat" />
                        <FloatButton icon={<StarIcon size={16} />} accessibilityLabel="Favorite" />
                    </FloatButton.Group>
                </View>
            );
        }
        return <Demo />;
    },
};

/**
 * BackToTop preset — fades in once you've scrolled past the threshold.
 * On web it auto-binds to window.scroll. The story uses a tall spacer so
 * you can scroll the canvas to see it appear.
 */
export const BackToTop: Story = {
    parameters: { platforms: ['web'] },
    render: () => (
        <View style={{ height: 1600 }}>
            <RNText style={{ padding: 16 }}>Scroll the canvas down to see the Back-to-top button.</RNText>
            <FloatButton.BackToTop visibilityThreshold={200} />
        </View>
    ),
};
