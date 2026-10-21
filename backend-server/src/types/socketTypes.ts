import type { Socket } from "socket.io";

export interface SocketData {
	sessionId?: string;
	accessToken?: string;
	userId?: string;
	roomId?: string;
	accessTokenExpiry?: Date;
}

export type AppSocket = Socket<any, any, any, SocketData>;
