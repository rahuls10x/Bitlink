import type BucketRepository from "../repositories/BucketRepository.js";
import type FileRepository from "../repositories/FileRepository.js";
import type { File } from "../types/dbSchema.js";
import { strictCheck } from "../utils/ApplicationError.js";
import type { DeleteFileInput, RenameFileInput, ViewFilesInput } from "../utils/ValidationSchema.js";

export default class FileService{
    private fileRepository:FileRepository;
    private bucketRepository:BucketRepository;

    constructor(fileRepository: FileRepository, bucketRepository: BucketRepository){
        this.fileRepository = fileRepository;
        this.bucketRepository = bucketRepository;
    }

    /**
     * View files from the query
     * 
     * Inorder Flow:
     * - Find files in files collection by userId and parentId with limit and offset
     * - Return files
     */
    async viewFiles(query: ViewFilesInput, userId: string): Promise<File[]> {
        const files = strictCheck(await this.fileRepository.viewFiles(userId, query.parentId, query.limit, query.offset), 500, "Failed to fetch files");

        return files;
    }

    /**
     * Request to download a file
     * 
     * Inorder Flow:
     * - Find file in files collection by fileId and check its ownership
     * - Check if file exists
     * - Create download signed url with expiry
     * - Return download signed url, expiry
     */
    async requestingToDownload(fileId: string, userId: string): Promise<{signedUrl: string, expiresAt: Date}> {
        const file = strictCheck(await this.fileRepository.fetchFileData(fileId), 500, "Failed to fetch file");
        strictCheck(file.userId === userId, 403, "File does not belong to user");

        strictCheck(await this.bucketRepository.fileExists(file.fileId), 500, "File does not exist");

        const expirySeconds = 1 * 60;
        const downloadUrl = strictCheck(await this.bucketRepository.getDownloadSignedUrl(file.fileId, expirySeconds), 500, "Failed to get download signed url");

        return {signedUrl:downloadUrl, expiresAt: new Date(Date.now() + expirySeconds * 1000)}
    }

    /**
     * Request to rename a file
     * 
     * Inorder Flow:
     * - Find file in files collection by fileId and check its ownership
     * - Check if file exists
     * - Rename file in db
     */
    async renameFile(data: RenameFileInput, userId: string): Promise<void> {
        const file = strictCheck(await this.fileRepository.fetchFileData(data.fileId), 500, "Failed to fetch file");
        strictCheck(file.userId === userId, 403, "File does not belong to user");

        strictCheck(await this.bucketRepository.fileExists(file.fileId), 500, "File does not exist");

        const modifiedTime = new Date(Date.now());
        strictCheck(await this.fileRepository.renameFile(file.fileId, data.newFileName, modifiedTime ), 500, "Failed to rename file");
    }

    /**
     * Request to delete a file
     * 
     * Inorder Flow:
     * - Find file in files collection by fileId and check its ownership
     * - Check if file exists
     * - Delete file from db and then bucket
     */
    async deleteFile(data: DeleteFileInput, userId: string): Promise<void> {
        const file = strictCheck(await this.fileRepository.fetchFileData(data.fileId), 500, "Failed to fetch file");
        strictCheck(file.userId === userId, 403, "File does not belong to user");

        strictCheck(await this.bucketRepository.fileExists(file.fileId), 500, "File does not exist");

        strictCheck(await this.fileRepository.deleteFile(file.fileId), 500, "Failed to delete file");
        strictCheck(await this.bucketRepository.deleteFile(file.fileId), 500, "Failed to delete file from bucket");
    }
}