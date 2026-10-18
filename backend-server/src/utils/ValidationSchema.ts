import { z } from "zod";

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

	parentId: z.null(),
});

export type RequestUploadInput = z.infer<typeof requestUploadSchema>;
