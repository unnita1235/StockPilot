import { Schema, Query, Types } from 'mongoose';
import { TenantContext } from '../providers/tenant-context.provider';

export function tenantIsolationPlugin(schema: Schema) {
    // Check if the schema has a tenantId field
    const hasTenantId = schema.path('tenantId');

    if (!hasTenantId) {
        return; // Skip schemas without tenantId (e.g. Tenant, Configs)
    }

    // List of query middleware hooks to intercept
    const queries = [
        'count',
        'countDocuments',
        'find',
        'findOne',
        'findOneAndDelete',
        'findOneAndRemove',
        'findOneAndUpdate',
        'update',
        'updateOne',
        'updateMany',
        'deleteOne', // Added delete hooks
        'deleteMany',
    ];

    queries.forEach((query) => {
        schema.pre(query as any, function (next) {
            const tenantId = TenantContext.getTenantId();
            if (tenantId) {
                // 'this' refers to the Query object
                const queryObj = this as unknown as Query<any, any>;
                // Add tenantId to the query filter
                queryObj.where('tenantId').equals(tenantId);
            }
            next();
        });
    });

    // Handle 'save' middleware to automatically set tenantId
    schema.pre('save', function (next) {
        const tenantId = TenantContext.getTenantId();
        const doc = this as any; // Cast to avoid TS errors accessing tenantId properties

        if (tenantId && !doc.tenantId) {
            doc.tenantId = new Types.ObjectId(tenantId);
        }
        next();
    });
}
