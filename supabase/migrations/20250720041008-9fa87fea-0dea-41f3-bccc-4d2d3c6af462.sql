-- Temporarily disable the different_users constraint to insert test data
ALTER TABLE public.chats DROP CONSTRAINT different_users;

-- Insert test chats using the same user for both sides (for testing purposes)
INSERT INTO public.chats (chat_id, user1_id, user2_id, messages, updated_at) VALUES
(
  gen_random_uuid(),
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b',
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b',
  '[
    {
      "id": "msg1",
      "text": "Test conversation with Sarah - Hey! How are you doing?",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-19T15:30:00Z"
    },
    {
      "id": "msg2", 
      "text": "Hi! I''m doing great, thanks for asking. Just got back from a hiking trip!",
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
      "text": "Chat with Mike - What''s your favorite cuisine to cook?",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-20T10:15:00Z"
    },
    {
      "id": "msg2",
      "text": "I love making Italian dishes! Just made fresh pasta yesterday.",
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
      "text": "Conversation with Emma - Your art looks incredible! Do you have a gallery?",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-20T14:20:00Z"
    },
    {
      "id": "msg2",
      "text": "Thank you so much! I''m actually working on opening one soon ☕",
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
      "text": "Chat with David - What kind of music do you play?",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-18T20:45:00Z"
    },
    {
      "id": "msg2",
      "text": "I play mostly jazz and blues on guitar. Love jamming with friends!",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-18T20:50:00Z"
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
      "text": "Lisa chat - I saw your travel blog! Where''s your favorite destination?",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b", 
      "timestamp": "2025-07-20T11:30:00Z"
    },
    {
      "id": "msg2",
      "text": "That''s such a hard question! I''d say Bali for the yoga retreats and culture 🧘‍♀️",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-20T11:35:00Z"
    },
    {
      "id": "msg3",
      "text": "Bali sounds amazing! I''ve always wanted to visit.",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-20T11:40:00Z"
    }
  ]'::jsonb,
  '2025-07-20T11:40:00Z'
);

-- Re-enable the constraint for production use
ALTER TABLE public.chats ADD CONSTRAINT different_users CHECK (user1_id <> user2_id);