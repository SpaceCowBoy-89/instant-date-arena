-- Insert test users for chat threads
INSERT INTO public.users (id, name, gender, age, location, bio, photo_url) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Sarah Johnson', 'Female', 28, 'New York', 'Love hiking and photography', 'https://images.unsplash.com/photo-1494790108755-2616b75968e3?w=400'),
('550e8400-e29b-41d4-a716-446655440002', 'Mike Chen', 'Male', 32, 'San Francisco', 'Software engineer who loves cooking', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'),
('550e8400-e29b-41d4-a716-446655440003', 'Emma Rodriguez', 'Female', 26, 'Los Angeles', 'Artist and coffee enthusiast', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'),
('550e8400-e29b-41d4-a716-446655440004', 'David Kim', 'Male', 29, 'Chicago', 'Musician and dog lover', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'),
('550e8400-e29b-41d4-a716-446655440005', 'Lisa Zhang', 'Female', 31, 'Seattle', 'Travel blogger and yoga instructor', 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400')
ON CONFLICT (id) DO NOTHING;

-- Insert test chat threads (assuming current user is 0f54ba57-1aaf-46db-8862-2f967ad64a1b based on console logs)
INSERT INTO public.chats (chat_id, user1_id, user2_id, messages, updated_at) VALUES
(
  gen_random_uuid(),
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b',
  '550e8400-e29b-41d4-a716-446655440001',
  '[
    {
      "id": "msg1",
      "text": "Hey! How are you doing?",
      "sender_id": "550e8400-e29b-41d4-a716-446655440001",
      "timestamp": "2025-07-19T15:30:00Z"
    },
    {
      "id": "msg2", 
      "text": "Hi Sarah! I''m doing great, thanks for asking. How about you?",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-19T15:32:00Z"
    },
    {
      "id": "msg3",
      "text": "I''m good! Just got back from a hiking trip. The photos came out amazing!",
      "sender_id": "550e8400-e29b-41d4-a716-446655440001", 
      "timestamp": "2025-07-19T15:35:00Z"
    }
  ]'::jsonb,
  '2025-07-19T15:35:00Z'
),
(
  gen_random_uuid(),
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b', 
  '550e8400-e29b-41d4-a716-446655440002',
  '[
    {
      "id": "msg1",
      "text": "What''s your favorite cuisine to cook?",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-20T10:15:00Z"
    },
    {
      "id": "msg2",
      "text": "I love making Italian dishes! Just made fresh pasta yesterday. You?",
      "sender_id": "550e8400-e29b-41d4-a716-446655440002",
      "timestamp": "2025-07-20T10:18:00Z"
    }
  ]'::jsonb,
  '2025-07-20T10:18:00Z'
),
(
  gen_random_uuid(),
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b',
  '550e8400-e29b-41d4-a716-446655440003',
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
      "sender_id": "550e8400-e29b-41d4-a716-446655440003",
      "timestamp": "2025-07-20T14:25:00Z"
    }
  ]'::jsonb,
  '2025-07-20T14:25:00Z'
),
(
  gen_random_uuid(),
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b',
  '550e8400-e29b-41d4-a716-446655440004', 
  '[
    {
      "id": "msg1",
      "text": "What kind of music do you play?",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b",
      "timestamp": "2025-07-18T20:45:00Z"
    }
  ]'::jsonb,
  '2025-07-18T20:45:00Z'
),
(
  gen_random_uuid(),
  '0f54ba57-1aaf-46db-8862-2f967ad64a1b',
  '550e8400-e29b-41d4-a716-446655440005',
  '[
    {
      "id": "msg1",
      "text": "I saw your travel blog! Where''s your favorite destination?",
      "sender_id": "0f54ba57-1aaf-46db-8862-2f967ad64a1b", 
      "timestamp": "2025-07-20T11:30:00Z"
    },
    {
      "id": "msg2",
      "text": "That''s such a hard question! I''d say Bali for the yoga retreats and culture 🧘‍♀️",
      "sender_id": "550e8400-e29b-41d4-a716-446655440005",
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