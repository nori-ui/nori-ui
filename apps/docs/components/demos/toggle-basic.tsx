'use client';

import { Toggle } from '@nori-ui/core';
import { useState } from 'react';

export default function ToggleBasic() {
    const [pinned, setPinned] = useState(false);
    return (
        <Toggle pressed={pinned} onPressedChange={setPinned} aria-label="Pin to top">
            {pinned ? 'Pinned' : 'Pin to top'}
        </Toggle>
    );
}
