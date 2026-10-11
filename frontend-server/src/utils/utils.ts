function toBase64Url(bytes: Uint8Array): string {
	return btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

export async function sha256Base64Url(value: string): Promise<string> {
	const msgUint8 = new TextEncoder().encode(value);
	const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
	return toBase64Url(new Uint8Array(hashBuffer));
}

export function generateCodeVerifier(): string {
	const randomBytes = new Uint8Array(32);
	crypto.getRandomValues(randomBytes);
	return toBase64Url(randomBytes);
}

export function generateState(): string {
	const randomBytes = new Uint8Array(32);
	crypto.getRandomValues(randomBytes);
	return toBase64Url(randomBytes);
}
