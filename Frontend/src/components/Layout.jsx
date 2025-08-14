import { Outlet, Link, useNavigate, useRouteError } from 'react-router-dom';
import { Flex, Box, Heading, Button, IconButton, useColorMode, useBreakpointValue, useColorModeValue, Alert, AlertIcon } from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion'; // Import motion
import { FiLogIn, FiUserPlus, FiLogOut } from 'react-icons/fi'; // Import icons
import { RxGlobe } from 'react-icons/rx';
import React from 'react'; // Added missing import for React
import bgVideo from '../assets/videos/cSHORT.mp4';

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

const MotionButton = motion(Button); // Create a motion-enabled Button component
const MotionIconButton = motion(IconButton); // Create a motion-enabled IconButton component

const Layout = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Box position="relative" minH="100vh" overflow="hidden">
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -2,
        }}
      >
        <source src={bgVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <Box
        position="absolute"
        top={0}
        right={0}
        bottom={0}
        left={0}
        bg="blackAlpha.700"
        zIndex={-1}
        pointerEvents="none"
      />

      <Flex direction="column" minH="100vh" position="relative" zIndex="0">
        <Flex 
          as="nav" 
          bg={useColorModeValue('whiteAlpha.700', 'blackAlpha.700')}
          backdropFilter="blur(10px)"
          borderBottom="1px solid"
          borderColor={useColorModeValue('blackAlpha.200', 'whiteAlpha.300')}
          p={4}
          justify="space-between"
          align="center"
        >
          <Heading size="md">Code Shortener</Heading>
          
          <Flex gap={4} align="center">
            {!isMobile && (
              <>
                <MotionButton 
                  as={Link} 
                  to="/" 
                  variant="ghost"
                  leftIcon={<RxGlobe/>}
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                >
                  Playground
                </MotionButton>
                {!user && (
                  <MotionButton 
                    as={Link} 
                    to="/login" 
                    variant="ghost"
                    leftIcon={<FiLogIn/>}
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                  >
                    Login
                  </MotionButton>
                )}
                {!user && (
                  <MotionButton 
                    as={Link} 
                    to="/register" 
                    variant="ghost"
                    leftIcon={<FiUserPlus/>}
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                  >
                    Register
                  </MotionButton>
                )}
                {user && (
                  <MotionButton 
                    onClick={() => { logout(); navigate('/login'); }} 
                    variant="outline"
                    leftIcon={<FiLogOut/>}
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                  >
                    Logout
                  </MotionButton>
                )}
              </>
            )}
            <MotionIconButton
              icon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
              onClick={toggleColorMode}
              aria-label="Toggle theme"
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.9 }}
            />
          </Flex>
        </Flex>

        <Box flex={1} p={4} maxW="1400px" mx="auto">
          <Outlet />
        </Box>
      </Flex>
    </Box>
  );
};

export default Layout;
