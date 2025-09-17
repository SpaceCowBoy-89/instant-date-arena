import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

interface PooledConnection {
  channel: RealtimeChannel;
  references: number;
  lastUsed: number;
  isActive: boolean;
  maxReferences: number;
  createdAt: number;
}

interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  totalReferences: number;
  avgReferencesPerConnection: number;
  oldestConnection: number;
  newestConnection: number;
  memoryUsage: number;
}

class ConnectionPoolManager {
  private pool = new Map<string, PooledConnection>();
  private readonly MAX_POOL_SIZE = 10;
  private readonly MAX_REFERENCES_PER_CONNECTION = 50;
  private readonly IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private readonly CONNECTION_TTL = 30 * 60 * 1000; // 30 minutes
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    this.startCleanupProcess();
    this.setupMemoryManagement();
  }

  /**
   * Get or create a pooled connection
   */
  async getConnection(channelName: string, options: {
    maxReferences?: number;
    priority?: 'high' | 'medium' | 'low';
    reuseExisting?: boolean;
  } = {}): Promise<{ connection: RealtimeChannel; connectionId: string }> {
    const { 
      maxReferences = this.MAX_REFERENCES_PER_CONNECTION,
      reuseExisting = true 
    } = options;

    // Try to reuse existing connection
    if (reuseExisting) {
      const existingId = this.findReusableConnection(channelName, maxReferences);
      if (existingId) {
        const pooled = this.pool.get(existingId)!;
        pooled.references++;
        pooled.lastUsed = Date.now();
        
        logger.info(`🔗 Reusing connection: ${existingId} (refs: ${pooled.references})`);
        return { connection: pooled.channel, connectionId: existingId };
      }
    }

    // Create new connection
    if (this.pool.size >= this.MAX_POOL_SIZE) {
      await this.evictLeastUsedConnection();
    }

    const connectionId = this.generateConnectionId(channelName);
    const channel = supabase.channel(channelName);
    
    const pooledConnection: PooledConnection = {
      channel,
      references: 1,
      lastUsed: Date.now(),
      isActive: true,
      maxReferences,
      createdAt: Date.now()
    };

    this.pool.set(connectionId, pooledConnection);
    
    logger.info(`🆕 Created new pooled connection: ${connectionId}`);
    return { connection: channel, connectionId };
  }

  /**
   * Release a connection reference
   */
  releaseConnection(connectionId: string): void {
    const pooled = this.pool.get(connectionId);
    if (!pooled) {
      logger.warn(`⚠️ Attempted to release unknown connection: ${connectionId}`);
      return;
    }

    pooled.references = Math.max(0, pooled.references - 1);
    pooled.lastUsed = Date.now();

    if (pooled.references === 0) {
      pooled.isActive = false;
      logger.info(`💤 Connection marked as idle: ${connectionId}`);
    }

    logger.debug(`📉 Released connection: ${connectionId} (refs: ${pooled.references})`);
  }

  /**
   * Force close a specific connection
   */
  async closeConnection(connectionId: string): Promise<void> {
    const pooled = this.pool.get(connectionId);
    if (!pooled) return;

    try {
      await pooled.channel.unsubscribe();
      this.pool.delete(connectionId);
      logger.info(`❌ Closed connection: ${connectionId}`);
    } catch (error) {
      logger.error(`Failed to close connection ${connectionId}:`, error);
    }
  }

  /**
   * Get connection pool metrics
   */
  getMetrics(): ConnectionMetrics {
    const connections = Array.from(this.pool.values());
    const now = Date.now();

    const totalReferences = connections.reduce((sum, conn) => sum + conn.references, 0);
    const activeConnections = connections.filter(conn => conn.isActive).length;
    const idleConnections = connections.length - activeConnections;

    return {
      totalConnections: connections.length,
      activeConnections,
      idleConnections,
      totalReferences,
      avgReferencesPerConnection: connections.length > 0 ? totalReferences / connections.length : 0,
      oldestConnection: connections.length > 0 ? Math.min(...connections.map(c => c.createdAt)) : 0,
      newestConnection: connections.length > 0 ? Math.max(...connections.map(c => c.createdAt)) : 0,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Optimize the connection pool
   */
  async optimize(): Promise<{
    closed: number;
    rebalanced: number;
    errors: string[];
  }> {
    const results = {
      closed: 0,
      rebalanced: 0,
      errors: [] as string[]
    };

    const now = Date.now();

    // Close expired connections
    for (const [id, pooled] of this.pool) {
      if (now - pooled.createdAt > this.CONNECTION_TTL) {
        try {
          await this.closeConnection(id);
          results.closed++;
        } catch (error) {
          results.errors.push(`Failed to close expired connection ${id}: ${error}`);
        }
      }
    }

    // Close idle connections
    for (const [id, pooled] of this.pool) {
      if (!pooled.isActive && now - pooled.lastUsed > this.IDLE_TIMEOUT) {
        try {
          await this.closeConnection(id);
          results.closed++;
        } catch (error) {
          results.errors.push(`Failed to close idle connection ${id}: ${error}`);
        }
      }
    }

    logger.info(`🔧 Pool optimization complete:`, results);
    return results;
  }

  /**
   * Close all connections and cleanup
   */
  async destroy(): Promise<void> {
    logger.info('🛑 Destroying connection pool...');

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    const closePromises = Array.from(this.pool.keys()).map(id => 
      this.closeConnection(id).catch(err => 
        logger.error(`Error closing connection ${id}:`, err)
      )
    );

    await Promise.all(closePromises);
    this.pool.clear();

    logger.info('✅ Connection pool destroyed');
  }

  private findReusableConnection(channelName: string, maxReferences: number): string | null {
    for (const [id, pooled] of this.pool) {
      if (pooled.isActive && 
          pooled.references < Math.min(maxReferences, pooled.maxReferences) &&
          pooled.channel.topic === channelName) {
        return id;
      }
    }
    return null;
  }

  private generateConnectionId(channelName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${channelName}_${timestamp}_${random}`;
  }

  private async evictLeastUsedConnection(): Promise<void> {
    let leastUsedId: string | null = null;
    let leastUsedTime = Date.now();

    for (const [id, pooled] of this.pool) {
      if (!pooled.isActive && pooled.lastUsed < leastUsedTime) {
        leastUsedTime = pooled.lastUsed;
        leastUsedId = id;
      }
    }

    if (leastUsedId) {
      await this.closeConnection(leastUsedId);
      logger.info(`🗑️ Evicted least used connection: ${leastUsedId}`);
    } else {
      // If no idle connections, evict the oldest active one
      let oldestId: string | null = null;
      let oldestTime = Date.now();

      for (const [id, pooled] of this.pool) {
        if (pooled.createdAt < oldestTime) {
          oldestTime = pooled.createdAt;
          oldestId = id;
        }
      }

      if (oldestId) {
        await this.closeConnection(oldestId);
        logger.warn(`⚠️ Evicted oldest active connection: ${oldestId}`);
      }
    }
  }

  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.optimize();
      } catch (error) {
        logger.error('❌ Cleanup process failed:', error);
      }
    }, 2 * 60 * 1000); // Run every 2 minutes
  }

  private setupMemoryManagement(): void {
    // Monitor memory usage if available
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      setInterval(() => {
        const memory = (window.performance as any).memory;
        const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (usage > 0.8) { // If using more than 80% of available memory
          logger.warn('🧠 High memory usage detected, optimizing connection pool');
          this.optimize().catch(err => logger.error('Memory optimization failed:', err));
        }
      }, 30 * 1000); // Check every 30 seconds
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage
    let totalSize = 0;
    
    for (const [id, pooled] of this.pool) {
      // Estimate: connection ID + channel object + metadata
      totalSize += id.length * 2; // UTF-16 characters
      totalSize += 1000; // Estimated channel object size
      totalSize += 200; // Estimated metadata size
    }

    return totalSize;
  }
}

// Export singleton instance
export const connectionPoolManager = new ConnectionPoolManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    connectionPoolManager.destroy().catch(err => 
      logger.error('Error during connection pool cleanup:', err)
    );
  });
}