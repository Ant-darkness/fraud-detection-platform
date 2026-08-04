import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

// Safe default values kuzuia null destructuring error
const defaultContextValue = {
  lastMessage: null,
  isConnected: false,
};

const WebSocketContext = createContext(defaultContextValue);

export const WebSocketProvider = ({ children }) => {
  const [lastMessage, setLastMessage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socket = null;
    let reconnectInterval = null;

    const connectWS = () => {
      try {
        socket = api.ws.connect(
          (data) => {
            setIsConnected(true);
            setLastMessage(data);
          },
          (error) => {
            console.error("WebSocket connection error:", error);
            setIsConnected(false);
          }
        );
      } catch (err) {
        console.error("Failed to establish WebSocket connection:", err);
        setIsConnected(false);
      }
    };

    connectWS();

    // Auto-reconnect check kila baada ya sekunde 5 kama connection ikikatika
    reconnectInterval = setInterval(() => {
      if (!socket || socket.readyState === WebSocket.CLOSED) {
        connectWS();
      }
    }, 5000);

    return () => {
      if (socket) socket.close();
      if (reconnectInterval) clearInterval(reconnectInterval);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ lastMessage, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook salama inayorejesha default state ikiwa mbali na provider
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    return defaultContextValue;
  }
  return context;
};
