import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService, ReportFilter } from './reports.service';
import { getModelToken } from '@nestjs/mongoose';

describe('ReportsService', () => {
    let service: ReportsService;
    let mockInventoryModel: any;
    let mockStockMovementModel: any;

    const createMockItem = (overrides = {}) => ({
        _id: '1',
        name: 'Test Item',
        quantity: 100,
        unitPrice: 10,
        lowStockThreshold: 20,
        category: 'Electronics',
        toObject: function() { return this; },
        ...overrides,
    });

    const createMockMovement = (overrides = {}) => ({
        _id: 'mov1',
        itemId: '1',
        type: 'IN',
        quantity: 50,
        reason: 'Restock',
        createdAt: new Date(),
        toObject: function() { return this; },
        ...overrides,
    });

    beforeEach(async () => {
        mockInventoryModel = {
            find: jest.fn(),
        };

        mockStockMovementModel = {
            find: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReportsService,
                {
                    provide: getModelToken('Inventory'),
                    useValue: mockInventoryModel,
                },
                {
                    provide: getModelToken('StockMovement'),
                    useValue: mockStockMovementModel,
                },
            ],
        }).compile();

        service = module.get<ReportsService>(ReportsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('generateInventoryReport', () => {
        it('should generate a comprehensive inventory report', async () => {
            const mockItems = [
                createMockItem({ _id: '1', name: 'Item 1', quantity: 100, unitPrice: 10 }),
                createMockItem({ _id: '2', name: 'Item 2', quantity: 5, unitPrice: 20, lowStockThreshold: 10, category: 'Category B' }),
            ];

            const mockMovements = [createMockMovement()];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
            });

            mockStockMovementModel.find.mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockMovements),
            });

            const result = await service.generateInventoryReport({});

            expect(result).toHaveProperty('items');
            expect(result).toHaveProperty('summary');
            expect(result).toHaveProperty('movements');
            expect(result.summary.totalItems).toBe(2);
            expect(result.summary.lowStockItems).toBe(1); // Item 2 is below threshold
            expect(result.summary.totalValue).toBe(1100); // (100*10) + (5*20)
        });

        it('should filter by category', async () => {
            const mockItems = [
                createMockItem({ category: 'Electronics' }),
            ];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
            });

            mockStockMovementModel.find.mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([]),
            });

            const filter: ReportFilter = { category: 'Electronics' };
            await service.generateInventoryReport(filter);

            expect(mockInventoryModel.find).toHaveBeenCalledWith(
                expect.objectContaining({ category: 'Electronics' })
            );
        });

        it('should filter low stock items only', async () => {
            const mockItems = [
                createMockItem({ quantity: 5, lowStockThreshold: 10 }), // Low stock
            ];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
            });

            mockStockMovementModel.find.mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([]),
            });

            const filter: ReportFilter = { lowStockOnly: true };
            await service.generateInventoryReport(filter);

            expect(mockInventoryModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
                })
            );
        });

        it('should filter movements by date range', async () => {
            const startDate = new Date('2026-01-01');
            const endDate = new Date('2026-01-31');

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue([]),
            });

            mockStockMovementModel.find.mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([]),
            });

            const filter: ReportFilter = { startDate, endDate };
            await service.generateInventoryReport(filter);

            expect(mockStockMovementModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    createdAt: { $gte: startDate, $lte: endDate }
                })
            );
        });

        it('should calculate out of stock items correctly', async () => {
            const mockItems = [
                createMockItem({ quantity: 0, unitPrice: 10 }), // Out of stock
                createMockItem({ _id: '2', quantity: 50, unitPrice: 10 }),
            ];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
            });

            mockStockMovementModel.find.mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([]),
            });

            const result = await service.generateInventoryReport({});

            expect(result.summary.outOfStockItems).toBe(1);
        });

        it('should count unique categories', async () => {
            const mockItems = [
                createMockItem({ category: 'Electronics' }),
                createMockItem({ _id: '2', category: 'Electronics' }),
                createMockItem({ _id: '3', category: 'Clothing' }),
            ];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
            });

            mockStockMovementModel.find.mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([]),
            });

            const result = await service.generateInventoryReport({});

            expect(result.summary.categories).toBe(2);
        });
    });
});
