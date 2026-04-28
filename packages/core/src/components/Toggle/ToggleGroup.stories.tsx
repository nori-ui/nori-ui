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
import { ToggleGroup, ToggleGroupItem } from './Toggle';

const meta: Meta<typeof ToggleGroup> = {
    title: 'Controls/ToggleGroup',
    component: ToggleGroup,
};
export default meta;
type Story = StoryObj<typeof ToggleGroup>;

function Alignment() {
    const [align, setAlign] = useState<string | undefined>('left');
    return (
        <ToggleGroup type="single" value={align} onValueChange={setAlign} aria-label="Text alignment">
            <ToggleGroupItem value="left" aria-label="Align left">
                Left
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align center">
                Center
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align right">
                Right
            </ToggleGroupItem>
        </ToggleGroup>
    );
}

function TextFormatting() {
    // Classic Bold/Italic/Underline triplet — the canonical multi-select
    // toggle pattern, lifted from any rich-text editor toolbar.
    const [marks, setMarks] = useState<string[]>(['bold']);
    const has = (m: string) => marks.includes(m);
    return (
        <VStack gap={3}>
            <ToggleGroup type="multiple" value={marks} onValueChange={setMarks} aria-label="Text formatting">
                <ToggleGroupItem value="bold" aria-label="Bold">
                    <RNText style={{ fontWeight: '700' }}>B</RNText>
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="Italic">
                    <RNText style={{ fontStyle: 'italic' }}>I</RNText>
                </ToggleGroupItem>
                <ToggleGroupItem value="underline" aria-label="Underline">
                    <RNText style={{ textDecorationLine: 'underline' }}>U</RNText>
                </ToggleGroupItem>
                <ToggleGroupItem value="strike" aria-label="Strikethrough">
                    <RNText style={{ textDecorationLine: 'line-through' }}>S</RNText>
                </ToggleGroupItem>
            </ToggleGroup>
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
            <ToggleGroup type="single" value={view} onValueChange={setView} aria-label="View mode">
                <ToggleGroupItem value="list" aria-label="List view">
                    List
                </ToggleGroupItem>
                <ToggleGroupItem value="grid" aria-label="Grid view">
                    Grid
                </ToggleGroupItem>
                <ToggleGroupItem value="gallery" aria-label="Gallery view">
                    Gallery
                </ToggleGroupItem>
            </ToggleGroup>
            <Text>Active: {view ?? 'none'}</Text>
        </VStack>
    );
}

export const Single: Story = { render: () => <Alignment /> };
export const Formatting: Story = { name: 'Text formatting (B/I/U/S)', render: () => <TextFormatting /> };
export const ViewSwitcher: Story = { name: 'View mode (single)', render: () => <ViewMode /> };
