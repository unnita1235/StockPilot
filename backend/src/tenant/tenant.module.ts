import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tenant, TenantSchema } from './tenant.schema';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';

@Global()
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Tenant.name, schema: TenantSchema },
        ]),
    ],
    controllers: [TenantController],
    providers: [TenantService],
    exports: [TenantService, MongooseModule],
})
export class TenantModule {}
