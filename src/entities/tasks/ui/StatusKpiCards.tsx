'use client'

import { useMemo } from 'react'
import { StatusKpiCard } from './StatusKpiCard'
import type { TaskStatus } from './TaskCard'
import type { Task } from './TaskCard'

type StatusKpiCardsProps = {
  tasks: Task[]
  statusOrder: TaskStatus[]
  statusLabels: Record<TaskStatus, string>
  onStatusClick?: (status: TaskStatus) => void
}

/**
 * Container component that renders a responsive grid of status KPI cards.
 * Computes task counts per status and displays them in a data-driven manner.
 * Responsive: stacked on mobile, grid on desktop.
 */
function StatusKpiCards({ tasks, statusOrder, statusLabels, onStatusClick }: StatusKpiCardsProps) {
  // Compute task counts per status
  const statusCounts = useMemo(() => {
    const counts: Record<TaskStatus, number> = {
      ToDo: 0,
      InProgress: 0,
      Review: 0,
      Done: 0,
    }

    tasks.forEach(task => {
      if (task.status in counts) {
        counts[task.status]++
      }
    })

    return counts
  }, [tasks])

  const totalTasks = tasks.length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statusOrder.map(status => (
        <StatusKpiCard
          key={status}
          status={status}
          statusLabel={statusLabels[status]}
          count={statusCounts[status]}
          total={totalTasks}
          onClick={onStatusClick ? () => onStatusClick(status) : undefined}
        />
      ))}
    </div>
  )
}

export { StatusKpiCards }
export type { StatusKpiCardsProps }
