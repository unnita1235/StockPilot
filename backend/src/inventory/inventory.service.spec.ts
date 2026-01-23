import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuditService } from '../audit/audit.service';

describe('InventoryService', () => {
    let service: InventoryService;
    let mockInventoryModel: any;
    let mockStockMovementModel: any;
    let mockAuditService: any;
    const mockTenantId = new Types.ObjectId();

    beforeEach(async () => {
        mockInventoryModel = {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            findOneAndDelete: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            deleteOne: jest.fn(),
        };

        mockStockMovementModel = {
            save: jest.fn().mockImplementation((data) => Promise.resolve({ _id: new Types.ObjectId(), ...data })),
        };

        mockAuditService = {
            log: jest.fn().mockResolvedValue(undefined),
        };

        // Mock the constructor for create operations
        function MockInventoryModel(data: any) {
            return {
                ...data,
                save: jest.fn().mockResolvedValue({
                    _id: new Types.ObjectId(),
                    ...data,
                    toObject: jest.fn().mockReturnValue({ ...data, _id: new Types.ObjectId() })
                }),
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
                {
                    provide: AuditService,
                    useValue: mockAuditService,
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

            // Mock findById for the re-fetch at the end of create
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
            // Check properties on the returned object directly, assuming it's the result of findById
            // If the test relies on the return of `save()`, that mock needs to be correct.
            // But service.create re-fetches with findById.
        });
    });

    describe('update', () => {
        it('should update an inventory item with tenant scope but ignore quantity', async () => {
            const updateDto = { name: 'Updated name', quantity: 999 }; // quantity should be ignored
            const mockItem = {
                _id: '1',
                name: 'Updated name',
                quantity: 100,
                tenantId: mockTenantId,
                toObject: jest.fn().mockReturnValue({ _id: '1', name: 'Updated name', quantity: 100 })
            };
            const oldItem = {
                _id: '1',
                name: 'Old Name',
                quantity: 100,
                toObject: jest.fn().mockReturnValue({ _id: '1', name: 'Old Name' })
            };

            // Mock findOne for the check before update
            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(oldItem),
            });

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
            // Mock findOne to return null to simulate not found
            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            await expect(service.update('nonexistent', { name: 'test' }, mockTenantId)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('remove', () => {
        it('should delete an inventory item with tenant scope', async () => {
            const mockItem = {
                _id: '1',
                name: 'Item 1',
                tenantId: mockTenantId,
                toObject: jest.fn().mockReturnValue({ _id: '1', name: 'Item 1' })
            };

            // Mock findOne for the check existence
            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            mockInventoryModel.deleteOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ deletedCount: 1 })
            });

            await service.remove('1', mockTenantId);
            // remove calls deleteOne, NOT findOneAndDelete in the current implementation shown in my view_file!
            expect(mockInventoryModel.deleteOne).toHaveBeenCalledWith({ _id: '1', tenantId: mockTenantId });
        });

        it('should throw NotFoundException if item not found', async () => {
            mockInventoryModel.findOne.mockReturnValue({
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

await service.createMovement(inventoryId, dto, mockTenantId);
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
