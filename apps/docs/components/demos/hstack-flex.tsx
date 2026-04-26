import { Box, HStack, Text } from '@nori-ui/core';

export default function HStackFlex() {
    return (
        <HStack gap={2}>
            <Box flex={1} className="p-3 bg-primary-100 rounded-md">
                <Text>20%</Text>
            </Box>
            <Box flex={3} className="p-3 bg-primary-200 rounded-md">
                <Text>60%</Text>
            </Box>
            <Box flex={1} className="p-3 bg-primary-300 rounded-md">
                <Text>20%</Text>
            </Box>
        </HStack>
    );
}
