import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
// Raw react-native Text inside ToggleGroupItem — `nori-ui/Text` sets its
// own color from theme tokens, which overrides the textColor inherited
// from ToggleVisual's wrapping RNText (and so the on-state inverted color
// never reaches the formatting glyph). Plain RN Text inherits color
// transparently from its parent Text.
import { Text as RNText } from 'react-native';
import { Text } from '../Text';
import { VStack } from '../VStack';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle.Group> = {
    title: 'Controls/ToggleGroup',
    component: Toggle.Group,
};
export default meta;
type Story = StoryObj<typeof Toggle.Group>;

function Alignment() {
    const [align, setAlign] = useState<string | undefined>('left');
    return (
        <Toggle.Group type="single" value={align} onChange={setAlign} aria-label="Text alignment">
            <Toggle.Item value="left" aria-label="Align left">
                Left
            </Toggle.Item>
            <Toggle.Item value="center" aria-label="Align center">
                Center
            </Toggle.Item>
            <Toggle.Item value="right" aria-label="Align right">
                Right
            </Toggle.Item>
        </Toggle.Group>
    );
}

function TextFormatting() {
    // Classic Bold/Italic/Underline triplet — the canonical multi-select
    // toggle pattern, lifted from any rich-text editor toolbar.
    const [marks, setMarks] = useState<string[]>(['bold']);
    const has = (m: string) => marks.includes(m);
    return (
        <VStack gap={3}>
            <Toggle.Group type="multiple" value={marks} onChange={setMarks} aria-label="Text formatting">
                <Toggle.Item value="bold" aria-label="Bold">
                    <RNText style={{ fontWeight: '700' }}>B</RNText>
                </Toggle.Item>
                <Toggle.Item value="italic" aria-label="Italic">
                    <RNText style={{ fontStyle: 'italic' }}>I</RNText>
                </Toggle.Item>
                <Toggle.Item value="underline" aria-label="Underline">
                    <RNText style={{ textDecorationLine: 'underline' }}>U</RNText>
                </Toggle.Item>
                <Toggle.Item value="strike" aria-label="Strikethrough">
                    <RNText style={{ textDecorationLine: 'line-through' }}>S</RNText>
                </Toggle.Item>
            </Toggle.Group>
            <Text
                style={{
                    fontWeight: has('bold') ? '700' : '400',
                    fontStyle: has('italic') ? 'italic' : 'normal',
                    textDecorationLine:
                        has('underline') && has('strike')
                            ? 'underline line-through'
                            : has('underline')
                              ? 'underline'
                              : has('strike')
                                ? 'line-through'
                                : 'none',
                }}
            >
                The quick brown fox jumps over the lazy dog.
            </Text>
        </VStack>
    );
}

function ViewMode() {
    const [view, setView] = useState<string | undefined>('grid');
    return (
        <VStack gap={2}>
            <Toggle.Group type="single" value={view} onChange={setView} aria-label="View mode">
                <Toggle.Item value="list" aria-label="List view">
                    List
                </Toggle.Item>
                <Toggle.Item value="grid" aria-label="Grid view">
                    Grid
                </Toggle.Item>
                <Toggle.Item value="gallery" aria-label="Gallery view">
                    Gallery
                </Toggle.Item>
            </Toggle.Group>
            <Text>Active: {view ?? 'none'}</Text>
        </VStack>
    );
}

export const Single: Story = { render: () => <Alignment /> };
export const Formatting: Story = { name: 'Text formatting (B/I/U/S)', render: () => <TextFormatting /> };
export const ViewSwitcher: Story = { name: 'View mode (single)', render: () => <ViewMode /> };
