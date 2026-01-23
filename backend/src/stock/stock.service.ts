import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inventory, InventoryDocument } from '../inventory/inventory.schema';
import { StockMovement, StockMovementDocument } from './stock.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class StockService {
  constructor(
    @InjectModel(Inventory.name) private readonly inventoryModel: Model<InventoryDocument>,
    @InjectModel(StockMovement.name) private readonly movementModel: Model<StockMovementDocument>,
    private readonly notificationsService: NotificationsService,
  ) { }

  async addStock(itemId: string, quantity: number, reason: string, notes?: string, userId?: string, tenantId?: string) {
    if (quantity <= 0) throw new BadRequestException('Quantity must be greater than zero');

    const item = await this.inventoryModel.findOne({ _id: itemId, tenantId }).exec();
    if (!item) throw new NotFoundException('Item not found');

    const previousQuantity = item.quantity;
    item.quantity = previousQuantity + quantity;
    const updated = await item.save();

    await this.movementModel.create({ itemId, type: 'IN', quantity, reason, notes, userId, tenantId });

    // Emit real-time notification
    await this.notificationsService.sendStockUpdateNotification({
      type: 'stock_added',
      itemId: item._id.toString(),
      itemName: item.name,
      previousQuantity,
      newQuantity: updated.quantity,
      userId: userId || 'system',
    });

    return { previousQuantity, updated };
  }

  async removeStock(itemId: string, quantity: number, reason: string, notes?: string, userId?: string, tenantId?: string) {
    if (quantity <= 0) throw new BadRequestException('Quantity must be greater than zero');

    const item = await this.inventoryModel.findOne({ _id: itemId, tenantId }).exec();
    if (!item) throw new NotFoundException('Item not found');

    const previousQuantity = item.quantity;
    if (previousQuantity < quantity) throw new BadRequestException('Insufficient stock');

    item.quantity = previousQuantity - quantity;
    const updated = await item.save();

    await this.movementModel.create({ itemId, type: 'OUT', quantity, reason, notes, userId, tenantId });

    // Emit real-time notification
    await this.notificationsService.sendStockUpdateNotification({
      type: 'stock_removed',
      itemId: item._id.toString(),
      itemName: item.name,
      previousQuantity,
      newQuantity: updated.quantity,
      userId: userId || 'system',
    });

    // Check for low stock alert
    if (updated.quantity <= (item.lowStockThreshold || 0)) {
      await this.notificationsService.sendLowStockAlert({
        _id: item._id.toString(),
        name: item.name,
        quantity: updated.quantity,
        lowStockThreshold: item.lowStockThreshold || 0,
      });
    }

    return { previousQuantity, updated };
  }

  async getMovements(itemId?: string, tenantId?: string) {
    const filter: any = { tenantId };
    if (itemId) filter.itemId = itemId;
    return this.movementModel.find(filter).sort({ createdAt: -1 }).limit(100).exec();
  }

  async quickUpdate(itemId: string, newStock: number, userId?: string, tenantId?: string) {
    if (newStock < 0) throw new BadRequestException('Stock cannot be negative');

    const item = await this.inventoryModel.findOne({ _id: itemId, tenantId }).exec();
    if (!item) throw new NotFoundException('Item not found');

    const previousQuantity = item.quantity;
    item.quantity = newStock;
    const updated = await item.save();

    // Record adjustment movement
    const adjustmentQty = newStock - previousQuantity;
    if (adjustmentQty !== 0) {
      await this.movementModel.create({
        itemId,
        type: 'ADJUST',
        quantity: Math.abs(adjustmentQty),
        reason: 'Quick update adjustment',
        notes: `Changed from ${previousQuantity} to ${newStock}`,
        userId,
        tenantId,
      });

      // Emit real-time notification
      await this.notificationsService.sendStockUpdateNotification({
        type: 'stock_adjusted',
        itemId: item._id.toString(),
        itemName: item.name,
        previousQuantity,
        newQuantity: newStock,
        userId: userId || 'system',
      });

      // Check for low stock alert
      if (newStock <= (item.lowStockThreshold || 0)) {
        await this.notificationsService.sendLowStockAlert({
          _id: item._id.toString(),
          name: item.name,
          quantity: newStock,
          lowStockThreshold: item.lowStockThreshold || 0,
        });
      }
    }

    return updated;
  }
}
