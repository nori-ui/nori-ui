'use client';

import { Toggle } from '@nori-ui/core';
import { useState } from 'react';

export default function ToggleGroupSingle() {
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
