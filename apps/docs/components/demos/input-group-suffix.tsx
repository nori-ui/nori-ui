'use client';

import { InputGroup } from '@nori-ui/core';

export default function InputGroupSuffix() {
    return (
        <InputGroup>
            <InputGroup.Input placeholder="amount" />
            <InputGroup.Addon>USD</InputGroup.Addon>
        </InputGroup>
    );
}
