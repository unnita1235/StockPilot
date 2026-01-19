import { Test, TestingModule } from '@nestjs/testing';
import { StockService } from './stock.service';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

describe('StockService', () => {
    let service: StockService;
    let mockInventoryModel: any;
    let mockMovementModel: any;
    let mockNotificationsService: any;

    const mockItem = {
        _id: 'item123',
        name: 'Test Item',
        quantity: 100,
        lowStockThreshold: 10,
        save: jest.fn(),
    };

    beforeEach(async () => {
        mockInventoryModel = {
            findById: jest.fn(),
        };

        mockMovementModel = {
            create: jest.fn(),
            find: jest.fn(),
        };

        mockNotificationsService = {
            sendStockUpdateNotification: jest.fn().mockResolvedValue(undefined),
            sendLowStockAlert: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StockService,
                {
                    provide: getModelToken('Inventory'),
                    useValue: mockInventoryModel,
                },
                {
                    provide: getModelToken('StockMovement'),
                    useValue: mockMovementModel,
                },
                {
                    provide: NotificationsService,
                    useValue: mockNotificationsService,
                },
            ],
        }).compile();

        service = module.get<StockService>(StockService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('addStock', () => {
        it('should add stock and create movement record', async () => {
            const item = { ...mockItem, save: jest.fn().mockResolvedValue({ ...mockItem, quantity: 110 }) };
            mockInventoryModel.findById.mockResolvedValue(item);
            mockMovementModel.create.mockResolvedValue({});

            const result = await service.addStock('item123', 10, 'Restock', 'Monthly order', 'user1');

            expect(result.previousQuantity).toBe(100);
            expect(result.updated.quantity).toBe(110);
            expect(mockMovementModel.create).toHaveBeenCalledWith({
                itemId: 'item123',
                type: 'IN',
                quantity: 10,
                reason: 'Restock',
                notes: 'Monthly order',
                userId: 'user1',
            });
            expect(mockNotificationsService.sendStockUpdateNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'stock_added',
                    itemId: 'item123',
                    previousQuantity: 100,
                    newQuantity: 110,
                })
            );
        });

        it('should throw BadRequestException for zero or negative quantity', async () => {
            await expect(service.addStock('item123', 0, 'Test')).rejects.toThrow(BadRequestException);
            await expect(service.addStock('item123', -5, 'Test')).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if item not found', async () => {
            mockInventoryModel.findById.mockResolvedValue(null);

            await expect(service.addStock('nonexistent', 10, 'Test')).rejects.toThrow(NotFoundException);
        });
    });

    describe('removeStock', () => {
        it('should remove stock and create movement record', async () => {
            const item = { ...mockItem, save: jest.fn().mockResolvedValue({ ...mockItem, quantity: 90 }) };
            mockInventoryModel.findById.mockResolvedValue(item);
            mockMovementModel.create.mockResolvedValue({});

            const result = await service.removeStock('item123', 10, 'Sale', 'Customer order', 'user1');

            expect(result.previousQuantity).toBe(100);
            expect(result.updated.quantity).toBe(90);
            expect(mockMovementModel.create).toHaveBeenCalledWith({
                itemId: 'item123',
                type: 'OUT',
                quantity: 10,
                reason: 'Sale',
                notes: 'Customer order',
                userId: 'user1',
            });
        });

        it('should throw BadRequestException for insufficient stock', async () => {
            const item = { ...mockItem, quantity: 5, save: jest.fn() };
            mockInventoryModel.findById.mockResolvedValue(item);

            await expect(service.removeStock('item123', 10, 'Sale')).rejects.toThrow(BadRequestException);
        });

        it('should trigger low stock alert when quantity drops below threshold', async () => {
            const item = {
                ...mockItem,
                quantity: 15,
                lowStockThreshold: 10,
                save: jest.fn().mockResolvedValue({ ...mockItem, quantity: 5, lowStockThreshold: 10 }),
            };
            mockInventoryModel.findById.mockResolvedValue(item);
            mockMovementModel.create.mockResolvedValue({});

            await service.removeStock('item123', 10, 'Sale', undefined, 'user1');

            expect(mockNotificationsService.sendLowStockAlert).toHaveBeenCalledWith(
                expect.objectContaining({
                    _id: 'item123',
                    name: 'Test Item',
                    quantity: 5,
                    lowStockThreshold: 10,
                })
            );
        });
    });

    describe('getMovements', () => {
        it('should return movements for a specific item', async () => {
            const mockMovements = [
                { itemId: 'item123', type: 'IN', quantity: 10 },
                { itemId: 'item123', type: 'OUT', quantity: 5 },
            ];

            mockMovementModel.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                        exec: jest.fn().mockResolvedValue(mockMovements),
                    }),
                }),
            });

            const result = await service.getMovements('item123');

            expect(result).toEqual(mockMovements);
            expect(mockMovementModel.find).toHaveBeenCalledWith({ itemId: 'item123' });
        });

        it('should return all movements when no itemId provided', async () => {
            const mockMovements = [{ itemId: 'item1', type: 'IN', quantity: 10 }];

            mockMovementModel.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                        exec: jest.fn().mockResolvedValue(mockMovements),
                    }),
                }),
            });

            const result = await service.getMovements();

            expect(result).toEqual(mockMovements);
            expect(mockMovementModel.find).toHaveBeenCalledWith({});
        });
    });

    describe('quickUpdate', () => {
        it('should update stock directly and create adjustment movement', async () => {
            const item = {
                ...mockItem,
                quantity: 100,
                save: jest.fn().mockResolvedValue({ ...mockItem, quantity: 150 }),
            };
            mockInventoryModel.findById.mockResolvedValue(item);
            mockMovementModel.create.mockResolvedValue({});

            const result = await service.quickUpdate('item123', 150, 'user1');

            expect(result.quantity).toBe(150);
            expect(mockMovementModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    itemId: 'item123',
                    type: 'ADJUST',
                    quantity: 50,
                    reason: 'Quick update adjustment',
                })
            );
            expect(mockNotificationsService.sendStockUpdateNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'stock_adjusted',
                    previousQuantity: 100,
                    newQuantity: 150,
                })
            );
        });

        it('should throw BadRequestException for negative stock', async () => {
            await expect(service.quickUpdate('item123', -10)).rejects.toThrow(BadRequestException);
        });

        it('should not create movement if stock unchanged', async () => {
            const item = {
                ...mockItem,
                quantity: 100,
                save: jest.fn().mockResolvedValue({ ...mockItem, quantity: 100 }),
            };
            mockInventoryModel.findById.mockResolvedValue(item);

            await service.quickUpdate('item123', 100, 'user1');

            expect(mockMovementModel.create).not.toHaveBeenCalled();
            expect(mockNotificationsService.sendStockUpdateNotification).not.toHaveBeenCalled();
        });

        it('should trigger low stock alert when quick update drops below threshold', async () => {
            const item = {
                ...mockItem,
                quantity: 100,
                lowStockThreshold: 10,
                save: jest.fn().mockResolvedValue({ ...mockItem, quantity: 5, lowStockThreshold: 10 }),
            };
            mockInventoryModel.findById.mockResolvedValue(item);
            mockMovementModel.create.mockResolvedValue({});

            await service.quickUpdate('item123', 5, 'user1');

            expect(mockNotificationsService.sendLowStockAlert).toHaveBeenCalled();
        });
    });
});
