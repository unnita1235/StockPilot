import {
    IsString,
    IsNumber,
    IsEnum,
    IsOptional,
    IsMongoId,
    NotEquals,
    IsNotEmpty,
    Length,
    MaxLength,
    Min,
    Max,
} from 'class-validator';
import { StockMovementType } from '../stock-movement.schema';

export class CreateStockMovementDto {
    @IsEnum(StockMovementType, {
        message: 'Type must be one of: IN, OUT, ADJUSTMENT, AUDIT',
    })
    @IsNotEmpty({ message: 'Movement type is required' })
    type: StockMovementType;

    @IsNumber({}, { message: 'Quantity must be a number' })
    @NotEquals(0, { message: 'Quantity cannot be zero' })
    @Min(-1000000000, { message: 'Quantity exceeds minimum allowed value' })
    @Max(1000000000, { message: 'Quantity exceeds maximum allowed value' })
    quantity: number;

    @IsString({ message: 'Reason must be a string' })
    @IsNotEmpty({ message: 'Reason is required' })
    @Length(1, 500, { message: 'Reason must be between 1 and 500 characters' })
    reason: string;

    @IsString({ message: 'Reference must be a string' })
    @IsOptional()
    @MaxLength(200, { message: 'Reference must not exceed 200 characters' })
    reference?: string;
}
