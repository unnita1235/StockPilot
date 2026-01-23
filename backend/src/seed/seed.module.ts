import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';
import { User, UserSchema } from '../auth/user.schema';
import { Inventory, InventorySchema } from '../inventory/inventory.schema';
import { StockMovement, StockMovementSchema } from '../stock/stock.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Inventory.name, schema: InventorySchema },
            { name: StockMovement.name, schema: StockMovementSchema },
        ]),
    ],
    controllers: [SeedController],
    providers: [SeedService],
    exports: [SeedService],
})
export class SeedModule {}
