import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Position, PositionDocument } from './position.schema';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

@Injectable()
export class PortfolioService {
    constructor(
        @InjectModel(Position.name) private positionModel: Model<PositionDocument>,
    ) { }

    async addPosition(userId: string, createPositionDto: CreatePositionDto): Promise<Position> {
        const newPosition = new this.positionModel({
            ...createPositionDto,
            userId,
        });
        return newPosition.save();
    }

    async findAll(userId: string): Promise<any> {
        const positions = await this.positionModel.find({ userId }).exec();

        // Mock current price logic: 
        // For now, let's assume current price is buyPrice * (something random between 0.9 and 1.1) to simulate movement
        // Or just +5% for everything to make them feel good for this MVP?
        // Let's make it random so PnL isn't always zero.

        const portfolio = positions.map(pos => {
            // Deterministic "random" based on symbol length to keep it consistent-ish for a single "session" view? 
            // Nah, just random is fine for a demo.
            // Actually, let's make it simple: Current Price = Buy Price * 1.05 (5% profit)
            const currentPrice = pos.buyPrice * 1.05;
            const totalValue = currentPrice * pos.quantity;
            const investValue = pos.buyPrice * pos.quantity;
            const pnl = totalValue - investValue;

            return {
                _id: pos._id,
                symbol: pos.symbol,
                quantity: pos.quantity,
                buyPrice: pos.buyPrice,
                currentPrice: parseFloat(currentPrice.toFixed(2)),
                totalValue: parseFloat(totalValue.toFixed(2)),
                pnl: parseFloat(pnl.toFixed(2)),
            };
        });

        const totalInvestment = portfolio.reduce((sum, item) => sum + (item.buyPrice * item.quantity), 0);
        const totalValue = portfolio.reduce((sum, item) => sum + item.totalValue, 0);
        const totalPnL = totalValue - totalInvestment;

        return {
            summary: {
                totalInvestment: parseFloat(totalInvestment.toFixed(2)),
                totalValue: parseFloat(totalValue.toFixed(2)),
                totalPnL: parseFloat(totalPnL.toFixed(2)),
                positionCount: portfolio.length
            },
            positions: portfolio
        };
    }

    async update(userId: string, id: string, updatePositionDto: UpdatePositionDto): Promise<Position> {
        const position = await this.positionModel.findOneAndUpdate(
            { _id: id, userId },
            { $set: updatePositionDto },
            { new: true }
        ).exec();

        if (!position) {
            throw new NotFoundException(`Position #${id} not found`);
        }
        return position;
    }

    async remove(userId: string, id: string): Promise<{ deleted: boolean }> {
        const result = await this.positionModel.deleteOne({ _id: id, userId }).exec();
        if (result.deletedCount === 0) {
            throw new NotFoundException(`Position #${id} not found`);
        }
        return { deleted: true };
    }
}
