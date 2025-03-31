import io, { Socket } from "socket.io-client";
// Use relative URL to take advantage of the Vite proxy
const socketEndpoint = window.location.protocol + "//" + window.location.host;
let socket: Socket | null = null;

export function initializeSocket(): Socket {
  if (!socket) {
    socket = io(socketEndpoint, {
      path: "/api/notification/socket",
      transports: ["websocket"],
      reconnection: true,
      withCredentials: true,
    });
    
    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error.message);
    });
  }

  return socket;
}

export const getSocket = (): Socket => {
  if (!socket) {
    throw new Error("Socket not initialized. Call initializeSocket first.");
  }
  return socket;
};
