import {
    Controller,
    Post,
    Delete,
    Body,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
    constructor(private readonly uploadService: UploadService) {}

    @Post('image')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        })
    )
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        const result = await this.uploadService.uploadFile(file, 'inventory');
        return {
            success: true,
            data: result,
            message: 'Image uploaded successfully',
        };
    }

    @Post('image/base64')
    async uploadBase64Image(@Body() body: { image: string; folder?: string }) {
        if (!body.image) {
            throw new BadRequestException('No image data provided');
        }
        const result = await this.uploadService.uploadBase64Image(
            body.image,
            body.folder || 'inventory'
        );
        return {
            success: true,
            data: result,
            message: 'Image uploaded successfully',
        };
    }

    @Delete()
    async deleteImage(@Body() body: { url: string }) {
        if (!body.url) {
            throw new BadRequestException('No URL provided');
        }
        const deleted = await this.uploadService.deleteFile(body.url);
        return {
            success: deleted,
            message: deleted ? 'Image deleted' : 'Image not found',
        };
    }
}
