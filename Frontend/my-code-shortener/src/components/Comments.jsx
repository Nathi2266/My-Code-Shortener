import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  Textarea,
  Button,
  VStack,
  HStack,
  Divider,
  useToast,
  FormControl,
  FormLabel
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';

const Comments = ({ fileId }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!fileId) return;
    try {
      const res = await fetch(`/api/comments/${fileId}`);
      if (!res.ok) return;
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (e) {
      // ignore
    }
  }, [fileId]);

  useEffect(() => {
    fetchComments();
    if (!fileId) return;
    const interval = setInterval(fetchComments, 5000);
    return () => clearInterval(interval);
  }, [fileId, fetchComments]);

  const handleSubmit = async () => {
    const content = (newComment || '').trim();
    if (!content) {
      toast({ title: 'Comment cannot be empty', status: 'warning', duration: 2000 });
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ file_id: fileId, comment: content })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to post comment');
      }
      const saved = await res.json();
      setNewComment('');
      setComments((prev) => [saved, ...prev]);
      toast({ title: 'Comment posted', status: 'success', duration: 1500 });
    } catch (e) {
      toast({ title: 'Error', description: e.message, status: 'error', duration: 2000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box mt={8} p={4} borderWidth={1} borderRadius="md">
      <Heading size="md" mb={4}>Comments & Feedback</Heading>

      <VStack align="stretch" spacing={3} mb={4}>
        {comments.length === 0 && (
          <Text color="gray.500">No comments yet. Be the first to share feedback.</Text>
        )}
        {comments.map((c) => (
          <Box key={c.id} p={3} borderWidth={1} borderRadius="md" bg="blackAlpha.50">
            <HStack justify="space-between" mb={1}>
              <Text fontWeight="bold">{c.username}</Text>
              <Text fontSize="sm" color="gray.500">{new Date(c.timestamp).toLocaleString()}</Text>
            </HStack>
            <Divider mb={2} />
            <Text whiteSpace="pre-wrap">{c.comment}</Text>
          </Box>
        ))}
      </VStack>

      <Box opacity={user ? 1 : 0.6} pointerEvents={user ? 'auto' : 'none'}>
        <FormControl>
          <FormLabel>Leave a comment</FormLabel>
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? 'Share your thoughts...' : 'Login to post a comment'}
            resize="vertical"
            minH="100px"
          />
        </FormControl>
        <HStack mt={3} justify="flex-end">
          <Button colorScheme="blue" onClick={handleSubmit} isLoading={isSubmitting}>Post Comment</Button>
        </HStack>
      </Box>
    </Box>
  );
};

export default Comments;


