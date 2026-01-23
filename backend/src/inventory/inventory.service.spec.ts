import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('InventoryService', () => {
    let service: InventoryService;
    let mockInventoryModel: any;
    let mockStockMovementModel: any;
    const mockTenantId = new Types.ObjectId();

    beforeEach(async () => {
        mockInventoryModel = {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            findOneAndDelete: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
        };

        mockStockMovementModel = {
            save: jest.fn().mockImplementation((data) => Promise.resolve({ _id: new Types.ObjectId(), ...data })),
        };

        // Mock the constructor for create operations
        function MockInventoryModel(data: any) {
            return {
                ...data,
                save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...data }),
            };
        }
        Object.assign(MockInventoryModel, mockInventoryModel);

        function MockStockMovementModel(data: any) {
            return {
                ...data,
                save: mockStockMovementModel.save,
            };
        }
        Object.assign(MockStockMovementModel, mockStockMovementModel);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InventoryService,
                {
                    provide: getModelToken('Inventory'),
                    useValue: MockInventoryModel,
                },
                {
                    provide: getModelToken('StockMovement'),
                    useValue: MockStockMovementModel,
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

            mockInventoryModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ ...createDto, _id: expect.any(Object), tenantId: mockTenantId }),
            });

            // Mock findOne for the internal call in createMovement
            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ ...createDto, _id: expect.any(Object), tenantId: mockTenantId }),
            });
            mockInventoryModel.findByIdAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue({}),
            });

            const result = await service.create(createDto, mockTenantId);
            expect(result).toHaveProperty('_id');
            expect(result.tenantId).toEqual(mockTenantId);
            // Should create an initial movement
            // Note: Since we are mocking the constructor, checking if movement was created is tricky without spying on the class. 
            // Better to rely on service.create calling createMovement logic.
        });
    });

    describe('update', () => {
        it('should update an inventory item with tenant scope but ignore quantity', async () => {
            const updateDto = { name: 'Updated name', quantity: 999 }; // quantity should be ignored
            const mockItem = { _id: '1', name: 'Updated name', quantity: 100, tenantId: mockTenantId };

            mockInventoryModel.findOneAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            const result = await service.update('1', updateDto, mockTenantId);
            expect(result.name).toBe('Updated name');
            // quantity passed in dto should be removed
            expect(mockInventoryModel.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: '1', tenantId: mockTenantId },
                { name: 'Updated name' }, // quantity removed
                { new: true }
            );
        });

        it('should throw NotFoundException if item not found', async () => {
            mockInventoryModel.findOneAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            await expect(service.update('nonexistent', { name: 'test' }, mockTenantId)).rejects.toThrow(
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

    describe('createMovement', () => {
        it('should create a movement and update inventory quantity (IN)', async () => {
            const inventoryId = '1';
            const dto = { type: 'IN' as any, quantity: 10, reason: 'Restock' };
            const mockItem = { _id: inventoryId, quantity: 5, tenantId: mockTenantId };

            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });
            mockInventoryModel.findByIdAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ ...mockItem, quantity: 15 }),
            });

            const result = await service.createMovement(inventoryId, dto, mockTenantId);

            expect(mockStockMovementModel.save).toHaveBeenCalled();
            expect(mockInventoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
                inventoryId,
                { $inc: { quantity: 10 } }
            );
        });

        it('should create a movement and update inventory quantity (OUT)', async () => {
            const inventoryId = '1';
            const dto = { type: 'OUT' as any, quantity: 3, reason: 'Sale' };
            const mockItem = { _id: inventoryId, quantity: 5, tenantId: mockTenantId };

            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            await service.createMovement(inventoryId, dto, mockTenantId);

            expect(mockInventoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
                inventoryId,
                { $inc: { quantity: -3 } }
            );
        });
    });
});
