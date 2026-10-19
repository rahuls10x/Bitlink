// ------------- Imports ---------------
import type { RequestHandler } from "express";
import { errorHandling } from "../utils/ApplicationError.js";
import type SessionService from "../services/SessionService.js";
import type { AppSocket } from "../types/socketTypes.js";
import type { ExtendedError } from "socket.io";

// ------------- TokenAuthMiddleware ---------------
export default class TokenAuthMiddleware {
	private sessionService: SessionService;

	constructor(sessionService: SessionService) {
		this.sessionService = sessionService;
	}

	/**
	 * Middleware to validate session and inject details into request
	 *
	 * Inorder Flow:
	 * - Retrieve session cookie token
	 * - Delegate validation and refresh logic to SessionService
	 * - Inject sessionId and accessToken into request
	 * - Pass onto next middleware
	 *
	 * @remarks
	 * The injected data-
	 * - sessionId
	 * - accessToken
	 */
	checkToken: RequestHandler = async (req, res, next) => {
		try {
			const token: string = req.cookies["sessionToken"];
			const session = await this.sessionService.validateSessionToken(token);

			// guarenteed data on protected routes
			req.sessionId = session.sessionId;
			req.accessToken = session.accessToken;

			next();
		} catch (error) {
			errorHandling(error, res);
		}
	};

	/**
	 * WebSocket handshake authentication middleware
	 *
	 * Inorder Flow:
	 * - Extract and validate cookie header from socket handshake
	 * - Parse session token from cookies
	 * - Validate session token using SessionService
	 * - Attach session data to socket and proceed to next middleware
	 *
	 * @remarks
	 * The injected data-
	 * - sessionId
	 * - accessToken
	 * - userId
	 * - accessTokenExpiry
	 */
	async checkSocketToken(socket: AppSocket, next:(err?: ExtendedError) => void): Promise<void> {
		try {
			const cookieHeader = socket.request.headers.cookie;
			if (!cookieHeader) {
				return next(new Error("Authentication error: No cookies provided"));
			}

			const cookies = cookieHeader.split(";").reduce(
				(acc, cookie) => {
					const [key, value] = cookie.trim().split("=");
					if (key && value) acc[key] = decodeURIComponent(value);
					return acc;
				},
				{} as Record<string, string>,
			);
			const sessionId = cookies["sessionToken"];

			if (!sessionId) {
				return next(new Error("Authentication error: Session token missing"));
			}
			const session = await this.sessionService.validateSessionToken(sessionId);

			socket.data.sessionId = session.sessionId;
			socket.data.accessToken = session.accessToken;
			socket.data.userId = session.userId;
			socket.data.accessTokenExpiry = session.accessTokenExpiry;
			next();
		} catch (error) {
			next(new Error("Authentication error"));
		}
	}
}
