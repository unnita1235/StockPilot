import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Inventory, InventorySchema } from './inventory.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: Inventory.name, schema: InventorySchema }])],
    providers: [InventoryService],
    controllers: [InventoryController],
})
export class InventoryModule { }
