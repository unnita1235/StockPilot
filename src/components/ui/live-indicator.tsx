'use client';

import { useSocketStatus } from '@/hooks/useSocket';
import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
    className?: string;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Visual indicator showing WebSocket connection status
 * Shows pulsing green dot when connected, red when disconnected
 */
export function LiveIndicator({
    className,
    showLabel = true,
    size = 'md'
}: LiveIndicatorProps) {
    const { isConnected, reconnect } = useSocketStatus();

    const sizeClasses = {
        sm: 'h-2 w-2',
        md: 'h-2.5 w-2.5',
        lg: 'h-3 w-3',
    };

    const textSizes = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    };

    return (
        <div
            className={cn(
                'flex items-center gap-2 cursor-pointer',
                className
            )}
            onClick={() => !isConnected && reconnect()}
            title={isConnected ? 'Real-time updates active' : 'Click to reconnect'}
        >
            <span className="relative flex">
                <span
                    className={cn(
                        'absolute inline-flex h-full w-full rounded-full opacity-75',
                        isConnected ? 'bg-green-400 animate-ping' : 'bg-red-400',
                        sizeClasses[size]
                    )}
                />
                <span
                    className={cn(
                        'relative inline-flex rounded-full',
                        isConnected ? 'bg-green-500' : 'bg-red-500',
                        sizeClasses[size]
                    )}
                />
            </span>
            {showLabel && (
                <span
                    className={cn(
                        'font-medium',
                        textSizes[size],
                        isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    )}
                >
                    {isConnected ? 'Live' : 'Offline'}
                </span>
            )}
        </div>
    );
}
