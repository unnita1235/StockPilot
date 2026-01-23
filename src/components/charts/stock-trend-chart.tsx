'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';

interface TrendDataPoint {
  date: string;
  in: number;
  out: number;
}

interface StockTrendChartProps {
  data: TrendDataPoint[];
  loading?: boolean;
  title?: string;
  description?: string;
  height?: number;
}

export function StockTrendChart({
  data,
  loading = false,
  title = 'Stock Activity Trend',
  description = 'Stock in vs stock out over time',
  height = 250,
}: StockTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="w-full" style={{ height }} />
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="in"
                name="Stock In"
                stroke="#16a34a"
                fill="#16a34a"
                fillOpacity={0.1}
              />
              <Area
                type="monotone"
                dataKey="out"
                name="Stock Out"
                stroke="#dc2626"
                fill="#dc2626"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div
            className="flex items-center justify-center text-muted-foreground"
            style={{ height }}
          >
            No trend data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
