import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
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
                    <Text style={{ fontWeight: '700' }}>B</Text>
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="Italic">
                    <Text style={{ fontStyle: 'italic' }}>I</Text>
                </ToggleGroupItem>
                <ToggleGroupItem value="underline" aria-label="Underline">
                    <Text style={{ textDecorationLine: 'underline' }}>U</Text>
                </ToggleGroupItem>
                <ToggleGroupItem value="strike" aria-label="Strikethrough">
                    <Text style={{ textDecorationLine: 'line-through' }}>S</Text>
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
