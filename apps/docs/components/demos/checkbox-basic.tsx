import { Checkbox, VStack } from '@nori-ui/core';

export default function CheckboxBasic() {
    return (
        <VStack gap={3}>
            <Checkbox label="I agree to the terms" />
            <Checkbox label="Send me updates" defaultChecked />
            <Checkbox label="Indeterminate" indeterminate />
        </VStack>
    );
}
