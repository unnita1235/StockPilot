import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Put } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
    constructor(private readonly portfolioService: PortfolioService) { }

    @Post('positions')
    create(@Req() req: any, @Body() createPositionDto: CreatePositionDto) {
        // req.user is populated by JwtStrategy
        const userId = req.user._id || req.user.userId || req.user.sub;
        // Need to be careful with how JwtStrategy returns the user object. 
        // Based on existing controllers, it seems to be req.user._id or req.user.id
        // I'll grab the ID safely.
        return this.portfolioService.addPosition(userId.toString(), createPositionDto);
    }

    @Get()
    findAll(@Req() req: any) {
        const userId = req.user._id || req.user.userId || req.user.sub;
        return this.portfolioService.findAll(userId.toString());
    }

    @Put('positions/:id')
    update(
        @Req() req: any,
        @Param('id') id: string,
        @Body() updatePositionDto: UpdatePositionDto
    ) {
        const userId = req.user._id || req.user.userId || req.user.sub;
        return this.portfolioService.update(userId.toString(), id, updatePositionDto);
    }

    @Delete('positions/:id')
    remove(@Req() req: any, @Param('id') id: string) {
        const userId = req.user._id || req.user.userId || req.user.sub;
        return this.portfolioService.remove(userId.toString(), id);
    }
}
