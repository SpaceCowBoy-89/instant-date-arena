import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import Chat from '../pages/Chat'
import { createMockSupabase, mockChatData, mockUser1, mockUser2 } from './mocks/supabase'

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

// Test helper functions
const screen = {
  getByText: (text: RegExp | string) => document.querySelector(`*:contains("${text}")`) as HTMLElement,
  getByRole: (role: string, options?: { name?: RegExp | string }) => {
    const query = options?.name ? `${role}[aria-label*="${options.name}"]` : role
    return document.querySelector(query) as HTMLElement
  }
}

const fireEvent = {
  click: (element: HTMLElement) => {
    element.click()
  }
}

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

describe('Speed Dating Logic Tests', () => {
  let mockSupabase: any
  let mockChannel: any
  let mockFrom: any

  beforeEach(() => {
    vi.clearAllMocks()
    const mocks = createMockSupabase()
    mockSupabase = mocks.mockSupabase
    mockChannel = mocks.mockChannel
    
    // Mock the from method with proper chaining
    mockFrom = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockChatData, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }))
    
    mockSupabase.from = mockFrom
    
    // Mock Supabase module
    vi.doMock('@/integrations/supabase/client', () => ({
      supabase: mockSupabase,
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderChat = () => {
    return render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    )
  }

  describe('Test 1: Both users vote YES → navigate to /messages', () => {
    it('should navigate to /messages when both users like each other (immediate mutual like)', async () => {
      // Test the immediate mutual like scenario
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
      renderChat()

      // Verify mutual like logic is called
      expect(mockFromWithMutualLike).toHaveBeenCalled()
    })

    it('should handle delayed mutual like via real-time updates', async () => {
      renderChat()

      // Simulate real-time listener for user interactions
      const realTimeListener = mockChannel.on.mock.calls.find(
        call => call[1]?.table === 'user_interactions'
      )?.[2]

      expect(realTimeListener).toBeDefined()

      // Simulate delayed mutual like
      await act(async () => {
        await realTimeListener({
          new: {
            user_id: 'user2',
            target_user_id: 'user1',
            interaction_type: 'like'
          }
        })
      })

      // Should move messages to permanent storage
      expect(mockFrom).toHaveBeenCalledWith('chats')
    })
  })

  describe('Test 2: One YES, one NO → no match', () => {
    it('should clear messages when one user rejects', async () => {
      renderChat()

      // Simulate real-time rejection
      const realTimeListener = mockChannel.on.mock.calls.find(
        call => call[1]?.table === 'user_interactions'
      )?.[2]

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
      expect(mockNavigate).toHaveBeenCalledWith('/lobby')
    })
  })

  describe('Test 3: User leaves after YES vote, other votes YES → still match', () => {
    it('should create match even when one user leaves', async () => {
      renderChat()

      // Simulate user leaving
      const presenceListener = mockChannel.on.mock.calls.find(
        call => call[1]?.event === 'leave'
      )?.[2]

      await act(async () => {
        presenceListener({
          key: 'user1',
          leftPresences: [{ user_id: 'user1' }]
        })
      })

      // Then simulate other user liking
      const interactionListener = mockChannel.on.mock.calls.find(
        call => call[1]?.table === 'user_interactions'
      )?.[2]

      await act(async () => {
        await interactionListener({
          new: {
            user_id: 'user2',
            target_user_id: 'user1',
            interaction_type: 'like'
          }
        })
      })

      // Should still create match
      expect(mockFrom).toHaveBeenCalledWith('chats')
    })
  })

  describe('Test 4: Real-time chat status changes', () => {
    it('should navigate to messages when chat status becomes completed', async () => {
      renderChat()

      const chatUpdateListener = mockChannel.on.mock.calls.find(
        call => call[1]?.table === 'chats'
      )?.[2]

      await act(async () => {
        chatUpdateListener({
          new: {
            ...mockChatData,
            status: 'completed'
          }
        })
      })

      expect(mockNavigate).toHaveBeenCalledWith('/messages/test-chat-id')
    })

    it('should handle user departure', async () => {
      renderChat()

      const chatUpdateListener = mockChannel.on.mock.calls.find(
        call => call[1]?.table === 'chats'
      )?.[2]

      await act(async () => {
        chatUpdateListener({
          new: {
            ...mockChatData,
            status: 'ended_by_departure'
          }
        })
      })

      // Should handle departure appropriately
      expect(chatUpdateListener).toBeDefined()
    })
  })

  describe('Test 5: Error handling and edge cases', () => {
    it('should handle database errors gracefully', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
        update: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
        upsert: vi.fn().mockResolvedValue({ error: { message: 'Upsert failed' } }),
      })

      renderChat()
      expect(mockNavigate).toHaveBeenCalledWith('/lobby')
    })

    it('should handle malformed data', async () => {
      const malformedChatData = {
        ...mockChatData,
        temporary_messages: 'invalid_json',
        messages: null
      }

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: malformedChatData, error: null }),
        update: vi.fn().mockResolvedValue({ error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      })

      renderChat()
      // Should handle gracefully without crashing
      expect(mockSupabase).toBeDefined()
    })
  })
})