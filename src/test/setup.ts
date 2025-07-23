import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.visualViewport
Object.defineProperty(window, 'visualViewport', {
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    height: 800,
  },
  writable: true,
})

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()