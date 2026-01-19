import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class StockRepository {
  constructor(
    @InjectModel('Stock') private readonly stockModel: Model<any>,
    @InjectModel('StockMovement') private readonly movementModel: Model<any>,
  ) {}

  async findById(stockId: string, tenantId: string) {
    const stock = await this.stockModel.findOne({ _id: stockId, tenantId });
    if (!stock) throw new NotFoundException('Stock not found');
    return stock;
  }

  async incrementQuantity(stockId: string, delta: number) {
    return this.stockModel.findByIdAndUpdate(
      stockId,
      { $inc: { quantity: delta } },
      { new: true },
    );
  }

  async logMovement(data: any) {
    const movement = new this.movementModel(data);
    return movement.save();
  }
}