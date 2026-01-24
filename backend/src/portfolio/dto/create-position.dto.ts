import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreatePositionDto {
    @IsString()
    @IsNotEmpty()
    symbol: string;

    @IsNumber()
    @Min(0.01, { message: 'Quantity must be greater than 0' })
    quantity: number;

    @IsNumber()
    @Min(0)
    buyPrice: number;
}
