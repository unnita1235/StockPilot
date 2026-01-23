# Tenant Isolation Quick Start Guide

## 🚀 Quick Setup

### 1. Protect a Controller

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequireTenant } from '../common/decorators/require-tenant.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Types } from 'mongoose';

@Controller('items')
@UseGuards(JwtAuthGuard, TenantGuard)  // Step 1: Apply guards
@RequireTenant()                        // Step 2: Require tenant
export class ItemController {
    @Get()
    async findAll(@TenantId() tenantId: Types.ObjectId) {  // Step 3: Extract tenant ID
        return this.service.findAll(tenantId);
    }
}
```

### 2. Service Layer

```typescript
@Injectable()
export class ItemService {
    async findAll(tenantId: Types.ObjectId): Promise<Item[]> {
        // ✅ Always include tenantId in queries
        return this.model.find({ tenantId }).exec();
    }
}
```

### 3. Testing

```bash
# Request with tenant header
curl -H "X-Tenant-Id: acme-corp" \
     -H "Authorization: Bearer TOKEN" \
     http://localhost:3000/api/items

# Request with subdomain
curl -H "Authorization: Bearer TOKEN" \
     http://acme-corp.localhost:3000/api/items
```

## 📦 Available Tools

### Decorators

```typescript
@RequireTenant()          // Require tenant scope
@TenantId()              // Extract tenant as ObjectId
@TenantIdString()        // Extract tenant as string
```

### Guards

```typescript
@UseGuards(TenantGuard)  // Validate tenant scope
```

### TenantContext API

```typescript
TenantContext.getTenantId()           // Get current tenant ID
TenantContext.getTenantObjectId()     // Get as ObjectId
TenantContext.hasTenantContext()      // Check if exists
TenantContext.requireTenantContext()  // Throw if missing
TenantContext.getTenantFilter()       // Get MongoDB filter
TenantContext.runAs(id, callback)     // Run as different tenant
```

## ✅ Best Practices

```typescript
// ✅ DO: Always require tenant
@Controller('items')
@UseGuards(TenantGuard)
@RequireTenant()
export class ItemController { }

// ✅ DO: Use @TenantId() decorator
async findAll(@TenantId() tenantId: Types.ObjectId) { }

// ✅ DO: Include tenantId in queries
find({ tenantId, status: 'active' })

// ❌ DON'T: Query without tenant filter
find({ status: 'active' })  // Returns ALL tenants!

// ❌ DON'T: Forget @RequireTenant()
@Controller('items')  // Missing @RequireTenant()!
export class ItemController { }
```

## 🔒 Security Guarantee

✅ **User A cannot access User B's data**  
✅ **All queries automatically scoped to tenant**  
✅ **Cross-tenant access returns 404/403**  
✅ **Audit logging for all tenant operations**  

## 🧪 Test Your Implementation

```typescript
it('should isolate tenant data', async () => {
    const tenantA = new Types.ObjectId();
    const tenantB = new Types.ObjectId();

    const itemsA = await service.findAll(tenantA);
    const itemsB = await service.findAll(tenantB);

    // Verify isolation
    expect(itemsA.every(item => item.tenantId.equals(tenantA))).toBe(true);
    expect(itemsB.every(item => item.tenantId.equals(tenantB))).toBe(true);
});
```

## 📚 Full Documentation

See [TENANT-ISOLATION.md](./TENANT-ISOLATION.md) for complete documentation.
