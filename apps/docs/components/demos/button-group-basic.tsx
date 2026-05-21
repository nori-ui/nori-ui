import { Button, ButtonGroup, VStack } from '@nori-ui/core';

export default function ButtonGroupBasic() {
    return (
        <VStack gap={4} align="start">
            <ButtonGroup>
                <Button variant="secondary">Day</Button>
                <Button variant="secondary">Week</Button>
                <Button variant="secondary">Month</Button>
            </ButtonGroup>
            <ButtonGroup orientation="vertical">
                <Button variant="secondary">Top</Button>
                <Button variant="secondary">Middle</Button>
                <Button variant="secondary">Bottom</Button>
            </ButtonGroup>
        </VStack>
    );
}
