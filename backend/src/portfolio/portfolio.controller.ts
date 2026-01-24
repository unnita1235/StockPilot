import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Put } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { createResponse } from '../common/api-response';

@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
    constructor(private readonly portfolioService: PortfolioService) { }

    @Post('positions')
    async create(@Req() req: any, @Body() createPositionDto: CreatePositionDto) {
        // req.user is populated by JwtStrategy
        const userId = req.user._id || req.user.userId || req.user.sub;
        const data = await this.portfolioService.addPosition(userId.toString(), createPositionDto);
        return createResponse(data, 'Position added successfully');
    }

    @Get()
    async findAll(@Req() req: any) {
        const userId = req.user._id || req.user.userId || req.user.sub;
        const data = await this.portfolioService.findAll(userId.toString());
        return createResponse(data, 'Portfolio retrieved successfully');
    }

    @Put('positions/:id')
    async update(
        @Req() req: any,
        @Param('id') id: string,
        @Body() updatePositionDto: UpdatePositionDto
    ) {
        const userId = req.user._id || req.user.userId || req.user.sub;
        const data = await this.portfolioService.update(userId.toString(), id, updatePositionDto);
        return createResponse(data, 'Position updated successfully');
    }

    @Delete('positions/:id')
    async remove(@Req() req: any, @Param('id') id: string) {
        const userId = req.user._id || req.user.userId || req.user.sub;
        const data = await this.portfolioService.remove(userId.toString(), id);
        return createResponse(data, 'Position deleted successfully');
    }
}
