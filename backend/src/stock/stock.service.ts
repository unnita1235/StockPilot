import { BadRequestException, Injectable } from '@nestjs/common';
import { StockRepository } from './stock.repository';

@Injectable()
export class StockService {
  constructor(private readonly repo: StockRepository) {}

  async moveStock(
    stockId: string,
    type: 'IN' | 'OUT',
    quantity: number,
    tenantId: string,
    reason?: string,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero');
    }

    const stock = await this.repo.findById(stockId, tenantId);

    if (type === 'OUT' && stock.quantity < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const delta = type === 'IN' ? quantity : -quantity;

    const updated = await this.repo.incrementQuantity(stockId, delta);

    await this.repo.logMovement({
      stockId,
      tenantId,
      type,
      quantity,
      reason,
    });

    return updated;
  }
}