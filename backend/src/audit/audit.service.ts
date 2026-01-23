import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './audit.schema';

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(
        @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    ) { }

    async log(data: {
        tenantId: string;
        userId: string;
        action: string;
        entity: string;
        entityId: string;
        oldValue?: any;
        newValue?: any;
    }) {
        try {
            const logEntry = new this.auditLogModel(data);
            await logEntry.save();
        } catch (error) {
            this.logger.error('Failed to create audit log', error.stack);
            // We consciously do not throw here to avoid failing the main business logic
            // just because logging failed. In strict environments, this might be valid to throw.
        }
    }
}
