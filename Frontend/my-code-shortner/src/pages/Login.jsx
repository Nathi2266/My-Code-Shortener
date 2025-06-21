import { Box, Heading, FormControl, FormLabel, Input, Button, VStack, Text } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <Box maxW="400px" mx="auto" mt={20}>
      <Heading mb={8}>Login</Heading>
      <VStack spacing={4}>
        <FormControl>
          <FormLabel>Email</FormLabel>
          <Input type="email" />
        </FormControl>

        <FormControl>
          <FormLabel>Password</FormLabel>
          <Input type="password" />
        </FormControl>

        <Button colorScheme="blue" w="full">
          Sign In
        </Button>

        <Text>
          Don't have an account?{' '}
          <Button as={Link} to="/register" variant="link" color="blue.500">
            Register here
          </Button>
        </Text>
      </VStack>
    </Box>
  );
};

export default Login;
