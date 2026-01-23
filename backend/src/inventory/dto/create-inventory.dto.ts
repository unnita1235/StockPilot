import {
    IsString,
    IsNumber,
    IsOptional,
    Min,
    Max,
    IsArray,
    IsUrl,
    Length,
    IsNotEmpty,
    MaxLength,
    IsInt,
    IsPositive,
    ValidateIf,
} from 'class-validator';

export class CreateInventoryDto {
    @IsString({ message: 'Name must be a string' })
    @IsNotEmpty({ message: 'Name is required' })
    @Length(1, 200, { message: 'Name must be between 1 and 200 characters' })
    name: string;

    @IsString({ message: 'Description must be a string' })
    @IsOptional()
    @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
    description?: string;

    @IsNumber({}, { message: 'Quantity must be a number' })
    @Min(0, { message: 'Quantity cannot be negative' })
    @Max(1000000000, { message: 'Quantity exceeds maximum allowed value' })
    @IsInt({ message: 'Quantity must be an integer' })
    quantity: number;

    @IsString({ message: 'Category must be a string' })
    @IsOptional()
    @Length(1, 100, { message: 'Category must be between 1 and 100 characters' })
    category?: string;

    @IsString({ message: 'Location must be a string' })
    @IsOptional()
    @MaxLength(200, { message: 'Location must not exceed 200 characters' })
    location?: string;

    @IsNumber({}, { message: 'Low stock threshold must be a number' })
    @Min(0, { message: 'Low stock threshold cannot be negative' })
    @Max(1000000, { message: 'Low stock threshold exceeds maximum allowed value' })
    @IsInt({ message: 'Low stock threshold must be an integer' })
    @IsOptional()
    lowStockThreshold?: number;

    @IsNumber({}, { message: 'Unit price must be a number' })
    @Min(0, { message: 'Unit price cannot be negative' })
    @Max(1000000000, { message: 'Unit price exceeds maximum allowed value' })
    @IsOptional()
    unitPrice?: number;

    @IsString({ message: 'Image URL must be a string' })
    @IsOptional()
    @ValidateIf((obj) => obj.imageUrl && obj.imageUrl.length > 0)
    @IsUrl({}, { message: 'Image URL must be a valid URL' })
    @MaxLength(500, { message: 'Image URL must not exceed 500 characters' })
    imageUrl?: string;

    @IsString({ message: 'SKU must be a string' })
    @IsOptional()
    @MaxLength(100, { message: 'SKU must not exceed 100 characters' })
    sku?: string;

    @IsString({ message: 'Barcode must be a string' })
    @IsOptional()
    @MaxLength(100, { message: 'Barcode must not exceed 100 characters' })
    barcode?: string;

    @IsString({ message: 'Supplier must be a string' })
    @IsOptional()
    @MaxLength(200, { message: 'Supplier must not exceed 200 characters' })
    supplier?: string;

    @IsArray({ message: 'Tags must be an array' })
    @IsString({ each: true, message: 'Each tag must be a string' })
    @IsOptional()
    @MaxLength(50, { each: true, message: 'Each tag must not exceed 50 characters' })
    tags?: string[];
}
