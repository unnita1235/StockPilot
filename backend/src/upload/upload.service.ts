import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface UploadResult {
    url: string;
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
}

@Injectable()
export class UploadService {
    private logger = new Logger('UploadService');
    private uploadDir = path.join(process.cwd(), 'uploads');
    private maxFileSize = 5 * 1024 * 1024; // 5MB
    private allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
    ];

    constructor() {
        // Ensure upload directory exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
            this.logger.log(`Created upload directory: ${this.uploadDir}`);
        }
    }

    async uploadFile(
        file: Express.Multer.File,
        folder: string = 'images'
    ): Promise<UploadResult> {
        // Validate file
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`
            );
        }

        if (file.size > this.maxFileSize) {
            throw new BadRequestException(
                `File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`
            );
        }

        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const uniqueId = crypto.randomBytes(16).toString('hex');
        const filename = `${folder}_${uniqueId}${fileExt}`;
        
        // Create folder if it doesn't exist
        const folderPath = path.join(this.uploadDir, folder);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        // Save file
        const filePath = path.join(folderPath, filename);
        fs.writeFileSync(filePath, file.buffer);

        this.logger.log(`File uploaded: ${filename}`);

        // Return URL - in production, you'd use a CDN or cloud storage
        const baseUrl = process.env.API_URL || 'http://localhost:5000';
        const url = `${baseUrl}/uploads/${folder}/${filename}`;

        return {
            url,
            filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
        };
    }

    async uploadBase64Image(
        base64Data: string,
        folder: string = 'images'
    ): Promise<UploadResult> {
        // Parse base64 data
        const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
            throw new BadRequestException('Invalid base64 image format');
        }

        const mimetype = matches[1];
        const data = matches[2];
        const buffer = Buffer.from(data, 'base64');

        if (!this.allowedMimeTypes.includes(mimetype)) {
            throw new BadRequestException(
                `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`
            );
        }

        if (buffer.length > this.maxFileSize) {
            throw new BadRequestException(
                `File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`
            );
        }

        // Generate filename
        const ext = mimetype.split('/')[1].replace('jpeg', 'jpg');
        const uniqueId = crypto.randomBytes(16).toString('hex');
        const filename = `${folder}_${uniqueId}.${ext}`;

        // Create folder if needed
        const folderPath = path.join(this.uploadDir, folder);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        // Save file
        const filePath = path.join(folderPath, filename);
        fs.writeFileSync(filePath, buffer);

        this.logger.log(`Base64 image uploaded: ${filename}`);

        const baseUrl = process.env.API_URL || 'http://localhost:5000';
        const url = `${baseUrl}/uploads/${folder}/${filename}`;

        return {
            url,
            filename,
            originalName: filename,
            size: buffer.length,
            mimetype,
        };
    }

    async deleteFile(fileUrl: string): Promise<boolean> {
        try {
            // Extract filename from URL
            const urlParts = fileUrl.split('/uploads/');
            if (urlParts.length < 2) return false;

            const filePath = path.join(this.uploadDir, urlParts[1]);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                this.logger.log(`File deleted: ${filePath}`);
                return true;
            }
            return false;
        } catch (error) {
            this.logger.error(`Failed to delete file: ${error}`);
            return false;
        }
    }
}
