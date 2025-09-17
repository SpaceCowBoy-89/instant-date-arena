import { useEffect, useState, useCallback, useRef } from 'react';
import { subscriptionManager } from '@/utils/SubscriptionManager';
import { connectionPoolManager } from '@/utils/ConnectionPoolManager';
import { logger } from '@/utils/logger';

interface ConnectionOptimizationConfig {
  enablePooling?: boolean;
  enableBatching?: boolean;
  batchWindow?: number;
  maxRetries?: number;
  healthCheckInterval?: number;
  enableMetrics?: boolean;
}

interface ConnectionMetrics {
  totalConnections: number;
  activeSubscriptions: number;
  poolUtilization: number;
  avgResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  networkEfficiency: number;
}

interface BatchedOperation {
  type: 'subscribe' | 'unsubscribe' | 'update';
  config: any;
  callback?: (result: any) => void;
  timestamp: number;
}

export function useConnectionOptimization(config: ConnectionOptimizationConfig = {}) {
  const {
    enablePooling = true,
    enableBatching = true,
    batchWindow = 100,
    maxRetries = 3,
    healthCheckInterval = 30000,
    enableMetrics = true
  } = config;

  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    totalConnections: 0,
    activeSubscriptions: 0,
    poolUtilization: 0,
    avgResponseTime: 0,
    errorRate: 0,
    memoryUsage: 0,
    networkEfficiency: 100
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const batchQueueRef = useRef<BatchedOperation[]>([]);
  const metricsIntervalRef = useRef<NodeJS.Timeout>();
  const batchTimeoutRef = useRef<NodeJS.Timeout>();
  const responseTimesRef = useRef<number[]>([]);
  const errorCountRef = useRef(0);
  const operationCountRef = useRef(0);

  // Process batched operations
  const processBatch = useCallback(async () => {
    if (batchQueueRef.current.length === 0) return;

    const batch = [...batchQueueRef.current];
    batchQueueRef.current = [];

    logger.info(`🔄 Processing batch of ${batch.length} operations`);

    const startTime = Date.now();
    const results = await Promise.allSettled(
      batch.map(async (operation) => {
        switch (operation.type) {
          case 'subscribe':
            return await subscriptionManager.subscribe(operation.config);
          case 'unsubscribe':
            return await subscriptionManager.unsubscribe(operation.config);
          default:
            return null;
        }
      })
    );

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    responseTimesRef.current.push(responseTime);

    // Keep only last 100 response times for averaging
    if (responseTimesRef.current.length > 100) {
      responseTimesRef.current = responseTimesRef.current.slice(-100);
    }

    // Update error count
    const errors = results.filter(r => r.status === 'rejected').length;
    errorCountRef.current += errors;
    operationCountRef.current += batch.length;

    // Execute callbacks
    batch.forEach((operation, index) => {
      const result = results[index];
      if (operation.callback) {
        if (result.status === 'fulfilled') {
          operation.callback(result.value);
        } else {
          operation.callback({ error: result.reason });
        }
      }
    });

    logger.info(`✅ Batch processed in ${responseTime}ms with ${errors} errors`);
  }, []);

  // Add operation to batch queue
  const queueOperation = useCallback((operation: BatchedOperation) => {
    if (!enableBatching) {
      // Process immediately if batching is disabled
      processBatch();
      return;
    }

    batchQueueRef.current.push(operation);

    // Clear existing timeout and set new one
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(processBatch, batchWindow);
  }, [enableBatching, batchWindow, processBatch]);

  // Optimized subscribe function
  const optimizedSubscribe = useCallback(async (config: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      queueOperation({
        type: 'subscribe',
        config,
        callback: (result) => {
          if (result.error) {
            reject(result.error);
          } else {
            resolve(result);
          }
        },
        timestamp: Date.now()
      });
    });
  }, [queueOperation]);

  // Optimized unsubscribe function
  const optimizedUnsubscribe = useCallback(async (key: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      queueOperation({
        type: 'unsubscribe',
        config: key,
        callback: (result) => {
          if (result.error) {
            reject(result.error);
          } else {
            resolve();
          }
        },
        timestamp: Date.now()
      });
    });
  }, [queueOperation]);

  // Auto-optimization routine
  const runOptimization = useCallback(async () => {
    if (isOptimizing) return;

    setIsOptimizing(true);
    logger.info('🚀 Running connection optimization...');

    try {
      // Clean up idle subscriptions
      const subscriptionCleanup = await subscriptionManager.forceCleanup();
      
      // Optimize connection pool if enabled
      let poolOptimization = { closed: 0, rebalanced: 0, errors: [] };
      if (enablePooling) {
        poolOptimization = await connectionPoolManager.optimize();
      }

      // Force garbage collection if available
      if (typeof window !== 'undefined' && 'gc' in window) {
        (window as any).gc();
      }

      logger.info('✅ Optimization complete:', {
        subscriptionsRemoved: subscriptionCleanup,
        poolOptimization
      });

    } catch (error) {
      logger.error('❌ Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [isOptimizing, enablePooling]);

  // Calculate network efficiency score
  const calculateNetworkEfficiency = useCallback(() => {
    const avgResponseTime = responseTimesRef.current.length > 0
      ? responseTimesRef.current.reduce((a, b) => a + b, 0) / responseTimesRef.current.length
      : 0;

    const errorRate = operationCountRef.current > 0
      ? (errorCountRef.current / operationCountRef.current) * 100
      : 0;

    // Efficiency score based on response time and error rate  
    const responseScore = Math.max(0, 100 - (avgResponseTime / 10)); // 10ms = 99 points, 1000ms = 0 points
    const errorScore = Math.max(0, 100 - (errorRate * 10)); // 1% error = 90 points, 10% error = 0 points
    
    return Math.round((responseScore + errorScore) / 2);
  }, []);

  // Update metrics
  const updateMetrics = useCallback(async () => {
    if (!enableMetrics) return;

    try {
      const subscriptionStats = subscriptionManager.getStats();
      const poolStats = enablePooling ? connectionPoolManager.getMetrics() : null;

      const avgResponseTime = responseTimesRef.current.length > 0
        ? responseTimesRef.current.reduce((a, b) => a + b, 0) / responseTimesRef.current.length
        : 0;

      const errorRate = operationCountRef.current > 0
        ? (errorCountRef.current / operationCountRef.current) * 100
        : 0;

      const newMetrics: ConnectionMetrics = {
        totalConnections: poolStats?.totalConnections || subscriptionStats.totalSubscriptions,
        activeSubscriptions: subscriptionStats.activeSubscriptions,
        poolUtilization: poolStats ? (poolStats.activeConnections / Math.max(1, poolStats.totalConnections)) * 100 : 0,
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        memoryUsage: Math.round((poolStats?.memoryUsage || 0) / 1024), // Convert to KB
        networkEfficiency: calculateNetworkEfficiency()
      };

      setMetrics(newMetrics);

      // Auto-optimize if metrics are poor
      if (newMetrics.errorRate > 5 || newMetrics.avgResponseTime > 5000 || newMetrics.networkEfficiency < 50) {
        logger.warn('📊 Poor performance metrics detected, running optimization...', newMetrics);
        await runOptimization();
      }

    } catch (error) {
      logger.error('❌ Failed to update metrics:', error);
    }
  }, [enableMetrics, enablePooling, calculateNetworkEfficiency, runOptimization]);

  // Setup metrics collection
  useEffect(() => {
    if (!enableMetrics) return;

    metricsIntervalRef.current = setInterval(updateMetrics, healthCheckInterval);
    
    // Initial metrics update
    updateMetrics();

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [enableMetrics, healthCheckInterval, updateMetrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
      
      // Process any remaining batched operations
      if (batchQueueRef.current.length > 0) {
        processBatch();
      }
    };
  }, [processBatch]);

  // Adaptive optimization based on usage patterns
  const adaptiveOptimization = useCallback(async () => {
    const currentMetrics = metrics;
    
    // High error rate: increase retry attempts and add delays
    if (currentMetrics.errorRate > 10) {
      logger.warn('🔧 High error rate detected, adjusting retry strategy');
      // Could adjust retry configuration here
    }
    
    // High response time: optimize batching
    if (currentMetrics.avgResponseTime > 2000) {
      logger.warn('🔧 High response time detected, optimizing batching');
      // Could adjust batch window here
    }
    
    // Low efficiency: force optimization
    if (currentMetrics.networkEfficiency < 60) {
      logger.warn('🔧 Low network efficiency detected, running optimization');
      await runOptimization();
    }
  }, [metrics, runOptimization]);

  // Run adaptive optimization periodically
  useEffect(() => {
    const adaptiveInterval = setInterval(adaptiveOptimization, healthCheckInterval * 2);
    return () => clearInterval(adaptiveInterval);
  }, [adaptiveOptimization, healthCheckInterval]);

  return {
    // Optimized connection methods
    subscribe: optimizedSubscribe,
    unsubscribe: optimizedUnsubscribe,
    
    // Manual optimization controls
    optimize: runOptimization,
    isOptimizing,
    
    // Metrics and monitoring  
    metrics,
    updateMetrics,
    
    // Batch processing status
    pendingOperations: batchQueueRef.current.length,
    
    // Utility methods
    clearMetrics: () => {
      responseTimesRef.current = [];
      errorCountRef.current = 0;
      operationCountRef.current = 0;
    },

    // Health check
    getHealth: () => ({
      status: metrics.networkEfficiency > 70 ? 'healthy' : metrics.networkEfficiency > 40 ? 'degraded' : 'unhealthy',
      metrics,
      recommendations: [
        ...(metrics.errorRate > 5 ? ['Consider increasing retry attempts'] : []),
        ...(metrics.avgResponseTime > 2000 ? ['Consider optimizing batch window'] : []),
        ...(metrics.poolUtilization < 30 ? ['Consider reducing max pool size'] : []),
        ...(metrics.memoryUsage > 10000 ? ['Consider aggressive cleanup'] : [])
      ]
    })
  };
}
