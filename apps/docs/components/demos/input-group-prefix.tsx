'use client';

import { InputGroup, InputGroupAddon, InputGroupInput } from '@nori-ui/core';

export default function InputGroupPrefix() {
    return (
        <InputGroup>
            <InputGroupAddon>@</InputGroupAddon>
            <InputGroupInput placeholder="username" />
        </InputGroup>
    );
}
