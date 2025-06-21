import { useState } from 'react';
import { Box, Heading, FormControl, FormLabel, Input, Button, Switch, useToast, VStack } from '@chakra-ui/react';

const Profile = () => {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john@example.com');
  const [darkMode, setDarkMode] = useState(true);
  const toast = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    toast({
      title: 'Profile Updated',
      status: 'success',
      duration: 2000,
    });
  };

  return (
    <Box>
      <Heading mb={6}>Profile Settings</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch" maxW="600px">
          <FormControl>
            <FormLabel>Name</FormLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormControl>

          <FormControl>
            <FormLabel>Email</FormLabel>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormControl>

          <FormControl display="flex" alignItems="center">
            <FormLabel mb={0}>Dark Mode</FormLabel>
            <Switch isChecked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
          </FormControl>

          <FormControl>
            <FormLabel>API Key (read-only)</FormLabel>
            <Input value="sk-*****" isReadOnly />
          </FormControl>

          <Button type="submit" colorScheme="blue" mt={4}>
            Save Changes
          </Button>

          <VStack mt={8} spacing={3} align="start">
            <Button variant="outline" colorScheme="red">
              Logout
            </Button>
            <Button variant="ghost" colorScheme="red">
              Delete Account
            </Button>
          </VStack>
        </VStack>
      </form>
    </Box>
  );
};

export default Profile;
