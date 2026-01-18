import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { StockMovement, StockMovementSchema } from './stock.schema';
import { Inventory, InventorySchema } from '../inventory/inventory.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: StockMovement.name, schema: StockMovementSchema },
            { name: Inventory.name, schema: InventorySchema },
        ]),
    ],
    controllers: [StockController],
    providers: [StockService],
    exports: [StockService],
})
export class StockModule { }
