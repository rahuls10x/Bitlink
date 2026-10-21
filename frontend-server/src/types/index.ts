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

export interface ServerFile {
	fileId: string;
	fileName: string;
	userId: string;
	mimeType: string;
	sizeBytes: number;
	parentId: null;
	createdAt: string | Date;
	modifiedAt: string | Date;
}

export interface SocketStandardResponse<T = unknown> {
	success: boolean;
	message?: string;
	data?: T;
	error?: string;
}

export interface ViewFilesInput {
	parentId: null;
	offset?: number;
	limit?: number;
}

export interface RequestDownloadInput {
	fileId: string;
}

export interface DownloadResponseData {
	signedUrl: string;
	expiresAt: string | Date;
}

export interface RenameFileInput {
	fileId: string;
	newFileName: string;
}

export interface DeleteFileInput {
	fileId: string;
}

export type FileUpdatedEvent =
	| { operation: "fileAdded"; data: ServerFile }
	| { operation: "fileRenamed"; data: RenameFileInput }
	| { operation: "fileDeleted"; data: DeleteFileInput };

