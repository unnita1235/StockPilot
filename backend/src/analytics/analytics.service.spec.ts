import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { getModelToken } from '@nestjs/mongoose';

describe('AnalyticsService', () => {
    let service: AnalyticsService;
    let mockInventoryModel: any;
    let mockStockModel: any;

    const createMockItem = (overrides = {}) => ({
        _id: '1',
        name: 'Test Item',
        quantity: 100,
        unitPrice: 10,
        lowStockThreshold: 20,
        category: 'Electronics',
        ...overrides,
    });

    const createMockMovement = (overrides = {}) => ({
        _id: 'mov1',
        itemId: '1',
        type: 'IN',
        quantity: 50,
        reason: 'Restock',
        createdAt: new Date(),
        ...overrides,
    });

    beforeEach(async () => {
        mockInventoryModel = {
            find: jest.fn(),
        };

        mockStockModel = {
            find: jest.fn(),
            aggregate: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalyticsService,
                {
                    provide: getModelToken('Inventory'),
                    useValue: mockInventoryModel,
                },
                {
                    provide: getModelToken('StockMovement'),
                    useValue: mockStockModel,
                },
            ],
        }).compile();

        service = module.get<AnalyticsService>(AnalyticsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getDashboardStats', () => {
        it('should return comprehensive dashboard statistics', async () => {
            const mockItems = [
                createMockItem({ _id: '1', quantity: 100, category: 'Electronics' }),
                createMockItem({ _id: '2', quantity: 5, lowStockThreshold: 10, category: 'Electronics' }), // Low stock
                createMockItem({ _id: '3', quantity: 50, category: 'Clothing' }),
            ];

            const mockRecentMovements = [
                createMockMovement({ type: 'IN' }),
                createMockMovement({ _id: 'mov2', type: 'OUT' }),
            ];

            const mockWeeklyMovements = [
                createMockMovement({ type: 'IN' }),
                createMockMovement({ _id: 'mov2', type: 'IN' }),
                createMockMovement({ _id: 'mov3', type: 'OUT' }),
            ];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
            });

            // First call for recent movements
            mockStockModel.find
                .mockReturnValueOnce({
                    limit: jest.fn().mockReturnValue({
                        sort: jest.fn().mockReturnValue({
                            exec: jest.fn().mockResolvedValue(mockRecentMovements),
                        }),
                    }),
                })
                // Second call for weekly movements
                .mockReturnValueOnce({
                    exec: jest.fn().mockResolvedValue(mockWeeklyMovements),
                });

            const result = await service.getDashboardStats('test-tenant-id');

            expect(result).toHaveProperty('totalItems', 3);
            expect(result).toHaveProperty('lowStockItems', 1);
            expect(result).toHaveProperty('lowStockPercentage');
            expect(result).toHaveProperty('categoryBreakdown');
            expect(result.categoryBreakdown).toEqual({ Electronics: 2, Clothing: 1 });
            expect(result).toHaveProperty('weeklyActivity');
            expect(result.weeklyActivity.stockIn).toBe(2);
            expect(result.weeklyActivity.stockOut).toBe(1);
            expect(result).toHaveProperty('totalInventoryValue');
        });

        it('should calculate total inventory value correctly', async () => {
            const mockItems = [
                createMockItem({ quantity: 10, unitPrice: 100 }), // 1000
                createMockItem({ _id: '2', quantity: 5, unitPrice: 50 }), // 250
            ];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
            });

            mockStockModel.find
                .mockReturnValueOnce({
                    limit: jest.fn().mockReturnValue({
                        sort: jest.fn().mockReturnValue({
                            exec: jest.fn().mockResolvedValue([]),
                        }),
                    }),
                })
                .mockReturnValueOnce({
                    exec: jest.fn().mockResolvedValue([]),
                });

            const result = await service.getDashboardStats('test-tenant-id');

            expect(result.totalInventoryValue).toBe(1250);
        });

        it('should handle empty inventory', async () => {
            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue([]),
            });

            mockStockModel.find
                .mockReturnValueOnce({
                    limit: jest.fn().mockReturnValue({
                        sort: jest.fn().mockReturnValue({
                            exec: jest.fn().mockResolvedValue([]),
                        }),
                    }),
                })
                .mockReturnValueOnce({
                    exec: jest.fn().mockResolvedValue([]),
                });

            const result = await service.getDashboardStats('test-tenant-id');

            expect(result.totalItems).toBe(0);
            expect(result.lowStockItems).toBe(0);
            expect(result.lowStockPercentage).toBe(0);
            expect(result.totalInventoryValue).toBe(0);
        });
    });

    describe('getTrends', () => {
        it('should return stock movement trends', async () => {
            const mockTrends = [
                { _id: '2026-01-15', in: 100, out: 50 },
                { _id: '2026-01-16', in: 75, out: 25 },
            ];

            mockStockModel.aggregate.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockTrends),
            });

            const result = await service.getTrends('test-tenant-id', '7d');

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ date: '2026-01-15', in: 100, out: 50 });
            expect(result[1]).toEqual({ date: '2026-01-16', in: 75, out: 25 });
        });

        it('should return empty array when no movements', async () => {
            mockStockModel.aggregate.mockReturnValue({
                exec: jest.fn().mockResolvedValue([]),
            });

            const result = await service.getTrends('test-tenant-id', '7d');

            expect(result).toEqual([]);
        });
    });

    describe('getAlerts', () => {
        it('should return low stock alerts', async () => {
            const mockItems = [
                createMockItem({ _id: '1', name: 'Item 1', quantity: 5, lowStockThreshold: 10 }), // Low
                createMockItem({ _id: '2', name: 'Item 2', quantity: 100, lowStockThreshold: 10 }), // OK
                createMockItem({ _id: '3', name: 'Item 3', quantity: 0, lowStockThreshold: 5 }), // Critical
            ];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
            });

            const result = await service.getAlerts('test-tenant-id');

            expect(result.data).toHaveLength(2);
            expect(result.summary.warning).toBe(1);
            expect(result.summary.critical).toBe(1);
            expect(result.summary.info).toBe(0);
        });

        it('should mark out of stock items as critical', async () => {
            const mockItems = [
                createMockItem({ _id: '1', name: 'Out of Stock Item', quantity: 0, lowStockThreshold: 10 }),
            ];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
            });

            const result = await service.getAlerts('test-tenant-id');

            expect(result.data[0].type).toBe('critical');
            expect(result.data[0].message).toContain('out of stock');
        });

        it('should mark low stock items as warning', async () => {
            const mockItems = [
                createMockItem({ _id: '1', name: 'Low Stock Item', quantity: 5, lowStockThreshold: 10 }),
            ];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
            });

            const result = await service.getAlerts('test-tenant-id');

            expect(result.data[0].type).toBe('warning');
            expect(result.data[0].message).toContain('low on stock');
        });

        it('should return empty alerts when all items are stocked', async () => {
            const mockItems = [
                createMockItem({ quantity: 100, lowStockThreshold: 10 }),
            ];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
            });

            const result = await service.getAlerts('test-tenant-id');

            expect(result.data).toHaveLength(0);
            expect(result.summary.warning).toBe(0);
            expect(result.summary.critical).toBe(0);
        });

        it('should include itemId in alert', async () => {
            const mockItems = [
                createMockItem({ _id: 'item-123', quantity: 5, lowStockThreshold: 10 }),
            ];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
            });

            const result = await service.getAlerts('test-tenant-id');

            expect(result.data[0].itemId).toBe('item-123');
        });
    });
});
