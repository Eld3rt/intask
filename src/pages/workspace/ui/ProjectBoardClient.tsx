'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui'
import { Button } from '@/shared/ui'
import { TaskCard, type Task, type TaskStatus, StatusKpiCards } from '@/entities/tasks/ui'
import { CreateTaskButton, EditTaskModal, updateTaskPosition } from '@/features/tasks'
import { CheckSquare, BarChart3 } from 'lucide-react'

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

type SortableTaskCardProps = {
  task: Task
  onEdit?: (task: Task) => void
  isDraggingActive: boolean
}

/**
 * Wraps TaskCard with drag-and-drop functionality.
 * The 8px activation constraint prevents drag on simple clicks.
 * Interactive elements (like the card's onClick for editing) won't trigger drag.
 */
function SortableTaskCard({ task, onEdit, isDraggingActive }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  // Prevent shifting during drag - disable transforms when any drag is active
  // This keeps all cards in their original positions until drop completes
  const style = {
    transform: isDraggingActive ? undefined : CSS.Transform.toString(transform),
    transition: isDraggingActive ? undefined : transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
    >
      <TaskCard task={task} onEdit={onEdit} />
    </div>
  )
}

type DroppableColumnProps = {
  status: TaskStatus
  children: React.ReactNode
}

/**
 * Makes a column droppable so tasks can be dropped on empty columns.
 */
function DroppableColumn({ status, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <div ref={setNodeRef} className={isOver ? 'ring-2 ring-primary ring-offset-2 rounded-lg' : ''}>
      {children}
    </div>
  )
}

