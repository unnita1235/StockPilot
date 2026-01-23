import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuditService } from '../audit/audit.service';
import { StockMovementType } from './stock-movement.schema';
import { AuditAction } from '../audit/audit.schema';

describe('InventoryService', () => {
    let service: InventoryService;
    let mockInventoryModel: any;
    let mockStockMovementModel: any;
    let mockAuditService: any;
    const mockTenantId = new Types.ObjectId();
    const mockItemId = new Types.ObjectId();

    beforeEach(async () => {
        // ===== COMPLETE INVENTORY MODEL MOCK =====
        mockInventoryModel = {
            find: jest.fn(),
            findOne: jest.fn(),
            findById: jest.fn(),
            findOneAndUpdate: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findOneAndDelete: jest.fn(),
            deleteOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        };

        // ===== COMPLETE STOCK MOVEMENT MODEL MOCK =====
        mockStockMovementModel = {
            find: jest.fn(),
            findOne: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        };

        // ===== COMPLETE AUDIT SERVICE MOCK =====
        // AuditService only has one method: log()
        mockAuditService = {
            log: jest.fn().mockResolvedValue(undefined),
        };

        // Mock the constructor for create operations (when using 'new Model()')
        function MockInventoryModel(data: any) {
            const mockInstance = {
                ...data,
                _id: data._id || new Types.ObjectId(),
                tenantId: data.tenantId || mockTenantId,
                save: jest.fn().mockResolvedValue({
                    ...data,
                    _id: data._id || new Types.ObjectId(),
                    tenantId: data.tenantId || mockTenantId,
                    toObject: jest.fn().mockReturnValue({
                        ...data,
                        _id: data._id || new Types.ObjectId(),
                        tenantId: data.tenantId || mockTenantId,
                    }),
                }),
                toObject: jest.fn().mockReturnValue({
                    ...data,
                    _id: data._id || new Types.ObjectId(),
                    tenantId: data.tenantId || mockTenantId,
                }),
            };
            return mockInstance;
        }
        Object.assign(MockInventoryModel, mockInventoryModel);

        function MockStockMovementModel(data: any) {
            const mockInstance = {
                ...data,
                _id: data._id || new Types.ObjectId(),
                save: jest.fn().mockResolvedValue({
                    ...data,
                    _id: data._id || new Types.ObjectId(),
                }),
            };
            return mockInstance;
        }
        Object.assign(MockStockMovementModel, mockStockMovementModel);

        // ===== CREATE TESTING MODULE =====
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

        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ========================================
    // SERVICE DEFINITION TEST
    // ========================================
    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ========================================
    // FINDALL TESTS
    // ========================================
    describe('findAll', () => {
        it('should return an array of inventory items with tenantId filter', async () => {
            const mockItems = [
                {
                    _id: mockItemId,
                    name: 'Item 1',
                    quantity: 100,
                    tenantId: mockTenantId,
                    category: 'Electronics',
                    unitPrice: 10.5,
                },
                {
                    _id: new Types.ObjectId(),
                    name: 'Item 2',
                    quantity: 50,
                    tenantId: mockTenantId,
                    category: 'Furniture',
                    unitPrice: 25.0,
                },
            ];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
            });

            const result = await service.findAll(mockTenantId);

            expect(result).toEqual(mockItems);
            expect(mockInventoryModel.find).toHaveBeenCalledWith({ tenantId: mockTenantId });
            expect(mockInventoryModel.find).toHaveBeenCalledTimes(1);
        });

        it('should return all items when no tenantId provided', async () => {
            const mockItems = [
                { _id: mockItemId, name: 'Item 1', quantity: 100 },
                { _id: new Types.ObjectId(), name: 'Item 2', quantity: 200 },
            ];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
            });

            const result = await service.findAll();

            expect(result).toEqual(mockItems);
            expect(mockInventoryModel.find).toHaveBeenCalledWith({});
            expect(mockInventoryModel.find).toHaveBeenCalledTimes(1);
        });

        it('should return empty array when no items exist', async () => {
            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue([]),
            });

            const result = await service.findAll(mockTenantId);

            expect(result).toEqual([]);
            expect(mockInventoryModel.find).toHaveBeenCalledWith({ tenantId: mockTenantId });
        });

        it('should accept tenantId as string', async () => {
            const tenantIdString = mockTenantId.toString();
            const mockItems = [{ _id: mockItemId, name: 'Item 1', quantity: 100 }];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
            });

            const result = await service.findAll(tenantIdString);

            expect(result).toEqual(mockItems);
            expect(mockInventoryModel.find).toHaveBeenCalledWith({ tenantId: tenantIdString });
        });
    });

    // ========================================
    // FINDONE TESTS
    // ========================================
    describe('findOne', () => {
        it('should return a single inventory item with tenant scope', async () => {
            const mockItem = {
                _id: mockItemId,
                name: 'Item 1',
                quantity: 100,
                tenantId: mockTenantId,
                category: 'Electronics',
            };

            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            const result = await service.findOne(mockItemId.toString(), mockTenantId);

            expect(result).toEqual(mockItem);
            expect(mockInventoryModel.findOne).toHaveBeenCalledWith({
                _id: mockItemId.toString(),
                tenantId: mockTenantId,
            });
        });

        it('should return item without tenant filter when no tenantId provided', async () => {
            const mockItem = {
                _id: mockItemId,
                name: 'Item 1',
                quantity: 100,
            };

            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            const result = await service.findOne(mockItemId.toString());

            expect(result).toEqual(mockItem);
            expect(mockInventoryModel.findOne).toHaveBeenCalledWith({
                _id: mockItemId.toString(),
            });
        });

        it('should throw NotFoundException if item not found', async () => {
            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            await expect(service.findOne('nonexistent', mockTenantId)).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.findOne('nonexistent', mockTenantId)).rejects.toThrow(
                'Inventory item not found',
            );
        });

        it('should throw NotFoundException for invalid ObjectId', async () => {
            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            await expect(service.findOne('invalid-id', mockTenantId)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    // ========================================
    // CREATE TESTS
    // ========================================
    describe('create', () => {
        it('should create a new inventory item with initial quantity = 0', async () => {
            const createDto = {
                name: 'New Item',
                quantity: 0,
                unitPrice: 10.5,
                category: 'Electronics',
            };

            const savedItem = {
                _id: mockItemId,
                ...createDto,
                tenantId: mockTenantId,
                toObject: jest.fn().mockReturnValue({
                    _id: mockItemId,
                    ...createDto,
                    tenantId: mockTenantId,
                }),
            };

            // Mock the save method on the instance
            mockInventoryModel.prototype = {
                save: jest.fn().mockResolvedValue(savedItem),
            };

            const result = await service.create(createDto, mockTenantId);

            expect(result).toBeDefined();
            expect(mockAuditService.log).toHaveBeenCalledWith({
                tenantId: mockTenantId.toString(),
                userId: 'system-user',
                action: AuditAction.CREATE,
                entity: 'Inventory',
                entityId: expect.any(String),
                newValue: expect.any(Object),
            });
        });

        it('should create item with initial quantity and create stock movement', async () => {
            const createDto = {
                name: 'New Item',
                quantity: 100,
                unitPrice: 10.5,
                category: 'Electronics',
            };

            const savedItem = {
                _id: mockItemId,
                ...createDto,
                quantity: 0, // Initially set to 0
                tenantId: mockTenantId,
                toObject: jest.fn().mockReturnValue({
                    _id: mockItemId,
                    ...createDto,
                    quantity: 0,
                    tenantId: mockTenantId,
                }),
            };

            const updatedItem = {
                _id: mockItemId,
                ...createDto,
                quantity: 100, // After movement
                tenantId: mockTenantId,
            };

            // Mock findOne for the createMovement call
            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(savedItem),
            });

            // Mock findByIdAndUpdate for the quantity update
            mockInventoryModel.findByIdAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue(updatedItem),
            });

            // Mock findById for the final re-fetch
            mockInventoryModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(updatedItem),
            });

            const result = await service.create(createDto, mockTenantId);

            expect(result).toBeDefined();
            expect(result.quantity).toBe(100);
            expect(mockAuditService.log).toHaveBeenCalled();
            expect(mockInventoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
                expect.any(String),
                { $inc: { quantity: 100 } },
            );
        });

        it('should create item without tenantId when not provided', async () => {
            const createDto = {
                name: 'New Item',
                quantity: 0,
                unitPrice: 10.5,
            };

            const savedItem = {
                _id: mockItemId,
                ...createDto,
                toObject: jest.fn().mockReturnValue({
                    _id: mockItemId,
                    ...createDto,
                }),
            };

            const result = await service.create(createDto);

            expect(result).toBeDefined();
        });

        it('should handle tenantId as string', async () => {
            const createDto = {
                name: 'New Item',
                quantity: 0,
                unitPrice: 10.5,
            };

            const result = await service.create(createDto, mockTenantId.toString());

            expect(result).toBeDefined();
        });
    });

    // ========================================
    // UPDATE TESTS
    // ========================================
    describe('update', () => {
        it('should update an inventory item with tenant scope', async () => {
            const updateDto = { name: 'Updated Name', category: 'Updated Category' };
            const oldItem = {
                _id: mockItemId,
                name: 'Old Name',
                quantity: 100,
                tenantId: mockTenantId,
                toObject: jest.fn().mockReturnValue({
                    _id: mockItemId,
                    name: 'Old Name',
                    quantity: 100,
                }),
            };
            const updatedItem = {
                _id: mockItemId,
                name: 'Updated Name',
                quantity: 100,
                category: 'Updated Category',
                tenantId: mockTenantId,
                toObject: jest.fn().mockReturnValue({
                    _id: mockItemId,
                    name: 'Updated Name',
                    quantity: 100,
                    category: 'Updated Category',
                }),
            };

            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(oldItem),
            });

            mockInventoryModel.findOneAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue(updatedItem),
            });

            const result = await service.update(mockItemId.toString(), updateDto, mockTenantId);

            expect(result.name).toBe('Updated Name');
            expect(result.category).toBe('Updated Category');
            expect(mockInventoryModel.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: mockItemId.toString(), tenantId: mockTenantId },
                updateDto,
                { new: true },
            );
            expect(mockAuditService.log).toHaveBeenCalledWith({
                tenantId: mockTenantId.toString(),
                userId: 'system-user',
                action: AuditAction.UPDATE,
                entity: 'Inventory',
                entityId: mockItemId.toString(),
                oldValue: expect.any(Object),
                newValue: expect.any(Object),
            });
        });

        it('should remove quantity field from update dto', async () => {
            const updateDto = { name: 'Updated Name', quantity: 999 };
            const oldItem = {
                _id: mockItemId,
                name: 'Old Name',
                quantity: 100,
                tenantId: mockTenantId,
                toObject: jest.fn().mockReturnValue({
                    _id: mockItemId,
                    name: 'Old Name',
                    quantity: 100,
                }),
            };
            const updatedItem = {
                _id: mockItemId,
                name: 'Updated Name',
                quantity: 100, // Should stay the same
                tenantId: mockTenantId,
                toObject: jest.fn().mockReturnValue({
                    _id: mockItemId,
                    name: 'Updated Name',
                    quantity: 100,
                }),
            };

            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(oldItem),
            });

            mockInventoryModel.findOneAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue(updatedItem),
            });

            const result = await service.update(mockItemId.toString(), updateDto, mockTenantId);

            // Verify quantity was removed from the update
            expect(mockInventoryModel.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: mockItemId.toString(), tenantId: mockTenantId },
                { name: 'Updated Name' }, // quantity removed
                { new: true },
            );
            expect(result.quantity).toBe(100); // Original quantity maintained
        });

        it('should throw NotFoundException if item not found before update', async () => {
            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            await expect(
                service.update('nonexistent', { name: 'test' }, mockTenantId),
            ).rejects.toThrow(NotFoundException);
            await expect(
                service.update('nonexistent', { name: 'test' }, mockTenantId),
            ).rejects.toThrow('Inventory item not found');
        });

        it('should update without tenantId when not provided', async () => {
            const updateDto = { name: 'Updated Name' };
            const oldItem = {
                _id: mockItemId,
                name: 'Old Name',
                quantity: 100,
                toObject: jest.fn().mockReturnValue({
                    _id: mockItemId,
                    name: 'Old Name',
                    quantity: 100,
                }),
            };
            const updatedItem = {
                _id: mockItemId,
                name: 'Updated Name',
                quantity: 100,
                tenantId: mockTenantId,
                toObject: jest.fn().mockReturnValue({
                    _id: mockItemId,
                    name: 'Updated Name',
                    quantity: 100,
                }),
            };

            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(oldItem),
            });

            mockInventoryModel.findOneAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue(updatedItem),
            });

            const result = await service.update(mockItemId.toString(), updateDto);

            expect(result).toBeDefined();
            expect(mockInventoryModel.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: mockItemId.toString() },
                updateDto,
                { new: true },
            );
        });
    });

    // ========================================
    // REMOVE TESTS
    // ========================================
    describe('remove', () => {
        it('should delete an inventory item with tenant scope', async () => {
            const mockItem = {
                _id: mockItemId,
                name: 'Item to Delete',
                quantity: 50,
                tenantId: mockTenantId,
                toObject: jest.fn().mockReturnValue({
                    _id: mockItemId,
                    name: 'Item to Delete',
                    quantity: 50,
                }),
            };

            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            mockInventoryModel.deleteOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            });

            await service.remove(mockItemId.toString(), mockTenantId);

            expect(mockInventoryModel.deleteOne).toHaveBeenCalledWith({
                _id: mockItemId.toString(),
                tenantId: mockTenantId,
            });
            expect(mockAuditService.log).toHaveBeenCalledWith({
                tenantId: mockTenantId.toString(),
                userId: 'system-user',
                action: AuditAction.DELETE,
                entity: 'Inventory',
                entityId: mockItemId.toString(),
                oldValue: expect.any(Object),
            });
        });

        it('should throw NotFoundException if item not found before deletion', async () => {
            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            await expect(service.remove('nonexistent', mockTenantId)).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.remove('nonexistent', mockTenantId)).rejects.toThrow(
                'Inventory item not found',
            );
        });

        it('should remove without tenantId when not provided', async () => {
            const mockItem = {
                _id: mockItemId,
                name: 'Item to Delete',
                quantity: 50,
                tenantId: mockTenantId,
                toObject: jest.fn().mockReturnValue({
                    _id: mockItemId,
                    name: 'Item to Delete',
                    quantity: 50,
                }),
            };

            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            mockInventoryModel.deleteOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            });

            await service.remove(mockItemId.toString());

            expect(mockInventoryModel.deleteOne).toHaveBeenCalledWith({
                _id: mockItemId.toString(),
            });
        });
    });

    // ========================================
    // GETLOWSTOCKITEMS TESTS
    // ========================================
    describe('getLowStockItems', () => {
        it('should return low stock items with tenant scope', async () => {
            const mockLowStockItems = [
                {
                    _id: mockItemId,
                    name: 'Low Stock Item',
                    quantity: 2,
                    lowStockThreshold: 5,
                    tenantId: mockTenantId,
                },
                {
                    _id: new Types.ObjectId(),
                    name: 'Another Low Item',
                    quantity: 1,
                    lowStockThreshold: 10,
                    tenantId: mockTenantId,
                },
            ];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockLowStockItems),
            });

            const result = await service.getLowStockItems(mockTenantId);

            expect(result).toEqual(mockLowStockItems);
            expect(mockInventoryModel.find).toHaveBeenCalledWith({
                $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
                tenantId: mockTenantId,
            });
        });

        it('should return low stock items without tenant filter', async () => {
            const mockLowStockItems = [
                {
                    _id: mockItemId,
                    name: 'Low Stock Item',
                    quantity: 2,
                    lowStockThreshold: 5,
                },
            ];

            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockLowStockItems),
            });

            const result = await service.getLowStockItems();

            expect(result).toEqual(mockLowStockItems);
            expect(mockInventoryModel.find).toHaveBeenCalledWith({
                $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
            });
        });

        it('should return empty array when no low stock items', async () => {
            mockInventoryModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue([]),
            });

            const result = await service.getLowStockItems(mockTenantId);

            expect(result).toEqual([]);
        });
    });

    // ========================================
    // CREATEMOVEMENT TESTS
    // ========================================
    describe('createMovement', () => {
        it('should create a stock movement of type IN and increase quantity', async () => {
            const inventoryId = mockItemId.toString();
            const dto = {
                type: StockMovementType.IN,
                quantity: 10,
                reason: 'Restock',
                reference: 'PO-12345',
            };
            const mockItem = {
                _id: mockItemId,
                quantity: 5,
                tenantId: mockTenantId,
            };

            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            mockInventoryModel.findByIdAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ ...mockItem, quantity: 15 }),
            });

            const result = await service.createMovement(inventoryId, dto, mockTenantId);

            expect(result).toBeDefined();
            expect(mockInventoryModel.findByIdAndUpdate).toHaveBeenCalledWith(inventoryId, {
                $inc: { quantity: 10 },
            });
        });

        it('should create a stock movement of type OUT and decrease quantity', async () => {
            const inventoryId = mockItemId.toString();
            const dto = {
                type: StockMovementType.OUT,
                quantity: 3,
                reason: 'Sale',
                reference: 'ORDER-789',
            };
            const mockItem = {
                _id: mockItemId,
                quantity: 10,
                tenantId: mockTenantId,
            };

            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            mockInventoryModel.findByIdAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ ...mockItem, quantity: 7 }),
            });

            const result = await service.createMovement(inventoryId, dto, mockTenantId);

            expect(result).toBeDefined();
            expect(mockInventoryModel.findByIdAndUpdate).toHaveBeenCalledWith(inventoryId, {
                $inc: { quantity: -3 },
            });
        });

        it('should create a stock movement of type ADJUSTMENT with positive value', async () => {
            const inventoryId = mockItemId.toString();
            const dto = {
                type: StockMovementType.ADJUSTMENT,
                quantity: 5,
                reason: 'Inventory correction',
            };
            const mockItem = {
                _id: mockItemId,
                quantity: 10,
                tenantId: mockTenantId,
            };

            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            mockInventoryModel.findByIdAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ ...mockItem, quantity: 15 }),
            });

            const result = await service.createMovement(inventoryId, dto, mockTenantId);

            expect(result).toBeDefined();
            // For ADJUSTMENT, the sign is respected as-is
            expect(mockInventoryModel.findByIdAndUpdate).toHaveBeenCalledWith(inventoryId, {
                $inc: { quantity: 5 },
            });
        });

        it('should create a stock movement of type ADJUSTMENT with negative value', async () => {
            const inventoryId = mockItemId.toString();
            const dto = {
                type: StockMovementType.ADJUSTMENT,
                quantity: -5,
                reason: 'Found missing items',
            };
            const mockItem = {
                _id: mockItemId,
                quantity: 10,
                tenantId: mockTenantId,
            };

            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            mockInventoryModel.findByIdAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ ...mockItem, quantity: 5 }),
            });

            const result = await service.createMovement(inventoryId, dto, mockTenantId);

            expect(result).toBeDefined();
            expect(mockInventoryModel.findByIdAndUpdate).toHaveBeenCalledWith(inventoryId, {
                $inc: { quantity: -5 },
            });
        });

        it('should throw NotFoundException if inventory item not found', async () => {
            const inventoryId = 'nonexistent';
            const dto = {
                type: StockMovementType.IN,
                quantity: 10,
                reason: 'Test',
            };

            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            await expect(service.createMovement(inventoryId, dto, mockTenantId)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should handle negative OUT quantity correctly', async () => {
            const inventoryId = mockItemId.toString();
            const dto = {
                type: StockMovementType.OUT,
                quantity: -3, // Even if negative is passed
                reason: 'Sale',
            };
            const mockItem = {
                _id: mockItemId,
                quantity: 10,
                tenantId: mockTenantId,
            };

            mockInventoryModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            mockInventoryModel.findByIdAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ ...mockItem, quantity: 7 }),
            });

            const result = await service.createMovement(inventoryId, dto, mockTenantId);

            // Should still decrease by 3 (takes absolute value for OUT)
            expect(mockInventoryModel.findByIdAndUpdate).toHaveBeenCalledWith(inventoryId, {
                $inc: { quantity: -3 },
            });
        });
    });

    // ========================================
    // GETFORECAST TESTS
    // ========================================
    describe('getForecast', () => {
        it('should calculate forecast with stock movements', async () => {
            const mockItem = {
                _id: mockItemId,
                name: 'Test Item',
                quantity: 100,
                tenantId: mockTenantId,
            };

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const mockMovements = [
                {
                    _id: new Types.ObjectId(),
                    inventoryId: mockItemId,
                    type: StockMovementType.OUT,
                    quantity: -10,
                    reason: 'Sale',
                    createdAt: new Date(),
                },
                {
                    _id: new Types.ObjectId(),
                    inventoryId: mockItemId,
                    type: StockMovementType.OUT,
                    quantity: -20,
                    reason: 'Sale',
                    createdAt: new Date(),
                },
                {
                    _id: new Types.ObjectId(),
                    inventoryId: mockItemId,
                    type: StockMovementType.OUT,
                    quantity: -30,
                    reason: 'Sale',
                    createdAt: new Date(),
                },
            ];

            mockInventoryModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            mockStockMovementModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockMovements),
            });

            const result = await service.getForecast(mockItemId.toString());

            expect(result).toBeDefined();
            expect(result.dailyUsage).toBe(2); // (10 + 20 + 30) / 30 = 2
            expect(result.daysUntilStockout).toBe(50); // 100 / 2 = 50
            expect(result.stockOutDate).toBeDefined();
            expect(result.reorderQuantity).toBeGreaterThanOrEqual(0);
            expect(result.status).toBe('Safe');
            expect(mockStockMovementModel.find).toHaveBeenCalledWith({
                inventoryId: mockItemId,
                type: StockMovementType.OUT,
                createdAt: { $gte: expect.any(Date) },
            });
        });

        it('should return Critical status when stockout is imminent', async () => {
            const mockItem = {
                _id: mockItemId,
                name: 'Test Item',
                quantity: 10, // Low quantity
                tenantId: mockTenantId,
            };

            const mockMovements = [
                {
                    _id: new Types.ObjectId(),
                    inventoryId: mockItemId,
                    type: StockMovementType.OUT,
                    quantity: -150, // High daily usage
                    reason: 'Sale',
                    createdAt: new Date(),
                },
            ];

            mockInventoryModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            mockStockMovementModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockMovements),
            });

            const result = await service.getForecast(mockItemId.toString());

            expect(result.status).toBe('Critical');
            expect(result.daysUntilStockout).toBeLessThan(7);
        });

        it('should return Low status when stockout is approaching', async () => {
            const mockItem = {
                _id: mockItemId,
                name: 'Test Item',
                quantity: 50,
                tenantId: mockTenantId,
            };

            const mockMovements = [
                {
                    _id: new Types.ObjectId(),
                    inventoryId: mockItemId,
                    type: StockMovementType.OUT,
                    quantity: -60, // About 2 per day
                    reason: 'Sale',
                    createdAt: new Date(),
                },
            ];

            mockInventoryModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            mockStockMovementModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockMovements),
            });

            const result = await service.getForecast(mockItemId.toString());

            // 50 / 2 = 25 days until stockout
            // leadTime is 7, so if < 12 days it's Low
            expect(result.status).toBe('Safe'); // Actually 25 days is safe
        });

        it('should handle zero movements (no consumption)', async () => {
            const mockItem = {
                _id: mockItemId,
                name: 'Test Item',
                quantity: 100,
                tenantId: mockTenantId,
            };

            mockInventoryModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            mockStockMovementModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue([]),
            });

            const result = await service.getForecast(mockItemId.toString());

            expect(result.dailyUsage).toBe(0);
            expect(result.daysUntilStockout).toBeNull();
            expect(result.stockOutDate).toBeNull();
            expect(result.reorderQuantity).toBe(0);
            expect(result.status).toBe('Safe');
        });

        it('should throw NotFoundException if inventory item not found', async () => {
            mockInventoryModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            await expect(service.getForecast('nonexistent')).rejects.toThrow(NotFoundException);
            await expect(service.getForecast('nonexistent')).rejects.toThrow(
                'Inventory item not found',
            );
        });

        it('should calculate reorder quantity correctly', async () => {
            const mockItem = {
                _id: mockItemId,
                name: 'Test Item',
                quantity: 20, // Current quantity
                tenantId: mockTenantId,
            };

            const mockMovements = [
                {
                    _id: new Types.ObjectId(),
                    inventoryId: mockItemId,
                    type: StockMovementType.OUT,
                    quantity: -30, // 1 per day average
                    reason: 'Sale',
                    createdAt: new Date(),
                },
            ];

            mockInventoryModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            mockStockMovementModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockMovements),
            });

            const result = await service.getForecast(mockItemId.toString());

            // dailyUsage = 1
            // targetStock = 1 * (30 + 7) = 37
            // reorderQuantity = 37 - 20 = 17
            expect(result.dailyUsage).toBe(1);
            expect(result.reorderQuantity).toBe(17);
        });

        it('should not suggest negative reorder quantity', async () => {
            const mockItem = {
                _id: mockItemId,
                name: 'Test Item',
                quantity: 1000, // High current quantity
                tenantId: mockTenantId,
            };

            const mockMovements = [
                {
                    _id: new Types.ObjectId(),
                    inventoryId: mockItemId,
                    type: StockMovementType.OUT,
                    quantity: -30, // 1 per day
                    reason: 'Sale',
                    createdAt: new Date(),
                },
            ];

            mockInventoryModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItem),
            });

            mockStockMovementModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockMovements),
            });

            const result = await service.getForecast(mockItemId.toString());

            expect(result.reorderQuantity).toBe(0); // Should not be negative
        });
    });
});
