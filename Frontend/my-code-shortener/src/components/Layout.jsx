import { Outlet, Link, useNavigate, useRouteError } from 'react-router-dom';
import { Flex, Box, Heading, Button, IconButton, useColorMode, useBreakpointValue, useColorModeValue, Alert, AlertIcon } from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  return (
    <Box p={4}>
      <Alert status="error">
        <AlertIcon />
        {error.message || 'An unexpected error occurred'}
      </Alert>
    </Box>
  );
}

const Layout = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Flex direction="column" minH="100vh">
      <Flex 
        as="nav" 
        bg={useColorModeValue('gray.100', 'gray.900')}
        p={4}
        justify="space-between"
        align="center"
      >
        <Heading size="md">Code Shortener</Heading>
        
        <Flex gap={4} align="center">
          {!isMobile && (
            <>
              <Button as={Link} to="/" variant="ghost">Playground</Button>
              {!user && <Button as={Link} to="/login" variant="ghost">Login</Button>}
              {!user && <Button as={Link} to="/register" variant="ghost">Register</Button>}
              {user && <Button onClick={() => { logout(); navigate('/login'); }} variant="outline">Logout</Button>}
            </>
          )}
          <IconButton
            icon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
            onClick={toggleColorMode}
            aria-label="Toggle theme"
          />
        </Flex>
      </Flex>

      <Box flex={1} p={4} maxW="1400px" mx="auto">
        <Outlet />
      </Box>
    </Flex>
  );
};

export default Layout;
