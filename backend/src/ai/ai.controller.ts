import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { createResponse } from '../common/api-response';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    constructor(private readonly aiService: AiService) { }

    /**
     * Predict demand for a specific item
     * GET /ai/predict/:id
     */
    @Get('predict/:id')
    async predictDemand(@Param('id') id: string) {
        const prediction = await this.aiService.predictDemand(id);
        return createResponse(prediction);
    }

    /**
     * Batch predict demand for all items
     * GET /ai/predict-all
     */
    @Get('predict-all')
    async batchPredictDemand() {
        const predictions = await this.aiService.batchPredictDemand();
        return createResponse(predictions);
    }

    /**
     * Get AI-powered inventory optimization recommendations
     * GET /ai/optimize
     */
    @Get('optimize')
    async getOptimizationRecommendations() {
        const recommendations = await this.aiService.getOptimizationRecommendations();
        return createResponse(recommendations);
    }
}
