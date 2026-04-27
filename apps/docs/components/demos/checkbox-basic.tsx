'use client';

import { Checkbox, VStack } from '@nori-ui/core';
import { useState } from 'react';

export default function CheckboxBasic() {
    const [agreed, setAgreed] = useState(false);
    const [updates, setUpdates] = useState(true);
    return (
        <VStack gap={3}>
            <Checkbox label="I agree to the terms" checked={agreed} onChange={setAgreed} />
            <Checkbox label="Send me updates" checked={updates} onChange={setUpdates} />
        </VStack>
    );
}
