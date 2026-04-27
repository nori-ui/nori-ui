'use client';

import { ToggleGroup, ToggleGroupItem } from '@nori-ui/core';
import { useState } from 'react';

export default function ToggleGroupMultiple() {
    const [marks, setMarks] = useState<string[]>(['bold']);
    return (
        <ToggleGroup type="multiple" value={marks} onValueChange={setMarks} aria-label="Text formatting">
            <ToggleGroupItem value="bold" aria-label="Bold">
                <span style={{ fontWeight: 700 }}>B</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Italic">
                <span style={{ fontStyle: 'italic' }}>I</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Underline">
                <span style={{ textDecoration: 'underline' }}>U</span>
            </ToggleGroupItem>
        </ToggleGroup>
    );
}
