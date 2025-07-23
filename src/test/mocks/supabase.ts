import { vi } from 'vitest'

// Mock chat data
export const mockChatData = {
  chat_id: 'test-chat-id',
  user1_id: 'user1',
  user2_id: 'user2',
  messages: [],
  temporary_messages: [
    {
      id: 'msg1',
      text: 'Hello!',
      sender_id: 'user1',
      timestamp: '2025-07-23T22:00:00Z'
    }
  ],
  timer_start_time: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  status: 'active'
}

export const mockUser1 = {
  id: 'user1',
  user_metadata: { name: 'User One' }
}

export const mockUser2 = {
  id: 'user2',
  name: 'User Two',
  age: 25,
  bio: 'Test bio'
}

// Mock Supabase client
export const createMockSupabase = () => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockResolvedValue('SUBSCRIBED'),
    track: vi.fn().mockResolvedValue({ status: 'ok' }),
    presenceState: vi.fn().mockReturnValue({}),
  }

  const mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser1 } })
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockChatData, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  }

  return { mockSupabase, mockChannel }
}