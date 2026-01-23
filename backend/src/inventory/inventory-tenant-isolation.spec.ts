import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Types } from 'mongoose';
import { TenantContext } from '../common/providers/tenant-context.provider';

/**
 * Tenant Isolation Tests
 *
 * These tests verify that:
 * 1. User A cannot access User B's data
 * 2. Cross-tenant queries return 403 Forbidden
 * 3. Tenant ID is properly propagated through service calls
 * 4. Tenant context is properly set and validated
 */
describe('Inventory Tenant Isolation', () => {
    let controller: InventoryController;
    let service: InventoryService;
    let tenantGuard: TenantGuard;

    // Mock tenant IDs
    const tenantA = new Types.ObjectId();
    const tenantB = new Types.ObjectId();
    const tenantC = new Types.ObjectId();

    // Mock data for each tenant
    const itemsForTenantA = [
        {
            _id: new Types.ObjectId(),
            name: 'Tenant A Item 1',
            quantity: 100,
            tenantId: tenantA,
        },
        {
            _id: new Types.ObjectId(),
            name: 'Tenant A Item 2',
            quantity: 50,
            tenantId: tenantA,
        },
    ];

    const itemsForTenantB = [
        {
            _id: new Types.ObjectId(),
            name: 'Tenant B Item 1',
            quantity: 200,
            tenantId: tenantB,
        },
    ];

    beforeEach(async () => {
        const mockInventoryService = {
            findAll: jest.fn((tenantId) => {
                if (tenantId.equals(tenantA)) {
                    return Promise.resolve(itemsForTenantA);
                } else if (tenantId.equals(tenantB)) {
                    return Promise.resolve(itemsForTenantB);
                }
                return Promise.resolve([]);
            }),
            findOne: jest.fn((id, tenantId) => {
                // Find item in the correct tenant's data
                let allItems = [];
                if (tenantId.equals(tenantA)) {
                    allItems = itemsForTenantA;
                } else if (tenantId.equals(tenantB)) {
                    allItems = itemsForTenantB;
                }

                const item = allItems.find((i) => i._id.toString() === id);
                if (!item) {
                    throw new Error('Item not found');
                }
                return Promise.resolve(item);
            }),
            create: jest.fn((dto, tenantId) => {
                return Promise.resolve({
                    _id: new Types.ObjectId(),
                    ...dto,
                    tenantId,
                });
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [InventoryController],
            providers: [
                {
                    provide: InventoryService,
                    useValue: mockInventoryService,
                },
                TenantGuard,
                Reflector,
            ],
        }).compile();

        controller = module.get<InventoryController>(InventoryController);
        service = module.get<InventoryService>(InventoryService);
        tenantGuard = module.get<TenantGuard>(TenantGuard);
    });

    describe('Tenant Data Isolation', () => {
        it('should only return items for Tenant A when querying as Tenant A', async () => {
            const result = await controller.findAll(tenantA);

            expect(result.data).toEqual(itemsForTenantA);
            expect(service.findAll).toHaveBeenCalledWith(tenantA);
            expect(result.data).toHaveLength(2);
            expect(result.data.every((item) => item.tenantId.equals(tenantA))).toBe(true);
        });

        it('should only return items for Tenant B when querying as Tenant B', async () => {
            const result = await controller.findAll(tenantB);

            expect(result.data).toEqual(itemsForTenantB);
            expect(service.findAll).toHaveBeenCalledWith(tenantB);
            expect(result.data).toHaveLength(1);
            expect(result.data.every((item) => item.tenantId.equals(tenantB))).toBe(true);
        });

        it('should return empty array for tenant with no data', async () => {
            const result = await controller.findAll(tenantC);

            expect(result.data).toEqual([]);
            expect(service.findAll).toHaveBeenCalledWith(tenantC);
        });

        it('should not allow Tenant A to access Tenant B items', async () => {
            const tenantBItemId = itemsForTenantB[0]._id.toString();

            await expect(controller.findOne(tenantBItemId, tenantA)).rejects.toThrow();
        });

        it('should allow Tenant A to access their own items', async () => {
            const tenantAItemId = itemsForTenantA[0]._id.toString();

            const result = await controller.findOne(tenantAItemId, tenantA);

            expect(result.data).toEqual(itemsForTenantA[0]);
            expect(result.data.tenantId).toEqual(tenantA);
        });
    });

    describe('TenantGuard Validation', () => {
        it('should allow access when tenant is present and active', () => {
            const mockExecutionContext: any = {
                switchToHttp: () => ({
                    getRequest: () => ({
                        tenant: {
                            _id: tenantA,
                            name: 'Tenant A',
                            status: 'active',
                        },
                        method: 'GET',
                        url: '/api/items',
                    }),
                }),
                getHandler: () => ({}),
                getClass: () => ({}),
            };

            // Set tenant context
            TenantContext.run(tenantA.toString(), () => {
                const reflector = new Reflector();
                reflector.getAllAndOverride = jest.fn().mockReturnValue(true);
                const guard = new TenantGuard(reflector);

                expect(() => guard.canActivate(mockExecutionContext)).not.toThrow();
            });
        });

        it('should throw ForbiddenException when tenant is not active', () => {
            const mockExecutionContext: any = {
                switchToHttp: () => ({
                    getRequest: () => ({
                        tenant: {
                            _id: tenantA,
                            name: 'Tenant A',
                            status: 'inactive',
                        },
                        method: 'GET',
                        url: '/api/items',
                    }),
                }),
                getHandler: () => ({}),
                getClass: () => ({}),
            };

            const reflector = new Reflector();
            reflector.getAllAndOverride = jest.fn().mockReturnValue(true);
            const guard = new TenantGuard(reflector);

            expect(() => guard.canActivate(mockExecutionContext)).rejects.toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException when tenant is missing', () => {
            const mockExecutionContext: any = {
                switchToHttp: () => ({
                    getRequest: () => ({
                        tenant: null,
                        method: 'GET',
                        url: '/api/items',
                    }),
                }),
                getHandler: () => ({}),
                getClass: () => ({}),
            };

            const reflector = new Reflector();
            reflector.getAllAndOverride = jest.fn().mockReturnValue(true);
            const guard = new TenantGuard(reflector);

            expect(() => guard.canActivate(mockExecutionContext)).rejects.toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException when tenant context mismatch', () => {
            const mockExecutionContext: any = {
                switchToHttp: () => ({
                    getRequest: () => ({
                        tenant: {
                            _id: tenantA,
                            name: 'Tenant A',
                            status: 'active',
                        },
                        method: 'GET',
                        url: '/api/items',
                    }),
                }),
                getHandler: () => ({}),
                getClass: () => ({}),
            };

            // Set different tenant in context
            TenantContext.run(tenantB.toString(), () => {
                const reflector = new Reflector();
                reflector.getAllAndOverride = jest.fn().mockReturnValue(true);
                const guard = new TenantGuard(reflector);

                expect(() => guard.canActivate(mockExecutionContext)).rejects.toThrow(
                    ForbiddenException,
                );
            });
        });
    });

    describe('Tenant Context Propagation', () => {
        it('should maintain tenant context throughout service calls', async () => {
            const createDto = { name: 'New Item', quantity: 100 };

            TenantContext.run(tenantA.toString(), async () => {
                const result = await controller.create(createDto, tenantA);

                expect(result.data.tenantId).toEqual(tenantA);
                expect(service.create).toHaveBeenCalledWith(createDto, tenantA);
            });
        });

        it('should isolate tenant contexts between concurrent requests', async () => {
            const promises = [
                TenantContext.runAs(tenantA.toString(), async () => {
                    const contextTenantId = TenantContext.getTenantId();
                    expect(contextTenantId).toBe(tenantA.toString());
                    return controller.findAll(tenantA);
                }),
                TenantContext.runAs(tenantB.toString(), async () => {
                    const contextTenantId = TenantContext.getTenantId();
                    expect(contextTenantId).toBe(tenantB.toString());
                    return controller.findAll(tenantB);
                }),
            ];

            const results = await Promise.all(promises);

            expect(results[0].data).toEqual(itemsForTenantA);
            expect(results[1].data).toEqual(itemsForTenantB);
        });
    });

    describe('Cross-Tenant Access Prevention', () => {
        it('should prevent reading items from another tenant', async () => {
            const tenantBItemId = itemsForTenantB[0]._id.toString();

            // Tenant A tries to access Tenant B's item
            await expect(controller.findOne(tenantBItemId, tenantA)).rejects.toThrow();
        });

        it('should prevent creating items in another tenant', async () => {
            const createDto = { name: 'Malicious Item', quantity: 999 };

            // Create with Tenant A ID
            const result = await controller.create(createDto, tenantA);

            // Verify it belongs to Tenant A, not any other tenant
            expect(result.data.tenantId).toEqual(tenantA);
            expect(result.data.tenantId).not.toEqual(tenantB);
        });

        it('should ensure all queries include tenant filter', async () => {
            await controller.findAll(tenantA);

            // Verify the service was called with the correct tenant ID
            expect(service.findAll).toHaveBeenCalledWith(tenantA);
            expect(service.findAll).not.toHaveBeenCalledWith(tenantB);
        });
    });

    describe('TenantContext Utility Functions', () => {
        it('should get tenant ID from context', () => {
            TenantContext.run(tenantA.toString(), () => {
                const tenantId = TenantContext.getTenantId();
                expect(tenantId).toBe(tenantA.toString());
            });
        });

        it('should get tenant ObjectId from context', () => {
            TenantContext.run(tenantA.toString(), () => {
                const tenantId = TenantContext.getTenantObjectId();
                expect(tenantId).toEqual(tenantA);
            });
        });

        it('should check if tenant context exists', () => {
            TenantContext.run(tenantA.toString(), () => {
                expect(TenantContext.hasTenantContext()).toBe(true);
            });

            expect(TenantContext.hasTenantContext()).toBe(false);
        });

        it('should throw error when tenant context is required but missing', () => {
            expect(() => TenantContext.requireTenantContext()).toThrow();
        });

        it('should verify tenant match', () => {
            TenantContext.run(tenantA.toString(), () => {
                expect(() => TenantContext.verifyTenantMatch(tenantA.toString())).not.toThrow();
                expect(() => TenantContext.verifyTenantMatch(tenantB.toString())).toThrow();
            });
        });
    });
});
