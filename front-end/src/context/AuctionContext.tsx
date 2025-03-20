import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { initializeSocket } from "./SocketContext";

type AuctionContextType = {
  socket: Socket | null;
  isAuthenticated: boolean | false;
};

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export const AuctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const userLoggedIn = localStorage.getItem("isAuthenticated");
    if (userLoggedIn === "true") {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  });

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    const get_socket = initializeSocket();
    setSocket(get_socket);
  }, [isAuthenticated]);

  return <AuctionContext.Provider value={{ socket , isAuthenticated}}>{children}</AuctionContext.Provider>;
};

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error("useAuction must be used within an AuctionProvider");
  }
  return context;
};
