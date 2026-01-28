'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { LocationUpdate } from '@/types/vehicle';

interface UseVehicleSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface UseVehicleSocketReturn {
  isConnected: boolean;
  error: string | null;
  lastUpdate: LocationUpdate | null;
  connect: () => void;
  disconnect: () => void;
}

export const useVehicleSocket = (
  options: UseVehicleSocketOptions = {}
): UseVehicleSocketReturn => {
  const {
    url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000',
    autoConnect = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<LocationUpdate | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const connectCalledRef = useRef(false);

  useEffect(() => {
    if (!autoConnect || connectCalledRef.current || socketRef.current?.connected) {
      return;
    }

    connectCalledRef.current = true;

    try {
      const newSocket = io(url, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts,
        reconnectionDelay,
        autoConnect: true,
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        setIsConnected(true);
        setError(null);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          // Server forcibly disconnected, manual reconnection needed
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (err) => {
        console.error('🔴 Connection error:', err.message);
        setError(err.message);
        setIsConnected(false);
      });

      newSocket.on('location:update', (data: LocationUpdate) => {
        setLastUpdate(data);
      });

      newSocket.on('error', (err) => {
        console.error('🔴 Socket error:', err);
        setError(err.message || 'Unknown socket error');
      });

      socketRef.current = newSocket;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize socket';
      console.error('🔴 Socket initialization error:', errorMessage);
      queueMicrotask(() => setError(errorMessage));
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [url, autoConnect, reconnectionAttempts, reconnectionDelay]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    if (!socketRef.current) {
      connectCalledRef.current = false;
      // Trigger re-render to run effect
      setIsConnected(false);
    } else {
      socketRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      connectCalledRef.current = false;
    }
  }, []);

  return {
    isConnected,
    error,
    lastUpdate,
    connect,
    disconnect,
  };
};
