// ------------- Imports ---------------
import type { RequestHandler } from "express";
import { ApplicationError, errorHandling, strictCheck } from "../utils/ApplicationError.js";

// ------------- ValidationMiddlewares ---------------
export default class ValidationMiddlewares {
	/**
	 * Validates token exchange payload incoming data
	 *
	 * Inorder Flow:
	 * - Retrieve code and code_verifier from request body and check for non-null
	 * - Validate code prefix and code_verifier character length constraints
	 * - Pass control to next handler
	 */
	validateTokenize: RequestHandler = (req, res, next) => {
		try {
			const { code, code_verifier } = req.body || {};
			strictCheck(code, 400, "Authorization Code must be a string");
			strictCheck(code_verifier, 400, "Code Verifier must be a string");

			if (typeof code !== "string" || !code.startsWith("auth_")) {
				throw new ApplicationError(400, "Authorization Code must be a valid code starting with auth_");
			}
			if (typeof code_verifier !== "string" || code_verifier.length < 43 || code_verifier.length > 128) {
				throw new ApplicationError(400, "Invalid Code Verifier. Length must be between 43 and 128 characters.");
			}

			next();
		} catch (error) {
			errorHandling(error, res);
		}
	};
}
