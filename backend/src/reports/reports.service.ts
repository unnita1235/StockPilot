import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inventory, InventoryDocument } from '../inventory/inventory.schema';
import { StockMovement, StockMovementDocument } from '../stock/stock.schema';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
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

    if (filter.lowStockOnly) {
      query.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
    }

    const items = await this.inventoryModel.find(query).exec();

    const movementQuery: any = {};
    if (filter.startDate || filter.endDate) {
      movementQuery.createdAt = {} as any;
      if (filter.startDate) (movementQuery.createdAt as any).$gte = filter.startDate;
      if (filter.endDate) (movementQuery.createdAt as any).$lte = filter.endDate;
    }

    const movements = await this.stockMovementModel
      .find(movementQuery)
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();

    const totalValue = items.reduce((sum, item: any) => sum + (item.quantity * (item.unitPrice || 0)), 0);
    const lowStockItems = items.filter((item: any) => item.quantity <= (item.lowStockThreshold || 0)).length;
    const outOfStockItems = items.filter((item: any) => item.quantity === 0).length;
    const categories = new Set(items.map((item: any) => item.category)).size;

    return {
      items: items.map((item: any) => item.toObject ? item.toObject() : item),
      summary: {
        totalItems: items.length,
        totalValue,
        lowStockItems,
        outOfStockItems,
        categories,
      },
      movements: movements.map((m: any) => m.toObject ? m.toObject() : m),
    };
  }

  async exportToExcel(data: InventoryReportData, res: Response): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'StockPilot';
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];

    summarySheet.addRows([
      { metric: 'Total Items', value: data.summary.totalItems },
      { metric: 'Total Inventory Value', value: data.summary.totalValue },
      { metric: 'Low Stock Items', value: data.summary.lowStockItems },
      { metric: 'Out of Stock Items', value: data.summary.outOfStockItems },
      { metric: 'Categories', value: data.summary.categories },
      { metric: 'Report Generated', value: new Date().toISOString() },
    ]);

    summarySheet.getRow(1).font = { bold: true };

    const inventorySheet = workbook.addWorksheet('Inventory');
    inventorySheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Unit Price', key: 'unitPrice', width: 12 },
      { header: 'Total Value', key: 'totalValue', width: 15 },
      { header: 'Low Stock Threshold', key: 'lowStockThreshold', width: 18 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    data.items.forEach((item: any) => {
      let status = 'Normal';
      if (item.quantity === 0) status = 'Out of Stock';
      else if (item.quantity <= item.lowStockThreshold) status = 'Low Stock';

      inventorySheet.addRow({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalValue: item.quantity * (item.unitPrice || 0),
        lowStockThreshold: item.lowStockThreshold,
        status,
      });
    });

    const movementsSheet = workbook.addWorksheet('Recent Movements');
    movementsSheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'ItemId', key: 'item', width: 30 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Notes', key: 'notes', width: 40 },
    ];

    data.movements.forEach((movement: any) => {
      movementsSheet.addRow({
        date: new Date(movement.createdAt).toLocaleString(),
        item: movement.itemId,
        type: movement.type,
        quantity: movement.quantity,
        notes: movement.notes || '-',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  }

  async exportToPDF(data: InventoryReportData, res: Response): Promise<void> {
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.pdf');

    doc.pipe(res);

    doc.fontSize(20).text('StockPilot Inventory Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(16).text('Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total Items: ${data.summary.totalItems}`);
    doc.text(`Total Inventory Value: $${data.summary.totalValue}`);
    doc.text(`Low Stock Items: ${data.summary.lowStockItems}`);
    doc.text(`Out of Stock Items: ${data.summary.outOfStockItems}`);
    doc.text(`Categories: ${data.summary.categories}`);
    doc.moveDown(2);

    doc.fontSize(16).text('Inventory Details', { underline: true });
    doc.moveDown();
    doc.fontSize(10);

    data.items.slice(0, 20).forEach((item: any) => {
      let status = 'Normal';
      if (item.quantity === 0) status = 'Out of Stock';
      else if (item.quantity <= item.lowStockThreshold) status = 'Low Stock';

      doc.text(`${item.name} | Qty: ${item.quantity} | Price: $${item.unitPrice || 0} | ${status}`);
    });

    if (data.items.length > 20) {
      doc.moveDown();
      doc.text(`... and ${data.items.length - 20} more items`, { align: 'center' });
    }

    doc.end();
  }
}
