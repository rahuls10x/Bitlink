// ------------- Imports ---------------
import type { RequestHandler } from "express";
import { errorHandling, strictCheck } from "../utils/ApplicationError.js";
import type SessionRepository from "../repositories/SessionRepository.js";
import type { Session } from "../types/dbSchema.js";
import type AuthService from "../services/AuthService.js";

// ------------- TokenAuthMiddleware ---------------
export default class TokenAuthMiddleware {
	private sessionRepository: SessionRepository
	private authService: AuthService;

	constructor(sessionRepository: SessionRepository, authService: AuthService) {
		this.sessionRepository = sessionRepository;
		this.authService = authService;
	}

	/**
	 * Middleware to validate session and inject details into request
	 *
	 * Inorder Flow:
	 * - Retrieve and check token format
	 * - Get the session using token
	 * - Check if refresh token is expired (refresh token will never be greater than access token)
	 * - Check if access token is expired (extra 10 seconds to account for further processing time)
	 * - Inject the data into the request
	 * - Pass onto next middleware
	 *
	 * @remarks
	 * The injected data-
	 * - sessionId
	 */
	checkToken: RequestHandler = async (req, res, next) => {
		try {
			const token: string = strictCheck(req.cookies["sessionToken"], 401, "Unauthorized");
			strictCheck(token.startsWith("session_"), 401, "Invalid session token");

			let session: Session = strictCheck(await this.sessionRepository.findActiveSessionById(token), 401, "Session does not exist");

			if(new Date(session.refreshTokenExpiry).getTime() < Date.now()){
				strictCheck(await this.sessionRepository.revokeSessionById(session.sessionId), 500, "Failed to revoke session");
				strictCheck(false, 401, "Session expired");
			}

			if(new Date(session.accessTokenExpiry).getTime() - 10000 < Date.now()){
				session = await this.authService.refreshTokens(session.sessionId, session.refreshToken);
			}

			// guarenteed data on protected routes
			req.sessionId = session.sessionId;
			req.accessToken = session.accessToken;
			
			next();
		} catch (error) {
			errorHandling(error, res);
		}
	};
}
