'use client';

import { ToggleGroup, ToggleGroupItem } from '@nori-ui/core';
import { useState } from 'react';

export default function ToggleGroupSingle() {
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
