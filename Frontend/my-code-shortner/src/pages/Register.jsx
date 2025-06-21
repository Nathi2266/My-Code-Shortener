import { Box, Heading, FormControl, FormLabel, Input, Button, VStack, Text, Link } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const Register = () => {
  return (
    <Box maxW="400px" mx="auto" mt={20}>
      <Heading mb={8}>Create Account</Heading>
      <VStack spacing={4}>
        <FormControl>
          <FormLabel>Name</FormLabel>
          <Input type="text" />
        </FormControl>

        <FormControl>
          <FormLabel>Email</FormLabel>
          <Input type="email" />
        </FormControl>

        <FormControl>
          <FormLabel>Password</FormLabel>
          <Input type="password" />
        </FormControl>

        <Button colorScheme="blue" w="full">
          Create Account
        </Button>

        <Text>
          Already have an account?{' '}
          <Link as={RouterLink} to="/login" color="blue.500">
            Login here
          </Link>
        </Text>
      </VStack>
    </Box>
  );
};

export default Register;
