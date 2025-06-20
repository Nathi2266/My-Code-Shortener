import { 
  ChakraProvider, 
  Box, 
  Heading, 
  Textarea, 
  Button, 
  VStack, 
  Alert, 
  Spinner, 
  useToast,
  Text,
  useColorMode,
  IconButton,
  Tooltip,
  Flex
} from '@chakra-ui/react';
import { MoonIcon, SunIcon, DownloadIcon, AttachmentIcon } from '@chakra-ui/icons';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useDropzone } from 'react-dropzone';

// Custom hook for code shortening logic
const useCodeShortener = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
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

  return { result, loading, shortenCode };
};

function App() {
  const { colorMode, toggleColorMode } = useColorMode();
  const [code, setCode] = useState('');
  const [compressionPercent, setCompressionPercent] = useState(50);
  const { result, loading, shortenCode } = useCodeShortener();
  const toast = useToast();

  // Syntax highlighter style
  const codeStyle = useMemo(() => 
    colorMode === 'dark' ? dracula : prism, 
    [colorMode]
  );

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

  // Keyboard shortcut handler
  const handleSubmit = useCallback(() => {
    if (!code.trim() || code.trim().length < 10) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter code with at least 10 characters',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    shortenCode(code, compressionPercent);
  }, [code, compressionPercent, shortenCode, toast]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleSubmit]);

  const handleDownload = () => {
    const blob = new Blob([result?.shortened || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shortened-code-${Date.now()}.txt`;
    a.click();
  };

  return (
    <ChakraProvider>
      <Box p={4}>
        <Flex justify="space-between" mb={6}>
          <Heading size="xl">Code Shortener</Heading>
          <Flex gap={2}>
            <Tooltip label="Toggle Dark Mode">
              <IconButton
                icon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
                onClick={toggleColorMode}
                aria-label="Toggle theme"
              />
            </Tooltip>
            {result?.shortened && (
              <Tooltip label="Download Code">
                <IconButton
                  icon={<DownloadIcon />}
                  onClick={handleDownload}
                  aria-label="Download code"
                />
              </Tooltip>
            )}
          </Flex>
        </Flex>

        <VStack spacing={4} align="stretch">
          <div {...getRootProps()} style={{ cursor: 'pointer' }}>
            <input {...getInputProps()} />
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={isDragActive ? 'Drop code file here...' : 'Paste your code here'}
              minH="200px"
              fontFamily="mono"
              spellCheck="false"
            />
          </div>

          <Flex gap={4} align="center">
            <Button
              onClick={handleSubmit}
              colorScheme="blue"
              isLoading={loading}
              loadingText="Shortening..."
              leftIcon={<AttachmentIcon />}
              isDisabled={!code.trim()}
            >
              Shorten Code
            </Button>
            <input
              type="range"
              min="10"
              max="90"
              value={compressionPercent}
              onChange={(e) => setCompressionPercent(e.target.value)}
              style={{ flex: 1 }}
            />
            <Text w="100px">Compression: {compressionPercent}%</Text>
          </Flex>

          {loading && <Spinner size="xl" thickness="4px" mx="auto" />}

          {result?.error && (
            <Alert status="error" borderRadius="md">
              <Text>{result.error}</Text>
            </Alert>
          )}

          {result?.shortened && (
            <Box mt={4}>
              <Heading size="md" mb={2}>Shortened Code:</Heading>
              <SyntaxHighlighter 
                language={result.language?.toLowerCase()} 
                style={codeStyle}
                customStyle={{ 
                  borderRadius: '8px', 
                  padding: '1rem',
                  maxHeight: '500px',
                  overflow: 'auto'
                }}
              >
                {result.shortened}
              </SyntaxHighlighter>
            </Box>
          )}
        </VStack>
      </Box>
    </ChakraProvider>
  );
}

export default App;
