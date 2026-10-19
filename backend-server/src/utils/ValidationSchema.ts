import { z } from "zod";

// Common Schemas

const fileId = z.string().startsWith("file_").length(69, "File ID is invalid");
const parentId = z.null();
const uploadId = z.string().startsWith("upload_").length(39, "Upload ID is invalid");
const fileName = z.string()
	.trim()
	.min(1, "File name is required")
	.max(255, "File name cannot exceed 255 characters")
	.refine(name => name !== "." && name !== "..", "Invalid file name")
	.refine(name => !/[\\/]/.test(name), "File name cannot contain path separators");

export const requestUploadSchema = z.object({
	fileName: z
		.string()
		.trim()
		.min(1, "File name is required")
		.max(255, "File name cannot exceed 255 characters")
		.refine(name => name !== "." && name !== "..", "Invalid file name")
		.refine(name => !/[\\/]/.test(name), "File name cannot contain path separators"),

	mimeType: z
		.string()
		.trim()
		.min(1, "MIME type is required")
		.max(255, "MIME type is too long")
		.regex(/^[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+$/, "Invalid MIME type"),

	sizeBytes: z
		.number()
		.int()
		.positive("File size must be greater than zero")
		.max(5 * 1024 * 1024 * 1024, "File cannot exceed 5 GB"),

	parentId,
});

export type RequestUploadInput = z.infer<typeof requestUploadSchema>;


export const uploadAcknowlegementSchema = z.object({
	uploadId,
});

export type UploadAcknowlegementInput = z.infer<typeof uploadAcknowlegementSchema>;


export const viewFilesInputSchema = z.object({
	parentId,
	offset: z.number().min(0).default(0),
	limit: z.number().min(1).max(100).default(10),
});

export type ViewFilesInput = z.infer<typeof viewFilesInputSchema>;


export const requestDownloadSchema = z.object({
	fileId,
});

export type RequestDownloadInput = z.infer<typeof requestDownloadSchema>;

export const renameFileSchema = z.object({
	fileId,
	newFileName:fileName
})

export type RenameFileInput = z.infer<typeof renameFileSchema>;

export const deleteFileSchema = z.object({
	fileId
});

export type DeleteFileInput = z.infer<typeof deleteFileSchema>;