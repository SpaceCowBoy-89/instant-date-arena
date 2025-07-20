-- Create test chats using only the existing user ID by creating self-conversations for testing
-- This will populate the messages page with test data

INSERT INTO public.chats (chat_id, user1_id, user2_id, messages, updated_at) VALUES
(
  gen_random_uuid(),
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b',
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b', -- same user for testing
  '[
    {
      "id": "msg1",
      "text": "Test message 1 - This is a sample conversation",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-19T15:30:00Z"
    },
    {
      "id": "msg2", 
      "text": "Test message 2 - Another sample message",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-19T15:32:00Z"
    }
  ]'::jsonb,
  '2025-07-19T15:35:00Z'
),
(
  gen_random_uuid(),
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b', 
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b',
  '[
    {
      "id": "msg1",
      "text": "Conversation 2 - Testing the chat system",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-20T10:15:00Z"
    },
    {
      "id": "msg2",
      "text": "This should show up in the messages list",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-20T10:18:00Z"
    }
  ]'::jsonb,
  '2025-07-20T10:18:00Z'
),
(
  gen_random_uuid(),
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b',
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b',
  '[
    {
      "id": "msg1", 
      "text": "Conversation 3 - More test content",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-20T14:20:00Z"
    },
    {
      "id": "msg2",
      "text": "This is working great for testing!",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-20T14:25:00Z"
    }
  ]'::jsonb,
  '2025-07-20T14:25:00Z'
),
(
  gen_random_uuid(),
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b',
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b',
  '[
    {
      "id": "msg1",
      "text": "Fourth conversation for testing",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-18T20:45:00Z"
    }
  ]'::jsonb,
  '2025-07-18T20:45:00Z'
),
(
  gen_random_uuid(),
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b',
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b',
  '[
    {
      "id": "msg1",
      "text": "Last test conversation",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b", 
      "timestamp": "2025-07-20T11:30:00Z"
    },
    {
      "id": "msg2",
      "text": "Perfect for testing the UI layout",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-20T11:35:00Z"
    }
  ]'::jsonb,
  '2025-07-20T11:40:00Z'
);