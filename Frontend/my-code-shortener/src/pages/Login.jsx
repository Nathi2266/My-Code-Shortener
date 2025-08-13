import React, { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, Heading, useToast } from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
		<Box maxW="md" mx="auto" mt={12} p={6} borderWidth={1} borderRadius="md">
			<Heading size="md" mb={4}>Login</Heading>
			<form onSubmit={handleSubmit}>
				<FormControl mb={4} isRequired>
					<FormLabel>Email</FormLabel>
					<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
				</FormControl>
				<FormControl mb={6} isRequired>
					<FormLabel>Password</FormLabel>
					<Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
				</FormControl>
				<Button type="submit" colorScheme="blue" isLoading={isLoading} width="100%">Login</Button>
			</form>
			<Box mt={4}>
				Don't have an account? <Button as={Link} to="/register" variant="link" colorScheme="blue">Register</Button>
			</Box>
		</Box>
	);
};

export default Login;

