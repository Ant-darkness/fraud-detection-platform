import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [lastMessage, setLastMessage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const connectWebSocket = useCallback(() => {
    const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000/ws/live-feed";

    try {
      socketRef.current = new WebSocket(WS_BASE_URL);

      socketRef.current.onopen = () => {
        setIsConnected(true);
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      };

      socketRef.current.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          setLastMessage(parsedData);
        } catch (err) {
          // Kupuuza majibu yasiyo JSON sahihi
        }
      };

      socketRef.current.onclose = () => {
        setIsConnected(false);
        reconnectTimerRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      socketRef.current.onerror = () => {
        if (socketRef.current) {
          socketRef.current.close();
        }
      };
    } catch (e) {
      reconnectTimerRef.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    }
  }, []);

  // Function ya kutuma data kupitia WebSocket iliyopo
  const sendMessage = useCallback((msg) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connectWebSocket]);

  return (
    <WebSocketContext.Provider value={{ lastMessage, isConnected, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};
