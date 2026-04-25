import { Box, HStack, Text } from '@nori-ui/core';

export default function HStackBasic() {
    return (
        <HStack gap={4}>
            <Box className="p-3 bg-primary-100 rounded-md">
                <Text>A</Text>
            </Box>
            <Box className="p-3 bg-primary-200 rounded-md">
                <Text>B</Text>
            </Box>
            <Box className="p-3 bg-primary-300 rounded-md">
                <Text>C</Text>
            </Box>
        </HStack>
    );
}
