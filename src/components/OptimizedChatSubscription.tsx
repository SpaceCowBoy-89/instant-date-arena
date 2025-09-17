import React, { useEffect, useState } from 'react';
import { useOptimizedSubscription } from '@/hooks/useOptimizedSubscription';
import { usePresenceOptimization } from '@/hooks/usePresenceOptimization';
import { logger } from '@/utils/logger';

interface ChatMessage {
  id: string;
  text: string;
  sender_id: string;
  timestamp: string;
}

interface ChatData {
  chat_id: string;
  user1_id: string;
  user2_id: string;
  messages: ChatMessage[];
  temporary_messages: ChatMessage[];
  status: 'active' | 'ended_by_departure' | 'ended_manually' | 'completed';
}

interface OptimizedChatSubscriptionProps {
  chatId: string;
  currentUserId: string;
  onMessageReceived: (message: ChatMessage) => void;
  onChatUpdated: (chat: ChatData) => void;
  onUserInteraction: (interaction: any) => void;
  onUserPresenceChange: (presence: any) => void;
}

export const OptimizedChatSubscription: React.FC<OptimizedChatSubscriptionProps> = ({
  chatId,
  currentUserId,
  onMessageReceived,
  onChatUpdated,
  onUserInteraction,
  onUserPresenceChange
}) => {
  const [isActive, setIsActive] = useState(true);

  // Optimized chat messages subscription with batching
  const { 
    isConnected: isChatConnected, 
    error: chatError,
    reconnect: reconnectChat
  } = useOptimizedSubscription({
    channelName: `chat:${chatId}`,
    table: 'chats',
    event: 'UPDATE',
    filter: `chat_id=eq.${chatId}`,
    enabled: isActive,
    debounceMs: 100, // Batch rapid updates
    priority: 'high',
    retryAttempts: 5,
    retryDelay: 1000
  }, (payload) => {
    logger.info('📨 Chat update received:', payload);
    
    if (payload.eventType === 'UPDATE' && payload.new) {
      onChatUpdated(payload.new as ChatData);
      
      // Handle new messages
      const newMessages = payload.new.temporary_messages || [];
      const oldMessages = payload.old?.temporary_messages || [];
      
      if (newMessages.length > oldMessages.length) {
        const latestMessage = newMessages[newMessages.length - 1];
        if (latestMessage && latestMessage.sender_id !== currentUserId) {
          onMessageReceived(latestMessage);
        }
      }
    }
  });

  // Optimized user interactions subscription  
  const { 
    isConnected: isInteractionConnected,
    error: interactionError
  } = useOptimizedSubscription({
    channelName: `interactions:${chatId}`,
    table: 'user_interactions',
    event: 'INSERT',
    filter: `chat_id=eq.${chatId}`,
    enabled: isActive,
    throttleMs: 500, // Prevent spam interactions
    priority: 'medium'
  }, (payload) => {
    logger.info('⚡ User interaction received:', payload);
    
    if (payload.eventType === 'INSERT' && payload.new) {
      onUserInteraction(payload.new);
    }
  });

  // Presence tracking with activity monitoring
  const {
    currentUser,
    onlineUsers,
    updateStatus,
    updateActivity,
    isUserOnline,
    stats: presenceStats
  } = usePresenceOptimization({
    channelName: `chat_presence:${chatId}`,
    initialStatus: 'online',
    enableActivityTracking: true,
    enablePageTracking: true,
    debounceMs: 2000
  }, currentUserId);

  // Handle presence changes
  useEffect(() => {
    onUserPresenceChange({
      currentUser,
      onlineUsers,
      stats: presenceStats
    });
  }, [currentUser, onlineUsers, presenceStats, onUserPresenceChange]);

  // Update activity when user interacts with chat
  const handleUserActivity = (activity: string) => {
    updateActivity(`chat_${activity}`);
  };

  // Auto-reconnection logic for failed connections
  useEffect(() => {
    if (chatError || interactionError) {
      logger.warn('🔄 Connection errors detected, attempting reconnection...', {
        chatError: chatError?.message,
        interactionError: interactionError?.message
      });

      const reconnectTimer = setTimeout(() => {
        if (chatError) reconnectChat();
      }, 5000);

      return () => clearTimeout(reconnectTimer);
    }
  }, [chatError, interactionError, reconnectChat]);

  // Cleanup when chat becomes inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsActive(isVisible);
      
      if (isVisible) {
        updateStatus('online');
        handleUserActivity('page_visible');
      } else {
        updateStatus('away');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [updateStatus]);

  // Connection status indicator
  const connectionStatus = {
    chat: isChatConnected,
    interactions: isInteractionConnected,
    presence: currentUser !== null,
    overall: isChatConnected && isInteractionConnected && currentUser !== null
  };

  // Remove useImperativeHandle which is causing TypeScript issues
  // Connection status for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('🔍 Chat subscription status:', {
        chatId,
        connectionStatus,
        presenceStats,
        errors: {
          chat: chatError?.message,
          interaction: interactionError?.message
        }
      });
    }
  }, [chatId, connectionStatus, presenceStats, chatError, interactionError]);

  return null; // This is a utility component with no UI
};

export default OptimizedChatSubscription;