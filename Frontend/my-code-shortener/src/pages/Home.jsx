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
  Text,
  FormControl,
  FormLabel,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Input,
  Progress
} from '@chakra-ui/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
 
import '../Home.css'; // Import the new CSS file

const Home = () => {
  const [code, setCode] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const { colorMode } = useColorMode();
  const toast = useToast();
  const [shortenedUrl, setShortenedUrl] = useState(null); // New state for shortened URL
  const [fullCodeVisible, setFullCodeVisible] = useState(false); // New state for dropdown visibility
  const [compressionPercent, setCompressionPercent] = useState(50);

  // Sensitive masking UI state
  const [selectedFile, setSelectedFile] = useState(null);
  const [maskJobId, setMaskJobId] = useState(null);
  const [maskStatus, setMaskStatus] = useState(null);
  const [maskReport, setMaskReport] = useState(null);
  const [maskIsUploading, setMaskIsUploading] = useState(false);
  const [maskIsProcessing, setMaskIsProcessing] = useState(false);

  const handleShorten = async () => {
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
      const response = await fetch(`/api/shorten`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ 
          code: (getSelectedText() || code),
          compressionPercent
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API request failed');
      }
      
      const data = await response.json();
      setShortenedUrl(data.shortened);
      setFullCodeVisible(false);

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
      handleShorten();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    setSelectedFile(file || null);
    // Reset previous job state
    setMaskJobId(null);
    setMaskStatus(null);
    setMaskReport(null);
    
  };

  const pollMaskingStatus = async (jobId) => {
    try {
      const res = await fetch(`/api/mask/status/${jobId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setMaskStatus(data.status);
      if (data.status === 'done') {
        setMaskReport(data.report || {});
        setMaskIsProcessing(false);
      } else if (data.status === 'error') {
        setMaskIsProcessing(false);
        toast({ title: 'Masking failed', status: 'error', duration: 2500 });
      } else {
        setTimeout(() => pollMaskingStatus(jobId), 1000);
      }
    } catch (err) {
      setMaskIsProcessing(false);
      toast({ title: 'Status check failed', status: 'error', duration: 2500 });
    }
  };

  const handleUploadForMasking = async () => {
    if (!selectedFile) {
      toast({ title: 'Select a file', status: 'warning', duration: 2000 });
      return;
    }
    setMaskIsUploading(true);
    setMaskIsProcessing(false);
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      const res = await fetch(`/api/mask/upload`, { method: 'POST', body: form, headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setMaskJobId(data.job_id);
      setMaskStatus(data.status);
      setMaskIsUploading(false);
      setMaskIsProcessing(true);
      pollMaskingStatus(data.job_id);
      toast({ title: 'File uploaded. Processing started.', status: 'info', duration: 2000 });
    } catch (err) {
      setMaskIsUploading(false);
      toast({ title: 'Upload failed', status: 'error', duration: 2500 });
    }
  };

  const handleDownloadMaskedZip = async () => {
    if (!maskJobId) return;
    try {
      const res = await fetch(`/api/mask/download/${maskJobId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
      if (!res.ok) throw new Error('Not ready');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'masked_files.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      toast({ title: 'Download failed or not ready', status: 'error', duration: 2500 });
    }
  };

  if (!code) {
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

      <FormControl mb={4} maxW="500px">
        <FormLabel>Compression Level: {compressionPercent}%</FormLabel>
        <Slider aria-label='compression-slider' value={compressionPercent} onChange={setCompressionPercent} min={0} max={100} step={5}>
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
      </FormControl>

      <Flex gap={4} mb={6}>
        <Button 
          colorScheme="blue" 
          onClick={handleShorten}
          isLoading={isLoading}
          loadingText="Shortening..."
        >
          Shorten Code
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setCode('');
            setShortenedUrl(null);
          }}
        >
          Clear
        </Button>
      </Flex>

      <Box mt={12} p={4} borderWidth={1} borderRadius="md">
        <Heading size="md" mb={3}>Sensitive Data Masking</Heading>
        <Text fontSize="sm" mb={3}>Upload a file or a .zip archive. The server will mask detected secrets and return a zip with a report.</Text>
        <Flex gap={3} align="center" wrap="wrap">
          <Input type="file" onChange={handleFileChange} accept=".zip,.txt,.js,.py,.env,.json,.yml,.yaml,.html,.php,.java,.c,.cpp" maxW="400px" />
          <Button onClick={handleUploadForMasking} isLoading={maskIsUploading} loadingText="Uploading..." colorScheme="teal">Upload & Mask</Button>
          {(maskStatus === 'queued' || maskIsProcessing) && (
            <Flex align="center" gap={2}>
              <Spinner size="sm" />
              <Text>Processing...</Text>
            </Flex>
          )}
          {maskStatus === 'done' && (
            <Button colorScheme="blue" onClick={handleDownloadMaskedZip}>Download Masked ZIP</Button>
          )}
        </Flex>
        {maskIsProcessing && <Progress size="xs" isIndeterminate mt={3} />}

        {maskReport && (
          <Box mt={4}>
            <Heading size="sm" mb={2}>Summary</Heading>
            <Text fontSize="sm">Total files: {maskReport?.summary?.total_files || 0}</Text>
            <Text fontSize="sm">Files masked: {maskReport?.summary?.files_masked || 0}</Text>
            {maskReport?.summary?.detections_by_type && (
              <Box mt={2}>
                {Object.entries(maskReport.summary.detections_by_type).map(([type, count]) => (
                  <Text key={type} fontSize="sm">{type}: {count}</Text>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>

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

      {isLoading && (
        <Flex justify="center" mt={8}>
          <Spinner size="xl" />
        </Flex>
      )}
    </Box>
  );
};

export default Home;
