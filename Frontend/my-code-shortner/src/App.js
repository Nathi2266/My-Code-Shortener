import { 
  ChakraProvider, 
  Box, 
  Container, 
  Heading, 
  Textarea, 
  Button, 
  VStack, 
  Code, 
  Alert, 
  Spinner, 
  useToast,
  Text
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { WarningIcon } from '@chakra-ui/icons';

function App() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter some code to shorten',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code, 
          compressionPercent: Math.min(Math.max(Number(50), 10), 90)
        }),
        mode: 'cors'
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to shorten code');
      }
      
      setResult(data);
      toast({
        title: 'Success',
        description: 'Code shortened successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      
    } catch (error) {
      setResult({ error: error.message });
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChakraProvider>
      <Box minH="100vh" bg="gray.50" py={8}>
        <Container maxW="container.lg">
          <VStack spacing={6} align="stretch">
            <Heading as="h1" size="xl" textAlign="center" color="blue.600">
              Code Shortener
            </Heading>

            <Box as="form" onSubmit={handleSubmit} bg="white" p={6} borderRadius="md" boxShadow="md">
              <VStack spacing={4}>
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your code here..."
                  minH="300px"
                  fontFamily="mono"
                  resize="vertical"
                />
                
                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  isLoading={loading}
                  loadingText="Processing..."
                  rightIcon={loading ? <Spinner size="sm" /> : null}
                  width="full"
                >
                  Shorten Code
                </Button>
              </VStack>
            </Box>

            {result && (
              <Box bg="white" p={6} borderRadius="md" boxShadow="md">
                {result.error ? (
                  <Alert status="error" borderRadius="md">
                    <WarningIcon mr={3} />
                    {result.error}
                  </Alert>
                ) : (
                  <VStack align="stretch" spacing={4}>
                    <Heading size="md">Shortened Code:</Heading>
                    <Code p={4} borderRadius="md" whiteSpace="pre-wrap" overflowX="auto">
                      {result.shortened}
                    </Code>
                    {result.applied && (
                      <Text fontSize="sm" color="gray.600">
                        Applied transformations: {result.applied.join(', ')}
                      </Text>
                    )}
                  </VStack>
                )}
              </Box>
            )}
          </VStack>
        </Container>
      </Box>
    </ChakraProvider>
  );
}

export default App;
