-- Remove the constraint permanently for testing purposes (can be re-added later in production)
-- The constraint is already dropped from the previous migration

-- Insert test chats with descriptive names in the messages to simulate different conversations
INSERT INTO public.chats (chat_id, user1_id, user2_id, messages, updated_at) VALUES
(
  gen_random_uuid(),
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b',
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b',
  '[
    {
      "id": "msg1",
      "text": "Hey Sarah! How are you doing?",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-19T15:30:00Z"
    },
    {
      "id": "msg2", 
      "text": "Hi Christopher! I''m doing great, thanks! Just got back from a hiking trip. The photos came out amazing!",
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
      "text": "Mike, what''s your favorite cuisine to cook?",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-20T10:15:00Z"
    },
    {
      "id": "msg2",
      "text": "I love making Italian dishes! Just made fresh pasta yesterday. You should try my recipe!",
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
      "text": "Emma, your art looks incredible! Do you have a gallery?",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-20T14:20:00Z"
    },
    {
      "id": "msg2",
      "text": "Thank you so much Christopher! I''m actually working on opening one soon ☕ Would love to have you at the opening!",
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
      "text": "David, what kind of music do you play?",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-18T20:45:00Z"
    },
    {
      "id": "msg2",
      "text": "I play mostly jazz and blues on guitar. Love jamming with friends! We should play together sometime.",
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
      "text": "Lisa, I saw your travel blog! Where''s your favorite destination?",
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
      "text": "Bali sounds amazing! I''ve always wanted to visit. Any recommendations for first-timers?",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-20T11:40:00Z"
    }
  ]'::jsonb,
  '2025-07-20T11:40:00Z'
);