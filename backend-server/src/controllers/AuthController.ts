// ------------- Imports ---------------
import type { RequestHandler } from "express";
import type AuthService from "../services/AuthService.js";
import { errorHandling, strictCheck } from "../utils/ApplicationError.js";

// ------------- AuthController ---------------
export default class AuthController {
	private authService: AuthService;

	constructor(authService: AuthService) {
		this.authService = authService;
	}

	/**
	 * Handles token exchange request from client callback
	 *
	 * Inorder Flow:
	 * - Retrieve code and code_verifier from request body
	 * - Call AuthService to exchange code with Truth Auth Server
	 * - Set HTTP-only auth cookies for security
	 * - Return tokens and success response
	 */
	exchangeToken: RequestHandler = async (req, res) => {
		try {
			const { code, code_verifier } = req.body;
			const validCode = strictCheck(code, 400, "Authorization code is required");
			const validVerifier = strictCheck(code_verifier, 400, "Code verifier is required");

			const sessionId = await this.authService.exchangeCode(validCode, validVerifier);

			res.cookie("sessionToken", sessionId, {
				httpOnly: true,
				secure: process.env["NODE_ENV"] === "production",
				sameSite: "lax",
				maxAge: 30 * 24 * 60 * 60 * 1000,
			});

			res.status(200).json({
				success: true,
				message: "Authentication successful",
			});
		} catch (error) {
			errorHandling(error, res);
		}
	};

	/**
	 * Handles me request
	 *
	 * Inorder Flow:
	 * - Return success response
	 */
	me: RequestHandler = async (_req, res) => {
		try {
			res.status(200).json({
				success: true,
				message: "Authentication successful",
			});
		} catch (error) {
			errorHandling(error, res);
		}
	};
}
