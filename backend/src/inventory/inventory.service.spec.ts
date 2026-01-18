import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';

describe('InventoryService', () => {
    let service: InventoryService;
    let mockInventoryModel: any;

    beforeEach(async () => {
        mockInventoryModel = {
            find: jest.fn(),
            findById: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InventoryService,
                {
                    provide: getModelToken('Inventory'),
                    useValue: mockInventoryModel,
                },
            ],
        }).compile();

        service = module.get<InventoryService>(InventoryService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an array of inventory items', async () => {
            const mockItems = [
                { _id: '1', name: 'Item 1', sku: 'SKU001', quantity: 100 },
                { _id: '2', name: 'Item 2', sku: 'SKU002', quantity: 50 },
            ];

            mockInventoryModel.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(mockItems),
                }),
            });

            const result = await service.findAll();
            expect(result).toEqual(mockItems);
            expect(mockInventoryModel.find).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return a single inventory item', async () => {
            const mockItem = { _id: '1', name: 'Item 1', sku: 'SKU001', quantity: 100 };

            mockInventoryModel.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(mockItem),
                }),
            });

            const result = await service.findOne('1');
            expect(result).toEqual(mockItem);
        });

        it('should throw NotFoundException if item not found', async () => {
            mockInventoryModel.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(null),
                }),
            });

            await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create a new inventory item', async () => {
            const createDto = {
                name: 'New Item',
                sku: 'SKU003',
                quantity: 200,
                unitPrice: 10.5,
                category: 'Electronics',
            };

            const mockItem = { _id: '3', ...createDto, save: jest.fn().mockResolvedValue(true) };
            mockInventoryModel.create = jest.fn().mockReturnValue(mockItem);

            const result = await service.create(createDto);
            expect(result).toHaveProperty('_id');
            expect(result.name).toBe(createDto.name);
        });
    });

    describe('update', () => {
        it('should update an inventory item', async () => {
            const updateDto = { quantity: 150 };
            const mockItem = { _id: '1', name: 'Item 1', ...updateDto };

            mockInventoryModel.findByIdAndUpdate.mockResolvedValue(mockItem);

            const result = await service.update('1', updateDto);
            expect(result.quantity).toBe(150);
        });

        it('should throw NotFoundException if item not found', async () => {
            mockInventoryModel.findByIdAndUpdate.mockResolvedValue(null);

            await expect(service.update('nonexistent', { quantity: 10 })).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('delete', () => {
        it('should delete an inventory item', async () => {
            const mockItem = { _id: '1', name: 'Item 1' };
            mockInventoryModel.findByIdAndDelete.mockResolvedValue(mockItem);

            await service.delete('1');
            expect(mockInventoryModel.findByIdAndDelete).toHaveBeenCalledWith('1');
        });

        it('should throw NotFoundException if item not found', async () => {
            mockInventoryModel.findByIdAndDelete.mockResolvedValue(null);

            await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
        });
    });
});
