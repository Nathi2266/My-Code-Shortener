import { Box, Heading, Text, VStack } from '@chakra-ui/react';

const Analysis = () => {
  return (
    <Box>
      <Heading mb={6}>Code Analysis</Heading>
      <VStack spacing={4} align="stretch">
        <Box p={4} borderWidth={1} borderRadius="md">
          <Heading size="md">Function Summary</Heading>
          <Text mt={2}>No analysis available yet. Run some code first!</Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default Analysis;
