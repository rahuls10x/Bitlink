// ------------- Imports ---------------
import type { RequestHandler } from "express";
import { errorHandling } from "../utils/ApplicationError.js";
import type SessionService from "../services/SessionService.js";

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
}

