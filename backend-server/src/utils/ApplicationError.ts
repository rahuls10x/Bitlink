import type { Response } from "express";

export class ApplicationError extends Error {
	public statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.name = "ApplicationError";
		this.statusCode = statusCode;
	}
}

/**
 * Validates that a value is non-nullable, throwing an ApplicationError if not.
 *
 * Inorder Flow:
 * - Check if value is non-nullable
 * - Return value
 */
export function strictCheck<T>(value: T , statusCode: number, message: string): NonNullable<T> {
	if (!value) {
		throw new ApplicationError(statusCode, message);
	}

	return value;
}

/**
 * Standardized controller error handling helper.
 *
 * Inorder Flow:
 * - Check if error is an instance of ApplicationError
 * - Respond with error's status code and message
 * - Fallback to 500 Internal Server Error for unhandled exceptions
 */
export function errorHandling(error: unknown, res: Response): void {
	if (error instanceof ApplicationError) {
		res.status(error.statusCode).json({
			success: false,
			error: error.message,
		});
		return;
	}

	const genericMessage = error instanceof Error ? error.message : "Internal Server Error";
	console.error("[ServerError]:", error);

	res.status(500).json({
		success: false,
		error: genericMessage,
	});
}

/**
 * Standardized socket error handling helper.
 *
 * Inorder Flow:
 * - Check if error is an instance of ApplicationError
 * - Execute callback with error response object if provided
 * - Fallback to 500 Internal Server Error structure for unhandled exceptions
 */
export function socketErrorHandling(error: unknown, callback?: Function): void {
	if (typeof callback !== "function") {
		console.error("[SocketError]:", error);
		return;
	}

	if (error instanceof ApplicationError) {
		callback({
			success: false,
			error: error.message,
		});
		return;
	}

	const genericMessage = error instanceof Error ? error.message : "Internal Server Error";
	console.error("[SocketServerError]:", error);

	callback({
		success: false,
		error: genericMessage,
	});
}

