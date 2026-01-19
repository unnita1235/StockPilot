import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { StockMovement, StockMovementSchema } from './stock.schema';
import { Inventory, InventorySchema } from '../inventory/inventory.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Inventory.name, schema: InventorySchema },
            { name: StockMovement.name, schema: StockMovementSchema },
        ]),
        NotificationsModule,
    ],
    controllers: [StockController],
    providers: [StockService],
    exports: [StockService],
})
export class StockModule { }
