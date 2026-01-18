import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { getModelToken } from '@nestjs/mongoose';
import { Inventory } from './inventory.schema';

const mockInventoryItem = {
    _id: 'someid',
    name: 'Test Item',
    quantity: 10,
    location: 'A1',
    threshold: 5,
};

const mockInventoryModel = {
    new: jest.fn().mockResolvedValue(mockInventoryItem),
    constructor: jest.fn().mockResolvedValue(mockInventoryItem),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    exec: jest.fn(),
};

describe('InventoryService', () => {
    let service: InventoryService;

    beforeEach(async () => {
        const testModule: TestingModule = await Test.createTestingModule({
            providers: [
                InventoryService,
                {
                    provide: getModelToken(Inventory.name),
                    useValue: mockInventoryModel,
                },
            ],
        }).compile();

        service = testModule.get<InventoryService>(InventoryService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // Add more tests here...
});
