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

export interface FileUpload{
    uploadId: string,
    userId?: string,//temporary bypass
    fileName: string,
    mimeType: string,
    sizeBytes: number,
    fileId: string,
    parentId: "null",
    status: "pending" | "completed",
    createdAt: Date,
    expiresAt: Date
}

export interface File{
    fileId: string,
    fileName: string,
    userId?: string, //temporary bypass
    mimeType: string,
    sizeBytes: number,
    parentId: "null",
    createdAt: Date,
    modifiedAt: Date
}