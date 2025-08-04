import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Text,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Textarea,
  FormControl,
  FormLabel
} from '@chakra-ui/react';
import { useDisclosure } from '@chakra-ui/react';

const Sessions = () => {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [editedCode, setEditedCode] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    const fetchSnippets = async () => {
      try {
        const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
        if (!token) {
          setError('No authentication token found. Please log in.');
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:5000/api/snippets', {
          headers: {
            'x-access-token': token,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch snippets');
        }

        const data = await response.json();
        setSnippets(data);
      } catch (err) {
        setError(err.message);
        toast({
          title: 'Error fetching snippets.',
          description: err.message,
          status: 'error',
          duration: 9000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSnippets();
  }, [toast]);

  const handleEditClick = (snippet) => {
    setEditingSnippet(snippet);
    setEditedCode(snippet.code);
    setEditedTitle(snippet.title);
    onOpen();
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/snippets/${editingSnippet.short_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({ code: editedCode, title: editedTitle }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update snippet');
      }

      const updatedSnippet = await response.json();
      setSnippets(snippets.map(s => s.short_id === updatedSnippet.snippet.short_id ? updatedSnippet.snippet : s));
      onClose();
      toast({
        title: 'Snippet updated.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Error updating snippet.',
        description: err.message,
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    }
  };

  const handleDeleteClick = async (short_id) => {
    if (window.confirm('Are you sure you want to delete this snippet?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/snippets/${short_id}`, {
          method: 'DELETE',
          headers: {
            'x-access-token': token,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete snippet');
        }

        setSnippets(snippets.filter(s => s.short_id !== short_id));
        toast({
          title: 'Snippet deleted.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } catch (err) {
        toast({
          title: 'Error deleting snippet.',
          description: err.message,
          status: 'error',
          duration: 9000,
          isClosable: true,
        });
      }
    }
  };

  if (loading) {
    return (
      <Box p={4}>
        <Text>Loading snippets...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Text color="red.500">Error: {error}</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Heading mb={6}>Your Code Snippets</Heading>
      {snippets.length === 0 ? (
        <Text>No snippets found. Start by shortening some code!</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Short URL</Th>
              <Th>Title</Th>
              <Th>Creation Date</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {snippets.map(snippet => (
              <Tr key={snippet.short_id}>
                <Td>
                  <a href={`/${snippet.short_id}`} target="_blank" rel="noopener noreferrer">
                    {window.location.origin}/{snippet.short_id}
                  </a>
                </Td>
                <Td>{snippet.title}</Td>
                <Td>{new Date(snippet.created_at).toLocaleDateString()}</Td>
                <Td>
                  <Button size="sm" colorScheme="blue" mr={2} onClick={() => handleEditClick(snippet)}>
                    Edit
                  </Button>
                  <Button size="sm" colorScheme="red" onClick={() => handleDeleteClick(snippet.short_id)}>
                    Delete
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {editingSnippet && (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit Snippet: {editingSnippet.title}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl mb={4}>
                <FormLabel>Snippet Title</FormLabel>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Code Content</FormLabel>
                <Textarea
                  value={editedCode}
                  onChange={(e) => setEditedCode(e.target.value)}
                  placeholder="Enter your code here"
                  height="300px"
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={handleSaveEdit}>
                Save
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default Sessions;
