import { Outlet, Link } from 'react-router-dom';
import { Flex, Box, Heading, Button, IconButton, useColorMode, useBreakpointValue, useColorModeValue } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

const Layout = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });

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
              <Button as={Link} to="/analysis" variant="ghost">Analysis</Button>
              <Button as={Link} to="/sessions" variant="ghost">Sessions</Button>
              <Button as={Link} to="/docs" variant="ghost">Docs</Button>
              <Button as={Link} to="/profile" variant="ghost">Profile</Button>
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
