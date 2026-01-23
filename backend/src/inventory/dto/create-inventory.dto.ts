import { IsString, IsNumber, IsOptional, Min, IsArray } from 'class-validator';

export class CreateInventoryDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Min(0)
    quantity: number;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    lowStockThreshold?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    unitPrice?: number;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsString()
    @IsOptional()
    sku?: string;

    @IsString()
    @IsOptional()
    barcode?: string;

    @IsString()
    @IsOptional()
    supplier?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];
}
