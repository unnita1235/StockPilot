import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Inventory, InventorySchema } from './inventory.schema';
import { StockMovement, StockMovementSchema } from './stock-movement.schema';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Inventory.name, schema: InventorySchema },
            { name: StockMovement.name, schema: StockMovementSchema },
        ]),
        AuditModule,
    ],
    providers: [InventoryService],
    controllers: [InventoryController],
})
export class InventoryModule { }
