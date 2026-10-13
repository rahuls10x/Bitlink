import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
	socket: Socket | null;
	isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export function SocketProvider({ children }: { children: React.ReactNode }) {
	const { isAuthenticated } = useAuth();
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		if (!isAuthenticated) {
			if (socket) {
				socket.disconnect();
				setSocket(null);
				setIsConnected(false);
			}
			return;
		}

		const socketInstance = io(import.meta.env.VITE_API_URL || "http://localhost:4001", {
			withCredentials: true,
		});

		socketInstance.on("connect", () => {
			setIsConnected(true);
			console.log("[WebSocket] Connected to server");
		});

		socketInstance.on("disconnect", (reason) => {
			setIsConnected(false);
			console.log("[WebSocket] Disconnected from server:", reason);
		});

		setSocket(socketInstance);

		return () => {
			socketInstance.disconnect();
		};
	}, [isAuthenticated]);

	return (
		<SocketContext.Provider value={{ socket, isConnected }}>
			{children}
		</SocketContext.Provider>
	);
}

export const useSocket = () => useContext(SocketContext);
