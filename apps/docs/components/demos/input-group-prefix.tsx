'use client';

import { InputGroup } from '@nori-ui/core';

export default function InputGroupPrefix() {
    return (
        <InputGroup>
            <InputGroup.Addon>@</InputGroup.Addon>
            <InputGroup.Input placeholder="username" />
        </InputGroup>
    );
}
