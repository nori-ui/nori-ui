import { Slider, Text, VStack } from '@nori-ui/core';

export default function SliderDisabled() {
    return (
        <VStack gap={3}>
            <Text>Disabled — interaction blocked, lower-contrast track + thumb</Text>
            <Slider defaultValue={[50]} disabled aria-label="Locked volume" />
        </VStack>
    );
}
