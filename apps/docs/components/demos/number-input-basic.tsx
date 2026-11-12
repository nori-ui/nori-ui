import { Field, NumberInput } from '@nori-ui/core';
import { useState } from 'react';

export default function NumberInputBasic() {
    const [guests, setGuests] = useState<number | null>(2);

    return (
        <Field label="Guests" description="Between 1 and 8.">
            <NumberInput value={guests} onChange={setGuests} min={1} max={8} />
        </Field>
    );
}
