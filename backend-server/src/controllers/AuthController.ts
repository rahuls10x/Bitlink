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
	 * - get exchange code and user resource
	 * - Set HTTP-only auth cookies for security
	 * - Structure success response with User resources
	 */
	exchangeToken: RequestHandler = async (req, res) => {
		try {
			const { code, code_verifier } = req.body;
			const validCode = strictCheck(code, 400, "Authorization code is required");
			const validVerifier = strictCheck(code_verifier, 400, "Code verifier is required");

			const userData = await this.authService.exchangeCode(validCode, validVerifier);

			res.cookie("sessionToken", userData.sessionId, {
				httpOnly: true,
				secure: process.env["NODE_ENV"] === "production",
				sameSite: "lax",
				maxAge: 30 * 24 * 60 * 60 * 1000,
			});

			res.status(200).json({
				success: true,
				message: "Authentication successful",
				data: {
					name: userData.name,
					email: userData.email,
				}
			});
		} catch (error) {
			errorHandling(error, res);
		}
	};

	/**
	 * Handles me request
	 *
	 * Inorder Flow:
	 * - Retrieve access token from request
	 * - Fetch user resource from resource server
	 * - Structure success response with User resources
	 */
	me: RequestHandler = async (req, res) => {
		try {
			const accessToken = strictCheck(req.accessToken, 500, "Access token is not found");

			const user = await this.authService.fetchUserResource(accessToken);

			res.status(200).json({
				success: true,
				message: "Authentication successful",
				data: user,
			});
		} catch (error) {
			errorHandling(error, res);
		}
	};

	/**
	 * Handles logout request
	 * 
	 * Inorder Flow:
	 * - Retrieve session token from request
	 * - Invalidate Session Token in db
	 * - Clear session token cookie and send success response
	 */
	logout: RequestHandler = async (req, res) => {
		try {
			const token = strictCheck(req.cookies["sessionToken"] as string, 500, "Session token is not found");

			await this.authService.logout(token);

			res.clearCookie("sessionToken");
			res.status(200).json({
				success: true,
				message: "Logout successful",
			});

		} catch (error) {
			errorHandling(error, res);
		}
	
	};
}
