'use client';

import { Rating, Text, VStack } from '@nori-ui/core';
import { useState } from 'react';

export default function RatingBasic() {
    const [value, setValue] = useState(3);
    return (
        <VStack gap={4}>
            <VStack gap={1}>
                <Rating value={value} onChange={setValue} allowClear aria-label="Rate this product" />
                <Text variant="body-sm">{value === 0 ? 'Not rated yet' : `You rated this ${value} out of 5`}</Text>
            </VStack>
            <Rating readOnly value={4.5} size="sm" />
        </VStack>
    );
}
