import React, { useState } from 'react';
import { 
  Box, 
  Textarea, 
  Button, 
  Flex, 
  Spinner, 
  useToast,
  useColorMode,
  Heading,
  IconButton,
  Tooltip,
  Text
} from '@chakra-ui/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyIcon, SunIcon, MoonIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import '../Home.css'; // Import the new CSS file

const Home = () => {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  const navigate = useNavigate();
  const [shortenedUrl, setShortenedUrl] = useState(null); // New state for shortened URL
  const [fullCodeVisible, setFullCodeVisible] = useState(false); // New state for dropdown visibility

  const handleApiCall = async (endpoint) => {
    if (!code.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter some code',
        status: 'error',
        duration: 2000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: getSelectedText() || code })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API request failed');
      }
      
      const data = await response.json();
      
      if (endpoint === 'analyze') {
        navigate('/analysis', { state: { analysisData: data } });
      } else {
        setOutput(data.result || data.explanation);
      }

      if (endpoint === 'shorten') {
        setShortenedUrl(data.shortened); // Assuming the shortened URL is in data.shortened
        setFullCodeVisible(false); // Hide the code dropdown when a new URL is generated
      } else {
        setShortenedUrl(null); // Clear shortened URL if not a shorten operation
      }

      toast({
        title: 'Success',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 2000,
      });
      setOutput('');
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedText = () => {
    const textarea = document.querySelector('textarea');
    return textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
  };

  const toggleFullCode = () => {
    setFullCodeVisible(!fullCodeVisible); // Toggle the state
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleApiCall('shorten');
    }
  };

  if (output === '' && !code) {
    return (
      <Box p={6} textAlign="center">
        <Heading size="xl" mb={4}>Welcome to Code Shortener</Heading>
        <Text fontSize="lg" mb={6}>Paste your code to get started</Text>
        <Button 
          colorScheme="blue" 
          size="lg"
          onClick={() => setCode(' ')}
        >
          Get Started
        </Button>
      </Box>
    );
  }

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <Flex justify="space-between" mb={6}>
        <Heading size="lg">Code Playground</Heading>
        <IconButton
          icon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
          onClick={toggleColorMode}
          aria-label="Toggle theme"
        />
      </Flex>

      <Textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter your code here..."
        fontFamily="monospace"
        minH="300px"
        mb={4}
        onKeyDown={handleKeyDown}
      />

      <Flex gap={4} mb={6}>
        <Button 
          colorScheme="blue" 
          onClick={() => handleApiCall('shorten')}
          isLoading={isLoading}
          loadingText="Shortening..."
        >
          Shorten Code
        </Button>
        <Button
          colorScheme="green"
          onClick={() => handleApiCall('explain')}
          isLoading={isLoading}
          loadingText="Explaining..."
        >
          Explain Code
        </Button>
        <Button
          colorScheme="purple"
          onClick={() => handleApiCall('analyze')}
          isLoading={isLoading}
          loadingText="Analyzing..."
        >
          Analyze Code
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setCode('');
            setOutput('');
          }}
        >
          Clear
        </Button>
      </Flex>

      {output && (
        <Box 
          borderWidth={1} 
          borderRadius="md" 
          p={4} 
          position="relative"
          bg={colorMode === 'dark' ? 'gray.700' : 'white'}
        >
          <Tooltip label="Copy output">
            <IconButton
              icon={<CopyIcon />}
              position="absolute"
              right={4}
              top={4}
              onClick={() => navigator.clipboard.writeText(output)}
              aria-label="Copy output"
            />
          </Tooltip>
          <SyntaxHighlighter 
            language="javascript" 
            style={colorMode === 'dark' ? atomDark : prism}
            customStyle={{ background: 'none' }}
          >
            {output}
          </SyntaxHighlighter>
        </Box>
      )}

      {shortenedUrl && (
        <Box 
          className={`results-card ${fullCodeVisible ? 'expanded' : ''}`}
          borderWidth={1} 
          borderRadius="md" 
          p={4} 
          mt={4} // Add margin-top for spacing
          position="relative"
          bg={colorMode === 'dark' ? 'gray.700' : 'white'}
          boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)"
        >
          <Heading size="md" mb={2} color={colorMode === 'dark' ? 'whiteAlpha.900' : 'gray.800'}>Shortened Code:</Heading>
          <Flex className="preview" align="center" justify="space-between">
            <Text 
              fontSize="lg" 
              wordBreak="break-all" 
              flex="1" 
              mr={4}
              fontWeight="bold"
              color={colorMode === 'dark' ? 'blue.300' : 'blue.600'} // Apply link color
              cursor="pointer" // Indicate it's clickable
              onClick={() => {
                navigator.clipboard.writeText(shortenedUrl);
                toast({
                  title: 'Copied short code!',
                  status: 'success',
                  duration: 2000,
                  isClosable: true,
                });
              }}
            >
              {window.location.origin}/{shortenedUrl}
            </Text>
            <Flex>
              <Button
                size="sm"
                colorScheme="teal"
                onClick={() => {
                  navigator.clipboard.writeText(shortenedUrl); // Changed to copy only the shortened URL
                  toast({
                    title: 'Copied short code!',
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                  });
                }}
                mr={2}
              >
                Copy Short Code
              </Button>
              <Button
                size="sm"
                colorScheme="gray"
                onClick={toggleFullCode}
              >
                {fullCodeVisible ? 'Collapse' : 'Expand'}
              </Button>
            </Flex>
          </Flex>

          {fullCodeVisible && (
            <Box
              className="expanded-view"
              mt={4} 
              p={4} 
              borderWidth={1} 
              borderRadius="md" 
              bg={colorMode === 'dark' ? 'gray.800' : 'gray.50'}
              overflowX="auto"
            >
              <Heading size="sm" mb={2}>Original Code:</Heading>
              <SyntaxHighlighter 
                language="javascript" // Assuming the code is JavaScript, adjust as needed
                style={colorMode === 'dark' ? atomDark : prism}
                customStyle={{ background: 'none', padding: 0 }}
              >
                {code}
              </SyntaxHighlighter>
            </Box>
          )}
        </Box>
      )}

      {isLoading && !output && (
        <Flex justify="center" mt={8}>
          <Spinner size="xl" />
        </Flex>
      )}
    </Box>
  );
};

export default Home;
