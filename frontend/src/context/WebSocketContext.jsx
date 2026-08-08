import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { api } from '../services/api';

const defaultContextValue = {
  lastMessage: null,
  isConnected: false,
};

const WebSocketContext = createContext(defaultContextValue);

export const WebSocketProvider = ({ children }) => {
  const [lastMessage, setLastMessage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const connectWS = () => {
      try {
        if (socketRef.current) {
          socketRef.current.close();
        }

        socketRef.current = api.ws.connect(
          (data) => {
            if (!isMounted) return;
            setIsConnected(true);
            setLastMessage(data);
          },
          (error) => {
            if (!isMounted) return;
            console.error('WebSocket connection error:', error);
            setIsConnected(false);
            scheduleReconnect();
          }
        );
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to establish WebSocket connection:', err);
        setIsConnected(false);
        scheduleReconnect();
      }
    };

    const scheduleReconnect = () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isMounted) connectWS();
      }, 5000);
    };

    connectWS();

    return () => {
      isMounted = false;
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ lastMessage, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  return context || defaultContextValue;
};
