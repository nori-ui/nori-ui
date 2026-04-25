import { Box, Text, VStack } from '@nori-ui/core';

export default function VStackBasic() {
    return (
        <VStack gap={4}>
            <Box className="p-3 bg-primary-100 rounded-md">
                <Text>A</Text>
            </Box>
            <Box className="p-3 bg-primary-200 rounded-md">
                <Text>B</Text>
            </Box>
            <Box className="p-3 bg-primary-300 rounded-md">
                <Text>C</Text>
            </Box>
        </VStack>
    );
}
