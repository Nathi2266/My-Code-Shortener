import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';

const Sessions = () => {
  const mockSessions = [
    { id: 1, codePreview: 'function example() {...}', timestamp: '2024-02-20' }
  ];

  return (
    <Box>
      <Heading mb={6}>Past Sessions</Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Timestamp</Th>
            <Th>Code Preview</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {mockSessions.map(session => (
            <Tr key={session.id}>
              <Td>{session.timestamp}</Td>
              <Td>{session.codePreview}</Td>
              <Td>Re-run</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default Sessions;
