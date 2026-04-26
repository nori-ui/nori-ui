import { Radio, RadioGroup } from '@nori-ui/core';

export default function RadioGroupBasic() {
    return (
        <RadioGroup defaultValue="standard" name="shipping">
            <Radio value="standard" label="Standard — 3-5 business days, free" />
            <Radio value="express" label="Express — 1-2 business days, $9" />
            <Radio value="overnight" label="Overnight — next morning, $24" />
        </RadioGroup>
    );
}
