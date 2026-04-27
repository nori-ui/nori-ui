'use client';

import { InputGroup, InputGroupAddon, InputGroupInput } from '@nori-ui/core';

export default function InputGroupSuffix() {
    return (
        <InputGroup>
            <InputGroupInput placeholder="amount" />
            <InputGroupAddon>USD</InputGroupAddon>
        </InputGroup>
    );
}
