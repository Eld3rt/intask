'use server'

import { getOpenRouterClient } from '@/shared/lib/openrouter'
import { formatReasonsForLLM, type ImportanceReason } from './calculate-importance'

/**
 * Generates human-readable insight text explaining why a task is important.
 * This server action uses LLM only for text generation, not decision-making.
 *
 * @param reasons - Structured importance reasons from deterministic scoring
 * @returns Generated insight text or error
 */
export async function generateInsight(reasons: ImportanceReason[]): Promise<{ insight?: string; error?: string }> {
  try {
    if (!reasons || reasons.length === 0) {
      return { error: 'No reasons provided' }
    }

    // Format reasons for LLM prompt
    const formattedReasons = formatReasonsForLLM(reasons)

    // Prepare prompt (Russian, shorter text)
    const prompt = `На основе следующих причин объясни пользователю, почему эту задачу важно выполнить сейчас. Используй максимум одно предложение. Опирайся строго на указанные причины. Будь конкретным и по делу. Используй деловой, нейтральный тон. Не упоминай ИИ или автоматизацию.

Причины:
${formattedReasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}`

    const openRouter = getOpenRouterClient()

    // Use a cost-effective, fast model
    const response = await openRouter.chat.send({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'openai/gpt-3.5-turbo',
      temperature: 0.7,
      stream: true,
    })

    // Extract text from response
    let insight = ''
    for await (const chunk of response) {
      const content = chunk.choices?.[0]?.delta?.content
      if (content) {
        insight += content
      }
    }

    if (!insight.trim()) {
      return { error: 'Failed to generate insight' }
    }

    return { insight: insight.trim() }
  } catch (error) {
    console.error('Error generating insight:', error)
    return { error: 'Failed to generate insight' }
  }
}
