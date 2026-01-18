import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from './tenant.schema';

export interface RequestWithTenant extends Request {
    tenant?: TenantDocument;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
    constructor(
        @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    ) {}

    async use(req: RequestWithTenant, res: Response, next: NextFunction) {
        let tenantIdentifier = 'default';

        const tenantHeader = req.headers['x-tenant-id'] as string;
        if (tenantHeader) {
            tenantIdentifier = tenantHeader;
        } else {
            const host = req.headers.host || '';
            const parts = host.split('.');
            
            if (parts.length > 2) {
                tenantIdentifier = parts[0];
            }
        }

        const tenant = await this.tenantModel.findOne({
            $or: [
                { slug: tenantIdentifier },
                { domain: req.headers.host },
            ],
            status: 'active',
        });

        if (!tenant) {
            if (process.env.NODE_ENV !== 'production') {
                const defaultTenant = await this.tenantModel.findOneAndUpdate(
                    { slug: 'default' },
                    {
                        $setOnInsert: {
                            name: 'Default Organization',
                            slug: 'default',
                            domain: 'localhost',
                            contactEmail: 'admin@stockpilot.com',
                            settings: {
                                timezone: 'UTC',
                                currency: 'USD',
                                dateFormat: 'YYYY-MM-DD',
                                lowStockAlertEmail: 'admin@stockpilot.com',
                                features: {
                                    aiForecasting: true,
                                    multiWarehouse: false,
                                    advancedReporting: true,
                                },
                            },
                        },
                    },
                    { upsert: true, new: true },
                );
                req.tenant = defaultTenant;
            } else {
                throw new NotFoundException('Tenant not found or inactive');
            }
        } else {
            req.tenant = tenant;
        }

        next();
    }
}
