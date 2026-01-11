'use client'

import { Card, CardContent, CardHeader } from '@/shared/ui'
import { cn } from '@/shared/lib'
import type { TaskStatus } from './TaskCard'

type StatusKpiCardProps = {
  status: TaskStatus
  statusLabel: string
  count: number
  total: number
  onClick?: () => void
}

/**
 * Status color accents matching TaskCard status colors
 */
const statusColors: Record<TaskStatus, string> = {
  ToDo: 'border-l-gray-400 bg-gray-50/50 dark:bg-gray-900/20',
  InProgress: 'border-l-blue-400 bg-blue-50/50 dark:bg-blue-900/20',
  Review: 'border-l-purple-400 bg-purple-50/50 dark:bg-purple-900/20',
  Done: 'border-l-green-400 bg-green-50/50 dark:bg-green-900/20',
}

/**
 * Reusable KPI card component for displaying task status metrics.
 * Displays status label, task count, and optional percentage.
 * Supports hover states and optional click handling for future filtering.
 */
function StatusKpiCard({ status, statusLabel, count, total, onClick }: StatusKpiCardProps) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0
  const colorClass = statusColors[status]

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
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{statusLabel}</h3>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-foreground tabular-nums">{count.toLocaleString()}</span>
            {total > 0 && (
              <span className="text-xs text-muted-foreground mt-1">{percentage}% of total</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { StatusKpiCard }
export type { StatusKpiCardProps }
