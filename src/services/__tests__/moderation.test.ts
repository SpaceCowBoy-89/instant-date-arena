import { describe, it, expect, beforeEach, vi } from 'vitest';
import { moderateText, enforceContentPolicy } from '@/services/moderation';

// Mock dependencies
vi.mock('@tensorflow/tfjs', () => ({
  ready: vi.fn().mockResolvedValue(undefined),
  tensor2d: vi.fn().mockReturnValue({
    dataSync: vi.fn().mockReturnValue([0.1, 0.8, 0.1])
  }),
  dispose: vi.fn()
}));

vi.mock('onnxruntime-web', () => ({
  InferenceSession: {
    create: vi.fn().mockResolvedValue({
      run: vi.fn().mockResolvedValue({
        'last_hidden_state': {
          data: Array(384).fill(0.1) // Mock embedding
        }
      })
    })
  },
  Tensor: vi.fn().mockImplementation((type, data, shape) => ({
    type,
    data,
    shape
  }))
}));

vi.mock('@xenova/transformers', () => ({
  AutoTokenizer: {
    from_pretrained: vi.fn().mockResolvedValue({
      encode: vi.fn().mockReturnValue({
        input_ids: [101, 1188, 102],
        attention_mask: [1, 1, 1]
      })
    })
  }
}));

describe('Text Moderation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('moderateText', () => {
    it('should return moderation result for text input', async () => {
      const result = await moderateText('This is a test message');
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('isAppropriate');
      expect(result).toHaveProperty('confidence');
    });

    it('should flag inappropriate text', async () => {
      const result = await moderateText('This contains hate speech');
      expect(result.isAppropriate).toBe(false);
    });

    it('should approve safe text', async () => {
      const result = await moderateText('This is a friendly message');
      expect(result.isAppropriate).toBe(true);
    });
  });

  describe('enforceContentPolicy', () => {
    it('should allow safe content', async () => {
      const result = await enforceContentPolicy('This is safe text');
      expect(result).toBe(true);
    });

    it('should block unsafe content', async () => {
      const result = await enforceContentPolicy('This is inappropriate text');
      expect(result).toBe(false);
    });

    it('should handle hate speech', async () => {
      const result = await enforceContentPolicy('This text contains hate speech');
      expect(result).toBe(false);
    });
  });
});