function ProjectBoardClient({ project, tasks: initialTasks }: ProjectBoardClientProps) {
  const hasTasks = initialTasks.length > 0
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // Update local tasks when initialTasks change (e.g., after task creation/deletion)
  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

    // Sort by position within each status group
    Object.keys(grouped).forEach(status => {
      grouped[status as TaskStatus].sort((a, b) => a.position - b.position)
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

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      const task = tasks.find(t => t.id === active.id)
      if (task) {
        setActiveTask(task)
      }
    },
    [tasks]
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event

      try {
        if (!over || active.id === over.id) {
          return
        }

        // Find the task being dragged
        const activeTask = tasks.find(t => t.id === active.id)
        if (!activeTask) {
          return
        }

        // Check if dropped on a column (status) or on another task
        const isDroppedOnColumn = STATUS_ORDER.includes(over.id as TaskStatus)
        const targetStatus: TaskStatus = isDroppedOnColumn
          ? (over.id as TaskStatus)
          : (() => {
              const overTask = tasks.find(t => t.id === over.id)
              return overTask?.status || activeTask.status
            })()

        // Find the task it was dropped over (if any)
        const overTask = tasks.find(t => t.id === over.id)

        // Store current state for potential rollback
        const previousTasks = tasks

        let updates: Array<{ taskId: string; newPosition: number; status: TaskStatus }> = []

        if (activeTask.status === targetStatus) {
          // Same column: reorder within the column
          if (!overTask) {
            return
          }

          const columnTasks = tasksByStatus[activeTask.status]
          const activeIndex = columnTasks.findIndex(t => t.id === active.id)
          const overIndex = columnTasks.findIndex(t => t.id === over.id)

          if (activeIndex === -1 || overIndex === -1) {
            return
          }

          // Reorder tasks using arrayMove
          const reorderedTasks = arrayMove(columnTasks, activeIndex, overIndex)

          // Recalculate positions for all tasks in the column
          updates = reorderedTasks.map((task, index) => ({
            taskId: task.id,
            newPosition: index,
            status: task.status,
          }))

          // Optimistically update local state
          setTasks(prevTasks => {
            const otherTasks = prevTasks.filter(t => t.status !== activeTask.status)
            const updatedTasks = reorderedTasks.map((task, index) => ({
              ...task,
              position: index,
            }))
            return [...otherTasks, ...updatedTasks]
          })
        } else {
          // Cross-column move: move task to new column and recalculate positions in both columns
          const sourceColumnTasks = tasksByStatus[activeTask.status].filter(t => t.id !== active.id)
          const targetColumnTasks = tasksByStatus[targetStatus]

          // Determine insertion position in target column
          let insertIndex = targetColumnTasks.length
          if (overTask && overTask.status === targetStatus) {
            insertIndex = targetColumnTasks.findIndex(t => t.id === over.id)
            if (insertIndex === -1) {
              insertIndex = targetColumnTasks.length
            }
          }

          // Recalculate positions in source column (remove active task)
          const sourceUpdates = sourceColumnTasks.map((task, index) => ({
            taskId: task.id,
            newPosition: index,
            status: task.status,
          }))

          // Insert active task at target position and recalculate target column
          const targetColumnWithNewTask = [...targetColumnTasks]
          targetColumnWithNewTask.splice(insertIndex, 0, { ...activeTask, status: targetStatus })
          const targetUpdates = targetColumnWithNewTask.map((task, index) => ({
            taskId: task.id,
            newPosition: index,
            status: task.status,
          }))

          updates = [...sourceUpdates, ...targetUpdates]

          // Optimistically update local state
          setTasks(prevTasks => {
            const updatedSourceTasks = sourceColumnTasks.map((task, index) => ({
              ...task,
              position: index,
            }))
            const updatedTargetTasks = targetColumnWithNewTask.map((task, index) => ({
              ...task,
              position: index,
            }))
            const otherTasks = prevTasks.filter(
              t => t.status !== activeTask.status && t.status !== targetStatus && t.id !== active.id
            )
            return [...otherTasks, ...updatedSourceTasks, ...updatedTargetTasks]
          })
        }

        // Update positions in the database
        try {
          const result = await updateTaskPosition(updates)
          if (result.error) {
            // Revert optimistic update on error
            setTasks(previousTasks)
            console.error('Failed to update task positions:', result.error)
          }
        } catch (error) {
          // Revert optimistic update on error
          setTasks(previousTasks)
          console.error('Error updating task positions:', error)
        }
      } finally {
        // Always clear activeTask when drag ends
        setActiveTask(null)
      }
    },
    [tasks, tasksByStatus]
  )

  // Get all task IDs for the single SortableContext
  const allTaskIds = useMemo(() => tasks.map(t => t.id), [tasks])

  // Track if any drag is active to prevent card shifting
  const isDraggingActive = activeTask !== null

  return (
    <>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with project name and create task button */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">{project.name}</h1>
            {project.description && <p className="text-muted-foreground">{project.description}</p>}
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/workspace/${project.slug}/analytics`}>
              <Button variant="outline" className="whitespace-nowrap">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </Link>
            <CreateTaskButton projectId={project.id} className="whitespace-nowrap" />
          </div>
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Single SortableContext for all tasks across all columns */}
            <SortableContext items={allTaskIds} strategy={verticalListSortingStrategy}>
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 pb-4">
                {/* Mobile: horizontal scroll, Desktop: grid layout */}
                <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4 min-w-max sm:min-w-0 w-full">
                  {STATUS_ORDER.map(status => {
                    const statusTasks = tasksByStatus[status]
                    const taskCount = statusTasks.length

                    return (
                      <DroppableColumn key={status} status={status}>
                        <div className="flex flex-col w-[280px] sm:w-auto flex-shrink-0 sm:flex-shrink">
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
                              <>
                                {statusTasks.map(task => (
                                  <SortableTaskCard
                                    key={task.id}
                                    task={task}
                                    onEdit={handleEditTask}
                                    isDraggingActive={isDraggingActive}
                                  />
                                ))}
                              </>
                            )}
                          </div>
                        </div>
                      </DroppableColumn>
                    )
                  })}
                </div>
              </div>
            </SortableContext>

            {/* DragOverlay shows the dragged card following the cursor */}
            <DragOverlay>
              {activeTask ? (
                <div className="rotate-3 opacity-90">
                  <TaskCard task={activeTask} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <EditTaskModal open={editModalOpen} onOpenChange={handleCloseEditModal} task={selectedTask} />
    </>
  )
}

export { ProjectBoardClient }
