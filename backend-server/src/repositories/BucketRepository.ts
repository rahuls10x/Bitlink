import {
    S3Client,
    DeleteObjectCommand,
    HeadObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

export default class BucketRepository {
    private s3Client: S3Client;
    private bucketName: string;

    constructor(s3Client: S3Client, bucketName: string) {
        this.s3Client = s3Client;
        this.bucketName = bucketName;
    }

    /**
     * Get a signed URL for uploading a file to S3 / MinIO
     * 
     * Inorder Flow:
     * - Construct PutObjectCommand with bucket and key
     * - Generate presigned URL with specified expiration time
     * - Return the presigned upload URL
     */
    async getUploadSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

        return signedUrl;
    }

    /**
     * Get a signed URL for downloading a file from S3 / MinIO
     * 
     * Inorder Flow:
     * - Construct GetObjectCommand with bucket and key
     * - Generate presigned URL with specified expiration time
     * - Return the presigned download URL
     */
    async getDownloadSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

        return signedUrl;
    }

    /**
     * Delete a file from S3 / MinIO bucket
     * 
     * Inorder Flow:
     * - Construct DeleteObjectCommand with bucket and key
     * - Execute delete command via S3Client
     * - Return true upon success
     */
    async deleteFile(key: string): Promise<boolean> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        await this.s3Client.send(command);

        return true;
    }

    /**
     * Check if a file exists in S3 / MinIO bucket
     * 
     * Inorder Flow:
     * - Construct HeadObjectCommand with bucket and key
     * - Execute command; return true if object exists or false if NotFound
     */
    async fileExists(key: string): Promise<boolean> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            await this.s3Client.send(command);

            return true;
        } catch (error: any) {
            if (error.$metadata?.httpStatusCode === 404 || error.name === "NotFound") {
                return false;
            }
            throw error;
        }
    }

    /**
     * Get file metadata from S3 / MinIO bucket
     * 
     * Inorder Flow:
     * - Construct HeadObjectCommand with bucket and key
     * - Execute command and extract metadata, content length, content type, and last modified date
     * - Return metadata object or null if not found
     */
    async getFileMetadata(key: string): Promise<{contentLength?: number;contentType?: string;lastModified?: Date;metadata?: Record<string, string>;} | null> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            const response = await this.s3Client.send(command);

            const result: {
                contentLength?: number;
                contentType?: string;
                lastModified?: Date;
                metadata?: Record<string, string>;
            } = {};

            if (response.ContentLength !== undefined) {
                result.contentLength = response.ContentLength;
            }
            if (response.ContentType !== undefined) {
                result.contentType = response.ContentType;
            }
            if (response.LastModified !== undefined) {
                result.lastModified = response.LastModified;
            }
            if (response.Metadata !== undefined) {
                result.metadata = response.Metadata;
            }

            return result;
        } catch (error: any) {
            if (error.$metadata?.httpStatusCode === 404 || error.name === "NotFound") {
                return null;
            }
            throw error;
        }
    }
}
