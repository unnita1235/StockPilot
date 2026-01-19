import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('InventoryService', () => {
    let service: InventoryService;
    let mockInventoryModel: any;
    const mockTenantId = new Types.ObjectId();

    beforeEach(async () => {
        mockInventoryModel = {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            findOneAndDelete: jest.fn(),
        };

        // Mock the constructor for create operations
        function MockModel(data: any) {
            return {
                ...data,
                save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...data }),
            };
        }
        Object.assign(MockModel, mockInventoryModel);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InventoryService,
                {
                    provide: getModelToken('Inventory'),
                    useValue: MockModel,
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
                { _id: '1', name: 'Item 1', quantity: 100, tenantId: mockTenantId },
                { _id: '2', name: 'Item 2', quantity: 50, tenantId: mockTenantId },
            ];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
            });

            const result = await service.findAll(mockTenantId);
            expect(result).toEqual(mockItems);
            expect(mockInventoryModel.find).toHaveBeenCalledWith({ tenantId: mockTenantId });
        });

        it('should return all items when no tenantId provided', async () => {
            const mockItems = [{ _id: '1', name: 'Item 1', quantity: 100 }];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
            });

            const result = await service.findAll();
            expect(result).toEqual(mockItems);
            expect(mockInventoryModel.find).toHaveBeenCalledWith({});
        });
    });

    describe('findOne', () => {
        it('should return a single inventory item with tenant scope', async () => {
            const mockItem = { _id: '1', name: 'Item 1', quantity: 100, tenantId: mockTenantId };

            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            const result = await service.findOne('1', mockTenantId);
            expect(result).toEqual(mockItem);
            expect(mockInventoryModel.findOne).toHaveBeenCalledWith({ _id: '1', tenantId: mockTenantId });
        });

        it('should throw NotFoundException if item not found', async () => {
            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            await expect(service.findOne('nonexistent', mockTenantId)).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create a new inventory item with tenantId', async () => {
            const createDto = {
                name: 'New Item',
                quantity: 200,
                unitPrice: 10.5,
                category: 'Electronics',
            };

            const result = await service.create(createDto, mockTenantId);
            expect(result).toHaveProperty('_id');
            expect(result.name).toBe(createDto.name);
            expect(result.tenantId).toEqual(mockTenantId);
        });
    });

    describe('update', () => {
        it('should update an inventory item with tenant scope', async () => {
            const updateDto = { quantity: 150 };
            const mockItem = { _id: '1', name: 'Item 1', ...updateDto, tenantId: mockTenantId };

            mockInventoryModel.findOneAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            const result = await service.update('1', updateDto, mockTenantId);
            expect(result.quantity).toBe(150);
            expect(mockInventoryModel.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: '1', tenantId: mockTenantId },
                updateDto,
                { new: true }
            );
        });

        it('should throw NotFoundException if item not found', async () => {
            mockInventoryModel.findOneAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            await expect(service.update('nonexistent', { quantity: 10 }, mockTenantId)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('remove', () => {
        it('should delete an inventory item with tenant scope', async () => {
            const mockItem = { _id: '1', name: 'Item 1', tenantId: mockTenantId };
            mockInventoryModel.findOneAndDelete.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            await service.remove('1', mockTenantId);
            expect(mockInventoryModel.findOneAndDelete).toHaveBeenCalledWith({ _id: '1', tenantId: mockTenantId });
        });

        it('should throw NotFoundException if item not found', async () => {
            mockInventoryModel.findOneAndDelete.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            await expect(service.remove('nonexistent', mockTenantId)).rejects.toThrow(NotFoundException);
        });
    });

    describe('getLowStockItems', () => {
        it('should return low stock items with tenant scope', async () => {
            const mockItems = [
                { _id: '1', name: 'Low Item', quantity: 2, lowStockThreshold: 5, tenantId: mockTenantId },
            ];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
            });

            const result = await service.getLowStockItems(mockTenantId);
            expect(result).toEqual(mockItems);
        });
    });
});
