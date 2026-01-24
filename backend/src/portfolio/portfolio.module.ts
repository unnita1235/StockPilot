import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { Position, PositionSchema } from './position.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Position.name, schema: PositionSchema }]),
    ],
    controllers: [PortfolioController],
    providers: [PortfolioService],
    exports: [PortfolioService],
})
export class PortfolioModule { }
