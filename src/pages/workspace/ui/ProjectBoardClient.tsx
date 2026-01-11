'use client'

import { useMemo, useState } from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui'
import { TaskCard, type Task, type TaskStatus } from '@/entities/tasks/ui'
import { CreateTaskButton, EditTaskModal } from '@/features/tasks'
import { CheckSquare } from 'lucide-react'

type Project = {
  id: string
  slug: string
  name: string
  description: string | null
}

type ProjectBoardClientProps = {
  project: Project
  tasks: Task[]
}

const STATUS_ORDER: TaskStatus[] = ['ToDo', 'InProgress', 'Review', 'Done']

const STATUS_LABELS: Record<TaskStatus, string> = {
  ToDo: 'To Do',
  InProgress: 'In Progress',
  Review: 'Review',
  Done: 'Done',
}

function ProjectBoardClient({ project, tasks }: ProjectBoardClientProps) {
  const hasTasks = tasks.length > 0
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      ToDo: [],
      InProgress: [],
      Review: [],
      Done: [],
    }

    tasks.forEach(task => {
      if (task.status in grouped) {
        grouped[task.status].push(task)
      }
    })

    return grouped
  }, [tasks])

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setEditModalOpen(true)
  }

  const handleCloseEditModal = (open: boolean) => {
    setEditModalOpen(open)
    if (!open) {
      setSelectedTask(null)
    }
  }

  return (
    <>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with project name and create task button */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">{project.name}</h1>
            {project.description && <p className="text-muted-foreground">{project.description}</p>}
          </div>
          <CreateTaskButton projectId={project.id} className="whitespace-nowrap" />
        </div>

        {/* Hero component - shown when no tasks */}
        {!hasTasks && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-dashed border-2 border-border bg-muted/50">
              <CardHeader className="text-center py-12">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <CheckSquare className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-2">No tasks yet</CardTitle>
                <CardDescription className="text-base mb-6 max-w-md mx-auto">
                  Get started by creating your first task. Organize your work, track progress, and stay productive.
                </CardDescription>
                <CreateTaskButton projectId={project.id} size="lg" />
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Kanban board - columns by status */}
        {hasTasks && (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 pb-4">
            {/* Mobile: horizontal scroll, Desktop: grid layout */}
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4 min-w-max sm:min-w-0 w-full">
              {STATUS_ORDER.map(status => {
                const statusTasks = tasksByStatus[status]
                const taskCount = statusTasks.length

                return (
                  <div key={status} className="flex flex-col w-[280px] sm:w-auto flex-shrink-0 sm:flex-shrink">
                    {/* Column header */}
                    <div className="mb-4 flex items-center justify-between px-1">
                      <h2 className="text-sm font-semibold text-foreground">{STATUS_LABELS[status]}</h2>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {taskCount}
                      </span>
                    </div>

                    {/* Column content - scrollable task list */}
                    <div className="flex-1 space-y-3 min-h-[200px] sm:min-h-[400px]">
                      {taskCount === 0 ? (
                        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg">
                          No tasks
                        </div>
                      ) : (
                        statusTasks.map(task => (
                          <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <EditTaskModal open={editModalOpen} onOpenChange={handleCloseEditModal} task={selectedTask} />
    </>
  )
}

export { ProjectBoardClient }
