import { IsNotEmpty, IsNumber, IsString, Min, Matches } from 'class-validator';

export class CreatePositionDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^[A-Z0-9.\-]+$/, { message: 'Symbol can only contain uppercase letters, numbers, dots, and hyphens' })
    symbol: string;

    @IsNumber()
    @Min(0.01, { message: 'Quantity must be greater than 0' })
    quantity: number;

    @IsNumber()
    @Min(0, { message: 'Buy price must be non-negative' })
    buyPrice: number;
}
