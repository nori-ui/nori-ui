'use client';

import { InputGroup } from '@nori-ui/core';

export default function InputGroupBoth() {
    return (
        <InputGroup>
            <InputGroup.Addon>https://</InputGroup.Addon>
            <InputGroup.Input defaultValue="example" />
            <InputGroup.Addon>.com</InputGroup.Addon>
        </InputGroup>
    );
}
