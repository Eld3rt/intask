'use client'

import { Card, CardContent, CardHeader } from '@/shared/ui'
import { cn } from '@/shared/lib'
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

type OverdueKpiCardProps = {
  count: number
  delta?: number | null
  onClick?: () => void
}

/**
 * KPI card component for displaying overdue tasks count.
 * Uses warning/danger accents to reflect urgency.
 * Supports optional delta indicator for trend comparison.
 */
function OverdueKpiCard({ count, delta, onClick }: OverdueKpiCardProps) {
  // Determine visual style based on count
  // Zero = neutral, non-zero = warning/danger
  const hasOverdue = count > 0
  const colorClass = hasOverdue
    ? 'border-l-orange-400 bg-orange-50/50 dark:bg-orange-900/20'
    : 'border-l-gray-400 bg-gray-50/50 dark:bg-gray-900/20'

  // Delta interpretation: negative = improvement, positive = worsening
  const deltaValue = delta !== null && delta !== undefined ? delta : null
  const isImprovement = deltaValue !== null && deltaValue < 0
  const isWorsening = deltaValue !== null && deltaValue > 0

  return (
    <Card
      className={cn(
        'border-l-4 transition-all duration-200',
        colorClass,
        onClick && 'cursor-pointer hover:shadow-md hover:scale-[1.02]',
        !onClick && 'cursor-default'
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {hasOverdue && <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-500" />}
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Overdue Tasks</h3>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-foreground tabular-nums">{count.toLocaleString()}</span>
            {deltaValue !== null && (
              <div className="flex items-center gap-1 mt-1">
                {isImprovement ? (
                  <TrendingDown className="h-3 w-3 text-green-600 dark:text-green-500" />
                ) : isWorsening ? (
                  <TrendingUp className="h-3 w-3 text-orange-600 dark:text-orange-500" />
                ) : null}
                <span
                  className={cn(
                    'text-xs font-medium',
                    isImprovement
                      ? 'text-green-600 dark:text-green-500'
                      : isWorsening
                      ? 'text-orange-600 dark:text-orange-500'
                      : 'text-muted-foreground'
                  )}
                >
                  {isImprovement ? Math.abs(deltaValue) : deltaValue} vs previous period
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { OverdueKpiCard }
export type { OverdueKpiCardProps }
