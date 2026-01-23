# Tenant Isolation Documentation

## Overview

StockPilot implements comprehensive multi-tenancy with strict tenant isolation to ensure data security and privacy. Each tenant's data is completely isolated from other tenants, preventing any cross-tenant access.

## Architecture

### Components

1. **TenantMiddleware** - Extracts and validates tenant from request
2. **TenantContext** - Manages tenant scope using AsyncLocalStorage
3. **TenantGuard** - Enforces tenant scope on protected routes
4. **@RequireTenant()** - Decorator to mark routes as tenant-scoped
5. **@TenantId()** - Decorator to extract tenant ID from request
6. **Tenant Isolation Plugin** - Mongoose plugin for automatic tenant filtering

## How It Works

### 1. Request Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. HTTP Request with X-Tenant-Id header or subdomain       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. TenantMiddleware                                         │
│    - Extracts tenant identifier                            │
│    - Queries database for tenant                           │
│    - Sets req.tenant                                       │
│    - Runs TenantContext.run(tenantId, next)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. TenantGuard (if @RequireTenant() is present)           │
│    - Validates tenant is present                           │
│    - Validates tenant is active                            │
│    - Verifies tenant context matches request               │
│    - Logs tenant access for audit                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Controller Method                                        │
│    - @TenantId() decorator extracts tenant ID              │
│    - Tenant ID passed to service layer                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Service Layer                                            │
│    - All queries include { tenantId: tenantId }           │
│    - TenantContext.getTenantId() available everywhere     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Database Query                                           │
│    - Automatically filtered by tenantId                    │
│    - Results only from current tenant                      │
└─────────────────────────────────────────────────────────────┘
```

### 2. Tenant Identification

Tenants are identified in multiple ways (in priority order):

1. **X-Tenant-Id Header**: `X-Tenant-Id: tenant-slug`
2. **Subdomain**: `tenantA.stockpilot.com` → tenant slug = `tenantA`
3. **JWT Token**: Tenant claim in authenticated user's JWT
4. **Default**: `default` tenant for development

Example:
```bash
# Using header
curl -H "X-Tenant-Id: acme-corp" https://api.stockpilot.com/api/items

# Using subdomain
curl https://acme-corp.stockpilot.com/api/items
```

### 3. AsyncLocalStorage

Tenant context is propagated using Node.js `AsyncLocalStorage`, which provides async-safe context propagation:

```typescript
// In middleware
TenantContext.run(tenantId, next);

// Anywhere in the async call chain
const tenantId = TenantContext.getTenantId(); // Returns the current tenant ID
```

This ensures tenant context is available throughout:
- Controller methods
- Service methods
- Repository methods
- Event handlers
- Background jobs (within the same async context)

## Usage

### Protecting a Controller

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequireTenant } from '../common/decorators/require-tenant.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Types } from 'mongoose';

@Controller('items')
@UseGuards(JwtAuthGuard, TenantGuard)  // Apply guards
@RequireTenant()                        // Require tenant scope
export class InventoryController {
    @Get()
    async findAll(@TenantId() tenantId: Types.ObjectId) {
        // tenantId is automatically extracted and validated
        return this.service.findAll(tenantId);
    }
}
```

### Protecting a Specific Route

```typescript
@Controller('items')
@UseGuards(JwtAuthGuard)
export class InventoryController {
    // Protected route
    @Get()
    @UseGuards(TenantGuard)
    @RequireTenant()
    async findAll(@TenantId() tenantId: Types.ObjectId) {
        return this.service.findAll(tenantId);
    }

    // Public route
    @Get('public')
    @RequireTenant(false)
    async publicData() {
        return { message: 'Public data' };
    }
}
```

### Service Layer

Always include `tenantId` in queries:

```typescript
@Injectable()
export class InventoryService {
    async findAll(tenantId: Types.ObjectId | string): Promise<Item[]> {
        // ✅ CORRECT: Scoped to tenant
        return this.itemModel.find({ tenantId }).exec();
    }

    async findAllWrong(): Promise<Item[]> {
        // ❌ WRONG: Not scoped to tenant
        return this.itemModel.find({}).exec();
    }
}
```

### Using TenantContext

```typescript
import { TenantContext } from '../common/providers/tenant-context.provider';

// Get current tenant ID
const tenantId = TenantContext.getTenantId();

// Get as ObjectId
const tenantObjectId = TenantContext.getTenantObjectId();

// Check if in tenant context
if (TenantContext.hasTenantContext()) {
    // Do something
}

// Require tenant context (throws if missing)
const tenantId = TenantContext.requireTenantContext();

// Verify tenant match
TenantContext.verifyTenantMatch(tenantId);

// Get tenant filter for queries
const filter = TenantContext.getTenantFilter(); // { tenantId: ObjectId }

// Run operation as different tenant (admin operations)
await TenantContext.runAs(otherTenantId, async () => {
    // This runs with otherTenantId context
    const items = await this.service.findAll(otherTenantId);
});
```

## Security Guarantees

### 1. Data Isolation

✅ **Tenant A cannot access Tenant B's data**
- All queries automatically include `tenantId` filter
- Cross-tenant queries return empty results
- Attempting to access another tenant's resource returns 404

✅ **Automatic tenant scoping**
- Mongoose plugin automatically adds `tenantId` to all queries
- No manual filtering required in most cases
- Reduces risk of developer error

