import { useState, useEffect } from 'react';
import { 
  Box, Heading, FormControl, FormLabel, Input, Button, Switch, 
  useToast, VStack, Spinner, AlertDialog, AlertDialogBody,
  AlertDialogFooter, AlertDialogHeader, AlertDialogContent,
  AlertDialogOverlay, useColorMode, InputGroup, InputRightElement,
  IconButton, Text
} from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  const cancelRef = useState();
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          logout();
          navigate('/login');
          return;
        }

        const response = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
          logout();
          navigate('/login');
          return;
        }

        if (!response.ok) throw new Error('Failed to fetch profile');
        
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message,
          status: 'error',
          duration: 3000,
        });
        logout();
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [toast, navigate, logout]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile?.name?.trim() || !/^\S+@\S+\.\S+$/.test(profile.email)) {
      toast({
        title: 'Invalid Input',
        description: 'Please fill all required fields correctly',
        status: 'error',
        duration: 2000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Update failed');
      }

      toast({
        title: 'Profile Updated',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Account deletion failed');
      
      logout();
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  if (isLoading) {
    return (
      <Box textAlign="center" mt={10}>
        <Spinner size="xl" />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box textAlign="center" mt={10}>
        <Heading size="lg" mb={4}>Profile Not Found</Heading>
        <Button 
          colorScheme="blue" 
          onClick={() => navigate('/login')}
        >
          Return to Login
        </Button>
      </Box>
    );
  }

  return (
    <Box maxW="600px" mx="auto" p={6} borderWidth={1} borderRadius="lg" boxShadow="md">
      <Heading mb={6}>Profile Settings</Heading>
      
      <form onSubmit={handleSubmit}>
        <VStack spacing={5} align="stretch">
          <FormControl isRequired>
            <FormLabel>Name</FormLabel>
            <Input 
              value={profile?.name || ''}
              onChange={(e) => setProfile({...profile, name: e.target.value})}
              placeholder="Your name"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={profile?.email || ''}
              onChange={(e) => setProfile({...profile, email: e.target.value})}
              placeholder="your@email.com"
            />
          </FormControl>

          <FormControl display="flex" alignItems="center">
            <FormLabel mb={0}>Dark Mode</FormLabel>
            <Switch
              isChecked={colorMode === 'dark'}
              onChange={toggleColorMode}
            />
          </FormControl>

          <FormControl>
            <FormLabel>API Key</FormLabel>
            <InputGroup>
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={profile?.apiKey || 'sk-*****'}
                isReadOnly
              />
              <InputRightElement>
                <IconButton
                  aria-label="Copy API Key"
                  icon={<CopyIcon />}
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(profile?.apiKey)}
                />
              </InputRightElement>
            </InputGroup>
            <Button
              size="sm"
              mt={2}
              variant="outline"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? 'Hide' : 'Show'} Key
            </Button>
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            mt={6}
            isLoading={isSubmitting}
            loadingText="Saving..."
          >
            Save Changes
          </Button>

          <VStack mt={10} spacing={4} align="end" borderTopWidth={1} pt={6}>
            <Text fontSize="sm" color="gray.500">
              Last updated: {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString() : 'N/A'}
            </Text>
            
            <Button
              variant="outline"
              onClick={handleLogout}
            >
              Logout
            </Button>
            
            <Button 
              variant="outline" 
              colorScheme="red"
              onClick={() => setIsDeleteOpen(true)}
            >
              Delete Account
            </Button>
          </VStack>
        </VStack>
      </form>

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Delete Account</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteAccount} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default Profile;
