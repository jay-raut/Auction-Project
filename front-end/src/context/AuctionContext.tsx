import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { initializeSocket } from "./SocketContext";

type AuctionContextType = {
  socket: Socket | null;
  isAuthenticated: boolean | false;
  isAuthLoading: boolean;
  user: null;
  forceUpdate: () => void;  
};

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export const AuctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [key, setKey] = useState(0);

  const forceUpdate = () => {
    setKey((prev) => prev + 1);
    console.log("force update");
  };

  useEffect(() => {
    async function check_token() {
      console.log("check_token")
      const userLoggedIn = await fetch("http://localhost:3000/api/authentication/profile", {
        method: "GET",
        credentials: "include",
      });
      if (userLoggedIn.ok) {
        setIsAuthenticated(true);
        const user = await userLoggedIn.json();
        setUser(user.user);
      } else {
        setIsAuthenticated(false);
      }
      setIsAuthLoading(false);
    }
    check_token();
  }, [key]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const get_socket = initializeSocket();
    setSocket(get_socket);

    return () => {
      get_socket.disconnect();
    };
  }, [isAuthenticated]);

  return <AuctionContext.Provider value={{ socket, isAuthenticated, isAuthLoading, user, forceUpdate }}>{children}</AuctionContext.Provider>;
};

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error("useAuction must be used within an AuctionProvider");
  }
  return context;
};
