'use server';

/**
 * @fileOverview Analyzes historical stock data to predict when an item will likely run low and adjusts the alert level accordingly.
 *
 * - analyzeStockData - A function that analyzes stock data and adjusts low stock alerts.
 * - AnalyzeStockDataInput - The input type for the analyzeStockData function.
 * - AnalyzeStockDataOutput - The return type for the analyzeStockData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeStockDataInputSchema = z.object({
  itemId: z.string().describe('The ID of the item to analyze.'),
  historicalStockData: z
    .string()
    .describe(
      'Historical stock data for the item, including dates and stock levels.'
    ),
  currentStockLevel: z.number().describe('The current stock level of the item.'),
  lowStockThreshold: z
    .number()
    .describe('The current low stock threshold for the item.'),
});
export type AnalyzeStockDataInput = z.infer<typeof AnalyzeStockDataInputSchema>;

const AnalyzeStockDataOutputSchema = z.object({
  adjustedLowStockThreshold: z
    .number()
    .describe(
      'The adjusted low stock threshold based on historical data analysis.'
    ),
  reasoning: z.string().describe('The reasoning behind the adjusted threshold.'),
});
export type AnalyzeStockDataOutput = z.infer<typeof AnalyzeStockDataOutputSchema>;

export async function analyzeStockData(
  input: AnalyzeStockDataInput
): Promise<AnalyzeStockDataOutput> {
  return analyzeStockDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeStockDataPrompt',
  input: {schema: AnalyzeStockDataInputSchema},
  output: {schema: AnalyzeStockDataOutputSchema},
  prompt: `You are an expert inventory analyst. Analyze the historical stock data for the item provided, and adjust the low stock threshold accordingly. The goal is to prevent stockouts while minimizing needless ordering.

Consider factors such as seasonal demand, lead times, and recent sales trends.

Item ID: {{{itemId}}}
Historical Stock Data: {{{historicalStockData}}}
Current Stock Level: {{{currentStockLevel}}}
Current Low Stock Threshold: {{{lowStockThreshold}}}

Provide the adjusted low stock threshold and a brief explanation of your reasoning. Be specific, and include numbers whenever possible.

Adjusted Low Stock Threshold:
Reasoning:`,
});

const analyzeStockDataFlow = ai.defineFlow(
  {
    name: 'analyzeStockDataFlow',
    inputSchema: AnalyzeStockDataInputSchema,
    outputSchema: AnalyzeStockDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
