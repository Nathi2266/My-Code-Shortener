import { 
  Box, 
  Heading, 
  Textarea, 
  Button, 
  IconButton,
  Text,
  useColorMode,
  Flex,
  VStack,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import { MoonIcon, SunIcon, ListIcon } from '@chakra-ui/icons';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useDropzone } from 'react-dropzone';

// Custom hook for code shortening logic
const useCodeShortener = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const toast = useToast();

  const shortenCode = useCallback(async (code, compressionPercent) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code,
          compressionPercent: Math.min(Math.max(Number(compressionPercent), 10), 90)
        }),
        mode: 'cors'
      });
      
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setResult(data);
      toast({
        title: 'Success',
        description: 'Code shortened successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      setResult({ error: error.message || 'Failed to shorten code' });
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const explainCode = useCallback(async (codeSnippet) => {
    try {
      setExplanationLoading(true);
      const response = await fetch('http://localhost:5000/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeSnippet }),
        mode: 'cors'
      });
      
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setExplanation(data.explanation);
    } catch (error) {
      toast({
        title: 'Explanation Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setExplanationLoading(false);
    }
  }, [toast]);

  const summarizeFunctions = useCallback(async (codeSnippet) => {
    try {
      const response = await fetch('http://localhost:5000/summarize-functions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeSnippet }),
        mode: 'cors'
      });
      
      if (!response.ok) throw new Error(await response.text());
      return await response.json();
    } catch (error) {
      toast({
        title: 'Analysis Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
      return { summaries: [] };
    }
  }, [toast]);

  return { result, loading, shortenCode, explanation, explanationLoading, explainCode, summarizeFunctions };
};

function App() {
  const { colorMode, toggleColorMode } = useColorMode();
  const [code, setCode] = useState('');
  const { result, loading, shortenCode, summarizeFunctions } = useCodeShortener();
  const [functionSummaries, setFunctionSummaries] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const toast = useToast();
  
  const dropzoneBorder = useColorModeValue('#CBD5E0', '#4A5568');
  const dropzoneBg = useColorModeValue('gray.50', 'gray.700');
  const sidebarBg = useColorModeValue('white', 'gray.800');
  const functionCardBg = useColorModeValue('gray.100', 'gray.700');

  const handleCodeSelect = useCallback((e) => {
    const selection = e.target.value.substring(
      e.target.selectionStart,
      e.target.selectionEnd
    );
    if (selection) {
      // Handle selection if needed
    }
  }, []);

  // Move all color mode hooks to top level
  const codeStyle = useMemo(() => 
    colorMode === 'dark' ? dracula : prism, 
    [colorMode]
  );

  // Move handleSubmit definition before useEffect
  const handleSubmit = useCallback(async () => {
    if (!code.trim() || code.trim().length < 10) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter code with at least 10 characters',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    try {
      await Promise.all([
        shortenCode(code, 50),
        summarizeFunctions(code).then(summaryResult => {
          setFunctionSummaries(summaryResult.summaries || []);
          setShowSidebar(summaryResult.summaries?.length > 0);
        })
      ]);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  }, [code, shortenCode, summarizeFunctions, toast]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleSubmit]);

  // File dropzone
  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setCode(e.target.result);
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/*': ['.js', '.py', '.java', '.txt'] },
    multiple: false
  });

  return (
    <Box p={4} maxW="1200px" mx="auto">
      <Flex justify="space-between" mb={6}>
        <Heading>Code Shortener</Heading>
        <IconButton
          icon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
          onClick={toggleColorMode}
          aria-label="Toggle theme"
        />
      </Flex>

      <Flex gap={6}>
        {/* Main Content Area */}
        <Box flex={1}>
          <Box 
            {...getRootProps()}
            border="2px dashed"
            borderColor={dropzoneBorder}
            borderRadius="md"
            p={6}
            mb={4}
            bg={dropzoneBg}
            cursor="pointer"
          >
            <input {...getInputProps()} />
            <Text textAlign="center">
              {isDragActive ? "Drop code here" : "Drag code file here or click to select"}
            </Text>
          </Box>

          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here..."
            fontFamily="monospace"
            minH="300px"
            mb={4}
            onSelect={handleCodeSelect}
          />

          <Button 
            colorScheme="blue" 
            onClick={handleSubmit}
            isLoading={loading}
            loadingText="Processing..."
          >
            Shorten Code (Ctrl+Enter)
          </Button>

          {result?.shortened && (
            <Box mt={6}>
              <Heading size="md" mb={2}>Shortened Code:</Heading>
              <SyntaxHighlighter 
                language={result.language}
                style={codeStyle}
                customStyle={{ 
                  padding: '1rem',
                  borderRadius: '0.5rem'
                }}
              >
                {result.shortened}
              </SyntaxHighlighter>
            </Box>
          )}
        </Box>

        {/* Function Summary Sidebar */}
        {showSidebar && (
          <Box 
            w="300px" 
            p={4} 
            bg={sidebarBg}
            borderRadius="md"
            boxShadow="md"
          >
            <Heading size="md" mb={4}>
              <ListIcon mr={2} />
              Functions
            </Heading>
            <VStack align="stretch" spacing={3}>
              {functionSummaries.map((func, index) => (
                <Box 
                  key={index}
                  p={3}
                  bg={functionCardBg}
                  borderRadius="md"
                >
                  <Text fontWeight="bold">{func.name}</Text>
                  <Text fontSize="sm">Inputs: {func.inputs}</Text>
                  <Text fontSize="sm">Returns: {func.returns}</Text>
                </Box>
              ))}
            </VStack>
          </Box>
        )}
      </Flex>
    </Box>
  );
}

export default App;
