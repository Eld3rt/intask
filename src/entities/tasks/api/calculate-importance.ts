/**
 * Deterministic importance scoring for tasks.
 * This function calculates an importance score based on objective task data.
 * LLM is NOT used for scoring - only for text generation after scoring.
 */

type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
type TaskStatus = 'ToDo' | 'InProgress' | 'Review' | 'Done'

export type ImportanceReason = 'deadline_missed' | 'deadline_soon' | 'high_priority' | 'urgent_priority'

export type ImportanceScore = {
  score: number
  reasons: ImportanceReason[]
  threshold: number
}

type TaskData = {
  priority: TaskPriority
  deadline: Date | string | null
  status: TaskStatus
}

// Scoring weights
const WEIGHTS = {
  DEADLINE_MISSED: 10,
  DEADLINE_SOON: 5, // < 3 days
  URGENT_PRIORITY: 6,
  HIGH_PRIORITY: 3,
} as const

// Minimum score to show importance badge
const IMPORTANCE_THRESHOLD = 5

// Days before deadline to consider "soon"
const DEADLINE_SOON_DAYS = 3

/**
 * Calculates importance score and reasons for a task.
 * This is a pure function with no side effects.
 */
export function calculateImportance(task: TaskData): ImportanceScore {
  const reasons: ImportanceReason[] = []
  let score = 0

  // Parse deadline
  const deadline = task.deadline ? (typeof task.deadline === 'string' ? new Date(task.deadline) : task.deadline) : null
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  // Check deadline status
  if (deadline) {
    const deadlineDate = new Date(deadline)
    deadlineDate.setHours(0, 0, 0, 0)

    // Deadline missed (past deadline and not done)
    if (deadlineDate < now && task.status !== 'Done') {
      reasons.push('deadline_missed')
      score += WEIGHTS.DEADLINE_MISSED
    }
    // Deadline soon (within N days and not done)
    else if (task.status !== 'Done') {
      const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntilDeadline >= 0 && daysUntilDeadline < DEADLINE_SOON_DAYS) {
        reasons.push('deadline_soon')
        score += WEIGHTS.DEADLINE_SOON
      }
    }
  }

  // Check priority
  if (task.priority === 'Urgent') {
    reasons.push('urgent_priority')
    score += WEIGHTS.URGENT_PRIORITY
  } else if (task.priority === 'High') {
    reasons.push('high_priority')
    score += WEIGHTS.HIGH_PRIORITY
  }

  return {
    score,
    reasons,
    threshold: IMPORTANCE_THRESHOLD,
  }
}

/**
 * Formats importance reasons into human-readable strings for LLM prompt (Russian).
 */
export function formatReasonsForLLM(reasons: ImportanceReason[]): string[] {
  const reasonMap: Record<ImportanceReason, string> = {
    deadline_missed: 'Срок выполнения истёк',
    deadline_soon: 'Срок выполнения приближается (менее 3 дней)',
    high_priority: 'Задача с высоким приоритетом',
    urgent_priority: 'Срочная задача',
  }

  return reasons.map(reason => reasonMap[reason])
}
