import { useState } from 'react';
import { Box, Heading, FormControl, FormLabel, Input, Button, VStack, Text, useToast } from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const { token } = await response.json();
      login(token);
      navigate('/');
      
    } catch (error) {
      toast({
        title: 'Login Error',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxW="400px" mx="auto" mt={20}>
      <Heading mb={8}>Login</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>

          <Button 
            type="submit" 
            colorScheme="blue" 
            w="full"
            isLoading={isLoading}
            loadingText="Signing in..."
          >
            Sign In
          </Button>

          <Text>
            Don't have an account?{' '}
            <Button as={Link} to="/register" variant="link" color="blue.500">
              Register here
            </Button>
          </Text>
        </VStack>
      </form>
    </Box>
  );
};

export default Login;
