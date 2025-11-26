import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';

interface WebSocketMessage {
  type: string;
  notification?: any;
  message?: string;
}

export function useWebSocketNotifications(
  onNotification: (notification: any) => void,
  onError?: (error: Event) => void
) {
  const { user } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isConnectingRef = useRef(false);
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    if (!user?.id) return;
    
    // Prevent multiple simultaneous connections
    if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING)) {
      console.log('[WebSocket] Already connecting, skipping...');
      return;
    }
    
    // If already connected, don't reconnect
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected, skipping...');
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      try {
        wsRef.current.close(1000, 'Reconnecting');
      } catch (e) {
        // Ignore errors when closing
      }
      wsRef.current = null;
    }
    
    isConnectingRef.current = true;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the same host and port as API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api';
    const apiHost = apiUrl.replace('/api', '').replace('http://', '').replace('https://', '');
    const wsHost = process.env.NEXT_PUBLIC_WS_URL || `${wsProtocol}//${apiHost}`;
    
    const wsUrl = `${wsHost}/ws/notifications/${user.id}/`;
    
    console.log('Connecting to WebSocket:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('[WebSocket] ✅ Connected successfully');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        isConnectingRef.current = false;
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          
          if (data.type === 'new_notification' && data.notification) {
            onNotification(data.notification);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] ❌ Error:', error);
        console.error('[WebSocket] State:', ws.readyState, '(0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)');
        console.error('[WebSocket] URL:', wsUrl);
        isConnectingRef.current = false;
        if (onError) {
          onError(error);
        }
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        setIsConnected(false);
        isConnectingRef.current = false;
        
        // Don't reconnect if:
        // - It was a clean close (1000 = normal closure)
        // - We're intentionally closing (shouldReconnectRef = false)
        // - Component is unmounting
        if (event.code === 1000 || !shouldReconnectRef.current) {
          console.log('[WebSocket] Not reconnecting (clean close or intentional)');
          return;
        }
        
        // Attempt to reconnect only if we should
        if (shouldReconnectRef.current && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          console.log(`[WebSocket] Will reconnect in ${delay}ms (Attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldReconnectRef.current) {
              console.log(`[WebSocket] Reconnecting... Attempt ${reconnectAttempts.current}`);
              connect();
            }
          }, delay);
        } else {
          console.error('[WebSocket] Max reconnection attempts reached or should not reconnect');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      isConnectingRef.current = false;
    }
  }, [user?.id, onNotification, onError]);

  useEffect(() => {
    // Reset reconnect attempts when user changes
    reconnectAttempts.current = 0;
    shouldReconnectRef.current = true;
    
    if (user?.id) {
      // Small delay to prevent immediate reconnection loops
      const connectTimeout = setTimeout(() => {
        if (shouldReconnectRef.current) {
          connect();
        }
      }, 500);
      
      return () => {
        clearTimeout(connectTimeout);
      };
    }

    return () => {
      // Cleanup on unmount
      shouldReconnectRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'Component unmounting');
        } catch (e) {
          // Ignore errors
        }
        wsRef.current = null;
      }
      
      isConnectingRef.current = false;
    };
  }, [user?.id, connect]);

  return { isConnected };
}

