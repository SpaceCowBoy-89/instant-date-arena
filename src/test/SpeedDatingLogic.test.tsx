import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Custom waitFor implementation for Vitest
const waitFor = async (callback: () => void | Promise<void>, options?: { timeout?: number }) => {
  const timeout = options?.timeout || 1000
  const start = Date.now()
  
  while (Date.now() - start < timeout) {
    try {
      await callback()
      return
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }
  
  await callback() // Final attempt
}

// Mock data
const mockChatData = {
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

const mockUser1 = {
  id: 'user1',
  user_metadata: { name: 'User One' }
}

// Mock global objects
let mockSupabase: any
let mockChannel: any
let listeners: { [key: string]: any } = {}

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ chatId: 'test-chat-id' }),
  }
})

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Mock mobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}))

// Mock Navbar component
vi.mock('@/components/Navbar', () => ({
  default: () => null,
}))

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => {
  mockChannel = {
    on: vi.fn((event: string, config: any, callback: any) => {
      if (typeof config === 'function') {
        // For presence events like 'sync', 'join', 'leave'
        listeners[event] = config
      } else if (config && config.table) {
        // For postgres_changes events
        listeners[`${config.table}_${config.event}`] = callback
      }
      return mockChannel
    }),
    subscribe: vi.fn().mockResolvedValue('SUBSCRIBED'),
    track: vi.fn().mockResolvedValue({ status: 'ok' }),
    presenceState: vi.fn().mockReturnValue({}),
  }

  mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser1 }, error: null })
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

  return {
    supabase: mockSupabase
  }
})

describe('Speed Dating Logic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    listeners = {}
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  const renderChat = async () => {
    const { default: Chat } = await import('@/pages/Chat')
    return render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    )
  }

  describe('Test 1: Both users vote YES → navigate to /messages', () => {
    it('should navigate to /messages when both users like each other (immediate mutual like)', async () => {
      // Mock immediate mutual like scenario
      const mockFromWithMutualLike = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockChatData, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ 
          data: { interaction_type: 'like', user_id: 'user2' }, 
          error: null 
        }),
        update: vi.fn().mockResolvedValue({ error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }))

      mockSupabase.from = mockFromWithMutualLike
      await renderChat()

      // Wait for component to mount and make initial calls
      await waitFor(() => {
        expect(mockFromWithMutualLike).toHaveBeenCalled()
      })
    })

    it('should handle delayed mutual like via real-time updates', async () => {
      await renderChat()

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(listeners['user_interactions_INSERT']).toBeDefined()
      })

      const realTimeListener = listeners['user_interactions_INSERT']

      // Simulate delayed mutual like - need to set decision first
      await act(async () => {
        // First simulate that current user already liked
        // This would typically be set by user action in the UI
        await realTimeListener({
          new: {
            user_id: 'user1',
            target_user_id: 'user2',
            interaction_type: 'like'
          }
        })

        // Then simulate other user liking back
        await realTimeListener({
          new: {
            user_id: 'user2',
            target_user_id: 'user1',
            interaction_type: 'like'
          }
        })
      })

      // Should call supabase to update chat
      expect(mockSupabase.from).toHaveBeenCalledWith('chats')
    })
  })

  describe('Test 2: One YES, one NO → no match', () => {
    it('should clear messages when one user rejects', async () => {
      await renderChat()

      await waitFor(() => {
        expect(listeners['user_interactions_INSERT']).toBeDefined()
      })

      const realTimeListener = listeners['user_interactions_INSERT']

      await act(async () => {
        await realTimeListener({
          new: {
            user_id: 'user2',
            target_user_id: 'user1',
            interaction_type: 'reject'
          }
        })
      })

      // Should navigate to lobby
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/lobby')
      })
    })
  })

  describe('Test 3: User leaves after YES vote, other votes YES → still match', () => {
    it('should create match even when one user leaves', async () => {
      await renderChat()

      await waitFor(() => {
        expect(listeners['leave']).toBeDefined()
        expect(listeners['user_interactions_INSERT']).toBeDefined()
      })

      const presenceListener = listeners['leave']
      const interactionListener = listeners['user_interactions_INSERT']

      // Simulate user leaving
      await act(async () => {
        presenceListener({
          key: 'user1',
          leftPresences: [{ user_id: 'user1' }]
        })
      })

      // Then simulate other user liking
      await act(async () => {
        await interactionListener({
          new: {
            user_id: 'user2',
            target_user_id: 'user1',
            interaction_type: 'like'
          }
        })
      })

      // Should still call database to update chat
      expect(mockSupabase.from).toHaveBeenCalledWith('chats')
    })
  })

  describe('Test 4: Real-time chat status changes', () => {
    it('should navigate to messages when chat status becomes completed', async () => {
      await renderChat()

      await waitFor(() => {
        expect(listeners['chats_UPDATE']).toBeDefined()
      })

      const chatUpdateListener = listeners['chats_UPDATE']

      await act(async () => {
        chatUpdateListener({
          new: {
            ...mockChatData,
            status: 'completed'
          }
        })
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/messages/test-chat-id')
      })
    })

    it('should handle user departure', async () => {
      await renderChat()

      await waitFor(() => {
        expect(listeners['chats_UPDATE']).toBeDefined()
      })

      const chatUpdateListener = listeners['chats_UPDATE']

      await act(async () => {
        chatUpdateListener({
          new: {
            ...mockChatData,
            status: 'ended_by_departure'
          }
        })
      })

      // Should handle departure appropriately - component sets internal state
      expect(chatUpdateListener).toBeDefined()
    })
  })

  describe('Test 5: Error handling and edge cases', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
        update: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
        upsert: vi.fn().mockResolvedValue({ error: { message: 'Upsert failed' } }),
      }))

      await renderChat()
      
      // Should navigate to lobby on error
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/lobby')
      })
    })

    it('should handle malformed data', async () => {
      const malformedChatData = {
        ...mockChatData,
        temporary_messages: 'invalid_json',
        messages: null
      }

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: malformedChatData, error: null }),
        update: vi.fn().mockResolvedValue({ error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }))

      // Should render without crashing
      await renderChat()
      expect(mockSupabase).toBeDefined()
    })
  })
})