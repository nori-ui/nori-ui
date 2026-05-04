'use client';

import { Toggle } from '@nori-ui/core';
import { useState } from 'react';

export default function ToggleGroupMultiple() {
    const [marks, setMarks] = useState<string[]>(['bold']);
    return (
        <Toggle.Group type="multiple" value={marks} onValueChange={setMarks} aria-label="Text formatting">
            <Toggle.Item value="bold" aria-label="Bold">
                <span style={{ fontWeight: 700 }}>B</span>
            </Toggle.Item>
            <Toggle.Item value="italic" aria-label="Italic">
                <span style={{ fontStyle: 'italic' }}>I</span>
            </Toggle.Item>
            <Toggle.Item value="underline" aria-label="Underline">
                <span style={{ textDecoration: 'underline' }}>U</span>
            </Toggle.Item>
        </Toggle.Group>
    );
}
