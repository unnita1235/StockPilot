import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { getModelToken } from '@nestjs/mongoose';

describe('ReportsService', () => {
    let service: ReportsService;
    let mockInventoryModel: any;
    let mockStockMovementModel: any;

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
                {
                    _id: '1',
                    name: 'Item 1',
                    quantity: 100,
                    unitPrice: 10,
                    lowStockThreshold: 20,
                    category: 'Category A',
                    toObject: jest.fn().mockReturnThis(),
                },
                {
                    _id: '2',
                    name: 'Item 2',
                    quantity: 5,
                    unitPrice: 20,
                    lowStockThreshold: 10,
                    category: 'Category B',
                    toObject: jest.fn().mockReturnThis(),
                },
            ];

            const mockMovements = [
                {
                    _id: 'mov1',
                    type: 'add',
                    quantity: 50,
                    timestamp: new Date(),
                    toObject: jest.fn().mockReturnThis(),
                },
            ];

            mockInventoryModel.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(mockItems),
                }),
            });

            mockStockMovementModel.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockMovements),
            });

            const result = await service.generateInventoryReport({});

            expect(result).toHaveProperty('items');
            expect(result).toHaveProperty('summary');
            expect(result.summary.totalItems).toBe(2);
            expect(result.summary.lowStockItems).toBe(1);
            expect(result.summary.totalValue).toBe(1100);
        });
    });
});
