import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useSocket } from "./SocketContext";
import type { 
	ServerFile, 
	SocketStandardResponse, 
	DownloadResponseData,
	FileUpdatedEvent
} from "@/types";

export interface FileContextType {
	files: ServerFile[];
	isLoading: boolean;
	error: string | null;
	processingFileId: string | null;
	isUploadModalOpen: boolean;
	openUploadModal: () => void;
	closeUploadModal: () => void;
	fetchFiles: () => Promise<void>;
	downloadFile: (file: ServerFile) => Promise<void>;
	previewFile: (file: ServerFile) => Promise<void>;
	renameFile: (fileId: string, newFileName: string) => Promise<boolean>;
	deleteFile: (fileId: string) => Promise<boolean>;
	uploadFile: (file: File, onProgress?: (percent: number) => void) => Promise<void>;
	addFile: (file: ServerFile) => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: React.ReactNode }) {
	const { socket, isConnected } = useSocket();

	const [files, setFiles] = useState<ServerFile[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [processingFileId, setProcessingFileId] = useState<string | null>(null);
	const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

	const openUploadModal = useCallback(() => {
		setIsUploadModalOpen(true);
	}, []);

	const closeUploadModal = useCallback(() => {
		setIsUploadModalOpen(false);
	}, []);

	const addFile = useCallback((newFile: ServerFile) => {
		setFiles((prev) => {
			if (prev.some((f) => f.fileId === newFile.fileId)) {
				return prev.map((f) => (f.fileId === newFile.fileId ? newFile : f));
			}
			return [newFile, ...prev];
		});
	}, []);

	/**
	 * Fetches user files from the backend via "viewFiles" WebSocket event
	 */
	const fetchFiles = useCallback(async (): Promise<void> => {
		if (!socket || !isConnected) return;

		setIsLoading(true);
		setError(null);

		return new Promise((resolve) => {
			socket.emit(
				"viewFiles",
				{ parentId: null, offset: 0, limit: 100 },
				(response: SocketStandardResponse<ServerFile[]>) => {
					setIsLoading(false);
					if (response && response.success) {
						setFiles(response.data || []);
					} else {
						setError(response?.error || "Failed to retrieve files from server");
					}
					resolve();
				}
			);
		});
	}, [socket, isConnected]);

	// Fetch files on initial connect
	useEffect(() => {
		if (isConnected && socket) {
			fetchFiles();
		} else {
			setFiles([]);
			setIsLoading(true);
		}
	}, [isConnected, socket, fetchFiles]);

	// Handle real-time concurrent file updates from server (fired for everyone except sender)
	useEffect(() => {
		if (!socket || !isConnected) return;

		const handleFileUpdated = (event: FileUpdatedEvent) => {
			if (!event || !event.operation) return;

			switch (event.operation) {
				case "fileAdded": {
					if (event.data) {
						addFile(event.data);
					}
					break;
				}
				case "fileRenamed": {
					const { fileId, newFileName } = event.data;
					setFiles((prev) =>
						prev.map((f) =>
							f.fileId === fileId
								? { ...f, fileName: newFileName, modifiedAt: new Date().toISOString() }
								: f
						)
					);
					break;
				}
				case "fileDeleted": {
					const { fileId } = event.data;
					setFiles((prev) => prev.filter((f) => f.fileId !== fileId));
					break;
				}
				default:
					break;
			}
		};

		socket.on("fileUpdated", handleFileUpdated);

		return () => {
			socket.off("fileUpdated", handleFileUpdated);
		};
	}, [socket, isConnected, addFile]);

	/**
	 * Requests download signed URL and triggers native browser download
	 */
	const downloadFile = useCallback(async (file: ServerFile): Promise<void> => {
		if (!socket || !isConnected) {
			throw new Error("WebSocket connection is not active");
		}

		try {
			setProcessingFileId(file.fileId);
			const response: SocketStandardResponse<DownloadResponseData> = await new Promise((resolve) => {
				socket.emit(
					"requestingToDownload",
					{ fileId: file.fileId },
					(res: SocketStandardResponse<DownloadResponseData>) => {
						resolve(res);
					}
				);
			});

			if (!response || !response.success || !response.data?.signedUrl) {
				throw new Error(response?.error || "Failed to obtain download authorization");
			}

			const link = document.createElement("a");
			link.href = response.data.signedUrl;
			link.setAttribute("download", file.fileName);
			link.setAttribute("target", "_blank");
			link.rel = "noopener noreferrer";
			document.body.appendChild(link);
			link.click();
			link.remove();
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : "Failed to download file";
			console.error("Download error:", err);
			throw new Error(errorMessage);
		} finally {
			setProcessingFileId(null);
		}
	}, [socket, isConnected]);

	/**
	 * Requests download signed URL and opens the file in a new tab for preview
	 */
	const previewFile = useCallback(async (file: ServerFile): Promise<void> => {
		if (!socket || !isConnected) {
			throw new Error("WebSocket connection is not active");
		}

		try {
			setProcessingFileId(file.fileId);
			const response: SocketStandardResponse<DownloadResponseData> = await new Promise((resolve) => {
				socket.emit(
					"requestingToDownload",
					{ fileId: file.fileId },
					(res: SocketStandardResponse<DownloadResponseData>) => {
						resolve(res);
					}
				);
			});

			if (!response || !response.success || !response.data?.signedUrl) {
				throw new Error(response?.error || "Failed to preview file");
			}

			window.open(response.data.signedUrl, "_blank", "noopener,noreferrer");
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : "Failed to preview file";
			console.error("Preview error:", err);
			throw new Error(errorMessage);
		} finally {
			setProcessingFileId(null);
		}
	}, [socket, isConnected]);

	/**
	 * Emits "renameFile" WebSocket event and updates the file name locally on acknowledgment
	 */
	const renameFile = useCallback(async (fileId: string, newFileName: string): Promise<boolean> => {
		if (!socket || !isConnected) throw new Error("WebSocket connection is not active");

		const response: SocketStandardResponse = await new Promise((resolve) => {
			socket.emit("renameFile", { fileId, newFileName }, (res: SocketStandardResponse) => {
				resolve(res);
			});
		});

		if (!response || !response.success) {
			throw new Error(response?.error || "Failed to rename file");
		}

		// Update file locally for sender upon positive ack
		setFiles((prev) =>
			prev.map((f) =>
				f.fileId === fileId
					? { ...f, fileName: newFileName, modifiedAt: new Date().toISOString() }
					: f
			)
		);

		return true;
	}, [socket, isConnected]);

	/**
	 * Emits "deleteFile" WebSocket event and removes the file locally on acknowledgment
	 */
	const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
		if (!socket || !isConnected) throw new Error("WebSocket connection is not active");

		const response: SocketStandardResponse = await new Promise((resolve) => {
			socket.emit("deleteFile", { fileId }, (res: SocketStandardResponse) => {
				resolve(res);
			});
		});

		if (!response || !response.success) {
			throw new Error(response?.error || "Failed to delete file");
		}

		// Remove file locally for sender upon positive ack
		setFiles((prev) => prev.filter((f) => f.fileId !== fileId));

		return true;
	}, [socket, isConnected]);

	/**
	 * Coordinates file upload via WebSocket authorization, direct S3 PUT with progress, and server acknowledgment.
	 * Adds the newly created file locally upon positive ack.
	 */
	const uploadFile = useCallback(async (file: File, onProgress?: (percent: number) => void): Promise<void> => {
		if (!socket || !isConnected) {
			throw new Error("WebSocket connection is not active");
		}

		const response: any = await new Promise((resolve) => {
			socket.emit(
				"requestingToUpload",
				{
					fileName: file.name,
					mimeType: file.type || "application/octet-stream",
					sizeBytes: file.size,
					parentId: null,
				},
				(res: any) => resolve(res)
			);
		});

		if (!response || !response.success || !response.data) {
			throw new Error(response?.error || "Failed to obtain upload authorization");
		}

		const { uploadId, signedUrl } = response.data;

		await new Promise<void>((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open("PUT", signedUrl, true);
			xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable && onProgress) {
					const percent = Math.round((event.loaded / event.total) * 100);
					onProgress(percent);
				}
			};

			xhr.onload = async () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					socket.emit("uploadSuccess", { uploadId }, (ackRes: SocketStandardResponse<ServerFile>) => {
						if (ackRes && ackRes.success) {
							if (ackRes.data) {
								addFile(ackRes.data);
							}
							if (onProgress) onProgress(100);
							resolve();
						} else {
							reject(new Error(ackRes?.error || "Failed to acknowledge upload success"));
						}
					});
				} else {
					socket.emit("uploadFailed", { uploadId }, () => {});
					reject(new Error(`S3 Upload failed with status ${xhr.status}`));
				}
			};

			xhr.onerror = () => {
				socket.emit("uploadFailed", { uploadId }, () => {});
				reject(new Error("Network error during file upload"));
			};

			xhr.send(file);
		});
	}, [socket, isConnected, addFile]);

	const value = useMemo(
		() => ({
			files,
			isLoading,
			error,
			processingFileId,
			isUploadModalOpen,
			openUploadModal,
			closeUploadModal,
			fetchFiles,
			downloadFile,
			previewFile,
			renameFile,
			deleteFile,
			uploadFile,
			addFile,
		}),
		[
			files,
			isLoading,
			error,
			processingFileId,
			isUploadModalOpen,
			openUploadModal,
			closeUploadModal,
			fetchFiles,
			downloadFile,
			previewFile,
			renameFile,
			deleteFile,
			uploadFile,
			addFile,
		]
	);

	return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
}

export function useFiles() {
	const context = useContext(FileContext);
	if (!context) {
		throw new Error("useFiles must be used within a FileProvider");
	}
	return context;
}
