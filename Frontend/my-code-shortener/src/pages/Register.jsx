import React, { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, Heading, useToast } from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const toast = useToast();
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (password !== confirm) {
			toast({ title: 'Passwords do not match', status: 'warning', duration: 2000 });
			return;
		}
		setIsLoading(true);
		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Registration failed');
			toast({ title: 'Registration successful', status: 'success', duration: 2000 });
			navigate('/login');
		} catch (err) {
			toast({ title: 'Error', description: err.message, status: 'error', duration: 2500 });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Box maxW="md" mx="auto" mt={12} p={6} borderWidth={1} borderRadius="md">
			<Heading size="md" mb={4}>Create account</Heading>
			<form onSubmit={handleSubmit}>
				<FormControl mb={4} isRequired>
					<FormLabel>Email</FormLabel>
					<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
				</FormControl>
				<FormControl mb={4} isRequired>
					<FormLabel>Password</FormLabel>
					<Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
				</FormControl>
				<FormControl mb={6} isRequired>
					<FormLabel>Confirm Password</FormLabel>
					<Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
				</FormControl>
				<Button type="submit" colorScheme="blue" isLoading={isLoading} width="100%">Register</Button>
			</form>
			<Box mt={4}>
				Already have an account? <Button as={Link} to="/login" variant="link" colorScheme="blue">Login</Button>
			</Box>
		</Box>
	);
};

export default Register;

