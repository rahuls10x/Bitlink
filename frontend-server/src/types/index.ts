export interface User {
	userId?: string;
	name?: string;
	email?: string;
	age?: number;
	gender?: string;
	avatar?: string;
}

export interface CallbackToken {
	responseType: "code";
	code: string;
	state: string;
	error?: string;
	expiresIn?: string;
}