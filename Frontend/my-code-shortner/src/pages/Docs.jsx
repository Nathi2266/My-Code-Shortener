import { Box, Heading, VStack, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Text } from '@chakra-ui/react';

const Docs = () => {
  return (
    <Box>
      <Heading mb={6}>Documentation & Guides</Heading>
      <VStack spacing={4} align="stretch">
        <Accordion allowToggle>
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                How AI-Powered Code Shortening Works
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <Text>
                Our system uses advanced machine learning models to analyze and optimize your code 
                while maintaining functionality. Key features include:
                - Semantic understanding of code structure
                - Pattern recognition for common code patterns
                - Context-aware compression algorithms
              </Text>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                Best Practices
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <Text>
                1. Keep functions under 50 lines for optimal analysis
                2. Use descriptive variable names
                3. Avoid overly complex nested structures
                4. Provide clear function documentation
              </Text>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                FAQ
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <VStack align="stretch" spacing={3}>
                <Text fontWeight="bold">Q: Is my code stored?</Text>
                <Text>A: Code is processed in memory and not persisted</Text>
                
                <Text fontWeight="bold">Q: Supported languages?</Text>
                <Text>A: JavaScript, Python, Java, C++ (more coming soon)</Text>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </VStack>
    </Box>
  );
};

export default Docs;

