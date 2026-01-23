import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class TenantContext {
    private static storage = new AsyncLocalStorage<string>();

    static run(tenantId: string, callback: () => void) {
        this.storage.run(tenantId, callback);
    }

    static getTenantId(): string | undefined {
        return this.storage.getStore();
    }
}
