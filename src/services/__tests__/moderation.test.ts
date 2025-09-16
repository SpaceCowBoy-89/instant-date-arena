import { describe, it, expect, beforeEach, vi } from 'vitest';
import { moderateText, enforceContentPolicy } from '../moderation';

// Mock dependencies
vi.mock('@tensorflow/tfjs', () => ({
  ready: vi.fn().mockResolvedValue(undefined),
  tensor2d: vi.fn().mockReturnValue({
    dataSync: vi.fn().mockReturnValue([0.1, 0.8, 0.1])
  }),
  dispose: vi.fn()
}));

vi.mock('@tensorflow/tfjs-tflite', () => ({
  loadTFLiteModel: vi.fn().mockResolvedValue({
    predict: vi.fn().mockReturnValue({
      argMax: vi.fn().mockReturnValue({
        dataSync: vi.fn().mockReturnValue([0]) // Safe prediction
      })
    })
  })
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

      expect(['safe', 'unsafe', 'error']).toContain(result);
    });

    it('should handle empty text input', async () => {
      const result = await moderateText('');

      expect(['safe', 'unsafe', 'error']).toContain(result);
    });

    it('should detect offensive language', async () => {
      const result = await moderateText('This contains offensive content');

      expect(['safe', 'unsafe', 'error']).toContain(result);
    });

    it('should handle long text input', async () => {
      const longText = 'This is a very long message. '.repeat(100);
      const result = await moderateText(longText);

      expect(['safe', 'unsafe', 'error']).toContain(result);
    });
  });

  describe('enforceContentPolicy', () => {
    it('should allow safe content', () => {
      const moderationResult = {
        result: 'safe',
        category: 'safe',
        confidence: 0.95
      };

      const policy = enforceContentPolicy(moderationResult);

      expect(policy.action).toBe('allow');
      expect(policy.confidence).toBe(0.95);
    });

    it('should block unsafe content', () => {
      const moderationResult = {
        result: 'unsafe',
        category: 'offensive',
        confidence: 0.92
      };

      const policy = enforceContentPolicy(moderationResult);

      expect(policy.action).toBe('block');
    });

    it('should handle error cases', () => {
      const policy = enforceContentPolicy(null);

      expect(policy.action).toBe('block');
      expect(policy.reason).toContain('Unable to verify');
    });

    it('should handle review needed cases', () => {
      const moderationResult = {
        result: 'review_needed',
        category: 'uncertain',
        confidence: 0.65
      };

      const policy = enforceContentPolicy(moderationResult);

      expect(policy.action).toBe('review');
      expect(policy.reason).toContain('human review');
    });
  });
});

describe('Text Moderation Performance', () => {
  it('should maintain performance under load', async () => {
    const startTime = performance.now();

    const texts = Array(10).fill('Test message for moderation performance');

    const results = await Promise.all(
      texts.map(text => moderateText(text))
    );
    const endTime = performance.now();

    expect(results).toHaveLength(10);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
  });
});