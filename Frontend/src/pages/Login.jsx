import React, { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, Heading, useToast, useColorModeValue } from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion'; // Import motion
import { FiLogIn, FiUserPlus } from 'react-icons/fi'; // Import icons

const MotionButton = motion(Button); // Create a motion-enabled Button component
const MotionInput = motion(Input); // Create a motion-enabled Input component

const Login = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const toast = useToast();
	const navigate = useNavigate();
	const { login } = useAuth();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Login failed');
			login(data.token);
			toast({ title: 'Logged in', status: 'success', duration: 2000 });
			navigate('/');
		} catch (err) {
			toast({ title: 'Error', description: err.message, status: 'error', duration: 2500 });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Box 
			maxW="md" 
			mx="auto" 
			mt={12} 
			p={6} 
			borderWidth={1} 
			borderRadius="md"
			bg={useColorModeValue('whiteAlpha.800', 'blackAlpha.600')} 
			boxShadow="xl" 
			backdropFilter="blur(10px)"
		>
			<Heading size="md" mb={4}>Login</Heading>
			<form onSubmit={handleSubmit}>
				<FormControl mb={4} isRequired>
					<FormLabel>Email</FormLabel>
					<MotionInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} bg={useColorModeValue('whiteAlpha.900', 'blackAlpha.700')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} />
				</FormControl>
				<FormControl mb={6} isRequired>
					<FormLabel>Password</FormLabel>
					<MotionInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} bg={useColorModeValue('whiteAlpha.900', 'blackAlpha.700')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} />
				</FormControl>
				<MotionButton 
					type="submit" 
					colorScheme="blue" 
					isLoading={isLoading} 
					width="100%"
					leftIcon={<FiLogIn/>}
					whileHover={{ scale: 1.05 }} 
					whileTap={{ scale: 0.95 }}
				>
					Login
				</MotionButton>
			</form>
			<Box mt={4}>
				Don't have an account? <MotionButton as={Link} to="/register" variant="link" colorScheme="blue" 
					leftIcon={<FiUserPlus/>} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Register</MotionButton>
			</Box>
		</Box>
	);
};

export default Login;

