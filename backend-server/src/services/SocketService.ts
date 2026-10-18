// ------------- Imports ---------------
import { Server, type Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import type SessionService from "../services/SessionService.js";
import type { AppSocket } from "../types/socket.js";

// ------------- SocketService ---------------
export default class SocketService {
	private io: Server;
	private sessionService: SessionService;

	/**
	 * Initializes Socket.io server and registers connection lifecycle hooks
	 * 
	 * Inorder Flow:
	 * - Assign session service instance
	 * - Create Socket.io server instance bound to HTTP server with CORS configuration
	 * - Configure handshake authentication middleware
	 * - Configure connection and disconnect event handlers
	 */
	constructor(httpServer: HttpServer, originUrl: string, sessionService: SessionService) {
		this.sessionService = sessionService;

		this.io = new Server(httpServer, {
			cors: {
				origin: originUrl,
				credentials: true,
			},
		});

		this.configureMiddleware();

		this.configureEvents();
	}

	/**
	 * Configures WebSocket handshake authentication middleware
	 * 
	 * Inorder Flow:
	 * - Register middleware function on Socket.io server
	 * - Extract and validate cookie header from socket handshake
	 * - Parse session token from cookies
	 * - Validate session token using SessionService
	 * - Attach session data to socket and proceed to next middleware
	 */
	private configureMiddleware(): void {
		this.io.use(async (socket: AppSocket, next) => {
			try {
				const cookieHeader = socket.request.headers.cookie;

				if (!cookieHeader) {
					return next(new Error("Authentication error: No cookies provided"));
				}

				const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
					const [key, value] = cookie.trim().split("=");
					if (key && value) acc[key] = decodeURIComponent(value);
					return acc;
				}, {} as Record<string, string>);

				const sessionId = cookies["sessionToken"];

				if (!sessionId) {
					return next(new Error("Authentication error: Session token missing"));
				}

				const session = await this.sessionService.validateSessionToken(sessionId);

				socket.data.sessionId = session.sessionId;
				socket.data.accessToken = session.accessToken;

				next();
			} catch (error) {
				console.error("WebSocket auth error:", error);

				next(new Error("Authentication error"));
			}
		});
	}

	/**
	 * Configures connection and disconnect event handlers
	 * 
	 * Inorder Flow:
	 * - Register connection event listener on Socket.io server
	 * - Log client connection details upon successful handshake
	 * - Register disconnect event listener on individual socket
	 * - Log client disconnection reason upon disconnect
	 */
	private configureEvents(): void {
		this.io.on("connection", (socket: Socket) => {
			console.log(`[WebSocket] Client connected: ${socket.id} (Session: ${socket.data.sessionId})`);

			socket.on("disconnect", (reason) => {
				console.log(`[WebSocket] Client disconnected: ${socket.id} (Reason: ${reason})`);
			});
		});
	}

	/**
	 * Returns the Socket.io server instance
	 * 
	 * Inorder Flow:
	 * - Return the internal Socket.io server instance
	 */
	public getIo(): Server {
		return this.io;
	}
}
