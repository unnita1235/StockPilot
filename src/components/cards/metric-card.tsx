'use client';

import { type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; label?: string };
  loading?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  loading = false,
  className,
}: MetricCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {(subtitle || trend) && (
              <p className="text-xs text-muted-foreground mt-1">
                {trend && (
                  <span className={cn(
                    'font-medium mr-1',
                    trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {trend.value >= 0 ? '+' : ''}{trend.value}%
                  </span>
                )}
                {subtitle || trend?.label}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