### 2. Access Control

✅ **TenantGuard validates tenant before access**
- Tenant must be present in request
- Tenant must be active
- Tenant context must match request

✅ **Audit logging**
- All tenant-scoped access is logged
- Includes tenant ID, user, endpoint, and timestamp
- Helps with compliance and security audits

### 3. Context Safety

✅ **AsyncLocalStorage ensures context safety**
- Each request has its own isolated context
- Concurrent requests don't interfere with each other
- Context automatically propagates through async calls

✅ **Context validation**
- TenantGuard verifies context matches request
- Prevents context confusion attacks
- Detects and prevents tenant hijacking

## Testing

### Unit Tests

```typescript
describe('Tenant Isolation', () => {
    it('should only return items for current tenant', async () => {
        const tenantA = new Types.ObjectId();
        const tenantB = new Types.ObjectId();

        const itemsA = await service.findAll(tenantA);
        const itemsB = await service.findAll(tenantB);

        // Verify isolation
        expect(itemsA.every(item => item.tenantId.equals(tenantA))).toBe(true);
        expect(itemsB.every(item => item.tenantId.equals(tenantB))).toBe(true);
    });

    it('should prevent cross-tenant access', async () => {
        const tenantA = new Types.ObjectId();
        const tenantBItemId = 'item-from-tenant-b';

        // Tenant A tries to access Tenant B's item
        await expect(service.findOne(tenantBItemId, tenantA))
            .rejects.toThrow(NotFoundException);
    });
});
```

### Integration Tests

```typescript
describe('Tenant Isolation E2E', () => {
    it('should prevent cross-tenant access via API', async () => {
        // Create item in Tenant A
        const itemA = await request(app.getHttpServer())
            .post('/api/items')
            .set('X-Tenant-Id', 'tenant-a')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'Item A' });

        // Try to access with Tenant B credentials
        const response = await request(app.getHttpServer())
            .get(`/api/items/${itemA.body.data.id}`)
            .set('X-Tenant-Id', 'tenant-b')
            .set('Authorization', `Bearer ${tokenB}`);

        expect(response.status).toBe(404);
    });
});
```

## Best Practices

### ✅ DO

1. **Always use @RequireTenant() decorator**
   ```typescript
   @Controller('items')
   @RequireTenant()
   export class ItemController { }
   ```

2. **Always pass tenantId to service methods**
   ```typescript
   async findAll(@TenantId() tenantId: Types.ObjectId) {
       return this.service.findAll(tenantId);
   }
   ```

3. **Always include tenantId in database queries**
   ```typescript
   find({ tenantId, ...otherFilters })
   ```

4. **Use TenantContext for cross-cutting concerns**
   ```typescript
   const tenantId = TenantContext.requireTenantContext();
   ```

5. **Test tenant isolation**
   ```typescript
   it('should isolate tenant data', async () => { ... });
   ```

### ❌ DON'T

1. **Don't query without tenant filter**
   ```typescript
   // ❌ BAD
   find({}) // Returns data from ALL tenants!

   // ✅ GOOD
   find({ tenantId })
   ```

2. **Don't bypass TenantGuard**
   ```typescript
   // ❌ BAD
   @Controller('items')
   export class ItemController { } // Missing @RequireTenant()
   ```

3. **Don't hard-code tenant IDs**
   ```typescript
   // ❌ BAD
   const tenantId = 'hardcoded-tenant';

   // ✅ GOOD
   const tenantId = TenantContext.getTenantId();
   ```

4. **Don't ignore tenant in background jobs**
   ```typescript
   // ❌ BAD
   async processJob() {
       const items = await this.find({}); // All tenants!
   }

   // ✅ GOOD
   async processJob(tenantId: string) {
       await TenantContext.runAs(tenantId, async () => {
           const items = await this.find({ tenantId });
       });
   }
   ```

## Troubleshooting

### Issue: "Tenant context not found"

**Cause**: Route is not within TenantMiddleware scope

**Solution**: Check that route is not excluded in app.module.ts:
```typescript
.exclude(
    { path: 'health', method: RequestMethod.ALL }
)
```

### Issue: "Tenant context mismatch"

**Cause**: AsyncLocalStorage context was not properly set

**Solution**: Ensure TenantMiddleware uses `TenantContext.run()`:
```typescript
TenantContext.run(tenant._id.toString(), next);
```

### Issue: Cross-tenant data leakage

**Cause**: Query missing `tenantId` filter

**Solution**: Always include `tenantId` in queries:
```typescript
// Before
.find({ status: 'active' })

// After
.find({ tenantId, status: 'active' })
```

## Compliance

This tenant isolation implementation helps meet compliance requirements for:

- **GDPR**: Data separation by organization
- **SOC 2**: Logical access controls
- **HIPAA**: Administrative safeguards
- **ISO 27001**: Access control policy

All tenant access is logged for audit purposes.

## Summary

✅ **Complete data isolation** between tenants
✅ **Automatic tenant scoping** via middleware and guards
✅ **Context propagation** via AsyncLocalStorage
✅ **Comprehensive testing** via unit and integration tests
✅ **Audit logging** for all tenant operations
✅ **Production-ready** security implementation

For questions or issues, please contact the development team.
