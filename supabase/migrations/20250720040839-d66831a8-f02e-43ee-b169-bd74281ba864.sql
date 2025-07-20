-- Create test chats with fake other users (we'll create minimal user profiles for display)
-- Using your existing user ID and creating simple test conversations

INSERT INTO public.chats (chat_id, user1_id, user2_id, messages, updated_at) VALUES
(
  gen_random_uuid(),
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b',
  '0f54ba57-1aaf-46db-8862-2f967ad64a1c', -- fake user ID
  '[
    {
      "id": "msg1",
      "text": "Hey! How are you doing?",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1c",
      "timestamp": "2025-07-19T15:30:00Z"
    },
    {
      "id": "msg2", 
      "text": "Hi! I''m doing great, thanks for asking. How about you?",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-19T15:32:00Z"
    }
  ]'::jsonb,
  '2025-07-19T15:35:00Z'
),
(
  gen_random_uuid(),
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b', 
  '0f54ba57-1aaf-46db-8862-2f967ad64a1d', -- fake user ID
  '[
    {
      "id": "msg1",
      "text": "What''s your favorite cuisine to cook?",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-20T10:15:00Z"
    },
    {
      "id": "msg2",
      "text": "I love making Italian dishes! Just made fresh pasta yesterday.",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1d",
      "timestamp": "2025-07-20T10:18:00Z"
    }
  ]'::jsonb,
  '2025-07-20T10:18:00Z'
),
(
  gen_random_uuid(),
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b',
  '0f54ba57-1aaf-46db-8862-2f967ad64a1e', -- fake user ID
  '[
    {
      "id": "msg1", 
      "text": "Your art looks incredible! Do you have a gallery?",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-20T14:20:00Z"
    },
    {
      "id": "msg2",
      "text": "Thank you so much! I''m actually working on opening one soon ☕",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1e",
      "timestamp": "2025-07-20T14:25:00Z"
    }
  ]'::jsonb,
  '2025-07-20T14:25:00Z'
);