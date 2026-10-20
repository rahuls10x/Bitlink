import "express-serve-static-core";

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV?: string;
			PORT?: string;
			ORIGIN_URL?: string;
			AUTH_SERVER_URL?: string;
			CLIENT_ID?: string;
			CLIENT_SECRET?: string;
			REDIRECT_URI?: string;
		}
	}
}

declare module "express-serve-static-core" {
	export interface Request {
		sessionId?: string;
		accessToken?: string;
	}
}

export interface UserPayload {
	userId?: string;
	name?: string;
	email?: string;
	age?: number;
	gender?: string;
	avatar?: string;
}

export interface AuthTokens {
	access_token: string;
	token_type: "Bearer";
	user_id: string;
	expires_in: number;
	refresh_token?: string;
	scopes: string[];
}

declare module "express-serve-static-core" {
	export interface Request {
		user?: UserPayload;
		token?: string;
	}
}

export interface TokenizeRequestBody {
	code: string;
	code_verifier: string;
}

export interface RefreshRequestBody {
	refresh_token: string;
}	

export interface StandardResponse{
	success: boolean;
	data?: any;
	error?: string;
	message?: string;
}