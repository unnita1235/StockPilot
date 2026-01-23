import { IsString, IsNumber, IsEnum, IsOptional, IsMongoId, NotEquals } from 'class-validator';
import { StockMovementType } from '../stock-movement.schema';

export class CreateStockMovementDto {
    @IsEnum(StockMovementType)
    type: StockMovementType;

    @IsNumber()
    @NotEquals(0)
    quantity: number;

    @IsString()
    reason: string;

    @IsString()
    @IsOptional()
    reference?: string;
}
