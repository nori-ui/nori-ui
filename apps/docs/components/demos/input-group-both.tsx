'use client';

import { InputGroup, InputGroupAddon, InputGroupInput } from '@nori-ui/core';

export default function InputGroupBoth() {
    return (
        <InputGroup>
            <InputGroupAddon>https://</InputGroupAddon>
            <InputGroupInput defaultValue="example" />
            <InputGroupAddon>.com</InputGroupAddon>
        </InputGroup>
    );
}
