'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { StatusKpiCards, OverdueKpiCard } from '@/entities/tasks/ui'
import type { Task, TaskStatus } from '@/entities/tasks/ui'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui'
import { Button } from '@/shared/ui'
import { BarChart3, ArrowLeft } from 'lucide-react'

type Project = {
  id: string
  slug: string
  name: string
  description: string | null
}

type AnalyticsPageProps = {
  project: Project
  tasks: Task[]
  statusOrder: TaskStatus[]
  statusLabels: Record<TaskStatus, string>
}

function AnalyticsPage({ project, tasks, statusOrder, statusLabels }: AnalyticsPageProps) {
  const [activeTab, setActiveTab] = useState('status')

  // Calculate overdue tasks count
  // A task is overdue if it has a deadline that is in the past (not today)
  const overdueCount = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Reset to start of day for comparison

    return tasks.filter(task => {
      if (!task.deadline) return false

      const deadlineDate = typeof task.deadline === 'string' ? new Date(task.deadline) : task.deadline
      deadlineDate.setHours(0, 0, 0, 0)

      // Overdue = deadline is before today (not today)
      return deadlineDate < now
    }).length
  }, [tasks])

  // Delta calculation would require historical data (not implemented per requirements)
  // Placeholder for future: delta could be passed as prop from server
  const overdueDelta: number | null = null

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Header with Tabs */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">Analytics</h1>
            </div>
            <TabsList>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
          </div>
          <div className="flex items-center gap-4 ml-[52px]">
            <p className="text-muted-foreground">{project.name}</p>
            <Link href={`/workspace/${project.slug}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Board
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Content */}
        <TabsContent value="status">
          <StatusKpiCards tasks={tasks} statusOrder={statusOrder} statusLabels={statusLabels} />
        </TabsContent>
        <TabsContent value="overdue">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <OverdueKpiCard count={overdueCount} delta={overdueDelta} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { AnalyticsPage }
export type { Project }
