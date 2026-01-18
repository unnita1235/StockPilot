import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inventory, InventoryDocument } from '../inventory/inventory.schema';
import { StockMovement, StockMovementDocument } from '../stock/stock.schema';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { Response } from 'express';

export interface ReportFilter {
    startDate?: Date;
    endDate?: Date;
    category?: string;
    supplier?: string;
    lowStockOnly?: boolean;
}

export interface InventoryReportData {
    items: any[];
    summary: {
        totalItems: number;
        totalValue: number;
        lowStockItems: number;
        outOfStockItems: number;
        categories: number;
    };
    movements: any[];
}

@Injectable()
export class ReportsService {
    constructor(
        @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
        @InjectModel(StockMovement.name) private stockMovementModel: Model<StockMovementDocument>,
    ) {}

    async generateInventoryReport(filter: ReportFilter): Promise<InventoryReportData> {
        const query: any = {};
        
        if (filter.category) {
            query.category = filter.category;
        }
        
        if (filter.supplier) {
            query.supplier = filter.supplier;
        }
        
        if (filter.lowStockOnly) {
            query.\\\ = { \\\: ['\', '\'] };
        }

        const items = await this.inventoryModel.find(query).populate('supplier').exec();
        
        const movementQuery: any = {};
        if (filter.startDate) {
            movementQuery.timestamp = { \\\: filter.startDate };
        }
        if (filter.endDate) {
            movementQuery.timestamp = { ...movementQuery.timestamp, \\\: filter.endDate };
        }
        
        const movements = await this.stockMovementModel
            .find(movementQuery)
            .populate('item')
            .populate('user')
            .sort({ timestamp: -1 })
            .limit(100)
            .exec();

        const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const lowStockItems = items.filter(item => item.quantity <= item.lowStockThreshold).length;
        const outOfStockItems = items.filter(item => item.quantity === 0).length;
        const categories = new Set(items.map(item => item.category)).size;

        return {
            items: items.map(item => item.toObject()),
            summary: {
                totalItems: items.length,
                totalValue,
                lowStockItems,
                outOfStockItems,
                categories,
            },
            movements: movements.map(m => m.toObject()),
        };
    }

    async exportToExcel(data: InventoryReportData, res: Response): Promise<void> {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'StockPilot';
        workbook.created = new Date();

        // Summary Sheet
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'Value', key: 'value', width: 20 },
        ];

        summarySheet.addRows([
            { metric: 'Total Items', value: data.summary.totalItems },
            { metric: 'Total Inventory Value', value: \\$\\ },
            { metric: 'Low Stock Items', value: data.summary.lowStockItems },
            { metric: 'Out of Stock Items', value: data.summary.outOfStockItems },
            { metric: 'Categories', value: data.summary.categories },
            { metric: 'Report Generated', value: new Date().toISOString() },
        ]);

        // Style header
        summarySheet.getRow(1).font = { bold: true };
        summarySheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' },
        };

        // Inventory Sheet
        const inventorySheet = workbook.addWorksheet('Inventory');
        inventorySheet.columns = [
            { header: 'SKU', key: 'sku', width: 15 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Category', key: 'category', width: 15 },
            { header: 'Quantity', key: 'quantity', width: 12 },
            { header: 'Unit Price', key: 'unitPrice', width: 12 },
            { header: 'Total Value', key: 'totalValue', width: 15 },
            { header: 'Low Stock Threshold', key: 'lowStockThreshold', width: 18 },
            { header: 'Status', key: 'status', width: 15 },
        ];

        data.items.forEach(item => {
            let status = 'Normal';
            if (item.quantity === 0) status = 'Out of Stock';
            else if (item.quantity <= item.lowStockThreshold) status = 'Low Stock';

            inventorySheet.addRow({
                sku: item.sku,
                name: item.name,
                category: item.category,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalValue: item.quantity * item.unitPrice,
                lowStockThreshold: item.lowStockThreshold,
                status,
            });
        });

        // Style header
        inventorySheet.getRow(1).font = { bold: true };
        inventorySheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' },
        };

        // Movements Sheet
        const movementsSheet = workbook.addWorksheet('Recent Movements');
        movementsSheet.columns = [
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Item', key: 'item', width: 30 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Quantity', key: 'quantity', width: 12 },
            { header: 'User', key: 'user', width: 20 },
            { header: 'Notes', key: 'notes', width: 40 },
        ];

        data.movements.forEach(movement => {
            movementsSheet.addRow({
                date: new Date(movement.timestamp).toLocaleString(),
                item: movement.item?.name || 'Unknown',
                type: movement.type,
                quantity: movement.quantity,
                user: movement.user?.name || 'System',
                notes: movement.notes || '-',
            });
        });

        // Style header
        movementsSheet.getRow(1).font = { bold: true };
        movementsSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' },
        };

        // Write to response
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
            'Content-Disposition',
            \ttachment; filename=inventory-report-\.xlsx\,
        );

        await workbook.xlsx.write(res);
        res.end();
    }

    async exportToPDF(data: InventoryReportData, res: Response): Promise<void> {
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            \ttachment; filename=inventory-report-\.pdf\,
        );

        doc.pipe(res);

        // Title
        doc.fontSize(20).text('StockPilot Inventory Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(\Generated: \\, { align: 'center' });
        doc.moveDown(2);

        // Summary Section
        doc.fontSize(16).text('Summary', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(\Total Items: \\);
        doc.text(\Total Inventory Value: \$\\);
        doc.text(\Low Stock Items: \\);
        doc.text(\Out of Stock Items: \\);
        doc.text(\Categories: \\);
        doc.moveDown(2);

        // Inventory Table
        doc.fontSize(16).text('Inventory Details', { underline: true });
        doc.moveDown();
        doc.fontSize(10);

        // Table headers
        const startX = 50;
        let currentY = doc.y;
        
        doc.text('SKU', startX, currentY, { width: 80 });
        doc.text('Name', startX + 80, currentY, { width: 150 });
        doc.text('Quantity', startX + 230, currentY, { width: 60 });
        doc.text('Price', startX + 290, currentY, { width: 60 });
        doc.text('Status', startX + 350, currentY, { width: 100 });
        
        doc.moveDown();
        doc.moveTo(startX, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        // Table rows (first 20 items)
        data.items.slice(0, 20).forEach(item => {
            currentY = doc.y;
            
            let status = 'Normal';
            if (item.quantity === 0) status = 'Out of Stock';
            else if (item.quantity <= item.lowStockThreshold) status = 'Low Stock';

            doc.text(item.sku, startX, currentY, { width: 80 });
            doc.text(item.name, startX + 80, currentY, { width: 150 });
            doc.text(item.quantity.toString(), startX + 230, currentY, { width: 60 });
            doc.text(\\$\\, startX + 290, currentY, { width: 60 });
            doc.text(status, startX + 350, currentY, { width: 100 });
            
            doc.moveDown(0.5);
        });

        if (data.items.length > 20) {
            doc.moveDown();
            doc.text(\... and \ more items\, { align: 'center', italics: true });
        }

        // Footer
        doc.moveDown(3);
        doc.fontSize(8).text('Generated by StockPilot Inventory Management System', {
            align: 'center',
        });

        doc.end();
    }
}
