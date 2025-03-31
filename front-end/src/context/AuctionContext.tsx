import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { initializeSocket } from "./SocketContext";
import { get } from "../utils/apiClient";

type AuctionContextType = {
  socket: Socket | null;
  isAuthenticated: boolean | false;
  isAuthLoading: boolean;
  user: null;
};

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export const AuctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function check_token() {
      try {
        const response = await get('/authentication/profile', { withCredentials: true });
        setIsAuthenticated(true);
        setUser(response.user);
      } catch (error: any) {
        // Handle expected "No token provided" error silently
        if (error?.message?.includes('No token provided')) {
          console.log('User not authenticated yet');
        } else {
          console.error("Authentication check failed:", error);
        }
        setIsAuthenticated(false);
      } finally {
        setIsAuthLoading(false);
      }
    }
    check_token();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const get_socket = initializeSocket();
    setSocket(get_socket);

    return () => {
      get_socket.disconnect();
    };
  }, [isAuthenticated]);

  return <AuctionContext.Provider value={{ socket, isAuthenticated, isAuthLoading, user }}>{children}</AuctionContext.Provider>;
};

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error("useAuction must be used within an AuctionProvider");
  }
  return context;
};
