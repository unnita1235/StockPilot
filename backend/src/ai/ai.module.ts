import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { Inventory, InventorySchema } from '../inventory/inventory.schema';
import { StockMovement, StockMovementSchema } from '../stock/stock.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Inventory.name, schema: InventorySchema },
            { name: StockMovement.name, schema: StockMovementSchema },
        ]),
    ],
    controllers: [AiController],
    providers: [AiService],
    exports: [AiService],
})
export class AiModule { }
