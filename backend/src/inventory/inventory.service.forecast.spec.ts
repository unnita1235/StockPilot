import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { getModelToken } from '@nestjs/mongoose';
import { Inventory } from './inventory.schema';
import { StockMovement, StockMovementType } from './stock-movement.schema';
import { NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';

describe('InventoryService - Forecasting', () => {
    let service: InventoryService;
    let inventoryModel: any;
    let stockMovementModel: any;
    let mockAuditService: any;

    beforeEach(async () => {
        inventoryModel = {
            findById: jest.fn(),
            find: jest.fn(),
            findOneAndUpdate: jest.fn(),
            findOneAndDelete: jest.fn(),
        };
        stockMovementModel = {
            find: jest.fn(),
        };
        mockAuditService = {
            log: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InventoryService,
                { provide: getModelToken(Inventory.name), useValue: inventoryModel },
                { provide: getModelToken(StockMovement.name), useValue: stockMovementModel },
                { provide: AuditService, useValue: mockAuditService },
            ],
        }).compile();

        service = module.get<InventoryService>(InventoryService);
    });

    it('should calculate forecast correctly for regular usage', async () => {
        const inventoryId = 'item1';
        const item = { _id: inventoryId, quantity: 50 }; // Current stock 50

        // Mock inventory item
        inventoryModel.findById.mockReturnValue({
            exec: jest.fn().mockResolvedValue(item),
        });

        // Mock 30 days of movements: Total 150 OUT
        // ADC = 150 / 30 = 5
        const movements = [
            { quantity: -100, type: StockMovementType.OUT },
            { quantity: -50, type: StockMovementType.OUT },
        ];

        stockMovementModel.find.mockReturnValue({
            exec: jest.fn().mockResolvedValue(movements),
        });

        const result = await service.getForecast(inventoryId);

        expect(result.dailyUsage).toBe(5);
        expect(result.daysUntilStockout).toBe(10); // 50 / 5 = 10 days

        // Target Stock = 5 * (30 + 7) = 185
        // Reorder Qty = 185 - 50 = 135
        expect(result.reorderQuantity).toBe(135);

        // Status: 10 days > 7 (LeadTime) but < 12 (LeadTime + 5) -> Low
        expect(result.status).toBe('Low');
    });

    it('should handle zero usage', async () => {
        const inventoryId = 'item2';
        const item = { _id: inventoryId, quantity: 100 };

        inventoryModel.findById.mockReturnValue({
            exec: jest.fn().mockResolvedValue(item),
        });

        stockMovementModel.find.mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
        });

        const result = await service.getForecast(inventoryId);

        expect(result.dailyUsage).toBe(0);
        expect(result.daysUntilStockout).toBeNull();
        expect(result.reorderQuantity).toBe(0);
        expect(result.status).toBe('Safe');
    });

    it('should return critical status if stockout is imminent', async () => {
        const inventoryId = 'item3';
        const item = { _id: inventoryId, quantity: 10 }; // 10 units

        inventoryModel.findById.mockReturnValue({
            exec: jest.fn().mockResolvedValue(item),
        });

        // ADC = 60 / 30 = 2
        stockMovementModel.find.mockReturnValue({
            exec: jest.fn().mockResolvedValue([{ quantity: -60, type: StockMovementType.OUT }]),
        });

        const result = await service.getForecast(inventoryId);

        expect(result.dailyUsage).toBe(2);
        expect(result.daysUntilStockout).toBe(5); // 10 / 2 = 5 days
        // 5 days < 7 (LeadTime) -> Critical
        expect(result.status).toBe('Critical');
    });
});
