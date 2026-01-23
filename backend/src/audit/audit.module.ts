import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLog, AuditLogSchema } from './audit.schema';
import { AuditService } from './audit.service';

@Global() // Making it global so we don't have to import it everywhere
@Module({
    imports: [
        MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }]),
    ],
    providers: [AuditService],
    exports: [AuditService],
})
export class AuditModule { }
