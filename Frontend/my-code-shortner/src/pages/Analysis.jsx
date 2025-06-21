import { 
  Box, Heading, VStack, SimpleGrid, Stat, StatLabel, StatNumber,
  List, ListItem, ListIcon, Text, Button, useColorMode, Link
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, TimeIcon, InfoOutlineIcon } from '@chakra-ui/icons';
import { useLocation } from 'react-router-dom';

const Analysis = () => {
  const { state } = useLocation();
  const codeAnalysisData = state?.analysisData || null;
  const { colorMode } = useColorMode();

  if (!codeAnalysisData) {
    return (
      <Box p={6}>
        <Heading mb={6}>Code Analysis</Heading>
        <Text fontSize="xl" mt={8} textAlign="center">
          Run some code on the Home page first.
        </Text>
        <Button as={Link} to="/" colorScheme="teal" mt={4} mx="auto">
          Go to Playground
        </Button>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading mb={6}>Code Analysis</Heading>
      
      <VStack spacing={6} align="stretch">
        {/* Function Summary Section */}
        <Box p={4} borderWidth={1} borderRadius="md">
          <Heading size="md" mb={4}>
            <InfoOutlineIcon mr={2} color="teal.300" />
            Function Summary
          </Heading>
          
          <SimpleGrid columns={[1, 2, 3]} spacing={4}>
            {codeAnalysisData.functions.map((func, index) => (
              <Box key={index} p={3} bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'} borderRadius="md">
                <Text fontWeight="bold">{func.name}</Text>
                <Text fontSize="sm" color="gray.500">
                  Params: {func.params.join(', ')} | Returns: {func.returns}
                </Text>
                <Text mt={2} fontSize="sm">{func.summary}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        {/* Complexity Section */}
        <Box p={4} borderWidth={1} borderRadius="md">
          <Heading size="md" mb={4}>
            <TimeIcon mr={2} color="blue.300" />
            Code Complexity
          </Heading>
          
          <SimpleGrid columns={[1, 2, 3]} spacing={4}>
            <Stat p={3} bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'} borderRadius="md">
              <StatLabel>Cyclomatic Complexity</StatLabel>
              <StatNumber>{codeAnalysisData.complexity.cyclomatic}</StatNumber>
            </Stat>
            
            <Stat p={3} bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'} borderRadius="md">
              <StatLabel>Estimated Runtime</StatLabel>
              <StatNumber>{codeAnalysisData.complexity.estimated_runtime}</StatNumber>
            </Stat>
            
            <Stat p={3} bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'} borderRadius="md">
              <StatLabel>Max Nesting Depth</StatLabel>
              <StatNumber>{codeAnalysisData.complexity.nesting_depth}</StatNumber>
            </Stat>
          </SimpleGrid>
        </Box>

        {/* Refactoring Suggestions */}
        <Box p={4} borderWidth={1} borderRadius="md">
          <Heading size="md" mb={4}>
            <WarningIcon mr={2} color="orange.300" />
            Refactoring Suggestions
          </Heading>
          
          <List spacing={3}>
            {codeAnalysisData.suggestions.map((suggestion, index) => (
              <ListItem key={index}>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                {suggestion}
              </ListItem>
            ))}
          </List>
        </Box>
      </VStack>
    </Box>
  );
};

export default Analysis;
