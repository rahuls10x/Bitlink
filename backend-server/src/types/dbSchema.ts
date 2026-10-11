export interface Session{
    _id?: string;
    sessionId: string;
    userId?: string;//temporary bypass
    createdAt: Date;
    expiresAt: Date;
    isRevoked: boolean;
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    accessTokenExpiry: Date;
    refreshTokenExpiry: Date;
}